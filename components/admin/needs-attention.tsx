'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, Server, UserX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AttentionItem } from '@/lib/types'

const typeConfig = {
  trial_pending: { icon: Clock, className: 'text-warning-foreground bg-warning/10' },
  demo_today: { icon: Clock, className: 'text-info bg-info/10' },
  unassigned: { icon: UserX, className: 'text-muted-foreground bg-muted' },
  provisioning_failed: { icon: Server, className: 'text-destructive bg-destructive/10' },
}

interface NeedsAttentionProps {
  items: AttentionItem[]
  className?: string
}

export function NeedsAttention({ items, className }: NeedsAttentionProps) {
  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Requiere atencion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Todo al corriente</p>
            <p className="mt-1 text-xs text-muted-foreground">No hay pendientes urgentes por atender</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Requiere atencion
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const { icon: Icon, className: iconClassName } = typeConfig[item.type]
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                item.urgent && 'border-destructive/30 bg-destructive/5',
              )}
            >
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconClassName)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href={item.link}>Ver</Link>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
