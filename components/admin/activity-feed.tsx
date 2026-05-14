'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  Server,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { LeadActivity, Lead } from '@/lib/types'

const activityIcons: Record<LeadActivity['type'], { icon: typeof UserPlus; className: string }> = {
  created: { icon: UserPlus, className: 'text-info bg-info/10' },
  note: { icon: MessageSquare, className: 'text-chart-3 bg-chart-3/10' },
  status_changed: { icon: RefreshCw, className: 'text-muted-foreground bg-muted' },
  demo_scheduled: { icon: Calendar, className: 'text-warning-foreground bg-warning/10' },
  demo_completed: { icon: CheckCircle, className: 'text-success bg-success/10' },
  trial_requested: { icon: Clock, className: 'text-chart-4 bg-chart-4/10' },
  trial_approved: { icon: CheckCircle, className: 'text-success bg-success/10' },
  trial_rejected: { icon: XCircle, className: 'text-destructive bg-destructive/10' },
  tenant_provision_started: { icon: Server, className: 'text-primary bg-primary/10' },
  tenant_provision_completed: { icon: Server, className: 'text-primary bg-primary/10' },
  onboarding_progress: { icon: UserCheck, className: 'text-chart-2 bg-chart-2/10' },
}

interface ActivityFeedProps {
  activities: LeadActivity[]
  leads?: Lead[]
  className?: string
}

export function ActivityFeed({ activities, leads = [], className }: ActivityFeedProps) {
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]))

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="space-y-0">
            {activities.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                Todavia no hay actividad registrada en el CRM.
                </div>
            ) : (
              activities.map((activity, index) => {
                const { icon: Icon, className: iconClassName } = activityIcons[activity.type]
                const lead = leadMap.get(activity.leadId)

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'flex items-start gap-3 px-6 py-3',
                      index !== activities.length - 1 && 'border-b border-border',
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconClassName)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{lead?.company || 'Lead eliminado'}</span>{' '}
                        <span className="text-muted-foreground">{activity.notes?.toLowerCase()}</span>
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.performedBy}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
