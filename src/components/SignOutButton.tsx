
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleSignOut}
      variant={variant} 
      size={size} 
      className={`text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 ${className}`}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {children || "Cerrar Sesión"}
    </Button>
  );
};

export default SignOutButton;
