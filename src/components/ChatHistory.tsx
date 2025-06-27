
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, MessageCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ChatSession {
  id: string;
  session_id: string;
  timestamp: string;
  message: string;
  response: string | null;
}

interface ChatHistoryProps {
  onSelectSession?: (sessionId: string) => void;
}

const ChatHistory = ({ onSelectSession }: ChatHistoryProps) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }

      setChatSessions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const grouped: { [key: string]: ChatSession[] } = {};
    
    sessions.forEach(session => {
      const date = format(new Date(session.timestamp), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    return grouped;
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Consultas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Cargando historial...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedSessions = groupSessionsByDate(chatSessions);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Consultas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-4">
          {Object.keys(groupedSessions).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">
                No hay consultas anteriores
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSessions).map(([date, sessions]) => (
                <div key={date} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {format(new Date(date), 'dd MMM yyyy')}
                  </div>
                  {sessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => onSelectSession?.(session.session_id)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <MessageCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium line-clamp-2">
                            {truncateMessage(session.message)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(session.timestamp), 'HH:mm')}
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
