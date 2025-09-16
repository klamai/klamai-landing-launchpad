import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Calendar,
  Award,
  TrendingUp,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Edit,
  Layers,
  PlusCircle,
  List,
  Shield,
  Ban,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  DollarSign,
  Receipt,
  PiggyBank
} from 'lucide-react';
import { LawyerProfileModal } from './LawyerProfileModal';
import LawyerApplicationsManagement from './LawyerApplicationsManagement';
import LawyerCasesView from './LawyerCasesView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAdminLawyers, useSuperAdminAccess } from '@/hooks/queries/useAdminLawyers';
import { useAdminLawyerApplications } from '@/hooks/queries/useAdminLawyerApplications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
          No tienes permisos para acceder a esta sección. Solo los super administradores pueden gestionar abogados.
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

const AdminLawyersManagement = () => {
  const { user } = useAuth();

  // Estado para el modal de perfil
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Estado para el abogado seleccionado para ver sus casos
  const [selectedLawyerForCases, setSelectedLawyerForCases] = useState<any>(null);

  // Estado para el modal de especialidades
  const [specialtiesModalOpen, setSpecialtiesModalOpen] = useState(false);
  const [selectedLawyerSpecialties, setSelectedLawyerSpecialties] = useState<any>(null);

  // Estado para el modal de agregar abogado
  const [addLawyerModalOpen, setAddLawyerModalOpen] = useState(false);
  const [isAddingLawyer, setIsAddingLawyer] = useState(false);
  const [newLawyerData, setNewLawyerData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    colegio_profesional: '',
    numero_colegiado: '',
    experiencia_anos: '',
    ciudad: '',
    especialidades: [] as number[]
  });

  // Estado para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    especialidad: 'todas',
    casosActivosMin: 0,
    casosActivosMax: 50, // Aumentado para incluir más abogados
    creditosMin: 0,
    creditosMax: 1000,
    fechaRegistroDesde: '',
    fechaRegistroHasta: '',
    colegioProfesional: '',
    experienciaMin: 0,
    experienciaMax: 50,
    ciudad: ''
  });

  // Estado para búsqueda de abogados en casos
  const [lawyerSearchTerm, setLawyerSearchTerm] = useState('');

  // Hooks optimizados con React Query
  const { data: hasSuperAdminAccess, isLoading: accessLoading } = useSuperAdminAccess();
  const { data: abogados, isLoading: loadingAbogados, error: abogadosError, refetch: refetchAbogados } = useAdminLawyers();
  const { data: applications, isLoading: loadingApplications } = useAdminLawyerApplications();

  // Función para actualizar filtros
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Filtrar abogados para el selector de casos
  const filteredLawyersForCases = useMemo(() => {
    if (!abogados) return [];

    if (!lawyerSearchTerm.trim()) return abogados;

    const searchLower = lawyerSearchTerm.toLowerCase();
    return abogados.filter(abogado =>
      abogado.nombre?.toLowerCase().includes(searchLower) ||
      abogado.apellido?.toLowerCase().includes(searchLower) ||
      abogado.email?.toLowerCase().includes(searchLower) ||
      abogado.telefono?.includes(searchLower) ||
      `${abogado.nombre} ${abogado.apellido}`.toLowerCase().includes(searchLower)
    );
  }, [abogados, lawyerSearchTerm]);

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      especialidad: 'todas',
      casosActivosMin: 0,
      casosActivosMax: 50,
      creditosMin: 0,
      creditosMax: 1000,
      fechaRegistroDesde: '',
      fechaRegistroHasta: '',
      colegioProfesional: '',
      experienciaMin: 0,
      experienciaMax: 50,
      ciudad: ''
    });
    setSearchTerm('');
  };

  // Filtrar abogados
  const filteredAbogados = useMemo(() => {
    if (!abogados) return [];

    return abogados.filter(abogado => {
      // Búsqueda por texto
      const searchMatch = !searchTerm ||
        abogado.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abogado.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abogado.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abogado.colegio_profesional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abogado.numero_colegiado?.includes(searchTerm) ||
        abogado.ciudad?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtros avanzados
      const especialidadMatch = filters.especialidad === 'todas' ||
        (abogado.especialidades && abogado.especialidades.some((esp: any) =>
          typeof esp === 'number' ? esp === parseInt(filters.especialidad) : esp.id === parseInt(filters.especialidad)
        ));

      const casosMatch = abogado.casos_activos >= filters.casosActivosMin &&
                        abogado.casos_activos <= filters.casosActivosMax;

      const creditosMatch = abogado.creditos_disponibles >= filters.creditosMin &&
                           abogado.creditos_disponibles <= filters.creditosMax;

      const fechaMatch = (!filters.fechaRegistroDesde || new Date(abogado.created_at) >= new Date(filters.fechaRegistroDesde)) &&
                        (!filters.fechaRegistroHasta || new Date(abogado.created_at) <= new Date(filters.fechaRegistroHasta));

      const colegioMatch = !filters.colegioProfesional ||
        abogado.colegio_profesional?.toLowerCase().includes(filters.colegioProfesional.toLowerCase());

      const experienciaMatch = (!abogado.experiencia_anos && filters.experienciaMin === 0) ||
        (abogado.experiencia_anos && abogado.experiencia_anos >= filters.experienciaMin &&
         abogado.experiencia_anos <= filters.experienciaMax);

      const ciudadMatch = !filters.ciudad ||
        abogado.ciudad?.toLowerCase().includes(filters.ciudad.toLowerCase());

      return searchMatch && especialidadMatch && casosMatch && creditosMatch &&
             fechaMatch && colegioMatch && experienciaMatch && ciudadMatch;
    });
  }, [abogados, searchTerm, filters]);

  // Función para obtener la imagen de avatar disponible
  const getAvatarUrl = (abogado: any) => {
    // Usar avatar_url de profiles si está disponible
    if (abogado.avatar_url) {
      return abogado.avatar_url;
    }

    // Si no hay imagen, devolver null para mostrar iniciales
    return null;
  };

  // Función para renderizar avatar con datos de Supabase Auth
  const renderAvatar = (abogado: any) => {
    const displayName = `${abogado.nombre} ${abogado.apellido}`;
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const avatarUrl = getAvatarUrl(abogado);

    if (avatarUrl) {
      return (
        <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden">
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium hidden">
            {initials}
          </div>
        </div>
      );
    }

    return (
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium">
        {initials}
      </div>
    );
  };

  // Loading state
  if (accessLoading || loadingAbogados) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <div className="h-10 bg-white dark:bg-gray-700 rounded px-6 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded px-6 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Applications Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized access
  if (!hasSuperAdminAccess) {
    return <UnauthorizedAccess />;
  }

  // Error state
  if (abogadosError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Error al Cargar</CardTitle>
            <CardDescription>
              {abogadosError.message || 'Error inesperado al cargar los abogados'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => refetchAbogados()} className="mr-2">
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

  const getWorkloadColor = (casos_activos: number) => {
    if (casos_activos === 0) return 'text-gray-500';
    if (casos_activos <= 3) return 'text-green-600';
    if (casos_activos <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadPercentage = (casos_activos: number) => {
    const maxCases = 50; // Máximo de casos para el cálculo del porcentaje
    return Math.min((casos_activos / maxCases) * 100, 100);
  };

  // Funciones para manejar el modal de perfil
  const handleViewProfile = (abogado: any) => {
    setSelectedLawyer(abogado);
    setProfileModalMode('view');
    setIsProfileModalOpen(true);
  };

  const handleEditProfile = (abogado: any) => {
    setSelectedLawyer(abogado);
    setProfileModalMode('edit');
    setIsProfileModalOpen(true);
  };

  // Función para abrir modal de perfil (siempre en modo vista)
  const handleOpenProfile = (abogado: any) => {
    setSelectedLawyer(abogado);
    setProfileModalMode('view');
    setIsProfileModalOpen(true);
  };

  const handleProfileSave = (updatedProfile: any) => {
    // Refrescar la lista de abogados después de guardar
    refetchAbogados();
    setIsProfileModalOpen(false);
  };

  const handleProfileModalClose = () => {
    setIsProfileModalOpen(false);
    setSelectedLawyer(null);
    setProfileModalMode('view'); // Resetear siempre a modo vista
  };

  // Función para seleccionar abogado y ver sus casos
  const handleViewLawyerCases = (abogado: any) => {
    setSelectedLawyerForCases(abogado);
    // Cambiar automáticamente al tab de casos
    const tabsElement = document.querySelector('[value="casos"]') as HTMLElement;
    if (tabsElement) {
      tabsElement.click();
    }
  };

  // Función para abrir modal de especialidades
  const handleViewAllSpecialties = (abogado: any) => {
    setSelectedLawyerSpecialties(abogado);
    setSpecialtiesModalOpen(true);
  };

  // Función para cerrar modal de especialidades
  const handleCloseSpecialtiesModal = () => {
    setSpecialtiesModalOpen(false);
    setSelectedLawyerSpecialties(null);
  };

  // Función para abrir modal de agregar abogado
  const handleAddLawyer = () => {
    setNewLawyerData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      colegio_profesional: '',
      numero_colegiado: '',
      experiencia_anos: '',
      ciudad: '',
      especialidades: []
    });
    setAddLawyerModalOpen(true);
  };

  // Función para cerrar modal de agregar abogado
  const handleCloseAddLawyerModal = () => {
    setAddLawyerModalOpen(false);
    setNewLawyerData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      colegio_profesional: '',
      numero_colegiado: '',
      experiencia_anos: '',
      ciudad: '',
      especialidades: []
    });
  };

  // Función para actualizar datos del nuevo abogado
  const updateNewLawyerData = (field: string, value: any) => {
    setNewLawyerData(prev => ({ ...prev, [field]: value }));
  };

  // Función para agregar abogado
  const handleCreateLawyer = async () => {
    if (!newLawyerData.nombre || !newLawyerData.apellido || !newLawyerData.email) {
      alert('Por favor complete los campos obligatorios: nombre, apellido y email');
      return;
    }

    setIsAddingLawyer(true);
    try {
      // Llamar a la Edge Function para crear el abogado
      const { data, error } = await supabase.functions.invoke('create-lawyer-manually', {
        body: {
          nombre: newLawyerData.nombre,
          apellido: newLawyerData.apellido,
          email: newLawyerData.email,
          telefono: newLawyerData.telefono,
          colegio_profesional: newLawyerData.colegio_profesional,
          numero_colegiado: newLawyerData.numero_colegiado,
          experiencia_anos: newLawyerData.experiencia_anos,
          ciudad: newLawyerData.ciudad,
          especialidades: newLawyerData.especialidades
        }
      });

      if (error) {
        throw new Error(error.message || 'Error en la función de creación');
      }

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al crear abogado');
      }

      // Refrescar la lista de abogados
      refetchAbogados();

      // Cerrar modal y mostrar mensaje de éxito
      setAddLawyerModalOpen(false);
      alert(`Abogado ${data.nombre} ${data.apellido} creado exitosamente. Se ha enviado un email con las credenciales de acceso.`);

      // Limpiar el formulario
      setNewLawyerData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        colegio_profesional: '',
        numero_colegiado: '',
        experiencia_anos: '',
        ciudad: '',
        especialidades: []
      });

    } catch (error: any) {
      console.error('Error creating lawyer:', error);
      alert('Error al crear abogado: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsAddingLawyer(false);
    }
  };

  // Función para abrir detalles del caso
  const handleViewCaseDetails = (caseId: string) => {
    // Aquí puedes implementar la navegación al detalle del caso
    // Por ahora, solo mostraremos un mensaje
    console.log('Ver detalles del caso:', caseId);
    // En el futuro podrías abrir un modal de detalles del caso
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

  // Las especialidades deben venir ya como nombres desde el backend/hook
  const renderSpecialties = (especialidades: { id: number, nombre: string }[] | number[] | null, abogado?: any) => {
    if (!especialidades || especialidades.length === 0) {
      return <span className="italic text-gray-500 text-xs">Sin especialidades</span>;
    }

    // Si es un array de objetos con nombre, renderiza normalmente
    if (typeof especialidades[0] === 'object' && 'nombre' in (especialidades[0] as any)) {
      const specialties = especialidades as {id:number, nombre:string}[];
      if (specialties.length <= 3) {
        // Mostrar todas las especialidades si son pocas
        return (
          <div className="flex flex-wrap gap-1">
            {specialties.map((esp) => (
              <Badge key={esp.id} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                {esp.nombre}
              </Badge>
            ))}
          </div>
        );
      } else {
        // Mostrar las primeras 3 y un botón para ver todas
        return (
          <div className="flex flex-wrap gap-1 items-center">
            {specialties.slice(0, 3).map((esp) => (
              <Badge key={esp.id} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                {esp.nombre}
              </Badge>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
              onClick={(e) => {
                e.stopPropagation();
                if (abogado) handleViewAllSpecialties(abogado);
              }}
            >
              +{specialties.length - 3} más
            </Button>
          </div>
        );
      }
    }

    // Si es un array de números (ids), mapear a nombres
    const specialtyIds = especialidades as number[];
    const specialtyNames = specialtyIds.map(id => getSpecialtyName(id));
    if (specialtyNames.length <= 3) {
      return (
        <div className="flex flex-wrap gap-1">
          {specialtyNames.map((name, index) => (
            <Badge key={specialtyIds[index]} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
              {name}
            </Badge>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex flex-wrap gap-1 items-center">
          {specialtyNames.slice(0, 3).map((name, index) => (
            <Badge key={specialtyIds[index]} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
              {name}
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            onClick={(e) => {
              e.stopPropagation();
              if (abogado) handleViewAllSpecialties(abogado);
            }}
          >
            +{specialtyNames.length - 3} más
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900/20"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Gestión de Abogados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Administra solicitudes y supervisa el equipo de abogados
          </p>
        </div>
        <Button
          onClick={handleAddLawyer}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Agregar Abogado</span>
          <span className="sm:hidden">Agregar</span>
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="abogados" className="w-full">
        <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <TabsTrigger
            value="abogados"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
          >
            <Users className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="font-medium">Abogados</span>
          </TabsTrigger>
          <TabsTrigger
            value="casos"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
          >
            <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="font-medium">Casos</span>
          </TabsTrigger>
          <TabsTrigger
            value="solicitudes"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
          >
            <Clock className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="font-medium">Solicitudes</span>
          </TabsTrigger>
          <TabsTrigger
            value="pagos"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2.5 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-green-400"
          >
            <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="font-medium">Pagos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abogados" className="space-y-6">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Abogados</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{filteredAbogados.length}</p>
                    {filteredAbogados.length !== (abogados?.length || 0) && (
                      <p className="text-xs text-gray-500 truncate">de {abogados?.length || 0} total</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:border-l-green-600">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Abogados Activos</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAbogados.filter(a => a.casos_activos > 0).length}
                </p>
                {filteredAbogados.filter(a => a.casos_activos > 0).length !== (abogados?.filter(a => a.casos_activos > 0).length || 0) && (
                  <p className="text-xs text-gray-500 truncate">de {abogados?.filter(a => a.casos_activos > 0).length || 0} total</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 hover:border-l-yellow-600">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Casos Asignados</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAbogados.reduce((sum, a) => sum + a.casos_asignados, 0)}
                </p>
                {filteredAbogados.reduce((sum, a) => sum + a.casos_asignados, 0) !== (abogados?.reduce((sum, a) => sum + a.casos_asignados, 0) || 0) && (
                  <p className="text-xs text-gray-500 truncate">de {abogados?.reduce((sum, a) => sum + a.casos_asignados, 0) || 0} total</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover:border-l-purple-600">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Promedio Casos</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAbogados.length > 0 ? Math.round(filteredAbogados.reduce((sum, a) => sum + a.casos_asignados, 0) / filteredAbogados.length) : 0}
                </p>
                {filteredAbogados.length !== (abogados?.length || 0) && (
                  <p className="text-xs text-gray-500 truncate">filtrado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

      {/* Combined Stats - Solicitudes */}
      {applications && applications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 sm:mt-8"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
            Resumen de Solicitudes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:border-l-orange-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {applications.filter(app => app.estado === 'pendiente').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">En Revisión</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {applications.filter(app => app.estado === 'en_revision').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:border-l-green-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Aprobadas</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {applications.filter(app => app.estado === 'aprobada').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 hover:border-l-red-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Rechazadas</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {applications.filter(app => app.estado === 'rechazada').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido, email, colegio, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-all duration-200"
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
              <CollapsibleContent className="space-y-3 sm:space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Especialidad */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Especialidad</label>
                    <Select value={filters.especialidad} onValueChange={(value) => updateFilter('especialidad', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las especialidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las especialidades</SelectItem>
                        <SelectItem value="1">Derecho Civil</SelectItem>
                        <SelectItem value="2">Derecho Penal</SelectItem>
                        <SelectItem value="3">Derecho Laboral</SelectItem>
                        <SelectItem value="4">Derecho Mercantil</SelectItem>
                        <SelectItem value="5">Derecho Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Casos Activos */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Casos Activos: {filters.casosActivosMin} - {filters.casosActivosMax}</label>
                    <Slider
                      value={[filters.casosActivosMin, filters.casosActivosMax]}
                      onValueChange={([min, max]) => {
                        updateFilter('casosActivosMin', min);
                        updateFilter('casosActivosMax', max);
                      }}
                      max={50}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Créditos */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Créditos: {filters.creditosMin} - {filters.creditosMax}</label>
                    <Slider
                      value={[filters.creditosMin, filters.creditosMax]}
                      onValueChange={([min, max]) => {
                        updateFilter('creditosMin', min);
                        updateFilter('creditosMax', max);
                      }}
                      max={2000}
                      min={0}
                      step={50}
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

                  {/* Ciudad */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ciudad</label>
                    <input
                      type="text"
                      placeholder="Buscar ciudad..."
                      value={filters.ciudad}
                      onChange={(e) => updateFilter('ciudad', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
      </motion.div>

      {/* Results Summary */}
      {(searchTerm || Object.values(filters).some(v => v !== '' && v !== 'todas' && v !== 0 && v !== 10 && v !== 1000 && v !== 50)) && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Mostrando {filteredAbogados.length} de {abogados?.length || 0} abogados
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Lawyers Table */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Lista de Abogados</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Gestiona el equipo de abogados y sus asignaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Abogado</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Especialidades</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Ubicación</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Colegio</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Experiencia</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Casos Activos</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Créditos</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Registro</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAbogados.map((abogado) => (
                  <TableRow
                    key={abogado.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-700"
                    onClick={() => handleOpenProfile(abogado)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-3">
                        {renderAvatar(abogado)}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {abogado.nombre} {abogado.apellido}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{abogado.email}</p>
                          {abogado.telefono && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{abogado.telefono}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {renderSpecialties(abogado.especialidades, abogado)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          {abogado.ciudad ? (
                            <span className="text-sm text-gray-900 dark:text-white">{abogado.ciudad}</span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No especificada</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="min-w-0">
                        {abogado.colegio_profesional ? (
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-32" title={abogado.colegio_profesional}>
                            {abogado.colegio_profesional}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No registrado</span>
                        )}
                        {abogado.numero_colegiado && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            #{abogado.numero_colegiado}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {abogado.experiencia_anos ? `${abogado.experiencia_anos} años` : 'No especificada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2 min-w-24">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getWorkloadColor(abogado.casos_activos)}`}>
                            {abogado.casos_activos} casos
                          </span>
                          <span className="text-xs text-gray-500">
                            {getWorkloadPercentage(abogado.casos_activos).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={getWorkloadPercentage(abogado.casos_activos)}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="font-mono bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                        {abogado.creditos_disponibles} créditos
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(abogado.created_at), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="[&>*:hover]:bg-blue-50 [&>*:hover]:text-blue-900 dark:[&>*:hover]:bg-blue-900/20 dark:[&>*:hover]:text-blue-300">
                          <DropdownMenuLabel className="text-xs font-medium">Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm"
                              onClick={() => handleViewProfile(abogado)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm"
                              onClick={() => handleEditProfile(abogado)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm"
                            onClick={() => handleViewLawyerCases(abogado)}
                          >
                            <Layers className="w-4 h-4 mr-2" />
                            Ver Casos
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recargar Créditos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20 dark:focus:text-red-300 text-sm">
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20 dark:focus:text-red-300 text-sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredAbogados.map((abogado) => (
              <Card
                key={abogado.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                onClick={() => handleOpenProfile(abogado)}
              >
                <CardContent className="p-4">
                  {/* Header con avatar y acciones */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {renderAvatar(abogado)}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-base truncate">
                          {abogado.nombre} {abogado.apellido}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{abogado.email}</p>
                        {abogado.telefono && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{abogado.telefono}</p>
                        )}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="[&>*:hover]:bg-blue-50 [&>*:hover]:text-blue-900 dark:[&>*:hover]:bg-blue-900/20 dark:[&>*:hover]:text-blue-300">
                          <DropdownMenuLabel className="text-xs font-medium">Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm"
                            onClick={() => handleViewProfile(abogado)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm"
                            onClick={() => handleEditProfile(abogado)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm"
                            onClick={() => handleViewLawyerCases(abogado)}
                          >
                            <Layers className="w-4 h-4 mr-2" />
                            Ver Casos
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-blue-50 focus:text-blue-900 dark:focus:bg-blue-900/20 dark:focus:text-blue-300 text-sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recargar Créditos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20 dark:focus:text-red-300 text-sm">
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20 dark:focus:text-red-300 text-sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidades</span>
                    </div>
                    {renderSpecialties(abogado.especialidades, abogado)}
                  </div>

                  {/* Información adicional en grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación</p>
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {abogado.ciudad || 'No especificada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Colegio</p>
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {abogado.colegio_profesional || 'No registrado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Experiencia y créditos */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Experiencia</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {abogado.experiencia_anos ? `${abogado.experiencia_anos} años` : 'No especificada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">¢</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Créditos</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {abogado.creditos_disponibles}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Casos activos con barra de progreso */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Casos Activos</span>
                      <span className={`text-sm font-medium ${getWorkloadColor(abogado.casos_activos)}`}>
                        {abogado.casos_activos} casos ({getWorkloadPercentage(abogado.casos_activos).toFixed(0)}%)
                      </span>
                    </div>
                    <Progress
                      value={getWorkloadPercentage(abogado.casos_activos)}
                      className="h-2"
                    />
                  </div>

                  {/* Fecha de registro */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Registrado</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {format(new Date(abogado.created_at), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="casos" className="space-y-6">
          {/* Header con búsqueda integrada */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <Briefcase className="w-8 h-8" />
                  Gestión de Casos por Abogado
                </h3>
                <p className="text-blue-100 text-lg">
                  Busca y selecciona abogados para ver todos sus casos asignados
                </p>
              </div>

              {/* Campo de búsqueda integrado */}
              <div className="w-full lg:w-96">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={lawyerSearchTerm}
                    onChange={(e) => setLawyerSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                  />
                  {lawyerSearchTerm && (
                    <button
                      onClick={() => setLawyerSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Abogado Mejorado */}
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Seleccionar Abogado
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {filteredLawyersForCases.length} abogado{filteredLawyersForCases.length !== 1 ? 's' : ''} encontrado{filteredLawyersForCases.length !== 1 ? 's' : ''}
                    {lawyerSearchTerm && ` para "${lawyerSearchTerm}"`}
                  </p>
                </div>
                {selectedLawyerForCases && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLawyerForCases(null)}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar selección
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!lawyerSearchTerm && filteredLawyersForCases.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay abogados disponibles
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron abogados en el sistema
                  </p>
                </div>
              ) : lawyerSearchTerm && filteredLawyersForCases.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No se encontraron resultados
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No hay abogados que coincidan con "{lawyerSearchTerm}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setLawyerSearchTerm('')}
                    className="hover:bg-blue-50 hover:border-blue-200"
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLawyersForCases.map((abogado) => (
                    <Card
                      key={abogado.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                        selectedLawyerForCases?.id === abogado.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedLawyerForCases(abogado)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-lg font-medium">
                            {abogado.nombre.charAt(0)}{abogado.apellido.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {abogado.nombre} {abogado.apellido}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {abogado.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Casos activos:</span>
                            <span className="font-semibold text-blue-600">{abogado.casos_activos}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Créditos:</span>
                            <span className="font-semibold text-green-600">{abogado.creditos_disponibles}</span>
                          </div>
                          {abogado.telefono && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Teléfono:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{abogado.telefono}</span>
                            </div>
                          )}
                        </div>

                        {selectedLawyerForCases?.id === abogado.id && (
                          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Seleccionado</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Abogado Seleccionado */}
          {selectedLawyerForCases && (
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl font-medium flex-shrink-0">
                    {selectedLawyerForCases.nombre.charAt(0)}{selectedLawyerForCases.apellido.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedLawyerForCases.nombre} {selectedLawyerForCases.apellido}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {selectedLawyerForCases.email}
                    </p>
                    {selectedLawyerForCases.telefono && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📞 {selectedLawyerForCases.telefono}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Casos Activos</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedLawyerForCases.casos_activos}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Créditos</div>
                      <div className="text-2xl font-bold text-green-600">{selectedLawyerForCases.creditos_disponibles}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vista de Casos */}
          {selectedLawyerForCases ? (
            <LawyerCasesView
              lawyerId={selectedLawyerForCases.id}
              lawyerName={`${selectedLawyerForCases.nombre} ${selectedLawyerForCases.apellido}`}
              onViewCaseDetails={handleViewCaseDetails}
            />
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Selecciona un abogado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  Usa el campo de búsqueda arriba para encontrar abogados por nombre, email o teléfono, luego selecciona uno para ver todos sus casos asignados
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="solicitudes" className="space-y-6">
          <LawyerApplicationsManagement />
        </TabsContent>

        <TabsContent value="pagos" className="space-y-6">
          {/* Header de Pagos */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-green-100 dark:border-green-900/20"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Gestión de Pagos
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                    Sistema de comisiones y pagos a abogados
                  </p>
                </div>
              </div>

              {/* Información del sistema de pagos */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-green-200 dark:border-green-800">
                  <PiggyBank className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Comisión: 15%
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-green-200 dark:border-green-800">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pago: Automático
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-green-200 dark:border-green-800">
                  <Receipt className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transferencias: Diarias
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de acción principal */}
            <div className="flex-shrink-0">
              <Button
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Ver Reportes
              </Button>
            </div>
          </motion.div>

          {/* Estadísticas de Pagos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:border-l-green-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Pagado (Mes)</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">€0.00</p>
                    <p className="text-xs text-gray-500 truncate">Sin datos disponibles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Comisiones Retenidas</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">€0.00</p>
                    <p className="text-xs text-gray-500 truncate">15% de cada pago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover:border-l-purple-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pagos Pendientes</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">0</p>
                    <p className="text-xs text-gray-500 truncate">Por procesar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:border-l-orange-600">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Promedio por Abogado</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">€0.00</p>
                    <p className="text-xs text-gray-500 truncate">Este mes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contenido Principal de Pagos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Sistema de Pagos - Próximamente
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Esta sección está preparada para implementar el sistema completo de gestión de pagos y comisiones.
                  Incluye estadísticas, reportes y procesamiento automático de pagos a abogados.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Funcionalidades Planificadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Cálculo de Comisiones</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sistema automático para calcular y retener comisiones del 15% en cada pago realizado por clientes.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Pagos Automáticos</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Transferencias automáticas a abogados una vez descontadas las comisiones correspondientes.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Reportes Detallados</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generación de reportes mensuales con detalle de pagos, comisiones y transferencias realizadas.
                    </p>
                  </div>
                </div>

                {/* Información Técnica */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Información Técnica del Sistema
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">Comisión por defecto:</strong>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">15%</span>
                    </div>
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">Frecuencia de pagos:</strong>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Diaria</span>
                    </div>
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">Método de pago:</strong>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Transferencia bancaria</span>
                    </div>
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">Moneda:</strong>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">EUR (€)</span>
                    </div>
                  </div>
                </div>

                {/* Estado del Sistema */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Sistema en preparación</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    La implementación completa del sistema de pagos estará disponible próximamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Modal de Agregar Abogado */}
      <Dialog open={addLawyerModalOpen} onOpenChange={setAddLawyerModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Agregar Nuevo Abogado
            </DialogTitle>
            <DialogDescription>
              Complete la información del nuevo abogado. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Información Personal */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b pb-2">
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={newLawyerData.nombre}
                    onChange={(e) => updateNewLawyerData('nombre', e.target.value)}
                    placeholder="Ingrese el nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={newLawyerData.apellido}
                    onChange={(e) => updateNewLawyerData('apellido', e.target.value)}
                    placeholder="Ingrese el apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLawyerData.email}
                    onChange={(e) => updateNewLawyerData('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={newLawyerData.telefono}
                    onChange={(e) => updateNewLawyerData('telefono', e.target.value)}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b pb-2">
                Información Profesional
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colegio_profesional">Colegio Profesional</Label>
                  <Input
                    id="colegio_profesional"
                    value={newLawyerData.colegio_profesional}
                    onChange={(e) => updateNewLawyerData('colegio_profesional', e.target.value)}
                    placeholder="Colegio de Abogados"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_colegiado">Número de Colegiado</Label>
                  <Input
                    id="numero_colegiado"
                    value={newLawyerData.numero_colegiado}
                    onChange={(e) => updateNewLawyerData('numero_colegiado', e.target.value)}
                    placeholder="Número de colegiado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experiencia_anos">Años de Experiencia</Label>
                  <Input
                    id="experiencia_anos"
                    type="number"
                    min="0"
                    max="50"
                    value={newLawyerData.experiencia_anos}
                    onChange={(e) => updateNewLawyerData('experiencia_anos', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={newLawyerData.ciudad}
                    onChange={(e) => updateNewLawyerData('ciudad', e.target.value)}
                    placeholder="Ciudad de residencia"
                  />
                </div>
              </div>
            </div>

            {/* Especialidades */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b pb-2">
                Especialidades
              </h4>
              <div className="space-y-3">
                <Label>Seleccione las especialidades del abogado:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 1, nombre: 'Derecho Civil' },
                    { id: 2, nombre: 'Derecho Penal' },
                    { id: 3, nombre: 'Derecho Laboral' },
                    { id: 4, nombre: 'Derecho Mercantil' },
                    { id: 5, nombre: 'Derecho Administrativo' },
                    { id: 6, nombre: 'Derecho Fiscal' },
                    { id: 7, nombre: 'Derecho Familiar' },
                    { id: 8, nombre: 'Derecho Inmobiliario' },
                    { id: 9, nombre: 'Derecho de Extranjería' },
                    { id: 10, nombre: 'Derecho de la Seguridad Social' },
                    { id: 11, nombre: 'Derecho Sanitario' },
                    { id: 12, nombre: 'Derecho de Seguros' },
                    { id: 13, nombre: 'Derecho Concursal' },
                    { id: 14, nombre: 'Derecho de Propiedad Intelectual' },
                    { id: 15, nombre: 'Derecho Ambiental' },
                    { id: 16, nombre: 'Consulta General' }
                  ].map((especialidad) => (
                    <div key={especialidad.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`especialidad-${especialidad.id}`}
                        checked={newLawyerData.especialidades.includes(especialidad.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateNewLawyerData('especialidades', [...newLawyerData.especialidades, especialidad.id]);
                          } else {
                            updateNewLawyerData('especialidades', newLawyerData.especialidades.filter(id => id !== especialidad.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`especialidad-${especialidad.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {especialidad.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAddLawyerModal}
              disabled={isAddingLawyer}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateLawyer}
              disabled={isAddingLawyer || !newLawyerData.nombre || !newLawyerData.apellido || !newLawyerData.email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddingLawyer ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Crear Abogado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Especialidades */}
      <Dialog open={specialtiesModalOpen} onOpenChange={setSpecialtiesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Especialidades de {selectedLawyerSpecialties?.nombre} {selectedLawyerSpecialties?.apellido}
            </DialogTitle>
            <DialogDescription>
              Lista completa de especialidades del abogado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedLawyerSpecialties?.especialidades && (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(selectedLawyerSpecialties.especialidades) &&
                typeof selectedLawyerSpecialties.especialidades[0] === 'object' &&
                'nombre' in selectedLawyerSpecialties.especialidades[0] ? (
                  (selectedLawyerSpecialties.especialidades as {id:number, nombre:string}[]).map((esp) => (
                    <Badge
                      key={esp.id}
                      variant="secondary"
                      className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                    >
                      {esp.nombre}
                    </Badge>
                  ))
                ) : (
                  (selectedLawyerSpecialties.especialidades as number[]).map((id) => (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                    >
                      {getSpecialtyName(id)}
                    </Badge>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={handleCloseSpecialtiesModal}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Perfil de Abogado */}
      {selectedLawyer && (
        <LawyerProfileModal
          lawyer={selectedLawyer}
          mode={profileModalMode}
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
};

export default AdminLawyersManagement;