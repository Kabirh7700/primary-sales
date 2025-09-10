

import React, { useMemo } from 'react';
import type { Contact } from '../types';
import { PIPELINE_STAGES, STATUS_OPTIONS } from '../constants';
import { LeadIcon, CalendarIcon } from './icons';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; onClick?: () => void; isActive?: boolean }> = ({ title, value, icon, onClick, isActive }) => {
    const baseClasses = "p-6 rounded-xl transition-all duration-200 flex items-center space-x-4";
    const activeClasses = isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-slate-50 border border-slate-200';
    const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';

    return (
        <div onClick={onClick} className={`${baseClasses} ${activeClasses} ${cursorClass}`}>
            <div className={`p-3 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-100'}`}>
                {icon}
            </div>
            <div>
                <h4 className={`text-sm font-medium ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{title}</h4>
                <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
        </div>
    );
};

interface FilterButtonGroupProps {
    title: string;
    counts: [string, number][];
    total: number;
    activeFilter: string | null;
    onFilterChange: (stage: string | null) => void;
    filterKeys: string[];
}

const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({ title, counts, total, activeFilter, onFilterChange, filterKeys }) => {
    const handleFilterClick = (stage: string) => {
        onFilterChange(activeFilter === stage ? null : stage);
    };

    const getButtonClasses = (stage: string | null, count?: number) => {
        const isActive = stage === null ? !filterKeys.includes(activeFilter || '') : activeFilter === stage;
        const base = "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 border";
        
        if (isActive) {
            return `${base} bg-blue-600 text-white border-transparent shadow`;
        }
        if (count === 0) {
            return `${base} bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100`;
        }
        return `${base} bg-white text-slate-700 border-slate-300 hover:bg-slate-100`;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
             <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
             <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => onFilterChange(null)}
                    className={getButtonClasses(null)}
                >
                    All ({total})
                </button>
                 {counts.map(([stage, count]) => (
                     <button
                        key={stage}
                        onClick={() => handleFilterClick(stage)}
                        className={getButtonClasses(stage, count)}
                     >
                        {stage} ({count})
                     </button>
                 ))}
             </div>
        </div>
    );
};

interface DashboardProps {
  uniqueLeads: Contact[];
  allContacts: Contact[];
  leadPipelineStages: Map<string, string>;
  activeFilter: string | null;
  onFilterChange: (stage: string | null) => void;
  todaysFollowUpCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ uniqueLeads, allContacts, leadPipelineStages, activeFilter, onFilterChange, todaysFollowUpCount }) => {
    
    const pipelineStageCounts = useMemo(() => {
        const stageOrder = ['Fresh', ...PIPELINE_STAGES];
        const counts = new Map<string, number>(stageOrder.map(s => [s, 0]));

        uniqueLeads.forEach(contact => {
            if (contact.leadNo) {
                let stage = leadPipelineStages.get(contact.leadNo) || 'Fresh';
                if (counts.has(stage)) {
                    counts.set(stage, (counts.get(stage) || 0) + 1);
                }
            }
        });

        return stageOrder
            .map(stage => [stage, counts.get(stage) || 0] as [string, number]);

    }, [uniqueLeads, leadPipelineStages]);
    
    const statusCounts = useMemo(() => {
        const counts = new Map<string, number>(STATUS_OPTIONS.map(s => [s, 0]));
        
        allContacts.forEach(contact => {
            if (contact.status && STATUS_OPTIONS.includes(contact.status)) {
                counts.set(contact.status, (counts.get(contact.status) || 0) + 1);
            }
        });

        return STATUS_OPTIONS
            .map(status => [status, counts.get(status) || 0] as [string, number]);
    }, [allContacts]);
    
    const totalLeads = uniqueLeads.length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard title="Total Leads" value={totalLeads} icon={<LeadIcon />} />
                <StatCard 
                    title="Today's Follow-ups" 
                    value={todaysFollowUpCount}
                    icon={<CalendarIcon />}
                    onClick={() => onFilterChange(activeFilter === 'today' ? null : 'today')}
                    isActive={activeFilter === 'today'}
                />
            </div>
            <FilterButtonGroup 
                title="Pipeline Tracker"
                counts={pipelineStageCounts}
                total={totalLeads}
                activeFilter={activeFilter}
                onFilterChange={onFilterChange}
                filterKeys={['Fresh', 'today', ...PIPELINE_STAGES]}
            />
            <FilterButtonGroup 
                title="Lead Status"
                counts={statusCounts}
                total={allContacts.length}
                activeFilter={activeFilter}
                onFilterChange={onFilterChange}
                filterKeys={STATUS_OPTIONS}
            />
        </div>
    );
};