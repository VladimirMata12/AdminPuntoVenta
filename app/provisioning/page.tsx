'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout'
import { ProvisioningStatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminWorkspace } from '@/hooks/use-admin-workspace'
import type { Lead } from '@/lib/types'

type DraftProvision = {
  leadId: string
  tenantName: string
  tenantSlug: string
  adminEmail: string
  adminName: string
  branchName: string
  initialPassword: string
}

type ProvisioningSuccess = {
  tenantName: string
  tenantSlug: string
  adminEmail: string
  accessSetupMode?: 'invite' | 'manual_password'
  onboardingEmailSent: boolean
  onboardingEmailError?: string | null
  temporaryPassword?: string
  loginUrl: string
  activationEntryUrl?: string
  recoveryEntryUrl?: string
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

export default function ProvisioningPage() {
  const {
    leads,
    provisioningRequests,
    loading,
    refreshing,
    error,
    busyKey,
    refresh,
    updateLeadStatus,
    provisionLead,
  } = useAdminWorkspace()

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<DraftProvision | null>(null)
  const [successResult, setSuccessResult] = useState<ProvisioningSuccess | null>(null)

  const pendingTrialLeads = useMemo(
    () => leads.filter((lead) => lead.status === 'trial_pending' && !lead.convertedTenantId),
    [leads],
  )

  useEffect(() => {
    const leadId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('leadId')
      : null

    if (!leadId) return

    const lead = leads.find((item) => item.id === leadId)
    if (lead) {
      openProvisionDialog(lead)
    }
  }, [leads])

  const openProvisionDialog = (lead: Lead) => {
    setSelectedLead(lead)
    setDraft({
      leadId: lead.id,
      tenantName: lead.company,
      tenantSlug: lead.desiredTenantSlug || slugify(lead.company),
      adminEmail: lead.contactEmail,
      adminName: lead.contactName,
      branchName: 'Matriz',
      initialPassword: '',
    })
    setDialogOpen(true)
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
  }

  return (
    <AdminLayout
      title="Aprovisionamiento de tenants"
      description="Aprueba trials y crea nuevos tenants"
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

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pendientes de aprobar ({pendingTrialLeads.length})</TabsTrigger>
          <TabsTrigger value="provisioning">Aprovisionamiento ({provisioningRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads listos para trial</CardTitle>
              <CardDescription>
                Revisa y aprueba leads para comenzar el aprovisionamiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-sm text-muted-foreground">
                  Cargando leads listos para trial...
                </div>
              ) : pendingTrialLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">No hay aprobaciones pendientes</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Todas las solicitudes de trial ya fueron procesadas.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Slug deseado</TableHead>
                      <TableHead>Solicitado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTrialLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{lead.company}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-foreground">{lead.contactName}</p>
                            <p className="text-xs text-muted-foreground">{lead.contactEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.desiredTenantSlug ? (
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                              {lead.desiredTenantSlug}
                            </code>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin definir</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void updateLeadStatus(lead.id, 'lost')}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Rechazar
                            </Button>
                            <Button size="sm" onClick={() => openProvisionDialog(lead)}>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Aprobar y provisionar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisioning">
          <div className="grid gap-4 md:grid-cols-2">
            {provisioningRequests.map((request) => (
              <Card key={request.id} className="relative overflow-hidden">
                {request.status === 'provisioning' && (
                  <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-primary" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{request.tenantName}</CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">
                        {request.tenantSlug}
                      </CardDescription>
                    </div>
                    <ProvisioningStatusBadge status={request.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Administrador</p>
                      <p className="font-medium text-foreground">{request.adminName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Correo</p>
                      <p className="truncate font-medium text-foreground">{request.adminEmail}</p>
                    </div>
                  </div>

                  {request.status === 'success' && request.loginUrl && (
                    <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">URL de acceso</p>
                          <p className="truncate font-mono text-sm text-success">{request.loginUrl}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(request.loginUrl as string)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={request.loginUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        El acceso inicial se activa por correo. Si el correo no sale, el panel mostrara una salida manual.
                      </p>
                    </div>
                  )}

                  {(request.status === 'failed' || request.status === 'canceled') && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Aprovisionamiento fallido</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {request.errorMessage || 'Ocurrio un error inesperado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === 'provisioning' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Preparando infraestructura del tenant...</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Iniciado {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                    {request.completedAt && (
                      <span>Completado {formatDistanceToNow(new Date(request.completedAt), { addSuffix: true })}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Provisionar nuevo tenant
            </DialogTitle>
            <DialogDescription>
              Revisa los datos antes de provisionar. Esto creara un entorno aislado para el cliente.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenantName">Nombre del tenant</Label>
                  <Input
                    id="tenantName"
                    value={draft.tenantName}
                    onChange={(event) => setDraft({ ...draft, tenantName: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenantSlug">Slug del tenant</Label>
                  <Input
                    id="tenantSlug"
                    value={draft.tenantSlug}
                    onChange={(event) => setDraft({ ...draft, tenantSlug: normalizeSlugInput(event.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="adminEmail">Correo del administrador</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={draft.adminEmail}
                    onChange={(event) => setDraft({ ...draft, adminEmail: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="adminName">Nombre del administrador</Label>
                  <Input
                    id="adminName"
                    value={draft.adminName}
                    onChange={(event) => setDraft({ ...draft, adminName: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branchName">Nombre de la sucursal</Label>
                  <Input
                    id="branchName"
                    value={draft.branchName}
                    onChange={(event) => setDraft({ ...draft, branchName: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initialPassword">Contrasena inicial opcional</Label>
                  <Input
                    id="initialPassword"
                    type="text"
                    value={draft.initialPassword}
                    onChange={(event) => setDraft({ ...draft, initialPassword: event.target.value })}
                    placeholder="Deja vacio para usar invitacion por correo"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-info/20 bg-info/5 p-3">
                <p className="text-sm text-info">
                  Si dejas la contrasena vacia, el sistema enviara una invitacion para que el cliente active su acceso. Si capturas una contrasena aqui, el acceso inicial quedara bajo control manual del equipo interno.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!draft || Boolean(selectedLead && busyKey?.includes(selectedLead.id))}
              onClick={async () => {
                if (!draft) return
                const result = await provisionLead({
                  leadId: draft.leadId,
                  tenantName: draft.tenantName,
                  tenantSlug: slugify(draft.tenantSlug),
                  adminEmail: draft.adminEmail,
                  adminFullName: draft.adminName,
                  branchName: draft.branchName,
                  initialPassword: draft.initialPassword || undefined,
                })

                if (result) {
                  setSuccessResult({
                    tenantName: draft.tenantName,
                    tenantSlug: result.tenantSlug,
                    adminEmail: result.adminEmail,
                    accessSetupMode: result.accessSetupMode,
                    onboardingEmailSent: Boolean(result.onboardingEmailSent),
                    onboardingEmailError: result.onboardingEmailError,
                    temporaryPassword: result.temporaryPassword,
                    loginUrl: result.loginUrl,
                    activationEntryUrl: result.activationEntryUrl,
                    recoveryEntryUrl: result.recoveryEntryUrl,
                  })
                  setDialogOpen(false)
                  setSelectedLead(null)
                  setDraft(null)
                }
              }}
            >
              {selectedLead && busyKey?.includes(selectedLead.id) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Provisionando...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Iniciar aprovisionamiento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(successResult)} onOpenChange={(open) => !open && setSuccessResult(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Tenant creado correctamente
            </DialogTitle>
            <DialogDescription>
              El tenant ya quedo creado. Aqui ves el siguiente paso real para que el cliente active su acceso.
            </DialogDescription>
          </DialogHeader>

          {successResult && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <p className="text-sm font-medium text-success">{successResult.tenantName}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{successResult.tenantSlug}</p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>URL de acceso</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={successResult.loginUrl} className="font-mono text-xs" />
                    <Button type="button" variant="outline" onClick={() => copyToClipboard(successResult.loginUrl)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Correo</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={successResult.adminEmail} />
                    <Button type="button" variant="outline" onClick={() => copyToClipboard(successResult.adminEmail)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>

                {successResult.onboardingEmailSent ? (
                  <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                    <p className="text-sm font-medium text-success">Invitacion inicial enviada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El cliente debe abrir su correo, seguir el enlace y definir su contrasena inicial.
                    </p>
                  </div>
                ) : successResult.accessSetupMode === 'manual_password' ? (
                  <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                    <p className="text-sm font-medium text-success">Acceso inicial controlado manualmente</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El tenant se creo con una contrasena definida por el equipo interno. Comparte la URL de acceso y esta contrasena solo por un canal seguro.
                    </p>
                    {!!successResult.temporaryPassword && (
                      <div className="mt-4 grid gap-2">
                        <Label>Contrasena inicial</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={successResult.temporaryPassword} className="font-mono" />
                          <Button type="button" variant="outline" onClick={() => copyToClipboard(successResult.temporaryPassword as string)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
                    <p className="text-sm font-medium text-warning-foreground">No se pudo confirmar el envio de la invitacion</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {successResult.onboardingEmailError || 'La plataforma no pudo confirmar el envio del correo inicial.'}
                    </p>
                    {successResult.recoveryEntryUrl && (
                      <div className="mt-4 grid gap-2">
                        <Label>URL de recuperacion manual</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={successResult.recoveryEntryUrl} className="font-mono text-xs" />
                          <Button type="button" variant="outline" onClick={() => copyToClipboard(successResult.recoveryEntryUrl as string)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Si el correo inicial no llega, comparte esta URL con el cliente para que use "¿Olvidaste tu contrasena?" con su correo de administrador.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="text-sm text-warning-foreground">
                  Estado "Invitado" significa que el tenant ya fue creado y el onboarding aun no inicia. Cuando el cliente active su cuenta y defina su contrasena, el flujo debe pasar a onboarding en progreso.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {successResult && (
              <Button variant="outline" asChild>
                <a href={successResult.loginUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir app
                </a>
              </Button>
            )}
            <Button onClick={() => setSuccessResult(null)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
