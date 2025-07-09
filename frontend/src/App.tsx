import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const headerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 1002,
    display: 'flex',
    flexDirection: 'column', 
    alignItems: 'stretch',
    gap: '12px', 
    background: 'rgba(15, 23, 42, 0.9)',
    padding: '12px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const userBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    color: '#e2e8f0',
  }
  
  const userInfoStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
  };

  const roleBadgeStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    background: user?.is_staff ? '#8b5cf6' : '#3b82f6',
    color: 'white',
    marginLeft: '8px',
  };

  const logoutButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
  };

  const navButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    color: '#e2e8f0',
    textAlign: 'center',
  };

  // Hide header on pages other than Map or Management Panel
  const showHeader = location.pathname.startsWith('/') || location.pathname.startsWith('/manage');

  if (!user && !location.pathname.includes('/login')) {
            // If no user and not on login page, show nothing or loading state
    return null;
  }
  
  return (
    <>
      {showHeader && user && (
        <header style={headerStyle}>
          <div style={userBoxStyle}>
              <div style={userInfoStyle}>
              {user?.username}
              <span style={roleBadgeStyle}>{user?.is_staff ? 'Admin' : 'Pilot'}</span>
              </div>
              <button 
              onClick={handleLogout} 
              style={logoutButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
              >
                                  Logout
              </button>
          </div>

          {!location.pathname.startsWith('/manage') && (
            <button
              onClick={() => navigate(location.pathname === '/' ? '/history' : '/')}
              style={navButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.3)'}
            >
                                {location.pathname === '/' ? 'Command History' : 'Map'}
            </button>
          )}

          {user?.is_staff && (
            <button
              onClick={() => navigate('/manage')}
              style={navButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.3)'}
            >
              Management Panel
            </button>
          )}
        </header>
      )}
      
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default App;