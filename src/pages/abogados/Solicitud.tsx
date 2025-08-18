import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileUpload } from '@/components/ui/FileUpload';
import { Scale, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// --- Esquema de Validación con Zod ---
const solicitudSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  colegio_profesional: z.string().min(3, 'El colegio profesional es requerido'),
  numero_colegiado: z.string().min(1, 'El número de colegiado es requerido'),
  especialidades: z.array(z.number()).min(1, 'Debes seleccionar al menos una especialidad'),
  experiencia_anos: z.number().min(0, 'La experiencia no puede ser negativa'),
  cv_url: z.string().optional(),
  carta_motivacion: z.string().min(50, 'La carta de motivación debe tener al menos 50 caracteres'),
  documentos_verificacion: z.array(z.instanceof(File)).optional(),
  acepta_politicas: z.boolean().refine((val) => val === true, 'Debes aceptar las políticas de privacidad'),
  acepta_comunicacion: z.boolean().optional(),
});

type SolicitudFormValues = z.infer<typeof solicitudSchema>;

// --- Especialidades Legales ---
const ESPECIALIDADES_LEGALES = [
  { id: 1, nombre: 'Derecho Civil' },
  { id: 2, nombre: 'Derecho Penal' },
  { id: 3, nombre: 'Derecho Laboral' },
  { id: 4, nombre: 'Derecho Mercantil' },
  { id: 5, nombre: 'Derecho Administrativo' },
  { id: 6, nombre: 'Derecho Fiscal' },
  { id: 7, nombre: 'Derecho Familiar' },
  { id: 8, nombre: 'Derecho Inmobiliario' },
  { id: 9, nombre: 'Derecho de Extranjería' },
  { id: 10, nombre: 'Derecho de la Seguridad Social' },
  { id: 11, nombre: 'Derecho Sanitario' },
  { id: 12, nombre: 'Derecho de Seguros' },
  { id: 13, nombre: 'Derecho Concursal' },
  { id: 14, nombre: 'Derecho de Propiedad Intelectual' },
  { id: 15, nombre: 'Derecho Ambiental' },
  { id: 16, nombre: 'Consulta General' },
];

// --- Componente ---
const SolicitudAbogadoPage = () => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // --- Lógica de Envío (Mutación) ---
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SolicitudFormValues) => {
      // Llamada real a la Edge Function
      const { data: responseData, error } = await supabase.functions.invoke('crear-solicitud-abogado', {
        body: data,
      });

      if (error) {
        throw new Error(`Error en la llamada a la función: ${error.message}`);
      }

      return responseData;
    },
    onSuccess: () => {
      toast({
        title: "¡Solicitud enviada con éxito!",
        description: "Hemos recibido tu solicitud. Te contactaremos en breve para continuar con el proceso.",
        variant: "default",
      });
      // Resetear formulario
      reset();
      setSelectedFiles([]);
    },
    onError: (error) => {
      toast({
        title: "Error al enviar la solicitud",
        description: error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const {
    handleSubmit,
    control,
    register,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SolicitudFormValues>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      especialidades: [],
      experiencia_anos: 0,
      acepta_politicas: false,
      acepta_comunicacion: false,
    },
  });

  const onSubmit = (data: SolicitudFormValues) => {
    // Añadir archivos seleccionados
    data.documentos_verificacion = selectedFiles;
    mutate(data);
  };

  const handleSpecialityChange = (specialityId: number, checked: boolean) => {
    const currentSpecialities = control._formValues.especialidades || [];
    
    if (checked) {
      setValue('especialidades', [...currentSpecialities, specialityId]);
    } else {
      setValue('especialidades', currentSpecialities.filter(id => id !== specialityId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Solicitud para Abogados
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Únete a nuestra plataforma tecnológica y expande tu práctica legal con casos de calidad
          </p>
        </motion.div>

        {/* Formulario Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Formulario de Solicitud
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Completa todos los campos para que podamos evaluar tu solicitud
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-8">
                {/* Información Personal */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Información Personal
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nombre"
                        {...register('nombre')}
                        placeholder="Tu nombre"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.nombre && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.nombre.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apellido" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Apellido <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="apellido"
                        {...register('apellido')}
                        placeholder="Tu apellido"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.apellido && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.apellido.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="tu@email.com"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Teléfono <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="telefono"
                        {...register('telefono')}
                        placeholder="+34 600 000 000"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.telefono && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.telefono.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Profesional */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Información Profesional
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="colegio_profesional" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Colegio Profesional <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="colegio_profesional"
                        {...register('colegio_profesional')}
                        placeholder="Ej: Colegio de Abogados de Madrid"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.colegio_profesional && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.colegio_profesional.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero_colegiado" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Número de Colegiado <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="numero_colegiado"
                        {...register('numero_colegiado')}
                        placeholder="Tu número de colegiado"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.numero_colegiado && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.numero_colegiado.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experiencia_anos" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Años de Experiencia
                      </Label>
                      <Input
                        id="experiencia_anos"
                        type="number"
                        {...register('experiencia_anos', { valueAsNumber: true })}
                        placeholder="0"
                        min="0"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      {errors.experiencia_anos && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.experiencia_anos.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cv_url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        URL del CV (opcional)
                      </Label>
                      <Input
                        id="cv_url"
                        {...register('cv_url')}
                        placeholder="https://ejemplo.com/cv.pdf"
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Especialidades Legales */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Especialidades Legales <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ESPECIALIDADES_LEGALES.map((especialidad) => (
                      <div key={especialidad.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`especialidad-${especialidad.id}`}
                          onCheckedChange={(checked) => 
                            handleSpecialityChange(especialidad.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`especialidad-${especialidad.id}`}
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          {especialidad.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {errors.especialidades && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.especialidades.message}
                    </p>
                  )}
                </div>

                {/* Carta de Motivación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Carta de Motivación <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="carta_motivacion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cuéntanos por qué quieres unirte a klamAI
                    </Label>
                    <Textarea
                      id="carta_motivacion"
                      {...register('carta_motivacion')}
                      placeholder="Describe tu motivación para unirte a nuestra plataforma, tu experiencia, y cómo crees que puedes contribuir..."
                      rows={6}
                      className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 resize-none"
                    />
                    {errors.carta_motivacion && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.carta_motivacion.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Documentos de Verificación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Documentos de Verificación
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sube documentos que acrediten tu identidad y colegiación
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      DNI, carnet de colegiado, títulos académicos, etc. (PDF, JPG, PNG)
                    </p>
                    
                    <FileUpload
                      onFilesChange={setSelectedFiles}
                      maxFiles={5}
                    />
                  </div>
                </div>

                {/* Consentimientos RGPD */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Consentimientos y Políticas
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Controller
                        name="acepta_politicas"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="acepta_politicas"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        )}
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="acepta_politicas"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          Acepto las <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">políticas de privacidad</a> y los <a href="/terminos-de-uso" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">términos de uso</a> <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          He leído y acepto la política de privacidad y los términos de uso de klamAI
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Controller
                        name="acepta_comunicacion"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="acepta_comunicacion"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        )}
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="acepta_comunicacion"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          Acepto recibir comunicaciones comerciales
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Quiero recibir información sobre nuevos casos, actualizaciones de la plataforma y ofertas especiales
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {errors.acepta_politicas && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.acepta_politicas.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-8 text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando solicitud...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Enviar Solicitud
                    </div>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Al enviar esta solicitud, confirmas que toda la información proporcionada es veraz y completa.
                  Nos pondremos en contacto contigo en un plazo máximo de 48 horas.
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SolicitudAbogadoPage;
