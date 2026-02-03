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
  LogOut,
  Menu,
  X,
  Wrench,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const ServiceProviderLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    {
      name: 'Minhas Atribuições',
      href: '/service-provider',
      icon: Wrench,
      current: location.pathname === '/service-provider',
    },
    // Outras rotas futuras para o prestador de serviço
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
      return 'bg-blue-100 text-blue-700'
    }
    return 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-16 shrink-0 items-center px-4 border-b">
        <Building2 className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-lg font-semibold text-gray-900">Prestador de Serviço</span>
      </div>
      <nav className="flex flex-1 flex-col space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${getNavItemClasses(item)}`}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="mr-3 h-6 w-6 shrink-0" aria-hidden="true" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>

      <div className="lg:pl-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir menu lateral</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>

          <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="-m-1.5 flex items-center p-1.5"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user ? getInitials(user.name) : 'SP'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                        {user?.name}
                      </span>
                      <X className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ServiceProviderLayout
