
import React from 'react';
import type { Contact } from '../types';

interface ReminderPanelProps {
  overdue: Contact[];
  upcoming: Contact[];
  onReminderClick: (contact: Contact) => void;
  onClose: () => void;
}

const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Set both dates to the start of their day for accurate day difference calculation
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const seconds = Math.floor((nowStart.getTime() - dateStart.getTime()) / 1000);
    
    const days = Math.floor(seconds / 86400);

    if (days > 1) return `${days} days ago`;
    if (days === 1) return `Yesterday`;

    // For upcoming dates
    if (dateStart > nowStart) {
        const futureSeconds = Math.floor((dateStart.getTime() - nowStart.getTime()) / 1000);
        const futureDays = Math.ceil(futureSeconds / 86400);
        if (futureDays > 1) return `in ${futureDays} days`;
        if (futureDays === 1) return `Tomorrow`;
    }
    
    return 'Today';
};


const ReminderItem: React.FC<{ contact: Contact, onClick: () => void, isOverdue?: boolean }> = ({ contact, onClick, isOverdue }) => (
    <li 
        onClick={onClick}
        className="p-3 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-sm text-slate-800">{contact.keyPerson}</p>
                <p className="text-xs text-slate-500">{contact.company}</p>
                {contact.internName && (
                    <p className="text-xs text-purple-600 font-medium mt-1">
                        Assigned to: {contact.internName}
                    </p>
                )}
            </div>
            <span className={`text-xs font-medium flex-shrink-0 ml-2 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                {timeAgo(contact.nextFollowUpDate!)}
            </span>
        </div>
    </li>
);


export const ReminderPanel: React.FC<ReminderPanelProps> = ({ overdue, upcoming, onReminderClick, onClose }) => {
    return (
        <div 
            className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden animate-[fade-in-down_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-bold text-slate-800">Reminders</h3>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                    aria-label="Close reminders"
                >
                    &times;
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {overdue.length > 0 && (
                    <div className="p-4 border-b">
                        <h4 className="text-xs font-bold uppercase text-red-500 mb-2">Overdue</h4>
                        <ul className="space-y-1">
                           {overdue.map(contact => (
                               <ReminderItem key={contact.id} contact={contact} onClick={() => onReminderClick(contact)} isOverdue />
                           ))}
                        </ul>
                    </div>
                )}
                {upcoming.length > 0 && (
                    <div className="p-4">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Upcoming</h4>
                        <ul className="space-y-1">
                           {upcoming.map(contact => (
                               <ReminderItem key={contact.id} contact={contact} onClick={() => onReminderClick(contact)} />
                           ))}
                        </ul>
                    </div>
                )}
                {overdue.length === 0 && upcoming.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-sm text-slate-500">You're all caught up!</p>
                        <p className="text-xs text-slate-400 mt-1">No overdue or upcoming follow-ups.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
