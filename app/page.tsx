'use client'

import { Calendar, Clock, RefreshCw, Rocket, Server, TrendingUp, Users } from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout'
import { ActivityFeed } from '@/components/admin/activity-feed'
import { FunnelChart, LeadsChart } from '@/components/admin/dashboard-charts'
import { KPICard } from '@/components/admin/kpi-card'
import { NeedsAttention } from '@/components/admin/needs-attention'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminWorkspace } from '@/hooks/use-admin-workspace'

export default function DashboardPage() {
  const {
    dashboardStats,
    leadsOverTimeData,
    conversionFunnelData,
    attentionItems,
    leadActivities,
    leads,
    loading,
    refreshing,
    error,
    refresh,
  } = useAdminWorkspace()

  return (
    <AdminLayout
      title="Inicio"
      description="Resumen comercial y operativo de la plataforma"
    >
      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard title="Nuevos leads" value={dashboardStats.newLeads} icon={<Users className="h-5 w-5" />} />
        <KPICard title="Demos agendadas" value={dashboardStats.demosScheduled} icon={<Calendar className="h-5 w-5" />} />
        <KPICard title="Trials pendientes" value={dashboardStats.trialsPending} icon={<Clock className="h-5 w-5" />} />
        <KPICard title="Tenants creados" value={dashboardStats.tenantsProvisioned} icon={<Server className="h-5 w-5" />} />
        <KPICard title="Onboarding activo" value={dashboardStats.onboardingInProgress} icon={<Rocket className="h-5 w-5" />} />
        <KPICard title="Conversion" value={`${dashboardStats.conversionRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Cargando indicadores comerciales...
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <LeadsChart data={leadsOverTimeData} />
            <FunnelChart data={conversionFunnelData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <NeedsAttention items={attentionItems} />
            <ActivityFeed activities={leadActivities.slice(0, 20)} leads={leads} />
          </div>
        </>
      )}
    </AdminLayout>
  )
}
