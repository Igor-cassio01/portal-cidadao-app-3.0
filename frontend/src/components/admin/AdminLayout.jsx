import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  LayoutDashboard,
  AlertTriangle,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  TrendingUp,
  FileCheck
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    {
      name: 'Triagem',
      href: '/admin/triage',
      icon: TrendingUp,
      current: location.pathname === '/admin/triage',
      highlight: true, // Para destacar a nova funcionalidade
    },
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin'
    },
    {
      name: 'Ocorrências',
      href: '/admin/occurrences',
      icon: AlertTriangle,
      current: location.pathname === '/admin/occurrences'
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users'
    },
    {
      name: 'Relatórios',
      href: '/admin/reports',
      icon: BarChart3,
      current: location.pathname === '/admin/reports'
    },
    {
      name: 'Validação',
      href: '/admin/validation',
      icon: FileCheck,
      current: location.pathname === '/admin/validation',
      highlight: true,
    },
    {
      name: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname === '/admin/settings'
    }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getNavItemClasses = (item) => {
    if (item.current) {
      if (item.highlight) {
        return 'bg-green-100 text-green-700'
      }
      return 'bg-blue-100 text-blue-700'
    }
    return 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Admin Portal</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${getNavItemClasses(item)}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.highlight && (
                    <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      NOVO
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">Admin Portal</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${getNavItemClasses(item)}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.highlight && (
                    <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      NOVO
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
                Painel Administrativo
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notificações */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Menu do usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {getInitials(user?.name || 'Admin')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.department?.name}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
