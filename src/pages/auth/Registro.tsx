import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import { ConsentCheckbox } from "@/components/shared/ConsentCheckbox";
import { logError } from "@/utils/secureLogging";

const registroSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Por favor, introduce un email válido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  acepta_politicas: z.boolean().refine(val => val === true, "Debes aceptar las políticas para continuar"),
});

type RegistroFormData = z.infer<typeof registroSchema>;

const RegistroPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, control } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      acepta_politicas: false,
    },
  });

  const handleRegister = async (formData: RegistroFormData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'cliente'
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("No se pudo crear el usuario.");

      // Registrar consentimiento
      await supabase.functions.invoke('record-consent', {
        body: {
          user_id: data.user.id,
          consent_type: 'client_registration',
          accepted_terms: formData.acepta_politicas,
          accepted_privacy: formData.acepta_politicas,
        },
      });

      toast({
        title: "¡Registro casi completo!",
        description: "Te hemos enviado un email de confirmación. Por favor, revisa tu bandeja de entrada.",
      });

      navigate('/auth');

    } catch (error: any) {
      logError("Error en el registro", error.message || "Error desconocido");
      toast({
        title: "Error en el registro",
        description: error.message || "No se pudo completar el registro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta de cliente"
      subtitle="Accede a tu dashboard para gestionar tus consultas."
      roleLabel="Clientes"
      showGoogleLogin={true}
      showClientSignup={false} 
      showLawyerAccess={false}
      onGoogleLogin={() => { /* Lógica para Google Sign Up si se desea */ }}
    >
      <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nombre completo <span className="text-blue-500">*</span></Label>
          <Input id="fullName" {...register("fullName")} placeholder="Tu nombre y apellidos" />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email <span className="text-blue-500">*</span></Label>
          <Input id="email" type="email" {...register("email")} placeholder="tu@email.com" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Contraseña <span className="text-blue-500">*</span></Label>
          <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>
        
        <ConsentCheckbox
          control={control}
          name="acepta_politicas"
          error={errors.acepta_politicas?.message}
        />

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
          <Button type="submit" disabled={loading || !isValid} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <span className="flex items-center justify-center">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Button>
        </motion.div>
        
        <div className="text-center mt-4">
          <Link to="/auth" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegistroPage;


