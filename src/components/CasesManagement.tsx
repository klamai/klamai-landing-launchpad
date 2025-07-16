import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Grid3X3,
  List,
  MapPin,
  Building,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CaseCard from './CaseCard';
import CaseDetailModal from './CaseDetailModal';

const CasesManagement = () => {
  const { casos, abogados, loadingCasos, assignCaseToLawyer } = useSuperAdminStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [profileTypeFilter, setProfileTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any>(null);
  const { toast } = useToast();

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { label: 'Disponible', variant: 'default' as const, icon: AlertCircle },
      'agotado': { label: 'Agotado', variant: 'destructive' as const, icon: Clock },
      'cerrado': { label: 'Cerrado', variant: 'secondary' as const, icon: CheckCircle },
      'esperando_pago': { label: 'Esperando Pago', variant: 'outline' as const, icon: Clock }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get unique filter options
  const specialties = Array.from(new Set(casos.map(c => c.especialidades?.nombre).filter(Boolean)));
  const cities = Array.from(new Set(casos.map(c => c.ciudad_borrador || c.profiles?.ciudad).filter(Boolean)));
  const leadTypes = Array.from(new Set(casos.map(c => c.tipo_lead).filter(Boolean)));
  const profileTypes = Array.from(new Set(casos.map(c => c.tipo_perfil_borrador || c.profiles?.tipo_perfil).filter(Boolean)));

  const filteredCasos = casos.filter(caso => {
    const clientData = {
      nombre: caso.profiles?.nombre || caso.nombre_borrador || '',
      apellido: caso.profiles?.apellido || caso.apellido_borrador || '',
      email: caso.profiles?.email || caso.email_borrador || '',
      ciudad: caso.profiles?.ciudad || caso.ciudad_borrador || '',
      tipo_perfil: caso.profiles?.tipo_perfil || caso.tipo_perfil_borrador || 'individual',
      razon_social: caso.profiles?.razon_social || caso.razon_social_borrador || ''
    };

    const matchesSearch = caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.resumen_caso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.valor_estimado?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caso.estado === statusFilter;
    const matchesSpecialty = specialtyFilter === 'all' || caso.especialidades?.nombre === specialtyFilter;
    const matchesType = typeFilter === 'all' || caso.tipo_lead === typeFilter;
    const matchesCity = cityFilter === 'all' || clientData.ciudad === cityFilter;
    const matchesProfileType = profileTypeFilter === 'all' || clientData.tipo_perfil === profileTypeFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialty && matchesType && matchesCity && matchesProfileType;
  });

  // Filter out closed cases for main view
  const activeCasos = filteredCasos.filter(caso => caso.estado !== 'cerrado');

  const handleAssignCase = async () => {
    if (!selectedCaseId || !selectedLawyerId) {
      toast({
        title: "Error",
        description: "Selecciona un caso y un abogado",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    
    try {
      const result = await assignCaseToLawyer(selectedCaseId, selectedLawyerId, assignmentNotes);
      
      if (result.success) {
        toast({
          title: "Caso asignado",
          description: "El caso ha sido asignado exitosamente al abogado",
        });
        setSelectedCaseId(null);
        setSelectedLawyerId('');
        setAssignmentNotes('');
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al asignar el caso",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado al asignar el caso",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleViewDetails = (casoId: string) => {
    const caso = casos.find(c => c.id === casoId);
    setSelectedCaseDetail(caso);
    setDetailModalOpen(true);
  };

  const handleGenerateResolution = async (casoId: string) => {
    // TODO: Implement webhook call for auto-resolution
    toast({
      title: "Función en desarrollo",
      description: "La generación automática de resolución estará disponible pronto",
    });
  };

  const handleUploadDocument = (casoId: string) => {
    // TODO: Open document upload modal
    toast({
      title: "Función en desarrollo", 
      description: "La subida de documentos estará disponible pronto",
    });
  };

  const handleSendMessage = (casoId: string) => {
    // TODO: Open messaging modal
    toast({
      title: "Función en desarrollo",
      description: "El sistema de mensajería estará disponible pronto", 
    });
  };

  if (loadingCasos) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar Casos
          </CardTitle>
          <CardDescription>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por motivo, cliente, email o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Advanced filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Estado (Disponible, Cerrado)</SelectItem>
                  <SelectItem value="disponible">Disponible ({filteredCasos.filter(c => c.estado === 'disponible').length})</SelectItem>
                  <SelectItem value="agotado">Agotado ({filteredCasos.filter(c => c.estado === 'agotado').length})</SelectItem>
                  <SelectItem value="esperando_pago">Esperando Pago ({filteredCasos.filter(c => c.estado === 'esperando_pago').length})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Especialidades</SelectItem>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty} ({casos.filter(c => c.especialidades?.nombre === specialty).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo Lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tipo (Estandard, Premium, Urgente)</SelectItem>
                  {leadTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type} ({casos.filter(c => c.tipo_lead === type).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ciudades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      <MapPin className="h-3 w-3 mr-1" />
                      {city} ({casos.filter(c => c.ciudad_borrador === city || c.profiles?.ciudad === city).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Perfil (Individual, Empresa)</SelectItem>
                  <SelectItem value="individual">
                    <UserIcon className="h-3 w-3 mr-1" />
                    Individual ({casos.filter(c => (c.tipo_perfil_borrador || c.profiles?.tipo_perfil) === 'individual').length})
                  </SelectItem>
                  <SelectItem value="empresa">
                    <Building className="h-3 w-3 mr-1" />
                    Empresa ({casos.filter(c => (c.tipo_perfil_borrador || c.profiles?.tipo_perfil) === 'empresa').length})
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex-1 rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1 rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            
          </div>
        </CardContent>
      </Card>

      {/* Cases display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between ">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Casos Activos
              </CardTitle>
              <CardDescription>
                {activeCasos.length} casos activos encontrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeCasos.map((caso) => (
                <CaseCard
                  key={caso.id}
                  caso={caso}
                  onViewDetails={handleViewDetails}
                  onAssignLawyer={(casoId) => {
                    setSelectedCaseId(casoId);
                    // Open assignment dialog
                  }}
                  onGenerateResolution={handleGenerateResolution}
                  onUploadDocument={handleUploadDocument}
                  onSendMessage={handleSendMessage}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asignado a</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCasos.map((caso) => (
                    <motion.tr
                      key={caso.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {caso.profiles?.nombre} {caso.profiles?.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {caso.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {caso.motivo_consulta}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {caso.tipo_lead}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {caso.especialidades?.nombre || 'Sin especialidad'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(caso.estado)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(caso.created_at), 'dd/MM/yy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
                          <div className="text-sm">
                            {caso.asignaciones_casos.map((asignacion, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {asignacion.profiles?.nombre} {asignacion.profiles?.apellido}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(caso.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedCaseId(caso.id)}
                                disabled={caso.estado === 'cerrado'}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Asignar Caso a Abogado</DialogTitle>
                                <DialogDescription>
                                  Selecciona un abogado para asignar este caso
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Seleccionar Abogado</label>
                                  <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona un abogado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {abogados.map((abogado) => (
                                        <SelectItem key={abogado.id} value={abogado.id}>
                                          {abogado.nombre} {abogado.apellido} 
                                          <span className="text-gray-500 ml-2">
                                            ({abogado.casos_activos} casos activos)
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Notas de Asignación</label>
                                  <Textarea
                                    placeholder="Notas adicionales para el abogado..."
                                    value={assignmentNotes}
                                    onChange={(e) => setAssignmentNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancelar</Button>
                                  <Button 
                                    onClick={handleAssignCase}
                                    disabled={isAssigning}
                                  >
                                    {isAssigning ? 'Asignando...' : 'Asignar Caso'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeCasos.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay casos activos
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filteredCasos.length === 0 
                  ? "No se encontraron casos con los filtros aplicados"
                  : "Todos los casos están cerrados"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Detail Modal */}
      <CaseDetailModal
        caso={selectedCaseDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCaseDetail(null);
        }}
        onAssignLawyer={(casoId) => {
          setSelectedCaseId(casoId);
          setDetailModalOpen(false);
        }}
        onGenerateResolution={handleGenerateResolution}
        onUploadDocument={handleUploadDocument}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default CasesManagement;