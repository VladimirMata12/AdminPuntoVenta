'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Send,
  Server,
  Tag,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { IntentBadge, LeadStatusBadge, PriorityBadge } from './status-badge'
import type { Lead, LeadActivity, LeadIntent, LeadPriority, LeadStatus } from '@/lib/types'
import type { PlatformAdminProfile } from './auth-provider'

interface LeadDetailPanelProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  owners: PlatformAdminProfile[]
  activities: LeadActivity[]
  busy?: boolean
  onAssignOwner: (leadId: string, ownerId?: string | null) => Promise<boolean>
  onUpdateStatus: (leadId: string, status: LeadStatus, note?: string) => Promise<boolean>
  onScheduleDemo: (leadId: string, demoAt: string, note?: string) => Promise<boolean>
  onAddNote: (leadId: string, note: string) => Promise<boolean>
  onUpdateLead: (input: {
    leadId: string
    companyName?: string
    fullName: string
    email: string
    phone?: string
    intent: LeadIntent
    priority: LeadPriority
    source?: string
    desiredTenantSlug?: string
    message?: string
  }) => Promise<boolean>
  onProvision: (lead: Lead) => Promise<void>
  onDelete: (lead: Lead) => Promise<void>
}

type LeadDraft = {
  companyName: string
  fullName: string
  email: string
  phone: string
  intent: LeadIntent
  priority: LeadPriority
  source: string
  desiredTenantSlug: string
  message: string
}

const sourceLabels: Record<string, string> = {
  website: 'Sitio web',
  referral: 'Referido',
  cold_outreach: 'Prospeccion',
  marketing: 'Marketing',
  partner: 'Partner',
  manual: 'Manual',
}

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'demo_scheduled', label: 'Demo agendada' },
  { value: 'trial_pending', label: 'Trial pendiente' },
  { value: 'won', label: 'Ganado' },
  { value: 'lost', label: 'Perdido' },
]

const intentOptions: Array<{ value: LeadIntent; label: string }> = [
  { value: 'contact', label: 'Contacto' },
  { value: 'demo', label: 'Demo' },
  { value: 'trial', label: 'Prueba' },
]

const priorityOptions: Array<{ value: LeadPriority; label: string }> = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
]

const sourceOptions = [
  'website',
  'referral',
  'cold_outreach',
  'marketing',
  'partner',
  'manual',
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeSlugInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
}

function buildDraft(lead: Lead): LeadDraft {
  return {
    companyName: lead.company,
    fullName: lead.contactName,
    email: lead.contactEmail,
    phone: lead.contactPhone || '',
    intent: lead.intent,
    priority: lead.priority,
    source: lead.source || 'manual',
    desiredTenantSlug: lead.desiredTenantSlug || '',
    message: lead.message || '',
  }
}

export function LeadDetailPanel({
  lead,
  open,
  onClose,
  owners,
  activities,
  busy = false,
  onAssignOwner,
  onUpdateStatus,
  onScheduleDemo,
  onAddNote,
  onUpdateLead,
  onProvision,
  onDelete,
}: LeadDetailPanelProps) {
  const [ownerId, setOwnerId] = useState<string>('unassigned')
  const [status, setStatus] = useState<LeadStatus>('new')
  const [demoAt, setDemoAt] = useState('')
  const [note, setNote] = useState('')
  const [draft, setDraft] = useState<LeadDraft | null>(null)

  useEffect(() => {
    if (!lead) return
    setOwnerId(lead.assignedTo || 'unassigned')
    setStatus(lead.status)
    setDemoAt(lead.demoDate ? format(new Date(lead.demoDate), "yyyy-MM-dd'T'HH:mm") : '')
    setNote('')
    setDraft(buildDraft(lead))
  }, [lead])

  const leadActivities = useMemo(() => {
    if (!lead) return []
    return activities
      .filter((activity) => activity.leadId === lead.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activities, lead])

  if (!lead || !draft) return null

  const saveDisabled =
    busy ||
    draft.fullName.trim().length === 0 ||
    draft.email.trim().length === 0

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{lead.company}</SheetTitle>
              <SheetDescription className="mt-1">
                Lead creado {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <IntentBadge intent={lead.intent} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Detalle</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Actividad</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pr-4 pb-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Informacion general</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="lead-company-name">Empresa</Label>
                      <Input
                        id="lead-company-name"
                        value={draft.companyName}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  companyName: event.target.value,
                                  desiredTenantSlug: current.desiredTenantSlug || slugify(event.target.value),
                                }
                              : current,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lead-full-name">Nombre del contacto</Label>
                      <Input
                        id="lead-full-name"
                        value={draft.fullName}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, fullName: event.target.value } : current))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lead-email">Correo</Label>
                      <Input
                        id="lead-email"
                        type="email"
                        value={draft.email}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, email: event.target.value } : current))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lead-phone">Telefono</Label>
                      <Input
                        id="lead-phone"
                        value={draft.phone}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, phone: event.target.value } : current))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fuente</Label>
                      <Select
                        value={draft.source}
                        onValueChange={(value) =>
                          setDraft((current) => (current ? { ...current, source: value } : current))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona fuente" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {sourceLabels[value] || value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Intencion</Label>
                      <Select
                        value={draft.intent}
                        onValueChange={(value) =>
                          setDraft((current) => (current ? { ...current, intent: value as LeadIntent } : current))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona intencion" />
                        </SelectTrigger>
                        <SelectContent>
                          {intentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select
                        value={draft.priority}
                        onValueChange={(value) =>
                          setDraft((current) => (current ? { ...current, priority: value as LeadPriority } : current))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lead-slug">Slug deseado</Label>
                      <Input
                        id="lead-slug"
                        value={draft.desiredTenantSlug}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  desiredTenantSlug: normalizeSlugInput(event.target.value),
                                }
                              : current,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead-message">Notas iniciales</Label>
                    <Textarea
                      id="lead-message"
                      rows={4}
                      value={draft.message}
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, message: event.target.value } : current))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={saveDisabled}
                      onClick={() =>
                        onUpdateLead({
                          leadId: lead.id,
                          companyName: draft.companyName || undefined,
                          fullName: draft.fullName,
                          email: draft.email,
                          phone: draft.phone || undefined,
                          intent: draft.intent,
                          priority: draft.priority,
                          source: draft.source,
                          desiredTenantSlug: slugify(draft.desiredTenantSlug) || undefined,
                          message: draft.message || undefined,
                        })
                      }
                    >
                      Guardar cambios
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setDraft(buildDraft(lead))}
                    >
                      Restaurar
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Referencia rapida</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${lead.contactEmail}`} className="text-primary hover:underline">
                        {lead.contactEmail}
                      </a>
                    </div>
                    {lead.contactPhone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${lead.contactPhone}`} className="text-foreground">
                          {lead.contactPhone}
                        </a>
                      </div>
                    )}
                    {lead.desiredTenantSlug && (
                      <div className="flex items-center gap-3 text-sm">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {lead.desiredTenantSlug}
                        </code>
                      </div>
                    )}
                    {lead.demoDate && (
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {format(new Date(lead.demoDate), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        Actualizado {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Flujo comercial</h3>

                  <div className="space-y-2">
                    <Label>Responsable</Label>
                    <div className="flex gap-2">
                      <Select value={ownerId} onValueChange={setOwnerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona responsable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Sin asignar</SelectItem>
                          {owners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => onAssignOwner(lead.id, ownerId === 'unassigned' ? null : ownerId)}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado comercial</Label>
                    <div className="flex gap-2">
                      <Select value={status} onValueChange={(value) => setStatus(value as LeadStatus)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => onUpdateStatus(lead.id, status)}
                      >
                        Actualizar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Agendar demo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={demoAt}
                        onChange={(event) => setDemoAt(event.target.value)}
                      />
                      <Button
                        variant="outline"
                        disabled={busy || !demoAt}
                        onClick={() => onScheduleDemo(lead.id, demoAt)}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {leadActivities.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay actividad registrada todavia
                  </p>
                ) : (
                  leadActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-foreground">{activity.notes}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {activity.performedBy} · {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <ScrollArea className="h-[calc(100vh-360px)]">
              <div className="space-y-4 pr-4">
                {leadActivities.filter((activity) => activity.type === 'note').length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No hay notas registradas todavia
                  </p>
                ) : (
                  leadActivities
                    .filter((activity) => activity.type === 'note')
                    .map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{activity.notes}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {activity.performedBy} · {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Agregar una nota..."
                className="resize-none"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <Button
                size="sm"
                disabled={busy || note.trim().length === 0}
                onClick={async () => {
                  const saved = await onAddNote(lead.id, note)
                  if (saved) setNote('')
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Agregar nota
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onUpdateStatus(lead.id, 'trial_pending')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar trial pendiente
            </Button>
            <Button
              size="sm"
              disabled={busy || Boolean(lead.convertedTenantId)}
              onClick={() => onProvision(lead)}
            >
              <Server className="mr-2 h-4 w-4" />
              {lead.convertedTenantId ? 'Tenant creado' : 'Provisionar tenant'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={busy || Boolean(lead.convertedTenantId)}
              onClick={() => onDelete(lead)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
