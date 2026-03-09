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

const ProtectedRoute = ({ children }) => {
    // In cookie-based auth, we might not have a token in localStorage
    const isAuthenticated = !!localStorage.getItem('token') || !!localStorage.getItem('isAuthenticated');
    return isAuthenticated ? children : <Navigate to="/auth/login" />;
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
            { path: 'drivers', element: <Drivers /> },
            { path: 'helpers', element: <Helpers /> },
            { path: 'vehicles', element: <Vehicles /> },
            { path: 'clients', element: <Clients /> },
            { path: 'assignments', element: <Assignments /> },
            { path: 'reports', element: <DailyReports /> },
        ],
    },
]);
