import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError, logAuth } from '@/utils/secureLogging';

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
          console.error('Error verificando sesión admin:', sessionError);
          await logError('admin_session_error', sessionError as any);
          throw new Error('Error de sesión');
        }

        if (!session?.user) {
          console.log('No hay sesión activa - redirigiendo a login admin');
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
          console.error('Error verificando perfil admin:', profileError);
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
          
          console.log('Acceso denegado - Usuario no es superadmin:', {
            role: profile?.role,
            tipo: profile?.tipo_abogado,
            userId: session.user.id,
            email: session.user.email
          });
          
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

        // Verificación exitosa
        console.log('✅ Acceso admin verificado:', {
          userId: session.user.id,
          email: session.user.email,
          nombre: profile.nombre,
          apellido: profile.apellido
        });
        
        await logAuth('login', true, `AdminSecurityMiddleware - Access granted: ${profile.nombre} ${profile.apellido}`);
        setIsVerified(true);

      } catch (error: any) {
        console.error('Error en middleware de seguridad admin:', error);
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




