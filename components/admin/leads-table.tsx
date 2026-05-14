'use client'

import { formatDistanceToNow } from 'date-fns'
import { Calendar, CheckCircle, Eye, MoreHorizontal, Server, Trash2, UserPlus, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IntentBadge, LeadStatusBadge, PriorityBadge } from './status-badge'
import type { Lead } from '@/lib/types'

interface LeadsTableProps {
  leads: Lead[]
  onSelectLead: (lead: Lead) => void
  onMarkTrialPending?: (lead: Lead) => void
  onMarkLost?: (lead: Lead) => void
  onProvisionLead?: (lead: Lead) => void
  onDeleteLead?: (lead: Lead) => void
}

const sourceLabels: Record<string, string> = {
  website: 'Sitio web',
  referral: 'Referido',
  cold_outreach: 'Prospeccion',
  marketing: 'Marketing',
  partner: 'Partner',
  manual: 'Manual',
}

export function LeadsTable({
  leads,
  onSelectLead,
  onMarkTrialPending,
  onMarkLost,
  onProvisionLead,
  onDeleteLead,
}: LeadsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[220px]">Empresa</TableHead>
            <TableHead className="w-[180px]">Contacto</TableHead>
            <TableHead className="w-[100px]">Intencion</TableHead>
            <TableHead className="w-[120px]">Prioridad</TableHead>
            <TableHead className="w-[140px]">Estado</TableHead>
            <TableHead className="w-[110px]">Fuente</TableHead>
            <TableHead className="w-[160px]">Responsable</TableHead>
            <TableHead className="w-[140px]">Creado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm font-medium">No se encontraron leads</p>
                  <p className="text-xs">Prueba ajustando tus filtros</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => onSelectLead(lead)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{lead.company}</p>
                    {lead.desiredTenantSlug && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {lead.desiredTenantSlug}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-foreground">{lead.contactName}</p>
                    <p className="text-xs text-muted-foreground">{lead.contactEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <IntentBadge intent={lead.intent} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={lead.priority} />
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {sourceLabels[lead.source] || lead.source}
                  </span>
                </TableCell>
                <TableCell>
                  {lead.assignedOwnerName ? (
                    <span className="text-sm text-foreground">{lead.assignedOwnerName}</span>
                  ) : (
                      <span className="text-sm text-muted-foreground">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onSelectLead(lead) }}>
                        <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onSelectLead(lead) }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                          Asignar responsable
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onSelectLead(lead) }}>
                        <Calendar className="mr-2 h-4 w-4" />
                          Agendar demo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation()
                          if (onMarkTrialPending) onMarkTrialPending(lead)
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar trial pendiente
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation()
                          if (onProvisionLead) onProvisionLead(lead)
                        }}
                      >
                        <Server className="mr-2 h-4 w-4" />
                        Provisionar tenant
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (onMarkLost) onMarkLost(lead)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Marcar como perdido
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (onDeleteLead) onDeleteLead(lead)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
