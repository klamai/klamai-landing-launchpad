import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const planId = searchParams.get('planId');
  const casoId = searchParams.get('casoId');

  useEffect(() => {
    console.log('AuthCallback - Estado inicial:', { 
      loading, 
      user: user?.id, 
      planId, 
      casoId 
    });

    if (loading) return;

    if (!user) {
      console.log('AuthCallback - No hay usuario, redirigiendo a auth');
      navigate('/auth');
      return;
    }

    if (!planId || !casoId) {
      console.log('AuthCallback - Faltan parámetros, redirigiendo al dashboard');
      navigate('/dashboard');
      return;
    }

    console.log('AuthCallback - Iniciando proceso de pago');
    processPayment();
  }, [user, loading, planId, casoId]);

  const processPayment = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      // 1. Vincular caso al usuario y transferir datos borrador
      await linkCaseToUser(casoId!, user!.id);

      // 2. Crear sesión de pago en Stripe
      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: planId,
          caso_id: casoId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast({
        title: "Error al procesar el pago",
        description: error instanceof Error ? error.message : "Error inesperado",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  };

  const linkCaseToUser = async (casoId: string, userId: string) => {
    console.log('Vinculando caso al usuario:', { casoId, userId });
    
    // Obtener datos del caso
    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .select('*')
      .eq('id', casoId)
      .single();

    console.log('Datos del caso obtenidos:', { caso, casoError });

    if (casoError) {
      console.error('Error al obtener caso:', casoError);
      throw new Error('Error al obtener datos del caso');
    }

    // Actualizar caso con el cliente_id y cambiar estado
    const { error: updateCasoError } = await supabase
      .from('casos')
      .update({
        cliente_id: userId,
        estado: 'esperando_pago'
      })
      .eq('id', casoId);

    console.log('Resultado actualización caso:', { updateCasoError });

    if (updateCasoError) {
      console.error('Error al actualizar caso:', updateCasoError);
      throw new Error('Error al vincular caso al usuario');
    }

    // Actualizar perfil del usuario con datos borrador del caso
    const profileUpdates: any = {};
    
    if (caso.nombre_borrador) profileUpdates.nombre = caso.nombre_borrador;
    if (caso.apellido_borrador) profileUpdates.apellido = caso.apellido_borrador;
    if (caso.telefono_borrador) profileUpdates.telefono = caso.telefono_borrador;
    if (caso.ciudad_borrador) profileUpdates.ciudad = caso.ciudad_borrador;
    if (caso.tipo_perfil_borrador) profileUpdates.tipo_perfil = caso.tipo_perfil_borrador;
    if (caso.razon_social_borrador) profileUpdates.razon_social = caso.razon_social_borrador;
    if (caso.nif_cif_borrador) profileUpdates.nif_cif = caso.nif_cif_borrador;
    if (caso.direccion_fiscal_borrador) profileUpdates.direccion_fiscal = caso.direccion_fiscal_borrador;
    if (caso.nombre_gerente_borrador) profileUpdates.nombre_gerente = caso.nombre_gerente_borrador;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) {
        console.error('Error al actualizar perfil:', profileError);
        // No lanzar error aquí para no bloquear el pago
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Procesando tu solicitud...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Te estamos redirigiendo al sistema de pago seguro.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;