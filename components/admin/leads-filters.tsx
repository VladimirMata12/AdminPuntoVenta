'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import type { LeadStatus, LeadIntent, LeadSource } from '@/lib/types'
import type { PlatformAdminProfile } from './auth-provider'

interface LeadsFiltersProps {
  filters: {
    search: string
    status: LeadStatus | 'all'
    intent: LeadIntent | 'all'
    source: LeadSource | 'all'
    assignedTo: string | 'all'
  }
  onFiltersChange: (filters: LeadsFiltersProps['filters']) => void
  onClearFilters: () => void
  owners: PlatformAdminProfile[]
}

const statusOptions: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'demo_scheduled', label: 'Demo agendada' },
  { value: 'trial_pending', label: 'Trial pendiente' },
  { value: 'won', label: 'Ganado' },
  { value: 'lost', label: 'Perdido' },
]

const intentOptions: { value: LeadIntent | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las intenciones' },
  { value: 'contact', label: 'Contacto' },
  { value: 'demo', label: 'Demo' },
  { value: 'trial', label: 'Prueba' },
]

const sourceOptions: { value: LeadSource | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las fuentes' },
  { value: 'website', label: 'Sitio web' },
  { value: 'referral', label: 'Referido' },
  { value: 'cold_outreach', label: 'Prospeccion' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'partner', label: 'Partner' },
  { value: 'manual', label: 'Manual' },
]

export function LeadsFilters({ filters, onFiltersChange, onClearFilters, owners }: LeadsFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.status !== 'all' || 
    filters.intent !== 'all' || 
    filters.source !== 'all' || 
    filters.assignedTo !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar leads..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-64 pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as LeadStatus | 'all' })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Intent Filter */}
      <Select
        value={filters.intent}
        onValueChange={(value) => onFiltersChange({ ...filters, intent: value as LeadIntent | 'all' })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Intent" />
        </SelectTrigger>
        <SelectContent>
          {intentOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source Filter */}
      <Select
        value={filters.source}
        onValueChange={(value) => onFiltersChange({ ...filters, source: value as LeadSource | 'all' })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {sourceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assigned Filter */}
      <Select
        value={filters.assignedTo}
        onValueChange={(value) => onFiltersChange({ ...filters, assignedTo: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assigned To" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los responsables</SelectItem>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {owners.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
