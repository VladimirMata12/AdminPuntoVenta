'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAdminAuth } from './auth-provider'
import {
  LayoutDashboard,
  Users,
  Server,
  Rocket,
  Building2,
  Settings,
  HelpCircle,
} from 'lucide-react'

const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Aprovisionamiento', href: '/provisioning', icon: Server },
  { name: 'Onboarding', href: '/onboarding', icon: Rocket },
  { name: 'Clientes', href: '/tenants', icon: Building2 },
]

const secondaryNavigation = [
  { name: 'Configuracion', href: '/settings', icon: Settings },
  { name: 'Ayuda', href: '/help', icon: HelpCircle },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { profile } = useAdminAuth()
  const initials = profile?.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PV'

  return (
    <aside className="admin-panel flex h-screen w-68 flex-col border-r border-sidebar-border bg-sidebar/88">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-400 to-cyan-400 shadow-[0_0_26px_rgba(139,92,246,0.35)]">
          <span className="text-sm font-bold text-primary-foreground">PV</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide text-sidebar-foreground">Punto Venta</span>
          <span className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/55">Panel Admin</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.24em] text-sidebar-foreground/45">
          Operacion
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_12px_26px_rgba(12,10,22,0.22)]'
                  : 'text-sidebar-foreground/78 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-sidebar-border px-3 py-4">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-2xl border border-white/6 bg-white/4 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/14 text-primary">
              <span className="text-sm font-medium">{initials}</span>
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-sidebar-foreground">{profile?.fullName ?? 'Administrador'}</p>
              <p className="text-xs capitalize text-sidebar-foreground/55">{profile?.role ?? 'platform'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
