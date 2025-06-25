
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, User, CreditCard, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  plan: string;
  created_at: string;
}

interface ChatHistory {
  id: string;
  message: string;
  response: string;
  timestamp: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchChatHistory();
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const updateProfile = async (updatedData: Partial<Profile>) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user?.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-10 w-10 text-blue-600 mx-auto mb-4 animate-spin" />
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">klamAI</span>
          </Link>
          <Button onClick={handleLogout} variant="outline">
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <Input
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  onBlur={(e) => updateProfile({ full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input value={profile?.email || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <Input
                  value={profile?.phone || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  onBlur={(e) => updateProfile({ phone: e.target.value })}
                  placeholder="Ingresa tu teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan actual
                </label>
                <div className="px-3 py-2 bg-blue-50 text-blue-800 rounded-md capitalize">
                  {profile?.plan || 'free'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Historial de pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{payment.description}</span>
                        <span className="text-green-600">${payment.amount}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()} - {payment.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay historial de pagos disponible.</p>
              )}
            </CardContent>
          </Card>

          {/* Chat History */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Historial de consultas recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chatHistory.length > 0 ? (
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className="border rounded-lg p-4">
                      <div className="mb-2">
                        <strong className="text-blue-600">Tu consulta:</strong>
                        <p className="mt-1">{chat.message}</p>
                      </div>
                      {chat.response && (
                        <div>
                          <strong className="text-green-600">Respuesta:</strong>
                          <p className="mt-1 text-sm">{chat.response.substring(0, 200)}...</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(chat.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No tienes consultas guardadas aún.</p>
                  <Link to="/chat">
                    <Button>Hacer una consulta</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
