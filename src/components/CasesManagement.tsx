import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText,
  Clock,
  Euro,
  AlertCircle
} from 'lucide-react';
import AddManualCaseModal from './AddManualCaseModal';

interface Caso {
  id: string;
  motivo_consulta: string;
  estado: string;
  tipo_lead: string;
  canal_atencion: string;
  created_at: string;
  nombre_borrador: string;
  apellido_borrador: string;
  email_borrador: string;
  telefono_borrador: string;
  ciudad_borrador: string;
  tipo_perfil_borrador: string;
  razon_social_borrador: string;
  valor_estimado: string;
  especialidades: {
    nombre: string;
  };
}

interface Especialidad {
  id: number;
  nombre: string;
}

const CasesManagement: React.FC = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipoLead, setFilterTipoLead] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCasos();
    fetchEspecialidades();
  }, []);

  const fetchCasos = async () => {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select(`
          *,
          especialidades (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCasos(data || []);
    } catch (error) {
      console.error('Error fetching casos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los casos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setEspecialidades(data || []);
    } catch (error) {
      console.error('Error fetching especialidades:', error);
    }
  };

  const handleAddSuccess = () => {
    fetchCasos();
    toast({
      title: "¡Éxito!",
      description: "Caso añadido correctamente",
    });
  };

  const filteredCasos = casos.filter(caso => {
    const matchesSearch = 
      caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.nombre_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.apellido_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.email_borrador?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'all' || caso.estado === filterEstado;
    const matchesTipoLead = filterTipoLead === 'all' || caso.tipo_lead === filterTipoLead;
    
    return matchesSearch && matchesEstado && matchesTipoLead;
  });

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-100 text-gray-800';
      case 'disponible': return 'bg-blue-100 text-blue-800';
      case 'asignado': return 'bg-yellow-100 text-yellow-800';
      case 'en_progreso': return 'bg-orange-100 text-orange-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'listo_para_propuesta': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLeadBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'premium': return 'bg-gold-100 text-gold-800 border-gold-200';
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200';
      case 'estandar': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Casos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra y supervisa todos los casos del sistema
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Añadir Caso
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar casos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="listo_para_propuesta">Listo para Propuesta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTipoLead} onValueChange={setFilterTipoLead}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="estandar">Estándar</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setFilterEstado('all');
                setFilterTipoLead('all');
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Casos</p>
                <p className="text-2xl font-bold">{casos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold">
                  {casos.filter(c => ['borrador', 'disponible'].includes(c.estado)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold">
                  {casos.filter(c => c.tipo_lead === 'urgente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Premium</p>
                <p className="text-2xl font-bold">
                  {casos.filter(c => c.tipo_lead === 'premium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      <div className="grid gap-4">
        {filteredCasos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron casos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterEstado !== 'all' || filterTipoLead !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza añadiendo tu primer caso'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCasos.map((caso) => (
            <Card key={caso.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {caso.motivo_consulta || 'Sin motivo especificado'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {new Date(caso.created_at).toLocaleDateString('es-ES')}
                      <span>•</span>
                      <span className="capitalize">{caso.canal_atencion?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getEstadoBadgeColor(caso.estado)}>
                      {caso.estado?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getTipoLeadBadgeColor(caso.tipo_lead)}>
                      {caso.tipo_lead}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Cliente Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      Información del Cliente
                    </h4>
                    <div className="space-y-1 text-sm">
                      {caso.nombre_borrador && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <span>{caso.nombre_borrador} {caso.apellido_borrador}</span>
                        </div>
                      )}
                      {caso.email_borrador && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{caso.email_borrador}</span>
                        </div>
                      )}
                      {caso.telefono_borrador && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{caso.telefono_borrador}</span>
                        </div>
                      )}
                      {caso.ciudad_borrador && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{caso.ciudad_borrador}</span>
                        </div>
                      )}
                      {caso.tipo_perfil_borrador === 'empresa' && caso.razon_social_borrador && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{caso.razon_social_borrador}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Case Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      Detalles del Caso
                    </h4>
                    <div className="space-y-1 text-sm">
                      {caso.especialidades?.nombre && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Especialidad:</span>
                          <span className="ml-1 font-medium">{caso.especialidades.nombre}</span>
                        </div>
                      )}
                      {caso.valor_estimado && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Valor estimado:</span>
                          <span className="ml-1 font-medium text-green-600">{caso.valor_estimado}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Tipo de cliente:</span>
                        <span className="ml-1 font-medium capitalize">
                          {caso.tipo_perfil_borrador || 'No especificado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      Acciones
                    </h4>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <Eye className="h-3 w-3 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Manual Case Modal */}
      <AddManualCaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default CasesManagement;
