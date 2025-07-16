
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText,
  UserPlus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCasesByRole } from '@/hooks/useCasesByRole';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const CasesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    casos, 
    loading, 
    refetch 
  } = useCasesByRole();

  const filteredCases = casos.filter(caso => {
    const matchesSearch = caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.nombre_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caso.email_borrador?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caso.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      case 'esperando_pago':
        return 'bg-yellow-100 text-yellow-800';
      case 'disponible':
        return 'bg-blue-100 text-blue-800';
      case 'agotado':
        return 'bg-orange-100 text-orange-800';
      case 'cerrado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estado: string) => {
    const statusMap = {
      'borrador': 'Borrador',
      'esperando_pago': 'Esperando Pago',
      'disponible': 'Disponible',
      'agotado': 'Agotado',
      'cerrado': 'Cerrado'
    };
    return statusMap[estado as keyof typeof statusMap] || estado;
  };

  const handleViewCase = (casoId: string) => {
    navigate(`/abogados/dashboard/casos/${casoId}`);
  };

  const handleAssignLawyer = (casoId: string) => {
    // TODO: Implementar modal de asignación
    toast({
      title: "Función pendiente",
      description: "La asignación de abogados estará disponible próximamente",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando casos...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Gestión de Casos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción, nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="esperando_pago">Esperando Pago</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={refetch} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>

          {filteredCases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron casos con los filtros aplicados'
                  : 'No hay casos disponibles'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caso) => (
                  <TableRow key={caso.id}>
                    <TableCell className="font-mono text-sm">
                      #{caso.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {caso.nombre_borrador || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {caso.email_borrador || 'Sin email'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-md truncate">
                        {caso.motivo_consulta || 'Sin descripción'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caso.estado)}>
                        {getStatusText(caso.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(caso.created_at), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCase(caso.id)}
                          title="Ver detalles del caso"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignLawyer(caso.id)}
                          title="Asignar abogado"
                          disabled={caso.estado !== 'disponible'}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CasesManagement;
