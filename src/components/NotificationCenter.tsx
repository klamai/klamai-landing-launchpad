
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notificacion {
  id: string;
  mensaje: string;
  leida: boolean;
  url_destino: string | null;
  created_at: string;
}

const NotificationCenter = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotificaciones();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchNotificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotificaciones(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user?.id}`,
        },
        (payload) => {
          setNotificaciones(prev => [payload.new as Notificacion, ...prev]);
          toast({
            title: "Nueva notificación",
            description: (payload.new as Notificacion).mensaje,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const marcarComoLeida = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotificaciones(prev => 
        prev.map(n => n.id === notificationId ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarNotificacion = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      setNotificaciones(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: "Notificación eliminada",
        description: "La notificación se ha eliminado correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNotificationClick = (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
    
    if (notificacion.url_destino) {
      navigate(notificacion.url_destino);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('leida', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones se han marcado como leídas",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando notificaciones...</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Notificaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Mantente al día con las actualizaciones de tus casos
          </p>
        </div>
        {notificacionesNoLeidas > 0 && (
          <Button
            variant="outline"
            onClick={marcarTodasComoLeidas}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Estadística de notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-white">
                  {notificaciones.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">No Leídas</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-white">
                  {notificacionesNoLeidas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Leídas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-white">
                  {notificaciones.length - notificacionesNoLeidas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Todas las Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tienes notificaciones
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Cuando tengas actualizaciones en tus casos, aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notificaciones.map((notificacion, index) => (
                  <motion.div
                    key={notificacion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notificacion.leida ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notificacion)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {!notificacion.leida && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <p className={`text-sm ${
                            !notificacion.leida 
                              ? 'font-semibold text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {notificacion.mensaje}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(notificacion.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notificacion.leida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLeida(notificacion.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNotificacion(notificacion.id);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationCenter;
