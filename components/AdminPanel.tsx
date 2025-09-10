
import React, { useMemo, useState, Fragment } from 'react';
import type { Contact, FollowUpLog } from '../types';

interface AdminPanelProps {
  contacts: Contact[];
  followUps: FollowUpLog[];
  salesPersons: string[];
  leadPipelineStages: Map<string, string>;
  onDrillDown: (salesperson: string, filter: string) => void;
}

const timeAgo = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return "Just now";
};

const formatTimestamp = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Hot': return 'bg-red-100 text-red-800 hover:bg-red-200';
        case 'Warm': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        case 'Cold': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
        case 'Not Interested': return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
        case 'Deal Lost': return 'bg-slate-200 text-red-700 font-medium hover:bg-slate-300';
        case 'On Hold': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
        default: return 'bg-slate-100 text-slate-800';
    }
};

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
    <svg className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
    </svg>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ contacts, followUps, salesPersons, leadPipelineStages, onDrillDown }) => {
    const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

    const salesPersonStats = useMemo(() => {
        return salesPersons.map(person => {
            const personActivities = followUps
                .filter(log => log.salesPerson === person)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            const personContacts = contacts.filter(c => c.salesPerson === person);
            
            const personLeadNos = new Set(personContacts.map(c => c.leadNo));

            const statusCounts = personContacts.reduce((acc, contact) => {
                const status = contact.status || 'No Status';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const pipelineCounts = Array.from(personLeadNos).reduce((acc, leadNo) => {
                if(!leadNo) return acc;
                const stage = leadPipelineStages.get(leadNo) || 'Fresh';
                acc[stage] = (acc[stage] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                name: person,
                lastLogin: personActivities[0]?.timestamp,
                secondLastLogin: personActivities[1]?.timestamp,
                leadCount: personLeadNos.size,
                activityCount: personActivities.length,
                statusCounts,
                pipelineCounts,
            };
        }).sort((a,b) => (b.lastLogin || '').localeCompare(a.lastLogin || ''));
    }, [salesPersons, contacts, followUps, leadPipelineStages]);

    const sortedFollowUps = useMemo(() => {
        return [...followUps].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [followUps]);

    const toggleExpand = (personName: string) => {
        setExpandedPerson(prev => (prev === personName ? null : personName));
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="mt-1 text-gray-500">Overview of sales team performance and activity.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Sales Person Overview</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-1/4">Sales Person</th>
                                <th scope="col" className="px-6 py-3">Last Activity</th>
                                <th scope="col" className="px-6 py-3">Previous Activity</th>
                                <th scope="col" className="px-6 py-3 text-center">Total Leads</th>
                                <th scope="col" className="px-6 py-3 text-center">Total Activities</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesPersonStats.map(stat => (
                                <Fragment key={stat.name}>
                                    <tr 
                                        onClick={() => toggleExpand(stat.name)}
                                        className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <ChevronIcon expanded={expandedPerson === stat.name} />
                                                <span>{stat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4" title={formatTimestamp(stat.lastLogin)}>{timeAgo(stat.lastLogin)}</td>
                                        <td className="px-6 py-4" title={formatTimestamp(stat.secondLastLogin)}>{timeAgo(stat.secondLastLogin)}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{stat.leadCount}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{stat.activityCount}</td>
                                    </tr>
                                    {expandedPerson === stat.name && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={5} className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg border">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-600 mb-3 text-sm">Lead Status Breakdown</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(stat.statusCounts).map(([status, count]) => (
                                                                <button key={status} onClick={() => onDrillDown(stat.name, status)}
                                                                    className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${getStatusColor(status)}`}>
                                                                    {status}: {count}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-600 mb-3 text-sm">Pipeline Stage Breakdown</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(stat.pipelineCounts).map(([stage, count]) => (
                                                                <button key={stage} onClick={() => onDrillDown(stat.name, stage)}
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                                                                    {stage}: {count}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-semibold text-gray-700 mb-4">All Activity Feed</h2>
                 <div className="max-h-[600px] overflow-y-auto pr-4 space-y-4">
                    {sortedFollowUps.map((log, index) => (
                         <div key={`${log.timestamp}-${index}`} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                             <div className="flex justify-between items-start">
                                 <div>
                                    <p className="font-semibold text-sm text-gray-800">
                                        <span className="font-bold text-blue-600">{log.salesPerson}</span> logged action: <span className="text-black">{log.action}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        For: <span className="font-medium text-gray-700">{log.keyPerson}</span> @ <span className="font-medium text-gray-700">{log.company}</span>
                                    </p>
                                 </div>
                                 <p className="text-xs text-gray-500 flex-shrink-0 ml-4" title={formatTimestamp(log.timestamp)}>
                                     {timeAgo(log.timestamp)}
                                 </p>
                             </div>
                             {log.remarks && (
                                <p className="text-sm text-gray-800 bg-white p-3 rounded border border-slate-200 mt-2 whitespace-pre-wrap">
                                  <span className="font-bold text-xs block text-gray-500 mb-1">Notes:</span>
                                  {log.remarks}
                                </p>
                              )}
                         </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};
