import React, { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  MapPin,
  Star,
  Calendar
} from 'lucide-react'

const AdminDashboard = () => {
  const { api } = useAuth()
  const [stats, setStats] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [timelineData, setTimelineData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [recentOccurrences, setRecentOccurrences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Carregar estatísticas gerais
      const [statsRes, categoryRes, timelineRes, deptRes, occurrencesRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/occurrences-by-category'),
        api.get('/admin/dashboard/occurrences-timeline'),
        api.get('/admin/dashboard/performance-by-department'),
        api.get('/occurrences?per_page=5')
      ])

      setStats(statsRes.data)
      setCategoryData(categoryRes.data.categories)
      setTimelineData(timelineRes.data.timeline)
      setDepartmentData(deptRes.data.departments)
      setRecentOccurrences(occurrencesRes.data.occurrences)
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
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
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
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Visão geral do sistema</p>
          </div>
          <Button onClick={loadDashboardData} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Ocorrências</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total_occurrences || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Aberto</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.status_breakdown?.open || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Resolvidas</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.status_breakdown?.resolved || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cidadãos Ativos</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.total_citizens || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio de Resolução</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.avg_resolution_time_hours || 0}h</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">{stats?.avg_rating || 0}</p>
                    <Star className="w-5 h-5 text-yellow-500 ml-1" />
                  </div>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Últimos 30 dias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.recent_occurrences || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Ocorrências por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Ocorrências ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance por departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" name="Total" />
                <Bar dataKey="resolved" fill="#10B981" name="Resolvidas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ocorrências recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Ocorrências Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOccurrences.map((occurrence) => (
                <div key={occurrence.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(occurrence.priority)}`}></div>
                      <h4 className="font-medium text-gray-900">{occurrence.title}</h4>
                      <Badge className={getStatusColor(occurrence.status)}>
                        {getStatusText(occurrence.status)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {occurrence.address}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{occurrence.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(occurrence.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      #{occurrence.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
