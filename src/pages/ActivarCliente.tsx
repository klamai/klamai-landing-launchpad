import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff,
  Shield,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TokenData {
  token: string;
  email: string;
  caso: {
    id: string;
    motivo_consulta: string;
    estado: string;
  };
}

const ActivarCliente: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    verificarToken();
  }, [token]);

  const verificarToken = async () => {
    try {
      // Verificar el token y obtener datos del caso
      const { data: tokenData, error: tokenError } = await supabase
        .from('client_activation_tokens')
        .select(`
          token,
          email,
          expires_at,
          used_at,
          casos:caso_id (
            id,
            motivo_consulta,
            estado
          )
        `)
        .eq('token', token as any)
        .single();

      if (tokenError || !tokenData) {
        setError('Token de activación no válido');
        setLoading(false);
        return;
      }

      if ((tokenData as any).used_at) {
        setError('Este token ya ha sido utilizado');
        setLoading(false);
        return;
      }

      if (new Date((tokenData as any).expires_at) < new Date()) {
        setError('Este token ha expirado');
        setLoading(false);
        return;
      }

      setTokenData({
        token: (tokenData as any).token,
        email: (tokenData as any).email,
        caso: (tokenData as any).casos
      });

    } catch (error) {
      console.error('Error al verificar token:', error);
      setError('Error al verificar el token');
    } finally {
      setLoading(false);
    }
  };

  const handleActivarCuenta = async () => {
    if (!tokenData) return;

    // Validaciones
    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: 'Error',
        description: 'Debes aceptar los términos y la política de privacidad',
        variant: 'destructive',
      });
      return;
    }

    setActivating(true);

    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tokenData.email,
        password: password,
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

      // Registrar consentimiento legal en activación
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
        description: 'Ya puedes acceder a tu caso legal',
        variant: 'default',
      });

      // Redirigir al dashboard del cliente
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error al activar cuenta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo activar la cuenta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Verificando invitación...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Error de Invitación</h2>
            <p className="text-gray-600 text-center mb-4">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Activar tu cuenta</CardTitle>
            <p className="text-gray-600">
              Bienvenido, {tokenData?.email}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Información del caso */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Caso:</strong> {tokenData?.caso.motivo_consulta}
                <br />
                <strong>Estado:</strong> {tokenData?.caso.estado}
              </AlertDescription>
            </Alert>

            {/* Formulario de activación */}
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
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    Acepto los{' '}
                    <a href="/terminos-condiciones" target="_blank" className="text-blue-600 hover:underline">
                      términos y condiciones
                    </a>{' '}
                    del servicio
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  />
                  <Label htmlFor="privacy" className="text-sm leading-relaxed">
                    Acepto la{' '}
                    <a href="/politica-privacidad" target="_blank" className="text-blue-600 hover:underline">
                      política de privacidad
                    </a>{' '}
                    y el tratamiento de mis datos personales
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleActivarCuenta}
                disabled={activating || !password || !confirmPassword || !acceptedTerms || !acceptedPrivacy}
                className="w-full"
              >
                {activating ? 'Activando cuenta...' : 'Activar mi cuenta'}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Al activar tu cuenta, podrás acceder a tu caso legal</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ActivarCliente; 