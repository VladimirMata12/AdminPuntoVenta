import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs semana pasada',
  icon,
  trend = 'neutral',
  className,
}: KPICardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5 text-xs">
                {trend === 'up' && (
                  <span className="flex items-center gap-0.5 text-success">
                    <TrendingUp className="h-3 w-3" />
                    +{change}%
                  </span>
                )}
                {trend === 'down' && (
                  <span className="flex items-center gap-0.5 text-destructive">
                    <TrendingDown className="h-3 w-3" />
                    {change}%
                  </span>
                )}
                {trend === 'neutral' && (
                  <span className="flex items-center gap-0.5 text-muted-foreground">
                    <Minus className="h-3 w-3" />
                    {change}%
                  </span>
                )}
                <span className="text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
