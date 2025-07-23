import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ActivationToken {
  id: string;
  token: string;
  email: string;
  temp_password: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  solicitud_id: string;
}

const LawyerActivation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<ActivationToken | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidatingToken(false);
      toast({
        title: "Token faltante",
        description: "No se encontró un token de activación válido en la URL",
        variant: "destructive",
      });
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('lawyer_activation_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Token inválido o expirado');
      }

      setTokenData(data as ActivationToken);
      setTokenValid(true);
    } catch (error: any) {
      console.error('Error validating token:', error);
      setTokenValid(false);
      toast({
        title: "Token inválido",
        description: "El token de activación es inválido o ha expirado",
        variant: "destructive",
      });
    } finally {
      setValidatingToken(false);
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 Iniciando proceso de activación de abogado...');

      // Usar la nueva Edge Function para crear el usuario confirmado
      const { data: activationData, error: activationError } = await supabase.functions.invoke('activate-lawyer-account', {
        body: {
          token: token,
          password: formData.newPassword
        }
      });

      if (activationError) {
        console.error('❌ Error en Edge Function:', activationError);
        throw new Error('Error al activar la cuenta: ' + activationError.message);
      }

      if (!activationData.success) {
        throw new Error(activationData.error || 'Error desconocido al activar la cuenta');
      }

      console.log('✅ Cuenta activada exitosamente:', activationData);

      toast({
        title: "¡Cuenta activada exitosamente!",
        description: "Tu cuenta de abogado ha sido activada. Iniciando sesión...",
      });

      // Iniciar sesión automáticamente con las credenciales
      console.log('🔐 Iniciando sesión automáticamente...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: tokenData!.email,
        password: formData.newPassword,
      });

      if (signInError) {
        console.error('❌ Error en signIn automático:', signInError);
        toast({
          title: "Cuenta activada",
          description: "Tu cuenta ha sido activada exitosamente. Ahora puedes iniciar sesión.",
        });
        
        setTimeout(() => {
          navigate('/abogados/auth', { replace: true });
        }, 2000);
        return;
      }

      // Redirigir al dashboard de abogados
      setTimeout(() => {
        navigate('/abogados/dashboard', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error en proceso de activación:', error);
      toast({
        title: "Error de activación",
        description: error.message || "Error al activar la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  if (!tokenValid) {
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
          <p className="text-sm text-gray-600 mt-2">
            Configura tu contraseña para completar la activación de tu cuenta
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Token válido</p>
                <p className="text-xs text-green-600">Cuenta: {tokenData?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleActivation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirma tu nueva contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Activando cuenta...
                </div>
              ) : (
                "Activar Cuenta"
              )}
            </Button>
          </form>

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
