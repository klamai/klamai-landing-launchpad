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
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any | null>(null);
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
      {/* Filtros compactos */}
      <Card className="border shadow-sm bg-gray-50 dark:bg-black">
        <CardContent className="p-4">
          {/* Header minimalista */}
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Filtros</span>
          </div>
          
          {/* Búsqueda compacta */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar casos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          
          {/* Filtros en una sola fila compacta */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
                <SelectItem value="esperando_pago">Esperando Pago</SelectItem>
              </SelectContent>
            </Select>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ramas</SelectItem>
                {specialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {leadTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>

            {/* Botones de vista compactos */}
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-2 text-xs flex-1"
              >
                <Grid3X3 className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-2 text-xs flex-1"
              >
                <List className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases display - MEJORADO */}
      <Card className="border-2 shadow-md bg-gray-100 dark:bg-black">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
                <AlertCircle className="h-6 w-6 text-red-500" />
                Casos Activos
              </CardTitle>
              <CardDescription className="text-base text-gray-700 dark:text-gray-300 mt-1">
                {activeCasos.length} casos activos encontrados para gestionar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
                  <TableRow className="border-b-2">
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Cliente</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Motivo</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Tipo</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Especialidad</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Estado</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Fecha</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Asignado a</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCasos.map((caso) => (
                    <motion.tr
                      key={caso.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b h-20"
                    >
                      <TableCell className="py-4">
                        <div>
                          <div className="font-semibold text-base text-gray-900 dark:text-white">
                            {caso.profiles?.nombre} {caso.profiles?.apellido}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {caso.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                            {caso.motivo_consulta}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {caso.tipo_lead}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="text-sm px-3 py-1 font-medium">
                          {caso.especialidades?.nombre || 'Sin especialidad'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(caso.estado)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {format(new Date(caso.created_at), 'dd/MM/yy', { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
                          <div className="text-sm">
                            {caso.asignaciones_casos.map((asignacion, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-800 dark:text-green-200">
                                  {asignacion.profiles?.nombre} {asignacion.profiles?.apellido}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Sin asignar</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(caso.id)}
                            className="h-9 px-3 text-sm font-medium border-2 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCaseId(caso.id)}
                                disabled={caso.estado === 'cerrado'}
                                className="h-9 px-3 text-sm font-medium border-2 hover:bg-green-50"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Asignar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-bold">Asignar Caso a Abogado</DialogTitle>
                                <DialogDescription className="text-base">
                                  Selecciona un abogado para asignar este caso
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Seleccionar Abogado</label>
                                  <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                                    <SelectTrigger className="h-11 text-base border-2">
                                      <SelectValue placeholder="Selecciona un abogado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {abogados.map((abogado) => (
                                        <SelectItem key={abogado.id} value={abogado.id} className="text-base py-3">
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
                                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notas de Asignación</label>
                                  <Textarea
                                    placeholder="Notas adicionales para el abogado..."
                                    value={assignmentNotes}
                                    onChange={(e) => setAssignmentNotes(e.target.value)}
                                    className="text-base border-2"
                                  />
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" className="h-10 px-4 text-base border-2">Cancelar</Button>
                                  <Button
                                    onClick={handleAssignCase}
                                    disabled={isAssigning}
                                    className="h-10 px-4 text-base"
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
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300">
              <AlertCircle className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                No hay casos activos
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {filteredCasos.length === 0
                  ? "No se encontraron casos con los filtros aplicados. Intenta ajustar los criterios de búsqueda."
                  : "Todos los casos están cerrados. Los casos cerrados no se muestran en esta vista."
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