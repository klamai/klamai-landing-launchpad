import React, { useState, useEffect } from 'react';
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
  Grid3X3,
  List,
  Plus,
  FileText,
  ShieldCheck,
  ChevronDown,
  Bot,
} from 'lucide-react';
import { useAdminCases, useSuperAdminAccess } from '@/hooks/queries/useAdminCases';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CaseCard from '@/components/shared/CaseCard';
import CaseDetailModal from '@/components/admin/CaseDetailModal';
import CaseAssignmentModal from '@/components/admin/CaseAssignmentModal';
import AddManualCaseModal from '@/components/admin/AddManualCaseModal';
import AddAICaseModal from '@/components/admin/AddAICaseModal';
import { supabase } from '@/integrations/supabase/client';

// Componente de acceso no autorizado
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Acceso No Autorizado
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          Solo los super administradores pueden gestionar todos los casos.
        </p>
        <button
          onClick={() => window.location.href = '/abogados/dashboard'}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  </div>
);

const AdminCasesManagement = () => {
  // Usar hooks optimizados de React Query
  const { data: casos = [], isLoading, error, refetch } = useAdminCases();
  const { data: hasAccess = false, isLoading: accessLoading } = useSuperAdminAccess();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [profileTypeFilter, setProfileTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<any | null>(null);
  const [addManualCaseOpen, setAddManualCaseOpen] = useState(false);
  const [addAICaseOpen, setAddAICaseOpen] = useState(false);
  const { toast } = useToast();
  const [processingCases, setProcessingCases] = useState<Set<string>>(new Set());
  const [especialidades, setEspecialidades] = useState<Array<{ id: number; nombre: string }>>([]);

  // Cargar especialidades al montar el componente
  useEffect(() => {
    const loadEspecialidades = async () => {
      try {
        const { data, error } = await supabase
          .from('especialidades')
          .select('id, nombre')
          .order('nombre');

        if (error) {
          console.error('Error loading specialties:', error);
        } else {
          setEspecialidades(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    loadEspecialidades();
  }, []);

  // Sistema de notificaciones en tiempo real SEGURO
  useEffect(() => {
    if (!user || !hasAccess) return;

    const channel = supabase
      .channel(`casos_changes_${user.id}`) // Canal único por usuario
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'casos',
          filter: 'estado=eq.disponible'
        },
        (payload) => {
          console.log('Cambio detectado en caso:', payload);
          
          // Verificar si el caso estaba en borrador antes Y si está en nuestra lista de procesamiento
          if (payload.old?.estado === 'borrador' && 
              payload.new?.estado === 'disponible' &&
              processingCases.has(payload.new.id)) {
            
            console.log('Caso procesado por este usuario:', payload.new);
            
            toast({
              title: "¡Caso procesado!",
              description: `El caso "${payload.new.motivo_consulta}" ha sido procesado completamente con IA y está listo para asignar.`,
              duration: 8000,
            });
            
            // Remover de la lista de procesamiento
            setProcessingCases(prev => {
              const newSet = new Set(prev);
              newSet.delete(payload.new.id);
              return newSet;
            });
            
            // Actualizar la lista de casos
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, hasAccess, processingCases, toast, refetch]);

  // Función para agregar caso a la lista de procesamiento
  const addToProcessing = (casoId: string) => {
    console.log('Agregando caso a procesamiento:', casoId);
    setProcessingCases(prev => new Set(prev).add(casoId));
  };

  // Función para remover caso de la lista de procesamiento
  const removeFromProcessing = (casoId: string) => {
    console.log('Removiendo caso de procesamiento:', casoId);
    setProcessingCases(prev => {
      const newSet = new Set(prev);
      newSet.delete(casoId);
      return newSet;
    });
  };

  // Polling de respaldo SEGURO (solo verifica casos en nuestra lista)
  useEffect(() => {
    if (processingCases.size === 0 || !hasAccess) return;

    const interval = setInterval(async () => {
      console.log('Verificando casos en procesamiento:', Array.from(processingCases));
      
      const { data: casosActualizados } = await supabase
        .from('casos')
        .select('id, estado, motivo_consulta')
        .in('id', Array.from(processingCases))
        .eq('estado', 'disponible');

      if (casosActualizados && casosActualizados.length > 0) {
        console.log('Casos actualizados encontrados:', casosActualizados);
        
        casosActualizados.forEach(caso => {
          toast({
            title: "¡Caso procesado!",
            description: `El caso "${caso.motivo_consulta}" ha sido procesado completamente con IA y está listo para asignar.`,
            duration: 8000,
          });
          removeFromProcessing(caso.id);
        });
        
        refetch();
      }
    }, 15000); // Verificar cada 15 segundos como respaldo

    return () => clearInterval(interval);
  }, [processingCases, hasAccess, toast, refetch]);

  // Loading state
  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <UnauthorizedAccess />;
  }

  if (isLoading) {
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

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar casos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Bloquear acceso no autorizado
  if (!hasAccess) {
    console.log('🚫 Acceso denegado a AdminCasesManagement:', { 
      userRole: user?.role, 
      accessLoading,
      user: user?.id 
    });
    return <UnauthorizedAccess />;
  }

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      disponible: { label: 'Disponible', className: 'bg-green-100 text-green-800 border-green-200' },
      asignado: { label: 'Asignado', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      agotado: { label: 'Agotado', className: 'bg-red-100 text-red-800 border-red-200' },
      cerrado: { label: 'Cerrado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      listo_para_propuesta: { label: 'Listo para Propuesta', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      esperando_pago: { label: 'Esperando Pago', className: 'bg-orange-100 text-orange-800 border-orange-200' }
    };

    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const estadosVisibles = [
    'disponible', 'asignado', 'agotado', 'cerrado', 'listo_para_propuesta', 'esperando_pago'
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'disponible', label: 'Disponible' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'agotado', label: 'Agotado' },
    { value: 'cerrado', label: 'Cerrado' },
    { value: 'listo_para_propuesta', label: 'Listo para Propuesta' },
    { value: 'esperando_pago', label: 'Esperando Pago' }
  ];

  const getPaymentBadge = (estado: string) => {
    if (estado === 'esperando_pago') {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Pendiente</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Pagado</Badge>;
  };

  // Extraer datos únicos para filtros
  const specialties = Array.from(new Set(casos.map(c => c.especialidades?.nombre).filter(Boolean)));
  const cities = Array.from(new Set(casos.map(c => c.ciudad_borrador || c.profiles?.ciudad).filter(Boolean)));
  const leadTypes = Array.from(new Set(casos.map(c => c.tipo_lead).filter(Boolean)));
  const profileTypes = Array.from(new Set(casos.map(c => c.tipo_perfil_borrador || c.profiles?.tipo_perfil).filter(Boolean)));

  // Filtrar casos
  const filteredCasos = casos.filter(caso => {
    const clientData = {
      nombre: caso.profiles?.nombre || caso.nombre_borrador || '',
      apellido: caso.profiles?.apellido || caso.apellido_borrador || '',
      email: caso.profiles?.email || caso.email_borrador || '',
      ciudad: caso.profiles?.ciudad || caso.ciudad_borrador || '',
      tipo_perfil: caso.profiles?.tipo_perfil || caso.tipo_perfil_borrador || ''
    };

    const matchesSearch = caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientData.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || caso.estado === statusFilter;
    const matchesSpecialty = specialtyFilter === 'all' || caso.especialidades?.nombre === specialtyFilter;
    const matchesType = typeFilter === 'all' || caso.tipo_lead === typeFilter;
    const matchesCity = cityFilter === 'all' || clientData.ciudad === cityFilter;
    const matchesProfileType = profileTypeFilter === 'all' || clientData.tipo_perfil === profileTypeFilter;

    return matchesSearch && matchesStatus && matchesSpecialty && matchesType && matchesCity && matchesProfileType;
  });

  // Determinar qué casos mostrar y el título apropiado
  const getDisplayData = () => {
    // Si hay búsqueda o filtros específicos aplicados, mostrar todos los casos filtrados
    const hasSearchOrFilters = searchTerm !== '' || 
                              statusFilter !== 'all' || 
                              specialtyFilter !== 'all' || 
                              typeFilter !== 'all' || 
                              cityFilter !== 'all' || 
                              profileTypeFilter !== 'all';

    if (hasSearchOrFilters) {
      return {
        casos: filteredCasos,
        title: 'Casos Filtrados',
        description: `${filteredCasos.length} casos encontrados con los filtros aplicados`,
        icon: <Filter className="h-6 w-6 text-blue-500" />
      };
    }

    // Si NO hay búsqueda ni filtros específicos (todo en 'all'), mostrar solo casos activos (no cerrados)
    const activeCases = filteredCasos.filter(caso => caso.estado !== 'cerrado');
    return {
      casos: activeCases,
      title: 'Casos Activos',
      description: `${activeCases.length} casos activos encontrados para gestionar`,
      icon: <AlertCircle className="h-6 w-6 text-red-500" />
    };
  };

  const { casos: activeCasos, title: sectionTitle, description: sectionDescription, icon: sectionIcon } = getDisplayData();

  const handleViewDetails = (casoId: string) => {
    const caso = casos.find(c => c.id === casoId);
    if (caso) {
      setSelectedCaseDetail(caso);
      setDetailModalOpen(true);
    }
  };

  const handleAssignLawyer = (casoId: string) => {
    const caso = casos.find(c => c.id === casoId);
    if (caso) {
      setSelectedCaseForAssignment(caso);
      setAssignmentModalOpen(true);
    }
  };

  const handleGenerateResolution = async (casoId: string) => {
    // Lógica existente para generar resolución
    console.log('Generando resolución para caso:', casoId);
  };

  const handleGenerateResolutionWithAgent = async (casoId: string, agent: string) => {
    console.log(`Generando resolución con agente ${agent} para caso:`, casoId);
    
    // Aquí puedes implementar la lógica específica para cada agente
    const agentConfig = {
      resolucion: { name: 'Generar Resolución', type: 'basic' },
      estrategia: { name: 'Estrategia Legal', type: 'premium' },
      documentos: { name: 'Generar Documentos', type: 'pro' },
      analisis: { name: 'Análisis Completo', type: 'expert' }
    };

    const config = agentConfig[agent as keyof typeof agentConfig];
    
    toast({
      title: `${config.name} iniciado`,
      description: `El agente de IA está procesando el caso con ${config.type}...`,
      duration: 3000,
    });
  };

  const handleUploadDocument = (casoId: string) => {
    // Implementar subida de documentos
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La subida de documentos estará disponible pronto",
    });
  };

  const handleSendMessage = (casoId: string) => {
    // Implementar envío de mensajes
    toast({
      title: "Funcionalidad en desarrollo",
      description: "El sistema de mensajes estará disponible pronto",
    });
  };

  const handleManualCaseSuccess = () => {
    refetch();
    // Removed duplicate toast - already shown in modal
  };

  const handleCaseCreated = (casoId: string) => {
    addToProcessing(casoId);
  };

  return (
    <div className="space-y-6">
      {/* Indicador de casos en procesamiento MEJORADO */}
      {processingCases.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Procesando {processingCases.size} caso{processingCases.size > 1 ? 's' : ''} con IA
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                La IA está analizando y generando resúmenes. Te notificaremos cuando estén listos.
              </p>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
              {Array.from(processingCases).slice(0, 3).join(', ')}
              {processingCases.size > 3 && ` +${processingCases.size - 3} más`}
            </div>
          </div>
        </div>
      )}

      <Card className="border shadow-sm bg-gray-50 dark:bg-black">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Filtros</span>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar casos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Rama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Todas las ramas</SelectItem>
                {especialidades.map(specialty => (
                  <SelectItem key={specialty.id} value={specialty.nombre} className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">{specialty.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Todos los tipos</SelectItem>
                {leadTypes.map(type => (
                  <SelectItem key={type} value={type} className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Todas las ciudades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city} className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo de perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Todos los perfiles</SelectItem>
                {profileTypes.map(type => (
                  <SelectItem key={type} value={type} className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

      <Card className="border-0 shadow-md bg-gray-100 dark:bg-black">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {sectionIcon}
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sectionTitle}
                </CardTitle>
              </div>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {sectionDescription}
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-medium shadow-sm transition-all duration-200 hover:shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Caso
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 [&>*:hover]:bg-blue-50 [&>*:hover]:text-blue-900">
                  <DropdownMenuItem onClick={() => setAddManualCaseOpen(true)} className="py-3 focus:bg-blue-50 focus:text-blue-900">
                    <FileText className="h-4 w-4 mr-3" />
                    <div>
                      <div className="font-medium">Añadir Caso Manual</div>
                      <div className="text-xs text-gray-500">Crear caso desde cero</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAddAICaseOpen(true)} className="py-3 relative focus:bg-blue-50 focus:text-blue-900">
                    <Bot className="h-4 w-4 mr-3" />
                    <div>
                      <div className="font-medium">Añadir Caso con IA</div>
                      <div className="text-xs text-gray-500">Generar con inteligencia artificial</div>
                    </div>
                    <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      Premium
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-4">
              {activeCasos.map((caso) => (
                <CaseCard
                  key={caso.id}
                  caso={caso}
                  onViewDetails={handleViewDetails}
                  onAssignLawyer={handleAssignLawyer}
                  onGenerateResolution={handleGenerateResolution}
                  onUploadDocument={handleUploadDocument}
                  onSendMessage={handleSendMessage}
                  onGenerateResolutionWithAgent={handleGenerateResolutionWithAgent}
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
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Pago</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Fecha de cierre</TableHead>
                    <TableHead className="h-14 text-base font-bold text-gray-900 dark:text-white">Cerrado por</TableHead>
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
                            {caso.profiles?.nombre || caso.nombre_borrador} {caso.profiles?.apellido || caso.apellido_borrador}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {caso.profiles?.email || caso.email_borrador}
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
                          {caso.tipo_lead || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {caso.especialidades?.nombre || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(caso.estado)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getPaymentBadge(caso.estado)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {caso.fecha_cierre ? format(new Date(caso.fecha_cierre), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {caso.cerrado_por || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
                          <div className="space-y-1">
                            {caso.asignaciones_casos.map((asignacion: any, index: number) => (
                              <div key={index} className="text-sm">
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
                            variant="default"
                            size="sm"
                            onClick={() => handleViewDetails(caso.id)}
                            className="h-9 px-3 text-sm font-semibold rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md hover:shadow-blue-500/20 dark:shadow-blue-900/20 transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 dark:focus:ring-blue-600/40"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAssignLawyer(caso.id)}
                            disabled={caso.estado === 'cerrado'}
                            className="h-9 px-3 text-sm font-semibold rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white disabled:opacity-60 disabled:pointer-events-none shadow-sm hover:shadow-md hover:shadow-emerald-500/20 dark:shadow-emerald-900/20 transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 dark:focus:ring-emerald-600/40"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Asignar
                          </Button>
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
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                {filteredCasos.length === 0
                  ? "No se encontraron casos con los filtros aplicados. Intenta ajustar los criterios de búsqueda."
                  : "Todos los casos están cerrados. Los casos cerrados no se muestran en esta vista."
                }
              </p>
              <Button
                onClick={() => setAddManualCaseOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Primer Caso
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CaseDetailModal
        caso={selectedCaseDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCaseDetail(null);
        }}
        onGenerateResolution={handleGenerateResolution}
        onUploadDocument={handleUploadDocument}
        onSendMessage={handleSendMessage}
      />

      <CaseAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => {
          setAssignmentModalOpen(false);
          setSelectedCaseForAssignment(null);
        }}
        caso={selectedCaseForAssignment}
      />

      <AddManualCaseModal
        isOpen={addManualCaseOpen}
        onClose={() => setAddManualCaseOpen(false)}
        onSuccess={handleManualCaseSuccess}
        onCaseCreated={handleCaseCreated}
        especialidades={especialidades}
      />

      <AddAICaseModal
        isOpen={addAICaseOpen}
        onClose={() => setAddAICaseOpen(false)}
        onSuccess={handleManualCaseSuccess}
        onCaseCreated={handleCaseCreated}
        especialidades={especialidades}
      />
    </div>
  );
};

export default AdminCasesManagement; 