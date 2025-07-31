'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge-2';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-6';
import { ArrowDown, ArrowUp, Users, FileText, Clock, DollarSign } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

// Datos de métricas de la plataforma legal (adaptado para casos legales)
const platformData = [
  { date: '2024-04-01', casos: 22, tiempo_respuesta: 150, ingresos: 8.2, clientes: 42 },
  { date: '2024-04-02', casos: 9, tiempo_respuesta: 180, ingresos: 4.5, clientes: 29 },
  { date: '2024-04-03', casos: 16, tiempo_respuesta: 120, ingresos: 6.8, clientes: 38 },
  { date: '2024-04-04', casos: 24, tiempo_respuesta: 260, ingresos: 9.1, clientes: 52 },
  { date: '2024-04-05', casos: 30, tiempo_respuesta: 340, ingresos: 11.2, clientes: 62 },
  { date: '2024-04-06', casos: 5, tiempo_respuesta: 110, ingresos: 2.8, clientes: 18 },
  { date: '2024-04-07', casos: 26, tiempo_respuesta: 190, ingresos: 9.8, clientes: 51 },
  { date: '2024-04-08', casos: 32, tiempo_respuesta: 350, ingresos: 12.1, clientes: 65 },
  { date: '2024-04-09', casos: 8, tiempo_respuesta: 150, ingresos: 3.8, clientes: 22 },
  { date: '2024-04-10', casos: 19, tiempo_respuesta: 165, ingresos: 7.2, clientes: 39 },
  { date: '2024-04-11', casos: 22, tiempo_respuesta: 170, ingresos: 8.5, clientes: 45 },
  { date: '2024-04-12', casos: 38, tiempo_respuesta: 290, ingresos: 13.8, clientes: 71 },
  { date: '2024-04-13', casos: 21, tiempo_respuesta: 250, ingresos: 8.2, clientes: 43 },
  { date: '2024-04-14', casos: 7, tiempo_respuesta: 130, ingresos: 3.1, clientes: 19 },
  { date: '2024-04-15', casos: 12, tiempo_respuesta: 180, ingresos: 5.1, clientes: 30 },
  { date: '2024-04-16', casos: 19, tiempo_respuesta: 160, ingresos: 7.5, clientes: 39 },
  { date: '2024-04-17', casos: 47, tiempo_respuesta: 380, ingresos: 17.2, clientes: 89 },
  { date: '2024-04-18', casos: 33, tiempo_respuesta: 400, ingresos: 12.9, clientes: 67 },
];

// Configuraciones de métricas
const metrics = [
  {
    key: 'casos',
    label: 'Casos Totales',
    value: 286,
    previousValue: 242,
    format: (val: number) => val.toLocaleString(),
    icon: FileText,
  },
  {
    key: 'tiempo_respuesta',
    label: 'Tiempo Respuesta',
    value: 135,
    previousValue: 118,
    format: (val: number) => `${val}min`,
    isNegative: true, // Menor tiempo de respuesta es mejor
    icon: Clock,
  },
  {
    key: 'ingresos',
    label: 'Ingresos',
    value: 8.67,
    previousValue: 7.54,
    format: (val: number) => `€${val.toFixed(2)}k`,
    icon: DollarSign,
  },
  {
    key: 'clientes',
    label: 'Clientes Activos',
    value: 142,
    previousValue: 124,
    format: (val: number) => val.toLocaleString(),
    icon: Users,
  },
];

// Configuración del chart con colores personalizados
const chartConfig = {
  casos: {
    label: 'Casos Totales',
    color: '#14b8a6', // teal-500
  },
  tiempo_respuesta: {
    label: 'Tiempo Respuesta',
    color: '#8b5cf6', // violet-500
  },
  ingresos: {
    label: 'Ingresos',
    color: '#84cc16', // lime-500
  },
  clientes: {
    label: 'Clientes Activos',
    color: '#0ea5e9', // sky-500
  },
} satisfies ChartConfig;

// Tooltip personalizado
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const metric = metrics.find((m) => m.key === entry.dataKey);

    if (metric) {
      return (
        <div className="rounded-lg border bg-popover p-3 shadow-sm shadow-black/5 min-w-[120px]">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-muted-foreground">{metric.label}:</span>
            <span className="font-semibold text-popover-foreground">{metric.format(entry.value)}</span>
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function SuperAdminMetrics() {
  const [selectedMetric, setSelectedMetric] = useState<string>('tiempo_respuesta');

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="p-0 mb-5">
          {/* Grid de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 grow">
            {metrics.map((metric) => {
              const change = ((metric.value - metric.previousValue) / metric.previousValue) * 100;
              const isPositive = metric.isNegative ? change < 0 : change > 0;
              const IconComponent = metric.icon;

              return (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={cn(
                    'cursor-pointer flex-1 text-start p-4 last:border-b-0 border-b md:border-b md:even:border-e xl:border-b-0 xl:border-e xl:last:border-e-0 transition-all',
                    selectedMetric === metric.key && 'bg-muted/50',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                    </div>
                    <Badge variant={isPositive ? 'success' : 'destructive'} appearance="outline">
                      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(change).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-xl font-semibold">{metric.format(metric.value)}</div>
                  <div className="text-xs text-muted-foreground mt-1">desde {metric.format(metric.previousValue)}</div>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="px-2.5 py-6">
          <ChartContainer
            config={chartConfig}
            className="h-96 w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <LineChart
              data={platformData}
              margin={{
                top: 20,
                right: 20,
                left: 5,
                bottom: 20,
              }}
              style={{ overflow: 'visible' }}
            >
              {/* Patrón de fondo para el área del chart */}
              <defs>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="var(--input)" fillOpacity="1" />
                </pattern>
                <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow
                    dx="4"
                    dy="6"
                    stdDeviation="25"
                    floodColor={`${chartConfig[selectedMetric as keyof typeof chartConfig]?.color}60`}
                  />
                </filter>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickMargin={10}
                tickCount={6}
                tickFormatter={(value) => {
                  const metric = metrics.find((m) => m.key === selectedMetric);
                  return metric ? metric.format(value) : value.toString();
                }}
              />

              <ChartTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#9ca3af' }} />

              {/* Patrón de fondo para el área del chart */}
              <rect
                x="60px"
                y="-20px"
                width="calc(100% - 75px)"
                height="calc(100% - 10px)"
                fill="url(#dotGrid)"
                style={{ pointerEvents: 'none' }}
              />

              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={chartConfig[selectedMetric as keyof typeof chartConfig]?.color}
                strokeWidth={2}
                filter="url(#lineShadow)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: chartConfig[selectedMetric as keyof typeof chartConfig]?.color,
                  stroke: 'white',
                  strokeWidth: 2,
                  filter: 'url(#dotShadow)',
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
} 