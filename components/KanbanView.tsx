import React, { useMemo, useState } from 'react';
import type { Contact } from '../types';
import { PIPELINE_STAGES } from '../constants';

interface KanbanViewProps {
  leads: Contact[];
  allContacts: Contact[];
  leadPipelineStages: Map<string, string>;
  onQuickAction: (contact: Contact, action: string) => void;
}

const parseCurrency = (value: string | null): number | null => {
    if (value === null || typeof value === 'undefined') return null;
    // Ensure value is a string before calling replace, then strip non-numeric characters
    const number = parseFloat(String(value).replace(/[^0-9.-]+/g,""));
    return isNaN(number) ? null : number;
};

const KanbanCard: React.FC<{ lead: Contact, contactsForLead: Contact[], onDragStart: (e: React.DragEvent<HTMLDivElement>, leadNo: string) => void }> = ({ lead, contactsForLead, onDragStart }) => {
    const displayValue = parseCurrency(lead.totalImportValue);
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, lead.leadNo)}
            className="kanban-card bg-white p-4 rounded-lg shadow-md border border-slate-200 mb-3 cursor-grab active:cursor-grabbing"
        >
            <h4 className="font-bold text-sm text-slate-800">{lead.company}</h4>
            <p className="text-xs text-slate-500 mb-2">{lead.country}</p>
            {displayValue !== null && (
                <p className="text-sm font-semibold text-green-600 mb-2">${displayValue.toLocaleString()}</p>
            )}
            <div className="border-t pt-2 mt-2">
                <p className="text-xs font-semibold text-slate-600 mb-1">Key Contacts:</p>
                {contactsForLead.slice(0, 2).map(c => (
                    <div key={c.id} className="text-xs text-slate-500 truncate" title={c.keyPerson}>{c.keyPerson}</div>
                ))}
                {contactsForLead.length > 2 && (
                    <div className="text-xs text-slate-500 mt-1">...and {contactsForLead.length - 2} more</div>
                )}
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    stage: string;
    leads: Contact[];
    contactsByLeadNo: Map<string, Contact[]>;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, leadNo: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, stage: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    isDragOver: boolean;
}> = ({ stage, leads, contactsByLeadNo, onDragStart, onDrop, onDragOver, onDragLeave, isDragOver }) => {
    return (
        <div 
            className={`kanban-column flex-shrink-0 w-80 bg-slate-100 rounded-xl p-4 transition-colors duration-200 ${isDragOver ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}
            onDrop={(e) => onDrop(e, stage)}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <h3 className="font-bold text-gray-700 mb-4 px-2 flex justify-between items-center">
                <span>{stage}</span>
                <span className="text-sm font-normal bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{leads.length}</span>
            </h3>
            <div className="space-y-3 h-full overflow-y-auto">
                {leads.map(lead => (
                    <KanbanCard 
                        key={lead.leadNo} 
                        lead={lead} 
                        contactsForLead={contactsByLeadNo.get(lead.leadNo) || []}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        </div>
    );
};


export const KanbanView: React.FC<KanbanViewProps> = ({ leads, allContacts, leadPipelineStages, onQuickAction }) => {
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    
    const contactsByLeadNo = useMemo(() => {
        const map = new Map<string, Contact[]>();
        allContacts.forEach(contact => {
            if (!contact.leadNo) return;
            if (!map.has(contact.leadNo)) {
                map.set(contact.leadNo, []);
            }
            map.get(contact.leadNo)!.push(contact);
        });
        return map;
    }, [allContacts]);
    
    const leadsByStage = useMemo(() => {
        const stages: { [key: string]: Contact[] } = { 'Fresh': [] };
        PIPELINE_STAGES.forEach(stage => stages[stage] = []);

        leads.forEach(lead => {
            const stage = leadPipelineStages.get(lead.leadNo) || 'Fresh';
            if (stages[stage]) {
                stages[stage].push(lead);
            }
        });

        return stages;
    }, [leads, leadPipelineStages]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadNo: string) => {
        e.dataTransfer.setData('text/plain', leadNo);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        setDragOverStage(null);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: string) => {
        e.preventDefault();
        const leadNo = e.dataTransfer.getData('text/plain');
        const lead = leads.find(l => l.leadNo === leadNo);
        const currentStage = leadPipelineStages.get(leadNo) || 'Fresh';
        
        setDragOverStage(null);
        
        if (lead && newStage !== currentStage) {
            // Find the primary contact to trigger the action for
            const primaryContact = (contactsByLeadNo.get(leadNo) || [])[0];
            if (primaryContact) {
                onQuickAction(primaryContact, newStage);
            }
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stage: string) => {
        e.preventDefault();
        setDragOverStage(stage);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverStage(null);
    };

    return (
        <div 
            className="flex space-x-6 overflow-x-auto pb-4"
            onDragEnd={handleDragEnd}
        >
            {['Fresh', ...PIPELINE_STAGES].map(stage => (
                <KanbanColumn
                    key={stage}
                    stage={stage}
                    leads={leadsByStage[stage] || []}
                    contactsByLeadNo={contactsByLeadNo}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onDragOver={(e) => handleDragOver(e, stage)}
                    onDragLeave={handleDragLeave}
                    isDragOver={dragOverStage === stage}
                />
            ))}
        </div>
    );
};