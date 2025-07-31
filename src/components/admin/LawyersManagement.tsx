import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Award, 
  TrendingUp, 
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Edit,
  Layers,
  PlusCircle,
  List,
  Shield,
  Ban,
  RefreshCw,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useSuperAdminStats } from '@/hooks/admin/useSuperAdminStats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente de acceso no autorizado
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-xl text-red-600">Acceso No Autorizado</CardTitle>
        <CardDescription>
          No tienes permisos para acceder a esta sección. Solo los super administradores pueden gestionar abogados.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AdminLawyersManagement = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const { abogados, loadingAbogados } = useSuperAdminStats();

  // Validación de roles
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('Validando acceso a AdminLawyersManagement:', user.id);
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
        console.log('Acceso autorizado para AdminLawyersManagement');
      } catch (error) {
        console.error('Error en validación:', error);
        setUserRole('unauthorized');
      } finally {
        setRoleLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  const getWorkloadColor = (casos_activos: number) => {
    if (casos_activos === 0) return 'text-gray-500';
    if (casos_activos <= 3) return 'text-green-600';
    if (casos_activos <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadPercentage = (casos_activos: number) => {
    const maxCases = 10; // Asumimos máximo 10 casos por abogado
    return Math.min((casos_activos / maxCases) * 100, 100);
  };

  // Las especialidades deben venir ya como nombres desde el backend/hook
  const renderSpecialties = (especialidades: { id: number, nombre: string }[] | number[] | null) => {
    if (!especialidades || especialidades.length === 0) {
      return <span className="italic text-gray-500">Sin especialidades definidas</span>;
    }
    // Si es un array de objetos con nombre, renderiza normalmente
    if (typeof especialidades[0] === 'object' && 'nombre' in (especialidades[0] as any)) {
      return (
        <div className="flex flex-wrap gap-1">
          {(especialidades as {id:number, nombre:string}[]).map((esp) => (
            <Badge key={esp.id} variant="outline" className="text-xs break-words max-w-xs">
              {esp.nombre}
            </Badge>
          ))}
        </div>
      );
    }
    // Si es un array de números (ids), solo muestra la cantidad
    return <span className="italic text-gray-500">{especialidades.length} especialidad(es)</span>;
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

  if (loadingAbogados) {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Abogados</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra y supervisa el equipo de abogados
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="w-4 h-4 mr-2" />
          Agregar Abogado
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Abogados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{abogados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abogados Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {abogados.filter(a => a.casos_activos > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Briefcase className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos Asignados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {abogados.reduce((sum, a) => sum + a.casos_asignados, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio Casos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {abogados.length > 0 ? Math.round(abogados.reduce((sum, a) => sum + a.casos_asignados, 0) / abogados.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lawyers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Abogados</CardTitle>
          <CardDescription>
            Gestiona el equipo de abogados y sus asignaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Abogado</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Casos Activos</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abogados.map((abogado) => (
                  <TableRow key={abogado.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {abogado.nombre.charAt(0)}{abogado.apellido.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {abogado.nombre} {abogado.apellido}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{abogado.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderSpecialties(abogado.especialidades)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getWorkloadColor(abogado.casos_activos)}`}>
                            {abogado.casos_activos} casos
                          </span>
                          <span className="text-xs text-gray-500">
                            {getWorkloadPercentage(abogado.casos_activos).toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={getWorkloadPercentage(abogado.casos_activos)} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {abogado.creditos_disponibles} créditos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(abogado.created_at), 'dd MMM yyyy', { locale: es })}
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
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Layers className="w-4 h-4 mr-2" />
                            Ver Casos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recargar Créditos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
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
            {abogados.map((abogado) => (
              <Card key={abogado.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {abogado.nombre.charAt(0)}{abogado.apellido.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {abogado.nombre} {abogado.apellido}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{abogado.email}</p>
                        <div className="mt-2">
                          {renderSpecialties(abogado.especialidades)}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Layers className="w-4 h-4 mr-2" />
                          Ver Casos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Recargar Créditos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="w-4 h-4 mr-2" />
                          Suspender
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Casos Activos:</span>
                      <span className={`text-sm font-medium ${getWorkloadColor(abogado.casos_activos)}`}>
                        {abogado.casos_activos} casos
                      </span>
                    </div>
                    <Progress 
                      value={getWorkloadPercentage(abogado.casos_activos)} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Créditos:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {abogado.creditos_disponibles} créditos
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Registro:</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(abogado.created_at), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLawyersManagement; 