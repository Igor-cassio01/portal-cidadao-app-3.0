import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Settings,
  Tag,
  Building2,
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

const AdminSettings = () => {
  const { api } = useAuth()
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [categoriesRes, departmentsRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/departments')
      ])
      
      setCategories(categoriesRes.data.categories || [])
      setDepartments(departmentsRes.data.departments || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">Configurações gerais do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categorias */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Categorias
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Departamentos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Departamentos
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{department.name}</p>
                      <p className="text-sm text-gray-600">{department.description}</p>
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {department.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SLAs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                SLAs (Tempo de Resposta)
              </CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo SLA
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-red-100 text-red-800">Alta Prioridade</Badge>
                    <Clock className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-700">24h</p>
                  <p className="text-sm text-gray-600">Tempo máximo de resposta</p>
                </div>

                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Média Prioridade</Badge>
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">72h</p>
                  <p className="text-sm text-gray-600">Tempo máximo de resposta</p>
                </div>

                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-100 text-green-800">Baixa Prioridade</Badge>
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">7 dias</p>
                  <p className="text-sm text-gray-600">Tempo máximo de resposta</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-2">💡 Dica:</h4>
                <p className="text-sm text-gray-700">
                  Os SLAs são usados para calcular automaticamente se uma ocorrência está dentro do prazo esperado.
                  Configure tempos realistas para cada nível de prioridade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Sistema
                </label>
                <Input defaultValue="Portal do Cidadão - Lavras" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contato
                </label>
                <Input defaultValue="contato@lavras.mg.gov.br" type="email" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone de Contato
                </label>
                <Input defaultValue="(35) 3829-1000" type="tel" />
              </div>

              <div className="flex gap-4">
                <Button>Salvar Alterações</Button>
                <Button variant="outline">Cancelar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings

