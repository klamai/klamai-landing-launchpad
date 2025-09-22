import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Search,
  Filter,
  UserPlus,
  AlertCircle,
  Star,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  X,
  Users,
  Target,
  TrendingUp,
  Bot,
  Eye,
  Undo2,
  DollarSign,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAdminCases } from '@/hooks/queries/useAdminCases';
import { useAssignCaseToLawyer } from '@/hooks/queries/useAdminLawyers';
import { useLawyerMatching } from '@/hooks/useLawyerMatching';
import { useAssignmentMetrics } from '@/hooks/useAssignmentMetrics';
import { supabase } from '@/integrations/supabase/client';
import CaseDetailModal from './CaseDetailModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Components
import AssignmentMetrics from './AssignmentMetrics';
import { LawyerProfileModal } from './LawyerProfileModal';

// Helper functions
const getMatchLevelColor = (level: string) => {
  switch (level) {
    case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
    case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getMatchLevelIcon = (level: string) => {
  switch (level) {
    case 'excellent': return <Star className="w-4 h-4 text-green-600" />;
    case 'good': return <Target className="w-4 h-4 text-blue-600" />;
    case 'fair': return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

// Función para mapear IDs de especialidades a nombres
const getSpecialtyName = (id: number): string => {
  const specialtyMap: Record<number, string> = {
    1: 'Derecho Civil',
    2: 'Derecho Penal',
    3: 'Derecho Laboral',
    4: 'Derecho Mercantil',
    5: 'Derecho Administrativo',
    6: 'Derecho Fiscal',
    7: 'Derecho Familiar',
    8: 'Derecho Inmobiliario',
    9: 'Derecho de Extranjería',
    10: 'Derecho de la Seguridad Social',
    11: 'Derecho Sanitario',
    12: 'Derecho de Seguros',
    13: 'Derecho Concursal',
    14: 'Derecho de Propiedad Intelectual',
    15: 'Derecho Ambiental',
    16: 'Consulta General'
  };
  return specialtyMap[id] || `Especialidad ${id}`;
};

// Draggable Case Item Component
const CaseItem: React.FC<{
  caso: any;
  isSelected: boolean;
  onClick: () => void;
  onViewDetails: (caso: any) => void;
}> = ({ caso, isSelected, onClick, onViewDetails }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `case-${caso.id}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(caso);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      layout
      className={`p-3 mb-2 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 shadow-lg scale-105' :
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm truncate">
              {caso.profiles?.nombre || caso.nombre_borrador} {caso.profiles?.apellido || caso.apellido_borrador}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    onClick={handleViewDetails}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver detalles del caso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-gray-600 truncate mb-2">
            {caso.motivo_consulta}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {caso.especialidad_id ? getSpecialtyName(caso.especialidad_id) : 'Sin especialidad'}
            </Badge>
            {(caso.ciudad_borrador || caso.profiles?.ciudad) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {caso.ciudad_borrador || caso.profiles?.ciudad}
              </div>
            )}
            {caso.precio_consulta && (
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <DollarSign className="w-3 h-3" />
                €{caso.precio_consulta}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {new Date(caso.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="ml-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </motion.div>
  );
};

// Droppable Lawyer Item Component
const LawyerItem: React.FC<{
  match: any;
  onViewProfile: (lawyer: any) => void;
}> = ({ match, onViewProfile }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `lawyer-${match.lawyer.id}`,
    data: {
      type: 'lawyer',
      lawyerId: match.lawyer.id
    }
  });

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile(match.lawyer);
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={`p-3 rounded-lg border-2 transition-all ${
        isOver ? 'border-blue-500 bg-blue-100 scale-105 shadow-lg' :
        match.matchLevel === 'excellent' ? 'border-green-300 bg-green-50 hover:bg-green-100' :
        match.matchLevel === 'good' ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' :
        match.matchLevel === 'fair' ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
        'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getMatchLevelIcon(match.matchLevel)}
          <span className="font-medium text-sm truncate">
            {match.lawyer.nombre} {match.lawyer.apellido}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={handleViewProfile}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver perfil del abogado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge className={`text-xs ${getMatchLevelColor(match.matchLevel)}`}>
            {match.score}%
          </Badge>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          <span>{match.lawyer.casos_activos} casos activos</span>
        </div>
        {match.lawyer.ciudad && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{match.lawyer.ciudad}</span>
          </div>
        )}
        {match.lawyer.especialidades && match.lawyer.especialidades.length > 0 && (
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span className="truncate">
              {(() => {
                const especialidades = Array.isArray(match.lawyer.especialidades)
                  ? match.lawyer.especialidades.slice(0, 2).map((esp: any) => {
                      if (typeof esp === 'number') {
                        return getSpecialtyName(esp);
                      } else if (typeof esp === 'object' && esp.nombre) {
                        return esp.nombre;
                      } else if (typeof esp === 'string') {
                        return esp;
                      }
                      return 'Desconocida';
                    })
                  : [];

                return especialidades.length > 0 ? especialidades.join(', ') : 'Especialidades disponibles';
              })()}
              {match.lawyer.especialidades.length > 2 && '...'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {match.reasons.slice(0, 2).join(' • ')}
      </div>
    </motion.div>
  );
};

interface CaseAssignmentBoardProps {
  onCaseAssigned?: () => void;
}

const CaseAssignmentBoard: React.FC<CaseAssignmentBoardProps> = ({ onCaseAssigned }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lawyerFilters, setLawyerFilters] = useState({
    especialidad: 'todas',
    experienciaMin: 0,
    experienciaMax: 50,
    ciudad: '',
    workloadMax: 100,
    creditosMin: 0,
  });

  // Nuevos estados para mejoras UX
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<any>(null);
  const [lawyerProfileModalOpen, setLawyerProfileModalOpen] = useState(false);
  const [selectedLawyerForProfile, setSelectedLawyerForProfile] = useState<any>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<Array<{
    id: string;
    caso: any;
    abogado: any;
    timestamp: Date;
  }>>([]);
  const [confirmUndoOpen, setConfirmUndoOpen] = useState(false);
  const [lastAssignment, setLastAssignment] = useState<{
    caso: any;
    abogado: any;
  } | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Array<{
    id: string;
    caso: any;
    abogado: any;
    timestamp: Date;
  }>>([]);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<{
    caso: any;
    abogado: any;
  } | null>(null);

  const { toast } = useToast();
  const { data: cases = [], isLoading: casesLoading } = useAdminCases();
  const { mutate: assignCase, isPending: isAssigning } = useAssignCaseToLawyer();
  const { data: metrics } = useAssignmentMetrics();

  // Get available cases (not assigned or closed)
  const availableCases = useMemo(() => {
    return cases.filter(caso =>
      caso.estado === 'disponible' ||
      caso.estado === 'listo_para_propuesta'
    );
  }, [cases]);

  // Filter and sort cases based on search (most recent first)
  const filteredCases = useMemo(() => {
    return availableCases
      .filter(caso => {
        const clientData = {
          nombre: caso.profiles?.nombre || caso.nombre_borrador || '',
          apellido: caso.profiles?.apellido || caso.apellido_borrador || '',
          email: caso.profiles?.email || caso.email_borrador || '',
        };

        const matchesSearch = !searchTerm ||
          caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          caso.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientData.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientData.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientData.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        // Sort by creation date (most recent first)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
  }, [availableCases, searchTerm]);

  // Transform selected case to match hook interface
  const transformedCase = selectedCase ? {
    ...selectedCase,
    especialidades: selectedCase.especialidad_id ? [{
      id: selectedCase.especialidad_id,
      nombre: getSpecialtyName(selectedCase.especialidad_id)
    }] : []
  } : null;

  // Get matching lawyers for selected case
  const { matches: lawyerMatches, isLoading: matchingLoading } = useLawyerMatching(transformedCase);

  // Filter lawyers based on criteria
  const filteredLawyers = useMemo(() => {
    if (!lawyerMatches.length) return lawyerMatches;

    return lawyerMatches.filter(match => {
      const lawyer = match.lawyer;

      const matchesEspecialidad = lawyerFilters.especialidad === 'todas' ||
        (lawyer.especialidades && Array.isArray(lawyer.especialidades) &&
         lawyer.especialidades.some((esp: any) =>
           typeof esp === 'number'
             ? esp.toString() === lawyerFilters.especialidad
             : esp.id?.toString() === lawyerFilters.especialidad
         ));

      const matchesExperiencia = (!lawyer.experiencia_anos && lawyerFilters.experienciaMin === 0) ||
        (lawyer.experiencia_anos &&
         lawyer.experiencia_anos >= lawyerFilters.experienciaMin &&
         lawyer.experiencia_anos <= lawyerFilters.experienciaMax);

      const matchesCiudad = !lawyerFilters.ciudad ||
        lawyer.ciudad?.toLowerCase().includes(lawyerFilters.ciudad.toLowerCase());

      const matchesWorkload = lawyer.casos_activos <= lawyerFilters.workloadMax;

      const matchesCreditos = lawyer.creditos_disponibles >= lawyerFilters.creditosMin;

      return matchesEspecialidad && matchesExperiencia && matchesCiudad && matchesWorkload && matchesCreditos;
    });
  }, [lawyerMatches, lawyerFilters]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Siempre limpiar el activeId al final
    setActiveId(null);

    // Si no hay un destino válido, no hacer nada
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Validar que el destino tenga los datos correctos de un droppable de abogado
    const overData = over.data?.current;
    const isValidLawyerDrop = overData && overData.type === 'lawyer' && overData.lawyerId;

    // Solo asignar si TODAS las condiciones se cumplen estrictamente:
    // 1. El elemento arrastrado es un caso
    // 2. El destino ES específicamente un droppable de abogado válido
    // 3. Los IDs son completamente diferentes
    if (activeId.startsWith('case-') &&
        overId.startsWith('lawyer-') &&
        isValidLawyerDrop &&
        activeId !== overId) {

      const caseId = activeId.replace('case-', '');
      const lawyerId = overData.lawyerId; // Usar el ID del data en lugar del ID del elemento

      // Verificar que el caso y abogado existen en las listas actuales
      const caso = availableCases.find(c => c.id === caseId);
      const lawyerMatch = filteredLawyers.find(m => m.lawyer.id === lawyerId);

      if (caso && lawyerMatch) {
        handleAssignCase(caso, lawyerMatch.lawyer);
      }
    }
    // Si no cumple las condiciones, no hacer nada (no asignar)
  };

  const handleViewCaseDetails = (caso: any) => {
    setSelectedCaseForDetail(caso);
    setDetailModalOpen(true);
  };

  const handleViewLawyerProfile = (lawyer: any) => {
    setSelectedLawyerForProfile(lawyer);
    setLawyerProfileModalOpen(true);
  };

  const handleAssignCase = (caso: any, lawyer: any) => {
    // Guardar la asignación para posible deshacer
    setLastAssignment({ caso, abogado: lawyer });

    assignCase(
      { casoId: caso.id, abogadoId: lawyer.id, notas: `Asignación automática - Score: ${lawyerMatches.find(m => m.lawyer.id === lawyer.id)?.score || 0}%` },
      {
        onSuccess: () => {
          // Agregar a asignaciones recientes
          const assignmentId = `${caso.id}-${lawyer.id}-${Date.now()}`;
          const newAssignment = {
            id: assignmentId,
            caso,
            abogado: lawyer,
            timestamp: new Date()
          };

          setRecentAssignments(prev => [newAssignment, ...prev.slice(0, 4)]); // Mantener solo las últimas 5
          setAssignmentHistory(prev => [...prev, newAssignment]);

          // Mostrar modal de confirmación de asignación
          setCurrentAssignment({ caso, abogado: lawyer });
          setAssignmentModalOpen(true);

          // Toast persistente con opción de deshacer
          toast({
            title: "¡Caso asignado exitosamente!",
            description: `${caso.motivo_consulta?.substring(0, 50)}... asignado a ${lawyer.nombre} ${lawyer.apellido}`,
            duration: 10000, // 10 segundos para que sea más persistente
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmUndoOpen(true)}
                className="ml-2"
              >
                <Undo2 className="w-3 h-3 mr-1" />
                Deshacer
              </Button>
            ),
          });

          // Limpiar selección del caso
          setSelectedCase(null);
          onCaseAssigned?.();
        },
        onError: (error) => {
          toast({
            title: "Error al asignar caso",
            description: error?.message || "Ocurrió un error inesperado",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleUndoLastAssignment = async () => {
    if (!lastAssignment) return;

    try {
      // TODO: Implementar llamada a API para remover asignación
      // Por ahora simulamos la funcionalidad
      console.log('Deshaciendo asignación:', lastAssignment);

      // Remover de asignaciones recientes
      setRecentAssignments(prev => prev.filter(a => a.id !== assignmentHistory[assignmentHistory.length - 1]?.id));

      // Limpiar la última asignación
      setLastAssignment(null);

      toast({
        title: "Asignación deshecha",
        description: `El caso ha sido removido de ${lastAssignment.abogado.nombre} ${lastAssignment.abogado.apellido}`,
      });

      setConfirmUndoOpen(false);

      // Refrescar datos
      onCaseAssigned?.();

    } catch (error: any) {
      console.error('Error deshaciendo asignación:', error);
      toast({
        title: "Error al deshacer",
        description: error?.message || "No se pudo deshacer la asignación",
        variant: "destructive"
      });
    }
  };

  const getMatchLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchLevelIcon = (level: string) => {
    switch (level) {
      case 'excellent': return <Star className="w-4 h-4 text-green-600" />;
      case 'good': return <Target className="w-4 h-4 text-blue-600" />;
      case 'fair': return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (casesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando casos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <AssignmentMetrics metrics={metrics} />

      {/* Main Assignment Interface */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases Panel */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Casos Disponibles
                  <Badge variant="secondary">{filteredCases.length}</Badge>
                </CardTitle>
                {selectedCase && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCase(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar casos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent className="max-h-96 overflow-y-auto">
              <SortableContext items={filteredCases.map(c => `case-${c.id}`)} strategy={verticalListSortingStrategy}>
                {filteredCases.map((caso) => (
                  <CaseItem
                    key={caso.id}
                    caso={caso}
                    isSelected={selectedCase?.id === caso.id}
                    onClick={() => setSelectedCase(caso)}
                    onViewDetails={handleViewCaseDetails}
                  />
                ))}
              </SortableContext>

              {filteredCases.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay casos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lawyers Panel */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Abogados Disponibles
                  <Badge variant="secondary">{filteredLawyers.length}</Badge>
                </CardTitle>

                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>

              {/* Selected Case Info */}
              {selectedCase && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Caso seleccionado:</p>
                  <p className="text-xs text-blue-700 truncate">
                    {selectedCase.motivo_consulta}
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="max-h-96 overflow-y-auto">
              {/* Filters */}
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CollapsibleContent className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={lawyerFilters.especialidad}
                      onValueChange={(value) => setLawyerFilters(prev => ({ ...prev, especialidad: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="1">Derecho Civil</SelectItem>
                        <SelectItem value="2">Derecho Penal</SelectItem>
                        <SelectItem value="3">Derecho Laboral</SelectItem>
                        <SelectItem value="4">Derecho Mercantil</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Ciudad"
                      value={lawyerFilters.ciudad}
                      onChange={(e) => setLawyerFilters(prev => ({ ...prev, ciudad: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Experiencia: {lawyerFilters.experienciaMin} - {lawyerFilters.experienciaMax} años</label>
                    <Slider
                      value={[lawyerFilters.experienciaMin, lawyerFilters.experienciaMax]}
                      onValueChange={([min, max]) => setLawyerFilters(prev => ({ ...prev, experienciaMin: min, experienciaMax: max }))}
                      max={50}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Carga máxima: {lawyerFilters.workloadMax} casos</label>
                    <Slider
                      value={[lawyerFilters.workloadMax]}
                      onValueChange={([value]) => setLawyerFilters(prev => ({ ...prev, workloadMax: value }))}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Lawyers List */}
              {selectedCase ? (
                matchingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm">Analizando compatibilidad...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLawyers.map((match) => (
                      <LawyerItem
                        key={match.lawyer.id}
                        match={match}
                        onViewProfile={handleViewLawyerProfile}
                      />
                    ))}

                    {filteredLawyers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay abogados que coincidan con los filtros</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selecciona un caso para ver sugerencias de abogados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            activeId.startsWith('case-') ? (
              (() => {
                const caseId = activeId.replace('case-', '');
                const caso = filteredCases.find(c => c.id === caseId);
                return caso ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.95 }}
                    className="bg-white p-4 rounded-xl shadow-2xl border-2 border-blue-500 max-w-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {caso.profiles?.nombre || caso.nombre_borrador} {caso.profiles?.apellido || caso.apellido_borrador}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {caso.motivo_consulta}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {caso.especialidad_id ? getSpecialtyName(caso.especialidad_id) : 'Sin especialidad'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Suelta sobre un abogado para asignar
                      </p>
                    </div>
                  </motion.div>
                ) : null;
              })()
            ) : null
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Panel de Asignaciones Recientes */}
      {recentAssignments.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Asignaciones Recientes
              </CardTitle>
              {lastAssignment && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmUndoOpen(true)}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Deshacer Última
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAssignments.slice(0, 3).map((assignment) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {assignment.caso.motivo_consulta?.substring(0, 40)}...
                      </p>
                      <p className="text-xs text-gray-600">
                        → {assignment.abogado.nombre} {assignment.abogado.apellido}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {assignment.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Cómo usar la asignación inteligente</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Selecciona un caso de la lista izquierda</li>
                <li>• El sistema mostrará abogados compatibles con puntuaciones</li>
                <li>• Arrastra el caso sobre el abogado deseado para asignarlo</li>
                <li>• Usa los filtros para refinar las sugerencias</li>
                <li>• Haz clic en 👁️ para ver detalles completos</li>
                <li>• Las asignaciones recientes se muestran arriba</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del caso */}
      <CaseDetailModal
        caso={selectedCaseForDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCaseForDetail(null);
        }}
        onGenerateResolution={() => {}}
        onUploadDocument={() => {}}
        onSendMessage={() => {}}
      />

      {/* Modal de perfil del abogado */}
      {selectedLawyerForProfile && (
        <LawyerProfileModal
          lawyer={selectedLawyerForProfile}
          mode="view"
          open={lawyerProfileModalOpen}
          onOpenChange={setLawyerProfileModalOpen}
          onSave={() => {}}
        />
      )}

      {/* Modal de confirmación para deshacer */}
      <Dialog open={confirmUndoOpen} onOpenChange={setConfirmUndoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-orange-600" />
              Deshacer asignación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres deshacer la última asignación?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {lastAssignment && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">
                Caso: {lastAssignment.caso.motivo_consulta?.substring(0, 50)}...
              </p>
              <p className="text-sm text-gray-600">
                Abogado: {lastAssignment.abogado.nombre} {lastAssignment.abogado.apellido}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUndoOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleUndoLastAssignment}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Deshacer asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de asignación */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              ¡Asignación Completada!
            </DialogTitle>
            <DialogDescription>
              El caso ha sido asignado exitosamente al abogado seleccionado.
            </DialogDescription>
          </DialogHeader>

          {currentAssignment && (
            <div className="space-y-4">
              {/* Información del caso */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Caso Asignado
                </h4>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Cliente:</strong> {currentAssignment.caso.profiles?.nombre || currentAssignment.caso.nombre_borrador} {currentAssignment.caso.profiles?.apellido || currentAssignment.caso.apellido_borrador}
                </p>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Motivo:</strong> {currentAssignment.caso.motivo_consulta}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Especialidad:</strong> {currentAssignment.caso.especialidad_id ? getSpecialtyName(currentAssignment.caso.especialidad_id) : 'Sin especialidad'}
                </p>
              </div>

              {/* Información del abogado */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Abogado Asignado
                </h4>
                <p className="text-sm text-green-800 mb-1">
                  <strong>Nombre:</strong> {currentAssignment.abogado.nombre} {currentAssignment.abogado.apellido}
                </p>
                <p className="text-sm text-green-800 mb-1">
                  <strong>Email:</strong> {currentAssignment.abogado.email}
                </p>
                {currentAssignment.abogado.ciudad && (
                  <p className="text-sm text-green-800">
                    <strong>Ciudad:</strong> {currentAssignment.abogado.ciudad}
                  </p>
                )}
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  El abogado recibirá una notificación por email con los detalles del caso.
                  Puedes hacer seguimiento desde la sección de casos asignados.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignmentModalOpen(false)}
              className="mr-2"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setAssignmentModalOpen(false);
                setCurrentAssignment(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseAssignmentBoard;