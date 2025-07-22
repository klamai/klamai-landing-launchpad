
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ActivationToken {
  id: string;
  email: string;
  solicitud_id: string;
  expires_at: string;
  temp_password: string;
}

export const useLawyerActivation = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateToken = async (token: string): Promise<ActivationToken | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lawyer_activation_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Token inválido o expirado');
      }

      return data;
    } catch (error: any) {
      console.error('Error validating token:', error);
      toast({
        title: "Error",
        description: "Token de activación inválido o expirado",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Obtener datos del token
      const tokenData = await validateToken(token);
      if (!tokenData) return false;

      // Intentar iniciar sesión con la contraseña temporal para acceder al usuario
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tokenData.email,
        password: tokenData.temp_password
      });

      if (signInError) {
        console.error('Error signing in with temp password:', signInError);
        throw signInError;
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Marcar token como usado
      const { error: tokenError } = await supabase
        .from('lawyer_activation_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (tokenError) {
        console.error('Error marking token as used:', tokenError);
      }

      toast({
        title: "¡Cuenta activada!",
        description: "Tu cuenta ha sido activada exitosamente",
      });

      return true;
    } catch (error: any) {
      console.error('Error activating account:', error);
      toast({
        title: "Error",
        description: error.message || "Error al activar la cuenta",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    validateToken,
    activateAccount
  };
};
