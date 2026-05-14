'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminSidebar } from './sidebar'
import { AdminHeader } from './header'
import { useAdminAuth } from './auth-provider'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, session, profile, error } = useAdminAuth()

  useEffect(() => {
    if (!loading && (!session || !profile) && pathname !== '/login') {
      router.replace('/login')
    }
  }, [error, loading, pathname, profile, router, session])

  if (loading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-background px-6">
        <div className="admin-panel rounded-2xl px-6 py-4 text-sm text-muted-foreground">
          Cargando panel administrativo...
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-background px-6">
        <div className="admin-panel max-w-md rounded-2xl px-6 py-5 text-center">
          <p className="text-base font-medium text-foreground">Acceso restringido</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || 'Necesitas iniciar sesion con un usuario registrado en platform_admins.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader title={title} description={description} />
        <main className="flex-1 overflow-auto p-6 md:p-7">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
