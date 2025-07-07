import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  FolderOpen, 
  Search, 
  Calendar, 
  CreditCard,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Caso } from "@/types/database";
import { useCasesByRole } from "@/hooks/useCasesByRole";
import { useAuth } from "@/hooks/useAuth";
import { getClientFriendlyStatus, getLawyerStatus } from "@/utils/caseDisplayUtils";

const MisCasos = () => {
  const { casos, loading } = useCasesByRole();
  const [filteredCasos, setFilteredCasos] = useState<Caso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'cliente' | 'abogado' | null>(null);

  // Obtener el rol del usuario
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setUserRole(profile?.role || null);
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    filterCasos();
  }, [casos, searchTerm, filterStatus]);

  const filterCasos = () => {
    let filtered = casos;

    if (searchTerm) {
      filtered = filtered.filter(caso => 
        caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caso.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "todos") {
      filtered = filtered.filter(caso => caso.estado === filterStatus);
    }

    setFilteredCasos(filtered);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'esperando_pago':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disponible':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agotado':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cerrado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'listo_para_propuesta':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (estado: string) => {
    if (userRole === 'cliente') {
      return getClientFriendlyStatus(estado);
    } else if (userRole === 'abogado') {
      return getLawyerStatus(estado);
    }
    return estado;
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return <Clock className="h-4 w-4" />;
      case 'esperando_pago':
        return <AlertCircle className="h-4 w-4" />;
      case 'disponible':
        return <Eye className="h-4 w-4" />;
      case 'agotado':
        return <AlertCircle className="h-4 w-4" />;
      case 'cerrado':
        return <CheckCircle className="h-4 w-4" />;
      case 'listo_para_propuesta':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleVerCaso = (casoId: string) => {
    navigate(`/dashboard/casos/${casoId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando tus casos...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {userRole === 'abogado' ? 'Casos Disponibles' : 'Mis Casos'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {userRole === 'abogado' 
            ? 'Casos disponibles para comprar y casos que has adquirido'
            : 'Gestiona y monitorea todos tus casos legales'
          }
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { 
            title: "Total de Casos", 
            value: casos.length.toString(), 
            color: "bg-blue-500",
            textColor: "text-blue-600"
          },
          { 
            title: "Casos Activos", 
            value: casos.filter(c => ['disponible', 'esperando_pago'].includes(c.estado)).length.toString(), 
            color: "bg-green-500",
            textColor: "text-green-600"
          },
          { 
            title: "Casos Cerrados", 
            value: casos.filter(c => c.estado === 'cerrado').length.toString(), 
            color: "bg-purple-500",
            textColor: "text-purple-600"
          },
          { 
            title: "Pendientes de Pago", 
            value: casos.filter(c => c.estado === 'esperando_pago').length.toString(), 
            color: "bg-orange-500",
            textColor: "text-orange-600"
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700"
          >
            <div className="flex items-center">
              <div className={`${stat.color} h-3 w-3 rounded-full mr-3`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor} dark:text-white`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por motivo o ID del caso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="esperando_pago">Esperando Pago</option>
            <option value="disponible">Disponible</option>
            <option value="agotado">Agotado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      {/* Lista de casos */}
      {filteredCasos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {casos.length === 0 ? "No tienes casos aún" : "No se encontraron casos"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {casos.length === 0 
                ? (userRole === 'abogado' 
                    ? "No hay casos disponibles en este momento"
                    : "Inicia tu primera consulta legal para ver tus casos aquí")
                : "Intenta con otros términos de búsqueda o filtros"
              }
            </p>
            {casos.length === 0 && userRole === 'cliente' && (
              <Button onClick={() => navigate('/dashboard/nueva-consulta')}>
                Iniciar Nueva Consulta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCasos.map((caso, index) => (
            <motion.div
              key={caso.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Caso #{caso.id.substring(0, 8)}
                        </h3>
                        <Badge className={`${getStatusColor(caso.estado)} flex items-center gap-1`}>
                          {getStatusIcon(caso.estado)}
                          {getStatusText(caso.estado)}
                        </Badge>
                        {caso.tiene_notificaciones_nuevas && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {caso.motivo_consulta || 'Sin descripción disponible'}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(caso.created_at), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {caso.costo_en_creditos} créditos
                        </div>
                        {caso.especialidades && (
                          <div className="flex items-center gap-1">
                            <span>{caso.especialidades.nombre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerCaso(caso.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {userRole === 'abogado' ? 'Ver/Comprar' : 'Ver Detalle'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MisCasos;
