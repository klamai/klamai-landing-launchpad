import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Upload, 
  MessageCircle, 
  Calendar, 
  CreditCard,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  GavelIcon,
  Shield,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Caso, Pago } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getClientFriendlyStatus, getLawyerStatus } from "@/utils/caseDisplayUtils";
import DocumentManager from "@/components/DocumentManager";
import ClientDocumentManager from "@/components/ClientDocumentManager";
import LawyerDocumentViewer from "@/components/LawyerDocumentViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CaseDetailTabs = () => {
  const { casoId } = useParams();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'cliente' | 'abogado' | null>(null);
  const [lawyerType, setLawyerType] = useState<'regular' | 'super_admin' | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAssignedLawyer, setIsAssignedLawyer] = useState(false);

  useEffect(() => {
    if (casoId && user) {
      fetchUserRole();
      fetchCasoDetails();
      fetchPagos();
    }
  }, [casoId, user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single();
    
    setUserRole(profile?.role || null);
    setLawyerType(profile?.tipo_abogado || null);
    setIsSuperAdmin(profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin');
  };

  const fetchCasoDetails = async () => {
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
        console.error('Error fetching caso:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el detalle del caso",
          variant: "destructive",
        });
        return;
      }

      setCaso(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPagos = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pagos:', error);
        return;
      }

      setPagos(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      case 'esperando_pago':
        return 'bg-yellow-100 text-yellow-800';
      case 'disponible':
        return 'bg-blue-100 text-blue-800';
      case 'agotado':
        return 'bg-orange-100 text-orange-800';
      case 'cerrado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getTimelineSteps = (estado: string) => {
    if (userRole === 'cliente') {
      // Timeline simplificado para clientes
      const steps = [
        { id: 'creado', label: 'Consulta Creada', completed: true },
        { id: 'esperando_pago', label: 'Pendiente de Pago', completed: estado !== 'borrador' },
        { id: 'disponible', label: 'En Revisión', completed: ['disponible', 'agotado', 'cerrado'].includes(estado) },
        { id: 'cerrado', label: 'Finalizado', completed: estado === 'cerrado' }
      ];
      return steps;
    } else {
      // Timeline completo para abogados
      const steps = [
        { id: 'creado', label: 'Caso Creado', completed: true },
        { id: 'esperando_pago', label: 'Esperando Pago', completed: estado !== 'borrador' },
        { id: 'disponible', label: 'Disponible para Abogados', completed: ['disponible', 'agotado', 'cerrado', 'listo_para_propuesta'].includes(estado) },
        { id: 'listo_para_propuesta', label: 'Listo para Propuesta', completed: ['listo_para_propuesta', 'cerrado'].includes(estado) },
        { id: 'cerrado', label: 'Caso Cerrado', completed: estado === 'cerrado' }
      ];
      return steps;
    }
  };

  const shouldShowField = (fieldName: string) => {
    if (userRole === 'abogado') return true;
    
    const lawyerOnlyFields = ['guia_abogado', 'propuesta_estructurada', 'transcripcion_chat', 'propuesta_cliente', 'valor_estimado'];
    return !lawyerOnlyFields.includes(fieldName);
  };

  const handlePagarConsulta = async () => {
    if (!casoId) return;
    
    try {
      toast({
        title: "Procesando pago",
        description: "Creando sesión de pago...",
      });

      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: 'consulta-estrategica',
          caso_id: casoId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      toast({
        title: "Error en el pago",
        description: error instanceof Error ? error.message : "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const shouldShowPaymentButton = () => {
    return userRole === 'cliente' && caso && ['listo_para_propuesta', 'esperando_pago'].includes(caso.estado);
  };

  const getPaymentButtonText = () => {
    if (!caso) return 'Pagar';
    
    switch (caso.estado) {
      case 'listo_para_propuesta':
        return 'Pagar Consulta Estratégica';
      case 'esperando_pago':
        return 'Completar Pago';
      default:
        return 'Pagar';
    }
  };

  // Acción para cerrar el caso usando Edge Function
  const handleCerrarCaso = async () => {
    if (!casoId) return;
    setIsClosing(true);
    try {
      const { data, error } = await supabase.functions.invoke('close-case', {
        body: { caso_id: casoId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: 'Caso cerrado',
          description: data.data.mensaje || 'El caso ha sido cerrado exitosamente.',
        });
        fetchCasoDetails(); // Refrescar datos
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error cerrando caso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cerrar el caso',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
    }
  };

  // Verificar si el abogado está asignado al caso
  useEffect(() => {
    const checkAssignment = async () => {
      if (!user || userRole !== 'abogado' || lawyerType !== 'regular') return;
      
      const { data: asignacion } = await supabase
        .from('asignaciones_casos')
        .select('estado_asignacion')
        .eq('caso_id', casoId)
        .eq('abogado_id', user.id)
        .eq('estado_asignacion', 'activa')
        .single();
      
      setIsAssignedLawyer(!!asignacion);
    };

    checkAssignment();
  }, [user, userRole, lawyerType, casoId]);

  // Determinar si el usuario puede cerrar el caso
  const canCloseCase = () => {
    if (!user || !caso) return false;
    
    // No se puede cerrar si ya está cerrado
    if (caso.estado === 'cerrado') return false;
    
    // Super admin puede cerrar cualquier caso
    if (userRole === 'abogado' && lawyerType === 'super_admin') return true;
    
    // Abogado regular puede cerrar casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando detalles del caso...</p>
        </div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">No se pudo encontrar el caso</p>
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
      {/* Header con información del caso y botón de pago/cerrar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Caso #{casoId?.substring(0, 8)}
            </h1>
                {caso && (
                  <Badge className={`${getStatusColor(caso.estado)} flex items-center gap-1`}>
              {getStatusText(caso.estado)}
              </Badge>
            )}
              </div>
              
              {caso && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {caso.motivo_consulta || 'Sin descripción disponible'}
                  </p>
              )}
              </div>
            
            {/* Botón de pago prominente */}
            {shouldShowPaymentButton() && (
              <Button
                onClick={handlePagarConsulta}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                size="lg"
              >
                <CreditCard className="h-5 w-5" />
                {getPaymentButtonText()}
              </Button>
            )}
            {/* Botón de cerrar caso solo para super admin y si el caso no está cerrado */}
            {canCloseCase() && (
              <Button
                onClick={handleCerrarCaso}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 ml-4"
                size="lg"
                disabled={isClosing}
              >
                <ShieldCheck className="h-5 w-5" />
                {isClosing ? 'Cerrando...' : 'Cerrar Caso'}
              </Button>
            )}
              </div>
            </CardContent>
          </Card>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className={`grid w-full ${userRole === 'abogado' ? 'grid-cols-5' : 'grid-cols-5'}`}>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="documentos">
            {userRole === 'cliente' ? 'Mis Documentos' : 'Documentos Cliente'}
          </TabsTrigger>
          {userRole === 'abogado' ? (
            <TabsTrigger value="resoluciones">Resoluciones</TabsTrigger>
          ) : (
            <TabsTrigger value="documentos-abogado">Documentos del Abogado</TabsTrigger>
          )}
          <TabsTrigger value="interacciones">Interacciones</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {userRole === 'abogado' ? 'Análisis Completo del Caso' : 'Resumen del Caso'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Descripción:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {caso.motivo_consulta || 'Sin descripción disponible'}
                    </p>
                  </div>
                  
                  {shouldShowField('resumen_caso') && caso.resumen_caso && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Análisis del Caso:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {caso.resumen_caso}
                      </p>
                    </div>
                  )}
                  
                  {/* Sección dedicada para la Guía del Abogado - FUERA de la tarjeta de información */}
                  {userRole === 'abogado' && caso.guia_abogado && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                          Guía para el Abogado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-slate bg-gray-50 max-w-none dark:prose-invert dark:bg-gray-800 p-5 rounded text-sm border border-gray-200 dark:border-gray-700 overflow-hidden">                        
                          <ScrollArea className="h-64">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {caso.guia_abogado}
                            </ReactMarkdown>
                          </ScrollArea>
                    </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {shouldShowField('propuesta_cliente') && caso.propuesta_cliente && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Propuesta del Cliente:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {caso.propuesta_cliente}
                      </p>
                    </div>
                  )}
                  
                  {shouldShowField('valor_estimado') && caso.valor_estimado && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Valor Estimado:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {caso.valor_estimado}
                      </p>
                    </div>
                  )}
                  
                  {!shouldShowField('resumen_caso') && !caso.resumen_caso && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userRole === 'cliente' 
                        ? 'Tu caso está siendo analizado por nuestros expertos.'
                        : 'El análisis será generado cuando el caso sea procesado por nuestros expertos.'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Estado del Caso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTimelineSteps(caso.estado).map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          step.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          {userRole === 'cliente' ? (
            <ClientDocumentManager casoId={casoId!} />
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documentos del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientDocumentManager casoId={casoId!} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {userRole === 'abogado' ? (
          <TabsContent value="resoluciones" className="space-y-4">
            <DocumentManager 
              casoId={casoId!} 
              readOnly={false} 
            />
          </TabsContent>
        ) : (
          <TabsContent value="documentos-abogado" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GavelIcon className="h-5 w-5 text-green-600" />
                  Documentos del Abogado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Documentos oficiales:</strong> Aquí encontrarás todas las resoluciones, dictámenes e informes que el abogado ha preparado para tu caso.
                  </p>
                </div>
                <LawyerDocumentViewer casoId={casoId!} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="interacciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Historial de Interacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {caso.transcripcion_chat ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Chat Inicial con IA
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Conversación completada el {format(new Date(caso.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        La transcripción completa del chat estará disponible próximamente.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay interacciones registradas para este caso
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Historial de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pagos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>
                          {format(new Date(pago.created_at), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>{pago.descripcion}</TableCell>
                        <TableCell>€{(pago.monto / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={pago.estado === 'succeeded' ? 'default' : 'secondary'}>
                            {pago.estado === 'succeeded' ? 'Completado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay pagos registrados para este caso
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
