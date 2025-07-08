
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { filterCaseForClient } from "@/utils/caseDisplayUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, MessageCircle, ChevronRight, FileText, Scale, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Caso } from "@/types/database";

interface ChatHistoryProps {
  onSelectSession?: (sessionId: string) => void;
}

const ChatHistory = ({ onSelectSession }: ChatHistoryProps) => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCasos();
  }, [user]);

  const fetchCasos = async () => {
    if (!user) {
      setCasos([]);
      setLoading(false);
      return;
    }

    try {
      // Obtener el perfil del usuario para conocer su rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.error('No se encontró el perfil del usuario');
        setCasos([]);
        setLoading(false);
        return;
      }

      // Query base para casos
      let query = supabase
        .from('casos')
        .select(`
          *,
          especialidades (
            nombre
          )
        `);

      // Filtrar estrictamente según el rol
      if (profile.role === 'cliente') {
        // Los clientes SOLO ven sus propios casos
        query = query.eq('cliente_id', user.id);
      } else if (profile.role === 'abogado') {
        // Los abogados ven casos disponibles y casos que han comprado
        // Primero obtener los casos que ha comprado este abogado
        const { data: casosComprados } = await supabase
          .from('casos_comprados')
          .select('caso_id')
          .eq('abogado_id', user.id);

        const casoIdsComprados = casosComprados?.map(c => c.caso_id) || [];
        
        if (casoIdsComprados.length > 0) {
          // Casos disponibles O casos que ha comprado
          query = query.or(`estado.in.(disponible,agotado),id.in.(${casoIdsComprados.join(',')})`);
        } else {
          // Solo casos disponibles si no ha comprado ninguno
          query = query.in('estado', ['disponible', 'agotado']);
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching casos:', error);
        setCasos([]);
        return;
      }

      // Convertir los datos a la estructura esperada
      let processedCasos: Caso[] = (data || []).map(caso => ({
        ...caso,
        especialidades: caso.especialidades || undefined
      }));
      
      if (profile.role === 'cliente') {
        // Para clientes, filtrar campos sensibles
        processedCasos = processedCasos.map(caso => filterCaseForClient(caso));
      }

      setCasos(processedCasos);
    } catch (error) {
      console.error('Error:', error);
      setCasos([]);
    } finally {
      setLoading(false);
    }
  };

  const groupCasosByDate = (casos: Caso[]) => {
    const grouped: { [key: string]: Caso[] } = {};
    
    casos.forEach(caso => {
      const date = format(new Date(caso.created_at), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(caso);
    });

    return grouped;
  };

  const truncateText = (text: string | null | undefined, maxLength: number = 60) => {
    if (!text) return 'Sin descripción';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'esperando_pago':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800/30';
      case 'disponible':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/30';
      case 'agotado':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/30';
      case 'cerrado':
        return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'Borrador';
      case 'esperando_pago':
        return 'Esperando Pago';
      case 'disponible':
        return 'Disponible';
      case 'agotado':
        return 'Agotado';
      case 'cerrado':
        return 'Cerrado';
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 text-slate-900 dark:text-white p-6 flex flex-col border-r border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <History className="h-5 w-5 text-slate-700 dark:text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900 dark:text-white">Mis Consultas</span>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  const groupedCasos = groupCasosByDate(casos);

  return (
    <div className="h-full bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 text-slate-900 dark:text-white p-6 flex flex-col border-r border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <History className="h-5 w-5 text-slate-700 dark:text-white" />
        </div>
        <span className="text-lg font-semibold text-slate-900 dark:text-white">Mis Consultas</span>
      </div>

      {Object.keys(groupedCasos).length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              No hay consultas anteriores
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Inicia tu primera consulta legal
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {Object.entries(groupedCasos).map(([date, casosDelDia]) => (
              <div key={date} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  {format(new Date(date), 'dd MMM yyyy', { locale: es })}
                </div>
                
                {/* Cases for this date */}
                <div className="space-y-2">
                  {casosDelDia.map((caso) => (
                    <button
                      key={caso.id}
                      onClick={() => onSelectSession?.(caso.id)}
                      className="w-full bg-white/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-xl p-4 text-left transition-all duration-200 group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30 transition-colors border border-blue-200 dark:border-blue-500/30">
                          <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Title */}
                          <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-100 transition-colors">
                            {truncateText(caso.motivo_consulta)}
                          </div>
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(caso.created_at), 'HH:mm')}
                            </span>
                            
                            {caso.especialidades && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {caso.especialidades.nombre}
                              </span>
                            )}
                            
                            <span className="text-blue-600 dark:text-blue-300 font-medium">
                              {caso.costo_en_creditos} créditos
                            </span>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(caso.estado)}`}>
                              {getStatusText(caso.estado)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ChatHistory;
