import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTitle 
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
  ChevronDown
} from "lucide-react";

const ClientsManagement = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showClientCases, setShowClientCases] = useState(false);
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      
      // Verificar que el usuario es super admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, tipo_abogado")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "abogado" || profile.tipo_abogado !== "super_admin") {
        setIsSuperAdmin(false);
        setClients([]);
        setLoading(false);
        return;
      }
      setIsSuperAdmin(true);

      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('get-clients', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      } else {
        setClients(data.data || []);
        setFilteredClients(data.data || []);
      }
      setLoading(false);
    };

    if (user) fetchClients();
  }, [user]);

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

  // Obtener casos de un cliente
  const fetchClientCases = async (clientId: string) => {
    setLoadingCases(true);
    const { data, error } = await supabase
      .from("casos")
      .select(`
        *,
        especialidades(nombre),
        asignaciones_casos(
          abogado_id,
          estado_asignacion,
          profiles(nombre, apellido)
        )
      `)
      .eq("cliente_id", clientId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setClientCases(data);
    }
    setLoadingCases(false);
  };

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'borrador': { color: 'bg-gray-100 text-gray-800', text: 'Borrador' },
      'disponible': { color: 'bg-blue-100 text-blue-800', text: 'Disponible' },
      'en_proceso': { color: 'bg-yellow-100 text-yellow-800', text: 'En Proceso' },
      'listo_para_propuesta': { color: 'bg-purple-100 text-purple-800', text: 'Listo para Propuesta' },
      'esperando_pago': { color: 'bg-orange-100 text-orange-800', text: 'Esperando Pago' },
      'cerrado': { color: 'bg-green-100 text-green-800', text: 'Cerrado' }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.borrador;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (loading) return (
    <div className="flex items-center justify-center p-4 md:p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando clientes...</p>
      </div>
    </div>
  );
  
  if (!isSuperAdmin) return (
    <div className="flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">Solo los super administradores pueden acceder a esta sección.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header con estadísticas - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Total Clientes</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Con Pagos</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.total_pagos > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Total Ingresos</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  €{(clients.reduce((sum, c) => sum + c.total_monto, 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">Este Mes</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {clients.filter(c => {
                    const clientDate = new Date(c.created_at);
                    const now = new Date();
                    return clientDate.getMonth() === now.getMonth() && 
                           clientDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, email, teléfono o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vista de clientes - Responsive */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-lg md:text-xl">
            Clientes Registrados ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Pagos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[50px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {client.nombre} {client.apellido}
                        </div>
                        {client.tipo_perfil === 'empresa' && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {client.razon_social}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {client.email}
                        </div>
                        {client.telefono && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {client.telefono}
                          </div>
                        )}
                        {client.ciudad && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {client.ciudad}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(client.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.pagos && client.pagos.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {client.pagos.slice(0, 2).map((pago: any) => (
                            <Badge 
                              key={pago.id} 
                              variant={pago.estado === "succeeded" ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              €{(pago.monto / 100).toFixed(2)}
                            </Badge>
                          ))}
                          {client.pagos.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{client.pagos.length - 2} más
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin pagos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.total_pagos > 0 ? (
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            €{(client.total_monto / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {client.total_pagos} pago{client.total_pagos !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">€0.00</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedClient(client);
                            setShowClientDetails(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedClient(client);
                            fetchClientCases(client.id);
                            setShowClientCases(true);
                          }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Casos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista Mobile/Tablet - Cards */}
          <div className="lg:hidden space-y-3 p-3 md:p-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header del cliente */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {client.nombre} {client.apellido}
                        </h3>
                        {client.tipo_perfil === 'empresa' && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3" />
                            {client.razon_social}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedClient(client);
                            setShowClientDetails(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedClient(client);
                            fetchClientCases(client.id);
                            setShowClientCases(true);
                          }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Casos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Información de contacto */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{client.email}</span>
                      </div>
                      {client.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">{client.telefono}</span>
                        </div>
                      )}
                      {client.ciudad && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">{client.ciudad}</span>
                        </div>
                      )}
                    </div>

                    {/* Fecha de registro */}
                    <div className="text-xs text-gray-500">
                      Registrado: {new Date(client.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    {/* Pagos */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex-1">
                        {client.pagos && client.pagos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {client.pagos.slice(0, 2).map((pago: any) => (
                              <Badge 
                                key={pago.id} 
                                variant={pago.estado === "succeeded" ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                €{(pago.monto / 100).toFixed(2)}
                              </Badge>
                            ))}
                            {client.pagos.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{client.pagos.length - 2} más
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin pagos</span>
                        )}
                      </div>
                      <div className="text-right">
                        {client.total_pagos > 0 ? (
                          <div>
                            <div className="font-semibold text-green-600 text-sm">
                              €{(client.total_monto / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {client.total_pagos} pago{client.total_pagos !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">€0.00</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del cliente - Responsive */}
      <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-base md:text-lg">{selectedClient.nombre} {selectedClient.apellido}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-base md:text-lg break-all">{selectedClient.email}</p>
                </div>
                {selectedClient.telefono && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-base md:text-lg">{selectedClient.telefono}</p>
                  </div>
                )}
                {selectedClient.ciudad && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ciudad</label>
                    <p className="text-base md:text-lg">{selectedClient.ciudad}</p>
                  </div>
                )}
                {selectedClient.tipo_perfil === 'empresa' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Razón Social</label>
                      <p className="text-base md:text-lg">{selectedClient.razon_social}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">NIF/CIF</label>
                      <p className="text-base md:text-lg">{selectedClient.nif_cif}</p>
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                  <p className="text-base md:text-lg">
                    {new Date(selectedClient.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Historial de Pagos</label>
                {selectedClient.pagos && selectedClient.pagos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.pagos.map((pago: any) => (
                      <div key={pago.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <div className="font-medium">€{(pago.monto / 100).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">{pago.descripcion}</div>
                        </div>
                        <div className="flex flex-col sm:items-end space-y-1">
                          <Badge variant={pago.estado === "succeeded" ? "default" : "secondary"}>
                            {pago.estado === "succeeded" ? "Pagado" : "Pendiente"}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {new Date(pago.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay pagos registrados</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de casos del cliente - Responsive */}
      <Dialog open={showClientCases} onOpenChange={setShowClientCases}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Casos de {selectedClient?.nombre} {selectedClient?.apellido}</DialogTitle>
          </DialogHeader>
          {loadingCases ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {clientCases.length > 0 ? (
                clientCases.map((caso) => (
                  <Card key={caso.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 truncate">{caso.motivo}</h4>
                              {getStatusBadge(caso.estado)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{caso.resumen}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                              <span>Especialidad: {caso.especialidades?.nombre}</span>
                              <span>Fecha: {new Date(caso.created_at).toLocaleDateString()}</span>
                              {caso.valor_estimado && (
                                <span>Valor: €{caso.valor_estimado}</span>
                              )}
                            </div>
                          </div>
                          {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 && (
                            <div className="text-sm sm:text-right">
                              <div className="font-medium">Abogado Asignado:</div>
                              <div className="text-gray-600">
                                {caso.asignaciones_casos[0].profiles?.nombre} {caso.asignaciones_casos[0].profiles?.apellido}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay casos registrados para este cliente</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsManagement; 