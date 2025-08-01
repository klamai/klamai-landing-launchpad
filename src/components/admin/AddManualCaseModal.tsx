
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, User, Mail, Phone, MapPin, Building, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AddManualCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  especialidades: Array<{ id: number; nombre: string }>;
  onCaseCreated?: (casoId: string) => void;
}

const AddManualCaseModal: React.FC<AddManualCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  especialidades,
  onCaseCreated
}) => {
  const [formData, setFormData] = useState({
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
    especialidad_id: '',
    motivo_consulta: '',
    valor_estimado: '',
    tipo_lead: 'estandar',
    preferencia_horaria_contacto: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Por favor, completa los campos obligatorios (nombre, apellido, email)",
        variant: "destructive",
      });
      return;
    }

    if (!formData.motivo_consulta.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el motivo de la consulta",
        variant: "destructive",
      });
      return;
    }

    if (!formData.especialidad_id) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una especialidad",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('add-manual-case', {
        body: {
          caseData: {
            ...formData,
            especialidad_id: parseInt(formData.especialidad_id),
            canal_atencion: 'manual_admin'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Caso creado exitosamente",
          description: "El caso se ha creado y está siendo procesado por la IA.",
          duration: 5000,
        });
        
        // Limpiar formulario
        setFormData({
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
          especialidad_id: '',
          motivo_consulta: '',
          valor_estimado: '',
          tipo_lead: 'estandar',
          preferencia_horaria_contacto: ''
        });
        
        onClose();
        onSuccess();
        
        if (data.caso?.id) {
          onCaseCreated?.(data.caso.id);
        }
      } else {
        throw new Error('Error al crear el caso');
      }
    } catch (error: any) {
      console.error('Error creating case:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el caso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
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
        especialidad_id: '',
        motivo_consulta: '',
        valor_estimado: '',
        tipo_lead: 'estandar',
        preferencia_horaria_contacto: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Crear Caso Manual
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange('apellido', e.target.value)}
                  placeholder="Apellido del cliente"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="+34 600 000 000"
                />
              </div>
              
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  placeholder="Madrid"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo_perfil">Tipo de Perfil</Label>
                <Select value={formData.tipo_perfil} onValueChange={(value) => handleInputChange('tipo_perfil', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Individual</SelectItem>
                    <SelectItem value="empresa" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos específicos para empresa */}
            {formData.tipo_perfil === 'empresa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razon_social">Razón Social</Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social}
                    onChange={(e) => handleInputChange('razon_social', e.target.value)}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nif_cif">NIF/CIF</Label>
                  <Input
                    id="nif_cif"
                    value={formData.nif_cif}
                    onChange={(e) => handleInputChange('nif_cif', e.target.value)}
                    placeholder="B12345678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nombre_gerente">Nombre del Gerente</Label>
                  <Input
                    id="nombre_gerente"
                    value={formData.nombre_gerente}
                    onChange={(e) => handleInputChange('nombre_gerente', e.target.value)}
                    placeholder="Nombre completo del gerente"
                  />
                </div>
                
                <div>
                  <Label htmlFor="direccion_fiscal">Dirección Fiscal</Label>
                  <Input
                    id="direccion_fiscal"
                    value={formData.direccion_fiscal}
                    onChange={(e) => handleInputChange('direccion_fiscal', e.target.value)}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Información del Caso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información del Caso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="especialidad_id">Especialidad *</Label>
                <Select value={formData.especialidad_id} onValueChange={(value) => handleInputChange('especialidad_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()} className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estandar" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Estándar</SelectItem>
                    <SelectItem value="premium" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Premium</SelectItem>
                    <SelectItem value="urgente" className="hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="valor_estimado">Valor Estimado</Label>
                <Input
                  id="valor_estimado"
                  value={formData.valor_estimado}
                  onChange={(e) => handleInputChange('valor_estimado', e.target.value)}
                  placeholder="€ 1.000 - 2.000"
                />
              </div>
              
              <div>
                <Label htmlFor="preferencia_horaria_contacto">Preferencia Horaria</Label>
                <Input
                  id="preferencia_horaria_contacto"
                  value={formData.preferencia_horaria_contacto}
                  onChange={(e) => handleInputChange('preferencia_horaria_contacto', e.target.value)}
                  placeholder="Mañana, tarde, etc."
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="motivo_consulta">Motivo de la Consulta *</Label>
              <Textarea
                id="motivo_consulta"
                value={formData.motivo_consulta}
                onChange={(e) => handleInputChange('motivo_consulta', e.target.value)}
                placeholder="Describe el motivo de la consulta legal..."
                rows={4}
                required
              />
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Crear Caso
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddManualCaseModal;
