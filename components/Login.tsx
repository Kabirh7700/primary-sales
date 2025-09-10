import React, { useState, useEffect } from 'react';
import { ADMIN_USER } from '../constants';
import { authenticateUser, fetchLoginData } from '../services/apiService';

interface LoginProps {
  onLogin: (user: string, role: 'salesPerson' | 'intern' | 'admin') => void;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const PasswordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002 2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);


export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [interns, setInterns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [role, setRole] = useState<'salesPerson' | 'intern'>('salesPerson');

  useEffect(() => {
    const loadLoginData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLoginData();
        setSalesPersons(data.salesPersons);
        setInterns(data.interns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user lists.');
      } finally {
        setIsLoading(false);
      }
    };
    loadLoginData();
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) return;
    
    setIsLoggingIn(true);
    setLoginError(null);

    const roleForAuth = selectedUser === ADMIN_USER ? 'Admin' : (role === 'salesPerson' ? 'Sales Person' : 'Intern');
    const roleForApp: 'salesPerson' | 'intern' | 'admin' = selectedUser === ADMIN_USER ? 'admin' : role;

    try {
        await authenticateUser(selectedUser, password, roleForAuth);
        onLogin(selectedUser, roleForApp);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown login error occurred.';
        setLoginError(errorMessage);
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleRoleChange = (newRole: 'salesPerson' | 'intern') => {
      setRole(newRole);
      setSelectedUser('');
      setPassword('');
      setLoginError(null);
  }
  
  const currentUsers = role === 'salesPerson' ? [...salesPersons, ADMIN_USER] : interns;
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-animation p-4 font-sans">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden md:flex">
        
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gray-800 text-white p-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4 animate-[fade-in-down_1s_ease-out]">Primary Sales Dashboard</h1>
            <p className="text-lg text-gray-300 animate-[fade-in-up_1s_ease-out]">Your gateway to smarter selling and seamless tracking.</p>
            <div className="mt-8 w-3/4 h-px bg-gray-600"></div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
            <p className="text-gray-500 mb-8">Please select your name and enter your password.</p>

            {isLoading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Loading users...</span>
                </div>
            )}
            
            {error && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                 </div>
            )}

            {!isLoading && !error && (
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Login As</label>
                        <div className="flex border border-gray-300 rounded-lg p-1 bg-gray-100">
                            <button type="button" onClick={() => handleRoleChange('salesPerson')}
                                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${role === 'salesPerson' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                                Sales Person
                            </button>
                            <button type="button" onClick={() => handleRoleChange('intern')}
                                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${role === 'intern' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                                Intern
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">Select Your Name</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><UserIcon /></span>
                            <select id="user-select" value={selectedUser}
                                onChange={(e) => { setSelectedUser(e.target.value); setLoginError(null); setPassword(''); }}
                                className="w-full pl-10 pr-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                required
                            >
                                <option value="" disabled>-- Select Your Name --</option>
                                {currentUsers.map(person => (
                                    <option key={person} value={person}>{person}</option>
                                ))}
                            </select>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                         <div className="relative group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><PasswordIcon /></span>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your password" required
                            />
                        </div>
                    </div>
                    
                    {loginError && (
                         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg" role="alert">
                            <p>{loginError}</p>
                         </div>
                    )}

                    <button type="submit" disabled={!selectedUser || isLoggingIn}
                        className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        {isLoggingIn ? 'Verifying...' : 'Login'}
                    </button>
                </form>
            )}
             <footer className="text-center mt-12 text-gray-400 text-xs">
                <p>&copy; {new Date().getFullYear()} Sales Dashboard. All rights reserved.</p>
            </footer>
        </div>

      </div>
    </div>
  );
};