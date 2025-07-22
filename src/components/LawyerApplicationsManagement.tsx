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
  Loader2,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

const LawyerApplicationsManagement = () => {
  const [applications, setApplications] = useState<SolicitudAbogadoFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<SolicitudAbogadoFromDB | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
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
    setActionLoading(true);
    try {
      // Llamar al Edge Function para aprobar y enviar email automáticamente
      const { data, error } = await supabase.functions.invoke('send-lawyer-approval-email', {
        body: {
          solicitudId: applicationId,
          tipo: 'aprobada',
          notasAdmin: adminNotes || null
        }
      });

      if (error) throw error;

      toast({
        title: "¡Solicitud aprobada automáticamente!",
        description: "Se ha creado la cuenta del abogado y se ha enviado el email de activación",
      });

      fetchApplications();
      setSelectedApp(null);
      setAdminNotes("");
    } catch (error: any) {
      console.error('Error approving application automatically:', error);
      toast({
        title: "Error",
        description: error.message || "Error al aprobar la solicitud automáticamente",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAutomated = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      // Primero rechazar en la base de datos
      const { error: dbError } = await supabase.rpc('rechazar_solicitud_abogado', {
        p_solicitud_id: applicationId,
        p_motivo_rechazo: rejectionReason,
        p_notas_admin: adminNotes || null
      });

      if (dbError) throw dbError;

      // Luego enviar email de rechazo
      const { data, error } = await supabase.functions.invoke('send-lawyer-approval-email', {
        body: {
          solicitudId: applicationId,
          tipo: 'rechazada',
          motivoRechazo: rejectionReason,
          notasAdmin: adminNotes || null
        }
      });

      if (error) {
        console.error('Error sending rejection email:', error);
        // No fallar si el email no se puede enviar
      }

      toast({
        title: "Solicitud rechazada",
        description: "Se ha enviado la notificación al solicitante",
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
      setActionLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('aprobar_solicitud_abogado', {
        p_solicitud_id: applicationId,
        p_notas_admin: adminNotes || null
      });

      if (error) throw error;

      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ha sido aprobada exitosamente",
      });

      fetchApplications();
      setSelectedApp(null);
      setAdminNotes("");
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: error.message || "Error al aprobar la solicitud",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('rechazar_solicitud_abogado', {
        p_solicitud_id: applicationId,
        p_motivo_rechazo: rejectionReason,
        p_notas_admin: adminNotes || null
      });

      if (error) throw error;

      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
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
      setActionLoading(false);
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
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Solicitud de {app.nombre} {app.apellido}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="details">Detalles</TabsTrigger>
                          <TabsTrigger value="actions">Acciones</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="details" className="space-y-6">
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
                              <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded whitespace-pre-wrap">
                                {app.carta_motivacion}
                              </p>
                            </div>
                          )}

                          {app.estado === 'rechazada' && app.motivo_rechazo && (
                            <div>
                              <h5 className="font-medium text-red-700 dark:text-red-300 mb-2">Motivo de rechazo:</h5>
                              <p className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                {app.motivo_rechazo}
                              </p>
                            </div>
                          )}

                          {app.notas_admin && (
                            <div>
                              <h5 className="font-medium mb-2">Notas administrativas:</h5>
                              <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                {app.notas_admin}
                              </p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="actions" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Estado actual:</span>
                            {getStatusBadge(app.estado)}
                          </div>

                          {app.estado === 'pendiente' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Notas administrativas (opcional)
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Agregar notas internas..."
                                  rows={3}
                                />
                              </div>

                              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border">
                                <div className="flex items-start space-x-3">
                                  <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                      Aprobación Automatizada
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                      El proceso automatizado creará la cuenta del abogado y enviará un email con las instrucciones de activación.
                                    </p>
                                    <Button
                                      onClick={() => handleApproveAutomated(app.id)}
                                      disabled={actionLoading}
                                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                                    >
                                      {actionLoading ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Procesando...
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="w-4 h-4 mr-2" />
                                          Aprobar Automáticamente
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 text-red-700 dark:text-red-300">
                                  Rechazar Solicitud
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">
                                      Motivo de rechazo *
                                    </label>
                                    <Textarea
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Explica el motivo del rechazo..."
                                      rows={3}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleRejectAutomated(app.id)}
                                    disabled={actionLoading || !rejectionReason.trim()}
                                    variant="destructive"
                                  >
                                    {actionLoading ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Rechazando...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Rechazar y Notificar
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
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
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-1" />
                      )}
                      Aprobar
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
