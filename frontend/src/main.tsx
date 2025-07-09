import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App';
import MapComponent from './components/MapComponent';
import LoginPage from './pages/LoginPage';
import ManagementLayout from './pages/management/ManagementLayout'; // Doğru import
import PlaneManagementPage from './pages/management/PlaneManagementPage';
import UserManagementPage from './pages/management/UserManagementPage';
import HistoryPage from './pages/HistoryPage'; // HistoryPage'i import et
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Yükleniyor...</div>; // veya bir spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};


const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <MapComponent />,
      },
      {
        path: 'history', // history rotasını ekle
        element: <HistoryPage />,
      },
      {
        path: 'manage',
        element: <ManagementLayout />, // Doğru bileşeni kullan
        children: [
          {
            index: true, // /manage için varsayılan alt rota
            element: <PlaneManagementPage />,
          },
          {
            path: 'planes',
            element: <PlaneManagementPage />,
          },
          {
            path: 'users',
            element: <UserManagementPage />,
          },
        ]
      }
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
