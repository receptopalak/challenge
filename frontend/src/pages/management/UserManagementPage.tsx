import React, { useState, useEffect } from 'react';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword, // resetPassword import et
    type AdminUser,
    type UserPayload
} from '../../services/api';
import { toast } from 'react-hot-toast';
import UserFormModal from './UserFormModal'; // Modal bileşenini import et

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            toast.error('An error occurred while fetching users.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (user: AdminUser | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData: UserPayload, userId: number | null) => {
        try {
            if (userId) {
                // Update user
                await updateUser(userId, userData);
                toast.success('User successfully updated.');
            } else {
                // Create new user
                await createUser(userData);
                toast.success('User successfully created.');
            }
            fetchUsers(); // Refresh the list
        } catch (error: any) {
            const errorMsg = error.response?.data?.username?.[0] || 'An error occurred.';
            toast.error(`Save failed: ${errorMsg}`);
            // Prevent modal from closing by throwing an error
            throw new Error(`Save failed: ${errorMsg}`);
        }
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (window.confirm(`Are you sure you want to delete the user named '${username}'? This action cannot be undone.`)) {
            try {
                await deleteUser(userId);
                toast.success('User successfully deleted.');
                fetchUsers(); // Refresh the list
            } catch (error) {
                toast.error('An error occurred while deleting the user.');
            }
        }
    };

    const handleResetPassword = async (userId: number, username: string) => {
        const newPassword = window.prompt(`Enter new password for '${username}':`);
        if (newPassword) {
            if (newPassword.length < 8) {
                toast.error('Parola en az 8 karakter olmalıdır.');
                return;
            }
            try {
                await resetPassword(userId, newPassword);
                toast.success('Parola başarıyla sıfırlandı.');
            } catch (error) {
                toast.error('An error occurred while resetting the password.');
            }
        }
    };


    const pageHeaderStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 18px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#16a34a',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    };

    const tableContainerStyle: React.CSSProperties = {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
    };

    const thStyle: React.CSSProperties = {
        padding: '12px 16px',
        textAlign: 'left',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        borderBottom: '1px solid #e2e8f0',
    };

    const tdStyle: React.CSSProperties = {
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        color: '#334155',
        fontSize: '14px',
    };

    const badgeStyle: (isStaff: boolean) => React.CSSProperties = (isStaff) => ({
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: 'white',
        backgroundColor: isStaff ? '#7c3aed' : '#2563eb',
    });

    const actionButtonStyle: React.CSSProperties = {
        marginRight: '8px',
        padding: '6px 10px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500'
    };


    if (isLoading) {
        return <div>Loading users...</div>;
    }

    return (
        <div>
            <div style={pageHeaderStyle}>
                <h1 style={titleStyle}>User Management</h1>
                <button
                    style={buttonStyle}
                    onClick={() => handleOpenModal(null)} // Open modal for new user
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                    + Add New User
                </button>
            </div>

            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Username</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Authority</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Registration Date</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td style={tdStyle}>{user.id}</td>
                                <td style={tdStyle}>{user.username}</td>
                                <td style={tdStyle}>{`${user.first_name} ${user.last_name}`}</td>
                                <td style={tdStyle}>{user.email}</td>
                                <td style={tdStyle}>
                                    <span style={badgeStyle(user.is_staff)}>
                                        {user.is_staff ? 'Admin' : 'Pilot'}
                                    </span>
                                </td>
                                <td style={tdStyle}>{user.is_active ? 'Active' : 'Passive'}</td>
                                <td style={tdStyle}>{new Date(user.date_joined).toLocaleDateString()}</td>
                                <td style={tdStyle}>
                                    <button
                                        style={{ ...actionButtonStyle, backgroundColor: '#f59e0b', color: 'white' }}
                                        onClick={() => handleOpenModal(user)} // Open modal for editing
                                    >
                                        Edit
                                    </button>
                                    <button
                                        style={{ ...actionButtonStyle, backgroundColor: '#3b82f6', color: 'white' }}
                                        onClick={() => handleResetPassword(user.id, user.username)}
                                    >
                                        Reset Password
                                    </button>
                                    <button
                                        style={{ ...actionButtonStyle, backgroundColor: '#ef4444', color: 'white' }}
                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserFormModal
                    user={editingUser}
                    onClose={handleCloseModal}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

export default UserManagementPage; 