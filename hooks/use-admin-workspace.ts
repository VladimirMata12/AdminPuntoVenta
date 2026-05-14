'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDays,
  eachWeekOfInterval,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { toast } from 'sonner'
import { useAdminAuth, type PlatformAdminProfile } from '@/components/admin/auth-provider'
import { supabase } from '@/lib/supabase'
import type {
  AdminWorkspaceData,
  AttentionItem,
  DashboardChartPoint,
  DashboardFunnelPoint,
  DashboardStats,
  Lead,
  LeadActivity,
  LeadActivityType,
  LeadIntent,
  LeadPriority,
  LeadStatus,
  OnboardingStatus,
  OnboardingStep,
  ProvisioningRequest,
  ProvisioningStatus,
  Tenant,
} from '@/lib/types'

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.punto-venta.mx').replace(/\/+$/, '')

type TenantStatus = Tenant['status']

interface RawPlatformAdmin {
  id: string
  auth_id: string
  email: string
  full_name: string
  role: PlatformAdminProfile['role']
  is_active: boolean
}

interface RawLead {
  id: string
  intent: LeadIntent
  status: LeadStatus
  source: string
  full_name: string
  email: string
  phone?: string | null
  company_name?: string | null
  business_type?: string | null
  team_size?: string | null
  interest_area?: string | null
  message?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  assigned_platform_admin_id?: string | null
  desired_tenant_slug?: string | null
  demo_scheduled_at?: string | null
  last_contacted_at?: string | null
  qualified_at?: string | null
  converted_at?: string | null
  converted_tenant_id?: string | null
  onboarding_status?: OnboardingStatus | null
  priority?: LeadPriority | null
}

interface RawLeadActivity {
  id: string
  lead_id: string
  platform_admin_id?: string | null
  activity_type: LeadActivityType
  activity_at?: string
  created_at?: string
  notes?: string | null
  payload?: Record<string, unknown> | null
}

interface RawProvisioningJob {
  id: string
  lead_id: string
  tenant_id?: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
  error_message?: string | null
  payload?: Record<string, unknown> | null
  created_at: string
  finished_at?: string | null
}

interface RawTenant {
  id: string
  name: string
  slug: string
  created_at: string
}

interface RawOnboardingSession {
  id: string
  tenant_id: string
  lead_id?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  current_step?: string | null
  completed_steps?: string[] | null
  created_at: string
  updated_at: string
}

interface RawTenantUser {
  id: string
  auth_id: string
  tenant_id: string
  full_name?: string | null
  email?: string | null
  role?: string | null
  is_active?: boolean | null
  created_at: string
  updated_at?: string | null
}

interface AdminWorkspacePayload {
  platform_admins: RawPlatformAdmin[]
  leads: RawLead[]
  lead_activities: RawLeadActivity[]
  provisioning_jobs: RawProvisioningJob[]
  tenants: RawTenant[]
  onboarding_sessions: RawOnboardingSession[]
  tenant_users: RawTenantUser[]
}

interface ProvisionLeadInput {
  leadId: string
  tenantName?: string
  tenantSlug?: string
  adminEmail?: string
  adminFullName?: string
  branchName?: string
  initialPassword?: string
}

interface ProvisionLeadResult {
  tenantId: string
  tenantSlug: string
  loginUrl: string
  activationEntryUrl?: string
  recoveryEntryUrl?: string
  adminEmail: string
  temporaryPassword?: string
  accessSetupMode?: 'invite' | 'manual_password'
  onboardingEmailSent?: boolean
  onboardingEmailError?: string | null
}

interface LeadActionInput {
  leadId: string
  ownerId?: string | null
  status?: LeadStatus
  note?: string
  demoAt?: string
}

interface CreateManualLeadInput {
  companyName?: string
  fullName: string
  email: string
  phone?: string
  intent: LeadIntent
  priority: LeadPriority
  source?: string
  desiredTenantSlug?: string
  message?: string
  ownerId?: string | null
}

interface UpdateLeadInput {
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
}

interface SetTenantTempPasswordInput {
  tenantId: string
  adminAuthId: string
  password?: string
}

interface SetTenantTempPasswordResult {
  tenantId: string
  tenantName: string
  tenantSlug: string
  adminEmail?: string | null
  temporaryPassword: string
}

interface DeleteTenantResult {
  tenantId: string
  tenantName: string
  tenantSlug: string
}

const emptyWorkspaceData: AdminWorkspaceData = {
  owners: [],
  leads: [],
  leadActivities: [],
  provisioningRequests: [],
  tenants: [],
  dashboardStats: {
    newLeads: 0,
    demosScheduled: 0,
    trialsPending: 0,
    tenantsProvisioned: 0,
    onboardingInProgress: 0,
    conversionRate: 0,
  },
  leadsOverTimeData: [],
  conversionFunnelData: [],
  attentionItems: [],
}

async function extractFunctionErrorMessage(err: unknown, fallbackMessage: string): Promise<string> {
  if (err && typeof err === 'object' && 'context' in err) {
    const maybeContext = (err as { context?: unknown }).context
    if (maybeContext instanceof Response) {
      try {
        const payload = await maybeContext.clone().json() as { error?: string; message?: string }
        if (payload?.error) return payload.error
        if (payload?.message) return payload.message
      } catch {
        try {
          const text = await maybeContext.clone().text()
          if (text.trim().length > 0) return text.trim()
        } catch {
          // ignore parse failures and fall through to generic handling
        }
      }
    }
  }

  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }

  return fallbackMessage
}

function normalizeProvisioningStatus(status: RawProvisioningJob['status']): ProvisioningStatus {
  if (status === 'running') return 'provisioning'
  if (status === 'completed') return 'success'
  if (status === 'canceled') return 'canceled'
  return status
}

function normalizeOnboardingStatus(
  leadStatus?: OnboardingStatus | null,
  sessionStatus?: RawOnboardingSession['status'],
): OnboardingStatus {
  switch (sessionStatus) {
    case 'pending':
      return 'invited'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'blocked':
      return 'blocked'
    default:
      break
  }

  if (leadStatus && ['not_started', 'invited', 'in_progress', 'completed', 'blocked'].includes(leadStatus)) {
    return leadStatus
  }

  return 'not_started'
}

function deriveTenantStatus(onboardingStatus: OnboardingStatus): TenantStatus {
  if (onboardingStatus === 'blocked') return 'suspended'
  if (onboardingStatus === 'not_started' || onboardingStatus === 'invited') return 'inactive'
  return 'active'
}

function buildActivityDescription(activity: LeadActivity): string {
  const note = activity.notes?.trim()
  const payload = activity.payload ?? {}

  switch (activity.type) {
    case 'created':
      return note || 'Lead captado desde el landing comercial.'
    case 'note':
      return note || 'Se agrego una nota interna.'
    case 'status_changed':
      return note || `Status actualizado a ${String(payload.status || 'nuevo estado')}.`
    case 'demo_scheduled':
      return note || `Demo programada para ${String(payload.demo_at || 'fecha pendiente')}.`
    case 'demo_completed':
      return note || 'Demo completada.'
    case 'trial_requested':
      return note || 'Lead marcado para trial.'
    case 'trial_approved':
      return note || 'Trial aprobado.'
    case 'trial_rejected':
      return note || 'Trial rechazado.'
    case 'tenant_provision_started':
      return note || 'Provision de tenant iniciada.'
    case 'tenant_provision_completed':
      return note || 'Tenant provisionado correctamente.'
    case 'onboarding_progress':
      return note || 'Onboarding actualizado.'
    default:
      return note || 'Actividad registrada.'
  }
}

function buildChartData(leads: Lead[]): DashboardChartPoint[] {
  const intervalStart = startOfWeek(subWeeks(new Date(), 5), { weekStartsOn: 1 })
  const intervalEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const weeklyBuckets = eachWeekOfInterval({
    start: intervalStart,
    end: intervalEnd,
  }, { weekStartsOn: 1 }).map((weekStart) => ({
    date: format(weekStart, 'MMM d'),
    start: weekStart,
    end: addDays(weekStart, 7),
    leads: 0,
    demos: 0,
    conversions: 0,
  }))

  const assignToBucket = (isoDate: string | null | undefined, key: 'leads' | 'demos' | 'conversions') => {
    if (!isoDate) return
    const date = parseISO(isoDate)
    const bucket = weeklyBuckets.find((item) => date >= item.start && date < item.end)
    if (bucket) {
      bucket[key] += 1
    }
  }

  leads.forEach((lead) => {
    assignToBucket(lead.createdAt, 'leads')
    assignToBucket(lead.demoDate, 'demos')
    assignToBucket(lead.convertedAt, 'conversions')
  })

  return weeklyBuckets.map(({ date, leads: totalLeads, demos, conversions }) => ({
    date,
    leads: totalLeads,
    demos,
    conversions,
  }))
}

function buildFunnelData(leads: Lead[]): DashboardFunnelPoint[] {
  const total = leads.length
  const qualified = leads.filter((lead) => ['qualified', 'demo_scheduled', 'trial_pending', 'won'].includes(lead.status)).length
  const demos = leads.filter((lead) => ['demo_scheduled', 'trial_pending', 'won'].includes(lead.status)).length
  const trials = leads.filter((lead) => ['trial_pending', 'won'].includes(lead.status)).length
  const converted = leads.filter((lead) => lead.status === 'won').length

  return [
    { stage: 'Leads', count: total, fill: 'var(--chart-1)' },
    { stage: 'Qualified', count: qualified, fill: 'var(--chart-2)' },
    { stage: 'Demo', count: demos, fill: 'var(--chart-3)' },
    { stage: 'Trial', count: trials, fill: 'var(--chart-4)' },
    { stage: 'Won', count: converted, fill: 'var(--chart-5)' },
  ]
}

function buildDashboardStats(leads: Lead[], tenants: Tenant[]): DashboardStats {
  const totalLeads = leads.length || 1
  const converted = leads.filter((lead) => lead.status === 'won').length

  return {
    newLeads: leads.filter((lead) => lead.status === 'new').length,
    demosScheduled: leads.filter((lead) => lead.status === 'demo_scheduled').length,
    trialsPending: leads.filter((lead) => lead.status === 'trial_pending').length,
    tenantsProvisioned: tenants.length,
    onboardingInProgress: tenants.filter((tenant) => tenant.onboardingStatus === 'in_progress').length,
    conversionRate: Number(((converted / totalLeads) * 100).toFixed(1)),
  }
}

function buildAttentionItems(leads: Lead[], provisioningRequests: ProvisioningRequest[]): AttentionItem[] {
  const items: AttentionItem[] = []

  const demosToday = leads.filter((lead) => lead.demoDate && isToday(parseISO(lead.demoDate)))
  const unassigned = leads.filter((lead) => !lead.assignedTo && ['new', 'contacted', 'qualified', 'demo_scheduled', 'trial_pending'].includes(lead.status))
  const trialsPending = leads.filter((lead) => lead.status === 'trial_pending' && !lead.convertedTenantId)
  const failedProvisioning = provisioningRequests.filter((job) => job.status === 'failed' || job.status === 'canceled')

  demosToday.slice(0, 2).forEach((lead) => {
    items.push({
      id: `demo-${lead.id}`,
      type: 'demo_today',
      title: lead.company,
      description: `Demo programada para hoy a las ${format(parseISO(lead.demoDate as string), 'HH:mm')}.`,
      link: `/leads?id=${lead.id}`,
    })
  })

  trialsPending.slice(0, 2).forEach((lead) => {
    items.push({
      id: `trial-${lead.id}`,
      type: 'trial_pending',
      title: lead.company,
      description: 'Lead listo para aprobar y provisionar tenant.',
      link: `/provisioning?leadId=${lead.id}`,
      urgent: true,
    })
  })

  unassigned.slice(0, 2).forEach((lead) => {
    items.push({
      id: `owner-${lead.id}`,
      type: 'unassigned',
      title: lead.company,
      description: 'Lead sin responsable asignado en el pipeline.',
      link: `/leads?id=${lead.id}`,
    })
  })

  failedProvisioning.slice(0, 2).forEach((job) => {
    items.push({
      id: `prov-${job.id}`,
      type: 'provisioning_failed',
      title: job.tenantName,
      description: job.errorMessage || 'Provision fallida, requiere revision.',
      link: `/provisioning`,
      urgent: true,
    })
  })

  return items.slice(0, 6)
}

function mapWorkspaceData(payload: AdminWorkspacePayload): AdminWorkspaceData {
  const owners = (payload.platform_admins || []).map<PlatformAdminProfile>((owner) => ({
    id: String(owner.id),
    authId: String(owner.auth_id),
    email: String(owner.email),
    fullName: String(owner.full_name),
    role: owner.role,
    isActive: Boolean(owner.is_active),
  }))

  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]))
  const rawTenantMap = new Map((payload.tenants || []).map((tenant) => [tenant.id, tenant]))
  const onboardingByTenant = new Map((payload.onboarding_sessions || []).map((session) => [session.tenant_id, session]))
  const usersByTenant = new Map<string, RawTenantUser[]>()

  for (const user of payload.tenant_users || []) {
    const current = usersByTenant.get(user.tenant_id) || []
    current.push(user)
    usersByTenant.set(user.tenant_id, current)
  }

  const leads = (payload.leads || []).map<Lead>((lead) => ({
    id: String(lead.id),
    company: String(lead.company_name || lead.full_name || 'Lead sin empresa'),
    contactName: String(lead.full_name || 'Sin nombre'),
    contactEmail: String(lead.email || 'sin-correo'),
    contactPhone: lead.phone || null,
    status: lead.status,
    intent: lead.intent,
    priority: lead.priority || 'normal',
    source: lead.source || 'website',
    assignedTo: lead.assigned_platform_admin_id || null,
    assignedOwnerName: lead.assigned_platform_admin_id ? ownerMap.get(lead.assigned_platform_admin_id)?.fullName || null : null,
    desiredTenantSlug: lead.desired_tenant_slug || null,
    demoDate: lead.demo_scheduled_at || null,
    lastContactedAt: lead.last_contacted_at || null,
    qualifiedAt: lead.qualified_at || null,
    onboardingStatus: normalizeOnboardingStatus(lead.onboarding_status),
    convertedTenantId: lead.converted_tenant_id || null,
    convertedAt: lead.converted_at || null,
    businessType: lead.business_type || null,
    teamSize: lead.team_size || null,
    interestArea: lead.interest_area || null,
    message: lead.message || null,
    metadata: lead.metadata || {},
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }))

  const leadsById = new Map(leads.map((lead) => [lead.id, lead]))
  const leadByTenantId = new Map(leads.filter((lead) => lead.convertedTenantId).map((lead) => [lead.convertedTenantId as string, lead]))

  const leadActivities = (payload.lead_activities || []).map<LeadActivity>((activity) => {
    const owner = activity.platform_admin_id ? ownerMap.get(activity.platform_admin_id) : null
    return {
      id: String(activity.id),
      leadId: String(activity.lead_id),
      type: activity.activity_type,
      notes: activity.notes || null,
      payload: activity.payload || {},
      performedBy: owner?.fullName || 'Sistema',
      createdAt: activity.activity_at || activity.created_at || new Date().toISOString(),
    }
  })

  const provisioningRequests = (payload.provisioning_jobs || []).map<ProvisioningRequest>((job) => {
    const lead = leadsById.get(job.lead_id)
    const payloadData = job.payload || {}
    return {
      id: String(job.id),
      leadId: String(job.lead_id),
      tenantName: String(payloadData.tenant_name || lead?.company || 'Tenant pendiente'),
      tenantSlug: String(payloadData.preferred_slug || lead?.desiredTenantSlug || 'tenant'),
      adminEmail: String(payloadData.admin_email || lead?.contactEmail || 'sin-correo'),
      adminName: String(lead?.contactName || 'Sin administrador'),
      status: normalizeProvisioningStatus(job.status),
      loginUrl: job.tenant_id
        ? `${APP_BASE_URL}/${String(rawTenantMap.get(job.tenant_id)?.slug || payloadData.preferred_slug || lead?.desiredTenantSlug || 'tenant')}/login`
        : undefined,
      errorMessage: job.error_message || null,
      createdAt: job.created_at,
      completedAt: job.finished_at || null,
    }
  })

  const tenants = (payload.tenants || []).map<Tenant>((tenant) => {
    const onboarding = onboardingByTenant.get(tenant.id)
    const sourceLead = leadByTenantId.get(tenant.id)
    const tenantUsers = usersByTenant.get(tenant.id) || []
    const adminUser = tenantUsers.find((user) => user.role === 'admin') || tenantUsers[0]
    const onboardingStatus = normalizeOnboardingStatus(sourceLead?.onboardingStatus, onboarding?.status)

    return {
      id: String(tenant.id),
      name: String(tenant.name),
      slug: String(tenant.slug),
      adminEmail: String(adminUser?.email || sourceLead?.contactEmail || 'sin-correo'),
      adminName: String(adminUser?.full_name || sourceLead?.contactName || 'Sin administrador'),
      adminAuthId: adminUser?.auth_id || null,
      status: deriveTenantStatus(onboardingStatus),
      onboardingStatus,
      currentStep: (onboarding?.current_step || 'welcome') as OnboardingStep,
      loginUrl: `${APP_BASE_URL}/${tenant.slug}/login`,
      createdAt: tenant.created_at,
      lastActivity: onboarding?.updated_at || adminUser?.updated_at || sourceLead?.updatedAt || tenant.created_at,
      mrr: 0,
      usersCount: tenantUsers.length,
      leadId: sourceLead?.id || onboarding?.lead_id || null,
    }
  })

  const dashboardStats = buildDashboardStats(leads, tenants)
  const leadsOverTimeData = buildChartData(leads)
  const conversionFunnelData = buildFunnelData(leads)
  const attentionItems = buildAttentionItems(leads, provisioningRequests)

  return {
    owners,
    leads,
    leadActivities,
    provisioningRequests,
    tenants,
    dashboardStats,
    leadsOverTimeData,
    conversionFunnelData,
    attentionItems,
  }
}

export function useAdminWorkspace() {
  const { session, profile } = useAdminAuth()
  const [workspace, setWorkspace] = useState<AdminWorkspaceData>(emptyWorkspaceData)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const fetchWorkspace = useCallback(async (options?: { silent?: boolean }) => {
    if (!session || !profile) {
      setWorkspace(emptyWorkspaceData)
      setLoading(false)
      return
    }

    if (options?.silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const { data, error: functionError } = await supabase.functions.invoke<AdminWorkspacePayload>('admin-workspace')
      if (functionError) {
        throw functionError
      }

      setWorkspace(mapWorkspaceData(data as AdminWorkspacePayload))
      setError(null)
    } catch (err) {
      console.error('[AdminWorkspace] fetch failed', err)
      setError('No se pudo cargar el workspace administrativo.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile, session])

  useEffect(() => {
    void fetchWorkspace()
  }, [fetchWorkspace])

  const invokeLeadAction = useCallback(async (action: string, payload: LeadActionInput, successMessage: string) => {
    setBusyKey(`${action}:${payload.leadId}`)
    try {
      const { error: functionError } = await supabase.functions.invoke('admin-lead-action', {
        body: { action, payload },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success(successMessage)
      return true
    } catch (err: unknown) {
      const message = await extractFunctionErrorMessage(err, 'No se pudo completar la accion.')
      toast.error(message)
      return false
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const assignOwner = useCallback(async (leadId: string, ownerId?: string | null) => {
    return invokeLeadAction(
      'ASSIGN_OWNER',
      { leadId, ownerId: ownerId || null },
      ownerId ? 'Responsable asignado.' : 'Lead marcado como sin responsable.',
    )
  }, [invokeLeadAction])

  const updateLeadStatus = useCallback(async (leadId: string, status: LeadStatus, note?: string) => {
    return invokeLeadAction(
      'UPDATE_STATUS',
      { leadId, status, note },
      'Status actualizado correctamente.',
    )
  }, [invokeLeadAction])

  const scheduleDemo = useCallback(async (leadId: string, demoAt: string, note?: string) => {
    return invokeLeadAction(
      'SCHEDULE_DEMO',
      { leadId, demoAt: new Date(demoAt).toISOString(), note },
      'Demo programada correctamente.',
    )
  }, [invokeLeadAction])

  const addLeadNote = useCallback(async (leadId: string, note: string) => {
    return invokeLeadAction(
      'ADD_NOTE',
      { leadId, note },
      'Nota agregada al lead.',
    )
  }, [invokeLeadAction])

  const provisionLead = useCallback(async (input: ProvisionLeadInput): Promise<ProvisionLeadResult | null> => {
    setBusyKey(`PROVISION:${input.leadId}`)
    try {
      const { data, error: functionError } = await supabase.functions.invoke<ProvisionLeadResult>('provision-tenant-from-lead', {
        body: { payload: input },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success('Tenant provisionado correctamente.')
      return data || null
    } catch (err: unknown) {
      await fetchWorkspace({ silent: true })
      const message = await extractFunctionErrorMessage(err, 'No se pudo provisionar el tenant.')
      toast.error(message)
      return null
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const createManualLead = useCallback(async (input: CreateManualLeadInput): Promise<string | null> => {
    setBusyKey('CREATE_LEAD')
    try {
      const { data, error: functionError } = await supabase.functions.invoke<{ success: boolean; leadId: string }>('admin-lead-action', {
        body: {
          action: 'CREATE_LEAD',
          payload: input,
        },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success('Lead manual creado correctamente.')
      return data?.leadId || null
    } catch (err: unknown) {
      const message = await extractFunctionErrorMessage(err, 'No se pudo crear el lead manual.')
      toast.error(message)
      return null
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const deleteLead = useCallback(async (leadId: string): Promise<boolean> => {
    setBusyKey(`DELETE:${leadId}`)
    try {
      const { error: functionError } = await supabase.functions.invoke('admin-lead-action', {
        body: {
          action: 'DELETE_LEAD',
          payload: { leadId },
        },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success('Lead eliminado correctamente.')
      return true
    } catch (err: unknown) {
      const message = await extractFunctionErrorMessage(err, 'No se pudo eliminar el lead.')
      toast.error(message)
      return false
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const updateLead = useCallback(async (input: UpdateLeadInput): Promise<boolean> => {
    setBusyKey(`UPDATE_LEAD:${input.leadId}`)
    try {
      const { error: functionError } = await supabase.functions.invoke('admin-lead-action', {
        body: {
          action: 'UPDATE_LEAD',
          payload: input,
        },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success('Lead actualizado correctamente.')
      return true
    } catch (err: unknown) {
      const message = await extractFunctionErrorMessage(err, 'No se pudo actualizar el lead.')
      toast.error(message)
      return false
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const setTenantTemporaryPassword = useCallback(async (
    input: SetTenantTempPasswordInput,
  ): Promise<SetTenantTempPasswordResult | null> => {
    setBusyKey(`SET_TEMP_PASSWORD:${input.tenantId}`)
    try {
      const { data, error: functionError } = await supabase.functions.invoke<SetTenantTempPasswordResult>('admin-lead-action', {
        body: {
          action: 'SET_TEMP_PASSWORD',
          payload: {
            tenantId: input.tenantId,
            adminAuthId: input.adminAuthId,
            password: input.password,
          },
        },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success('Contrasena temporal definida correctamente.')
      return data || null
    } catch (err: unknown) {
      const message = await extractFunctionErrorMessage(err, 'No se pudo definir la contrasena temporal.')
      toast.error(message)
      return null
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const deleteTenant = useCallback(async (tenantId: string): Promise<DeleteTenantResult | null> => {
    setBusyKey(`DELETE_TENANT:${tenantId}`)
    try {
      const { data, error: functionError } = await supabase.functions.invoke<DeleteTenantResult>('admin-lead-action', {
        body: {
          action: 'DELETE_TENANT',
          payload: { tenantId },
        },
      })

      if (functionError) {
        throw functionError
      }

      await fetchWorkspace({ silent: true })
      toast.success('Tenant eliminado correctamente.')
      return data || null
    } catch (err: unknown) {
      const message = await extractFunctionErrorMessage(err, 'No se pudo eliminar el tenant.')
      toast.error(message)
      return null
    } finally {
      setBusyKey(null)
    }
  }, [fetchWorkspace])

  const recentActivities = useMemo(() => {
    return workspace.leadActivities
      .slice()
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
      .map((activity) => ({
        ...activity,
        notes: buildActivityDescription(activity),
      }))
  }, [workspace.leadActivities])

  return {
    ...workspace,
    leadActivities: recentActivities,
    loading,
    refreshing,
    error,
    busyKey,
    refresh: fetchWorkspace,
    assignOwner,
    updateLeadStatus,
    scheduleDemo,
    addLeadNote,
    provisionLead,
    createManualLead,
    deleteLead,
    updateLead,
    setTenantTemporaryPassword,
    deleteTenant,
  }
}
