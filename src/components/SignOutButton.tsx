
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface SignOutButtonProps {
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const SignOutButton = ({ 
  variant = "ghost", 
  size = "sm", 
  className = "",
  showIcon = true,
  children 
}: SignOutButtonProps) => {
  const { signOut, forceSignOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('🚪 Iniciando proceso de logout...');
    
    try {
      // Intentar logout normal primero
      await signOut();
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      
      console.log('✅ Logout exitoso - redirigiendo...');
      navigate('/', { replace: true });
      
    } catch (error: any) {
      console.warn('⚠️ Error en logout normal, intentando logout forzado:', error);
      
      try {
        // Si el logout normal falla, forzar logout
        await forceSignOut();
        
        toast({
          title: "Sesión cerrada",
          description: "Se ha cerrado la sesión de forma segura.",
        });
        
        console.log('✅ Logout forzado exitoso - redirigiendo...');
        navigate('/', { replace: true });
        
      } catch (forceError: any) {
        console.error('❌ Error en logout forzado:', forceError);
        
        // Como último recurso, limpiar manualmente y redirigir
        toast({
          title: "Sesión cerrada",
          description: "Se ha cerrado la sesión. Si persisten problemas, limpia el caché del navegador.",
          variant: "destructive",
        });
        
        // Limpiar storage manualmente
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (storageError) {
          console.warn('⚠️ Error limpiando storage:', storageError);
        }
        
        // Forzar recarga completa de la página como último recurso
        window.location.href = '/';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSignOut}
      variant={variant} 
      size={size} 
      disabled={isLoading}
      className={`text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 ${className}`}
    >
      {showIcon && <LogOut className={`h-4 w-4 ${children ? 'mr-2' : ''} ${isLoading ? 'animate-spin' : ''}`} />}
      {children || (isLoading ? "Cerrando..." : "Cerrar Sesión")}
    </Button>
  );
};

export default SignOutButton;
