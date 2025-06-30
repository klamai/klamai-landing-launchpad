
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, MessageCircle, ChevronRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Caso } from "@/types/database";

interface ChatHistoryProps {
  onSelectSession?: (sessionId: string) => void;
}

const ChatHistory = ({ onSelectSession }: ChatHistoryProps) => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCasos();
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
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching casos:', error);
        return;
      }

      setCasos(data || []);
    } catch (error) {
      console.error('Error:', error);
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
        return 'text-gray-500';
      case 'esperando_pago':
        return 'text-yellow-600';
      case 'disponible':
        return 'text-blue-600';
      case 'agotado':
        return 'text-orange-600';
      case 'cerrado':
        return 'text-green-600';
      default:
        return 'text-gray-500';
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
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Mis Consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Cargando consultas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedCasos = groupCasosByDate(casos);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Mis Consultas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-4">
          {Object.keys(groupedCasos).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">
                No tienes consultas anteriores
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Inicia tu primera consulta legal
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCasos).map(([date, casosDelDia]) => (
                <div key={date} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {format(new Date(date), 'dd MMM yyyy', { locale: es })}
                  </div>
                  {casosDelDia.map((caso) => (
                    <Button
                      key={caso.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => onSelectSession?.(caso.id)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <MessageCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium line-clamp-2">
                            {truncateText(caso.motivo_consulta)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(caso.created_at), 'HH:mm')}
                            </div>
                            {caso.especialidades && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <div className="text-xs text-blue-600">
                                  {caso.especialidades.nombre}
                                </div>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground">•</span>
                            <div className="text-xs text-muted-foreground">
                              {caso.costo_en_creditos} créditos
                            </div>
                          </div>
                          <div className={`text-xs font-medium mt-1 ${getStatusColor(caso.estado)}`}>
                            {getStatusText(caso.estado)}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatHistory;
