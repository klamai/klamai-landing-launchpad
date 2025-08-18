import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError, logAuth } from '@/utils/secureLogging';
import { SecureLogger } from '@/utils/secureLogging';

interface AdminSecurityMiddlewareProps {
  children: React.ReactNode;
}

const AdminSecurityMiddleware = ({ children }: AdminSecurityMiddlewareProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        setIsChecking(true);
        
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          SecureLogger.error(sessionError, 'admin_session_error');
          await logError('admin_session_error', sessionError as any);
          throw new Error('Error de sesión');
        }

        if (!session?.user) {
          SecureLogger.info('No hay sesión activa - redirigiendo a login admin', 'admin_middleware');
          await logAuth('login', false, 'AdminSecurityMiddleware - No session');
          navigate('/admin/auth', { replace: true });
          return;
        }

        // Verificar perfil y permisos
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, tipo_abogado, nombre, apellido, email')
          .eq('id', session.user.id as any)
          .single();

        if (profileError) {
          SecureLogger.error(profileError, 'admin_profile_error');
          await logError('admin_profile_error', profileError as any);
          throw new Error('Error verificando perfil');
        }

        // Verificación estricta de superadmin
        if (!profile || 
            typeof profile !== 'object' || 
            !('role' in profile) || 
            !('tipo_abogado' in profile) ||
            profile.role !== 'abogado' || 
            profile.tipo_abogado !== 'super_admin') {
          
          // Log seguro: solo información no sensible
          SecureLogger.warn(`Acceso denegado - Usuario no es superadmin: role=${profile?.role}, tipo=${profile?.tipo_abogado}`, 'admin_middleware');
          
          await logAuth('login', false, `AdminSecurityMiddleware - Access denied: ${profile?.role}/${profile?.tipo_abogado}`);
          
          toast({
            title: "Acceso denegado",
            description: "Esta área está restringida a administradores.",
            variant: "destructive",
          });
          
          // Cerrar sesión por seguridad
          await supabase.auth.signOut();
          navigate('/admin/auth', { replace: true });
          return;
        }

        // Verificación exitosa - log seguro
        SecureLogger.info(`Acceso admin verificado: ${profile.nombre} ${profile.apellido}`, 'admin_middleware');
        
        await logAuth('login', true, `AdminSecurityMiddleware - Access granted: ${profile.nombre} ${profile.apellido}`);
        setIsVerified(true);

      } catch (error: any) {
        SecureLogger.error(error, 'admin_middleware_error');
        await logError('admin_middleware_error', error);
        
        toast({
          title: "Error de seguridad",
          description: "No se pudo verificar el acceso administrativo.",
          variant: "destructive",
        });
        
        navigate('/admin/auth', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    verifyAdminAccess();
  }, [navigate, toast]);

  // Mostrar loading mientras se verifica
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando acceso administrativo...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            🔒 Verificación de seguridad en progreso
          </p>
        </div>
      </div>
    );
  }

  // Si no está verificado, no mostrar nada (ya se redirigió)
  if (!isVerified) {
    return null;
  }

  // Acceso verificado, mostrar contenido
  return <>{children}</>;
};

export default AdminSecurityMiddleware;




