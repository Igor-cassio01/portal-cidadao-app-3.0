import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Star,
  MessageSquare
} from 'lucide-react'
import OccurrenceChatButton from '../../components/OccurrenceChatButton'
import SocialShare from '../../components/SocialShare'

const OccurrenceDetail = () => {
  const { id } = useParams()
  const { api } = useAuth()
  const navigate = useNavigate()
  const [occurrence, setOccurrence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOccurrenceDetail()
  }, [id])

  const loadOccurrenceDetail = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await api.get(`/occurrences/${id}`)
      setOccurrence(response.data.occurrence)
    } catch (error) {
      console.error('Erro ao carregar detalhes da ocorrência:', error)
      setError('Erro ao carregar detalhes da ocorrência. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Aberta', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      resolved: { label: 'Resolvida', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { label: 'Fechada', color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.open
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
    }

    const config = priorityConfig[priority] || priorityConfig.medium

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <CitizenLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </CitizenLayout>
    )
  }

  if (!occurrence) {
    return (
      <CitizenLayout>
        <div className="p-6">
          <Button variant="outline" onClick={() => navigate('/citizen/occurrences')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ocorrência não encontrada
              </h3>
              <p className="text-gray-600">
                A ocorrência que você está procurando não existe ou foi removida.
              </p>
            </CardContent>
          </Card>
        </div>
      </CitizenLayout>
    )
  }

  return (
    <CitizenLayout>
      <div className="p-6">
        <Button variant="outline" onClick={() => navigate('/citizen/occurrences')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{occurrence.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(occurrence.status)}
                    {getPriorityBadge(occurrence.priority)}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{occurrence.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {occurrence.address}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(occurrence.created_at)}
                </div>
                {occurrence.category_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    Categoria: {occurrence.category_name}
                  </div>
                )}
                {occurrence.assigned_to_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Responsável: {occurrence.assigned_to_name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fotos */}
          {occurrence.photos && occurrence.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fotos da Ocorrência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {occurrence.photos.map((photo) => (
                    <div key={photo.id} className="rounded-lg overflow-hidden shadow-md">
                      <img
                        src={`/api/uploads/${photo.filename}`}
                        alt={photo.original_filename}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Foto'
                        }}
                      />
                      <div className="p-2 bg-gray-50 text-xs text-gray-600">
                        {photo.original_filename}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {occurrence.timeline && occurrence.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atualizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {occurrence.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        {index < occurrence.timeline.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 my-2"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-gray-900">{event.action}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(event.created_at)}
                        </p>
                        {event.user && (
                          <p className="text-xs text-gray-500">
                            Por: {event.user.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avaliação */}
          {occurrence.status === 'resolved' && !occurrence.rating && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">Avalie o Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800 mb-4">
                  Sua ocorrência foi resolvida! Por favor, avalie a qualidade do serviço prestado.
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex gap-2 flex-wrap">
            <OccurrenceChatButton occurrenceId={occurrence.id} />
            <SocialShare
              title={occurrence.title}
              description={occurrence.description}
              url={`${window.location.origin}/citizen/occurrence/${occurrence.id}`}
            />
          </div>
        </div>
      </div>
    </CitizenLayout>
  )
}

export default OccurrenceDetail
