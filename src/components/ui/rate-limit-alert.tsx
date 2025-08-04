import React from 'react';
import { AlertCircle, Clock, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface RateLimitAlertProps {
  type: 'login' | 'signup' | 'upload' | 'api';
  remainingAttempts: number;
  resetTime?: number;
  blockedUntil?: number;
  onRetry?: () => void;
}

const RateLimitAlert: React.FC<RateLimitAlertProps> = ({
  type,
  remainingAttempts,
  resetTime,
  blockedUntil,
  onRetry
}) => {
  const isBlocked = blockedUntil && Date.now() < blockedUntil;
  
  const getTypeInfo = () => {
    switch (type) {
      case 'login':
        return {
          title: 'Demasiados intentos de inicio de sesión',
          description: 'Has excedido el límite de intentos de inicio de sesión.',
          icon: Shield,
        };
      case 'signup':
        return {
          title: 'Demasiados intentos de registro',
          description: 'Has excedido el límite de intentos de registro.',
          icon: Shield,
        };
      case 'upload':
        return {
          title: 'Demasiadas subidas de archivos',
          description: 'Has excedido el límite de subidas de archivos.',
          icon: Clock,
        };
      case 'api':
        return {
          title: 'Demasiadas solicitudes',
          description: 'Has excedido el límite de solicitudes al servidor.',
          icon: AlertCircle,
        };
      default:
        return {
          title: 'Límite excedido',
          description: 'Has excedido el límite permitido.',
          icon: AlertCircle,
        };
    }
  };

  const typeInfo = getTypeInfo();
  const IconComponent = typeInfo.icon;

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff <= 0) return 'ahora';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  };

  if (isBlocked && blockedUntil) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <IconComponent className="h-4 w-4" />
        <AlertTitle>{typeInfo.title}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            {typeInfo.description} Tu cuenta ha sido bloqueada temporalmente por seguridad.
          </p>
          <p className="text-sm font-medium">
            Puedes intentar de nuevo en: {formatTimeRemaining(blockedUntil)}
          </p>
          <div className="flex items-center gap-2 text-xs text-red-600">
            <Shield className="h-3 w-3" />
            <span>Esta es una medida de seguridad para proteger tu cuenta</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="border-yellow-200 bg-yellow-50">
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{typeInfo.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          {typeInfo.description} Te quedan {remainingAttempts} intento{remainingAttempts !== 1 ? 's' : ''}.
        </p>
        {resetTime && (
          <p className="text-sm">
            El contador se reinicia en: {formatTimeRemaining(resetTime)}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-yellow-600">
          <Shield className="h-3 w-3" />
          <span>Esta es una medida de seguridad para proteger tu cuenta</span>
        </div>
        {onRetry && remainingAttempts > 0 && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Intentar de nuevo
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default RateLimitAlert; 