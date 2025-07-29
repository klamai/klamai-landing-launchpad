import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotaCaso } from '@/integrations/supabase/types';

export type NotaCasoConAutor = NotaCaso & {
  autor_nombre?: string;
  autor_apellido?: string;
};

export function useCaseNotes(casoId: string | null) {
  const [notes, setNotes] = useState<NotaCasoConAutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!casoId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('notas_caso')
      .select('*, profiles:autor_id(nombre,apellido)')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      // Mapear para exponer nombre y apellido del autor
      setNotes((data || []).map((n: any) => ({
        ...n,
        autor_nombre: n.profiles?.nombre || '',
        autor_apellido: n.profiles?.apellido || '',
      })));
    }
    setLoading(false);
  }, [casoId]);

  const addNote = useCallback(async (nota: Omit<NotaCaso, 'id' | 'created_at'>) => {
    if (!casoId) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('notas_caso')
      .insert([{ ...nota, caso_id: casoId }]);
    if (error) setError(error.message);
    await fetchNotes();
    setLoading(false);
  }, [casoId, fetchNotes]);

  const updateNote = useCallback(async (id: string, contenido: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('notas_caso')
      .update({ contenido })
      .eq('id', id);
    if (error) setError(error.message);
    await fetchNotes();
    setLoading(false);
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('notas_caso')
      .delete()
      .eq('id', id);
    if (error) setError(error.message);
    await fetchNotes();
    setLoading(false);
  }, [fetchNotes]);

  return { notes, loading, error, fetchNotes, addNote, updateNote, deleteNote };
} 