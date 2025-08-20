"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Sun, Moon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { FooterSection } from "@/components/ui/footer-section";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const steps = [
  { title: "Información Personal" },
  { title: "Información Profesional" },
  { title: "Especialidades" },
  { title: "Documentación" },
  { title: "Revisión y Envío" },
];

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
  { id: 16, nombre: 'Consulta General' }
];

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  colegio_profesional: string;
  numero_colegiado: string;
  especialidades: number[];
  experiencia_anos: number;
  cv_url: string;
  carta_motivacion: string;
  acepta_politicas: boolean;
  acepta_comunicacion: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

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
  acepta_politicas: z.boolean().refine((val) => val === true, 'Debes aceptar las políticas de privacidad'),
  acepta_comunicacion: z.boolean().optional(),
});

const EspecialidadItem = memo(({ especialidad, isSelected, onToggle, index }: { especialidad: { id: number; nombre: string }, isSelected: boolean, onToggle: (id: number) => void, index: number }) => {
  return (
    <motion.div
      className={cn(
        "flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors",
        isSelected
          ? "bg-primary/10 border-primary"
          : "hover:bg-primary/5"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          delay: 0.05 * index,
          duration: 0.3,
        },
      }}
    >
      <Checkbox
        id={`especialidad-${especialidad.id}`}
        checked={isSelected}
        onCheckedChange={() => onToggle(especialidad.id)}
      />
      <Label
        htmlFor={`especialidad-${especialidad.id}`}
        className="cursor-pointer w-full"
      >
        {especialidad.nombre}
      </Label>
    </motion.div>
  );
});

const SolicitudAbogadoPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const { register, handleSubmit, trigger, formState: { errors }, setValue, getValues, control, watch } = useForm<FormData>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      colegio_profesional: "",
      numero_colegiado: "",
      especialidades: [],
      experiencia_anos: 0,
      cv_url: "",
      carta_motivacion: "",
      acepta_politicas: false,
      acepta_comunicacion: false,
    },
    mode: 'onChange'
  });

  const especialidadesSeleccionadas = useWatch({
    control,
    name: 'especialidades',
    defaultValue: []
  });

  const toggleSpeciality = (specialityId: number) => {
    const currentEspecialidades = getValues('especialidades');
    const newEspecialidades = currentEspecialidades.includes(specialityId)
      ? currentEspecialidades.filter((id) => id !== specialityId)
      : [...currentEspecialidades, specialityId];
    setValue('especialidades', newEspecialidades, { shouldValidate: true });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: responseData, error } = await supabase.functions.invoke('crear-solicitud-abogado', {
        body: data,
      });
      if (error) throw new Error(error.message);
      return responseData;
    },
    onSuccess: () => {
      toast.success("Solicitud enviada con éxito!");
      setShowSuccessModal(true);
    },
    onError: (error) => {
      toast.error("Error al enviar la solicitud", {
        description: (error as Error).message,
      });
    },
  });

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ['nombre', 'apellido', 'email', 'telefono'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['colegio_profesional', 'numero_colegiado', 'experiencia_anos'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['especialidades'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['carta_motivacion'];
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      nextStep();
    } else {
      toast.error('Revisa los campos requeridos en este paso.');
    }
  };

  const onSubmit = (data: FormData) => {
    mutate(data);
  };

  const isStepValid = () => {
    // Aquí iría la validación con Zod por cada paso
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">KlamAI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button onClick={() => setDarkMode(!darkMode)} variant="outline" size="icon" className="rounded-full">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="w-full max-w-lg mx-auto py-8">
        {/* Progress indicator */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between mb-2 px-2">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex-1 flex flex-col items-center"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className={cn(
                    "w-4 h-4 rounded-full cursor-pointer transition-colors duration-300",
                    index < currentStep
                      ? "bg-primary"
                      : index === currentStep
                        ? "bg-primary ring-4 ring-primary/20"
                        : "bg-muted",
                  )}
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                />
                <motion.span
                  className={cn(
                    "text-xs text-center mt-1.5 hidden sm:block",
                    index === currentStep
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </motion.span>
              </motion.div>
            ))}
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border shadow-md rounded-3xl overflow-hidden">
            <motion.div layout transition={{ duration: 0.3 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                >
                  {/* Step 1: Personal Info */}
                  {currentStep === 0 && (
                    <>
                      <CardHeader className="p-6">
                        <CardTitle>Cuéntanos sobre ti</CardTitle>
                        <CardDescription>
                          Empecemos con tu información básica.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="nombre">Nombre Completo</Label>
                          <Input
                            {...register('nombre')}
                            placeholder="Tu nombre"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          {errors.nombre && (
                            <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>
                          )}
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="apellido">Apellidos</Label>
                          <Input
                            {...register('apellido')}
                            placeholder="Tus apellidos"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          {errors.apellido && (
                            <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>
                          )}
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            {...register('email')}
                            type="email"
                            placeholder="tu@email.com"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                          )}
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="telefono">Teléfono</Label>
                          <Input
                            {...register('telefono')}
                            placeholder="+34 600 000 000"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          {errors.telefono && (
                            <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>
                          )}
                        </motion.div>
                      </CardContent>
                    </>
                  )}
                  {/* Step 2: Professional Info */}
                  {currentStep === 1 && (
                    <>
                      <CardHeader className="p-6">
                        <CardTitle>Información Profesional</CardTitle>
                        <CardDescription>
                          Háblanos de tu experiencia como abogado.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.div variants={fadeInUp} className="space-y-2">
                            <Label htmlFor="colegio_profesional">Colegio Profesional</Label>
                            <Input
                              {...register('colegio_profesional')}
                              placeholder="Ej: Ilustre Colegio de Abogados de Madrid"
                              className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            {errors.colegio_profesional && (
                              <p className="text-red-500 text-xs mt-1">{errors.colegio_profesional.message}</p>
                            )}
                          </motion.div>
                          <motion.div variants={fadeInUp} className="space-y-2">
                            <Label htmlFor="numero_colegiado">Número de Colegiado</Label>
                            <Input
                              {...register('numero_colegiado')}
                              placeholder="Tu número de colegiado"
                              className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            {errors.numero_colegiado && (
                              <p className="text-red-500 text-xs mt-1">{errors.numero_colegiado.message}</p>
                            )}
                          </motion.div>
                        </div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="experiencia_anos">Años de Experiencia</Label>
                          <Input
                            {...register('experiencia_anos', { valueAsNumber: true })}
                            type="number"
                            placeholder="0"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          {errors.experiencia_anos && (
                            <p className="text-red-500 text-xs mt-1">{errors.experiencia_anos.message}</p>
                          )}
                        </motion.div>
                      </CardContent>
                    </>
                  )}
                  {/* Step 3: Especialidades */}
                  {currentStep === 2 && (
                    <>
                      <CardHeader className="p-6">
                        <CardTitle>Especialidades</CardTitle>
                        <CardDescription>
                          Selecciona las áreas en las que te especializas.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <div className="max-h-60 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {ESPECIALIDADES_LEGALES.map((especialidad, index) => {
                                const isSelected = watch('especialidades').includes(especialidad.id);
                                return (
                                  <EspecialidadItem
                                    key={especialidad.id}
                                    especialidad={especialidad}
                                    isSelected={isSelected}
                                    onToggle={toggleSpeciality}
                                    index={index}
                                  />
                                );
                              })}
                            </div>
                          </div>
                          {errors.especialidades && (
                            <p className="text-red-500 text-xs mt-1">{errors.especialidades.message}</p>
                          )}
                        </motion.div>
                      </CardContent>
                    </>
                  )}
                  {/* Step 4: Documentation */}
                  {currentStep === 3 && (
                    <>
                      <CardHeader className="p-6">
                        <CardTitle>Documentación</CardTitle>
                        <CardDescription>
                          Cuéntanos más sobre tu motivación y comparte tu CV.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="carta_motivacion">Carta de Motivación</Label>
                          <Textarea
                            {...register('carta_motivacion')}
                            placeholder="Describe por qué quieres unirte a nuestra plataforma..."
                            className="min-h-[120px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          {errors.carta_motivacion && (
                            <p className="text-red-500 text-xs mt-1">{errors.carta_motivacion.message}</p>
                          )}
                        </motion.div>
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="cv_url">URL del CV (Opcional)</Label>
                          <Input
                            {...register('cv_url')}
                            placeholder="https://linkedin.com/in/tu-perfil"
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </motion.div>
                      </CardContent>
                    </>
                  )}
                  {/* Step 5: Review and Submit */}
                  {currentStep === 4 && (
                    <>
                      <CardHeader className="p-6">
                        <CardTitle>Revisión y Envío</CardTitle>
                        <CardDescription>
                          Por favor, revisa que toda la información sea correcta antes de enviar.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                                                                {/* Resumen de datos */}
                                        <motion.div variants={fadeInUp} className="space-y-4">
                                          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 space-y-5 shadow-inner">
                                            <div className="text-center">
                                              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1 flex items-center justify-center gap-2">
                                                <FileText size={20} className="text-primary" /> Resumen de tu Solicitud
                                              </h4>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Confirma que toda tu información es correcta.
                                              </p>
                                            </div>
                                            
                                            <Separator className="bg-blue-200 dark:bg-blue-800/50" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                              <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-700 py-2">
                                                <span className="text-gray-500">Nombre:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white text-right">{getValues('nombre')} {getValues('apellido')}</span>
                                              </div>
                                              <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-700 py-2">
                                                <span className="text-gray-500">Email:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white text-right">{getValues('email')}</span>
                                              </div>
                                              <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-700 py-2">
                                                <span className="text-gray-500">Teléfono:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white text-right">{getValues('telefono')}</span>
                                              </div>
                                              <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-700 py-2">
                                                <span className="text-gray-500">Colegio:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white text-right">{getValues('colegio_profesional')}</span>
                                              </div>
                                              <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-700 py-2">
                                                <span className="text-gray-500">Nº Colegiado:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white text-right">{getValues('numero_colegiado')}</span>
                                              </div>
                                              <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-700 py-2">
                                                <span className="text-gray-500">Experiencia:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white text-right">{getValues('experiencia_anos')} años</span>
                                              </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center bg-primary/10 rounded-lg px-4 py-2">
                                                <span className="text-sm font-medium text-primary/80">Especialidades Seleccionadas:</span>
                                                <Badge variant="secondary" className="bg-primary/20 text-primary/90">
                                                  {getValues('especialidades').length}
                                                </Badge>
                                            </div>
                                          </div>
                                        </motion.div>
                                        
                                        <motion.div variants={fadeInUp} className="space-y-4">
                                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                            <div className="flex items-start space-x-3">
                                              <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mt-0.5">
                                                <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>
                                              </div>
                                              <div className="flex-1">
                                                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                                                  Políticas y Términos Requeridos
                                                </p>
                                                <div className="space-y-3">
                                                  <label className="flex items-start gap-3 cursor-pointer group">
                                                    <Checkbox
                                                      id="acepta_politicas"
                                                      checked={watch('acepta_politicas')}
                                                      onCheckedChange={(checked) =>
                                                        setValue("acepta_politicas", !!checked, { shouldValidate: true })
                                                      }
                                                      className="mt-0.5"
                                                    />
                                                    <div className="flex-1">
                                                      <span className="text-sm text-amber-800 dark:text-amber-200">
                                                        He leído y acepto la{' '}
                                                        <a 
                                                          href="/politicas-privacidad" 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium"
                                                        >
                                                          Política de Privacidad
                                                        </a>
                                                        {' '}y los{' '}
                                                        <a 
                                                          href="/aviso-legal" 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium"
                                                        >
                                                          Términos y Condiciones
                                                        </a>
                                                      </span>
                                                    </div>
                                                  </label>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {errors.acepta_politicas && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                              {errors.acepta_politicas.message}
                                            </p>
                                          )}
                                        </motion.div>
                                      </CardContent>
                                    </>
                                  )}
                                </motion.div>
                              </AnimatePresence>

                              <CardFooter className="flex justify-between p-6">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={currentStep === 0}
                                    className="flex items-center gap-1 transition-all duration-300 rounded-2xl"
                                  >
                                    <ChevronLeft className="h-4 w-4" /> Anterior
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    type={currentStep === steps.length - 1 ? "submit" : "button"}
                                    onClick={currentStep === steps.length - 1 ? handleSubmit(onSubmit) : handleNextStep}
                                    disabled={isSubmitting || (currentStep === steps.length - 1 && !watch('acepta_politicas'))}
                                    className={cn(
                                      "flex items-center gap-1.5 transition-all duration-300 rounded-xl px-5 py-2.5",
                                      "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
                                      (isSubmitting || (currentStep === steps.length - 1 && !watch('acepta_politicas'))) && "opacity-60 cursor-not-allowed"
                                    )}
                                  >
                                    {currentStep === steps.length - 1 ? (
                                      isSubmitting ? (
                                        <>
                                          <motion.div
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          />
                                          Enviando...
                                        </>
                                      ) : (
                                        <>
                                          Enviar Solicitud <Check className="h-4 w-4" />
                                        </>
                                      )
                                    ) : (
                                      <>
                                        Siguiente <ChevronRight className="h-4 w-4" />
                                      </>
                                    )}
                                  </Button>
                                </motion.div>
                              </CardFooter>
                            </motion.div>
                          </Card>
                        </motion.div>

        <motion.div
          className="mt-4 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}
        </motion.div>
      </div>
      <FooterSection />

          {/* Modal de éxito */}
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold text-green-600 dark:text-green-400">
                  ¡Solicitud Enviada con Éxito!
                </DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Tu solicitud ha sido recibida
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nuestro equipo revisará tu información y te contactaremos pronto.
                  </p>
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl text-lg font-semibold"
                  >
                    Volver a KlamAI
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    };

    export default SolicitudAbogadoPage;
