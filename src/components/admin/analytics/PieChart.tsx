'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  title?: string
  height?: number
  colors?: string[]
  showLegend?: boolean
  valueFormatter?: (value: any) => string
}

const DEFAULT_COLORS = [
  '#6366F1', // Electric Indigo (primary)
  '#10B981', // Emerald Green (success)
  '#F59E0B', // Amber (warning)
  '#EF4444', // Crimson (destructive)
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
]

export function AnalyticsPieChart({
  data,
  title,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  valueFormatter
}: PieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-layer-2 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            {valueFormatter ? valueFormatter(data.value) : data.value}
            {data.payload.percentage && ` (${data.payload.percentage}%)`}
          </p>
        </div>
      )
    }
    return null
  }

  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }))
  }, [data])

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              fontSize={12}
              fontFamily="var(--font-mono)"
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
