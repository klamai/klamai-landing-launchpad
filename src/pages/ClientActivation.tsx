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
import { ConsentCheckbox } from "@/components/shared/ConsentCheckbox";

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
  acepta_politicas: z.boolean().refine(val => val === true, "Debes aceptar las políticas de privacidad y términos de uso"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

// COMPONENTE INTERNO PARA EL FORMULARIO (idéntico al de abogados)
const ActivationForm = ({ token, email, onActivationSuccess }) => {
  const { register, handleSubmit, formState: { errors, isValid }, control } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      acepta_politicas: false,
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
      // ✅ CORREGIDO: Usar Edge Function como abogados
      const { data: activationData, error: activationError } = await supabase.functions.invoke('activate-client-account', {
        body: { token, password: formData.newPassword },
      });

      if (activationError) throw new Error(activationError.message);
      if (!activationData.success) throw new Error(activationData.error || 'Error desconocido al activar.');
      
      toast({ title: "¡Cuenta activada!", description: "Iniciando sesión..." });

      // ✅ CORREGIDO: Iniciar sesión automáticamente
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.newPassword,
      });

      if (signInError) {
        toast({ title: "Cuenta activada", description: "Por favor, inicia sesión manualmente." });
        navigate('/auth', { replace: true });
      } else if (signInData.user) {
        // ✅ CORREGIDO: Registrar consentimiento después de iniciar sesión
        supabase.functions.invoke('record-consent', {
          body: {
            user_id: signInData.user.id,
            consent_type: 'client_activation',
            accepted_terms: formData.acepta_politicas,
            accepted_privacy: formData.acepta_politicas,
          }
        }).catch(error => {
          console.error("Error al registrar el consentimiento post-activación:", error);
          // No bloqueamos al usuario, pero es bueno tener un registro del fallo
        });
        
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
      <div className="mt-6">
        <ConsentCheckbox
          control={control}
          name="acepta_politicas"
          error={errors.acepta_politicas?.message}
        />
      </div>
      <Button type="submit" disabled={loading || !isValid} className="w-full mt-6">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Activar Cuenta
      </Button>
    </form>
  );
};

const ClientActivation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<{ email: string; caso_id: string } | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        toast({ title: "Token faltante", variant: "destructive" });
        return;
      }
      
      try {
        // ✅ CORREGIDO: Solo verificar el token, NO acceder al caso
        const { data, error } = await supabase
          .from('client_activation_tokens')
          .select('email, caso_id')
          .eq('token', token)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) throw new Error('Token inválido o expirado');

        setTokenData(data as any);
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
      navigate('/dashboard', { replace: true });
    }, 1500);
  };

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
              Si necesitas ayuda, contacta con soporte.
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
          <CardTitle className="text-2xl text-gray-900">Activar Cuenta de Cliente</CardTitle>
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

export default ClientActivation;
