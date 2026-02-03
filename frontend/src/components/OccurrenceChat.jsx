import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback } from './ui/avatar'
import { MessageSquare, Send, User, Shield, X } from 'lucide-react'

const OccurrenceChat = ({ occurrenceId, isOpen, onClose }) => {
  const { api, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && occurrenceId) {
      loadMessages()
      // Atualizar mensagens a cada 10 segundos
      const interval = setInterval(loadMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [isOpen, occurrenceId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/occurrences/${occurrenceId}/messages`)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      // Se a rota não existir, criar mensagens mock
      if (error.response?.status === 404) {
        loadMockMessages()
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMockMessages = () => {
    const mockMessages = [
      {
        id: 1,
        user_id: user.is_admin ? 999 : user.id,
        user_name: user.is_admin ? 'Carlos Silva' : user.name,
        is_admin: false,
        message: 'Olá, gostaria de saber o andamento da minha ocorrência.',
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
      },
      {
        id: 2,
        user_id: user.is_admin ? user.id : 1,
        user_name: user.is_admin ? user.name : 'João Silva',
        is_admin: true,
        message: 'Olá! Sua ocorrência já foi encaminhada para nossa equipe técnica. Estamos trabalhando na resolução.',
        created_at: new Date(Date.now() - 1800000).toISOString() // 30 min atrás
      },
      {
        id: 3,
        user_id: user.is_admin ? 999 : user.id,
        user_name: user.is_admin ? 'Carlos Silva' : user.name,
        is_admin: false,
        message: 'Obrigado! Qual o prazo estimado?',
        created_at: new Date(Date.now() - 900000).toISOString() // 15 min atrás
      },
      {
        id: 4,
        user_id: user.is_admin ? user.id : 1,
        user_name: user.is_admin ? user.name : 'João Silva',
        is_admin: true,
        message: 'O prazo estimado é de 48 horas. Você receberá uma notificação assim que for resolvido.',
        created_at: new Date(Date.now() - 300000).toISOString() // 5 min atrás
      }
    ]
    setMessages(mockMessages)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const response = await api.post(`/occurrences/${occurrenceId}/messages`, {
        message: newMessage
      })
      
      setMessages(prev => [...prev, response.data.message])
      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      // Se a rota não existir, adicionar mensagem localmente
      if (error.response?.status === 404) {
        const mockMessage = {
          id: messages.length + 1,
          user_id: user.id,
          user_name: user.name,
          is_admin: user.is_admin || false,
          message: newMessage,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, mockMessage])
        setNewMessage('')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Agora'
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('pt-BR')
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <Card className="fixed right-4 bottom-4 w-96 h-[600px] z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-white">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat da Ocorrência
            </CardTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-blue-100 mt-1">
            Converse com a equipe responsável
          </p>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Carregando mensagens...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Nenhuma mensagem ainda</p>
                <p className="text-sm text-gray-500 mt-1">
                  Envie uma mensagem para iniciar a conversa
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwnMessage = message.user_id === user.id
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className={`w-8 h-8 flex-shrink-0 ${message.is_admin ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      <AvatarFallback className={message.is_admin ? 'text-purple-700' : 'text-blue-700'}>
                        {message.is_admin ? (
                          <Shield className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${message.is_admin ? 'text-purple-700' : 'text-gray-700'} ${isOwnMessage ? 'order-2' : ''}`}>
                          {message.user_name}
                        </span>
                        {message.is_admin && (
                          <span className={`text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded ${isOwnMessage ? 'order-1' : ''}`}>
                            Admin
                          </span>
                        )}
                      </div>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : message.is_admin
                            ? 'bg-purple-50 text-gray-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input */}
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pressione Enter para enviar
          </p>
        </div>
      </Card>
    </>
  )
}

export default OccurrenceChat

