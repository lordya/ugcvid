'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format } from 'date-fns'

interface TimeSeriesChartProps {
  data: Array<{
    date: string
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
}

export function TimeSeriesChart({
  data,
  dataKeys,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisFormatter,
  xAxisFormatter
}: TimeSeriesChartProps) {
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd')
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-layer-2 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">
            {format(new Date(label), 'MMM dd, yyyy')}
          </p>
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
          <LineChart
            data={formattedData}
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
              dataKey="formattedDate"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              fontFamily="var(--font-mono)"
              tickFormatter={xAxisFormatter}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              fontFamily="var(--font-mono)"
              tickFormatter={yAxisFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {dataKeys.map((dataKey) => (
              <Line
                key={dataKey.key}
                type="monotone"
                dataKey={dataKey.key}
                name={dataKey.name}
                stroke={dataKey.color}
                strokeWidth={2}
                dot={{ r: 3, fill: dataKey.color }}
                activeDot={{ r: 5, fill: dataKey.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
