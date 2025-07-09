import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await auth.login(username, password);
            // Redirect after successful login
            navigate(from, { replace: true });
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pageStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#111827',
        color: '#f9fafb',
        fontFamily: 'Inter, sans-serif',
    };

    const formContainerStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '400px',
        padding: '48px',
        backgroundColor: '#1f2937',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '32px',
        color: 'white',
    };

    const formStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    };
    
    const inputGroupStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
    };

    const labelStyle: React.CSSProperties = {
        marginBottom: '8px',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#d1d5db',
    };

    const inputStyle: React.CSSProperties = {
        padding: '12px 16px',
        backgroundColor: '#374151',
        border: '1px solid #4b5563',
        borderRadius: '8px',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '12px',
        marginTop: '16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        opacity: isSubmitting ? 0.7 : 1,
    };

    const errorStyle: React.CSSProperties = {
        color: '#f87171',
        textAlign: 'center',
        marginTop: '16px',
    };

    return (
        <div style={pageStyle}>
            <div style={formContainerStyle}>
                <h1 style={titleStyle}>Fleet Management</h1>
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={inputGroupStyle}>
                        <label htmlFor="username" style={labelStyle}>Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <label htmlFor="password" style={labelStyle}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    {error && <p style={errorStyle}>{error}</p>}
                    <button type="submit" style={buttonStyle} disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage; 