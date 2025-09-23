
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import { FileText, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecureLogger } from '@/utils/secureLogging';
import { CustomChat } from '@/components/client/chat/CustomChat';

type Step = 'form' | 'chat';

interface NuevaConsultaSectionProps {}

const NuevaConsultaSection = memo<NuevaConsultaSectionProps>(() => {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const uploadFilesToStorage = async (files: File[], casoId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${casoId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('documentos-cliente')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading file:', error);
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documentos-cliente')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  const handleFormSubmit = async (formData: { query: string; files?: File[] }) => {
    if (!formData.query?.trim()) return;

    setIsLoading(true);

    try {
      // 1. Generate session token for security
      const sessionToken = crypto.randomUUID();

      // 2. Upload files to Supabase Storage if any
      let uploadedFileUrls: string[] = [];
      if (formData.files && formData.files.length > 0) {
        // First create a temporary case ID for file upload
        const tempCaseId = `temp-${sessionToken}`;
        uploadedFileUrls = await uploadFilesToStorage(formData.files, tempCaseId);
      }

      // 3. Create draft case in Supabase
      const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
        body: {
          motivo_consulta: formData.query.trim(),
          session_token: sessionToken,
          archivos_adjuntos: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined
        }
      });

      if (error) {
        console.error('Error creating draft case:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar tu consulta. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const casoId = data?.caso_id;
      if (!casoId) {
        console.error('No caso_id received from function');
        toast({
          title: "Error",
          description: "No se pudo procesar tu consulta. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // 4. If files were uploaded with temp ID, move them to correct case ID
      if (uploadedFileUrls.length > 0) {
        // TODO: Implement file renaming/moving logic if needed
      }

      // 5. Record consent
      await supabase.functions.invoke('record-consent', {
        body: {
          caso_id: casoId,
          consent_type: 'dashboard_consultation',
          accepted_terms: true,
          accepted_privacy: true,
          policy_terms_version: 1,
          policy_privacy_version: 1,
        },
      });

      // 6. Save essential data for chat
      localStorage.setItem('userConsultation', formData.query.trim());
      localStorage.setItem('casoId', casoId);
      localStorage.setItem('current_session_token', sessionToken);

      SecureLogger.info('Case created successfully from dashboard', 'NuevaConsultaSection');

      // 7. Transition to chat
      setCaseId(casoId);
      setCurrentStep('chat');

      toast({
        title: "Consulta creada",
        description: "Tu consulta ha sido procesada correctamente. Iniciando conversación...",
      });

    } catch (error) {
      SecureLogger.error(error, 'handleFormSubmit NuevaConsultaSection');
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    // Reset all state to initial values
    setCurrentStep('form');
    setCaseId(null);
    setIsLoading(false);

    // Clear localStorage data related to the current session
    localStorage.removeItem('userConsultation');
    localStorage.removeItem('casoId');
    localStorage.removeItem('current_session_token');

    // Show confirmation toast
    toast({
      title: "Vuelto al formulario",
      description: "Puedes crear una nueva consulta.",
    });
  };

  return (
    <div className="h-full w-full">
      <AnimatePresence mode="wait">
        {currentStep === 'form' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {/* TODO: Initial Query Form Component */}
            <InitialQueryForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {/* TODO: Chat Interface Component */}
            <CustomChat
              caseId={caseId!}
              onBack={handleBackToForm}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

NuevaConsultaSection.displayName = 'NuevaConsultaSection';

// Placeholder components - will be implemented in subsequent tasks
interface InitialQueryFormProps {
  onSubmit: (data: { query: string; files?: File[] }) => void;
  isLoading: boolean;
}

const InitialQueryForm: React.FC<InitialQueryFormProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit({ query, files });
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Nueva Consulta Legal
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Describe detalladamente tu consulta legal. Cuanta más información proporciones,
          mejor podremos ayudarte.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Información de tu consulta
          </CardTitle>
          <CardDescription>
            Completa los detalles de tu consulta legal para que podamos procesarla correctamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="query" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Describe tu consulta legal *
              </label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Explica detalladamente tu situación legal, incluyendo:
• Los hechos relevantes
• Las partes involucradas
• El resultado que esperas obtener
• Cualquier plazo o urgencia"
                className="min-h-[150px] resize-none"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {query.length}/2000 caracteres (mínimo 50)
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Documentos adjuntos (opcional)
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Adjunta contratos, documentos legales, correos electrónicos u otros archivos relevantes
                </p>
              </div>
              <FileUpload
                onFilesChange={handleFilesChange}
                maxFiles={10}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !query.trim() || query.length < 50}
                className="flex-1 h-12 text-base"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando consulta...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Iniciar Consulta
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-xs text-gray-500 border-t pt-4">
            <p className="mb-2">
              <strong>Nota importante:</strong> La información proporcionada será utilizada únicamente
              para procesar tu consulta legal y mantener la confidencialidad profesional.
            </p>
            <p>
              Una vez iniciada la consulta, podrás conversar directamente con nuestro sistema
              de IA especializado en derecho para resolver tus dudas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default NuevaConsultaSection;
