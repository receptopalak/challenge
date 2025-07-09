import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // A loading screen can be displayed while checking login status.
        // This prevents the page from flashing briefly.
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111827', color: 'white' }}>
                <h1>Yükleniyor...</h1>
            </div>
        );
    }

    if (!user) {
            // If user is not logged in, redirect them to login page.
    // We pass the location information (where they wanted to go) as state so
    // they can return there after logging in.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is logged in, render the desired component (child).
    return children;
};

export default ProtectedRoute; 