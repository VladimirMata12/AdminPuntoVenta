'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/components/admin/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, Lock, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { session, profile, loading, error, signIn } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && session && profile) {
      router.replace('/')
    }
  }, [loading, profile, router, session])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      const result = await signIn(email, password)
      if (result) {
        setFormError(result)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-fuchsia-400 to-cyan-400 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Admin Punto Venta</CardTitle>
            <CardDescription>
              Acceso interno para CRM, provisioning y onboarding.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@puntoventa.mx"
                  className="pl-9"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="pl-9"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {(formError || error) && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError || error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting ? 'Entrando...' : 'Entrar al panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
