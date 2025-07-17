
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type CasoEstado = Database['public']['Enums']['caso_estado_enum'];
type CasoTipoLead = Database['public']['Enums']['caso_tipo_lead_enum'];
type ProfileType = Database['public']['Enums']['profile_type_enum'];

interface CaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  caso: any;
  onSuccess: () => void;
}

const CaseEditModal = ({ isOpen, onClose, caso, onSuccess }: CaseEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    resumen_caso: '',
    valor_estimado: '',
    tipo_lead: '' as CasoTipoLead | '',
    estado: '' as CasoEstado | '',
    especialidad_id: '',
    nombre_borrador: '',
    apellido_borrador: '',
    email_borrador: '',
    telefono_borrador: '',
    ciudad_borrador: '',
    tipo_perfil_borrador: 'individual' as ProfileType,
    razon_social_borrador: '',
    nif_cif_borrador: '',
    direccion_fiscal_borrador: '',
    nombre_gerente_borrador: '',
    preferencia_horaria_contacto: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (caso) {
      setFormData({
        motivo_consulta: caso.motivo_consulta || '',
        resumen_caso: caso.resumen_caso || '',
        valor_estimado: caso.valor_estimado || '',
        tipo_lead: caso.tipo_lead || '',
        estado: caso.estado || '',
        especialidad_id: caso.especialidad_id?.toString() || '',
        nombre_borrador: caso.nombre_borrador || '',
        apellido_borrador: caso.apellido_borrador || '',
        email_borrador: caso.email_borrador || '',
        telefono_borrador: caso.telefono_borrador || '',
        ciudad_borrador: caso.ciudad_borrador || '',
        tipo_perfil_borrador: caso.tipo_perfil_borrador || 'individual',
        razon_social_borrador: caso.razon_social_borrador || '',
        nif_cif_borrador: caso.nif_cif_borrador || '',
        direccion_fiscal_borrador: caso.direccion_fiscal_borrador || '',
        nombre_gerente_borrador: caso.nombre_gerente_borrador || '',
        preferencia_horaria_contacto: caso.preferencia_horaria_contacto || ''
      });
    }
  }, [caso]);

  useEffect(() => {
    const fetchEspecialidades = async () => {
      const { data } = await supabase
        .from('especialidades')
        .select('*')
        .order('nombre');
      if (data) setEspecialidades(data);
    };
    fetchEspecialidades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: Record<string, any> = {
        motivo_consulta: formData.motivo_consulta,
        resumen_caso: formData.resumen_caso,
        valor_estimado: formData.valor_estimado,
        especialidad_id: formData.especialidad_id ? parseInt(formData.especialidad_id) : null,
        tipo_perfil_borrador: formData.tipo_perfil_borrador,
        nombre_borrador: formData.nombre_borrador,
        apellido_borrador: formData.apellido_borrador,
        email_borrador: formData.email_borrador,
        telefono_borrador: formData.telefono_borrador,
        ciudad_borrador: formData.ciudad_borrador,
        razon_social_borrador: formData.razon_social_borrador,
        nif_cif_borrador: formData.nif_cif_borrador,
        direccion_fiscal_borrador: formData.direccion_fiscal_borrador,
        nombre_gerente_borrador: formData.nombre_gerente_borrador,
        preferencia_horaria_contacto: formData.preferencia_horaria_contacto
      };

      // Only add these fields if they have values
      if (formData.tipo_lead) {
        updateData.tipo_lead = formData.tipo_lead;
      }
      if (formData.estado) {
        updateData.estado = formData.estado;
      }

      const { error } = await supabase
        .from('casos')
        .update(updateData)
        .eq('id', caso.id);

      if (error) throw error;

      toast({
        title: "¡Caso actualizado!",
        description: "Los cambios se han guardado correctamente",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating case:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el caso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Caso
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Caso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Caso</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="motivo_consulta">Motivo de Consulta</Label>
                <Textarea
                  id="motivo_consulta"
                  value={formData.motivo_consulta}
                  onChange={(e) => handleInputChange('motivo_consulta', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="resumen_caso">Resumen del Caso</Label>
                <Textarea
                  id="resumen_caso"
                  value={formData.resumen_caso}
                  onChange={(e) => handleInputChange('resumen_caso', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="especialidad_id">Especialidad</Label>
                <Select value={formData.especialidad_id} onValueChange={(value) => handleInputChange('especialidad_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin especialidad</SelectItem>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo_lead">Tipo de Lead</Label>
                <Select value={formData.tipo_lead} onValueChange={(value) => handleInputChange('tipo_lead', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin tipo</SelectItem>
                    <SelectItem value="estandar">Estándar</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="esperando_pago">Esperando Pago</SelectItem>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="agotado">Agotado</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                    <SelectItem value="listo_para_propuesta">Listo para Propuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor_estimado">Valor Estimado</Label>
                <Input
                  id="valor_estimado"
                  value={formData.valor_estimado}
                  onChange={(e) => handleInputChange('valor_estimado', e.target.value)}
                  placeholder="Ej: 1000€ - 2000€"
                />
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Cliente</h3>
            
            <div>
              <Label htmlFor="tipo_perfil_borrador">Tipo de Perfil</Label>
              <Select value={formData.tipo_perfil_borrador} onValueChange={(value) => handleInputChange('tipo_perfil_borrador', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo_perfil_borrador === 'individual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre_borrador">Nombre</Label>
                  <Input
                    id="nombre_borrador"
                    value={formData.nombre_borrador}
                    onChange={(e) => handleInputChange('nombre_borrador', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="apellido_borrador">Apellido</Label>
                  <Input
                    id="apellido_borrador"
                    value={formData.apellido_borrador}
                    onChange={(e) => handleInputChange('apellido_borrador', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razon_social_borrador">Razón Social</Label>
                  <Input
                    id="razon_social_borrador"
                    value={formData.razon_social_borrador}
                    onChange={(e) => handleInputChange('razon_social_borrador', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nif_cif_borrador">NIF/CIF</Label>
                  <Input
                    id="nif_cif_borrador"
                    value={formData.nif_cif_borrador}
                    onChange={(e) => handleInputChange('nif_cif_borrador', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nombre_gerente_borrador">Nombre del Gerente</Label>
                  <Input
                    id="nombre_gerente_borrador"
                    value={formData.nombre_gerente_borrador}
                    onChange={(e) => handleInputChange('nombre_gerente_borrador', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="direccion_fiscal_borrador">Dirección Fiscal</Label>
                  <Input
                    id="direccion_fiscal_borrador"
                    value={formData.direccion_fiscal_borrador}
                    onChange={(e) => handleInputChange('direccion_fiscal_borrador', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email_borrador">Email</Label>
                <Input
                  id="email_borrador"
                  type="email"
                  value={formData.email_borrador}
                  onChange={(e) => handleInputChange('email_borrador', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefono_borrador">Teléfono</Label>
                <Input
                  id="telefono_borrador"
                  value={formData.telefono_borrador}
                  onChange={(e) => handleInputChange('telefono_borrador', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ciudad_borrador">Ciudad</Label>
                <Input
                  id="ciudad_borrador"
                  value={formData.ciudad_borrador}
                  onChange={(e) => handleInputChange('ciudad_borrador', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="preferencia_horaria_contacto">Preferencia Horaria de Contacto</Label>
                <Input
                  id="preferencia_horaria_contacto"
                  value={formData.preferencia_horaria_contacto}
                  onChange={(e) => handleInputChange('preferencia_horaria_contacto', e.target.value)}
                  placeholder="Ej: 9:00 - 18:00"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CaseEditModal;
