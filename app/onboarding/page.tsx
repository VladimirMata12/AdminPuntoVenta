'use client'

import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Palette,
  Rocket,
  Store,
  User,
  Users,
  Warehouse,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout'
import { OnboardingStatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAdminWorkspace } from '@/hooks/use-admin-workspace'
import type { OnboardingStep, Tenant } from '@/lib/types'

const onboardingSteps: { step: OnboardingStep; label: string; icon: typeof User }[] = [
  { step: 'welcome', label: 'Bienvenida', icon: User },
  { step: 'fiscal_profile', label: 'Perfil fiscal', icon: Building2 },
  { step: 'branch_setup', label: 'Sucursal', icon: Store },
  { step: 'warehouse_setup', label: 'Almacen', icon: Warehouse },
  { step: 'users', label: 'Usuarios', icon: Users },
  { step: 'branding', label: 'Branding', icon: Palette },
  { step: 'completed', label: 'Salida a produccion', icon: Rocket },
]

function getStepProgress(currentStep: OnboardingStep) {
  const index = onboardingSteps.findIndex((step) => step.step === currentStep)
  const safeIndex = index >= 0 ? index : 0
  return Math.round(((safeIndex + 1) / onboardingSteps.length) * 100)
}

function getCompletedSteps(currentStep: OnboardingStep) {
  const index = onboardingSteps.findIndex((step) => step.step === currentStep)
  return index >= 0 ? index : 0
}

export default function OnboardingPage() {
  const { tenants, loading, error } = useAdminWorkspace()
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const grouped = useMemo(() => ({
    inProgress: tenants.filter((tenant) => tenant.onboardingStatus === 'in_progress'),
    blocked: tenants.filter((tenant) => tenant.onboardingStatus === 'blocked'),
    invited: tenants.filter((tenant) => tenant.onboardingStatus === 'invited' || tenant.onboardingStatus === 'not_started'),
    completed: tenants.filter((tenant) => tenant.onboardingStatus === 'completed'),
  }), [tenants])

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setDetailOpen(true)
  }

  return (
    <AdminLayout
      title="Onboarding"
      description="Da seguimiento al onboarding de clientes"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
              <Circle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{grouped.inProgress.length}</p>
              <p className="text-sm text-muted-foreground">En progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{grouped.blocked.length}</p>
              <p className="text-sm text-muted-foreground">Bloqueados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{grouped.invited.length}</p>
              <p className="text-sm text-muted-foreground">Invitados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{grouped.completed.length}</p>
              <p className="text-sm text-muted-foreground">Completados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todos los tenants ({tenants.length})</TabsTrigger>
          <TabsTrigger value="needs-attention">Requieren atencion ({grouped.blocked.length + grouped.invited.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[220px]">Tenant</TableHead>
                    <TableHead className="w-[180px]">Administrador</TableHead>
                    <TableHead className="w-[140px]">Estado</TableHead>
                    <TableHead className="w-[180px]">Paso actual</TableHead>
                    <TableHead className="w-[200px]">Avance</TableHead>
                    <TableHead className="w-[140px]">Creado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                        Cargando tenants en onboarding...
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenants.map((tenant) => {
                      const progress = getStepProgress(tenant.currentStep)
                      const completedSteps = getCompletedSteps(tenant.currentStep)

                      return (
                        <TableRow key={tenant.id} className="cursor-pointer" onClick={() => handleSelectTenant(tenant)}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{tenant.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{tenant.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-foreground">{tenant.adminName}</p>
                              <p className="text-xs text-muted-foreground">{tenant.adminEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <OnboardingStatusBadge status={tenant.onboardingStatus} />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-foreground">
                              {onboardingSteps.find((step) => step.step === tenant.currentStep)?.label || tenant.currentStep}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Progress value={progress} className="h-2 w-24" />
                              <span className="text-xs text-muted-foreground">
                                {completedSteps}/{onboardingSteps.length}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); handleSelectTenant(tenant) }}>
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(event) => event.stopPropagation()} asChild>
                                  <a href={tenant.loginUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir portal del tenant
                                  </a>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needs-attention">
          <div className="grid gap-4 md:grid-cols-2">
            {[...grouped.blocked, ...grouped.invited].map((tenant) => {
              const progress = getStepProgress(tenant.currentStep)
              return (
                <Card
                  key={tenant.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted/50',
                    tenant.onboardingStatus === 'blocked' && 'border-destructive/30',
                  )}
                  onClick={() => handleSelectTenant(tenant)}
                >
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{tenant.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{tenant.adminEmail}</p>
                      </div>
                      <OnboardingStatusBadge status={tenant.onboardingStatus} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Actual: {onboardingSteps.find((step) => step.step === tenant.currentStep)?.label || tenant.currentStep}
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="mr-2 h-3 w-3" />
                        Enviar recordatorio
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <a href={tenant.loginUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Abrir portal
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedTenant && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTenant.name}</SheetTitle>
                <SheetDescription>Avance del onboarding y detalle de pasos</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avance general</span>
                    <span className="font-medium">{getStepProgress(selectedTenant.currentStep)}%</span>
                  </div>
                  <Progress value={getStepProgress(selectedTenant.currentStep)} className="h-2" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Pasos del onboarding</h3>
                  <div className="space-y-2">
                    {onboardingSteps.map((stepInfo, index) => {
                      const currentIndex = onboardingSteps.findIndex((step) => step.step === selectedTenant.currentStep)
                      const isCompleted = index < currentIndex
                      const isCurrent = index === currentIndex
                      const Icon = stepInfo.icon

                      return (
                        <div
                          key={stepInfo.step}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3',
                            isCurrent && 'border-primary bg-primary/5',
                            isCompleted && 'border-success/30 bg-success/5',
                          )}
                        >
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            isCompleted && 'bg-success text-success-foreground',
                            isCurrent && 'bg-primary text-primary-foreground',
                            !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              'text-sm font-medium',
                              isCompleted && 'text-success',
                              isCurrent && 'text-primary',
                              !isCompleted && !isCurrent && 'text-muted-foreground',
                            )}>
                              {stepInfo.label}
                            </p>
                            {isCurrent && <p className="text-xs text-muted-foreground">En progreso</p>}
                          </div>
                          {isCurrent && selectedTenant.onboardingStatus === 'blocked' && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      )
                    })}
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
                    Enviar recordatorio
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
