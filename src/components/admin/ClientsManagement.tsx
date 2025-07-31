import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  FileText, 
  CreditCard, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Euro,
  ChevronDown,
  Plus,
  Shield,
  Loader2,
  Copy,
  Send,
  CheckCircle2
} from "lucide-react";

// Componente de acceso no autorizado
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-xl text-red-600">Acceso No Autorizado</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          No tienes permisos para acceder a esta sección. Solo los super administradores pueden gestionar clientes.
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </CardContent>
    </Card>
  </div>
);

// Modal para añadir cliente manualmente
const AddClientModal = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    ciudad: '',
    tipo_perfil: 'individual' as 'individual' | 'empresa',
    razon_social: '',
    nif_cif: '',
    nombre_gerente: '',
    direccion_fiscal: '',
    mensaje_invitacion: ''
  });
  const [invitationLink, setInvitationLink] = useState('');
  const [showInvitationLink, setShowInvitationLink] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamar a la Edge Function para crear cliente manualmente
      const { data, error } = await supabase.functions.invoke('create-client-manual', {
        body: {
          ...formData,
          mensaje_invitacion: formData.mensaje_invitacion || 'Te invitamos a unirte a nuestra plataforma legal.'
        }
      });

      if (error) {
        console.error('Error creating client:', error);
        toast({
          title: "Error",
          description: "No se pudo crear el cliente",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setInvitationLink(data.invitation_link);
        setShowInvitationLink(true);
        toast({
          title: "¡Cliente Creado!",
          description: "El cliente ha sido creado exitosamente y se ha enviado el email de invitación.",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data?.message || "Error al crear el cliente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al crear el cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      toast({
        title: "Enlace Copiado",
        description: "El enlace de invitación se ha copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      ciudad: '',
      tipo_perfil: 'individual',
      razon_social: '',
      nif_cif: '',
      nombre_gerente: '',
      direccion_fiscal: '',
      mensaje_invitacion: ''
    });
    setInvitationLink('');
    setShowInvitationLink(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Cliente Manualmente</DialogTitle>
        </DialogHeader>
        
        {!showInvitationLink ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="tipo_perfil">Tipo de Perfil</Label>
              <select
                id="tipo_perfil"
                value={formData.tipo_perfil}
                onChange={(e) => setFormData({...formData, tipo_perfil: e.target.value as 'individual' | 'empresa'})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="individual">Individual</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>

            {formData.tipo_perfil === 'empresa' && (
              <div className="space-y-4 border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium">Información de Empresa</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razon_social">Razón Social</Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nif_cif">NIF/CIF</Label>
                    <Input
                      id="nif_cif"
                      value={formData.nif_cif}
                      onChange={(e) => setFormData({...formData, nif_cif: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_gerente">Nombre del Gerente</Label>
                    <Input
                      id="nombre_gerente"
                      value={formData.nombre_gerente}
                      onChange={(e) => setFormData({...formData, nombre_gerente: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion_fiscal">Dirección Fiscal</Label>
                    <Input
                      id="direccion_fiscal"
                      value={formData.direccion_fiscal}
                      onChange={(e) => setFormData({...formData, direccion_fiscal: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="mensaje_invitacion">Mensaje de Invitación (opcional)</Label>
              <Textarea
                id="mensaje_invitacion"
                value={formData.mensaje_invitacion}
                onChange={(e) => setFormData({...formData, mensaje_invitacion: e.target.value})}
                placeholder="Mensaje personalizado para incluir en el email de invitación..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Cliente
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                ¡Cliente Creado Exitosamente!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Se ha enviado un email de invitación al cliente. También puedes copiar el enlace de invitación:
              </p>
            </div>

            <div className="space-y-2">
              <Label>Enlace de Invitación</Label>
              <div className="flex gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyInvitationLink}
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AdminClientsManagement = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showClientCases, setShowClientCases] = useState(false);
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [openMenuClientId, setOpenMenuClientId] = useState<string | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const { toast } = useToast();

  // Validación de roles
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('Validando acceso a AdminClientsManagement:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setUserRole('unauthorized');
          setRoleLoading(false);
          return;
        }

        console.log('Perfil obtenido para validación:', profile);

        if (profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
          console.log('Acceso denegado: usuario no es super admin');
          setUserRole('unauthorized');
          setRoleLoading(false);
          return;
        }

        setUserRole(profile.role);
        setLawyerType(profile.tipo_abogado);
        console.log('Acceso autorizado para AdminClientsManagement');
      } catch (error) {
        console.error('Error en validación:', error);
        setUserRole('unauthorized');
      } finally {
        setRoleLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  useEffect(() => {
    if (userRole === 'abogado' && lawyerType === 'super_admin') {
      fetchClients();
    }
  }, [userRole, lawyerType]);

  const fetchClients = async () => {
    setLoading(true);
    
    try {
      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('get-clients', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
      } else {
        setClients(data.data || []);
        setFilteredClients(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setClients([]);
      toast({
        title: "Error",
        description: "Error inesperado al cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono?.includes(searchTerm) ||
        client.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClientCases = async (clientId: string) => {
    setLoadingCases(true);
    try {
      const { data, error } = await supabase
        .from('casos')
        .select(`
          id,
          motivo_consulta,
          estado,
          created_at,
          compras_realizadas,
          limite_compras,
          costo_en_creditos,
          valor_estimado
        `)
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client cases:', error);
        setClientCases([]);
      } else {
        setClientCases(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setClientCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge variant="outline" className="text-green-600 border-green-600">Disponible</Badge>;
      case 'agotado':
        return <Badge variant="outline" className="text-red-600 border-red-600">Agotado</Badge>;
      case 'cerrado':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Cerrado</Badge>;
      case 'esperando_pago':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Esperando Pago</Badge>;
      case 'listo_para_propuesta':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Listo para Propuesta</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleClientDetails = (client: any) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleClientCases = async (client: any) => {
    setSelectedClient(client);
    await fetchClientCases(client.id);
    setShowClientCases(true);
  };

  const handleAddClientSuccess = () => {
    fetchClients(); // Recargar la lista
    setShowAddClientModal(false);
  };

  // Loading state
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Unauthorized access
  if (userRole !== 'abogado' || lawyerType !== 'super_admin') {
    return <UnauthorizedAccess />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra y supervisa todos los clientes registrados
          </p>
        </div>
        <Button 
          onClick={() => setShowAddClientModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar clientes por nombre, email, teléfono o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients.reduce((sum, client) => sum + (client.casos_activos || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagos Realizados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients.reduce((sum, client) => sum + (client.total_pagos || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Euro className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{clients.reduce((sum, client) => sum + (client.ingresos_totales || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Casos</TableHead>
                  <TableHead>Pagos</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {client.nombre?.charAt(0)}{client.apellido?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {client.nombre} {client.apellido}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Registrado el {new Date(client.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {client.email}
                        </div>
                        {client.telefono && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {client.telefono}
                          </div>
                        )}
                        {client.ciudad && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {client.ciudad}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.tipo_perfil === 'empresa' ? (
                          <>
                            <Building className="w-3 h-3 mr-1" />
                            Empresa
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Individual
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{client.casos_activos || 0}</p>
                        <p className="text-xs text-gray-500">activos</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{client.total_pagos || 0}</p>
                        <p className="text-xs text-gray-500">pagos</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">€{(client.ingresos_totales || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">total</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleClientDetails(client)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClientCases(client)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Casos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {client.nombre?.charAt(0)}{client.apellido?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {client.nombre} {client.apellido}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {client.tipo_perfil === 'empresa' ? 'Empresa' : 'Individual'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleClientDetails(client)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClientCases(client)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Casos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="font-medium">{client.casos_activos || 0}</p>
                      <p className="text-xs text-gray-500">Casos</p>
                    </div>
                    <div>
                      <p className="font-medium">{client.total_pagos || 0}</p>
                      <p className="text-xs text-gray-500">Pagos</p>
                    </div>
                    <div>
                      <p className="font-medium">€{(client.ingresos_totales || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Ingresos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay clientes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? "No se encontraron clientes que coincidan con tu búsqueda." : "No hay clientes registrados."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Client Details Modal */}
      <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="text-sm">{selectedClient.nombre} {selectedClient.apellido}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedClient.email}</p>
                </div>
                {selectedClient.telefono && (
                  <div>
                    <Label>Teléfono</Label>
                    <p className="text-sm">{selectedClient.telefono}</p>
                  </div>
                )}
                {selectedClient.ciudad && (
                  <div>
                    <Label>Ciudad</Label>
                    <p className="text-sm">{selectedClient.ciudad}</p>
                  </div>
                )}
              </div>
              
              {selectedClient.tipo_perfil === 'empresa' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Información de Empresa</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedClient.razon_social && (
                      <div>
                        <Label>Razón Social</Label>
                        <p className="text-sm">{selectedClient.razon_social}</p>
                      </div>
                    )}
                    {selectedClient.nif_cif && (
                      <div>
                        <Label>NIF/CIF</Label>
                        <p className="text-sm">{selectedClient.nif_cif}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Estadísticas</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{selectedClient.casos_activos || 0}</p>
                    <p className="text-xs text-gray-500">Casos Activos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedClient.total_pagos || 0}</p>
                    <p className="text-xs text-gray-500">Pagos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">€{(selectedClient.ingresos_totales || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Ingresos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Client Cases Modal */}
      <Dialog open={showClientCases} onOpenChange={setShowClientCases}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Casos del Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div>
              <div className="mb-4">
                <h3 className="font-medium">{selectedClient.nombre} {selectedClient.apellido}</h3>
                <p className="text-sm text-gray-500">{selectedClient.email}</p>
              </div>
              
              {loadingCases ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : clientCases.length > 0 ? (
                <div className="space-y-4">
                  {clientCases.map((caso) => (
                    <Card key={caso.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{caso.motivo_consulta}</h4>
                            <p className="text-sm text-gray-500">
                              Creado el {new Date(caso.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(caso.estado)}
                            <Badge variant="outline">
                              €{caso.costo_en_creditos || 0}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Este cliente no tiene casos registrados.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSuccess={handleAddClientSuccess}
      />
    </div>
  );
};

export default AdminClientsManagement; 