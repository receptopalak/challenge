import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const ManagementLayout: React.FC = () => {
    const layoutStyle: React.CSSProperties = {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
    };

    const sidebarStyle: React.CSSProperties = {
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
    };

    const contentStyle: React.CSSProperties = {
        flexGrow: 1,
        padding: '32px',
        overflowY: 'auto',
    };

    const navLinkStyle: React.CSSProperties = {
        padding: '12px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: '#334155',
        fontWeight: '500',
        transition: 'background-color 0.2s',
    };
    
    const activeNavLinkStyle: React.CSSProperties = {
        ...navLinkStyle,
        backgroundColor: '#e0f2fe',
        color: '#0284c7',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '20px',
        color: '#1e293b',
    };

    return (
        <div style={layoutStyle}>
            <nav style={sidebarStyle}>
                <h1 style={titleStyle}>Management Panel</h1>
                <NavLink
                    to="/manage/users"
                    style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
                >
                                                    User Management
                </NavLink>
                <NavLink
                    to="/manage/planes"
                    style={({ isActive }) => (isActive ? activeNavLinkStyle : navLinkStyle)}
                >
                    Fleet Management
                </NavLink>
                <NavLink
                    to="/"
                    style={navLinkStyle}
                >
                    &larr; Back to Map
                </NavLink>
            </nav>
            <main style={contentStyle}>
                <Outlet />
            </main>
        </div>
    );
};

export default ManagementLayout; 