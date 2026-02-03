import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Users
} from 'lucide-react'

const AdminUsers = () => {
  const { api } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, admin, citizen
  
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    citizens: 0
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Carregar todos os usuários do banco
      const response = await api.get('/occurrences?per_page=1000')
      console.log('Resposta da API:', response.data)
      
      // Extrair usuários únicos das ocorrências
      const occurrences = response.data.occurrences || []
      const usersMap = new Map()
      
      occurrences.forEach(occ => {
        if (occ.citizen && !usersMap.has(occ.citizen.id)) {
          usersMap.set(occ.citizen.id, {
            id: occ.citizen.id,
            name: occ.citizen.name,
            email: occ.citizen.email,
            phone: occ.citizen.phone,
            is_admin: false,
            created_at: occ.created_at
          })
        }
        
        if (occ.assigned_to_user && !usersMap.has(occ.assigned_to_user.id)) {
          usersMap.set(occ.assigned_to_user.id, {
            id: occ.assigned_to_user.id,
            name: occ.assigned_to_user.name,
            email: `${occ.assigned_to_user.name.toLowerCase().replace(/ /g, '.')}@lavras.mg.gov.br`,
            phone: '',
            is_admin: true,
            department: occ.assigned_to_user.department,
            created_at: occ.created_at
          })
        }
      })
      
      const allUsers = Array.from(usersMap.values())
      setUsers(allUsers)
      
      // Calcular estatísticas
      const admins = allUsers.filter(u => u.is_admin).length
      const citizens = allUsers.filter(u => !u.is_admin).length
      
      setStats({
        total: allUsers.length,
        admins,
        citizens
      })
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = 
      filterType === 'all' ||
      (filterType === 'admin' && user.is_admin) ||
      (filterType === 'citizen' && !user.is_admin)
    
    return matchesSearch && matchesType
  })

  const getUserTypeColor = (isAdmin) => {
    return isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  const getUserTypeText = (isAdmin) => {
    return isAdmin ? 'Administrador' : 'Cidadão'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie usuários administrativos e cidadãos do sistema</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Administrador
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total de Usuários</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Administradores</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.admins}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Cidadãos</p>
                  <p className="text-3xl font-bold text-green-700">{stats.citizens}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Buscar Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={filterType === 'admin' ? 'default' : 'outline'}
                  onClick={() => setFilterType('admin')}
                >
                  Admins
                </Button>
                <Button
                  variant={filterType === 'citizen' ? 'default' : 'outline'}
                  onClick={() => setFilterType('citizen')}
                >
                  Cidadãos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            ⚠️ {error}
          </div>
        )}

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <Badge className={getUserTypeColor(user.is_admin)}>
                            {getUserTypeText(user.is_admin)}
                          </Badge>
                          {user.department && (
                            <Badge className="bg-gray-100 text-gray-800">
                              {user.department}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Cadastro: {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        {!user.is_admin && (
                          <Button variant="outline" size="sm" className="text-red-600">
                            Desativar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminUsers

