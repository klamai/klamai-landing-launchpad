import React, { useState } from 'react';
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
  Briefcase
} from 'lucide-react';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
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

const LawyersManagement = () => {
  const { abogados, loadingAbogados } = useSuperAdminStats();

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

  const getSpecialtiesText = (especialidades: number[] | null) => {
    if (!especialidades || especialidades.length === 0) {
      return 'Sin especialidades definidas';
    }
    
    // Mapeo básico de especialidades (esto debería venir de la base de datos)
    const especialidadesMap: { [key: number]: string } = {
      1: 'Derecho Laboral',
      2: 'Derecho Civil',
      3: 'Derecho Mercantil',
      4: 'Derecho Penal',
      5: 'Derecho Fiscal',
      6: 'Derecho Familiar'
    };
    
    return especialidades.map(id => especialidadesMap[id] || `Especialidad ${id}`).join(', ');
  };

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
      {/* Estadísticas de abogados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Abogados</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{abogados.length}</p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">Registrados en el sistema</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Abogados Activos</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {abogados.filter(a => a.casos_activos > 0).length}
              </p>
              <p className="text-green-600 dark:text-green-400 text-xs">Con casos asignados</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Casos Promedio</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {abogados.length > 0 ? Math.round(abogados.reduce((sum, a) => sum + a.casos_activos, 0) / abogados.length) : 0}
              </p>
              <p className="text-purple-600 dark:text-purple-400 text-xs">Por abogado activo</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lista de abogados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Abogados
              </CardTitle>
              <CardDescription>
                Lista completa de abogados registrados y su rendimiento
              </CardDescription>
            </div>
            <Button>
              <UserCheck className="h-4 w-4 mr-2" />
              Invitar Abogado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Abogado</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Casos Asignados</TableHead>
                  <TableHead>Carga de Trabajo</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abogados.map((abogado) => (
                  <motion.tr
                    key={abogado.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {abogado.nombre[0]}{abogado.apellido[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {abogado.nombre} {abogado.apellido}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {abogado.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <Badge variant="outline" className="text-xs">
                          {getSpecialtiesText(abogado.especialidades)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{abogado.casos_asignados}</span>
                        <span className="text-gray-500">
                          ({abogado.casos_activos} activos)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={getWorkloadColor(abogado.casos_activos)}>
                            {abogado.casos_activos === 0 ? 'Sin carga' :
                             abogado.casos_activos <= 3 ? 'Baja' :
                             abogado.casos_activos <= 6 ? 'Media' : 'Alta'}
                          </span>
                          <span className="text-gray-500">
                            {abogado.casos_activos}/10
                          </span>
                        </div>
                        <Progress 
                          value={getWorkloadPercentage(abogado.casos_activos)} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{abogado.creditos_disponibles}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(abogado.created_at), 'dd/MM/yy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rendimiento por Abogado
          </CardTitle>
          <CardDescription>
            Distribución de casos activos entre abogados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {abogados.slice(0, 5).map((abogado, index) => (
              <motion.div
                key={abogado.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {abogado.nombre[0]}{abogado.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {abogado.nombre} {abogado.apellido}
                    </div>
                    <div className="text-sm text-gray-500">
                      {abogado.casos_activos} casos activos
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Progress 
                    value={getWorkloadPercentage(abogado.casos_activos)} 
                    className="w-32"
                  />
                  <Badge variant={
                    abogado.casos_activos === 0 ? 'secondary' :
                    abogado.casos_activos <= 3 ? 'default' :
                    abogado.casos_activos <= 6 ? 'secondary' : 'destructive'
                  }>
                    {abogado.casos_activos === 0 ? 'Disponible' :
                     abogado.casos_activos <= 3 ? 'Óptimo' :
                     abogado.casos_activos <= 6 ? 'Ocupado' : 'Sobrecargado'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LawyersManagement;