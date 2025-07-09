import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom'; // Düzeltme: type-only import
import { useAuth } from '../contexts/AuthContext';
import ManagementLayout from '../pages/management/ManagementLayout';
import UserManagementPage from '../pages/management/UserManagementPage';
import PlaneManagementPage from '../pages/management/PlaneManagementPage';

const AdminRouteWrapper: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Yükleniyor...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (!user.is_staff) {
        return <Navigate to="/" replace />;
    }
    
            // For authorized users, render ManagementLayout and the Outlet inside it
    return <ManagementLayout />;
};


export const adminRoutes: RouteObject = {
    path: 'manage',
    // Rota elementi olarak AdminRouteWrapper'ı kullanıyoruz.
            // This wrapper both checks authorization and renders the layout if successful.
    element: <AdminRouteWrapper />,
    children: [
        { index: true, element: <Navigate to="users" replace /> },
        { path: 'users', element: <UserManagementPage /> },
        { path: 'planes', element: <PlaneManagementPage /> },
    ],
}; 