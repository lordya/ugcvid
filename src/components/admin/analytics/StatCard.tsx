'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  previousValue?: number
  currentValue?: number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  showChange?: boolean
}

export function StatCard({
  title,
  value,
  previousValue,
  currentValue,
  change,
  changeLabel,
  icon,
  className,
  showChange = true
}: StatCardProps) {
  // Calculate change if not provided
  const calculatedChange = change !== undefined ? change :
    (previousValue !== undefined && currentValue !== undefined) ?
      ((currentValue - previousValue) / Math.abs(previousValue)) * 100 : 0

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />
    if (change < 0) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-success'
    if (change < 0) return 'text-destructive'
    return 'text-muted-foreground'
  }

  const getBadgeVariant = (change: number): "default" | "secondary" | "destructive" | "outline" => {
    if (change > 0) return 'default' // success-like
    if (change < 0) return 'destructive'
    return 'secondary'
  }

  return (
    <Card className={cn("bg-layer-2 border-border", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold font-mono tracking-tight text-foreground">
          {value}
        </div>
        {showChange && calculatedChange !== 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={getBadgeVariant(calculatedChange)}
              className="text-xs"
            >
              <span className={cn("flex items-center gap-1", getTrendColor(calculatedChange))}>
                {getTrendIcon(calculatedChange)}
                {formatChange(calculatedChange)}
              </span>
            </Badge>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
