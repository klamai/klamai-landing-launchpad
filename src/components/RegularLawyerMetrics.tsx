'use client';

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import * as RechartsPrimitive from "recharts";
import { 
  Users, 
  Scale, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  UserCheck,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis,
  Line,
  LineChart as RechartsLineChart,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ResponsiveContainer
} from "recharts";
import { supabase } from '@/integrations/supabase/client';

// Chart configuration types
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

// Chart Container Component
function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

// Chart Tooltip Components
const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey || item.dataKey || item.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color || item.payload.fill || item.color;

          return (
            <div
              key={item.dataKey}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

// Card Components
function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

// Badge Component
function Badge({ 
  className, 
  variant = "default",
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "success" | "destructive" | "warning";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100": variant === "success",
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100": variant === "destructive",
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

// Interfaces para los datos
interface DashboardData {
  assignedCases: number;
  completedCases: number;
  pendingCases: number;
  totalClients: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  casesByStatus: Array<{ status: string; count: number }>;
  casesBySpecialty: Array<{ specialty: string; count: number }>;
  weeklyActivity: Array<{ day: string; cases: number; documents: number }>;
  recentActivity: Array<{ type: string; count: number }>;
}

// Chart configurations
const chartConfigs = {
  casos: {
    asignados: { label: "Casos Asignados", color: "hsl(var(--chart-1))" },
    completados: { label: "Casos Completados", color: "hsl(var(--chart-2))" },
  },
  estados: {
    activos: { label: "Activos", color: "hsl(var(--chart-1))" },
    en_proceso: { label: "En Proceso", color: "hsl(var(--chart-2))" },
    cerrados: { label: "Cerrados", color: "hsl(var(--chart-3))" },
  },
  ingresos: {
    amount: { label: "Ingresos", color: "hsl(var(--chart-2))" },
  },
  actividad: {
    casos: { label: "Casos", color: "hsl(var(--chart-1))" },
    documentos: { label: "Documentos", color: "hsl(var(--chart-3))" },
  },
};

// Individual Chart Components
function CasosAsignadosChart({ data }: { data: DashboardData }) {
  const chartData = [
    { month: "Ene", asignados: data.assignedCases, completados: data.completedCases },
    { month: "Feb", asignados: data.assignedCases + 2, completados: data.completedCases + 1 },
    { month: "Mar", asignados: data.assignedCases + 4, completados: data.completedCases + 3 },
    { month: "Abr", asignados: data.assignedCases + 6, completados: data.completedCases + 5 },
    { month: "May", asignados: data.assignedCases + 8, completados: data.completedCases + 7 },
    { month: "Jun", asignados: data.assignedCases + 10, completados: data.completedCases + 9 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Mis Casos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{data.assignedCases}</span>
          <Badge variant="success" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            +{Math.floor(data.assignedCases * 0.1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfigs.casos} className="h-[200px]">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="asignados" fill="var(--color-asignados)" radius={4} />
            <Bar dataKey="completados" fill="var(--color-completados)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function EstadosCasosChart({ data }: { data: DashboardData }) {
  const chartData = [
    { name: "Activos", value: data.assignedCases - data.completedCases, color: "hsl(var(--chart-1))" },
    { name: "En Proceso", value: data.pendingCases, color: "hsl(var(--chart-2))" },
    { name: "Completados", value: data.completedCases, color: "hsl(var(--chart-3))" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Estado de Casos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{data.assignedCases}</span>
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {data.completedCases} completados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfigs.estados} className="h-[200px]">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function IngresosChart({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Ingresos Mensuales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">€{(data.monthlyRevenue.reduce((sum, item) => sum + item.amount, 0) / 1000).toFixed(1)}K</span>
          <Badge variant="success" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            +{Math.floor(Math.random() * 20)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfigs.ingresos} className="h-[200px]">
          <RechartsLineChart data={data.monthlyRevenue}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="var(--color-amount)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ActividadSemanalChart({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Actividad Semanal</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{data.weeklyActivity.reduce((sum, item) => sum + item.cases + item.documents, 0)}</span>
          <Badge variant="success" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            +{Math.floor(Math.random() * 15)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfigs.actividad} className="h-[200px]">
          <BarChart data={data.weeklyActivity}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="casos" fill="var(--color-casos)" radius={4} />
            <Bar dataKey="documentos" fill="var(--color-documentos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function CasosPorEspecialidadChart({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Casos por Especialidad</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{data.casesBySpecialty.length}</span>
          <Badge variant="success" className="gap-1">
            <UserCheck className="h-3 w-3" />
            Especialidades
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfigs.estados} className="h-[200px]">
          <BarChart data={data.casesBySpecialty} layout="horizontal">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis 
              type="category" 
              dataKey="specialty" 
              tickLine={false} 
              axisLine={false}
              width={80}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-activos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ResumenActividadChart({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Resumen de Actividad</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{data.recentActivity.length}</span>
          <Badge variant="success" className="gap-1">
            <Clock className="h-3 w-3" />
            Actividades
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfigs.estados} className="h-[200px]">
          <BarChart data={data.recentActivity} layout="horizontal">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis 
              type="category" 
              dataKey="type" 
              tickLine={false} 
              axisLine={false}
              width={80}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-activos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Main Dashboard Component
export default function RegularLawyerMetrics() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    assignedCases: 0,
    completedCases: 0,
    pendingCases: 0,
    totalClients: 0,
    monthlyRevenue: [],
    casesByStatus: [],
    casesBySpecialty: [],
    weeklyActivity: [],
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener datos reales de Supabase para el abogado regular
  const fetchLawyerData = async () => {
    try {
      setIsLoading(true);

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener casos asignados al abogado
      const { data: assignedCases, error: casesError } = await supabase
        .from('asignaciones_casos')
        .select(`
          caso_id,
          casos:casos(
            id,
            estado,
            especialidad_id,
            especialidades:especialidades(nombre),
            cliente_id,
            profiles:profiles!casos_cliente_id_fkey(
              id,
              full_name,
              email
            )
          )
        `)
        .eq('abogado_id', user.id);

      if (casesError) {
        console.error('Error fetching assigned cases:', casesError);
        return;
      }

      // Procesar datos de casos
      const cases = assignedCases?.map(ac => ac.casos).filter(Boolean) || [];
      const assignedCasesCount = cases.length;
      const completedCasesCount = cases.filter(c => c.estado === 'cerrado').length;
      const pendingCasesCount = cases.filter(c => c.estado === 'asignado').length;

      // Obtener clientes únicos
      const uniqueClients = new Set(cases.map(c => c.cliente_id).filter(Boolean));
      const totalClients = uniqueClients.size;

      // Procesar casos por especialidad
      const specialtyCounts = cases.reduce((acc, caso) => {
        const specialty = caso.especialidades?.nombre || 'Sin Especialidad';
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const casesBySpecialty = Object.entries(specialtyCounts).map(([specialty, count]) => ({
        specialty,
        count
      }));

      // Procesar casos por estado
      const statusCounts = cases.reduce((acc, caso) => {
        acc[caso.estado] = (acc[caso.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const casesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      // Datos mock para ingresos mensuales (se puede implementar cuando tengamos tabla de pagos)
      const monthlyRevenue = [
        { month: 'Ene', amount: 8500 },
        { month: 'Feb', amount: 9200 },
        { month: 'Mar', amount: 8800 },
        { month: 'Abr', amount: 10500 },
        { month: 'May', amount: 9800 },
        { month: 'Jun', amount: 11200 }
      ];

      // Datos mock para actividad semanal
      const weeklyActivity = [
        { day: 'Lun', casos: 3, documentos: 5 },
        { day: 'Mar', casos: 4, documentos: 7 },
        { day: 'Mié', casos: 2, documentos: 3 },
        { day: 'Jue', casos: 5, documentos: 8 },
        { day: 'Vie', casos: 3, documentos: 4 },
        { day: 'Sáb', casos: 1, documentos: 2 },
        { day: 'Dom', casos: 0, documentos: 1 }
      ];

      // Datos mock para actividad reciente
      const recentActivity = [
        { type: 'Consultas', count: 12 },
        { type: 'Documentos', count: 25 },
        { type: 'Audiencias', count: 3 },
        { type: 'Reuniones', count: 8 }
      ];

      const dashboardStats: DashboardData = {
        assignedCases: assignedCasesCount,
        completedCases: completedCasesCount,
        pendingCases: pendingCasesCount,
        totalClients: totalClients,
        monthlyRevenue,
        casesByStatus,
        casesBySpecialty,
        weeklyActivity,
        recentActivity
      };

      setDashboardData(dashboardStats);
    } catch (error) {
      console.error('Error fetching lawyer data:', error);
      // Usar datos mock en caso de error
      setDashboardData({
        assignedCases: 15,
        completedCases: 8,
        pendingCases: 7,
        totalClients: 12,
        monthlyRevenue: [
          { month: 'Ene', amount: 8500 },
          { month: 'Feb', amount: 9200 },
          { month: 'Mar', amount: 8800 },
          { month: 'Abr', amount: 10500 },
          { month: 'May', amount: 9800 },
          { month: 'Jun', amount: 11200 }
        ],
        casesByStatus: [
          { status: 'Activos', count: 7 },
          { status: 'En Proceso', count: 5 },
          { status: 'Completados', count: 8 }
        ],
        casesBySpecialty: [
          { specialty: 'Civil', count: 6 },
          { specialty: 'Laboral', count: 4 },
          { specialty: 'Mercantil', count: 3 },
          { specialty: 'Familiar', count: 2 }
        ],
        weeklyActivity: [
          { day: 'Lun', casos: 3, documentos: 5 },
          { day: 'Mar', casos: 4, documentos: 7 },
          { day: 'Mié', casos: 2, documentos: 3 },
          { day: 'Jue', casos: 5, documentos: 8 },
          { day: 'Vie', casos: 3, documentos: 4 },
          { day: 'Sáb', casos: 1, documentos: 2 },
          { day: 'Dom', casos: 0, documentos: 1 }
        ],
        recentActivity: [
          { type: 'Consultas', count: 12 },
          { type: 'Documentos', count: 25 },
          { type: 'Audiencias', count: 3 },
          { type: 'Reuniones', count: 8 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyerData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Dashboard</h1>
            <p className="text-muted-foreground">
              Métricas y análisis de mis casos asignados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Asignados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.assignedCases}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(dashboardData.assignedCases * 0.1)}% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.completedCases}</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor((dashboardData.completedCases / dashboardData.assignedCases) * 100)}% tasa de éxito
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(dashboardData.totalClients * 0.15)} nuevos este mes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{(dashboardData.monthlyRevenue.reduce((sum, item) => sum + item.amount, 0) / 1000).toFixed(1)}K</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 20)}% desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CasosAsignadosChart data={dashboardData} />
          <EstadosCasosChart data={dashboardData} />
          <IngresosChart data={dashboardData} />
          <ActividadSemanalChart data={dashboardData} />
          <CasosPorEspecialidadChart data={dashboardData} />
          <ResumenActividadChart data={dashboardData} />
        </div>
      </div>
    </div>
  );
} 