import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { Contact, FollowUpLog } from '../types';
import { PIPELINE_STAGES } from '../constants';

interface AnalysisProps {
  uniqueLeads: Contact[];
  allContacts: Contact[];
  followUps: FollowUpLog[];
  leadPipelineStages: Map<string, string>;
}

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            {children}
        </div>
    </div>
);

export const Analysis: React.FC<AnalysisProps> = ({ uniqueLeads, allContacts, followUps, leadPipelineStages }) => {

    const pipelineFunnelData = useMemo(() => {
        const counts = new Map<string, number>();
        PIPELINE_STAGES.forEach(stage => counts.set(stage, 0));
        counts.set('Fresh', 0);

        uniqueLeads.forEach(contact => {
            const stage = leadPipelineStages.get(contact.leadNo) || 'Fresh';
            if (counts.has(stage)) {
                counts.set(stage, (counts.get(stage) || 0) + 1);
            }
        });

        return ['Fresh', ...PIPELINE_STAGES].map(stage => ({
            name: stage,
            leads: counts.get(stage) || 0,
        })).filter(item => item.leads > 0);
    }, [uniqueLeads, leadPipelineStages]);

    const activityTrendData = useMemo(() => {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        last30Days.setHours(0,0,0,0);

        const recentFollowUps = followUps.filter(f => new Date(f.timestamp) >= last30Days);
        
        const countsByDay: { [key: string]: number } = {};
        for(let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            countsByDay[dateString] = 0;
        }

        recentFollowUps.forEach(f => {
            const dateString = new Date(f.timestamp).toISOString().split('T')[0];
            if (countsByDay.hasOwnProperty(dateString)) {
                countsByDay[dateString]++;
            }
        });
        
        return Object.keys(countsByDay).map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            activities: countsByDay[date]
        })).reverse();
    }, [followUps]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer title="Sales Funnel Breakdown (by Lead Count)">
                <ResponsiveContainer>
                    <BarChart data={pipelineFunnelData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="leads" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Activity Trend (Last 30 Days)">
                <ResponsiveContainer>
                    <LineChart data={activityTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="activities" stroke="#ff7300" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
};