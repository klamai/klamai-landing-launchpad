'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge-2';
import { Card, CardContent, CardHeader, CardTitle, CardToolbar } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-2';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';

// Datos de cashflow para 12 meses (adaptado para casos legales)
const cashflowData = [
  { month: 'ENE', value: 2100 },
  { month: 'FEB', value: 2300 },
  { month: 'MAR', value: 1900 },
  { month: 'ABR', value: 4800 },
  { month: 'MAY', value: 5200 },
  { month: 'JUN', value: 8900 },
  { month: 'JUL', value: 6200 },
  { month: 'AGO', value: 7100 },
  { month: 'SEP', value: 9400 },
  { month: 'OCT', value: 10200 },
  { month: 'NOV', value: 11100 },
  { month: 'DIC', value: 11800 },
];

// Configuración del chart con colores personalizados
const chartConfig = {
  value: {
    label: 'Cashflow',
    color: '#8b5cf6', // violet-500
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
    return (
      <div className="rounded-lg bg-zinc-900 text-white p-3 shadow-lg">
        <div className="text-xs font-medium mb-1">Total:</div>
        <div className="text-sm font-semibold">€{payload[0].value.toLocaleString()}</div>
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

export default function CashflowChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('12m');

  // Filtrar datos según el período seleccionado
  const getFilteredData = () => {
    switch (selectedPeriod) {
      case '6m':
        return cashflowData.slice(-6);
      case '12m':
        return cashflowData;
      case '2y':
        // Simular datos de 2 años duplicando y modificando el año actual
        const previousYear = cashflowData.map((item) => ({
          month: `${item.month} '23`,
          value: Math.round(item.value * 0.85), // 15% menor para el año anterior
        }));
        const currentYear = cashflowData.map((item) => ({
          month: `${item.month} '24`,
          value: item.value,
        }));
        return [...previousYear, ...currentYear];
      default:
        return cashflowData;
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
        <CardTitle className="text-lg font-semibold">Cashflow</CardTitle>
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