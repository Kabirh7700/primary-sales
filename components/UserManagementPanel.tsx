import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { fetchUsers, addUser, updateUser, deleteUser } from '../services/apiService';
import { LoadingSpinner } from './LoadingSpinner';
import { UserFormModal } from './UserFormModal';

export const UserManagementPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await fetchUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleOpenModal = (mode: 'add' | 'edit', user: User | null = null) => {
        setModalMode(mode);
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSaveUser = async (userData: any) => {
        try {
            if (modalMode === 'add') {
                await addUser(userData);
            } else if (currentUser) {
                await updateUser({ ...currentUser, ...userData });
            }
            handleCloseModal();
            await loadUsers(); // Refresh the list
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred.');
        }
    };
    
    const handleDeleteUser = async (user: User) => {
        if (window.confirm(`Are you sure you want to delete the user "${user.name}"? This action cannot be undone.`)) {
            try {
                await deleteUser(user.userRow);
                await loadUsers(); // Refresh the list
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete user.');
            }
        }
    };

    const renderContent = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <div className="text-center text-red-500">{error}</div>;

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Password</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.userRow} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4">{user.role}</td>
                                <td className="px-6 py-4 font-mono text-gray-700">{user.password}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleOpenModal('edit', user)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                    {user.name !== 'Admin' && (
                                        <button onClick={() => handleDeleteUser(user)} className="font-medium text-red-600 hover:underline">Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <p className="mt-1 text-gray-500">Add, edit, or remove users from the system.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">All Users</h2>
                    <button
                        onClick={() => handleOpenModal('add')}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow"
                    >
                        + Add New User
                    </button>
                </div>
                {renderContent()}
            </div>
            
            {isModalOpen && (
                <UserFormModal 
                    mode={modalMode}
                    initialData={currentUser}
                    onClose={handleCloseModal}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};