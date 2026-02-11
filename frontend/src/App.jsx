import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

// Componentes de autenticação
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Componentes do painel administrativo
import AdminDashboard from './pages/admin/AdminDashboardNew'
import AdminOccurrences from './pages/admin/AdminOccurrences'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'
import AdminTriagePage from './pages/admin/AdminTriagePage'
import DepartmentManagerValidation from './pages/admin/DepartmentManagerValidation'

// Componentes do portal do cidadão
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import CitizenOccurrences from './pages/citizen/CitizenOccurrences'
import CitizenMap from './pages/citizen/CitizenMap'
import CitizenProfile from './pages/citizen/CitizenProfile'
import CreateOccurrence from './pages/citizen/CreateOccurrence'
import OccurrenceDetail from './pages/citizen/OccurrenceDetail'

// Páginas públicas
import BeforeAfter from './pages/public/BeforeAfter'

// Componentes do prestador de serviço
import ServiceProviderDashboard from './pages/service-provider/ServiceProviderDashboard'

// Componente de proteção de rotas
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()

  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'adminOnly:', adminOnly)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute - Usuário não encontrado, redirecionando para login')
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.user_type !== 'admin') {
    console.log('ProtectedRoute - Usuário não é admin, redirecionando para citizen')
    return <Navigate to="/citizen" replace />
  }

  console.log('ProtectedRoute - Acesso permitido')
  return children
}

// Componente de redirecionamento baseado no tipo de usuário
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.user_type === 'admin' || user.user_type === 'department_manager') {
    return <Navigate to="/admin" replace />
  } else if (user.user_type === 'service_provider') {
    return <Navigate to="/service-provider" replace />
  } else {
    return <Navigate to="/citizen" replace />
  }
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Rota raiz - redireciona baseado no tipo de usuário */}
        <Route path="/" element={<RoleBasedRedirect />} />
        
        {/* Rotas de autenticação */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rotas públicas */}
        <Route path="/antes-depois" element={<BeforeAfter />} />
        
        {/* Rotas do painel administrativo */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/occurrences" 
          element={
            <ProtectedRoute adminOnly>
              <AdminOccurrences />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute adminOnly>
              <AdminReports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute adminOnly>
              <AdminSettings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/triage" 
          element={
            <ProtectedRoute adminOnly>
              <AdminTriagePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/validation" 
          element={
            <ProtectedRoute adminOnly>
              <DepartmentManagerValidation />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas do portal do cidadão */}
        <Route 
          path="/citizen" 
          element={
            <ProtectedRoute>
              <CitizenDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/occurrences" 
          element={
            <ProtectedRoute>
              <CitizenOccurrences />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/create" 
          element={
            <ProtectedRoute>
              <CreateOccurrence />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/map" 
          element={
            <ProtectedRoute>
              <CitizenMap />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/profile" 
          element={
            <ProtectedRoute>
              <CitizenProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/occurrence/:id" 
          element={
            <ProtectedRoute>
              <OccurrenceDetail />
            </ProtectedRoute>
          } 
        />

        {/* Rotas do prestador de serviço */}
        <Route 
          path="/service-provider" 
          element={
            <ProtectedRoute>
              <ServiceProviderDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
