'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type PlatformAdminRole = 'owner' | 'sales' | 'ops'

export interface PlatformAdminProfile {
  id: string
  authId: string
  email: string
  fullName: string
  role: PlatformAdminRole
  isActive: boolean
}

interface AdminAuthContextValue {
  session: Session | null
  user: User | null
  profile: PlatformAdminProfile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

async function loadPlatformProfile(authUser: User): Promise<PlatformAdminProfile | null> {
  const { data, error } = await supabase
    .from('platform_admins')
    .select('id, auth_id, email, full_name, role, is_active')
    .eq('auth_id', authUser.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data || data.is_active === false) {
    return null
  }

  return {
    id: String(data.id),
    authId: String(data.auth_id),
    email: String(data.email),
    fullName: String(data.full_name),
    role: data.role as PlatformAdminRole,
    isActive: Boolean(data.is_active),
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<PlatformAdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const currentSession = data.session

    setSession(currentSession ?? null)
    setUser(currentSession?.user ?? null)

    if (!currentSession?.user) {
      setProfile(null)
      setError(null)
      return
    }

    try {
      const loadedProfile = await loadPlatformProfile(currentSession.user)
      setProfile(loadedProfile)
      setError(loadedProfile ? null : 'Tu usuario no esta dado de alta como administrador interno de plataforma.')
    } catch (err) {
      console.error('[AdminAuth] Error loading platform profile', err)
      setProfile(null)
      setError('No se pudo cargar el perfil interno de plataforma.')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return

        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)

        if (data.session?.user) {
          const loadedProfile = await loadPlatformProfile(data.session.user)
          if (!mounted) return
          setProfile(loadedProfile)
          setError(loadedProfile ? null : 'Tu usuario no esta dado de alta como administrador interno de plataforma.')
        } else {
          setProfile(null)
          setError(null)
        }
      } catch (err) {
        console.error('[AdminAuth] bootstrap failed', err)
        if (mounted) {
          setError('No se pudo validar la sesion actual.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        setError(null)
        setLoading(false)
        return
      }

      void loadPlatformProfile(nextSession.user)
        .then((loadedProfile) => {
          if (!mounted) return
          setProfile(loadedProfile)
          setError(loadedProfile ? null : 'Tu usuario no esta dado de alta como administrador interno de plataforma.')
          setLoading(false)
        })
        .catch((err) => {
          console.error('[AdminAuth] auth state profile load failed', err)
          if (!mounted) return
          setProfile(null)
          setError('No se pudo cargar el perfil interno de plataforma.')
          setLoading(false)
        })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (!authError) {
      return null
    }

    if (authError.message.includes('Invalid login credentials')) {
      return 'Correo o contrasena incorrectos.'
    }
    if (authError.message.includes('Email not confirmed')) {
      return 'Primero confirma tu correo.'
    }
    return authError.message
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AdminAuthContextValue>(() => ({
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signOut,
    refreshProfile,
  }), [error, loading, profile, refreshProfile, session, signIn, signOut, user])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth debe usarse dentro de <AdminAuthProvider>.')
  }
  return context
}
