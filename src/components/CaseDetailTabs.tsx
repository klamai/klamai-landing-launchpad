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
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Caso, Pago } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getClientFriendlyStatus, getLawyerStatus } from "@/utils/caseDisplayUtils";

const CaseDetailTabs = () => {
  const { casoId } = useParams();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'cliente' | 'abogado' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      .select('role')
      .eq('id', user.id)
      .single();
    
    setUserRole(profile?.role || null);
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Caso #{caso.id.substring(0, 8)}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {caso.motivo_consulta || 'Sin descripción disponible'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(caso.estado)}>
              {getStatusText(caso.estado)}
            </Badge>
            {userRole === 'abogado' && (
              <Badge variant="outline" className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Vista Abogado
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Fecha de Creación</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(caso.created_at), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Costo</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {caso.costo_en_creditos} créditos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Especialidad</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {caso.especialidades?.nombre || 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
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
                  
                  {shouldShowField('guia_abogado') && caso.guia_abogado && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Guía para Abogados:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {caso.guia_abogado}
                      </p>
                    </div>
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
                        step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Tus Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No has subido documentos aún
                  </p>
                  <Button variant="outline" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Funcionalidad próximamente disponible
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Documentos del Abogado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Cuando un abogado trabaje en tu caso, los documentos aparecerán aquí
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
