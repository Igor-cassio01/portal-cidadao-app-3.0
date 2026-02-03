import React, { useState, useEffect } from 'react'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Star,
  Users
} from 'lucide-react'

const CitizenDashboard = () => {
  const { user, api } = useAuth()
  const [myOccurrences, setMyOccurrences] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  })
  const [recentOccurrences, setRecentOccurrences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Carregar minhas ocorrências
      const myOccurrencesRes = await api.get(`/occurrences?citizen_id=${user.id}`)
      const myOccs = myOccurrencesRes.data.occurrences
      setMyOccurrences(myOccs)
      
      // Calcular estatísticas
      const statsData = {
        total: myOccs.length,
        open: myOccs.filter(o => o.status === 'open').length,
        in_progress: myOccs.filter(o => o.status === 'in_progress').length,
        resolved: myOccs.filter(o => o.status === 'resolved').length,
        closed: myOccs.filter(o => o.status === 'closed').length
      }
      setStats(statsData)
      
      // Carregar ocorrências recentes da comunidade
      const recentRes = await api.get('/occurrences?per_page=5')
      setRecentOccurrences(recentRes.data.occurrences)
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      open: 'Aberta',
      in_progress: 'Em Andamento',
      resolved: 'Resolvida',
      closed: 'Fechada'
    }
    return texts[status] || status
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    }
    return colors[priority] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <CitizenLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </CitizenLayout>
    )
  }

  return (
    <CitizenLayout>
      <div className="p-6 space-y-6">
        {/* Header de boas-vindas */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Olá, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-blue-100">
                Bem-vindo ao Portal do Cidadão. Aqui você pode relatar problemas e acompanhar o progresso.
              </p>
            </div>
            <div className="hidden md:block">
              <Link to="/citizen/create">
                <Button className="bg-white text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Ocorrência
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Minhas Ocorrências</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Aberto</p>
                  <p className="text-3xl font-bold text-red-600">{stats.open}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.in_progress}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolvidas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resolved + stats.closed}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/citizen/create">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Relatar Problema</h3>
                <p className="text-sm text-gray-600">
                  Relate um novo problema em sua cidade
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/citizen/map">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Mapa da Cidade</h3>
                <p className="text-sm text-gray-600">
                  Veja todos os problemas reportados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/citizen/occurrences">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Minhas Ocorrências</h3>
                <p className="text-sm text-gray-600">
                  Acompanhe o status dos seus relatos
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Minhas ocorrências recentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Minhas Ocorrências Recentes</CardTitle>
                <Link to="/citizen/occurrences">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {myOccurrences.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma ocorrência ainda
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Você ainda não relatou nenhum problema.
                  </p>
                  <Link to="/citizen/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Relatar Primeiro Problema
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOccurrences.slice(0, 3).map((occurrence) => (
                    <div key={occurrence.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{occurrence.title}</h4>
                        <Badge className={getStatusColor(occurrence.status)}>
                          {getStatusText(occurrence.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {occurrence.address}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(occurrence.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{occurrence.category?.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ocorrências da comunidade */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ocorrências da Comunidade</CardTitle>
                <Link to="/citizen/map">
                  <Button variant="outline" size="sm">
                    Ver Mapa
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOccurrences.slice(0, 3).map((occurrence) => (
                  <div key={occurrence.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(occurrence.priority)}`}></div>
                        <h4 className="font-medium text-gray-900">{occurrence.title}</h4>
                      </div>
                      <Badge className={getStatusColor(occurrence.status)}>
                        {getStatusText(occurrence.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {occurrence.address}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {occurrence.support_count} apoio(s)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{occurrence.category?.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dicas e informações */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Dicas para um bom relato
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Seja específico na descrição do problema</li>
                  <li>• Adicione fotos sempre que possível</li>
                  <li>• Confirme a localização exata</li>
                  <li>• Acompanhe o progresso regularmente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  )
}

export default CitizenDashboard
