
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, MessageSquare, User, Calendar, CreditCard, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import DocumentManager from '@/components/DocumentManager';
import { getClientFriendlyStatus, getLawyerStatus } from '@/utils/caseDisplayUtils';

interface CaseData {
  id: string;
  motivo_consulta: string;
  estado: string;
  created_at: string;
  costo_en_creditos: number;
  resumen_caso?: string;
  propuesta_cliente?: string;
  propuesta_estructurada?: any;
  valor_estimado?: string;
  transcripcion_chat?: any;
  especialidades?: {
    nombre: string;
  };
  cliente_id: string;
  nombre_borrador?: string;
  apellido_borrador?: string;
  email_borrador?: string;
  telefono_borrador?: string;
}

const CaseDetailTabs = () => {
  const { casoId } = useParams<{ casoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'cliente' | 'abogado' | null>(null);

  useEffect(() => {
    if (!casoId) {
      navigate('/dashboard/casos');
      return;
    }
    fetchCaseData();
    fetchUserRole();
  }, [casoId, user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    setUserRole(profile?.role || null);
  };

  const fetchCaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select(`
          *,
          especialidades (
            nombre
          )
        `)
        .eq('id', casoId)
        .single();

      if (error) {
        console.error('Error fetching case:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información del caso",
          variant: "destructive"
        });
        navigate('/dashboard/casos');
        return;
      }

      setCaseData(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando información del caso...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Caso no encontrado
        </h3>
        <Button onClick={() => navigate('/dashboard/casos')}>
          Volver a Mis Casos
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/casos')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Casos
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Caso #{caseData.id.substring(0, 8)}
            </h1>
            <Badge className={`${getStatusColor(caseData.estado)} flex items-center gap-1`}>
              {getStatusText(caseData.estado)}
            </Badge>
            <div title="Datos protegidos por RLS">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Creado el {format(new Date(caseData.created_at), 'dd MMMM yyyy', { locale: es })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="conversacion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversación
          </TabsTrigger>
          <TabsTrigger value="propuesta" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Propuesta
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Caso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Motivo de la Consulta
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {caseData.motivo_consulta}
                </p>
              </div>

              {caseData.especialidades && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Especialidad
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {caseData.especialidades.nombre}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Costo en Créditos
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {caseData.costo_en_creditos} créditos
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estado
                  </label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(caseData.estado)}>
                      {getStatusText(caseData.estado)}
                    </Badge>
                  </div>
                </div>
              </div>

              {caseData.resumen_caso && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Resumen del Caso
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                    {caseData.resumen_caso}
                  </p>
                </div>
              )}

              {caseData.valor_estimado && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Valor Estimado
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {caseData.valor_estimado}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          {(caseData.nombre_borrador || caseData.email_borrador) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {caseData.nombre_borrador && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Nombre
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {caseData.nombre_borrador} {caseData.apellido_borrador || ''}
                      </p>
                    </div>
                  )}
                  {caseData.email_borrador && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {caseData.email_borrador}
                      </p>
                    </div>
                  )}
                </div>
                {caseData.telefono_borrador && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Teléfono
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {caseData.telefono_borrador}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentManager casoId={caseData.id} />
        </TabsContent>

        <TabsContent value="conversacion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transcripción de la Conversación</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.transcripcion_chat ? (
                <div className="space-y-4">
                  {Array.isArray(caseData.transcripcion_chat) ? (
                    caseData.transcripcion_chat.map((mensaje: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {mensaje.role === 'user' ? 'Usuario' : 'VitorIA'}
                          </Badge>
                          {mensaje.timestamp && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(mensaje.timestamp), 'HH:mm', { locale: es })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                          {mensaje.content || mensaje.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      Formato de conversación no reconocido
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No hay transcripción de conversación disponible
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propuesta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Propuesta Legal</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.propuesta_cliente ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Propuesta Generada
                    </label>
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {caseData.propuesta_cliente}
                      </p>
                    </div>
                  </div>

                  {caseData.propuesta_estructurada && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Detalles Estructurados
                      </label>
                      <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {JSON.stringify(caseData.propuesta_estructurada, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {caseData.estado === 'borrador' 
                      ? 'La propuesta se generará cuando completes la conversación'
                      : 'No hay propuesta disponible para este caso'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CaseDetailTabs;
