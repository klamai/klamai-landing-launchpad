import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  MessageSquare,
  Euro,
  MapPin,
  Calendar,
  User,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { useClientCases } from '@/hooks/useClientCases';
import ClientCaseDetailModal from './CaseDetailModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ClientMisCasos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCaso, setSelectedCaso] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { casos, loading, error, refetch } = useClientCases();

  // Convertir a zona horaria de España
  const spainTimeZone = 'Europe/Madrid';

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { 
        label: 'Disponible', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      'agotado': { 
        label: 'Agotado', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
      'cerrado': { 
        label: 'Cerrado', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      },
      'esperando_pago': { 
        label: 'Esperando Pago', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'agotado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cerrado':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'esperando_pago':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
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

  const handleViewDetails = (caso: any) => {
    setSelectedCaso(caso);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaso(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar los casos</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Casos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y revisa el estado de tus casos legales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refetch} variant="outline" size="sm">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por motivo, nombre, email, ciudad o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                  <SelectItem value="esperando_pago">Esperando Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de casos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCasos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCasos.map((caso) => {
            const casoDate = toZonedTime(new Date(caso.created_at), spainTimeZone);
            
            return (
              <motion.div
                key={caso.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {caso.motivo_consulta || 'Sin motivo especificado'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          #{caso.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {getStatusIcon(caso.estado)}
                        {getStatusBadge(caso.estado)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Información del cliente */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {caso.nombre_borrador} {caso.apellido_borrador}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{caso.email_borrador}</span>
                      </div>

                      {/* Ciudad */}
                      {caso.ciudad_borrador && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{caso.ciudad_borrador}</span>
                        </div>
                      )}

                      {/* Valor estimado */}
                      {caso.valor_estimado && (
                        <div className="flex items-center gap-2 text-sm">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-blue-600">
                            {caso.valor_estimado}
                          </span>
                        </div>
                      )}

                      {/* Especialidad */}
                      {caso.especialidades?.nombre && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{caso.especialidades.nombre}</span>
                        </div>
                      )}

                      {/* Fecha */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(casoDate, 'dd/MM/yyyy', { locale: es })}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(casoDate, { locale: es, addSuffix: true })})
                        </span>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleViewDetails(caso)}
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron casos' : 'No tienes casos aún'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Cuando crees un caso, aparecerá aquí'
              }
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                variant="outline"
              >
                Limpiar filtros
              </Button>
            ) : (
              <Button onClick={() => navigate('/nueva-consulta')} variant="outline">
                Crear nuevo caso
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles */}
      <ClientCaseDetailModal
        caso={selectedCaso}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ClientMisCasos; 