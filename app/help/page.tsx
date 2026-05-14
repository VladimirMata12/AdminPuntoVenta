import { AdminLayout } from '@/components/admin/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Book, 
  MessageCircle, 
  Video, 
  Mail,
  ExternalLink,
  FileText,
  HelpCircle,
  Zap,
} from 'lucide-react'

const helpTopics = [
  {
    icon: Zap,
    title: 'Primeros pasos',
    description: 'Aprende lo basico del panel administrativo',
    link: '#',
  },
  {
    icon: FileText,
    title: 'Gestion de leads',
    description: 'Como administrar y dar seguimiento a leads',
    link: '#',
  },
  {
    icon: HelpCircle,
    title: 'Provision de tenants',
    description: 'Guia para provisionar nuevos tenants',
    link: '#',
  },
  {
    icon: Book,
    title: 'Proceso de onboarding',
    description: 'Entiende el flujo de onboarding',
    link: '#',
  },
]

export default function HelpPage() {
  return (
    <AdminLayout title="Ayuda y soporte" description="Encuentra respuestas y soporte interno">
      <div className="max-w-4xl space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">¿Como te ayudamos?</h2>
              <p className="mt-1 text-muted-foreground">
                Busca en la documentacion o revisa los temas disponibles
              </p>
              <div className="relative mx-auto mt-4 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar ayuda..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          {helpTopics.map((topic) => (
            <Card key={topic.title} className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <topic.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{topic.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{topic.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Support Options */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Book className="h-4 w-4" />
                Documentacion
              </CardTitle>
              <CardDescription>
                Revisa nuestra documentacion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver docs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4" />
                Tutoriales en video
              </CardTitle>
              <CardDescription>
                Mira guias paso a paso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver videos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4" />
                Contactar soporte
              </CardTitle>
              <CardDescription>
                Recibe ayuda del equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Contactar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
