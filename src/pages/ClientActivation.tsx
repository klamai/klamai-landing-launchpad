import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { SecureLogger } from '@/utils/secureLogging';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, User } from 'lucide-react';

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

interface TokenData {
  token: string;
  email: string;
  caso: {
    id: string;
    motivo_consulta: string;
    estado: string;
  };
}

const ClientActivation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de activación no válido');
      setLoading(false);
      return;
    }
    verificarToken();
  }, [token]);

  const verificarToken = async () => {
    try {
      // Verificar el token y obtener datos del caso
      console.log('🔍 Verificando token:', token.substring(0, 8) + '...');
      
      // @ts-ignore - Supabase types are complex, using any for simplicity
      const { data: tokenData, error: tokenError } = await supabase
        .from('client_activation_tokens')
        .select(`
          token,
          email,
          expires_at,
          used_at,
          caso_id,
          created_at
        `)
        .eq('token', token)
        .single();

      if (tokenError) {
        console.error('❌ Error verificando token:', tokenError);
        
        // Proporcionar información más específica sobre el error
        if (tokenError.code === 'PGRST116') {
          setError('Token no encontrado. Verifica que el enlace sea correcto o que el token no haya expirado.');
        } else {
          setError(`Error al verificar el token: ${tokenError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!tokenData) {
        console.error('❌ No se recibieron datos del token');
        setError('No se pudo obtener información del token de activación');
        setLoading(false);
        return;
      }

      // Type assertion para asegurar que tokenData tiene los campos correctos
      const tokenInfo = tokenData as any;

      console.log('✅ Token encontrado:', {
        email: tokenInfo.email?.substring(0, 3) + '***',
        casoId: tokenInfo.caso_id?.substring(0, 8),
        expiresAt: tokenInfo.expires_at,
        usedAt: tokenInfo.used_at,
        createdAt: tokenInfo.created_at
      });

      if (tokenInfo.used_at) {
        setError('Este token ya ha sido utilizado. Si necesitas activar tu cuenta, contacta con soporte.');
        setLoading(false);
        return;
      }

      if (new Date(tokenInfo.expires_at) < new Date()) {
        setError('Este token ha expirado. Por favor, solicita un nuevo enlace de activación.');
        setLoading(false);
        return;
      }

      // ✅ CORREGIDO: Obtener datos del caso por separado para evitar problemas de JOIN
      console.log('🔍 Obteniendo datos del caso:', tokenInfo.caso_id);
      
      // @ts-ignore - Supabase types are complex, using any for simplicity
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select(`
          id,
          motivo_consulta,
          estado,
          cliente_id,
          email_borrador
        `)
        .eq('id', tokenInfo.caso_id)
        .single();

      if (casoError || !casoData) {
        console.error('❌ Error obteniendo datos del caso:', casoError);
        setError('No se pudo obtener la información del caso. Por favor, contacta con soporte.');
        setLoading(false);
        return;
      }

      // Type assertion para asegurar que casoData tiene los campos correctos
      const caso = casoData as any;

      console.log('✅ Caso encontrado:', {
        id: caso.id?.substring(0, 8),
        estado: caso.estado,
        tieneClienteId: !!caso.cliente_id,
        emailBorrador: caso.email_borrador?.substring(0, 3) + '***'
      });

      setTokenData({
        token: tokenInfo.token,
        email: tokenInfo.email,
        caso: {
          id: caso.id,
          motivo_consulta: caso.motivo_consulta,
          estado: caso.estado
        }
      });

    } catch (error) {
      console.error('Error al verificar token:', error);
      setError('Error al verificar el token');
    } finally {
      setLoading(false);
    }
  };

  const handleActivation = async (formData: PasswordFormData) => {
    if (!tokenData) return;

    // Validaciones
    if (formData.newPassword.length < 8) {
      toast({
        title: 'Contraseña muy corta',
        description: 'La contraseña debe tener al menos 8 caracteres',
        variant: 'destructive'
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Por favor, verifica que ambas contraseñas sean iguales',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast({
        title: 'Debes aceptar los términos',
        description: 'Por favor, acepta los términos y condiciones y la política de privacidad',
        variant: 'destructive'
      });
      return;
    }

    setActivating(true);

    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tokenData.email,
        password: formData.newPassword,
        options: {
          data: {
            role: 'cliente'
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Marcar token como usado
      await supabase
        .from('client_activation_tokens')
        .update({ 
          used_at: new Date().toISOString()
        } as any)
        .eq('token', token as any);

      // Cambiar estado del caso a disponible y vincular al usuario
      await supabase
        .from('casos')
        .update({ 
          estado: 'disponible',
          cliente_id: authData.user?.id,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', tokenData.caso.id as any);

      // Registrar consentimiento legal
      try {
        await supabase.functions.invoke('record-consent', {
          body: {
            consent_type: 'terms_privacy',
            accepted_terms: true,
            accepted_privacy: true,
            policy_terms_version: 1,
            policy_privacy_version: 1,
          },
        });
      } catch (e) {
        console.warn('No se pudo registrar consentimiento en activación:', e);
      }

      toast({
        title: '¡Cuenta activada exitosamente!',
        description: 'Serás redirigido a tu dashboard.',
      });

      // Iniciar sesión automáticamente
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: tokenData.email,
        password: formData.newPassword,
      });

      if (signInError) {
        toast({
          title: 'Error al iniciar sesión',
          description: 'Por favor, inicia sesión manualmente',
          variant: 'destructive'
        });
        navigate('/auth');
      } else {
        // Redirigir al dashboard
        navigate('/dashboard');
      }

    } catch (error: any) {
      toast({
        title: 'Error al activar la cuenta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-600 dark:text-red-400">Error de Activación</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Activar Cuenta de Cliente</CardTitle>
          <CardDescription>
            Establece tu contraseña para acceder a tu consulta
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del caso */}
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Email:</strong> {tokenData?.email}
              <br />
              <strong>Caso:</strong> {tokenData?.caso.motivo_consulta}
              <br />
              <strong>Estado:</strong> {tokenData?.caso.estado}
            </AlertDescription>
          </Alert>

          {/* Formulario de contraseña */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={tokenData?.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
              />
            </div>

            {/* Términos y condiciones */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  Acepto los <a href="/terminos" className="text-blue-600 hover:underline">términos y condiciones</a>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                />
                <Label htmlFor="privacy" className="text-sm">
                  Acepto la <a href="/privacidad" className="text-blue-600 hover:underline">política de privacidad</a>
                </Label>
              </div>
            </div>

            <Button
              onClick={() => handleActivation({ newPassword: password, confirmPassword, acceptTerms, acceptPrivacy })}
              disabled={activating || !password || !confirmPassword || !acceptTerms || !acceptPrivacy}
              className="w-full"
            >
              {activating ? 'Activando cuenta...' : 'Activar Cuenta'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Al activar tu cuenta, aceptas nuestros términos y políticas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientActivation;
