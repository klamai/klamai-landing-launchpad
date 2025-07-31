import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/integrations/supabase/client";
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
  Shield
} from "lucide-react";
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
        <p className="text-gray-600 dark:text-gray-400">
          No tienes permisos para acceder a esta sección. Solo los super administradores pueden gestionar solicitudes de abogados.
        </p>
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const [applications, setApplications] = useState<SolicitudAbogadoFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<SolicitudAbogadoFromDB | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const [especialidades, setEspecialidades] = useState<{[key: number]: string}>({});

  // Validación de roles
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('Validando acceso a AdminLawyerApplicationsManagement:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setUserRole('unauthorized');
          setRoleLoading(false);
          return;
        }

        console.log('Perfil obtenido para validación:', profile);

        if (profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
          console.log('Acceso denegado: usuario no es super admin');
          setUserRole('unauthorized');
          setRoleLoading(false);
          return;
        }

        setUserRole(profile.role);
        setLawyerType(profile.tipo_abogado);
        console.log('Acceso autorizado para AdminLawyerApplicationsManagement');
      } catch (error) {
        console.error('Error en validación:', error);
        setUserRole('unauthorized');
      } finally {
        setRoleLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  useEffect(() => {
    if (userRole === 'abogado' && lawyerType === 'super_admin') {
      fetchApplications();
      fetchEspecialidades();
    }
  }, [userRole, lawyerType]);

  const fetchEspecialidades = async () => {
    const { data } = await supabase
      .from('especialidades')
      .select('*');
    
    if (data) {
      const espMap = data.reduce((acc, esp) => {
        acc[esp.id] = esp.nombre;
        return acc;
      }, {} as {[key: number]: string});
      setEspecialidades(espMap);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_abogado')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las solicitudes",
          variant: "destructive",
        });
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAutomated = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      const { data, error } = await supabase.functions.invoke('approve-lawyer-automated', {
        body: { solicitud_id: applicationId }
      });

      if (error) {
        console.error('Error approving application:', error);
        toast({
          title: "Error",
          description: "No se pudo aprobar la solicitud automáticamente",
          variant: "destructive",
        });
        return;
      }

      const result = data as AutomatedApprovalResult;
      
      if (result.success) {
        toast({
          title: "¡Solicitud Aprobada!",
          description: `Se ha creado la cuenta para ${result.nombre} ${result.apellido}. Se enviará un email con las credenciales temporales.`,
          duration: 8000,
        });
        
        // Actualizar la lista
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, estado: 'aprobada', fecha_revision: new Date().toISOString() }
              : app
          )
        );
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(applicationId);
    try {
      const { error } = await supabase
        .from('solicitudes_abogado')
        .update({
          estado: 'rechazada',
          motivo_rechazo: rejectionReason,
          revisado_por: user?.id,
          fecha_revision: new Date().toISOString(),
          notas_admin: adminNotes || null
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error rejecting application:', error);
        toast({
          title: "Error",
          description: "No se pudo rechazar la solicitud",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Solicitud Rechazada",
        description: "La solicitud ha sido rechazada exitosamente",
      });

      // Actualizar la lista
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { 
                ...app, 
                estado: 'rechazada', 
                motivo_rechazo: rejectionReason,
                revisado_por: user?.id,
                fecha_revision: new Date().toISOString(),
                notas_admin: adminNotes || null
              }
            : app
        )
      );

      // Limpiar formularios
      setRejectionReason("");
      setAdminNotes("");
      setSelectedApp(null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado durante el rechazo",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
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

  const filteredApplications = applications.filter(app =>
    app.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Unauthorized access
  if (userRole !== 'abogado' || lawyerType !== 'super_admin') {
    return <UnauthorizedAccess />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nombre, email o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
                            {especialidades[espId] || `ID: ${espId}`}
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
                                  {especialidades[espId] || `ID: ${espId}`}
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
                        disabled={actionLoading === app.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {actionLoading === app.id ? (
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
                            disabled={actionLoading === app.id}
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
                                disabled={!rejectionReason.trim() || actionLoading === app.id}
                                variant="destructive"
                                className="flex-1"
                              >
                                {actionLoading === app.id ? (
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
              No hay solicitudes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? "No se encontraron solicitudes que coincidan con tu búsqueda." : "No hay solicitudes de abogados pendientes."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLawyerApplicationsManagement; 