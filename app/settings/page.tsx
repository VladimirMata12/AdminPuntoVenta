import { AdminLayout } from '@/components/admin/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Shield, Globe } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AdminLayout title="Configuracion" description="Administra las preferencias del panel">
      <div className="max-w-2xl space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configura como recibes notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-leads">Notificaciones de leads nuevos</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe un correo cuando se crea un lead nuevo
                </p>
              </div>
              <Switch id="email-leads" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-demos">Recordatorios de demo</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe avisos antes de demos agendadas
                </p>
              </div>
              <Switch id="email-demos" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-provisioning">Actualizaciones de provision</Label>
                <p className="text-sm text-muted-foreground">
                  Notificaciones sobre el estado de aprovisionamiento
                </p>
              </div>
              <Switch id="email-provisioning" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Configuracion de correo
            </CardTitle>
            <CardDescription>
              Configura el correo saliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="sender-name">Nombre del remitente</Label>
              <Input id="sender-name" defaultValue="Punto Venta" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sender-email">Correo remitente</Label>
              <Input id="sender-email" type="email" defaultValue="noreply@punto-venta.mx" />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Ajustes de seguridad y acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="2fa">Autenticacion de dos factores</Label>
                <p className="text-sm text-muted-foreground">
                  Agrega una capa extra de seguridad
                </p>
              </div>
              <Switch id="2fa" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session">Tiempo de sesion</Label>
                <p className="text-sm text-muted-foreground">
                  Cierra sesion automaticamente tras inactividad
                </p>
              </div>
              <Switch id="session" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Guardar cambios</Button>
        </div>
      </div>
    </AdminLayout>
  )
}
