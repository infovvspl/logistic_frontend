import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import Login from '../pages/auth/Login.jsx'
import Signup from '../pages/auth/Signup.jsx'
import Assignments from '../pages/dashboard/Assignments.jsx'
import Clients from '../pages/dashboard/Clients.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import Drivers from '../pages/dashboard/Drivers.jsx'
import Helpers from '../pages/dashboard/Helpers.jsx'
import Vehicles from '../pages/dashboard/Vehicles.jsx'
import { useAuth } from '../hooks/useAuth.js'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return children
}

function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return (
    <Navigate to={isAuthenticated ? '/dashboard' : '/auth/login'} replace />
  )
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-zinc-950 text-zinc-100">
      <div className="max-w-md text-center px-6">
        <p className="text-sm text-zinc-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The page you are looking for does not exist.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="/"
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'drivers', element: <Drivers /> },
      { path: 'helpers', element: <Helpers /> },
      { path: 'vehicles', element: <Vehicles /> },
      { path: 'clients', element: <Clients /> },
      { path: 'assignments', element: <Assignments /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

