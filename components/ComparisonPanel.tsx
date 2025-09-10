
import React, { useState, useMemo } from 'react';
import type { Contact, FollowUpLog } from '../types';

type TimeFilter = 'week' | 'month' | 'all';

interface ComparisonPanelProps {
  contacts: Contact[];
  followUps: FollowUpLog[];
  salesPersons: string[];
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ contacts, followUps, salesPersons }) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

    const comparisonData = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return salesPersons.map(person => {
            const personContacts = contacts.filter(c => c.salesPerson === person);
            const personFollowUps = followUps.filter(f => f.salesPerson === person);

            const hotLeads = personContacts.filter(c => c.status === 'Hot').length;

            const filteredFollowUps = personFollowUps.filter(log => {
                const logDate = new Date(log.timestamp);
                if (timeFilter === 'week') return logDate >= weekAgo;
                if (timeFilter === 'month') return logDate >= monthAgo;
                return true; // 'all'
            });
            
            const meetings = filteredFollowUps.filter(log => log.action === 'Meeting').length;
            const calls = filteredFollowUps.filter(log => log.action === 'Call').length;
            const proposals = filteredFollowUps.filter(log => log.action === 'Proposal').length;

            return {
                name: person,
                hotLeads,
                meetings,
                calls,
                proposals
            };
        }).sort((a,b) => b.hotLeads - a.hotLeads || b.meetings - a.meetings);
    }, [salesPersons, contacts, followUps, timeFilter]);

    const TimeFilterButton: React.FC<{ filter: TimeFilter; label: string }> = ({ filter, label }) => {
        const isActive = timeFilter === filter;
        return (
            <button
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${isActive ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Salesperson Comparison</h1>
                <p className="mt-1 text-gray-500">Compare team performance metrics side-by-side.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold text-gray-700">Performance Metrics</h2>
                    <div className="flex items-center space-x-2 p-1 bg-gray-100 rounded-full">
                        <TimeFilterButton filter="week" label="This Week" />
                        <TimeFilterButton filter="month" label="This Month" />
                        <TimeFilterButton filter="all" label="All Time" />
                    </div>
                </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Sales Person</th>
                                <th scope="col" className="px-6 py-3 text-center">Hot Leads</th>
                                <th scope="col" className="px-6 py-3 text-center">Meetings</th>
                                <th scope="col" className="px-6 py-3 text-center">Calls Logged</th>
                                <th scope="col" className="px-6 py-3 text-center">Proposals Sent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonData.map((data) => (
                                <tr key={data.name} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{data.name}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-lg text-red-600">{data.hotLeads}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-lg text-blue-600">{data.meetings}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-lg text-green-600">{data.calls}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-lg text-purple-600">{data.proposals}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};
