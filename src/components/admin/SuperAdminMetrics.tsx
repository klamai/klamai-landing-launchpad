'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Scale,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdminStats } from '@/hooks/queries/useSuperAdminStats';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardData {
  clients: {
    total: number;
    active: number;
    new: number;
    change: number;
  };
  lawyers: {
    total: number;
    available: number;
    busy: number;
    change: number;
  };
  payments: {
    total: number;
    pending: number;
    completed: number;
    change: number;
  };
  cases: {
    total: number;
    active: number;
    closed: number;
    change: number;
  };
  monthlyRevenue: ChartData[];
  casesByType: ChartData[];
  paymentStatus: ChartData[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  trend = 'neutral'
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground flex-shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()} mb-2`}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change}% desde el mes pasado
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground leading-tight">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const SimpleBarChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className="h-80 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2 group">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                <span className="font-medium">{item.value.toLocaleString()}</span>
              </div>
              <div className="relative">
                <Progress
                  value={(item.value / maxValue) * 100}
                  className="h-3 transition-all duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SimplePieChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.value} casos</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total de Casos</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || '#3b82f6' }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{item.value}</Badge>
                <span className="text-xs text-muted-foreground">
                  ({Math.round((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const LawyersPerformanceChart: React.FC<{ data: Array<{ nombre: string; casosAsignados: number; casosResueltos: number; eficiencia: number }>; title: string }> = ({ data, title }) => {
  return (
    <Card className="h-96 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {data.map((lawyer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 hover:border-border transition-all duration-200 hover:shadow-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium shadow-sm">
                  {lawyer.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate hover:text-primary transition-colors">{lawyer.nombre}</div>
                  <div className="text-xs text-muted-foreground">
                    {lawyer.casosAsignados} asignados • {lawyer.casosResueltos} resueltos
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-lg font-bold ${lawyer.eficiencia >= 80 ? 'text-green-600' : lawyer.eficiencia >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {lawyer.eficiencia}%
                  </div>
                  <div className="text-xs text-muted-foreground">eficiencia</div>
                </div>
                <div className="w-16">
                  <Progress
                    value={lawyer.eficiencia}
                    className="h-2 transition-all duration-500 ease-out"
                  />
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No hay datos de rendimiento disponibles</p>
              <p className="text-xs mt-2">Los datos aparecerán cuando haya actividad</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TrendsChart: React.FC<{ data: Array<{ mes: string; casosNuevos: number; casosResueltos: number; crecimientoCasos: number }>; title: string }> = ({ data, title }) => {
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium w-12">{item.mes}</div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>+{item.casosNuevos} nuevos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{item.casosResueltos} resueltos</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xs font-medium ${item.crecimientoCasos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.crecimientoCasos >= 0 ? '+' : ''}{item.crecimientoCasos.toFixed(1)}%
                </div>
                <TrendingUp className={`h-3 w-3 ${item.crecimientoCasos >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const KPIGaugeChart: React.FC<{ kpis: { tasaConversion: number; tiempoPromedioResolucion: number; ingresosPromedioCaso: number; satisfaccionCliente: number } }> = ({ kpis }) => {
  return (
    <Card className="h-80 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          KPIs Principales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Tasa de Conversión */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors duration-200 group">
            <div className="text-2xl font-bold text-blue-600 mb-1 group-hover:scale-110 transition-transform duration-200">{kpis.tasaConversion}%</div>
            <div className="text-xs text-muted-foreground text-center mb-2">Tasa de Conversión</div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.min(kpis.tasaConversion, 100)}%` }}
              />
            </div>
          </div>

          {/* Satisfacción del Cliente */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors duration-200 group">
            <div className="text-2xl font-bold text-green-600 mb-1 group-hover:scale-110 transition-transform duration-200">{kpis.satisfaccionCliente}%</div>
            <div className="text-xs text-muted-foreground text-center mb-2">Satisfacción</div>
            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.min(kpis.satisfaccionCliente, 100)}%` }}
              />
            </div>
          </div>

          {/* Tiempo Promedio de Resolución */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors duration-200 group">
            <div className="text-2xl font-bold text-orange-600 mb-1 group-hover:scale-110 transition-transform duration-200">{kpis.tiempoPromedioResolucion}</div>
            <div className="text-xs text-muted-foreground text-center mb-2">Días Promedio</div>
            <div className="text-xs text-center text-muted-foreground">Resolución de Casos</div>
            <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-1 mt-2">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1 rounded-full w-full shadow-sm" />
            </div>
          </div>

          {/* Ingreso Promedio por Caso */}
          <div className="flex flex-col items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors duration-200 group">
            <div className="text-xl font-bold text-purple-600 mb-1 group-hover:scale-110 transition-transform duration-200">€{kpis.ingresosPromedioCaso.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground text-center mb-2">Por Caso</div>
            <div className="text-xs text-center text-muted-foreground">Ingreso Promedio</div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1 mt-2">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-1 rounded-full w-full shadow-sm" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardFilters: React.FC<{
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}> = ({ selectedPeriod, onPeriodChange, selectedSpecialty, onSpecialtyChange, onRefresh, isRefreshing }) => {
  const periods = [
    { value: '7d', label: 'Última semana' },
    { value: '30d', label: 'Último mes' },
    { value: '90d', label: 'Último trimestre' },
    { value: '365d', label: 'Último año' },
  ];

  const specialties = [
    { value: 'all', label: 'Todas las especialidades' },
    { value: 'derecho_civil', label: 'Derecho Civil' },
    { value: 'derecho_penal', label: 'Derecho Penal' },
    { value: 'derecho_laboral', label: 'Derecho Laboral' },
    { value: 'derecho_mercantil', label: 'Derecho Mercantil' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 flex-1">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSpecialty} onValueChange={onSpecialtyChange}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Seleccionar especialidad" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((specialty) => (
              <SelectItem key={specialty.value} value={specialty.label}>
                {specialty.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
    </div>
  );
};

export default function SuperAdminMetrics() {
  // Estados para filtros
  const [selectedPeriod, setSelectedPeriod] = React.useState('30d');
  const [selectedSpecialty, setSelectedSpecialty] = React.useState('Todas las especialidades');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Usar el hook optimizado de React Query
  const { data: superAdminData, isLoading, error, refetch } = useSuperAdminStats();

  // Función para refrescar datos
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Función para filtrar datos según período (simplificada por ahora)
  const filterDataByPeriod = (data: any[], period: string) => {
    // Por ahora retornamos todos los datos, se puede implementar filtrado avanzado más tarde
    return data;
  };

  // Transformar los datos del hook a la estructura esperada por el componente
  const dashboardData: DashboardData = React.useMemo(() => {
    if (!superAdminData) {
      return {
        clients: { total: 0, active: 0, new: 0, change: 0 },
        lawyers: { total: 0, available: 0, busy: 0, change: 0 },
        payments: { total: 0, pending: 0, completed: 0, change: 0 },
        cases: { total: 0, active: 0, closed: 0, change: 0 },
        monthlyRevenue: [],
        casesByType: [],
        paymentStatus: []
      };
    }

    // Transformar casos por estado con colores
    const paymentStatus = superAdminData.casosPorEstado.map(estado => ({
      name: estado.estado,
      value: estado.cantidad,
      color: estado.color,
      porcentaje: estado.porcentaje
    }));

    // Transformar casos por especialidad con colores
    const casesByType = superAdminData.casosPorEspecialidad.map(item => ({
      name: item.nombre,
      value: item.casos,
      color: item.color,
      porcentaje: item.porcentaje
    }));

    // Usar datos reales de ingresos/gastos del hook
    const monthlyRevenue = superAdminData.ingresosGastos.map(item => ({
      name: item.mes,
      value: item.beneficio,
      color: item.beneficio >= 0 ? '#10b981' : '#ef4444'
    }));

    return {
      clients: {
        total: superAdminData.totalClientes,
        active: superAdminData.clientesData.length > 0 ? Math.round(superAdminData.clientesData.reduce((sum, item) => sum + item.activos, 0) / superAdminData.clientesData.length) : superAdminData.totalClientes,
        new: superAdminData.clientesData.length > 0 ? Math.round(superAdminData.clientesData.reduce((sum, item) => sum + item.nuevos, 0) / superAdminData.clientesData.length) : Math.floor(superAdminData.totalClientes * 0.1),
        change: superAdminData.clientesData.length > 1 ? superAdminData.clientesData[superAdminData.clientesData.length - 1].crecimiento : 12.5
      },
      lawyers: {
        total: superAdminData.totalAbogados,
        available: superAdminData.totalAbogados, // Por ahora todos disponibles
        busy: 0,
        change: 5.2 // Mock
      },
      payments: {
        total: superAdminData.ingresosMes,
        pending: Math.floor(superAdminData.ingresosMes * 0.25), // 25% pendientes
        completed: Math.floor(superAdminData.ingresosMes * 0.75), // 75% completados
        change: 8.1 // Mock
      },
      cases: {
        total: superAdminData.totalCasos,
        active: superAdminData.casosPorEstado.find(c => c.estado === 'asignado')?.cantidad || 0,
        closed: superAdminData.casosPorEstado.find(c => c.estado === 'cerrado')?.cantidad || 0,
        change: 15.3 // Mock
      },
      monthlyRevenue,
      casesByType,
      paymentStatus
    };
  }, [superAdminData]);

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar datos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Legal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Resumen completo de métricas y estadísticas del bufete</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Calendar className="h-4 w-4 mr-2" />
            Último mes
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none">
            Exportar
          </Button>
        </div>
      </div>

      {/* Sistema de Filtros */}
      <DashboardFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        selectedSpecialty={selectedSpecialty}
        onSpecialtyChange={setSelectedSpecialty}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Clientes"
          value={dashboardData.clients.total.toLocaleString()}
          change={dashboardData.clients.change}
          trend="up"
          icon={<Users className="h-4 w-4" />}
          description={`${dashboardData.clients.active} activos`}
        />
        <MetricCard
          title="Abogados"
          value={dashboardData.lawyers.total}
          change={dashboardData.lawyers.change}
          trend="up"
          icon={<Scale className="h-4 w-4" />}
          description={`${dashboardData.lawyers.available} disponibles`}
        />
        <MetricCard
          title="Ingresos"
          value={`€${(dashboardData.payments.total / 1000).toFixed(1)}K`}
          change={dashboardData.payments.change}
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
          description="Total del mes"
        />
        <MetricCard
          title="Casos Totales"
          value={dashboardData.cases.total}
          change={dashboardData.cases.change}
          trend="down"
          icon={<FileText className="h-4 w-4" />}
          description={`${dashboardData.cases.active} activos`}
        />
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Resumen</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm">Financiero</TabsTrigger>
          <TabsTrigger value="cases" className="text-xs sm:text-sm">Casos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SimpleBarChart
              data={dashboardData.monthlyRevenue}
              title="Beneficio Mensual"
            />
            <KPIGaugeChart kpis={superAdminData?.kpis || { tasaConversion: 0, tiempoPromedioResolucion: 0, ingresosPromedioCaso: 0, satisfaccionCliente: 0 }} />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SimplePieChart
              data={dashboardData.casesByType}
              title="Casos por Especialidad"
            />
            <ActivityChart
              data={dashboardData.paymentStatus}
              title="Estado de Casos"
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <LawyersPerformanceChart
              data={superAdminData?.rendimientoAbogados || []}
              title="Rendimiento de Abogados"
            />
            <TrendsChart
              data={superAdminData?.tendenciasTemporales || []}
              title="Tendencias Recientes"
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Estado de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Completados</span>
                  </div>
                  <span className="font-semibold">€{(dashboardData.payments.completed / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Pendientes</span>
                  </div>
                  <span className="font-semibold">€{(dashboardData.payments.pending / 1000).toFixed(1)}K</span>
                </div>
              </CardContent>
            </Card>

            <SimpleBarChart
              data={dashboardData.monthlyRevenue}
              title="Tendencia de Beneficios"
            />
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SimplePieChart
              data={dashboardData.casesByType}
              title="Distribución por Especialidad"
            />
            <TrendsChart
              data={superAdminData?.tendenciasTemporales || []}
              title="Tendencias de Casos"
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estadísticas de Casos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Casos Activos</span>
                    <span className="font-medium">{dashboardData.cases.active}</span>
                  </div>
                  <Progress value={(dashboardData.cases.active / dashboardData.cases.total) * 100} />

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Casos Cerrados</span>
                    <span className="font-medium">{dashboardData.cases.closed}</span>
                  </div>
                  <Progress value={(dashboardData.cases.closed / dashboardData.cases.total) * 100} />
                </div>
              </CardContent>
            </Card>
            <LawyersPerformanceChart
              data={superAdminData?.rendimientoAbogados || []}
              title="Top Abogados"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Alertas y notificaciones */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Alertas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">{dashboardData.cases.active} casos activos requieren atención</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">{dashboardData.clients.new} nuevos clientes este mes</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">{dashboardData.cases.closed} casos completados exitosamente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border-l-2 border-blue-500 pl-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg">
                <div>
                  <div className="text-sm font-medium">Abogados Disponibles</div>
                  <div className="text-xs text-muted-foreground">Listos para nuevos casos</div>
                </div>
                <div className="text-lg font-semibold text-blue-600">{dashboardData.lawyers.available}</div>
              </div>
              <div className="flex justify-between items-center p-3 border-l-2 border-green-500 pl-4 bg-green-50/50 dark:bg-green-950/20 rounded-r-lg">
                <div>
                  <div className="text-sm font-medium">Casos Disponibles</div>
                  <div className="text-xs text-muted-foreground">Esperando asignación</div>
                </div>
                <div className="text-lg font-semibold text-green-600">{dashboardData.paymentStatus.find(s => s.name === 'Disponibles')?.value || 0}</div>
              </div>
              <div className="flex justify-between items-center p-3 border-l-2 border-purple-500 pl-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-r-lg">
                <div>
                  <div className="text-sm font-medium">Ingresos del Mes</div>
                  <div className="text-xs text-muted-foreground">Total acumulado</div>
                </div>
                <div className="text-lg font-semibold text-purple-600">€{(dashboardData.payments.total / 1000).toFixed(1)}K</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 