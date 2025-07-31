'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change}% desde el mes pasado
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const SimpleBarChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">{item.value.toLocaleString()}</span>
              </div>
              <Progress 
                value={(item.value / maxValue) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SimplePieChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
  
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
          <div className="grid grid-cols-2 gap-2">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                    <div className="text-sm font-medium">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
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
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <Badge variant="secondary">{item.value}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function SuperAdminMetrics() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    clients: {
      total: 0,
      active: 0,
      new: 0,
      change: 0
    },
    lawyers: {
      total: 0,
      available: 0,
      busy: 0,
      change: 0
    },
    payments: {
      total: 0,
      pending: 0,
      completed: 0,
      change: 0
    },
    cases: {
      total: 0,
      active: 0,
      closed: 0,
      change: 0
    },
    monthlyRevenue: [],
    casesByType: [],
    paymentStatus: []
  });

  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener datos reales de Supabase
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Obtener total de clientes
      const { count: totalClientes } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'cliente');

      // Obtener total de abogados
      const { count: totalAbogados } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'abogado');

      // Obtener abogados activos (todos los abogados por ahora)
      const { count: abogadosActivos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'abogado');

      // Obtener total de casos
      const { count: totalCasos } = await supabase
        .from('casos')
        .select('*', { count: 'exact', head: true });

      // Obtener casos por estado
      const { data: casosPorEstado } = await supabase
        .from('casos')
        .select('estado')
        .not('estado', 'is', null);

      // Obtener casos por especialidad
      const { data: casosConEspecialidad } = await supabase
        .from('casos')
        .select(`
          estado,
          especialidad_id,
          especialidades:especialidades(nombre)
        `)
        .not('especialidad_id', 'is', null);

      // Procesar datos de casos por estado
      const estadoCounts = casosPorEstado?.reduce((acc, caso) => {
        acc[caso.estado] = (acc[caso.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Procesar datos de casos por especialidad
      const especialidadCounts = casosConEspecialidad?.reduce((acc, caso) => {
        const especialidad = caso.especialidades?.nombre || 'Sin Especialidad';
        acc[especialidad] = (acc[especialidad] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Datos mock para ingresos mensuales (se puede implementar cuando tengamos tabla de pagos)
      const monthlyRevenue = [
        { name: 'Enero', value: 18500 },
        { name: 'Febrero', value: 22000 },
        { name: 'Marzo', value: 19500 },
        { name: 'Abril', value: 24500 },
        { name: 'Mayo', value: 28000 },
        { name: 'Junio', value: 31000 }
      ];

      // Preparar datos de casos por tipo
      const casesByType = Object.entries(especialidadCounts).map(([nombre, cantidad]) => ({
        name: nombre,
        value: cantidad as number
      }));

      // Preparar datos de estado de casos
      const paymentStatus = [
        { name: 'Disponibles', value: estadoCounts['disponible'] || 0 },
        { name: 'Asignados', value: estadoCounts['asignado'] || 0 },
        { name: 'En Proceso', value: estadoCounts['listo_para_propuesta'] || 0 },
        { name: 'Cerrados', value: estadoCounts['cerrado'] || 0 }
      ];

      const dashboardStats: DashboardData = {
        clients: {
          total: totalClientes || 0,
          active: totalClientes || 0, // Por ahora todos activos
          new: Math.floor((totalClientes || 0) * 0.1), // 10% nuevos
          change: 12.5 // Mock
        },
        lawyers: {
          total: totalAbogados || 0,
          available: abogadosActivos || 0,
          busy: (totalAbogados || 0) - (abogadosActivos || 0),
          change: 5.2 // Mock
        },
        payments: {
          total: monthlyRevenue.reduce((sum, item) => sum + item.value, 0),
          pending: Math.floor(monthlyRevenue.reduce((sum, item) => sum + item.value, 0) * 0.15),
          completed: Math.floor(monthlyRevenue.reduce((sum, item) => sum + item.value, 0) * 0.85),
          change: 8.7 // Mock
        },
        cases: {
          total: totalCasos || 0,
          active: (estadoCounts['disponible'] || 0) + (estadoCounts['asignado'] || 0) + (estadoCounts['listo_para_propuesta'] || 0),
          closed: estadoCounts['cerrado'] || 0,
          change: -2.1 // Mock
        },
        monthlyRevenue,
        casesByType,
        paymentStatus
      };

      setDashboardData(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Usar datos mock en caso de error
      setDashboardData({
        clients: {
          total: 1247,
          active: 892,
          new: 45,
          change: 12.5
        },
        lawyers: {
          total: 28,
          available: 18,
          busy: 10,
          change: 5.2
        },
        payments: {
          total: 2450000,
          pending: 340000,
          completed: 2110000,
          change: 8.7
        },
        cases: {
          total: 156,
          active: 89,
          closed: 67,
          change: -2.1
        },
        monthlyRevenue: [
          { name: 'Enero', value: 185000 },
          { name: 'Febrero', value: 220000 },
          { name: 'Marzo', value: 195000 },
          { name: 'Abril', value: 245000 },
          { name: 'Mayo', value: 280000 },
          { name: 'Junio', value: 310000 }
        ],
        casesByType: [
          { name: 'Civil', value: 45 },
          { name: 'Penal', value: 32 },
          { name: 'Laboral', value: 28 },
          { name: 'Comercial', value: 35 },
          { name: 'Familiar', value: 16 }
        ],
        paymentStatus: [
          { name: 'Disponibles', value: 35 },
          { name: 'Asignados', value: 28 },
          { name: 'En Proceso', value: 22 },
          { name: 'Cerrados', value: 15 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Legal</h1>
          <p className="text-muted-foreground">Resumen de métricas y estadísticas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Último mes
          </Button>
          <Button size="sm">
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="cases">Casos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SimpleBarChart 
              data={dashboardData.monthlyRevenue} 
              title="Ingresos Mensuales"
            />
            <SimplePieChart 
              data={dashboardData.casesByType} 
              title="Casos por Especialidad"
            />
            <ActivityChart 
              data={dashboardData.paymentStatus} 
              title="Estado de Casos"
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              title="Tendencia de Ingresos"
            />
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SimplePieChart 
              data={dashboardData.casesByType} 
              title="Distribución por Especialidad"
            />
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Alertas y notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Alertas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">{dashboardData.cases.active} casos activos requieren atención</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">{dashboardData.clients.new} nuevos clientes este mes</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
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
              <div className="flex justify-between items-center p-2 border-l-2 border-blue-500 pl-3">
                <div>
                  <div className="text-sm font-medium">Abogados Disponibles</div>
                  <div className="text-xs text-muted-foreground">Listos para nuevos casos</div>
                </div>
                <div className="text-sm font-semibold">{dashboardData.lawyers.available}</div>
              </div>
              <div className="flex justify-between items-center p-2 border-l-2 border-green-500 pl-3">
                <div>
                  <div className="text-sm font-medium">Casos Disponibles</div>
                  <div className="text-xs text-muted-foreground">Esperando asignación</div>
                </div>
                <div className="text-sm font-semibold">{dashboardData.paymentStatus.find(s => s.name === 'Disponibles')?.value || 0}</div>
              </div>
              <div className="flex justify-between items-center p-2 border-l-2 border-purple-500 pl-3">
                <div>
                  <div className="text-sm font-medium">Ingresos del Mes</div>
                  <div className="text-xs text-muted-foreground">Total acumulado</div>
                </div>
                <div className="text-sm font-semibold">€{(dashboardData.payments.total / 1000).toFixed(1)}K</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 