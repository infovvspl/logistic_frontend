import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import DashboardHome from '../pages/dashboard/DashboardHome';
import Drivers from '../pages/dashboard/Drivers';
import Helpers from '../pages/dashboard/Helpers';
import Vehicles from '../pages/dashboard/Vehicles';
import Clients from '../pages/dashboard/Clients';
import Assignments from '../pages/dashboard/Assignments';
import DailyReports from '../pages/dashboard/DailyReports';
import CreateAdmin from '../pages/dashboard/CreateAdmin';
import Items from '../pages/dashboard/Items';
import InventoryCategories from '../pages/dashboard/InventoryCategories';
import InventorySuppliers from '../pages/dashboard/InventorySuppliers';
import InventoryTransactions from '../pages/dashboard/InventoryTransactions';
import Purchases from '../pages/dashboard/Purchases';
import Inventory from '../pages/dashboard/Inventory';

const ProtectedRoute = ({ children }) => {
    // In cookie-based auth, we might not have a token in localStorage
    const isAuthenticated = !!localStorage.getItem('token') || !!localStorage.getItem('isAuthenticated');
    return isAuthenticated ? children : <Navigate to="/auth/login" />;
};

const RoleProtectedRoute = ({ children, allowedRole }) => {
    const isAuthenticated = !!localStorage.getItem('token') || !!localStorage.getItem('isAuthenticated');
    const userRole = localStorage.getItem('userRole');

    if (!isAuthenticated) return <Navigate to="/auth/login" />;
    if (userRole !== allowedRole) return <Navigate to="/dashboard" replace />;

    return children;
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
    },
    {
        path: '/auth',
        element: <AuthLayout />,
        children: [
            { path: 'login', element: <Login /> },
            { path: 'signup', element: <Signup /> },
        ],
    },
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <DashboardHome /> },
            {
                path: 'create-admin',
                element: (
                    <RoleProtectedRoute allowedRole="superadmin">
                        <CreateAdmin />
                    </RoleProtectedRoute>
                )
            },
            { path: 'drivers', element: <Drivers /> },
            { path: 'helpers', element: <Helpers /> },
            { path: 'vehicles', element: <Vehicles /> },
            { path: 'clients', element: <Clients /> },
            { path: 'assignments', element: <Assignments /> },
            { path: 'reports', element: <DailyReports /> },
            { path: 'inventory', element: <Inventory /> },
            { path: 'inventory/items', element: <Items /> },
            { path: 'inventory/categories', element: <InventoryCategories /> },
            { path: 'inventory/suppliers', element: <InventorySuppliers /> },
            { path: 'inventory/transactions', element: <InventoryTransactions /> },
            { path: 'inventory/purchases', element: <Purchases /> },
        ],
    },
]);
