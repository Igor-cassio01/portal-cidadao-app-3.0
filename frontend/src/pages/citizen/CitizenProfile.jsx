import React, { useState, useEffect } from 'react'
import CitizenLayout from '../../components/citizen/CitizenLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react'

const CitizenProfile = () => {
  const { user, api } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Dados pessoais
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  // Dados de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Validação básica
      if (!profileData.name || !profileData.email) {
        setMessage({
          type: 'error',
          text: 'Nome e email são obrigatórios'
        })
        return
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileData.email)) {
        setMessage({
          type: 'error',
          text: 'Email inválido'
        })
        return
      }

      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso! (API em desenvolvimento)'
      })

      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 5000)

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao atualizar perfil'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setMessage({
          type: 'error',
          text: 'Todos os campos de senha são obrigatórios'
        })
        return
      }

      if (passwordData.newPassword.length < 6) {
        setMessage({
          type: 'error',
          text: 'A nova senha deve ter no mínimo 6 caracteres'
        })
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({
          type: 'error',
          text: 'As senhas não coincidem'
        })
        return
      }

      setMessage({
        type: 'success',
        text: 'Senha alterada com sucesso! (API em desenvolvimento)'
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 5000)

    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao alterar senha'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CitizenLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>

        {message.text && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="pl-10"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="pl-10"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="pl-10"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      className="pl-10"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Atual *</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 pr-10"
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nova Senha *</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 pr-10"
                      placeholder="Digite a nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="pl-10 pr-10"
                      placeholder="Confirme a nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" variant="outline" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo de Conta:</span>
                <span className="ml-2 font-semibold">Cidadão</span>
              </div>
              <div>
                <span className="text-gray-600">Membro desde:</span>
                <span className="ml-2 font-semibold">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  )
}

export default CitizenProfile

