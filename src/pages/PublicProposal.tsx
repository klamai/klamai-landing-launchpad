import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { FooterSection } from '@/components/ui/footer-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PricingCard } from '@/components/ui/pricing-card';
import { 
  CheckCircle2, 
  FileText, 
  Sparkles,
  Eye,
  Lock,
  Sun,
  Moon,
  Gavel,
  User,
  Shield,
  Clock,
  Star,
  MessageCircle,
  Phone,
  Mail,
  Award,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

const PublicProposal = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });
  const [accepted, setAccepted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [casoId, setCasoId] = useState<string | null>(null);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [analysisMarkdown, setAnalysisMarkdown] = useState<string | null>(null);
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState<string | null>(null);
  const [lawyerInfo, setLawyerInfo] = useState<any>(null);
  const [caseInfo, setCaseInfo] = useState<any>(null);


  useEffect(() => {
    // aplicar tema al cargar
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

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

          // Extraer analisis_caso y mensaje_whatsapp soportando múltiples estructuras
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

          // Cargar información adicional del caso y abogado
          if (casoId) {
            try {
              const { data: casoData, error: casoError } = await supabase
                .from('casos')
                .select(`
                  id,
                  motivo_consulta,
                  especialidades:especialidades_id(nombre),
                  asignaciones_casos(
                    abogado_id,
                    estado_asignacion,
                    profiles:abogado_id(
                      nombre,
                      apellido,
                      email,
                      telefono,
                      tipo_abogado
                    )
                  )
                `)
                .eq('id', casoId as any)
                .single();

              if (!casoError && casoData && 'asignaciones_casos' in casoData) {
                setCaseInfo(casoData);
                
                // Obtener información del abogado asignado
                const asignacion = (casoData as any).asignaciones_casos?.[0];
                if (asignacion?.profiles) {
                  setLawyerInfo(asignacion.profiles);
                }
              }
            } catch (e) {
              console.log('No se pudo cargar información adicional del caso:', e);
            }
          }
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
      
      // Crear sesión de checkout anónima usando el token de propuesta
      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout-anonima-por-token', {
        body: { proposal_token: token },
      });
      
      if (error) throw new Error(error.message);
      if (data?.url) {
        // Redirigir directamente a Stripe sin autenticación
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

  // Shared Header Component
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  };

  const Header = () => (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">KlamAI</span>
          </a>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:flex bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Propuesta Personalizada
            </Badge>
            <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="relative mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Gavel className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Preparando tu propuesta
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Estamos cargando tu caso con nuestro equipo de abogados...
            </p>
            <div className="w-full max-w-xs mx-auto mt-6 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <FooterSection />
      </div>
    );
  }

  if (!assistantMessage && !analysisMarkdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        {/* Error State */}
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Enlace no válido o caducado
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Este enlace de propuesta no es válido o ha expirado. Contacta con tu abogado para obtener un nuevo enlace.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg"
            >
              Volver al inicio
            </Button>
          </div>
        </div>

        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* CSS personalizado para animación de pulso lento */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }
      `}</style>
      
      <Header />

      {/* Main Content */}
      <main className="relative px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Políticas y Consentimiento - Siempre visible primero */}
          {!accepted && (
            <Card className="bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-cyan-900/20 backdrop-blur-sm border border-blue-200/80 dark:border-blue-800/60 shadow-2xl mb-8 overflow-hidden mx-4 sm:mx-6 md:mx-12 lg:mx-20 xl:mx-28">
              <CardHeader className="flex flex-col items-center text-center pb-6 border-b border-gray-100 dark:border-gray-700 px-6 sm:px-8 md:px-12 lg:px-16 pt-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2 max-w-full">
                  ¡Tu Análisis Legal Está Listo!
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Un abogado especialista ya ha revisado tu caso <span className="font-semibold text-green-600 dark:text-green-400">gratuitamente</span> y ha preparado una propuesta personalizada. 
                  <br /><br />
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Tu análisis incluye:</span>
                  <ul className="mt-2 text-left space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Evaluación legal completa de tu situación</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Recomendaciones estratégicas personalizadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Plan de acción detallado</span>
                    </li>
                  </ul>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 px-4 sm:px-6 md:px-12 lg:px-16">
                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-blue-50/80 dark:from-blue-900/30 dark:via-cyan-900/20 dark:to-blue-900/30 rounded-2xl p-6 sm:p-7 lg:p-8 border border-blue-200/60 dark:border-blue-700/40 shadow-lg">
                    <label className="flex items-start gap-5 cursor-pointer group">
                      <div className="flex-shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                        checked={acceptTerms && acceptPrivacy}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAcceptTerms(checked);
                          setAcceptPrivacy(checked);
                        }}
                        className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 bg-white border-2 border-blue-300 rounded-lg focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 transition-all duration-200 group-hover:border-blue-400 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white leading-relaxed">
                        He leído y acepto los{' '}
                        <a href="/aviso-legal" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-semibold transition-colors duration-200 hover:text-blue-800">
                          Términos y Condiciones
                        </a>
                        {' '}y la{' '}
                        <a href="/politicas-privacidad" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-semibold transition-colors duration-200 hover:text-blue-800">
                          Política de Privacidad
                        </a>
                        {' '}para acceder a mi análisis legal personalizado
                      </span>
                    </div>
                  </label>
                  </div>
                </div>

                                 <Separator className="my-6" />

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
                    className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white px-6 py-3 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                    size="lg"
                  >
                    {savingConsent ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 sm:w-6 sm:w-6 mr-2 sm:mr-3" />
                        Ver Mi Análisis Legal
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hero Section - Solo visible después de aceptar */}
          {accepted && (
            <section className="mb-10">
              <div className="text-center mb-8">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mb-4 py-1.5 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Caso Revisado por Abogado Especialista
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Tu <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Propuesta Legal
                  </span> Está Lista
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                  Nuestro abogado especialista ha revisado tu caso y ha preparado una propuesta personalizada 
                  para resolver tu situación legal de la manera más eficiente.
                </p>
                
                {/* Botón de Pago Principal */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Button
                    onClick={handleCheckout}
                    disabled={!casoId || creatingCheckout}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 min-w-[200px]"
                  >
                    {creatingCheckout ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-5 h-5 mr-2" />
                        Pagar Visita - €37.50
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className="text-2xl font-bold text-red-500 dark:text-red-400 line-through">€127.00</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        70% OFF
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Oferta válida solo por 24 horas
                    </p>
                  </div>
                </div>
              </div>

              {/* (Eliminadas) Tarjetas de estadísticas para simplificar la vista */}
            </section>
          )}

          {/* Contenido principal - Solo visible después de aceptar */}
          {accepted && (
            <div className="space-y-8">
              {/* Análisis del Caso */}
              {analysisMarkdown && (
                <Card className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900/90 dark:via-blue-950/80 dark:to-cyan-950/90 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-700 shadow-2xl dark:shadow-blue-900/50 overflow-hidden">
                  <CardHeader className="flex flex-col items-center text-center pb-6 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 pt-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-6">
                      <FileText className="w-7 h-7 text-white" />
                      </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-3 max-w-full">
                          Análisis de tu Caso
                        </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                      Evaluación detallada realizada por nuestro abogado especialista
                        </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 px-6 sm:px-8">
                    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-headings:font-medium prose-h2:text-xl prose-h3:text-lg prose-li:text-gray-700 prose-li:dark:text-gray-300 prose-strong:text-gray-900 prose-strong:dark:text-white prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysisMarkdown}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información del Abogado */}
              {lawyerInfo && (
                <Card className="bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950/80 dark:via-gray-900/90 dark:to-emerald-950/90 backdrop-blur-sm border-2 border-green-200 dark:border-green-700 shadow-2xl dark:shadow-green-900/50 overflow-hidden">
                  <CardHeader className="flex flex-col items-center text-center pb-6 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 pt-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-6">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-3 max-w-full">
                      Tu Abogado Especialista
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                      Un profesional cualificado ha revisado tu caso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 px-6 sm:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {lawyerInfo.nombre} {lawyerInfo.apellido}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <Award className="w-3 h-3 mr-1" />
                            Abogado Verificado
                          </Badge>
                          {lawyerInfo.tipo_abogado === 'super_admin' && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              <Star className="w-3 h-3 mr-1" />
                              Especialista Senior
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Profesional especializado en {caseInfo?.especialidades?.nombre || 'derecho general'} 
                          con amplia experiencia en casos similares al tuyo.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span>Colegiado y Verificado</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span>Disponible 24/7</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estadísticas de Confianza */}
              <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/80 dark:via-gray-900/90 dark:to-indigo-950/90 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-700 shadow-2xl dark:shadow-blue-900/50 overflow-hidden">
                <CardHeader className="text-center pb-6 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 pt-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    ¿Por qué confiar en KlamAI?
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                    Miles de clientes han confiado en nosotros para resolver sus casos legales
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 px-6 sm:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">2,500+</h3>
                      <p className="text-gray-600 dark:text-gray-400">Casos Resueltos</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">4.9/5</h3>
                      <p className="text-gray-600 dark:text-gray-400">Valoración Media</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">24h</h3>
                      <p className="text-gray-600 dark:text-gray-400">Respuesta Garantizada</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card className="bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-slate-900/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 shadow-2xl dark:shadow-gray-900/50 overflow-hidden">
                <CardHeader className="text-center pb-6 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 pt-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Preguntas Frecuentes
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                    Resolvemos las dudas más comunes sobre nuestro servicio
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 px-6 sm:px-8">
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        ¿Qué incluye la visita estratégica?
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        30 minutos de visita personalizada con un abogado especialista, revisión de documentos, 
                        recomendación de estrategia y plan de acción personalizado.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        ¿Cómo funciona el pago?
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        El pago es 100% seguro a través de Stripe. Solo pagas si estás satisfecho con el servicio. 
                        Ofrecemos garantía de devolución en caso de no estar conforme.
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        ¿Cuándo tendré mi visita?
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Una vez realizado el pago, te contactaremos en menos de 24 horas para coordinar 
                        la visita en el horario que mejor te convenga.
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        ¿Qué pasa si no estoy conforme?
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Ofrecemos garantía de satisfacción. Si no estás conforme con el servicio, 
                        te devolvemos el dinero sin preguntas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan de Consulta */}
              <PricingCard
                title="Visita Estratégica con Abogado"
                description="Primera visita bonificada"
                price={37.50}
                originalPrice={127.00}
                features={[
                  {
                    title: "¿Qué incluye?",
                    items: [
                      "30 min con abogado especialista",
                      "Revisión inicial de documentos",
                      "Recomendación de estrategia",
                      "Plan de acción personalizado"
                    ]
                  },
                  {
                    title: "Beneficios",
                    items: [
                      "Abogados verificados y especializados",
                      "Consulta inmediata sin esperas",
                      "Confidencialidad garantizada",
                      "Seguimiento post-consulta"
                    ]
                  }
                ]}
                buttonText="Pagar Visita"
                onButtonClick={handleCheckout}
                disabled={!casoId}
                loading={creatingCheckout}
                urgentMessage="🔥 ¡OFERTA LIMITADA! 70% de descuento válido solo por 24 horas. ¡No pierdas esta oportunidad!"
              />
            </div>
          )}
        </div>
      </main>



      {/* Botón Flotante de Pago - Solo visible después de aceptar */}
      {accepted && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            {/* Efecto de pulso sutil y lento */}
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20" style={{
              animation: 'pulse-slow 4s ease-in-out infinite'
            }}></div>
            <Button
              onClick={handleCheckout}
              disabled={!casoId || creatingCheckout}
              size="lg"
              className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-full text-base font-semibold shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-blue-500/30"
            >
            {creatingCheckout ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4 mr-2" />
                Pagar Visita - €37.50
              </>
            )}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default PublicProposal;

