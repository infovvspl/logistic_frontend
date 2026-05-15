import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import Login from '../pages/auth/Login.jsx'
import Signup from '../pages/auth/Signup.jsx'
import Assignments from '../pages/dashboard/Assignments.jsx'
import Companies from '../pages/dashboard/Companies.jsx'
import Customers from '../pages/dashboard/Customers.jsx'
import DashboardHome from '../pages/dashboard/DashboardHome.jsx'
import Drivers from '../pages/dashboard/Drivers.jsx'
import Helpers from '../pages/dashboard/Helpers.jsx'
import Vehicles from '../pages/dashboard/Vehicles.jsx'
import Repairs from '../pages/dashboard/Repairs.jsx'
import Admins from '../pages/dashboard/Admins.jsx'
import Roles from '../pages/dashboard/Roles.jsx'
import Trips from '../pages/dashboard/Trips.jsx'
import Places from '../pages/dashboard/Places.jsx'
import Consignments from '../pages/dashboard/Consignments.jsx'
import Metrics from '../pages/dashboard/Metrics.jsx'
import RateCharts from '../pages/dashboard/RateCharts.jsx'
import Challans from '../pages/dashboard/Challans.jsx'
import Bills from '../pages/dashboard/Bills.jsx'
import Ledger from '../pages/dashboard/Ledger.jsx'
import Suppliers from '../pages/dashboard/Suppliers.jsx'
import Products from '../pages/dashboard/Products.jsx'
import Purchase from '../pages/dashboard/Purchase.jsx'
import Attendance from '../pages/dashboard/Attendance.jsx'
import Wages from '../pages/dashboard/Wages.jsx'
import Salary from '../pages/dashboard/Salary.jsx'
import TransactionPurposes from '../pages/dashboard/TransactionPurposes.jsx'
import ProductTransfers from '../pages/dashboard/ProductTransfers.jsx'
import Reports from '../pages/dashboard/Reports.jsx'
import BalanceSheet from '../pages/dashboard/BalanceSheet.jsx'
import Expense from '../pages/dashboard/Expense.jsx'
import Shifts from '../pages/dashboard/Shifts.jsx'
import JsonBuilder from '../pages/dashboard/JsonBuilder.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { usePermissions } from '../hooks/usePermissions.js'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return children
}

function RequireSuperAdmin({ children }) {
  const { isAuthenticated } = useAuth()
  const { isSuperAdmin } = usePermissions()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />
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
      { path: 'admins', element: <RequireSuperAdmin><Admins /></RequireSuperAdmin> },
      { path: 'drivers', element: <Drivers /> },
      { path: 'helpers', element: <Helpers /> },
      { path: 'vehicles', element: <Vehicles /> },
      { path: 'repairs', element: <Repairs /> },
      { path: 'companies', element: <RequireSuperAdmin><Companies /></RequireSuperAdmin> },
      { path: 'customers', element: <Customers /> },
      { path: 'roles', element: <RequireSuperAdmin><Roles /></RequireSuperAdmin> },
      { path: 'clients', element: <Navigate to="/dashboard/customers" replace /> },
      // { path: 'assignments', element: <Assignments /> },
      { path: 'trips', element: <Trips /> },
      { path: 'places', element: <Places /> },
      { path: 'consignments', element: <Consignments /> },
      { path: 'metrics', element: <Metrics /> },
      { path: 'rate-charts', element: <RateCharts /> },
      { path: 'challans', element: <Challans /> },
      { path: 'bills', element: <Bills /> },
      { path: 'ledger', element: <Ledger /> },
      { path: 'expense', element: <Expense /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'products', element: <Products /> },
      { path: 'purchase', element: <Purchase /> },
      { path: 'product-transfers', element: <ProductTransfers /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'wages', element: <Wages /> },
      { path: 'salary', element: <Salary /> },
      { path: 'shifts', element: <RequireSuperAdmin><Shifts /></RequireSuperAdmin> },
      { path: 'transaction-purposes', element: <TransactionPurposes /> },
      { path: 'product-transfers', element: <ProductTransfers /> },
      { path: 'balance-sheet', element: <BalanceSheet /> },
      { path: 'reports/attendance', element: <Reports reportType="attendance" /> },
      { path: 'reports/salary', element: <Reports reportType="salary" /> },
      { path: 'reports/ledger', element: <Reports reportType="ledger" /> },
      { path: 'reports/expense-report', element: <Reports reportType="expense-report" /> },
      { path: 'reports/products', element: <Reports reportType="products" /> },
      // { path: 'reports/purchase', element: <Reports reportType="purchase" /> },
      // { path: 'reports/product-transfers', element: <Reports reportType="product-transfers" /> },
      { path: 'reports/trips', element: <Reports reportType="trips" /> },
      { path: 'reports/bills', element: <Reports reportType="bills" /> },
      { path: 'reports/vehicle-income', element: <Reports reportType="vehicle-income" /> },
      { path: 'reports/vehicle-expenditure', element: <Reports reportType="vehicle-expenditure" /> },
      { path: 'reports/gst', element: <Reports reportType="gst" /> },
      { path: 'reports/shiftwise-work', element: <Reports reportType="shiftwise-work" /> },
      { path: 'reports/userwise', element: <Reports reportType="userwise" /> },
      { path: 'json', element: <JsonBuilder /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

