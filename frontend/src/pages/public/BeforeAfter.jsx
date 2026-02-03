import React, { useState, useEffect } from 'react'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRight,
  MapPin,
  Calendar,
  ThumbsUp,
  Share2,
  Eye,
  Filter,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const BeforeAfter = () => {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    avgDays: 0,
    satisfaction: 0
  })

  useEffect(() => {
    loadBeforeAfterCases()
  }, [filter])

  const loadBeforeAfterCases = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Buscar ocorrências resolvidas que possuem after_photo_url
      const params = {
        status: 'resolved',
        has_after_photo: true,
        per_page: 100
      }
      
      if (filter !== 'all') {
        params.category_name = filter
      }
      
      const response = await api.get('/occurrences', { params })
      const resolvedCases = (response.data.occurrences || response.data || []).filter(o => o.after_photo_url) || []
      
      setCases(resolvedCases)
      
      // Calcular estatísticas
      const totalResolved = resolvedCases.length
      const totalDays = resolvedCases.reduce((acc, c) => {
        if (c.created_at && c.resolved_at) {
          const created = new Date(c.created_at)
          const resolved = new Date(c.resolved_at)
          const diffTime = Math.abs(resolved - created)
          return acc + Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
        return acc
      }, 0)
      
      const avgDays = totalResolved > 0 ? Math.round(totalDays / totalResolved) : 0
      
      // Calcular satisfação média
      const satisfaction = totalResolved > 0 
        ? (resolvedCases.reduce((acc, c) => acc + (c.satisfaction || 4.5), 0) / totalResolved).toFixed(1)
        : 0

      setStats({
        total: response.data.total || resolvedCases.length,
        resolved: totalResolved,
        avgDays: avgDays,
        satisfaction: satisfaction
      })
      
    } catch (error) {
      console.error('Erro ao carregar casos Antes x Depois:', error)
      setError('Erro ao carregar transformações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = (caseItem) => {
    if (navigator.share) {
      navigator.share({
        title: caseItem.title,
        text: caseItem.description,
        url: window.location.href
      })
    } else {
      // Fallback para copiar link
      const text = `${caseItem.title}\n${caseItem.description}\n${window.location.href}`
      navigator.clipboard.writeText(text).then(() => {
        alert('Link copiado para a área de transferência!')
      })
    }
  }

  const filteredCases = filter === 'all' 
    ? cases 
    : cases.filter(c => c.category_name === filter || c.category === filter)

  return (
    <CitizenLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                🏆 Antes e Depois
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Veja as transformações que fizemos em Lavras
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-blue-100">Casos Resolvidos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold">{stats.resolved}</div>
                  <div className="text-sm text-blue-100">Resolvidas com Foto</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold">{stats.avgDays}</div>
                  <div className="text-sm text-blue-100">Dias (Média)</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold">{stats.satisfaction}⭐</div>
                  <div className="text-sm text-blue-100">Satisfação</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Erro ao carregar</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Transformações Realizadas
            </h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-64">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="Pavimentação">Pavimentação</SelectItem>
                <SelectItem value="Áreas Verdes">Áreas Verdes</SelectItem>
                <SelectItem value="Iluminação">Iluminação</SelectItem>
                <SelectItem value="Limpeza Urbana">Limpeza Urbana</SelectItem>
                <SelectItem value="Acessibilidade">Acessibilidade</SelectItem>
                <SelectItem value="Obras Públicas">Obras Públicas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cases Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando transformações...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma transformação encontrada
                </h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'Ainda não há casos de "Antes e Depois" registrados.'
                    : 'Nenhuma transformação encontrada nesta categoria.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredCases.map((caseItem) => (
                <Card key={caseItem.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    {/* Before/After Images */}
                    <div className="grid grid-cols-2 gap-0.5 bg-gray-200">
                      <div className="relative group">
                        <img
                          src={caseItem.photo_url || 'https://via.placeholder.com/300x200?text=Foto+Antes'}
                          alt="Antes"
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Antes
                        </div>
                      </div>
                      <div className="relative group">
                        <img
                          src={caseItem.after_photo_url || 'https://via.placeholder.com/300x200?text=Foto+Depois'}
                          alt="Depois"
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Depois
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {caseItem.title}
                          </h3>
                          <Badge className="bg-purple-100 text-purple-700">
                            {caseItem.category_name || caseItem.category || 'Sem categoria'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span className="text-lg font-bold">{caseItem.satisfaction || 4.5}</span>
                          <span>⭐</span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {caseItem.description}
                      </p>

                      <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{caseItem.address || 'Endereço não informado'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Resolvido em {caseItem.resolved_at ? new Date(caseItem.resolved_at).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {caseItem.resolved_at && caseItem.created_at 
                              ? Math.ceil(Math.abs(new Date(caseItem.resolved_at) - new Date(caseItem.created_at)) / (1000 * 60 * 60 * 24)) 
                              : '-'} dias para resolver
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {caseItem.likes || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {caseItem.views || 0}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(caseItem)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              Quer ver sua rua transformada?
            </h3>
            <p className="text-blue-100 mb-6">
              Relate problemas em sua região e acompanhe as melhorias!
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/citizen/create-occurrence'}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Relatar Problema
            </Button>
          </div>
        </div>
      </div>
    </CitizenLayout>
  )
}

export default BeforeAfter
