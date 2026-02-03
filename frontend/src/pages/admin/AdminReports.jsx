import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  BarChart3
} from 'lucide-react'

const AdminReports = () => {
  const { api } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/political/dashboard/political-metrics')
      setStats(response.data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const reportTypes = [
    {
      id: 'occurrences',
      title: 'Relatório de Ocorrências',
      description: 'Relatório completo de todas as ocorrências por período',
      icon: FileText,
      color: 'blue',
      stats: stats ? `${stats.total_occurrences} ocorrências` : '...'
    },
    {
      id: 'performance',
      title: 'Relatório de Performance',
      description: 'Análise de performance por departamento e categoria',
      icon: TrendingUp,
      color: 'green',
      stats: stats ? `${stats.resolution_rate}% de resolução` : '...'
    },
    {
      id: 'satisfaction',
      title: 'Relatório de Satisfação',
      description: 'Avaliações e feedback dos cidadãos',
      icon: CheckCircle,
      color: 'purple',
      stats: stats ? `${stats.avg_rating}/5.0 média` : '...'
    },
    {
      id: 'citizens',
      title: 'Relatório de Cidadãos',
      description: 'Estatísticas de engajamento dos cidadãos',
      icon: Users,
      color: 'orange',
      stats: stats ? `${stats.active_citizens} cidadãos ativos` : '...'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      green: 'border-green-200 bg-green-50 text-green-700',
      purple: 'border-purple-200 bg-purple-50 text-purple-700',
      orange: 'border-orange-200 bg-orange-50 text-orange-700'
    }
    return colors[color] || colors.blue
  }

  const getIconColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }
    return colors[color] || colors.blue
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Relatórios detalhados e análises do sistema</p>
        </div>

        {/* Tipos de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <Card key={report.id} className={getColorClasses(report.color)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center mb-2">
                        <Icon className="w-5 h-5 mr-2" />
                        {report.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${getIconColorClasses(report.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold">
                      {report.stats}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Selecionar Período
                      </Button>
                      <Button className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Relatórios Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Relatórios Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Últimos 7 dias
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Últimos 30 dias
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Este mês
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Mês anterior
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Este ano
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Personalizado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Resumidas */}
        {stats && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-700">
                📊 Resumo Geral do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Total de Ocorrências</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.total_occurrences}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Taxa de Resolução</p>
                  <p className="text-3xl font-bold text-green-700">{stats.resolution_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 mb-1">Avaliação Média</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.avg_rating}/5.0</p>
                </div>
                <div>
                  <p className="text-sm text-orange-600 mb-1">Cidadãos Ativos</p>
                  <p className="text-3xl font-bold text-orange-700">{stats.active_citizens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminReports

