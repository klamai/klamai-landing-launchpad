import React, { useEffect, useState, useMemo } from 'react';
import { useCaseNotes } from '@/hooks/useCaseNotes';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseNotesSectionProps {
  casoId: string;
  onlyForClient?: boolean;
}

const destinatarioOptions = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'abogado', label: 'Abogado' },
  { value: 'ambos', label: 'Ambos' },
];

export const CaseNotesSection: React.FC<CaseNotesSectionProps> = ({ casoId, onlyForClient }) => {
  const { user, profile } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [destinatario, setDestinatario] = useState<'cliente' | 'abogado' | 'ambos'>('abogado');
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { notes, loading, error, fetchNotes, addNote, updateNote, deleteNote } = useCaseNotes(casoId);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const puedeAgregarNota = profile && (profile.role === 'abogado' || profile.role === 'cliente');
  const esSuperAdmin = profile && profile.role === 'abogado' && profile.tipo_abogado === 'super_admin';
  const esCliente = profile && profile.role === 'cliente';

  // Filtrar notas para el cliente: solo ve sus propias notas o las del abogado para cliente/ambos
  const notasFiltradas = useMemo(() => {
    if (!onlyForClient || !profile) return notes;
    return notes.filter(nota =>
      // Notas que el cliente escribió (cualquier destinatario, pero solo puede crear para abogado)
      (nota.autor_id === profile.id)
      // O notas que el abogado escribió para el cliente o ambos
      || (nota.autor_rol === 'abogado' && (nota.destinatario === 'cliente' || nota.destinatario === 'ambos'))
    );
  }, [notes, onlyForClient, profile]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !profile || !casoId) return;
    await addNote({
      caso_id: casoId,
      contenido: newNote,
      destinatario: esCliente ? 'abogado' : destinatario,
      autor_rol: profile.role,
      autor_id: profile.id,
    });
    setNewNote('');
  };

  const handleEdit = (id: string, contenido: string) => {
    setEditId(id);
    setEditContent(contenido);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await updateNote(id, editContent);
    setEditId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditContent('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Notas del Caso</h3>
      <ScrollArea className="h-64 bg-gray-50 dark:bg-gray-900 rounded p-2 border">
        {loading && <div className="text-center text-gray-500">Cargando notas...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {notasFiltradas.length === 0 && !loading && (
          <div className="text-center text-gray-400">No hay notas para este caso.</div>
        )}
        <ul className="space-y-3">
          {notasFiltradas.map((nota) => (
            <li key={nota.id} className="bg-white dark:bg-gray-800 rounded p-3 shadow border flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline">{nota.autor_rol}</Badge>
                <span className="font-medium text-blue-800 dark:text-blue-200">{nota.autor_nombre} {nota.autor_apellido}</span>
                <Badge variant="secondary">Para: {nota.destinatario}</Badge>
                <span className="text-gray-400 ml-auto">{format(new Date(nota.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
              {editId === nota.id ? (
                <>
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className="resize-none mt-1"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" type="button" onClick={() => handleSaveEdit(nota.id)} disabled={loading || !editContent.trim()}>
                      Guardar
                    </Button>
                    <Button size="sm" type="button" variant="secondary" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{nota.contenido}</div>
              )}
              {(nota.autor_id === profile?.id || esSuperAdmin) && editId !== nota.id && (
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(nota.id, nota.contenido)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteNote(nota.id)}>
                    Eliminar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
      {puedeAgregarNota && (
        <form onSubmit={handleAddNote} className="space-y-2">
          <Textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder={esCliente ? "Escribe una nota para tu abogado..." : "Escribe una nota para el cliente..."}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={esCliente ? 'abogado' : destinatario}
              onChange={e => setDestinatario(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
              disabled={esCliente}
            >
              {destinatarioOptions
                .filter(opt => !esCliente || opt.value === 'abogado')
                .map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <Button type="submit" size="sm" disabled={loading || !newNote.trim()}>
              Agregar Nota
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CaseNotesSection; 