import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import OccurrenceChatButton from '../../components/OccurrenceChatButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react'

const AdminOccurrences = () => {
  const { api } = useAuth()
  const [occurrences, setOccurrences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtros básicos
  const [searchTerm, setSearchTerm] = useState('')
  
  // Paginação
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    loadOccurrences()
  }, [pagination.page, searchTerm])

  const loadOccurrences = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        page: pagination.page,
        per_page: pagination.per_page
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      console.log('Carregando ocorrências com params:', params.toString())
      
      const response = await api.get(`/occurrences?${params}`)
      console.log('Resposta da API:', response.data)
      
      setOccurrences(response.data.occurrences || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        pages: response.data.pages || 0
      }))
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error)
      setError('Erro ao carregar ocorrências: ' + (error.response?.data?.error || error.message))
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

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Ocorrências</h2>
            <p className="text-gray-600">Gerencie todas as ocorrências do sistema</p>
          </div>
          <Button onClick={loadOccurrences} variant="outline">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filtro de busca simples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Buscar Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por título, descrição ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadOccurrences}>
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Erro */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de ocorrências */}
        <Card>
          <CardHeader>
            <CardTitle>
              Ocorrências ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : occurrences.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma ocorrência encontrada
                </h3>
                <p className="text-gray-600">
                  Não há ocorrências para exibir no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {occurrences.map((occurrence) => (
                  <div key={occurrence.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(occurrence.priority)}`}></div>
                          <h4 className="font-medium text-gray-900">#{occurrence.id} - {occurrence.title}</h4>
                          <Badge className={getStatusColor(occurrence.status)}>
                            {getStatusText(occurrence.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {occurrence.citizen?.name || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {occurrence.address || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {occurrence.created_at ? new Date(occurrence.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{occurrence.category?.name || 'Sem categoria'}</span>
                          {occurrence.assigned_admin && (
                            <span>Atribuída para: {occurrence.assigned_admin.name}</span>
                          )}
                          {occurrence.support_count > 0 && (
                            <span>{occurrence.support_count} apoio(s)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Ver detalhes:', occurrence.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <OccurrenceChatButton occurrenceId={occurrence.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.pages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminOccurrences
