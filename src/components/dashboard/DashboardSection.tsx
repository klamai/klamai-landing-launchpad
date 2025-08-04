
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Scale, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  DollarSign,
  Calendar,
  Clock, 
  Eye,
  EyeOff,
  Bell,
  CheckCircle, 
  AlertCircle,
  User,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useClientStats } from '@/hooks/useClientStats';
import { cn } from '@/lib/utils';

// Componente de gráfico mini para visualizaciones
const MiniChart = ({ data, color, height = 40 }: { data: number[], color: string, height?: number }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Componente de tarjeta de métrica
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  chartData, 
  format = (v: number) => v.toLocaleString(),
  prefix = '',
  suffix = '',
  loading = false
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  chartData: number[];
  format?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? '...' : `${prefix}${format(value)}${suffix}`}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
          <div className="w-16 h-8">
            <MiniChart 
              data={chartData} 
              color={isPositive ? '#10B981' : '#EF4444'} 
              height={32}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de actividad reciente
const RecentActivity = ({ activities, loading }: { activities: any[], loading: boolean }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-purple-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace unos minutos';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays} días`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            activities.slice(0, 6).map((activity, index) => (
              <div key={activity.id || index} className="flex items-center space-x-3">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
                {activity.amount && (
                  <div className="text-sm font-medium text-green-600">
                    ${activity.amount.toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de resumen de casos
const CasesOverview = ({ casesByStatus, casesByPriority, loading }: { 
  casesByStatus: any, 
  casesByPriority: any, 
  loading: boolean 
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Resumen de Casos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center p-2 bg-gray-100 rounded-lg animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Resumen de Casos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Por Estado</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{casesByStatus.active}</div>
                <div className="text-xs text-green-600">Activos</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{casesByStatus.pending}</div>
                <div className="text-xs text-yellow-600">Pendientes</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{casesByStatus.closed}</div>
                <div className="text-xs text-gray-600">Cerrados</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Por Prioridad</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Alta</span>
                <span className="text-sm font-medium text-red-600">{casesByPriority.high}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Media</span>
                <span className="text-sm font-medium text-yellow-600">{casesByPriority.medium}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Baja</span>
                <span className="text-sm font-medium text-green-600">{casesByPriority.low}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal del dashboard
const DashboardSection = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showValues, setShowValues] = useState(true);
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useClientStats();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Obtener saludo personalizado
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Datos de gráficos mock para tendencias
  const casesChartData = [2, 3, 2, 4, 3, 5, 4];
  const paymentsChartData = [5000, 7500, 6000, 8500, 7000, 9000, 8000];
  const notificationsChartData = [3, 5, 4, 6, 5, 7, 6];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getGreeting()}, {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
          </h1>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium">
              Error cargando estadísticas: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getGreeting()}, {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
              </h1>
            <p className="text-muted-foreground">
              Tu dashboard legal personalizado
              </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {currentTime.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setShowValues(!showValues)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-background hover:bg-accent transition-colors"
            >
              {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm">{showValues ? 'Ocultar' : 'Mostrar'} valores</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Mis Casos"
          value={showValues ? (stats?.totalCases || 0) : 0}
          change={12.5}
          icon={FileText}
          chartData={casesChartData}
          loading={isLoading}
        />
        
        <MetricCard
          title="Pagos Totales"
          value={showValues ? (stats?.totalPayments || 0) : 0}
          change={15.8}
          icon={DollarSign}
          chartData={paymentsChartData}
          format={(v) => `$${(v / 1000).toFixed(0)}K`}
          loading={isLoading}
        />
        
        <MetricCard
          title="Notificaciones"
          value={showValues ? (stats?.totalNotifications || 0) : 0}
          change={-2.1}
          icon={Bell}
          chartData={notificationsChartData}
          loading={isLoading}
        />
        
        <MetricCard
          title="Casos Activos"
          value={showValues ? (stats?.activeCases || 0) : 0}
          change={5.4}
          icon={CheckCircle}
          chartData={[2, 3, 2, 4, 3, 5, 4]}
          loading={isLoading}
        />
                </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Pagos Pendientes"
          value={showValues ? (stats?.pendingPayments || 0) : 0}
          change={-8.7}
          icon={CreditCard}
          chartData={[3000, 4500, 3500, 5000, 4000, 5500, 4500]}
          format={(v) => `$${(v / 1000).toFixed(0)}K`}
          loading={isLoading}
        />
        
        <MetricCard
          title="Casos Cerrados"
          value={showValues ? (stats?.closedCases || 0) : 0}
          change={22.3}
          icon={BarChart3}
          chartData={[1, 2, 1, 3, 2, 4, 3]}
          loading={isLoading}
        />
        
        <MetricCard
          title="Sin Leer"
          value={showValues ? (stats?.unreadNotifications || 0) : 0}
          change={3.1}
          icon={AlertCircle}
          chartData={[2, 4, 3, 5, 4, 6, 5]}
          loading={isLoading}
        />
      </div>

      {/* Secciones detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity 
          activities={stats?.recentActivity || []} 
          loading={isLoading}
        />
        <CasesOverview 
          casesByStatus={stats?.casesByStatus || { active: 0, pending: 0, closed: 0 }}
          casesByPriority={stats?.casesByPriority || { high: 0, medium: 0, low: 0 }}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default DashboardSection;
