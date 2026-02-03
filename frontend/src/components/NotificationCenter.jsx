import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Bell, X, CheckCircle, AlertCircle, Info, MessageSquare } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

const NotificationCenter = () => {
  const { api, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotifications()
      // Atualizar notificações a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications')
      const notifs = response.data.notifications || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      // Se a rota não existir, criar notificações mock baseadas nas ocorrências do usuário
      if (error.response?.status === 404) {
        loadMockNotifications()
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMockNotifications = async () => {
    try {
      // Carregar ocorrências do usuário para criar notificações
      const response = await api.get(`/occurrences?citizen_id=${user.id}&per_page=5`)
      const occurrences = response.data.occurrences || []
      
      const mockNotifications = occurrences.map((occ, index) => ({
        id: index + 1,
        type: getNotificationType(occ.status),
        title: getNotificationTitle(occ.status),
        message: `Sua ocorrência "${occ.title}" foi ${getStatusText(occ.status)}`,
        occurrence_id: occ.id,
        created_at: occ.updated_at,
        read: index > 2 // Primeiras 3 não lidas
      }))
      
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Erro ao carregar notificações mock:', error)
    }
  }

  const getNotificationType = (status) => {
    const types = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'info'
    }
    return types[status] || 'info'
  }

  const getNotificationTitle = (status) => {
    const titles = {
      open: 'Ocorrência Recebida',
      in_progress: 'Em Andamento',
      resolved: 'Resolvida!',
      closed: 'Finalizada'
    }
    return titles[status] || 'Atualização'
  }

  const getStatusText = (status) => {
    const texts = {
      open: 'recebida pela prefeitura',
      in_progress: 'colocada em andamento',
      resolved: 'resolvida',
      closed: 'finalizada'
    }
    return texts[status] || 'atualizada'
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      // Se a rota não existir, apenas marcar localmente
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      // Se a rota não existir, apenas marcar localmente
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  const getIcon = (type) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-600" />,
      warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />,
      message: <MessageSquare className="w-5 h-5 text-purple-600" />
    }
    return icons[type] || icons.info
  }

  const getColorClasses = (type) => {
    const colors = {
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      info: 'border-blue-200 bg-blue-50',
      message: 'border-purple-200 bg-purple-50'
    }
    return colors[type] || colors.info
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // diferença em segundos

    if (diff < 60) return 'Agora mesmo'
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `Há ${Math.floor(diff / 86400)} dias`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white px-2 py-0.5 text-xs">
            {unreadCount}
          </Badge>
        )}
      </button>

      {/* Painel de Notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Painel */}
          <Card className="absolute right-0 top-12 w-96 max-h-[600px] overflow-hidden z-50 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notificações
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>

            {/* Lista de Notificações */}
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default NotificationCenter

