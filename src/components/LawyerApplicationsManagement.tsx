import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Tipo que coincide exactamente con lo que devuelve Supabase
interface SolicitudAbogadoFromDB {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  colegio_profesional?: string;
  numero_colegiado?: string;
  especialidades?: number[];
  experiencia_anos?: number;
  cv_url?: string;
  carta_motivacion?: string;
  documentos_verificacion?: any;
  estado: string; // Supabase devuelve string genérico
  motivo_rechazo?: string;
  revisado_por?: string;
  fecha_revision?: string;
  notas_admin?: string;
  acepta_politicas: boolean;
  acepta_comunicacion: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo para el resultado de la función automatizada
interface AutomatedApprovalResult {
  success: boolean;
  solicitud_id: string;
  email: string;
  nombre: string;
  apellido: string;
  activation_token: string;
  temp_password: string;
}

const LawyerApplicationsManagement = () => {
  const [applications, setApplications] = useState<SolicitudAbogadoFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<SolicitudAbogadoFromDB | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const [especialidades, setEspecialidades] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchApplications();
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    const { data } = await supabase
      .from('especialidades')
      .select('*');
    
    if (data) {
      const espMap = data.reduce((acc, esp) => {
        acc[esp.id] = esp.nombre;
        return acc;
      }, {} as {[key: number]: string});
      setEspecialidades(espMap);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_abogado')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Error al cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAutomated = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      console.log('Iniciando aprobación automatizada para:', applicationId);
      
      // Usar llamada directa a la función RPC con casting de tipos
      const { data, error } = await (supabase as any).rpc('aprobar_solicitud_abogado_automatizado', {
        p_solicitud_id: applicationId,
        p_notas_admin: adminNotes || null
      });

      if (error) {
        console.error('Error en RPC:', error);
        throw error;
      }

      console.log('Resultado de aprobación automatizada:', data);

      // Enviar email de aprobación a través del Edge Function
      if (data && (data as AutomatedApprovalResult).success) {
        try {
          const result = data as AutomatedApprovalResult;
          
          // Corregir la estructura del payload para que coincida con el Edge Function
          const emailResponse = await supabase.functions.invoke('send-lawyer-approval-email', {
            body: {
              tipo: 'aprobacion',
              email: result.email,
              nombre: result.nombre,
              apellido: result.apellido,
              credenciales: {
                email: result.email,
                password: result.temp_password, // Mapear temp_password a password
                activationToken: result.activation_token
              }
            }
          });

          if (emailResponse.error) {
            console.error('Error enviando email:', emailResponse.error);
            // No fallar la operación por error de email
          } else {
            console.log('Email de aprobación enviado exitosamente');
          }
        } catch (emailError) {
          console.error('Error enviando email de aprobación:', emailError);
          // No fallar la operación por error de email
        }
      }

      toast({
        title: "¡Solicitud aprobada!",
        description: "Se ha creado la cuenta del abogado y enviado las credenciales por email",
      });

      fetchApplications();
      setSelectedApp(null);
      setAdminNotes("");
    } catch (error: any) {
      console.error('Error en aprobación automatizada:', error);
      toast({
        title: "Error",
        description: error.message || "Error al aprobar la solicitud",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(applicationId);
    try {
      const { error } = await supabase.rpc('rechazar_solicitud_abogado', {
        p_solicitud_id: applicationId,
        p_motivo_rechazo: rejectionReason,
        p_notas_admin: adminNotes || null
      });

      if (error) throw error;

      // Enviar email de rechazo
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        try {
          await supabase.functions.invoke('send-lawyer-approval-email', {
            body: {
              tipo: 'rechazo',
              email: app.email,
              nombre: app.nombre,
              apellido: app.apellido,
              motivoRechazo: rejectionReason
            }
          });
          console.log('Email de rechazo enviado');
        } catch (emailError) {
          console.error('Error enviando email de rechazo:', emailError);
          // No fallar la operación por error de email
        }
      }

      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada y se ha notificado al solicitante",
      });

      fetchApplications();
      setSelectedApp(null);
      setRejectionReason("");
      setAdminNotes("");
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: error.message || "Error al rechazar la solicitud",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'en_revision':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />En Revisión</Badge>;
      case 'aprobada':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Solicitudes de Abogados
        </h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredApplications.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {app.nombre} {app.apellido}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {app.email}
                    </div>
                    {app.telefono && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {app.telefono}
                      </div>
                    )}
                    {app.experiencia_anos && (
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-1" />
                        {app.experiencia_anos} años
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(app.estado)}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Solicitud de {app.nombre} {app.apellido}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Información Personal</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Nombre:</strong> {app.nombre} {app.apellido}</p>
                              <p><strong>Email:</strong> {app.email}</p>
                              {app.telefono && <p><strong>Teléfono:</strong> {app.telefono}</p>}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Información Profesional</h4>
                            <div className="space-y-1 text-sm">
                              {app.colegio_profesional && <p><strong>Colegio:</strong> {app.colegio_profesional}</p>}
                              {app.numero_colegiado && <p><strong>Nº Colegiado:</strong> {app.numero_colegiado}</p>}
                              {app.experiencia_anos && <p><strong>Experiencia:</strong> {app.experiencia_anos} años</p>}
                            </div>
                          </div>
                        </div>

                        {app.especialidades && app.especialidades.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Especialidades</h4>
                            <div className="flex flex-wrap gap-2">
                              {app.especialidades.map((espId) => (
                                <Badge key={espId} variant="outline">
                                  {especialidades[espId] || `ID: ${espId}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.carta_motivacion && (
                          <div>
                            <h4 className="font-semibold mb-2">Carta de Motivación</h4>
                            <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              {app.carta_motivacion}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-2">Estado y Acciones</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span>Estado actual:</span>
                              {getStatusBadge(app.estado)}
                            </div>

                            {app.estado === 'pendiente' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium mb-1">
                                    Notas administrativas (opcional)
                                  </label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Agregar notas internas..."
                                    rows={3}
                                  />
                                </div>

                                <div className="space-y-3">
                                  <Button
                                    onClick={() => handleApproveAutomated(app.id)}
                                    disabled={actionLoading === app.id}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    {actionLoading === app.id ? (
                                      <div className="flex items-center">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Procesando aprobación...
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Aprobar y Crear Cuenta
                                      </div>
                                    )}
                                  </Button>
                                  
                                  <div className="space-y-2">
                                    <Input
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Motivo de rechazo..."
                                    />
                                    <Button
                                      onClick={() => handleReject(app.id)}
                                      disabled={actionLoading === app.id || !rejectionReason.trim()}
                                      variant="destructive"
                                      className="w-full"
                                    >
                                      {actionLoading === app.id ? (
                                        <div className="flex items-center">
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                          Procesando...
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Rechazar y Notificar
                                        </div>
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                  <p className="text-xs text-blue-700 dark:text-blue-300">
                                    <strong>💡 Proceso automatizado:</strong> Al aprobar se creará automáticamente la cuenta del abogado y se enviarán las credenciales por email.
                                  </p>
                                </div>
                              </div>
                            )}

                            {app.estado === 'rechazada' && app.motivo_rechazo && (
                              <div>
                                <h5 className="font-medium text-red-700 dark:text-red-300">Motivo de rechazo:</h5>
                                <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                  {app.motivo_rechazo}
                                </p>
                              </div>
                            )}

                            {app.notas_admin && (
                              <div>
                                <h5 className="font-medium">Notas administrativas:</h5>
                                <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                  {app.notas_admin}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                  {app.especialidades && app.especialidades.length > 0 && (
                    <div>
                      <strong>Especialidades:</strong> {app.especialidades.slice(0, 2).map(id => especialidades[id]).join(', ')}
                      {app.especialidades.length > 2 && ` +${app.especialidades.length - 2} más`}
                    </div>
                  )}
                </div>
                
                {app.estado === 'pendiente' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveAutomated(app.id)}
                      disabled={actionLoading === app.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay solicitudes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? "No se encontraron solicitudes con esos criterios." : "Aún no hay solicitudes de abogados."}
          </p>
        </div>
      )}
    </div>
  );
};

export default LawyerApplicationsManagement;
