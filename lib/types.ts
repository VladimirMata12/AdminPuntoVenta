import type { PlatformAdminProfile } from '@/components/admin/auth-provider'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'trial_pending'
  | 'won'
  | 'lost'

export type LeadIntent = 'contact' | 'demo' | 'trial'
export type LeadPriority = 'low' | 'normal' | 'high'
export type LeadSource = string

export type OnboardingStatus =
  | 'not_started'
  | 'invited'
  | 'in_progress'
  | 'completed'
  | 'blocked'

export type OnboardingStep =
  | 'welcome'
  | 'fiscal_profile'
  | 'branch_setup'
  | 'warehouse_setup'
  | 'users'
  | 'branding'
  | 'completed'
  | string

export type ProvisioningJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceled'

export type ProvisioningStatus = 'pending' | 'provisioning' | 'success' | 'failed' | 'canceled'

export type LeadActivityType =
  | 'created'
  | 'note'
  | 'status_changed'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'trial_requested'
  | 'trial_approved'
  | 'trial_rejected'
  | 'tenant_provision_started'
  | 'tenant_provision_completed'
  | 'onboarding_progress'

export interface Lead {
  id: string
  company: string
  contactName: string
  contactEmail: string
  contactPhone?: string | null
  status: LeadStatus
  intent: LeadIntent
  priority: LeadPriority
  source: LeadSource
  assignedTo?: string | null
  assignedOwnerName?: string | null
  desiredTenantSlug?: string | null
  demoDate?: string | null
  lastContactedAt?: string | null
  qualifiedAt?: string | null
  onboardingStatus: OnboardingStatus
  convertedTenantId?: string | null
  convertedAt?: string | null
  businessType?: string | null
  teamSize?: string | null
  interestArea?: string | null
  message?: string | null
  notes?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface LeadActivity {
  id: string
  leadId: string
  type: LeadActivityType
  notes?: string | null
  payload?: Record<string, unknown>
  performedBy: string
  createdAt: string
}

export interface ProvisioningRequest {
  id: string
  leadId: string
  tenantName: string
  tenantSlug: string
  adminEmail: string
  adminName: string
  status: ProvisioningStatus
  loginUrl?: string
  errorMessage?: string | null
  createdAt: string
  completedAt?: string | null
}

export interface PrinterSupportLog {
  id: string
  tenantId: string
  source: 'pos' | 'ventas' | 'settings' | 'admin' | 'unknown'
  severity: 'info' | 'warning' | 'error'
  printerType: 'epson' | 'generica' | 'unknown'
  printerHost?: string | null
  printerPort?: number | null
  deviceId?: string | null
  receiptFolio?: string | null
  errorStage?: string | null
  errorCode?: string | null
  errorMessage: string
  recoveryUrl?: string | null
  diagnostics: Record<string, unknown>
  userAgent?: string | null
  pageUrl?: string | null
  createdAt: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  adminAuthId?: string | null
  adminEmail: string
  adminName: string
  status: 'active' | 'inactive' | 'suspended'
  onboardingStatus: OnboardingStatus
  currentStep: OnboardingStep
  loginUrl: string
  createdAt: string
  lastActivity?: string
  mrr?: number
  usersCount?: number
  leadId?: string | null
  printerSupportLogs?: PrinterSupportLog[]
}

export interface DashboardStats {
  newLeads: number
  demosScheduled: number
  trialsPending: number
  tenantsProvisioned: number
  onboardingInProgress: number
  conversionRate: number
}

export interface AttentionItem {
  id: string
  type: 'trial_pending' | 'demo_today' | 'unassigned' | 'provisioning_failed'
  title: string
  description: string
  link: string
  urgent?: boolean
}

export interface DashboardChartPoint {
  date: string
  leads: number
  demos: number
  conversions: number
}

export interface DashboardFunnelPoint {
  stage: string
  count: number
  fill: string
}

export interface AdminWorkspaceData {
  owners: PlatformAdminProfile[]
  leads: Lead[]
  leadActivities: LeadActivity[]
  provisioningRequests: ProvisioningRequest[]
  tenants: Tenant[]
  printerSupportLogs: PrinterSupportLog[]
  dashboardStats: DashboardStats
  leadsOverTimeData: DashboardChartPoint[]
  conversionFunnelData: DashboardFunnelPoint[]
  attentionItems: AttentionItem[]
}
