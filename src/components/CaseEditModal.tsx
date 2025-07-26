import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building,
  Save,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CaseEditModalProps {
  caso: {
    id: string;
    cliente_id?: string;
    motivo_consulta: string;
    resumen_caso?: string;
    guia_abogado?: string;
    estado: string;
    valor_estimado?: string;
    tipo_lead?: string;
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    telefono_borrador?: string;
    ciudad_borrador?: string;
    razon_social_borrador?: string;
    nif_cif_borrador?: string;
    nombre_gerente_borrador?: string;
    direccion_fiscal_borrador?: string;
    preferencia_horaria_contacto?: string;
    tipo_perfil_borrador?: string;
    especialidades?: { id: number; nombre: string };
    profiles?: { 
      nombre: string; 
      apellido: string; 
      email: string;
      telefono?: string;
      ciudad?: string;
      tipo_perfil: string;
      razon_social?: string;
      nif_cif?: string;
      nombre_gerente?: string;
      direccion_fiscal?: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CaseEditModal: React.FC<CaseEditModalProps> = ({
  caso,
  isOpen,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<Array<{id: number, nombre: string}>>([]);
  
  // Formulario de datos del caso
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    resumen_caso: '',
    guia_abogado: '',
    valor_estimado: '',
    tipo_lead: '',
    especialidad_id: ''
  });

  // Formulario de datos del cliente
  const [clientData, setClientData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    ciudad: '',
    tipo_perfil: 'individual',
    razon_social: '',
    nif_cif: '',
    nombre_gerente: '',
    direccion_fiscal: '',
    preferencia_horaria_contacto: ''
  });

  // Cargar especialidades
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const { data, error } = await supabase
          .from('especialidades')
          .select('id, nombre')
          .order('nombre');
        
        if (error) throw error;
        setEspecialidades(data || []);
      } catch (error) {
        console.error('Error cargando especialidades:', error);
      }
    };

    if (isOpen) {
      fetchEspecialidades();
    }
  }, [isOpen]);

  // Cargar datos del caso cuando se abre el modal
  useEffect(() => {
    if (caso && isOpen) {
      // Datos del caso
      setFormData({
        motivo_consulta: caso.motivo_consulta || '',
        resumen_caso: caso.resumen_caso || '',
        guia_abogado: caso.guia_abogado || '',
        valor_estimado: caso.valor_estimado || '',
        tipo_lead: caso.tipo_lead || '',
        especialidad_id: caso.especialidades?.id?.toString() || ''
      });

      // Datos del cliente (priorizar datos del perfil si existen, sino usar datos del borrador)
      const cliente = caso.profiles;
      setClientData({
        nombre: cliente?.nombre || caso.nombre_borrador || '',
        apellido: cliente?.apellido || caso.apellido_borrador || '',
        email: cliente?.email || caso.email_borrador || '',
        telefono: cliente?.telefono || caso.telefono_borrador || '',
        ciudad: cliente?.ciudad || caso.ciudad_borrador || '',
        tipo_perfil: cliente?.tipo_perfil || caso.tipo_perfil_borrador || 'individual',
        razon_social: cliente?.razon_social || caso.razon_social_borrador || '',
        nif_cif: cliente?.nif_cif || caso.nif_cif_borrador || '',
        nombre_gerente: cliente?.nombre_gerente || caso.nombre_gerente_borrador || '',
        direccion_fiscal: cliente?.direccion_fiscal || caso.direccion_fiscal_borrador || '',
        preferencia_horaria_contacto: caso.preferencia_horaria_contacto || ''
      });
    }
  }, [caso, isOpen]);

  const handleSave = async () => {
    if (!caso) return;

    setIsLoading(true);
    try {
      // Actualizar datos del caso
      const { error: casoError } = await supabase
        .from('casos')
        .update({
          motivo_consulta: formData.motivo_consulta,
          resumen_caso: formData.resumen_caso,
          guia_abogado: formData.guia_abogado,
          valor_estimado: formData.valor_estimado,
          tipo_lead: formData.tipo_lead as any,
          especialidad_id: formData.especialidad_id ? parseInt(formData.especialidad_id) : null,
          // Datos del cliente (guardar en campos borrador)
          nombre_borrador: clientData.nombre,
          apellido_borrador: clientData.apellido,
          email_borrador: clientData.email,
          telefono_borrador: clientData.telefono,
          ciudad_borrador: clientData.ciudad,
          tipo_perfil_borrador: clientData.tipo_perfil as any,
          razon_social_borrador: clientData.razon_social,
          nif_cif_borrador: clientData.nif_cif,
          nombre_gerente_borrador: clientData.nombre_gerente,
          direccion_fiscal_borrador: clientData.direccion_fiscal,
          preferencia_horaria_contacto: clientData.preferencia_horaria_contacto
        })
        .eq('id', caso.id);

      if (casoError) throw casoError;

      // Si el cliente tiene un perfil, también actualizar el perfil
      if (caso.profiles && caso.cliente_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nombre: clientData.nombre,
            apellido: clientData.apellido,
            email: clientData.email,
            telefono: clientData.telefono,
            ciudad: clientData.ciudad,
            tipo_perfil: clientData.tipo_perfil as any,
            razon_social: clientData.razon_social,
            nif_cif: clientData.nif_cif,
            nombre_gerente: clientData.nombre_gerente,
            direccion_fiscal: clientData.direccion_fiscal
          })
          .eq('id', caso.cliente_id);

        if (profileError) {
          console.warn('Error actualizando perfil del cliente:', profileError);
          // No lanzar error aquí, ya que el caso se actualizó correctamente
        }
      }

      toast({
        title: "Caso actualizado",
        description: "Los datos del caso se han guardado correctamente.",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error actualizando caso:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el caso. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!caso) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="bg-blue-50 dark:bg-blue-900/20 rounded-t-lg px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
            <User className="h-6 w-6 text-blue-600" />
            Editar Caso <span className="text-xs text-blue-700 ml-2">#{caso.id.substring(0, 8)}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Modifica los datos del caso y del cliente.</p>
        </DialogHeader>

        <div className="space-y-8 px-6 py-6">
          {/* Datos del Caso */}
          <Card className="shadow-none border-0 bg-gray-50 dark:bg-gray-900/30">
            <CardHeader>
              <CardTitle className="text-base text-blue-800 dark:text-blue-200">Información del Caso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motivo_consulta">Motivo de consulta *</Label>
                  <Textarea
                    id="motivo_consulta"
                    value={formData.motivo_consulta}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo_consulta: e.target.value }))}
                    placeholder="Describe el motivo de la consulta"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Select value={formData.especialidad_id} onValueChange={(value) => setFormData(prev => ({ ...prev, especialidad_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id.toString()}>
                          {esp.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumen_caso">Resumen del caso</Label>
                <Textarea
                  id="resumen_caso"
                  value={formData.resumen_caso}
                  onChange={(e) => setFormData(prev => ({ ...prev, resumen_caso: e.target.value }))}
                  placeholder="Resumen detallado del caso"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guia_abogado">Guía para el abogado</Label>
                <Textarea
                  id="guia_abogado"
                  value={formData.guia_abogado}
                  onChange={(e) => setFormData(prev => ({ ...prev, guia_abogado: e.target.value }))}
                  placeholder="Instrucciones o guía para el abogado"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_estimado">Valor estimado</Label>
                  <Input
                    id="valor_estimado"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado: e.target.value }))}
                    placeholder="Ej: 5000€ - 10000€"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_lead">Tipo de lead</Label>
                  <Select value={formData.tipo_lead} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_lead: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estandar">Estándar</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Datos del Cliente */}
          <Card className="shadow-none border-0 bg-gray-50 dark:bg-gray-900/30">
            <CardHeader>
              <CardTitle className="text-base text-blue-800 dark:text-blue-200">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_perfil">Tipo de perfil</Label>
                <Select value={clientData.tipo_perfil} onValueChange={(value) => setClientData(prev => ({ ...prev, tipo_perfil: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {clientData.tipo_perfil === 'individual' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={clientData.nombre}
                      onChange={(e) => setClientData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={clientData.apellido}
                      onChange={(e) => setClientData(prev => ({ ...prev, apellido: e.target.value }))}
                      placeholder="Apellido del cliente"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón social *</Label>
                    <Input
                      id="razon_social"
                      value={clientData.razon_social}
                      onChange={(e) => setClientData(prev => ({ ...prev, razon_social: e.target.value }))}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nif_cif">NIF/CIF *</Label>
                    <Input
                      id="nif_cif"
                      value={clientData.nif_cif}
                      onChange={(e) => setClientData(prev => ({ ...prev, nif_cif: e.target.value }))}
                      placeholder="NIF o CIF de la empresa"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={clientData.telefono}
                    onChange={(e) => setClientData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={clientData.ciudad}
                    onChange={(e) => setClientData(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferencia_horaria">Preferencia horaria</Label>
                  <Input
                    id="preferencia_horaria"
                    value={clientData.preferencia_horaria_contacto}
                    onChange={(e) => setClientData(prev => ({ ...prev, preferencia_horaria_contacto: e.target.value }))}
                    placeholder="Ej: Mañanas, tardes, etc."
                  />
                </div>
              </div>

              {clientData.tipo_perfil === 'empresa' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_gerente">Nombre del gerente</Label>
                    <Input
                      id="nombre_gerente"
                      value={clientData.nombre_gerente}
                      onChange={(e) => setClientData(prev => ({ ...prev, nombre_gerente: e.target.value }))}
                      placeholder="Nombre del gerente o representante"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion_fiscal">Dirección fiscal</Label>
                    <Input
                      id="direccion_fiscal"
                      value={clientData.direccion_fiscal}
                      onChange={(e) => setClientData(prev => ({ ...prev, direccion_fiscal: e.target.value }))}
                      placeholder="Dirección fiscal de la empresa"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer fijo para acciones */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-6 py-4 flex justify-end gap-3 z-10">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseEditModal; 