import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import * as RechartsPrimitive from "recharts";
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Area, AreaChart, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { TrendingUp, TrendingDown, Users, Briefcase, CreditCard, FileText, DollarSign, Calendar } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Chart Configuration Types
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

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
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
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color,
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
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
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
    },
    ref,
  ) => {
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
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
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
                  indicator === "dot" && "items-center",
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
                            },
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
                        nestLabel ? "items-end" : "items-center",
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
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
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

// Mock data for different charts
const clientesData = [
  { mes: "Ene", nuevos: 45, activos: 320 },
  { mes: "Feb", nuevos: 52, activos: 365 },
  { mes: "Mar", nuevos: 38, activos: 398 },
  { mes: "Abr", nuevos: 61, activos: 445 },
  { mes: "May", nuevos: 55, activos: 489 },
  { mes: "Jun", nuevos: 67, activos: 534 },
];

const abogadosData = [
  { nombre: "Civil", casos: 45, color: "#14b8a6" },
  { nombre: "Penal", casos: 32, color: "#8b5cf6" },
  { nombre: "Laboral", casos: 28, color: "#f59e0b" },
  { nombre: "Mercantil", casos: 22, color: "#ef4444" },
  { nombre: "Familia", casos: 18, color: "#06b6d4" },
];

const pagosData = [
  { mes: "Ene", ingresos: 125000, gastos: 85000 },
  { mes: "Feb", ingresos: 142000, gastos: 92000 },
  { mes: "Mar", ingresos: 138000, gastos: 88000 },
  { mes: "Abr", ingresos: 156000, gastos: 95000 },
  { mes: "May", ingresos: 168000, gastos: 102000 },
  { mes: "Jun", ingresos: 175000, gastos: 108000 },
];

const casosData = [
  { estado: "Activos", cantidad: 85, fill: "#14b8a6" },
  { estado: "Pendientes", cantidad: 42, fill: "#f59e0b" },
  { estado: "Cerrados", cantidad: 156, fill: "#10b981" },
  { estado: "Archivados", cantidad: 23, fill: "#6b7280" },
];

const rendimientoData = [
  { categoria: "Eficiencia", valor: 85 },
  { categoria: "Satisfacción", valor: 92 },
  { categoria: "Tiempo", valor: 78 },
  { categoria: "Calidad", valor: 88 },
];

// Chart configurations
const clientesConfig = {
  nuevos: { label: "Nuevos Clientes", color: "#14b8a6" },
  activos: { label: "Clientes Activos", color: "#8b5cf6" },
} satisfies ChartConfig;

const abogadosConfig = {
  casos: { label: "Casos" },
} satisfies ChartConfig;

const pagosConfig = {
  ingresos: { label: "Ingresos", color: "#10b981" },
  gastos: { label: "Gastos", color: "#ef4444" },
} satisfies ChartConfig;

const casosConfig = {
  cantidad: { label: "Casos" },
} satisfies ChartConfig;

const rendimientoConfig = {
  valor: { label: "Porcentaje" },
} satisfies ChartConfig;

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, change, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend === "up" ? (
            <span className="text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {change}
            </span>
          ) : (
            <span className="text-red-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {change}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// Chart Card Component
interface ChartCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Interfaces para datos reales
interface LawyerDashboardData {
  totalClientes: number;
  casosActivos: number;
  ingresosMes: number;
  pagosPendientes: number;
  clientesData: Array<{ mes: string; nuevos: number; activos: number }>;
  casosPorEspecialidad: Array<{ nombre: string; casos: number; color: string }>;
  ingresosGastos: Array<{ mes: string; ingresos: number; gastos: number }>;
  casosPorEstado: Array<{ estado: string; cantidad: number; fill: string }>;
  rendimiento: Array<{ categoria: string; valor: number }>;
}

// Función para obtener datos reales del abogado regular
async function fetchLawyerDashboardData(): Promise<LawyerDashboardData> {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

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
          cliente_id
        )
      `)
      .eq('abogado_id', user.id);

    if (casesError) {
      console.error('Error fetching assigned cases:', casesError);
      throw casesError;
    }

    // Procesar datos de casos
    const cases = assignedCases?.map(ac => ac.casos).filter(Boolean) || [];
    const totalCasos = cases.length;
    const casosActivos = cases.filter(c => c.estado === 'asignado' || c.estado === 'listo_para_propuesta').length;
    const casosCerrados = cases.filter(c => c.estado === 'cerrado').length;

    // Obtener clientes únicos
    const uniqueClients = new Set(cases.map(c => c.cliente_id).filter(Boolean));
    const totalClientes = uniqueClients.size;

    // Procesar casos por especialidad
    const specialtyCounts = cases.reduce((acc, caso) => {
      const especialidad = caso.especialidades?.nombre || 'Sin Especialidad';
      acc[especialidad] = (acc[especialidad] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casosPorEspecialidad = Object.entries(specialtyCounts).map(([nombre, casos], index) => {
      const colors = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#f97316', '#ec4899'];
      return {
        nombre,
        casos: casos as number,
        color: colors[index % colors.length]
      };
    });

    // Procesar casos por estado
    const statusCounts = cases.reduce((acc, caso) => {
      acc[caso.estado] = (acc[caso.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casosPorEstado = [
      { estado: "Activos", cantidad: statusCounts['asignado'] || 0, fill: "#14b8a6" },
      { estado: "En Proceso", cantidad: statusCounts['listo_para_propuesta'] || 0, fill: "#f59e0b" },
      { estado: "Cerrados", cantidad: statusCounts['cerrado'] || 0, fill: "#10b981" },
      { estado: "Disponibles", cantidad: statusCounts['disponible'] || 0, fill: "#6b7280" },
    ];

    // Datos mock para ingresos (se puede implementar cuando tengamos tabla de pagos)
    const ingresosGastos = [
      { mes: "Ene", ingresos: Math.floor(totalCasos * 1500), gastos: Math.floor(totalCasos * 500) },
      { mes: "Feb", ingresos: Math.floor(totalCasos * 1600), gastos: Math.floor(totalCasos * 550) },
      { mes: "Mar", ingresos: Math.floor(totalCasos * 1400), gastos: Math.floor(totalCasos * 480) },
      { mes: "Abr", ingresos: Math.floor(totalCasos * 1700), gastos: Math.floor(totalCasos * 600) },
      { mes: "May", ingresos: Math.floor(totalCasos * 1800), gastos: Math.floor(totalCasos * 650) },
      { mes: "Jun", ingresos: Math.floor(totalCasos * 1900), gastos: Math.floor(totalCasos * 700) },
    ];

    // Datos mock para clientes por mes
    const clientesData = [
      { mes: "Ene", nuevos: Math.floor(totalClientes * 0.1), activos: Math.floor(totalClientes * 0.6) },
      { mes: "Feb", nuevos: Math.floor(totalClientes * 0.12), activos: Math.floor(totalClientes * 0.65) },
      { mes: "Mar", nuevos: Math.floor(totalClientes * 0.08), activos: Math.floor(totalClientes * 0.7) },
      { mes: "Abr", nuevos: Math.floor(totalClientes * 0.15), activos: Math.floor(totalClientes * 0.75) },
      { mes: "May", nuevos: Math.floor(totalClientes * 0.13), activos: Math.floor(totalClientes * 0.8) },
      { mes: "Jun", nuevos: Math.floor(totalClientes * 0.16), activos: Math.floor(totalClientes * 0.85) },
    ];

    // Datos mock para rendimiento
    const rendimiento = [
      { categoria: "Eficiencia", valor: Math.min(95, Math.max(70, casosCerrados / totalCasos * 100)) },
      { categoria: "Satisfacción", valor: Math.min(95, Math.max(80, 85 + Math.random() * 10)) },
      { categoria: "Tiempo", valor: Math.min(95, Math.max(60, 75 + Math.random() * 15)) },
      { categoria: "Calidad", valor: Math.min(95, Math.max(75, 80 + Math.random() * 12)) },
    ];

    return {
      totalClientes,
      casosActivos,
      ingresosMes: ingresosGastos[ingresosGastos.length - 1].ingresos,
      pagosPendientes: Math.floor(ingresosGastos[ingresosGastos.length - 1].ingresos * 0.25),
      clientesData,
      casosPorEspecialidad,
      ingresosGastos,
      casosPorEstado,
      rendimiento
    };

  } catch (error) {
    console.error('Error fetching lawyer dashboard data:', error);
    // Retornar datos mock en caso de error
    return {
      totalClientes: 25,
      casosActivos: 12,
      ingresosMes: 18000,
      pagosPendientes: 4500,
      clientesData: [
        { mes: "Ene", nuevos: 3, activos: 15 },
        { mes: "Feb", nuevos: 4, activos: 18 },
        { mes: "Mar", nuevos: 2, activos: 20 },
        { mes: "Abr", nuevos: 5, activos: 22 },
        { mes: "May", nuevos: 4, activos: 24 },
        { mes: "Jun", nuevos: 6, activos: 25 },
      ],
      casosPorEspecialidad: [
        { nombre: "Civil", casos: 8, color: "#14b8a6" },
        { nombre: "Laboral", casos: 6, color: "#8b5cf6" },
        { nombre: "Mercantil", casos: 4, color: "#f59e0b" },
        { nombre: "Familiar", casos: 3, color: "#ef4444" },
        { nombre: "Penal", casos: 2, color: "#06b6d4" },
      ],
      ingresosGastos: [
        { mes: "Ene", ingresos: 12000, gastos: 4000 },
        { mes: "Feb", ingresos: 14000, gastos: 4500 },
        { mes: "Mar", ingresos: 13000, gastos: 4200 },
        { mes: "Abr", ingresos: 16000, gastos: 5000 },
        { mes: "May", ingresos: 17000, gastos: 5500 },
        { mes: "Jun", ingresos: 18000, gastos: 6000 },
      ],
      casosPorEstado: [
        { estado: "Activos", cantidad: 8, fill: "#14b8a6" },
        { estado: "En Proceso", cantidad: 4, fill: "#f59e0b" },
        { estado: "Cerrados", cantidad: 10, fill: "#10b981" },
        { estado: "Disponibles", cantidad: 0, fill: "#6b7280" },
      ],
      rendimiento: [
        { categoria: "Eficiencia", valor: 85 },
        { categoria: "Satisfacción", valor: 92 },
        { categoria: "Tiempo", valor: 78 },
        { categoria: "Calidad", valor: 88 },
      ]
    };
  }
}

// Main Dashboard Component
function LegalDashboard() {
  const [dashboardData, setDashboardData] = useState<LawyerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLawyerDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Legal</h1>
            <p className="text-muted-foreground">
              Métricas y análisis del bufete de abogados
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Legal</h1>
            <p className="text-muted-foreground">
              Error al cargar los datos del dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Legal</h1>
          <p className="text-muted-foreground">
            Métricas y análisis del bufete de abogados
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Clientes"
            value={dashboardData.totalClientes.toString()}
            change="+12.5%"
            trend="up"
            icon={Users}
          />
          <MetricCard
            title="Casos Activos"
            value={dashboardData.casosActivos.toString()}
            change="+8.2%"
            trend="up"
            icon={Briefcase}
          />
          <MetricCard
            title="Ingresos Mes"
            value={`€${dashboardData.ingresosMes.toLocaleString()}`}
            change="+15.3%"
            trend="up"
            icon={DollarSign}
          />
          <MetricCard
            title="Pagos Pendientes"
            value={`€${dashboardData.pagosPendientes.toLocaleString()}`}
            change="-5.1%"
            trend="down"
            icon={CreditCard}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Clientes Chart */}
          <ChartCard
            title="Evolución de Clientes"
            description="Nuevos clientes vs clientes activos por mes"
          >
            <ChartContainer config={clientesConfig} className="h-[200px]">
              <BarChart data={dashboardData.clientesData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  isAnimationActive={true}
                />
                <Bar 
                  dataKey="nuevos" 
                  fill="#14b8a6" 
                  radius={4}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Bar 
                  dataKey="activos" 
                  fill="#8b5cf6" 
                  radius={4}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          {/* Casos por Área */}
          <ChartCard
            title="Casos por Área Legal"
            description="Distribución de casos por especialidad"
          >
            <ChartContainer config={abogadosConfig} className="h-[200px]">
              <PieChart>
                <Pie
                  data={dashboardData.casosPorEspecialidad}
                  dataKey="casos"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {dashboardData.casosPorEspecialidad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent hideLabel />}
                  isAnimationActive={true}
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>

          {/* Ingresos vs Gastos */}
          <ChartCard
            title="Análisis Financiero"
            description="Ingresos y gastos mensuales"
          >
            <ChartContainer config={pagosConfig} className="h-[200px]">
              <LineChart data={dashboardData.ingresosGastos}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: '#888', strokeWidth: 1 }}
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Line
                  type="monotone"
                  dataKey="gastos"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>

          {/* Estado de Casos */}
          <ChartCard
            title="Estado de Casos"
            description="Distribución actual de casos por estado"
          >
            <ChartContainer config={casosConfig} className="h-[200px]">
              <RadialBarChart
                data={dashboardData.casosPorEstado}
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="80%"
              >
                <RadialBar dataKey="cantidad" cornerRadius={4} fill="#8884d8" />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              </RadialBarChart>
            </ChartContainer>
          </ChartCard>

          {/* Rendimiento */}
          <ChartCard
            title="Métricas de Rendimiento"
            description="KPIs principales del bufete"
          >
            <ChartContainer config={rendimientoConfig} className="h-[200px]">
              <AreaChart data={dashboardData.rendimiento}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="categoria"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: '#888', strokeWidth: 1 }}
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.2}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          {/* Actividad Reciente */}
          <ChartCard
            title="Actividad Reciente"
            description="Resumen de actividades del día"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo caso registrado</p>
                  <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Cita programada</p>
                  <p className="text-xs text-muted-foreground">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pago recibido</p>
                  <p className="text-xs text-muted-foreground">Hace 6 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Cliente nuevo</p>
                  <p className="text-xs text-muted-foreground">Hace 8 horas</p>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

export default LegalDashboard; 