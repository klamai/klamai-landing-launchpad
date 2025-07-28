
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";

interface LawyerApplicationFormProps {
  onSuccess: () => void;
}

const LawyerApplicationForm = ({ onSuccess }: LawyerApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    colegio_profesional: "",
    numero_colegiado: "",
    experiencia_anos: "",
    carta_motivacion: "",
    acepta_politicas: false,
    acepta_comunicacion: false
  });

  const [especialidades, setEspecialidades] = useState<number[]>([]);
  const [availableEspecialidades, setAvailableEspecialidades] = useState<{id: number, nombre: string}[]>([]);

  React.useEffect(() => {
    const fetchEspecialidades = async () => {
      const { data } = await supabase
        .from('especialidades')
        .select('*')
        .order('nombre');
      
      if (data) {
        setAvailableEspecialidades(data);
      }
    };
    fetchEspecialidades();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEspecialidadToggle = (id: number) => {
    setEspecialidades(prev => 
      prev.includes(id) 
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acepta_politicas) {
      toast({
        title: "Error",
        description: "Debes aceptar las políticas de privacidad para continuar",
        variant: "destructive",
      });
      return;
    }

    if (especialidades.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una especialidad",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('solicitudes_abogado')
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono || null,
          colegio_profesional: formData.colegio_profesional || null,
          numero_colegiado: formData.numero_colegiado || null,
          especialidades: especialidades,
          experiencia_anos: formData.experiencia_anos ? parseInt(formData.experiencia_anos) : null,
          carta_motivacion: formData.carta_motivacion || null,
          acepta_politicas: formData.acepta_politicas,
          acepta_comunicacion: formData.acepta_comunicacion
        });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud ha sido enviada correctamente. Te contactaremos pronto.",
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      console.error("Error al enviar solicitud:", error);
      toast({
        title: "Error al enviar solicitud",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          ¡Solicitud Enviada!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Hemos recibido tu solicitud para unirte como abogado a KlamAI. 
          Nuestro equipo la revisará y te contactaremos en breve.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Próximos pasos:</strong><br />
            1. Revisaremos tu solicitud en 24-48 horas<br />
            2. Te contactaremos por email<br />
            3. Si es aprobada, crearemos tu cuenta de abogado
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre" className="text-gray-700 dark:text-gray-300">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            required
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
        <div>
          <Label htmlFor="apellido" className="text-gray-700 dark:text-gray-300">Apellido *</Label>
          <Input
            id="apellido"
            value={formData.apellido}
            onChange={(e) => handleInputChange('apellido', e.target.value)}
            required
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          className="bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div>
        <Label htmlFor="telefono" className="text-gray-700 dark:text-gray-300">Teléfono</Label>
        <Input
          id="telefono"
          value={formData.telefono}
          onChange={(e) => handleInputChange('telefono', e.target.value)}
          className="bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="colegio" className="text-gray-700 dark:text-gray-300">Colegio Profesional</Label>
          <Input
            id="colegio"
            value={formData.colegio_profesional}
            onChange={(e) => handleInputChange('colegio_profesional', e.target.value)}
            placeholder="Ej: ICAM, ICAB..."
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
        <div>
          <Label htmlFor="numero_colegiado" className="text-gray-700 dark:text-gray-300">Número de Colegiado</Label>
          <Input
            id="numero_colegiado"
            value={formData.numero_colegiado}
            onChange={(e) => handleInputChange('numero_colegiado', e.target.value)}
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="experiencia" className="text-gray-700 dark:text-gray-300">Años de Experiencia</Label>
        <Input
          id="experiencia"
          type="number"
          min="0"
          value={formData.experiencia_anos}
          onChange={(e) => handleInputChange('experiencia_anos', e.target.value)}
          className="bg-gray-50 dark:bg-gray-700"
        />
      </div>

      <div>
        <Label className="text-gray-700 dark:text-gray-300">Especialidades *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          {availableEspecialidades.map((esp) => (
            <div key={esp.id} className="flex items-center space-x-2">
              <Checkbox
                id={`esp-${esp.id}`}
                checked={especialidades.includes(esp.id)}
                onCheckedChange={() => handleEspecialidadToggle(esp.id)}
              />
              <Label 
                htmlFor={`esp-${esp.id}`} 
                className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {esp.nombre}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="carta" className="text-gray-700 dark:text-gray-300">Carta de Motivación</Label>
        <Textarea
          id="carta"
          value={formData.carta_motivacion}
          onChange={(e) => handleInputChange('carta_motivacion', e.target.value)}
          placeholder="Cuéntanos por qué quieres formar parte de KlamAI..."
          className="bg-gray-50 dark:bg-gray-700 min-h-[100px]"
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="acepta_politicas"
            checked={formData.acepta_politicas}
            onCheckedChange={(checked) => handleInputChange('acepta_politicas', checked)}
            className="mt-0.5"
          />
          <Label htmlFor="acepta_politicas" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Acepto las{" "}
            <Link to="/politicas-privacidad" className="text-blue-600 hover:underline" target="_blank">
              Políticas de Privacidad
            </Link>
            {" "}y{" "}
            <Link to="/aviso-legal" className="text-blue-600 hover:underline" target="_blank">
              Términos de Servicio
            </Link>
            {" "}*
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="acepta_comunicacion"
            checked={formData.acepta_comunicacion}
            onCheckedChange={(checked) => handleInputChange('acepta_comunicacion', checked)}
            className="mt-0.5"
          />
          <Label htmlFor="acepta_comunicacion" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Acepto recibir comunicaciones comerciales de KlamAI
          </Label>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || !formData.acepta_politicas}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? "Enviando solicitud..." : "Enviar Solicitud"}
      </Button>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>Nota:</strong> Tu solicitud será revisada por nuestro equipo. 
          Si es aprobada, crearemos tu cuenta de abogado y te enviaremos las credenciales por email.
        </p>
      </div>
    </form>
  );
};

export default LawyerApplicationForm;
