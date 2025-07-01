
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Settings, CreditCard, FileText, LogOut, History } from 'lucide-react';

const UserMenu = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
    navigate('/');
    setIsLoading(false);
  };

  if (!user || !profile) return null;

  const userInitials = `${profile.nombre?.charAt(0) || ''}${profile.apellido?.charAt(0) || ''}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || ''} alt="Avatar" />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.nombre} {profile.apellido}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {profile.role === 'cliente' ? 'Cliente' : 'Abogado'}
              </span>
              {profile.role === 'abogado' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {profile.creditos_disponibles} créditos
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/chat')}>
          <History className="mr-2 h-4 w-4" />
          <span>Mis Consultas</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/perfil')}>
          <User className="mr-2 h-4 w-4" />
          <span>Mi Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/pagos')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Pagos y Facturación</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/documentos')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Mis Documentos</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/configuracion')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
