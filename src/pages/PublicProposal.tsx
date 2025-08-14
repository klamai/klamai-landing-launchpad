import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AuthModal from '@/components/AuthModal';

const PublicProposal = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [casoId, setCasoId] = useState<string | null>(null);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [analysisMarkdown, setAnalysisMarkdown] = useState<string | null>(null);
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase.rpc('get_proposal_by_token', { p_token: token as any } as any);
        if (error) throw error;
        const rows: any[] = Array.isArray(data) ? data : [];
        if (!rows || rows.length === 0) {
          setAssistantMessage(null);
          setAnalysisMarkdown(null);
          setMensajeWhatsapp(null);
        } else {
          const raw = (rows[0] as any)?.assistant_message ?? null;
          setAssistantMessage(raw);
          setCasoId((rows[0] as any)?.caso_id ?? null);

          // Extraer analisis_caso y mensaje_whatsapp soportando múltiples estructuras:
          // - raw string JSON con { analisis_caso, mensaje_whatsapp }
          // - raw string JSON array con { output: string JSON }
          // - raw objeto JSONB con claves directas
          // - raw array JSONB con objetos que tengan output string JSON
          // - fallback: considerar raw como texto de WhatsApp
          const tryParse = (text: string) => {
            try { return JSON.parse(text); } catch { return null; }
          };

          const extractFromAny = (value: any): { analysis: string | null; whatsapp: string | null } => {
            // Caso A: objeto con claves directas
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              const maybeAnalysis = typeof value.analisis_caso === 'string' ? value.analisis_caso : null;
              const maybeWhatsapp = typeof value.mensaje_whatsapp === 'string' ? value.mensaje_whatsapp : null;
              if (maybeAnalysis || maybeWhatsapp) return { analysis: maybeAnalysis, whatsapp: maybeWhatsapp };
              // Caso A2: objeto con clave output (string JSON)
              if (typeof value.output === 'string') {
                const inner = tryParse(value.output);
                if (inner && typeof inner === 'object') {
                  const ia = typeof inner.analisis_caso === 'string' ? inner.analisis_caso : null;
                  const iw = typeof inner.mensaje_whatsapp === 'string' ? inner.mensaje_whatsapp : null;
                  if (ia || iw) return { analysis: ia, whatsapp: iw };
                }
              }
            }

            // Caso B: array de objetos (tomar el primero con datos válidos)
            if (Array.isArray(value)) {
              for (const item of value) {
                const res = extractFromAny(item);
                if (res.analysis || res.whatsapp) return res;
              }
            }

            // Caso C: string parseable a JSON
            if (typeof value === 'string') {
              const parsed = tryParse(value);
              if (parsed) return extractFromAny(parsed);
              // Fallback: tratar string como texto de WhatsApp
              if (value.trim().length > 0) return { analysis: null, whatsapp: value };
            }

            return { analysis: null, whatsapp: null };
          };

          const { analysis, whatsapp } = extractFromAny(raw);
          setAnalysisMarkdown(analysis);
          setMensajeWhatsapp(whatsapp);
        }
      } catch (e: any) {
        console.error(e);
        toast({ title: 'Enlace inválido o caducado', description: 'No pudimos cargar tu propuesta.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [token, toast]);

  const handleCheckout = async () => {
    if (!casoId || !token) return;
    try {
      setCreatingCheckout(true);
      // 1) Verificar sesión
      const { data: sessionData } = await supabase.auth.getSession();
      const isLogged = !!sessionData.session?.access_token;
      if (!isLogged) {
        // Abrir modal de autenticación
        setShowAuth(true);
        return;
      }

      // 2) Ligar caso por token (idempotente)
      const { error: linkError } = await supabase.rpc('link_case_by_proposal_token', { p_token: token });
      if (linkError) throw new Error(linkError.message || 'No se pudo vincular el caso');

      // 3) Crear sesión de checkout
      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: { plan_id: 'consulta-estrategica', caso_id: casoId },
      });
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (e: any) {
      toast({ title: 'Error al iniciar pago', description: e?.message || 'Inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setCreatingCheckout(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Propuesta de tu caso</h1>
      {loading ? (
        <p>Cargando…</p>
      ) : !assistantMessage && !analysisMarkdown ? (
        <p>Este enlace no es válido o ha caducado.</p>
      ) : (
        <div className="space-y-6">
          {!accepted && (
            <div className="p-4 border rounded-lg">
              <h2 className="font-semibold mb-2">Políticas y privacidad</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Antes de continuar, confirma que aceptas las políticas de uso y privacidad de KlamAI.
              </p>
              <Button onClick={() => setAccepted(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Acepto y deseo ver mi propuesta
              </Button>
            </div>
          )}

          {accepted && (
            <>
              <div className="p-4 border rounded-lg">
                {analysisMarkdown ? (
                  <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysisMarkdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay un análisis disponible por el momento.</p>
                )}
              </div>
              {/* Card del plan de consulta */}
              <div className="border rounded-xl p-4 bg-white/70 dark:bg-gray-900/40 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Consulta estratégica con abogado</h3>
                    <p className="text-sm text-muted-foreground">Primera consulta bonificada</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">37,50 €</div>
                    <div className="text-xs text-muted-foreground">IVA incl.</div>
                  </div>
                </div>
                <ul className="mt-3 text-sm list-disc list-inside text-muted-foreground">
                  <li>30 min con abogado especialista</li>
                  <li>Revisión inicial de documentos</li>
                  <li>Recomendación de estrategia</li>
                </ul>
                <div className="mt-4">
                  <Button onClick={handleCheckout} disabled={!casoId || creatingCheckout} className="bg-green-600 hover:bg-green-700 text-white w-full">
                    {creatingCheckout ? 'Creando pago…' : 'Pagar consulta con abogado'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {/* Modal de autenticación para continuar con el pago */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={async () => {
          setShowAuth(false);
          try {
            if (!token || !casoId) return;
            const { error: linkError } = await supabase.rpc('link_case_by_proposal_token', { p_token: token as any });
            if (linkError) throw new Error(linkError.message || 'No se pudo vincular el caso');
            const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
              body: { plan_id: 'consulta-estrategica', caso_id: casoId },
            });
            if (error) throw new Error(error.message);
            if (data?.url) window.location.href = data.url;
          } catch (e: any) {
            toast({ title: 'Error', description: e?.message || 'No se pudo iniciar el pago', variant: 'destructive' });
          }
        }}
        initialMode="signup"
        planId="consulta-estrategica"
        casoId={casoId ?? undefined}
        redirectToUrl={`${window.location.origin}/auth-callback?intent=pay&token=${encodeURIComponent(token || '')}&planId=consulta-estrategica`}
      />
    </div>
  );
};

export default PublicProposal;

