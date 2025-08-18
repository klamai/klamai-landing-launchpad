import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError, logAuth } from "@/utils/secureLogging";

const AdminAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        // Obtener la sesión actual después del OAuth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error obteniendo sesión:', sessionError);
          await logError('admin_oauth_session_error', sessionError as any);
          toast({
            title: "Error de autenticación",
            description: "No se pudo verificar la sesión.",
            variant: "destructive",
          });
          navigate('/admin/auth', { replace: true });
          return;
        }

        if (!session?.user) {
          console.log('No hay sesión activa');
          navigate('/admin/auth', { replace: true });
          return;
        }

        // Verificar que el usuario es superadmin ANTES de redirigir
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, tipo_abogado, nombre, apellido')
          .eq('id', session.user.id as any)
          .single();

        if (profileError) {
          console.error('Error verificando perfil:', profileError);
          await logError('admin_oauth_profile_error', profileError as any);
          
          toast({
            title: "Error de verificación",
            description: "No se pudo verificar los permisos de administrador.",
            variant: "destructive",
          });
          
          // Cerrar sesión por seguridad
          await supabase.auth.signOut();
          navigate('/admin/auth', { replace: true });
          return;
        }

        // Verificar permisos de superadmin
        if (profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin') {
          // CASO 1: Es Super Admin
          await logAuth('login', true, `AdminAuthCallback - Super Admin Access Granted: ${profile.nombre}`);
          toast({
            title: "¡Autenticación exitosa!",
            description: "Acceso autorizado como administrador.",
          });
          navigate('/admin/dashboard', { replace: true });
        } else {
          // CASO 2: No es Super Admin, pero es un usuario válido (cliente o abogado regular)
          await logAuth('login', true, `AdminAuthCallback - Non-Admin Login Attempt: ${profile?.role || 'unknown'}`);
          toast({
            title: "Acceso de Administrador Denegado",
            description: "Iniciaste sesión con una cuenta válida, pero no es de administrador. Te redirigiremos a tu panel correspondiente.",
            variant: "default",
          });

          // Redirección inteligente a su dashboard
          if (profile?.role === 'cliente') {
            navigate('/dashboard', { replace: true });
          } else if (profile?.role === 'abogado') {
            navigate('/abogados/dashboard', { replace: true });
          } else {
            // Caso improbable: usuario sin rol definido
            await supabase.auth.signOut();
            navigate('/auth', { replace: true });
          }
        }

      } catch (error: any) {
        console.error('Error durante verificación OAuth:', error);
        await logError('admin_oauth_verification_error', error);
        
        toast({
          title: "Error inesperado",
          description: "Error durante la verificación de acceso.",
          variant: "destructive",
        });
        
        navigate('/admin/auth', { replace: true });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdminAccess();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">
          {isVerifying ? "Verificando permisos de administrador..." : "Redirigiendo..."}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          🔒 Verificando acceso seguro
        </p>
      </div>
    </div>
  );
};

export default AdminAuthCallback;
