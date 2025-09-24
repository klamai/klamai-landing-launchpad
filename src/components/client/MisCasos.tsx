import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  FileText, 
  Plus,
  AlertCircle,
  XCircle,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientCases } from '@/hooks/client/useClientCases';
import ClientCaseDetailModal from './CaseDetailModal';
import ClientCaseCard from './ClientCaseCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ClientMisCasos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCaso, setSelectedCaso] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: casos = [], isLoading, error, refetch } = useClientCases();

  const handleViewDetails = (caso: any) => {
    setSelectedCaso(caso);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaso(null);
  };

  const handleSendMessage = (casoId: string) => {
    navigate(`/chat?caso=${casoId}`);
  };

  const handleNewCase = () => {
    navigate('/nueva-consulta');
  };

  // Estados específicos para el cliente
  const getClientStatusBadge = (estado: string) => {
    const statusConfig = {
      'borrador': {
        label: 'En Borrador',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      },
      'disponible': {
        label: 'En Revisión',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      'asignado': {
        label: 'En Proceso',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      'esperando_pago': {
        label: 'Por Pagar',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      },
      'cerrado': {
        label: 'Finalizado',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      },
      'listo_para_propuesta': {
        label: 'Propuesta Lista',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredCasos = casos.filter(caso => {
    const matchesSearch = 
      caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.nombre_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.apellido_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.email_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.ciudad_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.especialidades?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || caso.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getDisplayData = () => {
    if (statusFilter !== 'all') {
      const statusLabel = {
        'borrador': 'En Borrador',
        'disponible': 'En Revisión',
        'asignado': 'En Proceso',
        'esperando_pago': 'Por Pagar',
        'cerrado': 'Finalizados',
        'listo_para_propuesta': 'Propuestas Listas'
      }[statusFilter] || 'Filtrados';
      
      return {
        title: `Casos ${statusLabel}`,
        description: `${filteredCasos.length} caso${filteredCasos.length !== 1 ? 's' : ''} encontrado${filteredCasos.length !== 1 ? 's' : ''}`
      };
    }

    if (searchTerm) {
      return {
        title: 'Resultados de Búsqueda',
        description: `${filteredCasos.length} caso${filteredCasos.length !== 1 ? 's' : ''} encontrado${filteredCasos.length !== 1 ? 's' : ''} para "${searchTerm}"`
      };
    }

    return {
      title: 'Mis Casos',
      description: `${casos.length} caso${casos.length !== 1 ? 's' : ''} en total`
    };
  };

  const displayData = getDisplayData();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Casos</h1>
            <p className="text-muted-foreground">Gestiona tus casos legales</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error al cargar los casos
              </h3>
              <p className="text-muted-foreground mb-4">
                {error?.message || 'Error desconocido'}
              </p>
              <Button onClick={() => refetch()}>
                Intentar de nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{displayData.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{displayData.description}</p>
        </div>
        <Button
          onClick={handleNewCase}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Consulta
        </Button>
      </motion.div>

      {/* Filtros */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-700/60 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por motivo, nombre, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 transition-all duration-300 shadow-sm"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all" className="rounded-lg">Todos los estados</SelectItem>
                  <SelectItem value="borrador" className="rounded-lg">En Borrador</SelectItem>
                  <SelectItem value="disponible" className="rounded-lg">En Revisión</SelectItem>
                  <SelectItem value="asignado" className="rounded-lg">En Proceso</SelectItem>
                  <SelectItem value="esperando_pago" className="rounded-lg">Por Pagar</SelectItem>
                  <SelectItem value="listo_para_propuesta" className="rounded-lg">Propuesta Lista</SelectItem>
                  <SelectItem value="cerrado" className="rounded-lg">Finalizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de casos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-80">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCasos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <CardContent className="p-16">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-8 mb-8 inline-block">
                  <FileText className="h-20 w-20 text-blue-600 dark:text-blue-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' ? 'No se encontraron casos' : 'No tienes casos aún'}
                </h3>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas'
                    : 'Comienza creando tu primera consulta legal y un abogado especializado se pondrá en contacto contigo'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button
                    onClick={handleNewCase}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Primera Consulta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCasos.map((caso) => (
            <ClientCaseCard
              key={caso.id}
              caso={caso}
              onViewDetails={() => handleViewDetails(caso)}
              onSendMessage={() => handleSendMessage(caso.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedCaso && (
        <ClientCaseDetailModal
          caso={selectedCaso}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ClientMisCasos; 