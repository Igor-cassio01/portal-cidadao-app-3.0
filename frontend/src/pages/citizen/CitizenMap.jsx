import React, { useState, useEffect } from 'react'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Map as MapIcon,
  Filter,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

// Fix para os ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const CitizenMap = () => {
  const { api } = useAuth()
  const [occurrences, setOccurrences] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [mapCenter] = useState([-21.2451, -45.0003]) // Lavras, MG

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar categorias
      const categoriesRes = await api.get('/admin/categories')
      setCategories(categoriesRes.data.categories)
      
      // Carregar todas as ocorrências
      const occurrencesRes = await api.get('/occurrences?per_page=1000')
      setOccurrences(occurrencesRes.data.occurrences)
      
    } catch (error) {
      console.error('Erro ao carregar dados do mapa:', error)
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

  const getStatusIcon = (status) => {
    const icons = {
      open: AlertTriangle,
      in_progress: Clock,
      resolved: CheckCircle,
      closed: X
    }
    const Icon = icons[status] || AlertTriangle
    return <Icon className="w-4 h-4" />
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

  const createCustomIcon = (category, status) => {
    const statusColors = {
      open: '#EF4444',
      in_progress: '#F59E0B',
      resolved: '#10B981',
      closed: '#6B7280'
    }
    
    const color = statusColors[status] || '#6B7280'
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">
            📍
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    })
  }

  const filteredOccurrences = occurrences.filter(occ => {
    const categoryMatch = selectedCategory === 'all' || occ.category_id === parseInt(selectedCategory)
    const statusMatch = selectedStatus === 'all' || occ.status === selectedStatus
    return categoryMatch && statusMatch
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <CitizenLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </CitizenLayout>
    )
  }

  return (
    <CitizenLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mapa da Cidade</h2>
          <p className="text-gray-600">Visualize todas as ocorrências reportadas na cidade</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro de Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="open">Abertas</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="resolved">Resolvidas</option>
                  <option value="closed">Fechadas</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{filteredOccurrences.length}</span> de{' '}
                <span className="font-semibold">{occurrences.length}</span> ocorrências
              </p>
              {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedStatus('all')
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mapa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapIcon className="w-5 h-5 mr-2" />
              Mapa Interativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '600px', width: '100%' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {filteredOccurrences.map((occurrence) => (
                  <Marker
                    key={occurrence.id}
                    position={[occurrence.latitude, occurrence.longitude]}
                    icon={createCustomIcon(occurrence.category_name, occurrence.status)}
                  >
                    <Popup maxWidth={300}>
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-2">{occurrence.title}</h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(occurrence.status)}>
                              {getStatusIcon(occurrence.status)}
                              <span className="ml-1">{getStatusText(occurrence.status)}</span>
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(occurrence.priority)}`} />
                          </div>

                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{occurrence.address}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{occurrence.category_name}</span>
                          </div>

                          {occurrence.citizen && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{occurrence.citizen.name}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{formatDate(occurrence.created_at)}</span>
                          </div>

                          {occurrence.description && (
                            <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                              {occurrence.description.length > 100
                                ? occurrence.description.substring(0, 100) + '...'
                                : occurrence.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Legenda */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Legenda</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">Aberta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700">Em Andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Resolvida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-700">Fechada</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  )
}

export default CitizenMap

