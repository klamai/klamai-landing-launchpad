import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useAdminLawyerApplications, useSuperAdminAccess, useEspecialidades, useApproveLawyerAutomated, useRejectLawyerApplication } from '@/hooks/queries/useAdminLawyerApplications';
import {
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Loader2,
  Shield,
  Ban,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Tipo que coincide exactamente con lo que devuelve Supabase
interface SolicitudAbogadoFromDB {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  colegio_profesional?: string;
  numero_colegiado?: string;
  especialidades?: number[];
  experiencia_anos?: number;
  cv_url?: string;
  carta_motivacion?: string;
  documentos_verificacion?: any;
  estado: string; // Supabase devuelve string genérico
  motivo_rechazo?: string;
  revisado_por?: string;
  fecha_revision?: string;
  notas_admin?: string;
  acepta_politicas: boolean;
  acepta_comunicacion: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo para el resultado de la función automatizada
interface AutomatedApprovalResult {
  success: boolean;
  solicitud_id: string;
  email: string;
  nombre: string;
  apellido: string;
  activation_token: string;
  temp_password: string;
}

// Componente de acceso no autorizado
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-xl text-red-600">Acceso No Autorizado</CardTitle>
        <CardDescription>
          No tienes permisos para acceder a esta sección. Solo los super administradores pueden gestionar solicitudes de abogados.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AdminLawyerApplicationsManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<SolicitudAbogadoFromDB | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    especialidad: '',
    experienciaMin: 0,
    experienciaMax: 50,
    fechaRegistroDesde: '',
    fechaRegistroHasta: '',
    colegioProfesional: '',
    estado: ''
  });
  const { toast } = useToast();

  // Hooks optimizados con React Query
  const { data: hasSuperAdminAccess, isLoading: accessLoading } = useSuperAdminAccess();
  const { data: applications, isLoading: loading, error: applicationsError, refetch: refetchApplications } = useAdminLawyerApplications();
  const { data: especialidades } = useEspecialidades();
  const approveMutation = useApproveLawyerAutomated();
  const rejectMutation = useRejectLawyerApplication();

  // Función para actualizar filtros
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      especialidad: '',
      experienciaMin: 0,
      experienciaMax: 50,
      fechaRegistroDesde: '',
      fechaRegistroHasta: '',
      colegioProfesional: '',
      estado: ''
    });
    setSearchTerm('');
  };

  // Filtrar solicitudes por búsqueda y filtros avanzados
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter(app => {
      // Búsqueda por texto
      const searchMatch = !searchTerm ||
        app.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.colegio_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.numero_colegiado?.includes(searchTerm);

      // Filtros avanzados
      const especialidadMatch = !filters.especialidad ||
        (app.especialidades && app.especialidades.includes(parseInt(filters.especialidad)));

      const experienciaMatch = (!app.experiencia_anos && filters.experienciaMin === 0) ||
        (app.experiencia_anos && app.experiencia_anos >= filters.experienciaMin &&
         app.experiencia_anos <= filters.experienciaMax);

      const fechaMatch = (!filters.fechaRegistroDesde || new Date(app.created_at) >= new Date(filters.fechaRegistroDesde)) &&
                        (!filters.fechaRegistroHasta || new Date(app.created_at) <= new Date(filters.fechaRegistroHasta));

      const colegioMatch = !filters.colegioProfesional ||
        app.colegio_profesional?.toLowerCase().includes(filters.colegioProfesional.toLowerCase());

      const estadoMatch = !filters.estado ||
        app.estado === filters.estado;

      return searchMatch && especialidadMatch && experienciaMatch && fechaMatch &&
             colegioMatch && estadoMatch;
    });
  }, [searchTerm, filters, applications]);

  // Loading state
  if (accessLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando solicitudes de abogados...</p>
        </div>
      </div>
    );
  }

  // Unauthorized access
  if (!hasSuperAdminAccess) {
    return <UnauthorizedAccess />;
  }

  // Error state
  if (applicationsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Error al Cargar</CardTitle>
            <CardDescription>
              {applicationsError.message || 'Error inesperado al cargar las solicitudes'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => refetchApplications()} className="mr-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApproveAutomated = async (applicationId: string) => {
    try {
      const result = await approveMutation.mutateAsync(applicationId);
      
      if (result.success) {
        toast({
          title: "¡Solicitud Aprobada!",
          description: `Se ha creado la cuenta para ${result.nombre} ${result.apellido}. Se enviará un email con las credenciales temporales.`,
          duration: 8000,
        });
      } else {
        toast({
          title: "Error en la Aprobación",
          description: "No se pudo procesar la aprobación automática",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado durante la aprobación",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo Requerido",
        description: "Debes proporcionar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await rejectMutation.mutateAsync({
        applicationId,
        rejectionReason,
        adminNotes: adminNotes || undefined
      });

      if (result.success) {
        toast({
          title: "Solicitud Rechazada",
          description: "La solicitud ha sido rechazada exitosamente",
        });

        // Limpiar formularios
        setRejectionReason("");
        setAdminNotes("");
        setSelectedApp(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al rechazar la solicitud",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado durante el rechazo",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'en_revision':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Eye className="w-3 h-3 mr-1" />En Revisión</Badge>;
      case 'aprobada':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Solicitudes de Abogados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Revisa y gestiona las solicitudes de nuevos abogados
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, apellido, email, colegio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros Avanzados
                  </div>
                  {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Especialidad */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Especialidad</label>
                    <Select value={filters.especialidad} onValueChange={(value) => updateFilter('especialidad', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las especialidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas las especialidades</SelectItem>
                        <SelectItem value="1">Derecho Civil</SelectItem>
                        <SelectItem value="2">Derecho Penal</SelectItem>
                        <SelectItem value="3">Derecho Laboral</SelectItem>
                        <SelectItem value="4">Derecho Mercantil</SelectItem>
                        <SelectItem value="5">Derecho Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experiencia */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Años de Experiencia: {filters.experienciaMin} - {filters.experienciaMax}</label>
                    <Slider
                      value={[filters.experienciaMin, filters.experienciaMax]}
                      onValueChange={([min, max]) => {
                        updateFilter('experienciaMin', min);
                        updateFilter('experienciaMax', max);
                      }}
                      max={50}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Fecha Registro Desde */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha Registro Desde</label>
                    <input
                      type="date"
                      value={filters.fechaRegistroDesde}
                      onChange={(e) => updateFilter('fechaRegistroDesde', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Fecha Registro Hasta */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha Registro Hasta</label>
                    <input
                      type="date"
                      value={filters.fechaRegistroHasta}
                      onChange={(e) => updateFilter('fechaRegistroHasta', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Colegio Profesional */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Colegio Profesional</label>
                    <input
                      type="text"
                      placeholder="Buscar colegio..."
                      value={filters.colegioProfesional}
                      onChange={(e) => updateFilter('colegioProfesional', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select value={filters.estado} onValueChange={(value) => updateFilter('estado', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los estados</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_revision">En Revisión</SelectItem>
                        <SelectItem value="aprobada">Aprobada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botón Limpiar Filtros */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {(searchTerm || Object.values(filters).some(v => v !== '' && v !== 0 && v !== 50)) && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Mostrando {filteredApplications.length} de {applications?.length || 0} solicitudes
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {app.nombre} {app.apellido}
                      </h3>
                      {getStatusBadge(app.estado)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      {app.email}
                    </div>
                    {app.telefono && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        {app.telefono}
                      </div>
                    )}
                    {app.colegio_profesional && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <GraduationCap className="w-4 h-4" />
                        {app.colegio_profesional}
                      </div>
                    )}
                    {app.experiencia_anos && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {app.experiencia_anos} años de experiencia
                      </div>
                    )}
                  </div>

                  {app.especialidades && app.especialidades.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Especialidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {app.especialidades.map((espId) => (
                          <Badge key={espId} variant="secondary" className="text-xs">
                            {especialidades?.[espId] || `ID: ${espId}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.carta_motivacion && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Carta de Motivación:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {app.carta_motivacion}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Solicitud enviada el {new Date(app.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalles de la Solicitud</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Información Personal</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Nombre:</strong> {app.nombre} {app.apellido}</div>
                            <div><strong>Email:</strong> {app.email}</div>
                            {app.telefono && <div><strong>Teléfono:</strong> {app.telefono}</div>}
                            {app.colegio_profesional && <div><strong>Colegio:</strong> {app.colegio_profesional}</div>}
                            {app.numero_colegiado && <div><strong>Nº Colegiado:</strong> {app.numero_colegiado}</div>}
                            {app.experiencia_anos && <div><strong>Experiencia:</strong> {app.experiencia_anos} años</div>}
                          </div>
                        </div>

                        {app.especialidades && app.especialidades.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Especialidades</h3>
                            <div className="flex flex-wrap gap-1">
                              {app.especialidades.map((espId) => (
                                <Badge key={espId} variant="secondary">
                                  {especialidades?.[espId] || `ID: ${espId}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.carta_motivacion && (
                          <div>
                            <h3 className="font-semibold mb-2">Carta de Motivación</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {app.carta_motivacion}
                            </p>
                          </div>
                        )}

                        {app.cv_url && (
                          <div>
                            <h3 className="font-semibold mb-2">CV</h3>
                            <Button variant="outline" size="sm" asChild>
                              <a href={app.cv_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="w-4 h-4 mr-2" />
                                Ver CV
                              </a>
                            </Button>
                          </div>
                        )}

                        {app.estado === 'rechazada' && app.motivo_rechazo && (
                          <div>
                            <h3 className="font-semibold mb-2 text-red-600">Motivo de Rechazo</h3>
                            <p className="text-sm text-red-600">{app.motivo_rechazo}</p>
                          </div>
                        )}

                        {app.notas_admin && (
                          <div>
                            <h3 className="font-semibold mb-2">Notas Administrativas</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{app.notas_admin}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {app.estado === 'pendiente' && (
                    <>
                      <Button
                        onClick={() => handleApproveAutomated(app.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Aprobar
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rechazar Solicitud</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Motivo de Rechazo *</label>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explica el motivo del rechazo..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Notas Administrativas (opcional)</label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Notas internas para el equipo..."
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReject(app.id)}
                                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                              >
                                {rejectMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Confirmar Rechazo"
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {applications?.length === 0 ? "No hay solicitudes" : "No hay solicitudes que coincidan con los filtros"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {applications?.length === 0
                ? "No hay solicitudes de abogados pendientes."
                : searchTerm || Object.values(filters).some(v => v !== '' && v !== 0 && v !== 50)
                  ? "No se encontraron solicitudes que coincidan con tu búsqueda y filtros aplicados."
                  : "No hay solicitudes que cumplan con los criterios de filtrado."
              }
            </p>
            {(searchTerm || Object.values(filters).some(v => v !== '' && v !== 0 && v !== 50)) && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                <X className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLawyerApplicationsManagement; 