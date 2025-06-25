
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, LogOut } from "lucide-react";

const AuthButton = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-md"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/profile">
          <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </Button>
        </Link>
        <Button 
          onClick={signOut} 
          variant="ghost" 
          size="sm" 
          className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </div>
    );
  }

  return (
    <Link to="/login">
      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
        Iniciar sesión
      </Button>
    </Link>
  );
};

export default AuthButton;
