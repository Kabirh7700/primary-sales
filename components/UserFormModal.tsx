import React, { useState, useEffect } from 'react';
import type { User } from '../types';

type UserFormModalProps = {
    mode: 'add' | 'edit';
    initialData: User | null;
    onClose: () => void;
    onSave: (data: any) => void;
};

export const UserFormModal: React.FC<UserFormModalProps> = ({ mode, initialData, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Sales Person' | 'Intern' | 'Admin'>('Sales Person');

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setName(initialData.name);
            setRole(initialData.role);
            setPassword(''); // Password is not pre-filled for security
        } else {
            setName('');
            setPassword('');
            setRole('Sales Person');
        }
    }, [mode, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !role || (mode === 'add' && !password)) {
            alert('Please fill in all required fields.');
            return;
        }
        onSave({ name, password, role });
    };

    const title = mode === 'add' ? 'Add New User' : `Edit User: ${initialData?.name}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-600 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Sales Person">Sales Person</option>
                            <option value="Intern">Intern</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                            Password {mode === 'add' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={mode === 'add'}
                            placeholder={mode === 'edit' ? 'Leave blank to keep unchanged' : ''}
                            className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
