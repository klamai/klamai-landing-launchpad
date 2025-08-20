import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, "Debes aceptar los términos y condiciones"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

// NUEVO COMPONENTE INTERNO PARA EL FORMULARIO
const ActivationForm = ({ token, email, onActivationSuccess }) => {
  const { register, handleSubmit, formState: { errors, isValid }, control } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      acceptedTerms: false,
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleActivation = async (formData: PasswordFormData) => {
    setLoading(true);
    try {
      const { data: activationData, error: activationError } = await supabase.functions.invoke('activate-lawyer-account', {
        body: { token, password: formData.newPassword },
      });

      if (activationError) throw new Error(activationError.message);
      if (!activationData.success) throw new Error(activationData.error || 'Error desconocido al activar.');
      
      toast({ title: "¡Cuenta activada!", description: "Iniciando sesión..." });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.newPassword,
      });

      if (signInError) {
        toast({ title: "Cuenta activada", description: "Por favor, inicia sesión manualmente." });
        navigate('/abogados/auth', { replace: true });
      } else {
        onActivationSuccess();
      }
    } catch (error: any) {
      toast({ title: "Error de activación", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleActivation)} className="space-y-4">
      {/* ... El JSX del formulario va aquí, desde el div de "Nueva Contraseña" hasta el Button ... */}
      {/* (Copiando el JSX del formulario anterior) */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva Contraseña</Label>
        <div className="relative">
          <Input id="newPassword" type={showPassword ? "text" : "password"} {...register("newPassword")} />
          {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>
      <div className="items-top flex space-x-2 mt-6">
        <Controller
          name="acceptedTerms"
          control={control}
          render={({ field }) => (
            <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <div className="grid gap-1.5 leading-none">
          <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Acepto los términos y condiciones
          </label>
          <p className="text-sm text-muted-foreground">
            Al activar tu cuenta, confirmas que has leído y aceptas nuestra 
            <Link to="/politicas-privacidad" target="_blank" className="underline hover:text-primary"> Política de Privacidad</Link> y los 
            <Link to="/aviso-legal" target="_blank" className="underline hover:text-primary"> Términos y Condiciones</Link>.
          </p>
        </div>
      </div>
      {errors.acceptedTerms && <p className="text-red-500 text-sm mt-1">{errors.acceptedTerms.message}</p>}
      <Button type="submit" disabled={loading || !isValid} className="w-full mt-6">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Activar Cuenta
      </Button>
    </form>
  );
};

const LawyerActivation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<{ email: string } | null>(null);
  
  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        toast({ title: "Token faltante", variant: "destructive" });
        return;
      }
      try {
        const { data, error } = await supabase
          .from('lawyer_activation_tokens')
          .select('email')
          .eq('token', token)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) throw new Error('Token inválido o expirado');
        
        setTokenData(data);
        setTokenValid(true);
      } catch (error: any) {
        setTokenValid(false);
        toast({ title: "Token inválido", description: error.message, variant: "destructive" });
      } finally {
        setValidatingToken(false);
      }
    };
    validateToken();
  }, [token, toast]);

  const handleSuccess = () => {
    setTimeout(() => {
      navigate('/abogados/dashboard', { replace: true });
    }, 1500);
  };

  // ... JSX para los estados de carga y error ...
  
  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validando token de activación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid || !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Token Inválido</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              El token de activación es inválido o ha expirado.
            </p>
            <p className="text-sm text-gray-500">
              Si necesitas ayuda, contacta con el administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.svg" alt="KlamAI Logo" className="h-8 mr-2" />
            <span className="text-xl font-bold text-gray-900">KlamAI</span>
          </div>
          <CardTitle className="text-2xl text-gray-900">Activar Cuenta de Abogado</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Cuenta: {tokenData.email}</p>
        </CardHeader>
        <CardContent>
          <ActivationForm 
            token={token!}
            email={tokenData.email}
            onActivationSuccess={handleSuccess}
          />
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Al activar tu cuenta, aceptas los términos y condiciones de KlamAI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LawyerActivation;
