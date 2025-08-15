import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AuthModal from '@/components/AuthModal';
import { FooterSection } from '@/components/ui/footer-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Clock, 
  Users2, 
  Shield, 
  FileText, 
  MessageSquare, 
  Zap, 
  Star,
  Scale,
  ArrowRight,
  Sparkles,
  Eye,
  Lock,
  Check
} from 'lucide-react';

const PublicProposal = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header con logo */}
        <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img src="/logo.svg" alt="klamAI Logo" className="h-10 w-auto" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    klamAI
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Asistente Legal Inteligente</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Preparando tu propuesta personalizada
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Estamos analizando tu caso con inteligencia artificial...
            </p>
          </div>
        </div>

        {/* Footer */}
        <FooterSection />
      </div>
    );
  }

  if (!assistantMessage && !analysisMarkdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header con logo */}
        <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img src="/logo.svg" alt="klamAI Logo" className="h-10 w-auto" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    klamAI
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Asistente Legal Inteligente</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Error State */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Enlace no válido o caducado
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Este enlace de propuesta no es válido o ha expirado. Contacta con tu abogado para obtener un nuevo enlace.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
            >
              Volver al inicio
            </Button>
          </div>
        </div>

        {/* Footer */}
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header con logo */}
      <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="klamAI Logo" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  klamAI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asistente Legal Inteligente</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Propuesta Personalizada
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 mb-4">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Caso Analizado por IA
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Tu <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Propuesta Legal
              </span> Está Lista
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hemos analizado tu caso con inteligencia artificial y hemos preparado una propuesta personalizada 
              para resolver tu situación legal de la manera más eficiente.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Análisis IA</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Procesado en segundos</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">100% Seguro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Datos protegidos RGPD</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Abogados Expertos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Especialistas verificados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          {!accepted ? (
            /* Políticas y Consentimiento */
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  Políticas y Privacidad
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                  Para continuar y ver tu propuesta personalizada, necesitamos tu consentimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={acceptTerms} 
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        He leído y acepto los{' '}
                        <a href="/aviso-legal" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-semibold">
                          Términos y Condiciones
                        </a>
                      </span>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={acceptPrivacy} 
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        He leído y acepto la{' '}
                        <a href="/politicas-privacidad" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-semibold">
                          Política de Privacidad
                        </a>
                      </span>
                    </div>
                  </label>
                </div>

                <Separator />

                <div className="text-center">
                  <Button
                    disabled={!acceptTerms || !acceptPrivacy || savingConsent}
                    onClick={async () => {
                      if (!token) return;
                      try {
                        setSavingConsent(true);
                        await supabase.functions.invoke('record-consent', {
                          body: {
                            proposal_token: token,
                            consent_type: 'proposal_view',
                            accepted_terms: true,
                            accepted_privacy: true,
                            policy_terms_version: 1,
                            policy_privacy_version: 1,
                          },
                        });
                        setAccepted(true);
                      } catch (e: any) {
                        toast({ title: 'No se pudo registrar tu aceptación', description: e?.message || 'Inténtalo de nuevo.', variant: 'destructive' });
                      } finally {
                        setSavingConsent(false);
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {savingConsent ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 mr-2" />
                        Aceptar y Ver Propuesta
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Propuesta y Plan de Pago */
            <div className="space-y-8">
              {/* Análisis del Caso */}
              {analysisMarkdown && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          Análisis de tu Caso
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          Evaluación detallada realizada por nuestro asistente legal inteligente
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysisMarkdown}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Plan de Consulta */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 dark:bg-green-800/20 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                        <Scale className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-gray-900 dark:text-white">
                          Consulta Estratégica con Abogado
                        </CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-300 text-lg">
                          Primera consulta bonificada
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400">37,50 €</div>
                      <div className="text-sm text-green-600 dark:text-green-400">IVA incluido</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">¿Qué incluye?</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-gray-700 dark:text-gray-300">30 min con abogado especialista</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-gray-700 dark:text-gray-300">Revisión inicial de documentos</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-gray-700 dark:text-gray-300">Recomendación de estrategia</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-gray-700 dark:text-gray-300">Plan de acción personalizado</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Beneficios</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-gray-700 dark:text-gray-300">Abogados verificados y especializados</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-700 dark:text-gray-300">Consulta inmediata sin esperas</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">Confidencialidad garantizada</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-purple-500" />
                          <span className="text-gray-700 dark:text-gray-300">Seguimiento post-consulta</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="text-center">
                    <Button 
                      onClick={handleCheckout} 
                      disabled={!casoId || creatingCheckout} 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full md:w-auto"
                    >
                      {creatingCheckout ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creando pago...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-5 h-5 mr-2" />
                          Pagar Consulta con Abogado
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Pago seguro procesado por Stripe
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Información Adicional */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mt-1">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        ¿Tienes alguna pregunta?
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        Nuestro equipo está disponible para ayudarte. Contacta con nosotros en{' '}
                        <a href="mailto:gestiones@klamai.com" className="underline font-medium">
                          gestiones@klamai.com
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Modal de autenticación para continuar con el pago */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
        initialMode="signup"
        planId="consulta-estrategica"
        casoId={casoId ?? undefined}
        redirectToUrl={`${window.location.origin}/auth-callback?intent=pay&token=${encodeURIComponent(token || '')}&planId=consulta-estrategica&casoId=${encodeURIComponent(casoId || '')}`}
      />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default PublicProposal;

