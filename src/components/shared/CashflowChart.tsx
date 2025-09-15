'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge-2';
import { Card, CardContent, CardHeader, CardTitle, CardToolbar } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-2';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';

interface CashflowChartProps {
  data?: Array<{ mes: string; ingresos: number; gastos: number; beneficio: number }>;
  title?: string;
}

// Configuración del chart con colores personalizados
const chartConfig = {
  value: {
    label: 'Cashflow',
    color: '#8b5cf6', // violet-500
  },
} satisfies ChartConfig;

// Tooltip personalizado
interface ChartDataPoint {
  month: string;
  value: number;
  ingresos: number;
  gastos: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    payload?: ChartDataPoint;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg bg-zinc-900 text-white p-3 shadow-lg min-w-[200px]">
        <div className="text-xs font-medium mb-2 text-center border-b border-gray-600 pb-1">
          {label}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-green-400">Ingresos:</span>
            <span className="text-xs font-medium">€{data.ingresos?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400">Gastos:</span>
            <span className="text-xs font-medium">€{data.gastos?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-600 pt-1 mt-1">
            <span className="text-xs text-blue-400 font-medium">Beneficio:</span>
            <span className="text-sm font-bold text-blue-400">€{data.value?.toLocaleString() || '0'}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Configuración de períodos
const PERIODS = {
  '6m': {
    key: '6m',
    label: '6 meses',
    dateRange: 'Jul 01 - Dic 31, 2024',
  },
  '12m': {
    key: '12m',
    label: '12 meses',
    dateRange: 'Ene 01 - Dic 31, 2024',
  },
  '2y': {
    key: '2y',
    label: '2 años',
    dateRange: 'Ene 01, 2023 - Dic 31, 2024',
  },
} as const;

type PeriodKey = keyof typeof PERIODS;

export default function CashflowChart({ data, title = "Cashflow" }: CashflowChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('12m');

  // Datos por defecto si no se pasan datos
  const defaultData = [
    { mes: 'Ene', ingresos: 21000, gastos: 8000, beneficio: 13000 },
    { mes: 'Feb', ingresos: 23000, gastos: 8500, beneficio: 14500 },
    { mes: 'Mar', ingresos: 19000, gastos: 7800, beneficio: 11200 },
    { mes: 'Abr', ingresos: 48000, gastos: 12000, beneficio: 36000 },
    { mes: 'May', ingresos: 52000, gastos: 13000, beneficio: 39000 },
    { mes: 'Jun', ingresos: 89000, gastos: 18000, beneficio: 71000 },
  ];

  const chartData = data || defaultData;

  // Transformar datos para el gráfico (usar beneficio como valor principal)
  const transformedData = chartData.map(item => ({
    month: item.mes,
    value: item.beneficio,
    ingresos: item.ingresos,
    gastos: item.gastos
  }));

  // Filtrar datos según el período seleccionado
  const getFilteredData = () => {
    switch (selectedPeriod) {
      case '6m':
        return transformedData.slice(-6);
      case '12m':
        return transformedData;
      case '2y': {
        // Simular datos de 2 años duplicando y modificando el año actual
        const previousYear = transformedData.map((item) => ({
          month: `${item.month} '23`,
          value: Math.round(item.value * 0.85), // 15% menor para el año anterior
          ingresos: Math.round(item.ingresos * 0.85),
          gastos: Math.round(item.gastos * 0.85)
        }));
        const currentYear = transformedData.map((item) => ({
          month: `${item.month} '24`,
          value: item.value,
          ingresos: item.ingresos,
          gastos: item.gastos
        }));
        return [...previousYear, ...currentYear];
      }
      default:
        return transformedData;
    }
  };

  const filteredData = getFilteredData();

  // Obtener configuración del período actual
  const currentPeriod = PERIODS[selectedPeriod];

  // Calcular total y porcentaje basado en los datos filtrados
  const totalCash = filteredData.reduce((sum, item) => sum + item.value, 0);
  const lastValue = filteredData[filteredData.length - 1]?.value || 0;
  const previousValue = filteredData[filteredData.length - 2]?.value || 0;
  const percentageChange = previousValue > 0 ? ((lastValue - previousValue) / previousValue) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader className="border-0 min-h-auto pt-6 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardToolbar>
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodKey)}>
            <SelectTrigger>{currentPeriod.label}</SelectTrigger>
            <SelectContent align="end">
              {Object.values(PERIODS).map((period) => (
                <SelectItem key={period.key} value={period.key}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardToolbar>
      </CardHeader>

      <CardContent className="px-0">
        {/* Sección de estadísticas */}
        <div className="px-5 mb-8">
          <div className="text-xs font-medium text-muted-foreground tracking-wide mb-2">
            {currentPeriod.dateRange}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl font-semibold">€{totalCash.toLocaleString()}</div>
            <Badge variant="success" appearance="light">
              <TrendingUp className="w-3 h-3" />
              {Math.abs(percentageChange).toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Gráfico */}
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full ps-1.5 pe-2.5 overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart
              data={filteredData}
              margin={{
                top: 25,
                right: 25,
                left: 0,
                bottom: 25,
              }}
              style={{ overflow: 'visible' }}
            >
              {/* Gradiente */}
              <defs>
                <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartConfig.value.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={chartConfig.value.color} stopOpacity={0} />
                </linearGradient>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              <CartesianGrid
                strokeDasharray="4 12"
                stroke="var(--input)"
                strokeOpacity={1}
                horizontal={true}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickMargin={12}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}K`}
                domain={[0, 'dataMax + 1000']}
                tickCount={6}
                tickMargin={12}
              />

              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: chartConfig.value.color,
                  strokeWidth: 1,
                  strokeDasharray: 'none',
                }}
              />

              {/* Área con gradiente */}
              <Area
                type="linear"
                dataKey="value"
                stroke="transparent"
                fill="url(#cashflowGradient)"
                strokeWidth={0}
                dot={false}
              />

              {/* Línea principal de cashflow */}
              <Line
                type="linear"
                dataKey="value"
                stroke={chartConfig.value.color}
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.month === 'JUN' || payload.month === 'NOV') {
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={chartConfig.value.color}
                        stroke="white"
                        strokeWidth={2}
                        filter="url(#dotShadow)"
                      />
                    );
                  }
                  return <g key={`dot-${cx}-${cy}`} />; // Retornar grupo vacío para otros puntos
                }}
                activeDot={{
                  r: 6,
                  fill: chartConfig.value.color,
                  stroke: 'white',
                  strokeWidth: 2,
                  filter: 'url(#dotShadow)',
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
} 