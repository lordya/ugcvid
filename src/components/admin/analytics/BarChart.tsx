'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface BarChartProps {
  data: Array<{
    [key: string]: any
  }>
  dataKeys: Array<{
    key: string
    name: string
    color: string
  }>
  title?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  yAxisFormatter?: (value: any) => string
  xAxisFormatter?: (value: any) => string
  layout?: 'horizontal' | 'vertical'
}

export function AnalyticsBarChart({
  data,
  dataKeys,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisFormatter,
  xAxisFormatter,
  layout = 'vertical'
}: BarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-layer-2 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {yAxisFormatter ? yAxisFormatter(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={layout}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
            )}
            <XAxis
              type={layout === 'vertical' ? 'category' : 'number'}
              dataKey={layout === 'vertical' ? 'name' : undefined}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              fontFamily="var(--font-mono)"
              tickFormatter={xAxisFormatter}
            />
            <YAxis
              type={layout === 'vertical' ? 'number' : 'category'}
              dataKey={layout === 'horizontal' ? 'name' : undefined}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              fontFamily="var(--font-mono)"
              tickFormatter={yAxisFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {dataKeys.map((dataKey) => (
              <Bar
                key={dataKey.key}
                dataKey={dataKey.key}
                name={dataKey.name}
                fill={dataKey.color}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
