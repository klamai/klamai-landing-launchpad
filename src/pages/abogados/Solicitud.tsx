import React, { useState, useEffect } from 'react';
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
import { Scale, Upload, CheckCircle, AlertCircle, Info, CheckCheck, ArrowRight, Briefcase, User, Mail, Phone, FileText, Award, BookOpen, Shield, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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
  const [formProgress, setFormProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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
      setFormProgress(100);
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
    watch,
    trigger,
    formState: { errors, isValid, dirtyFields },
  } = useForm<SolicitudFormValues>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      especialidades: [],
      experiencia_anos: 0,
      acepta_politicas: false,
      acepta_comunicacion: false,
    },
    mode: "onChange"
  });

  const watchedFields = watch();

  // Calcular progreso del formulario
  useEffect(() => {
    const totalFields = Object.keys(solicitudSchema.shape).length;
    const filledFields = Object.keys(dirtyFields).length;
    const errorFields = Object.keys(errors).length;
    
    const validFields = filledFields - errorFields;
    const progress = Math.min(Math.round((validFields / totalFields) * 100), 95);
    
    setFormProgress(progress);
  }, [dirtyFields, errors]);

  const onSubmit = (data: SolicitudFormValues) => {
    // Añadir archivos seleccionados
    data.documentos_verificacion = selectedFiles;
    mutate(data);
  };

  const handleSpecialityChange = (specialityId: number, checked: boolean) => {
    const currentSpecialities = control._formValues.especialidades || [];
    
    if (checked) {
      setValue('especialidades', [...currentSpecialities, specialityId], { shouldValidate: true });
    } else {
      setValue('especialidades', currentSpecialities.filter(id => id !== specialityId), { shouldValidate: true });
    }
  };

  const handleStepChange = async (step: number) => {
    // Validar campos del paso actual antes de avanzar
    let canProceed = true;
    
    if (currentStep === 1) {
      const isValid = await trigger(['nombre', 'apellido', 'email', 'telefono']);
      canProceed = isValid;
    } else if (currentStep === 2) {
      const isValid = await trigger(['colegio_profesional', 'numero_colegiado', 'experiencia_anos', 'especialidades']);
      canProceed = isValid;
    } else if (currentStep === 3) {
      const isValid = await trigger(['carta_motivacion']);
      canProceed = isValid;
    }
    
    if (canProceed || step < currentStep) {
      setCurrentStep(step);
    } else {
      toast({
        title: "Completa todos los campos requeridos",
        description: "Por favor, completa correctamente todos los campos antes de continuar.",
        variant: "destructive",
      });
    }
  };

  // Beneficios para abogados
  const beneficios = [
    { icon: <Briefcase className="h-5 w-5" />, title: "Casos de calidad", description: "Recibe casos relevantes a tu especialidad" },
    { icon: <Award className="h-5 w-5" />, title: "Aumenta tu visibilidad", description: "Destaca en nuestra plataforma legal" },
    { icon: <Shield className="h-5 w-5" />, title: "Soporte tecnológico", description: "Herramientas digitales para tu práctica" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 shadow-lg">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Solicitud para Abogados
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Únete a nuestra plataforma tecnológica y expande tu práctica legal con casos de calidad
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="flex justify-between mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <span>Progreso de tu solicitud</span>
            <span>{formProgress}%</span>
          </div>
          <Progress value={formProgress} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStepChange(index + 1)}
                className={`flex flex-col items-center space-y-2 ${
                  currentStep === index + 1 
                    ? 'text-primary font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === index + 1 
                    ? 'bg-primary text-white' 
                    : currentStep > index + 1 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {currentStep > index + 1 ? (
                    <CheckCheck className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden md:block text-xs">
                  {index === 0 && "Datos personales"}
                  {index === 1 && "Información profesional"}
                  {index === 2 && "Motivación"}
                  {index === 3 && "Documentación"}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Formulario Principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/20 dark:to-indigo-900/20 pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Formulario de Solicitud</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Completa todos los campos para que podamos evaluar tu solicitud
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Información Personal */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            <User className="h-5 w-5 text-blue-500" />
                            <h3>Información Personal</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Nombre <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="nombre"
                                {...register('nombre')}
                                placeholder="Tu nombre"
                                className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 ${errors.nombre ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                                aria-invalid={errors.nombre ? "true" : "false"}
                              />
                              <AnimatePresence>
                                {errors.nombre && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.nombre.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="apellido" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Apellido <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="apellido"
                                {...register('apellido')}
                                placeholder="Tu apellido"
                                className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 ${errors.apellido ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                              />
                              <AnimatePresence>
                                {errors.apellido && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.apellido.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  id="email"
                                  type="email"
                                  {...register('email')}
                                  placeholder="tu@email.com"
                                  className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 pl-10 transition-all duration-200 ${errors.email ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                                />
                              </div>
                              <AnimatePresence>
                                {errors.email && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="telefono" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Teléfono <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  id="telefono"
                                  {...register('telefono')}
                                  placeholder="+34 600 000 000"
                                  className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 pl-10 transition-all duration-200 ${errors.telefono ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                                />
                              </div>
                              <AnimatePresence>
                                {errors.telefono && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.telefono.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="button" 
                              onClick={() => handleStepChange(2)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
                            >
                              Siguiente
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Información Profesional */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            <Briefcase className="h-5 w-5 text-blue-500" />
                            <h3>Información Profesional</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="colegio_profesional" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Colegio Profesional <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="colegio_profesional"
                                {...register('colegio_profesional')}
                                placeholder="Ej: Colegio de Abogados de Madrid"
                                className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 ${errors.colegio_profesional ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                              />
                              <AnimatePresence>
                                {errors.colegio_profesional && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.colegio_profesional.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="numero_colegiado" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Número de Colegiado <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="numero_colegiado"
                                {...register('numero_colegiado')}
                                placeholder="Tu número de colegiado"
                                className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 ${errors.numero_colegiado ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                              />
                              <AnimatePresence>
                                {errors.numero_colegiado && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.numero_colegiado.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="experiencia_anos" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                Años de Experiencia
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="w-80 text-sm">Indica cuántos años llevas ejerciendo como abogado. Si acabas de empezar, puedes indicar 0.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </Label>
                              <Input
                                id="experiencia_anos"
                                type="number"
                                {...register('experiencia_anos', { valueAsNumber: true })}
                                placeholder="0"
                                min="0"
                                className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 ${errors.experiencia_anos ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                              />
                              <AnimatePresence>
                                {errors.experiencia_anos && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.experiencia_anos.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="cv_url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                URL del CV (opcional)
                              </Label>
                              <Input
                                id="cv_url"
                                {...register('cv_url')}
                                placeholder="https://ejemplo.com/cv.pdf"
                                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-blue-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Especialidades Legales */}
                        <div className="space-y-6 pt-4">
                          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                            <h3>Especialidades Legales <span className="text-red-500">*</span></h3>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Selecciona las áreas del derecho en las que te especializas o tienes experiencia
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {ESPECIALIDADES_LEGALES.map((especialidad) => (
                                <motion.div 
                                  key={especialidad.id} 
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center space-x-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                                >
                                  <Checkbox
                                    id={`especialidad-${especialidad.id}`}
                                    onCheckedChange={(checked) => 
                                      handleSpecialityChange(especialidad.id, checked as boolean)
                                    }
                                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                  />
                                  <Label
                                    htmlFor={`especialidad-${especialidad.id}`}
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                                  >
                                    {especialidad.nombre}
                                  </Label>
                                </motion.div>
                              ))}
                            </div>
                            
                            <AnimatePresence>
                              {errors.especialidades && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="text-sm text-red-500 flex items-center gap-1 mt-3"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  {errors.especialidades.message}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="button" 
                              onClick={() => handleStepChange(1)}
                              variant="outline"
                              className="border-gray-300 dark:border-gray-600"
                            >
                              Anterior
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="button" 
                              onClick={() => handleStepChange(3)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
                            >
                              Siguiente
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Carta de Motivación */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <h3>Carta de Motivación <span className="text-red-500">*</span></h3>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="carta_motivacion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cuéntanos por qué quieres unirte a klamAI
                              </Label>
                              <Textarea
                                id="carta_motivacion"
                                {...register('carta_motivacion')}
                                placeholder="Describe tu motivación para unirte a nuestra plataforma, tu experiencia, y cómo crees que puedes contribuir..."
                                rows={8}
                                className={`bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none transition-all duration-200 ${errors.carta_motivacion ? 'border-red-300 dark:border-red-500 focus-visible:ring-red-400' : 'focus-visible:ring-blue-400'}`}
                              />
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Mínimo 50 caracteres</span>
                                <span>{watchedFields.carta_motivacion?.length || 0} caracteres</span>
                              </div>
                              <AnimatePresence>
                                {errors.carta_motivacion && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-red-500 flex items-center gap-1 mt-1"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.carta_motivacion.message}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="button" 
                              onClick={() => handleStepChange(2)}
                              variant="outline"
                              className="border-gray-300 dark:border-gray-600"
                            >
                              Anterior
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="button" 
                              onClick={() => handleStepChange(4)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
                            >
                              Siguiente
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Documentos de Verificación */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            <Upload className="h-5 w-5 text-blue-500" />
                            <h3>Documentos de Verificación</h3>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sube documentos que acrediten tu identidad y colegiación
                              </Label>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                DNI, carnet de colegiado, títulos académicos, etc. (PDF, JPG, PNG)
                              </p>
                              
                              <div className="mt-4">
                                <FileUpload
                                  onFilesChange={setSelectedFiles}
                                  maxFiles={5}
                                />
                              </div>
                              
                              {selectedFiles.length > 0 && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800"
                                >
                                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Consentimientos RGPD */}
                        <div className="space-y-6 pt-4">
                          <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            <h3>Consentimientos y Políticas</h3>
                          </div>
                          
                          <div className="space-y-5">
                            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                              <Controller
                                name="acepta_politicas"
                                control={control}
                                render={({ field }) => (
                                  <Checkbox
                                    id="acepta_politicas"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-1 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
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

                            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                              <Controller
                                name="acepta_comunicacion"
                                control={control}
                                render={({ field }) => (
                                  <Checkbox
                                    id="acepta_comunicacion"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-1 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
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
                          
                          <AnimatePresence>
                            {errors.acepta_politicas && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-red-500 flex items-center gap-1 mt-1"
                              >
                                <AlertCircle className="w-4 h-4" />
                                {errors.acepta_politicas.message}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex justify-between pt-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="button" 
                              onClick={() => handleStepChange(3)}
                              variant="outline"
                              className="border-gray-300 dark:border-gray-600"
                            >
                              Anterior
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              type="submit"
                              disabled={isPending}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 h-auto"
                            >
                              {isPending ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Enviando solicitud...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Send className="h-5 w-5" />
                                  <span>Enviar Solicitud</span>
                                </div>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>

                <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center w-full">
                    Al enviar esta solicitud, confirmas que toda la información proporcionada es veraz y completa.
                    Nos pondremos en contacto contigo en un plazo máximo de 48 horas.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </motion.div>

          {/* Sidebar con beneficios */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Beneficios para Abogados</CardTitle>
                <CardDescription className="text-blue-100">
                  Únete a nuestra red de profesionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {beneficios.map((beneficio, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="bg-white/20 p-3 rounded-full">
                      {beneficio.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{beneficio.title}</h4>
                      <p className="text-blue-100 text-sm">{beneficio.description}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Proceso de Selección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Envío de solicitud</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Completa el formulario con tus datos profesionales</p>
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Verificación</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Revisamos tu documentación y credenciales</p>
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Entrevista</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Breve entrevista online para conocerte mejor</p>
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Bienvenida</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Acceso a la plataforma y formación inicial</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gray-50 dark:bg-gray-800/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Info className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">¿Necesitas ayuda?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Si tienes dudas sobre el proceso de solicitud, contáctanos en <a href="mailto:soporte@klamai.com" className="text-blue-600 hover:underline">soporte@klamai.com</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SolicitudAbogadoPage;
