import React, { useState, useEffect } from 'react';
import type { AdminUser, UserPayload } from '../../services/api';
import { toast } from 'react-hot-toast';

interface UserFormModalProps {
    user: AdminUser | null; // User to be edited. null means new user.
    onClose: () => void;
    onSave: (userData: UserPayload, userId: number | null) => Promise<void>;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<UserPayload>({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        is_staff: false,
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            // If we're editing an existing user, populate the form data.
            // Password field is not filled for security reasons.
            setFormData({
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                is_staff: user.is_staff,
                is_active: user.is_active,
                password: '', // Password not shown
            });
        } else {
            // Reset form in new user mode
            setFormData({
                username: '',
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                is_staff: false,
                is_active: true,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user && !formData.password) {
            toast.error('Password is required for new user.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = { ...formData };
            if (user) {
                if (!payload.password) {
                    delete payload.password;
                }
            }
            await onSave(payload, user ? user.id : null);
            onClose(); 
        } catch (error) {
            // onSave function will show toast internally, no need to show again here.
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalBackdropStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1050,
    };

    const modalContentStyle: React.CSSProperties = {
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        width: '500px',
        maxWidth: '95%',
        boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        boxSizing: 'border-box',
        marginTop: '4px',
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: '600',
        fontSize: '14px',
        color: '#334155'
    };

    const checkboxContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
    };

    return (
        <div style={modalBackdropStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                                    <h2 style={{marginTop: 0, marginBottom: '24px'}}>{user ? 'Edit User' : 'Create New User'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                        <div>
                                                            <label style={labelStyle}>Name</label>
                            <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                                                            <label style={labelStyle}>Surname</label>
                            <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>
                    <div>
                                                        <label style={labelStyle}>Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} placeholder={user ? 'Fill in to change' : ''} />
                    </div>
                    <div style={{display: 'flex', gap: '24px'}}>
                        <div style={checkboxContainerStyle}>
                            <input type="checkbox" id="is_staff" name="is_staff" checked={formData.is_staff} onChange={handleChange} style={{width: '16px', height: '16px'}} />
                            <label htmlFor="is_staff" style={{...labelStyle, marginBottom: 0}}>Admin Privileges</label>
                        </div>
                        <div style={checkboxContainerStyle}>
                            <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} style={{width: '16px', height: '16px'}} />
                            <label htmlFor="is_active" style={{...labelStyle, marginBottom: 0}}>Account Active</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" onClick={onClose} style={{padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent'}}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} style={{padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white'}}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal; 