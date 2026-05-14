'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw } from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout'
import { LeadDetailPanel } from '@/components/admin/lead-detail-panel'
import { LeadsFilters } from '@/components/admin/leads-filters'
import { LeadsTable } from '@/components/admin/leads-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAdminWorkspace } from '@/hooks/use-admin-workspace'
import type { Lead, LeadIntent, LeadPriority, LeadSource, LeadStatus } from '@/lib/types'

type Filters = {
  search: string
  status: LeadStatus | 'all'
  intent: LeadIntent | 'all'
  source: LeadSource | 'all'
  assignedTo: string | 'all'
}

type ManualLeadDraft = {
  companyName: string
  fullName: string
  email: string
  phone: string
  intent: LeadIntent
  priority: LeadPriority
  source: string
  desiredTenantSlug: string
  message: string
  ownerId: string
}

const defaultFilters: Filters = {
  search: '',
  status: 'all',
  intent: 'all',
  source: 'all',
  assignedTo: 'all',
}

const emptyManualLeadDraft: ManualLeadDraft = {
  companyName: '',
  fullName: '',
  email: '',
  phone: '',
  intent: 'contact',
  priority: 'normal',
  source: 'manual',
  desiredTenantSlug: '',
  message: '',
  ownerId: 'auto',
}

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

export default function LeadsPage() {
  const router = useRouter()
  const {
    leads,
    owners,
    leadActivities,
    loading,
    refreshing,
    error,
    busyKey,
    refresh,
    assignOwner,
    updateLeadStatus,
    scheduleDemo,
    addLeadNote,
    provisionLead,
    createManualLead,
    deleteLead,
    updateLead,
  } = useAdminWorkspace()

  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [manualLeadOpen, setManualLeadOpen] = useState(false)
  const [manualLead, setManualLead] = useState<ManualLeadDraft>(emptyManualLeadDraft)

  useEffect(() => {
    const leadId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('id')
      : null

    if (!leadId) return

    const lead = leads.find((item) => item.id === leadId)
    if (lead) {
      setSelectedLead(lead)
      setDetailOpen(true)
    }
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          lead.company.toLowerCase().includes(searchLower) ||
          lead.contactName.toLowerCase().includes(searchLower) ||
          lead.contactEmail.toLowerCase().includes(searchLower) ||
          (lead.desiredTenantSlug?.toLowerCase().includes(searchLower) ?? false)

        if (!matchesSearch) return false
      }

      if (filters.status !== 'all' && lead.status !== filters.status) return false
      if (filters.intent !== 'all' && lead.intent !== filters.intent) return false
      if (filters.source !== 'all' && lead.source !== filters.source) return false

      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned' && lead.assignedTo) return false
        if (filters.assignedTo !== 'unassigned' && lead.assignedTo !== filters.assignedTo) return false
      }

      return true
    })
  }, [filters, leads])

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead)
    setDetailOpen(true)
    router.replace(`/leads?id=${lead.id}`)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    router.replace('/leads')
    setTimeout(() => setSelectedLead(null), 200)
  }

  const totalLeads = leads.length
  const activeLeads = leads.filter((lead) => !['won', 'lost'].includes(lead.status)).length

  return (
    <AdminLayout
      title="Leads"
      description={`${activeLeads} leads activos · ${totalLeads} totales`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <LeadsFilters
          filters={filters}
          owners={owners}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters(defaultFilters)}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
            Limpiar vista
          </Button>
          <Button onClick={() => setManualLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Lead manual
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredLeads.length} de {totalLeads} leads
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Cargando leads comerciales...
          </CardContent>
        </Card>
      ) : (
        <LeadsTable
          leads={filteredLeads}
          onSelectLead={handleSelectLead}
          onMarkTrialPending={(lead) => void updateLeadStatus(lead.id, 'trial_pending')}
          onMarkLost={(lead) => void updateLeadStatus(lead.id, 'lost')}
          onProvisionLead={(lead) => {
            setSelectedLead(lead)
            setDetailOpen(true)
          }}
          onDeleteLead={async (lead) => {
            if (lead.convertedTenantId) return
            const confirmed = window.confirm(`¿Seguro que deseas eliminar el lead "${lead.company}"?`)
            if (!confirmed) return

            const deleted = await deleteLead(lead.id)
            if (deleted && selectedLead?.id === lead.id) {
              handleCloseDetail()
            }
          }}
        />
      )}

      <LeadDetailPanel
        lead={selectedLead}
        open={detailOpen}
        onClose={handleCloseDetail}
        owners={owners}
        activities={leadActivities}
        busy={Boolean(
          selectedLead &&
          (busyKey?.includes(selectedLead.id) ||
            busyKey?.includes(`DELETE:${selectedLead.id}`) ||
            busyKey?.includes(`UPDATE_LEAD:${selectedLead.id}`)),
        )}
        onAssignOwner={assignOwner}
        onUpdateStatus={updateLeadStatus}
        onScheduleDemo={scheduleDemo}
        onAddNote={addLeadNote}
        onUpdateLead={updateLead}
        onProvision={async (lead) => {
          await provisionLead({
            leadId: lead.id,
            tenantName: lead.company,
            tenantSlug: lead.desiredTenantSlug || undefined,
            adminEmail: lead.contactEmail,
            adminFullName: lead.contactName,
          })
          setDetailOpen(false)
        }}
        onDelete={async (lead) => {
          const confirmed = window.confirm(`¿Seguro que deseas eliminar el lead "${lead.company}"?`)
          if (!confirmed) return
          const deleted = await deleteLead(lead.id)
          if (deleted) {
            handleCloseDetail()
          }
        }}
      />

      <Dialog open={manualLeadOpen} onOpenChange={setManualLeadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear lead manual</DialogTitle>
            <DialogDescription>
              Registra un lead nuevo directamente desde el CRM interno.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input
                id="companyName"
                value={manualLead.companyName}
                onChange={(event) => setManualLead((current) => ({
                  ...current,
                  companyName: event.target.value,
                  desiredTenantSlug: current.desiredTenantSlug || slugify(event.target.value),
                }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre del contacto</Label>
              <Input
                id="fullName"
                value={manualLead.fullName}
                onChange={(event) => setManualLead((current) => ({ ...current, fullName: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={manualLead.email}
                onChange={(event) => setManualLead((current) => ({ ...current, email: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={manualLead.phone}
                onChange={(event) => setManualLead((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Intencion</Label>
              <Select
                value={manualLead.intent}
                onValueChange={(value) => setManualLead((current) => ({ ...current, intent: value as LeadIntent }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contacto</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="trial">Prueba</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Select
                value={manualLead.priority}
                onValueChange={(value) => setManualLead((current) => ({ ...current, priority: value as LeadPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desiredTenantSlug">Slug deseado</Label>
              <Input
                id="desiredTenantSlug"
                value={manualLead.desiredTenantSlug}
                onChange={(event) => setManualLead((current) => ({ ...current, desiredTenantSlug: normalizeSlugInput(event.target.value) }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Responsable</Label>
              <Select
                value={manualLead.ownerId}
                onValueChange={(value) => setManualLead((current) => ({ ...current, ownerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Asignarme automaticamente</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="message">Notas iniciales</Label>
              <Textarea
                id="message"
                rows={4}
                value={manualLead.message}
                onChange={(event) => setManualLead((current) => ({ ...current, message: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManualLeadOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={busyKey === 'CREATE_LEAD'}
              onClick={async () => {
                const leadId = await createManualLead({
                  companyName: manualLead.companyName || undefined,
                  fullName: manualLead.fullName,
                  email: manualLead.email,
                  phone: manualLead.phone || undefined,
                  intent: manualLead.intent,
                  priority: manualLead.priority,
                  source: manualLead.source,
                  desiredTenantSlug: slugify(manualLead.desiredTenantSlug) || undefined,
                  message: manualLead.message || undefined,
                  ownerId: manualLead.ownerId === 'auto' ? undefined : manualLead.ownerId,
                })

                if (leadId) {
                  setManualLeadOpen(false)
                  setManualLead(emptyManualLeadDraft)
                  router.replace(`/leads?id=${leadId}`)
                }
              }}
            >
              Crear lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
