import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CasesManagement = () => {
  const { casos, abogados, loadingCasos, assignCaseToLawyer } = useSuperAdminStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { label: 'Disponible', variant: 'default' as const, icon: AlertCircle },
      'agotado': { label: 'Agotado', variant: 'destructive' as const, icon: Clock },
      'cerrado': { label: 'Cerrado', variant: 'secondary' as const, icon: CheckCircle },
      'esperando_pago': { label: 'Esperando Pago', variant: 'outline' as const, icon: Clock }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredCasos = casos.filter(caso => {
    const matchesSearch = caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.profiles?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caso.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAssignCase = async () => {
    if (!selectedCaseId || !selectedLawyerId) {
      toast({
        title: "Error",
        description: "Selecciona un caso y un abogado",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    
    try {
      const result = await assignCaseToLawyer(selectedCaseId, selectedLawyerId, assignmentNotes);
      
      if (result.success) {
        toast({
          title: "Caso asignado",
          description: "El caso ha sido asignado exitosamente al abogado",
        });
        setSelectedCaseId(null);
        setSelectedLawyerId('');
        setAssignmentNotes('');
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al asignar el caso",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado al asignar el caso",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (loadingCasos) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Casos
          </CardTitle>
          <CardDescription>
            Busca y filtra casos para gestionar asignaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por motivo, cliente o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
                <SelectItem value="esperando_pago">Esperando Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de casos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Casos del Sistema</CardTitle>
              <CardDescription>
                {filteredCasos.length} casos encontrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCasos.map((caso) => (
                  <motion.tr
                    key={caso.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {caso.profiles?.nombre} {caso.profiles?.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {caso.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {caso.motivo_consulta}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {caso.especialidades?.nombre || 'Sin especialidad'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(caso.estado)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(caso.created_at), 'dd/MM/yy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
                        <div className="text-sm">
                          {caso.asignaciones_casos.map((asignacion, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {asignacion.profiles?.nombre} {asignacion.profiles?.apellido}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedCaseId(caso.id)}
                              disabled={caso.estado === 'cerrado'}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Asignar Caso a Abogado</DialogTitle>
                              <DialogDescription>
                                Selecciona un abogado para asignar este caso
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Seleccionar Abogado</label>
                                <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un abogado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {abogados.map((abogado) => (
                                      <SelectItem key={abogado.id} value={abogado.id}>
                                        {abogado.nombre} {abogado.apellido} 
                                        <span className="text-gray-500 ml-2">
                                          ({abogado.casos_activos} casos activos)
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Notas de Asignación</label>
                                <Textarea
                                  placeholder="Notas adicionales para el abogado..."
                                  value={assignmentNotes}
                                  onChange={(e) => setAssignmentNotes(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline">Cancelar</Button>
                                <Button 
                                  onClick={handleAssignCase}
                                  disabled={isAssigning}
                                >
                                  {isAssigning ? 'Asignando...' : 'Asignar Caso'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CasesManagement;