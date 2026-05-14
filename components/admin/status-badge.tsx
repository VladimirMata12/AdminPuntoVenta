import { cn } from '@/lib/utils'
import type { LeadIntent, LeadPriority, LeadStatus, OnboardingStatus, ProvisioningStatus } from '@/lib/types'

// Lead Status Badge
const leadStatusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'Nuevo', className: 'bg-info/10 text-info border-info/20' },
  contacted: { label: 'Contactado', className: 'bg-muted text-muted-foreground border-border' },
  qualified: { label: 'Calificado', className: 'bg-primary/10 text-primary border-primary/20' },
  demo_scheduled: { label: 'Demo agendada', className: 'bg-warning/10 text-warning-foreground border-warning/20' },
  trial_pending: { label: 'Trial pendiente', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  won: { label: 'Ganado', className: 'bg-success/15 text-success border-success/30' },
  lost: { label: 'Perdido', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config = leadStatusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  )
}

// Lead Intent Badge
const intentConfig: Record<LeadIntent, { label: string; className: string }> = {
  contact: { label: 'Contacto', className: 'bg-muted text-muted-foreground border-border' },
  demo: { label: 'Demo', className: 'bg-warning/10 text-warning-foreground border-warning/20' },
  trial: { label: 'Prueba', className: 'bg-success/10 text-success border-success/20' },
}

export function IntentBadge({ intent }: { intent: LeadIntent }) {
  const config = intentConfig[intent]
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  )
}

const priorityConfig: Record<LeadPriority, { label: string; className: string }> = {
  low: { label: 'Baja', className: 'bg-muted text-muted-foreground border-border' },
  normal: { label: 'Normal', className: 'bg-info/10 text-info border-info/20' },
  high: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  const config = priorityConfig[priority]
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  )
}

// Onboarding Status Badge
const onboardingStatusConfig: Record<OnboardingStatus, { label: string; className: string }> = {
  not_started: { label: 'Sin iniciar', className: 'bg-muted text-muted-foreground border-border' },
  invited: { label: 'Invitado', className: 'bg-info/10 text-info border-info/20' },
  in_progress: { label: 'En progreso', className: 'bg-warning/10 text-warning-foreground border-warning/20' },
  completed: { label: 'Completado', className: 'bg-success/10 text-success border-success/20' },
  blocked: { label: 'Bloqueado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

export function OnboardingStatusBadge({ status }: { status: OnboardingStatus }) {
  const config = onboardingStatusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  )
}

// Provisioning Status Badge
const provisioningStatusConfig: Record<ProvisioningStatus, { label: string; className: string; dot?: string }> = {
  pending: { label: 'Pendiente', className: 'bg-warning/10 text-warning-foreground border-warning/20', dot: 'bg-warning' },
  provisioning: { label: 'Provisionando', className: 'bg-info/10 text-info border-info/20', dot: 'bg-info animate-pulse' },
  success: { label: 'Exitoso', className: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  failed: { label: 'Fallido', className: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  canceled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
}

export function ProvisioningStatusBadge({ status }: { status: ProvisioningStatus }) {
  const config = provisioningStatusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
      config.className
    )}>
      {config.dot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
      {config.label}
    </span>
  )
}

// Tenant Status Badge
export function TenantStatusBadge({ status }: { status: 'active' | 'inactive' | 'suspended' }) {
  const config = {
    active: { label: 'Activo', className: 'bg-success/10 text-success border-success/20' },
    inactive: { label: 'Inactivo', className: 'bg-muted text-muted-foreground border-border' },
    suspended: { label: 'Suspendido', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  }[status]

  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  )
}
