
import React, { useState, useEffect } from 'react';
import { SearchIcon, BellIcon } from './icons';
import type { Contact } from '../types';
import { ReminderPanel } from './ReminderPanel';
import { ADMIN_USER } from '../constants';

interface HeaderProps {
    user: string;
    onLogout: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    countryFilter: string;
    onCountryFilterChange: (country: string) => void;
    companyFilter: string;
    onCompanyFilterChange: (company: string) => void;
    salesPersonFilter: string;
    onSalesPersonFilterChange: (person: string) => void;
    uniqueCountries: string[];
    uniqueCompanies: string[];
    salesPersons: string[];
    reminders: {
        overdue: Contact[];
        upcoming: Contact[];
    };
    onReminderClick: (contact: Contact) => void;
}

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4a8 8 0 0113.85-5.35M20 20a8 8 0 01-13.85 5.35" />
    </svg>
);

const FilterSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
}> = ({ value, onChange, options, placeholder }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-48 px-3 py-2 text-sm text-gray-700 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none"
    >
        <option value="">{placeholder}</option>
        {options.map(option => (
            <option key={option} value={option}>{option}</option>
        ))}
    </select>
);


export const Header: React.FC<HeaderProps> = ({ 
    user, onLogout, searchQuery, onSearchChange,
    countryFilter, onCountryFilterChange, companyFilter, onCompanyFilterChange,
    salesPersonFilter, onSalesPersonFilterChange, salesPersons,
    uniqueCountries, uniqueCompanies, reminders, onReminderClick
}) => {
    const [isReminderPanelOpen, setIsReminderPanelOpen] = useState(false);
    const overdueCount = reminders.overdue.length;

    useEffect(() => {
        const closePanel = () => setIsReminderPanelOpen(false);
        if (isReminderPanelOpen) {
            window.addEventListener('click', closePanel);
        }
        return () => window.removeEventListener('click', closePanel);
    }, [isReminderPanelOpen]);

    const handleReminderButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsReminderPanelOpen(prev => !prev);
    };
    
    const handleReminderItemClick = (contact: Contact) => {
        onReminderClick(contact);
        setIsReminderPanelOpen(false);
    };

    return (
        <header className="flex-shrink-0 bg-white border-b border-slate-200">
            <div className="px-6 md:px-8 h-auto md:h-16 flex flex-col md:flex-row justify-between items-center py-2 md:py-0 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by Lead, Company, or Person..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full md:w-64 pl-10 pr-4 py-2 text-sm text-gray-700 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>
                    {user === ADMIN_USER && (
                        <FilterSelect 
                            value={salesPersonFilter}
                            onChange={onSalesPersonFilterChange}
                            options={salesPersons}
                            placeholder="All Sales Persons"
                        />
                    )}
                    <FilterSelect 
                        value={countryFilter}
                        onChange={onCountryFilterChange}
                        options={uniqueCountries}
                        placeholder="All Countries"
                    />
                    <FilterSelect 
                        value={companyFilter}
                        onChange={onCompanyFilterChange}
                        options={uniqueCompanies}
                        placeholder="All Companies"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 hidden sm:inline">
                        Welcome, <span className="font-bold text-gray-800">{user}</span>
                    </span>
                    
                    {user !== ADMIN_USER && (
                        <div className="relative">
                            <button
                                onClick={handleReminderButtonClick}
                                title="Reminders"
                                className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-slate-100 transition-colors"
                            >
                                <BellIcon />
                                {overdueCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 ring-2 ring-white">
                                        {overdueCount > 9 ? '9+' : overdueCount}
                                    </span>
                                )}
                            </button>
                            {isReminderPanelOpen && (
                                <ReminderPanel 
                                    overdue={reminders.overdue}
                                    upcoming={reminders.upcoming}
                                    onReminderClick={handleReminderItemClick}
                                    onClose={() => setIsReminderPanelOpen(false)}
                                />
                            )}
                        </div>
                    )}
                    
                    <button
                        onClick={() => window.location.reload()}
                        title="Refresh Data"
                        className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-slate-100 transition-colors"
                    >
                        <RefreshIcon />
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};
