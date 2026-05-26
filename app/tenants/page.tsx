'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  Activity,
  Building2,
  CheckCircle,
  Copy,
  DollarSign,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Pause,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout'
import { useAdminAuth } from '@/components/admin/auth-provider'
import { OnboardingStatusBadge, TenantStatusBadge } from '@/components/admin/status-badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { Tenant } from '@/lib/types'

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.punto-venta.mx').replace(/\/+$/, '')

function generateTemporaryPassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export default function TenantsPage() {
  const router = useRouter()
  const { profile } = useAdminAuth()
  const { tenants, loading, refreshing, error, refresh, busyKey, setTenantTemporaryPassword, deleteTenant } = useAdminWorkspace()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordDraft, setPasswordDraft] = useState('')
  const [passwordResult, setPasswordResult] = useState<{
    tenantName: string
    adminEmail: string
    temporaryPassword: string
    loginUrl: string
  } | null>(null)

  useEffect(() => {
    const tenantId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('id')
      : null

    if (!tenantId) return

    const tenant = tenants.find((item) => item.id === tenantId)
    if (tenant) {
      setSelectedTenant(tenant)
      setDetailOpen(true)
    }
  }, [tenants])

  useEffect(() => {
    if (!selectedTenant) return

    const updatedTenant = tenants.find((tenant) => tenant.id === selectedTenant.id)
    if (updatedTenant && updatedTenant !== selectedTenant) {
      setSelectedTenant(updatedTenant)
    }
  }, [selectedTenant, tenants])

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !tenant.name.toLowerCase().includes(searchLower) &&
          !tenant.slug.toLowerCase().includes(searchLower) &&
          !tenant.adminEmail.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      if (statusFilter !== 'all' && tenant.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [search, statusFilter, tenants])

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setDetailOpen(true)
    router.replace(`/tenants?id=${tenant.id}`)
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
  }

  const openTempPasswordDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setPasswordDraft(generateTemporaryPassword())
    setPasswordDialogOpen(true)
  }

  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length
  const totalMRR = tenants.reduce((sum, tenant) => sum + (tenant.mrr || 0), 0)
  const totalUsers = tenants.reduce((sum, tenant) => sum + (tenant.usersCount || 0), 0)
  const canSetTemporaryPassword = profile?.role === 'owner'
  const canDeleteTenant = profile?.role === 'owner'

  return (
    <AdminLayout
      title="Cuentas de tenants"
      description="Monitorea el estado operativo de tus clientes"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{tenants.length}</p>
              <p className="text-sm text-muted-foreground">Total tenants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{activeTenants}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/10 text-chart-4">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">${totalMRR.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total MRR</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total usuarios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tenants..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="suspended">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[220px]">Tenant</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[140px]">Onboarding</TableHead>
                <TableHead className="w-[100px] text-right">MRR</TableHead>
                <TableHead className="w-[80px] text-right">Usuarios</TableHead>
                <TableHead className="w-[140px]">Ultima actividad</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                    Cargando cuentas de tenants...
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building2 className="mb-2 h-8 w-8" />
                      <p className="text-sm font-medium">No se encontraron tenants</p>
                      <p className="text-xs">Prueba ajustando tu busqueda o filtros</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="cursor-pointer" onClick={() => handleSelectTenant(tenant)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-xs font-semibold">
                            {tenant.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tenant.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{tenant.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TenantStatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell>
                      <OnboardingStatusBadge status={tenant.onboardingStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-foreground">
                        ${(tenant.mrr || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tenant.usersCount || 0}
                    </TableCell>
                    <TableCell>
                      {tenant.lastActivity ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(tenant.lastActivity), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); handleSelectTenant(tenant) }}>
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => event.stopPropagation()} asChild>
                            <a href={tenant.loginUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Abrir portal
                            </a>
                          </DropdownMenuItem>
                          {canSetTemporaryPassword && (
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation()
                                openTempPasswordDialog(tenant)
                              }}
                              disabled={!tenant.adminAuthId}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Definir contrasena temporal
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(event) => event.stopPropagation()}>
                            <Mail className="mr-2 h-4 w-4" />
                            Contactar admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canDeleteTenant && (
                            <DropdownMenuItem
                              onClick={async (event) => {
                                event.stopPropagation()
                                const confirmed = window.confirm(`¿Seguro que deseas eliminar el tenant "${tenant.name}"? Esta accion eliminara usuarios y datos asociados.`)
                                if (!confirmed) return

                                const deleted = await deleteTenant(tenant.id)
                                if (deleted && selectedTenant?.id === tenant.id) {
                                  setDetailOpen(false)
                                  setSelectedTenant(null)
                                  router.replace('/tenants')
                                }
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar tenant
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(event) => event.stopPropagation()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Revisar cuenta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            router.replace('/tenants')
            setTimeout(() => setSelectedTenant(null), 200)
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-xl">
          {selectedTenant && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-lg font-bold">
                      {selectedTenant.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <SheetTitle>{selectedTenant.name}</SheetTitle>
                    <SheetDescription className="font-mono">
                      {selectedTenant.slug}.punto-venta.mx
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Resumen</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">Actividad</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Estado</span>
                          <TenantStatusBadge status={selectedTenant.status} />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Onboarding</span>
                          <OnboardingStatusBadge status={selectedTenant.onboardingStatus} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium">Metricas</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-semibold text-foreground">
                          ${(selectedTenant.mrr || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">MRR</p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-semibold text-foreground">
                          {selectedTenant.usersCount || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Usuarios</p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-semibold text-foreground">
                          {formatDistanceToNow(new Date(selectedTenant.createdAt)).replace(' ago', '')}
                        </p>
                        <p className="text-xs text-muted-foreground">Antiguedad</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-3 text-sm font-medium">Administrador</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTenant.adminName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedTenant.adminEmail}`} className="text-primary hover:underline">
                          {selectedTenant.adminEmail}
                        </a>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-3 text-sm font-medium">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Creado</span>
                        <span>{formatDistanceToNow(new Date(selectedTenant.createdAt), { addSuffix: true })}</span>
                      </div>
                      {selectedTenant.lastActivity && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Ultima actividad</span>
                          <span>{formatDistanceToNow(new Date(selectedTenant.lastActivity), { addSuffix: true })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" asChild>
                      <a href={selectedTenant.loginUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir portal del tenant
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Contactar admin
                    </Button>
                    {canSetTemporaryPassword && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!selectedTenant.adminAuthId}
                        onClick={() => openTempPasswordDialog(selectedTenant)}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Definir contrasena temporal
                      </Button>
                    )}
                    {canDeleteTenant && (
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        disabled={busyKey === `DELETE_TENANT:${selectedTenant.id}`}
                        onClick={async () => {
                          const confirmed = window.confirm(`¿Seguro que deseas eliminar el tenant "${selectedTenant.name}"? Esta accion eliminara usuarios y datos asociados.`)
                          if (!confirmed) return

                          const deleted = await deleteTenant(selectedTenant.id)
                          if (deleted) {
                            setDetailOpen(false)
                            setSelectedTenant(null)
                            router.replace('/tenants')
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {busyKey === `DELETE_TENANT:${selectedTenant.id}` ? 'Eliminando...' : 'Eliminar tenant'}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  {(selectedTenant.printerSupportLogs || []).length > 0 ? (
                    <div className="space-y-3">
                      {(selectedTenant.printerSupportLogs || []).slice(0, 12).map((log) => (
                        <Card key={log.id} className="border-destructive/20">
                          <CardContent className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <Printer className="mt-0.5 h-4 w-4 text-destructive" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {log.receiptFolio ? `Ticket ${log.receiptFolio}` : 'Error Epson'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.printerHost}:{log.printerPort || '-'} · {log.errorStage || 'sin etapa'} · {log.errorCode || 'sin codigo'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                              {log.errorMessage}
                            </p>
                            {log.recoveryUrl && (
                              <a
                                href={log.recoveryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Abrir URL Epson
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Activity className="mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Sin logs de impresora</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Los errores enviados desde el POS apareceran aqui por tenant.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Definir contrasena temporal
            </DialogTitle>
            <DialogDescription>
              Esto actualizara la contrasena del administrador principal del tenant para que puedas compartir un acceso manual.
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium text-foreground">{selectedTenant.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedTenant.adminEmail}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="temporaryPassword">Contrasena temporal</Label>
                <div className="flex gap-2">
                  <Input
                    id="temporaryPassword"
                    value={passwordDraft}
                    onChange={(event) => setPasswordDraft(event.target.value)}
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={() => setPasswordDraft(generateTemporaryPassword())}>
                    Generar
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="text-sm text-warning-foreground">
                  Usa esta salida solo para demos, correos fake o recuperacion manual. El cliente podra entrar directo con este password temporal.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!selectedTenant?.adminAuthId || passwordDraft.trim().length < 8 || busyKey === `SET_TEMP_PASSWORD:${selectedTenant?.id}`}
              onClick={async () => {
                if (!selectedTenant?.adminAuthId) return
                const result = await setTenantTemporaryPassword({
                  tenantId: selectedTenant.id,
                  adminAuthId: selectedTenant.adminAuthId,
                  password: passwordDraft.trim(),
                })

                if (result) {
                  setPasswordResult({
                    tenantName: result.tenantName,
                    adminEmail: result.adminEmail || selectedTenant.adminEmail,
                    temporaryPassword: result.temporaryPassword,
                    loginUrl: `${APP_BASE_URL}/${result.tenantSlug}/login`,
                  })
                  setPasswordDialogOpen(false)
                }
              }}
            >
              {busyKey === `SET_TEMP_PASSWORD:${selectedTenant?.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Guardar contrasena
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(passwordResult)} onOpenChange={(open) => !open && setPasswordResult(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Contrasena temporal lista
            </DialogTitle>
            <DialogDescription>
              Ya puedes compartir este acceso manual con el cliente o usarlo en tus pruebas.
            </DialogDescription>
          </DialogHeader>

          {passwordResult && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <p className="text-sm font-medium text-success">{passwordResult.tenantName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{passwordResult.adminEmail}</p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Contrasena temporal</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={passwordResult.temporaryPassword} className="font-mono" />
                    <Button type="button" variant="outline" onClick={() => copyToClipboard(passwordResult.temporaryPassword)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>URL de acceso</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={passwordResult.loginUrl} className="font-mono text-xs" />
                    <Button type="button" variant="outline" onClick={() => copyToClipboard(passwordResult.loginUrl)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {passwordResult && (
              <Button variant="outline" asChild>
                <a href={passwordResult.loginUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir login
                </a>
              </Button>
            )}
            <Button onClick={() => setPasswordResult(null)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
