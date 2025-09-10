import React, { useState, useMemo, Fragment } from 'react';
import type { Contact, FollowUpLog } from '../types';
import { SocialLinks } from './SocialLinks';
import { QUICK_ACTION_GROUPS, STATUS_OPTIONS } from '../constants';
import { EditIcon, PersonIcon } from './icons';

interface DataTableProps {
  contacts: Contact[];
  activeLeadNos: Set<string | null>;
  lastActionsMap: Map<string, FollowUpLog>;
  onEditPerson: (contact: Contact) => void;
  onEditCompany: (contact: Contact) => void;
  onAddPerson: (contact: Contact) => void;
  onDeletePerson: (contact: Contact) => void;
  onOpenWhatsAppModal: (contact: Contact) => void;
  onStatusChange: (contact: Contact, newStatus: string) => void;
  onQuickAction: (contact: Contact, action: string) => void;
  onLogSocialClick: (contact: Contact, action:string, details: string) => void;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}min ago`;
    return "Just now";
};

const getFollowUpDateClasses = (dateString: string | null): string => {
    if (!dateString) return 'text-gray-400';

    // Get today's date as a YYYY-MM-DD string in the local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Create a date object from the ISO string and format it to YYYY-MM-DD
    // This correctly handles dates regardless of how they were stored (with or without timezone bugs)
    const followUpDate = new Date(dateString);
    const followUpYear = followUpDate.getFullYear();
    const followUpMonth = String(followUpDate.getMonth() + 1).padStart(2, '0');
    const followUpDay = String(followUpDate.getDate()).padStart(2, '0');
    const followUpDateStr = `${followUpYear}-${followUpMonth}-${followUpDay}`;

    if (followUpDateStr < todayStr) return 'text-red-600 font-bold animate-pulse';
    if (followUpDateStr === todayStr) return 'text-yellow-600 font-bold animate-pulse';
    return 'text-gray-600';
};

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'Hot': return 'bg-red-100 text-red-800';
        case 'Warm': return 'bg-yellow-100 text-yellow-800';
        case 'Cold': return 'bg-blue-100 text-blue-800';
        case 'Not Interested': return 'bg-gray-100 text-gray-800';
        case 'Deal Lost': return 'bg-slate-200 text-red-700 font-medium';
        case 'On Hold': return 'bg-purple-100 text-purple-800';
        default: return 'bg-white text-gray-700';
    }
};

const QuickActionsDropdown: React.FC<{ contact: Contact; onQuickAction: (contact: Contact, action: string) => void; }> = ({ contact, onQuickAction }) => (
    <select
        onChange={(e) => { if (e.target.value) { onQuickAction(contact, e.target.value); e.target.value = ''; } }}
        defaultValue=""
        className="w-full p-2 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors bg-white text-gray-700"
        onClick={(e) => e.stopPropagation()}
    >
        <option value="" disabled>-- Log Action --</option>
        {Object.entries(QUICK_ACTION_GROUPS).map(([group, actions]) => (
            <optgroup label={group} key={group}>
                {actions.map(action => (
                    <option key={action} value={action}>{action}</option>
                ))}
            </optgroup>
        ))}
    </select>
);

const StatusSelector: React.FC<{ contact: Contact; onStatusChange: (contact: Contact, newStatus: string) => void; }> = ({ contact, onStatusChange }) => {
    return (
        <select
            value={contact.status || ''}
            onChange={(e) => onStatusChange(contact, e.target.value)}
            className={`w-full p-2 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${getStatusColor(contact.status)}`}
            onClick={(e) => e.stopPropagation()}
        >
            <option value="" disabled>-- Select --</option>
            {STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    );
};

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
    <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
    </svg>
);


const renderAggregatedPersonRow = (
    personContacts: Contact[], 
    { onEditPerson, onDeletePerson, onOpenWhatsAppModal, onStatusChange, onQuickAction, onLogSocialClick }: Omit<DataTableProps, 'contacts' | 'activeLeadNos' | 'lastActionsMap' | 'onAddPerson' | 'onEditCompany'>
) => {
    const primaryContact = personContacts[0]; // Use the first contact for primary details like name, status etc.
    return (
        <tr key={primaryContact.id} className="border-b border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors duration-150">
            <td className="px-4 py-3 pl-12">
                <div className="font-semibold text-gray-800">{primaryContact.keyPerson}</div>
                <div className="text-sm text-gray-500">{primaryContact.designation}</div>
            </td>
            <td className={`px-4 py-3 text-sm font-medium ${getFollowUpDateClasses(primaryContact.nextFollowUpDate)}`}>
                {primaryContact.nextFollowUpDate ? new Date(primaryContact.nextFollowUpDate).toLocaleDateString() : 'Not set'}
            </td>
            <td className="px-4 py-3 w-40"><QuickActionsDropdown contact={primaryContact} onQuickAction={onQuickAction} /></td>
            <td className="px-4 py-3 w-40"><StatusSelector contact={primaryContact} onStatusChange={onStatusChange} /></td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex flex-col space-y-2">
                    {personContacts.map(contact => (
                         <div key={contact.id} className="flex items-center space-x-3">
                            <SocialLinks 
                                contact={contact} 
                                type="person" 
                                onOpenWhatsAppModal={onOpenWhatsAppModal} 
                                onLogSocialClick={onLogSocialClick}
                            />
                             <button onClick={(e) => { e.stopPropagation(); onEditPerson(contact); }} className="font-medium text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                             <button onClick={(e) => { e.stopPropagation(); onDeletePerson(contact); }} className="font-medium text-red-600 hover:text-red-800 text-xs">Delete</button>
                         </div>
                    ))}
                </div>
            </td>
        </tr>
    );
};


export const DataTable: React.FC<DataTableProps> = (props) => {
    const { contacts, activeLeadNos, lastActionsMap, onAddPerson, onEditCompany } = props;
    const [expandedLeadNos, setExpandedLeadNos] = useState<Set<string>>(new Set());

    const groupedByCompany = useMemo(() => {
        const companyGroups = new Map<string, Contact[]>();
        contacts.forEach(contact => {
            const leadNo = contact.leadNo || `no-lead-${contact.id}`;
            if (!companyGroups.has(leadNo)) companyGroups.set(leadNo, []);
            companyGroups.get(leadNo)!.push(contact);
        });
        return Array.from(companyGroups.values());
    }, [contacts]);

    const handleToggleExpand = (leadNo: string) => {
        setExpandedLeadNos(prev => {
            const newSet = new Set(prev);
            newSet.has(leadNo) ? newSet.delete(leadNo) : newSet.add(leadNo);
            return newSet;
        });
    };

    return (
        <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-sm font-semibold text-gray-600 bg-slate-100 border-b-2 border-slate-200">
                    <tr>
                        <th scope="col" className="px-4 py-3 w-1/4">Company / Contact</th>
                        <th scope="col" className="px-4 py-3">Next Follow-up</th>
                        <th scope="col" className="px-4 py-3">Quick Actions</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3">Contact Details & Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedByCompany.map(companyContactGroup => {
                        const primaryContact = companyContactGroup[0];
                        const leadNo = primaryContact.leadNo;
                        if (!leadNo) return null;

                        const isExpanded = expandedLeadNos.has(leadNo);
                        const isActive = activeLeadNos.has(leadNo);
                        const lastAction = lastActionsMap.get(leadNo);
                        
                        const uniqueStatuses = Array.from(new Set(companyContactGroup.map(c => c.status).filter(Boolean)));


                        const groupedByPerson = new Map<string, Contact[]>();
                        companyContactGroup.forEach(contact => {
                            const keyPerson = contact.keyPerson || `no-person-${contact.id}`;
                            if (!groupedByPerson.has(keyPerson)) groupedByPerson.set(keyPerson, []);
                            groupedByPerson.get(keyPerson)!.push(contact);
                        });
                        const personCount = groupedByPerson.size;
                        
                        return (
                            <Fragment key={leadNo}>
                                <tr onClick={() => handleToggleExpand(leadNo)} className={`border-b border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors duration-150 ${isActive ? 'border-l-4 border-blue-500' : ''}`}>
                                    <td className="px-4 py-4 font-medium text-gray-900">
                                        <div className="flex items-start space-x-2">
                                            <div className="pt-1"><ChevronIcon expanded={isExpanded} /></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-gray-900">{primaryContact.company}</div>
                                                    <div title={`${personCount} key person(s)`} className="flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-1">
                                                        <PersonIcon className="h-4 w-4" />
                                                        <span>{personCount}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">{primaryContact.leadNo} &bull; {primaryContact.country}</div>
                                                {primaryContact.internName && (
                                                    <div className="text-xs text-purple-600 font-medium mt-1">
                                                        Assigned to: {primaryContact.internName}
                                                    </div>
                                                )}
                                                 <div className="mt-2">
                                                    <SocialLinks contact={primaryContact} type="company" onLogSocialClick={props.onLogSocialClick} onOpenWhatsAppModal={() => {}}/>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {lastAction ? (
                                            <div>
                                                <div className="font-medium text-gray-800 text-sm">{lastAction.action}</div>
                                                <div className="text-xs text-gray-500">{timeAgo(new Date(lastAction.timestamp))}</div>
                                            </div>
                                        ) : <span className="text-sm text-gray-400">No activity</span>}
                                    </td>
                                    <td colSpan={2} className="px-4 py-4">
                                        <div className="flex flex-wrap gap-2">
                                        {uniqueStatuses.length > 0 ? uniqueStatuses.map(status => (
                                            <span key={status} className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                                                {status}
                                            </span>
                                        )) : <span className="text-xs text-gray-400">No Status</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditCompany(primaryContact); }}
                                                className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"
                                                title="Edit Company Details"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAddPerson(primaryContact); }}
                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 font-semibold rounded-full hover:bg-blue-200"
                                            >
                                                Add Person
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && Array.from(groupedByPerson.values()).map(personContacts => 
                                   renderAggregatedPersonRow(personContacts, props)
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
             {contacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No contacts found for the current filter.
                </div>
            )}
        </div>
    );
};