

import React, { useMemo, useState, Fragment } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Contact, FollowUpLog } from '../types';
import { PersonIcon, FireIcon, WarningIcon, LeadIcon } from './icons';

interface TeamViewProps {
  contacts: Contact[];
  followUps: FollowUpLog[];
  loggedInUser: string | null;
}

const formatActivityTime = (dateString?: string, isForFeed: boolean = false): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    // Compact version for the feed
    if (isForFeed) {
        if (dateStart.getTime() === todayStart.getTime()) return date.toLocaleTimeString('en-US', timeFormat);
        if (dateStart.getTime() === yesterdayStart.getTime()) return 'Yesterday';
        
        const shortDateFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('en-GB', shortDateFormat);
    }

    // Full version for the header
    if (dateStart.getTime() === todayStart.getTime()) {
        return `Today, ${date.toLocaleTimeString('en-US', timeFormat)}`;
    }
    if (dateStart.getTime() === yesterdayStart.getTime()) {
        return `Yesterday, ${date.toLocaleTimeString('en-US', timeFormat)}`;
    }
    
    const fullDateFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: '2-digit' };
    return date.toLocaleDateString('en-GB', fullDateFormat);
};


const formatTimestamp = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
    <svg className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
    </svg>
);

const DetailStatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; colorClass: string; }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-slate-50 p-4 rounded-lg flex items-center space-x-3">
        <div className={`p-2 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{title}</p>
        </div>
    </div>
);

// Helper function to extract meaningful remarks for display
const getCleanRemark = (remark: string | undefined | null, internName: string): string | null => {
    if (!remark) return null;

    // This regex matches various intern tags and system auto-logs, removing them from the string. Case-insensitive.
    const internTagRegex = new RegExp(`\\s*\\((by|logged by) intern:\\s*${internName.trim()}[^)]*\\)|System auto-log`, 'gi');
    
    const cleanRemark = remark.replace(internTagRegex, '').trim();
    
    return cleanRemark.length > 0 ? cleanRemark : null;
};


export const TeamView: React.FC<TeamViewProps> = ({ contacts, followUps, loggedInUser }) => {
    const [expandedIntern, setExpandedIntern] = useState<string | null>(null);

    const teamData = useMemo(() => {
        if (!loggedInUser) return { internStats: [], activitiesByIntern: new Map() };

        const myContacts = contacts.filter(c => c.salesPerson === loggedInUser);
        const myInterns = Array.from(new Set(myContacts.map(c => c.internName).filter(Boolean))) as string[];

        const activitiesByIntern = new Map<string, FollowUpLog[]>();

        const internStats = myInterns.map(internName => {
            const internContacts = myContacts.filter(c => c.internName === internName);
            const assignedLeadsCount = new Set(internContacts.map(c => c.leadNo)).size;
            
            // ROBUSTNESS UPGRADE: Use a more flexible regex to find all intern activities reliably.
            const internActivities = followUps
                .filter(f => {
                    if (f.salesPerson !== loggedInUser || !f.remarks) return false;
                    const internTagRegex = new RegExp(`\\(by intern:\\s*${internName.trim()}\\)`, 'i');
                    return internTagRegex.test(f.remarks);
                })
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            activitiesByIntern.set(internName, internActivities);
            
            const hotLeadsCount = internContacts.filter(c => c.status === 'Hot').length;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const overdueTasksCount = internContacts.filter(c => c.nextFollowUpDate && new Date(c.nextFollowUpDate) < today).length;
            
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            const activityCounts = internActivities
                .filter(f => new Date(f.timestamp) >= monthAgo)
                .reduce((acc, log) => {
                    acc[log.action] = (acc[log.action] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
            
            const activityBreakdown = Object.entries(activityCounts)
                .map(([action, count]) => ({ action, count }))
                .sort((a, b) => b.count - a.count);

            return {
                name: internName,
                assignedLeadsCount,
                hotLeadsCount,
                overdueTasksCount,
                lastActivityTimestamp: internActivities[0]?.timestamp,
                secondLastActivityTimestamp: internActivities[1]?.timestamp,
                activityBreakdown,
            };
        });

        return { internStats, activitiesByIntern };

    }, [contacts, followUps, loggedInUser]);

    const toggleExpand = (internName: string) => {
        setExpandedIntern(prev => (prev === internName ? null : internName));
    };

    if (teamData.internStats.length === 0) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-800">My Team Overview</h1>
                <div className="bg-white text-center py-16 px-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-700">No Interns Assigned</h3>
                    <p className="mt-2 text-gray-500">Assign leads to interns to see their performance here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">My Team Overview</h1>
                <p className="mt-1 text-gray-500">Monitor your assigned interns' performance and recent activities.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
                {/* HEADER ROW */}
                <div className="grid grid-cols-5 items-center p-4 gap-4 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                    <div className="col-span-2">Intern Name</div>
                    <div>Last Activity</div>
                    <div>Previous Activity</div>
                    <div className="text-center">Leads</div>
                </div>

                {/* INTERN LIST */}
                <div className="space-y-2 pt-2">
                    {teamData.internStats.map(intern => {
                        const isExpanded = expandedIntern === intern.name;
                        return (
                            <div key={intern.name} className="border border-slate-200 rounded-lg">
                                <div onClick={() => toggleExpand(intern.name)} className="grid grid-cols-5 items-center p-4 cursor-pointer hover:bg-slate-50 gap-4">
                                    {/* Col 1 & 2: Expander and Name */}
                                    <div className="col-span-2 flex items-center">
                                        <ChevronIcon expanded={isExpanded} />
                                        <h3 className="text-lg font-bold text-gray-800 ml-3 truncate">{intern.name}</h3>
                                    </div>
                                    
                                    {/* Col 3: Last Activity */}
                                    <div className="text-sm text-gray-800 font-medium" title={formatTimestamp(intern.lastActivityTimestamp)}>
                                        {formatActivityTime(intern.lastActivityTimestamp)}
                                    </div>

                                    {/* Col 4: Previous Activity */}
                                    <div className="text-sm text-gray-800 font-medium" title={formatTimestamp(intern.secondLastActivityTimestamp)}>
                                        {formatActivityTime(intern.secondLastActivityTimestamp)}
                                    </div>

                                    {/* Col 5: Leads */}
                                    <div className="text-sm font-semibold text-center">
                                        {intern.assignedLeadsCount}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="p-6 bg-slate-50 border-t border-slate-200 animate-[fade-in-down_0.5s_ease-out]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <DetailStatCard title="Total Assigned Leads" value={intern.assignedLeadsCount} icon={<LeadIcon />} colorClass="bg-blue-100 text-blue-600" />
                                            <DetailStatCard title="Hot Leads" value={intern.hotLeadsCount} icon={<FireIcon />} colorClass="bg-red-100 text-red-600" />
                                            <DetailStatCard title="Overdue Tasks" value={intern.overdueTasksCount} icon={<WarningIcon />} colorClass="bg-yellow-100 text-yellow-600" />
                                            
                                            <div className="md:col-span-2 lg:col-span-1 p-4 bg-white rounded-lg border">
                                                <h4 className="font-semibold text-sm text-gray-600 mb-2">Activity Breakdown (30d)</h4>
                                                {intern.activityBreakdown.length > 0 ? (
                                                    <div className="h-48">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={intern.activityBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="action" width={80} tick={{ fontSize: 10 }} />
                                                                <Tooltip cursor={{fill: '#f1f5f9'}}/>
                                                                <Bar dataKey="count" fill="#3b82f6" barSize={15} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : <p className="text-xs text-center text-gray-500 pt-16">No recent activity.</p>}
                                            </div>

                                            <div className="md:col-span-2 lg:col-span-3 p-4 bg-white rounded-lg border">
                                                <h4 className="font-semibold text-sm text-gray-600 mb-2">Recent Activity Feed</h4>
                                                <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                                                {(teamData.activitiesByIntern.get(intern.name) || []).map((log, index) => {
                                                    const cleanRemark = getCleanRemark(log.remarks, intern.name);
                                                    return (
                                                        <div key={`${log.timestamp}-${index}`} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-semibold text-xs text-gray-800">{log.action}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        For: <span className="font-medium">{log.keyPerson}</span>
                                                                    </p>
                                                                </div>
                                                                <p className="text-xs text-gray-500 flex-shrink-0 ml-2" title={formatTimestamp(log.timestamp)}>
                                                                    {formatActivityTime(log.timestamp, true)}
                                                                </p>
                                                            </div>
                                                            {cleanRemark && (
                                                                <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                                                                    {cleanRemark}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};