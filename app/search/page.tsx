'use client'

import { Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  Mail,
  Search,
  Server,
  User,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout'
import {
  IntentBadge,
  LeadStatusBadge,
  OnboardingStatusBadge,
  ProvisioningStatusBadge,
  TenantStatusBadge,
} from '@/components/admin/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAdminWorkspace } from '@/hooks/use-admin-workspace'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const query = (searchParams.get('q') || '').trim()
  const normalizedQuery = query.toLowerCase()
  const { leads, tenants, provisioningRequests, loading, error } = useAdminWorkspace()

  const leadResults = useMemo(() => {
    if (!normalizedQuery) return []

    return leads.filter((lead) => {
      return [
        lead.company,
        lead.contactName,
        lead.contactEmail,
        lead.contactPhone || '',
        lead.desiredTenantSlug || '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [leads, normalizedQuery])

  const tenantResults = useMemo(() => {
    if (!normalizedQuery) return []

    return tenants.filter((tenant) => {
      return [
        tenant.name,
        tenant.slug,
        tenant.adminEmail,
        tenant.adminName,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [normalizedQuery, tenants])

  const provisioningResults = useMemo(() => {
    if (!normalizedQuery) return []

    return provisioningRequests.filter((request) => {
      return [
        request.tenantName,
        request.tenantSlug,
        request.adminEmail,
        request.adminName,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [normalizedQuery, provisioningRequests])

  const totalResults = leadResults.length + tenantResults.length + provisioningResults.length

  return (
    <AdminLayout
      title="Busqueda global"
      description={query ? `${totalResults} resultados para "${query}"` : 'Busca leads, tenants, provisionamientos y correos'}
    >
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            Cargando resultados...
          </CardContent>
        </Card>
      ) : !query ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-base font-medium text-foreground">Escribe algo en la barra superior</p>
              <p className="text-sm text-muted-foreground">
                Puedes buscar por empresa, contacto, correo, slug o tenant.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : totalResults === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-base font-medium text-foreground">No encontramos resultados</p>
              <p className="text-sm text-muted-foreground">
                Intenta con otra empresa, correo o slug.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-2xl font-semibold text-foreground">{leadResults.length}</p>
                <p className="text-sm text-muted-foreground">Leads encontrados</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-2xl font-semibold text-foreground">{tenantResults.length}</p>
                <p className="text-sm text-muted-foreground">Tenants encontrados</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <p className="text-2xl font-semibold text-foreground">{provisioningResults.length}</p>
                <p className="text-sm text-muted-foreground">Provisionamientos encontrados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin coincidencias en leads.</p>
              ) : (
                leadResults.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads?id=${lead.id}`}
                    className="block rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-background"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <p className="font-medium text-foreground">{lead.company}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {lead.contactName}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.contactEmail}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <LeadStatusBadge status={lead.status} />
                          <IntentBadge intent={lead.intent} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <span>Ver lead</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tenants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenantResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin coincidencias en tenants.</p>
              ) : (
                tenantResults.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/tenants?id=${tenant.id}`}
                    className="block rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-background"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-primary" />
                          <p className="font-medium text-foreground">{tenant.name}</p>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                            {tenant.slug}
                          </code>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {tenant.adminName}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {tenant.adminEmail}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <TenantStatusBadge status={tenant.status} />
                          <OnboardingStatusBadge status={tenant.onboardingStatus} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <span>Ir a tenants</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Provisionamientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {provisioningResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin coincidencias en provisionamientos.</p>
              ) : (
                provisioningResults.map((request) => (
                  <Link
                    key={request.id}
                    href={`/provisioning?leadId=${request.leadId}`}
                    className="block rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-background"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{request.tenantName}</p>
                          <p className="text-sm text-muted-foreground">{request.adminEmail}</p>
                        </div>
                        <ProvisioningStatusBadge status={request.status} />
                      </div>
                      <Separator />
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                          {request.tenantSlug}
                        </code>
                        <span className="text-primary">Abrir flujo de provisioning</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout
          title="Busqueda global"
          description="Preparando resultados..."
        >
          <Card>
            <CardContent className="p-8 text-sm text-muted-foreground">
              Cargando resultados...
            </CardContent>
          </Card>
        </AdminLayout>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
