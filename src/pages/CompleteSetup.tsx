import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, CheckCircle2, Eye, EyeOff, Lock, User } from 'lucide-react';

const CompleteSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Verificar si el usuario ya completó la configuración (solo después de que termine la verificación de sesión)
  useEffect(() => {
    const checkUserSetup = async () => {
      // Solo verificar si:
      // 1. Hay usuario autenticado
      // 2. La sesión está establecida
      // 3. Ya terminamos de verificar la sesión
      // 4. No estamos en estado de éxito (ya completó la configuración)
      if (user && sessionEstablished && !isVerifyingSession && !success) {
        try {
          console.log('🔍 Verificando si el usuario ya completó la configuración...');

          // Verificar si el usuario ya completó la configuración inicial
          const { data: profile, error } = await (supabase as any)
            .from('profiles')
            .select('configuracion_completada, role, tipo_abogado')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            console.log('📋 Perfil encontrado:', {
              configuracion_completada: profile.configuracion_completada,
              role: profile.role,
              tipo_abogado: profile.tipo_abogado
            });

            // Si ya completó la configuración, redirigir según su rol
            if (profile.configuracion_completada) {
              console.log('✅ Usuario ya completó configuración, redirigiendo...');
              if (profile.role === 'abogado' && profile.tipo_abogado === 'super_admin') {
                navigate('/admin/dashboard');
              } else if (profile.role === 'abogado') {
                navigate('/abogados/dashboard');
              } else {
                navigate('/dashboard');
              }
            } else {
              console.log('⏳ Usuario necesita completar configuración, mostrando formulario');
              // Si no ha completado la configuración, permitir que continúe con el formulario
            }
          } else if (error) {
            console.error('❌ Error obteniendo perfil:', error);
            // Si hay error obteniendo el perfil, permitir que continúe
            // Esto puede pasar si el perfil aún no se ha creado completamente
          }
        } catch (error) {
          console.error('💥 Excepción verificando configuración:', error);
          // En caso de error, permitir que continúe con la configuración
        }
      }
    };

    // Solo ejecutar la verificación si ya terminamos de verificar la sesión
    if (!isVerifyingSession && user && sessionEstablished && !success) {
      checkUserSetup();
    }
  }, [user, sessionEstablished, isVerifyingSession, success, navigate]);

  // Verificar parámetros de la URL para magic link
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener todos los parámetros de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParamsData = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token') || searchParamsData.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParamsData.get('refresh_token');
        const type = hashParams.get('type') || searchParamsData.get('type');
        const errorParam = hashParams.get('error') || searchParamsData.get('error');
        const errorDescription = hashParams.get('error_description') || searchParamsData.get('error_description');

        console.log('CompleteSetup - Auth params:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          errorParam,
          errorDescription,
          hash: window.location.hash,
          search: window.location.search
        });

        // Si hay un error en los parámetros
        if (errorParam) {
          console.error('Magic link error:', errorParam, errorDescription);
          setError(`Error en el enlace de activación: ${errorDescription || errorParam}`);
          setIsVerifyingSession(false);
          return;
        }

        // Si tenemos tokens de acceso, intentar establecer la sesión
        if (accessToken && refreshToken) {
          console.log('Attempting to set session with tokens...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            setError(`Error al verificar el enlace: ${error.message}`);
            setIsVerifyingSession(false);
          } else if (data.session) {
            console.log('Session established successfully:', data.session.user.id);
            setSessionEstablished(true);
            setIsVerifyingSession(false);
          } else {
            console.error('Session set but no session data returned');
            setError('Sesión establecida pero no se pudo obtener la información del usuario.');
            setIsVerifyingSession(false);
          }
        } else {
          // No hay tokens, verificar si ya hay una sesión activa
          console.log('No tokens found, checking existing session...');

          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
            setError('Error al verificar la sesión existente.');
            setIsVerifyingSession(false);
          } else if (data.session) {
            console.log('Existing session found:', data.session.user.id);
            setSessionEstablished(true);
            setIsVerifyingSession(false);
          } else {
            console.log('No active session found');
            setError('Enlace de activación inválido o expirado. El enlace puede haber sido usado anteriormente o haber expirado.');
            setIsVerifyingSession(false);
          }
        }
      } catch (err) {
        console.error('Exception in auth callback:', err);
        setError('Error inesperado al procesar el enlace de activación.');
        setIsVerifyingSession(false);
      }
    };

    handleAuthCallback();
  }, []);

  // Calcular fortaleza de la contraseña
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    });
  }, [password]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionEstablished) {
      setError('Sesión no establecida. Por favor, verifica el enlace de activación.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Marcar configuración como completada y redirigir
      setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Marcar que la configuración ha sido completada
            await (supabase as any)
              .from('profiles')
              .update({
                configuracion_completada: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            // Obtener el perfil actualizado para determinar la redirección
            const { data: profile, error: profileError } = await (supabase as any)
              .from('profiles')
              .select('role, tipo_abogado')
              .eq('id', user.id)
              .single();

            if (!profileError && profile && typeof profile === 'object' && 'role' in profile) {
              if (profile.role === 'abogado' && profile.tipo_abogado === 'super_admin') {
                navigate('/admin/dashboard');
              } else if (profile.role === 'abogado') {
                navigate('/abogados/dashboard');
              } else {
                navigate('/dashboard');
              }
            } else {
              navigate('/dashboard');
            }
          } else {
            navigate('/dashboard');
          }
        } catch (redirectError) {
          console.error('Error completing setup:', redirectError);
          navigate('/dashboard');
        }
      }, 2000);

    } catch (error) {
      console.error('Error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al establecer la contraseña';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score <= 2) return 'Débil';
    if (score <= 4) return 'Media';
    return 'Fuerte';
  };

  // Mostrar loading mientras se verifica la sesión
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verificando enlace
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Estamos verificando tu enlace de activación...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Cuenta Activada!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tu contraseña ha sido establecida correctamente. Serás redirigido al dashboard en unos segundos.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ir al Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Activar Cuenta
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Establece tu contraseña para completar la configuración de tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nueva Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Ingresa tu nueva contraseña"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirma tu nueva contraseña"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Indicador de Fortaleza */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fortaleza:</span>
                    <span className={`text-sm font-medium ${
                      getPasswordStrengthText() === 'Débil' ? 'text-red-600' :
                      getPasswordStrengthText() === 'Media' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Requisitos de Contraseña */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  La contraseña debe contener:
                </p>
                <div className="grid grid-cols-1 gap-1 text-sm">
                  <div className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Al menos 8 caracteres
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Una letra mayúscula
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.lowercase ? 'text-green-6 00' : 'text-gray-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Una letra minúscula
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Un número
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.special ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    Un carácter especial
                  </div>
                </div>
              </div>

              {/* Botón de Submit */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !sessionEstablished || !password || !confirmPassword || password !== confirmPassword || !Object.values(passwordStrength).every(Boolean)}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Estableciendo contraseña...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Establecer Contraseña
                  </>
                )}
              </Button>
            </form>

            {/* Información de Seguridad */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Información de Seguridad
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Tu contraseña es encriptada y almacenada de forma segura. Asegúrate de elegir una contraseña fuerte y única.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteSetup;