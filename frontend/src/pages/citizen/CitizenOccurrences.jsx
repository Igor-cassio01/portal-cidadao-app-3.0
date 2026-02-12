import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { useAuth } from '../../contexts/AuthContext'
import OccurrenceChatButton from '../../components/OccurrenceChatButton'
import SocialShare from '../../components/SocialShare'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Plus,
  Filter
} from 'lucide-react'

const CitizenOccurrences = () => {
  const { api, user } = useAuth()
  const navigate = useNavigate()
  const [occurrences, setOccurrences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  })

  useEffect(() => {
    loadOccurrences()
  }, [filterStatus])

  const loadOccurrences = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Buscar ocorrências do cidadão logado
      const params = {
        citizen_id: user?.id,
        per_page: 100
      }
      
      if (filterStatus !== 'all') {
        params.status = filterStatus
      }
      
      const response = await api.get('/occurrences', { params })
      const data = response.data.occurrences || []
      
      setOccurrences(data)
      
      // Calcular estatísticas
      const newStats = {
        total: data.length,
        open: data.filter(o => o.status === 'open').length,
        in_progress: data.filter(o => o.status === 'in_progress').length,
        resolved: data.filter(o => o.status === 'resolved').length,
        closed: data.filter(o => o.status === 'closed').length
      }
      setStats(newStats)
      
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error)
      setError('Erro ao carregar suas ocorrências. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Aberta', variant: 'default', icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Em Andamento', variant: 'default', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resolvida', variant: 'default', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      closed: { label: 'Fechada', variant: 'default', icon: XCircle, color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status] || statusConfig.open
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
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

  const getDaysAgo = (dateString) => {
    if (!dateString) return 'Data não disponível'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    return `Há ${diffDays} dias`
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

  return (
    <CitizenLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Minhas Ocorrências</h2>
            <p className="text-gray-600">Acompanhe o status de todos os seus relatos</p>
          </div>
          <Button onClick={() => navigate('/citizen/create-occurrence')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ocorrência
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('open')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Abertas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('in_progress')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('resolved')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolvidas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('closed')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fechadas</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="open">Abertas</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvidas</SelectItem>
                    <SelectItem value="closed">Fechadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterStatus !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ocorrências */}
        {occurrences.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterStatus === 'all' ? 'Nenhuma ocorrência encontrada' : 'Nenhuma ocorrência com este status'}
              </h3>
              <p className="text-gray-600 mb-4">
                {filterStatus === 'all' 
                  ? 'Você ainda não criou nenhuma ocorrência.'
                  : 'Tente selecionar outro filtro.'}
              </p>
              {filterStatus === 'all' && (
                <Button onClick={() => navigate('/citizen/create-occurrence')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Ocorrência
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {occurrences.map((occurrence) => (
              <Card key={occurrence.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Foto da Ocorrência */}
                    {occurrence.photos && occurrence.photos.length > 0 && (
                      <div className="flex-shrink-0">
                        <img
                          src={occurrence.photos[0].url}
                          alt={occurrence.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {occurrence.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(occurrence.status)}
                              {getPriorityBadge(occurrence.priority)}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{occurrence.description}</p>
                          
                          {/* Comparativo Antes x Depois */}
                          {occurrence.photos && occurrence.photos.some(p => p.filename.startsWith('after_')) && (
                            <div className="mt-4 border rounded-lg overflow-hidden shadow-sm">
                              <div className="grid grid-cols-2 gap-0.5 bg-gray-100">
                                <div className="relative">
                                  <img
                                    src={occurrence.photos.find(p => !p.filename.startsWith('after_'))?.url || 'https://via.placeholder.com/300x200?text=Foto+Antes'}
                                    alt="Foto Antes"
                                    className="w-full h-32 object-cover"
                                  />
                                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    Antes
                                  </div>
                                </div>
                                <div className="relative">
                                  <img
                                    src={occurrence.photos.find(p => p.filename.startsWith('after_'))?.url}
                                    alt="Foto Depois"
                                    className="w-full h-32 object-cover"
                                  />
                                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    Depois
                                  </div>
                                </div>
                              </div>
                              <div className="p-2 bg-green-50 text-green-800 text-center text-sm font-medium flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Resolvida! Avalie o serviço.
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {occurrence.category_name || 'Categoria não definida'}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {occurrence.address}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(occurrence.created_at)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {getDaysAgo(occurrence.created_at)}
                            </div>
                          </div>

                          {occurrence.assigned_to_name && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Responsável:</span> {occurrence.assigned_to_name}
                              {occurrence.department_name && ` (${occurrence.department_name})`}
                            </div>
                          )}

                          {occurrence.resolved_at && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                              ✓ Resolvida em {formatDate(occurrence.resolved_at)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/citizen/occurrence/${occurrence.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        
                        <OccurrenceChatButton occurrenceId={occurrence.id} />
                        
                        <SocialShare
                          title={occurrence.title}
                          description={occurrence.description}
                          url={`${window.location.origin}/citizen/occurrence/${occurrence.id}`}
                        />
                      </div>

                      {/* Timeline Preview */}
                      {occurrence.timeline && occurrence.timeline.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Última atualização:
                          </p>
                          <div className="text-sm text-gray-600">
                            {occurrence.timeline[occurrence.timeline.length - 1].description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  )
}

export default CitizenOccurrences

