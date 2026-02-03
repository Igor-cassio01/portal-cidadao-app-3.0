import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MapPin,
  Camera,
  Send,
  AlertTriangle,
  X,
  Upload,
  CheckCircle
} from 'lucide-react'

const CreateOccurrence = () => {
  const { api } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [photos, setPhotos] = useState([])
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    address: '',
    latitude: '',
    longitude: '',
    priority: 'medium'
  })

  useEffect(() => {
    loadCategories()
    getCurrentLocation()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador')
      return
    }

    setLoadingLocation(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6)
        const lng = position.coords.longitude.toFixed(6)
        
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }))
        
        // Tentar obter endereço usando reverse geocoding (simulado)
        // Em produção, usar API de geocoding real
        const address = `Rua Exemplo, ${Math.floor(Math.random() * 1000)}, Centro, Lavras-MG`
        setFormData(prev => ({ ...prev, address }))
        
        setLoadingLocation(false)
        
        // Feedback visual de sucesso
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        successMsg.textContent = '✓ Localização obtida com sucesso!'
        document.body.appendChild(successMsg)
        setTimeout(() => successMsg.remove(), 3000)
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        setLoadingLocation(false)
        
        let errorMessage = 'Erro ao obter localização. '
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permissão negada. Por favor, permita o acesso à localização.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Localização indisponível.'
            break
          case error.TIMEOUT:
            errorMessage += 'Tempo esgotado ao obter localização.'
            break
          default:
            errorMessage += 'Erro desconhecido.'
        }
        
        setError(errorMessage)
        
        // Usar coordenadas padrão de Lavras-MG como fallback
        setFormData(prev => ({
          ...prev,
          latitude: '-21.2454',
          longitude: '-45.0009',
          address: 'Lavras-MG (Localização padrão - ajuste manualmente)'
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + photos.length > 5) {
      setError('Máximo de 5 fotos permitidas')
      return
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))

    setPhotos(prev => [...prev, ...newPhotos])
  }

  const removePhoto = (photoId) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
      }
      return prev.filter(p => p.id !== photoId)
    })
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Título é obrigatório')
      return false
    }
    if (!formData.description.trim()) {
      setError('Descrição é obrigatória')
      return false
    }
    if (!formData.category_id) {
      setError('Categoria é obrigatória')
      return false
    }
    if (!formData.address.trim()) {
      setError('Endereço é obrigatório')
      return false
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Localização é obrigatória')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Criar ocorrência
      const response = await api.post('/occurrences', formData)
      const occurrenceId = response.data.occurrence.id

      // Upload de fotos se houver
      if (photos.length > 0) {
        const formDataPhotos = new FormData()
        photos.forEach(photo => {
          formDataPhotos.append('photos', photo.file)
        })

        await api.post(`/occurrences/${occurrenceId}/photos`, formDataPhotos, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/citizen/occurrences')
      }, 2000)

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao criar ocorrência')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <CitizenLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Ocorrência Criada com Sucesso!
                </h2>
                <p className="text-green-800 mb-4">
                  Sua ocorrência foi registrada e será analisada pela equipe responsável.
                  Você receberá atualizações sobre o progresso.
                </p>
                <p className="text-sm text-green-700">
                  Redirecionando para suas ocorrências...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CitizenLayout>
    )
  }

  return (
    <CitizenLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Nova Ocorrência</h2>
            <p className="text-gray-600">Relate um problema em sua cidade</p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Problema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Buraco na rua, lâmpada queimada..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <Select value={formData.category_id} onValueChange={(value) => handleSelectChange('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descreva o problema em detalhes..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Endereço completo do problema"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <Input
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="-21.2454"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <Input
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="-45.0009"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="w-full"
                  disabled={loadingLocation}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {loadingLocation ? 'Obtendo localização...' : 'Usar Minha Localização Atual'}
                </Button>
                
                {formData.latitude && formData.longitude && (
                  <div className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Localização definida: {formData.latitude}, {formData.longitude}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fotos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Fotos (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar fotos do problema (máximo 5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Clique para selecionar fotos ou arraste aqui
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG até 5MB cada
                      </p>
                    </label>
                  </div>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.preview}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/citizen')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Criar Ocorrência
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </CitizenLayout>
  )
}

export default CreateOccurrence
