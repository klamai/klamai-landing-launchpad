
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeCasesProps {
  onCaseUpdate: () => void;
}

export const useRealtimeCases = ({ onCaseUpdate }: UseRealtimeCasesProps) => {
  useEffect(() => {
    const channel = supabase
      .channel('casos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'casos'
        },
        () => {
          console.log('Nuevo caso creado');
          onCaseUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'casos'
        },
        () => {
          console.log('Caso actualizado');
          onCaseUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'casos'
        },
        () => {
          console.log('Caso eliminado');
          onCaseUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onCaseUpdate]);
};
