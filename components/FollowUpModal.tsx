

import React, { useState, useMemo, useEffect } from 'react';
import type { Contact, FollowUpLog } from '../types';

interface ProofFile {
    fileName: string;
    mimeType: string;
    base64Data: string;
}

export interface FollowUpSaveData {
    remarks: string;
    nextFollowUpDate: string;
    templateId: 'tEMP1' | 'tEMP2' | '';
    proofFile: ProofFile | null;
}

interface FollowUpModalProps {
  logDetails: {
    contact: Contact;
    action: string;
    details: string;
  };
  history: FollowUpLog[];
  onClose: () => void;
  onSave: (saveData: FollowUpSaveData) => void;
}

const actionsRequiringTemplate = ["LinkedIn", "Intro Email", "WhatsApp Message Sent"];
const actionsWithoutDate: string[] = ['Not Interested', 'Deal Lost', 'Payment Received'];
const actionsWithOptionalDate: string[] = ['Add Note'];
const actionsWithProof: string[] = ['Payment Received', 'Order Received'];


export const FollowUpModal: React.FC<FollowUpModalProps> = ({ logDetails, history, onClose, onSave }) => {
  const { contact, action, details } = logDetails;
  
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'tEMP1' | 'tEMP2' | ''>('');
  const [proofFile, setProofFile] = useState<ProofFile | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
  const dateRequirement = useMemo(() => {
    if (actionsWithoutDate.includes(action)) return 'hidden';
    if (actionsWithOptionalDate.includes(action)) return 'optional';
    return 'required';
  }, [action]);

  const showProofUploader = useMemo(() => actionsWithProof.includes(action), [action]);

  useEffect(() => {
    if (contact && dateRequirement !== 'hidden') {
      setNextFollowUpDate(contact.nextFollowUpDate?.split('T')[0] || '');
    } else {
      setNextFollowUpDate(''); // Clear date for terminal/hidden actions
    }
    setProofFile(null); // Clear file when modal data changes
    setIsHistoryExpanded(false); // Reset history view on modal change
  }, [contact, action, dateRequirement]);
  
  const showTemplateSelector = useMemo(() => actionsRequiringTemplate.includes(action), [action]);
  const isSaveDisabled = dateRequirement === 'required' && !nextFollowUpDate;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // result is a data URL: "data:image/png;base64,iVBORw0KGgo..."
        // We need to split it to get the mimeType and base64 data
        const [header, base64Data] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        
        if (base64Data && mimeType) {
            setProofFile({
                fileName: file.name,
                mimeType,
                base64Data
            });
        }
      };
      reader.readAsDataURL(file);
    } else {
      setProofFile(null);
    }
     e.target.value = ''; // Reset file input
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaveDisabled) return;
        
    onSave({ remarks, nextFollowUpDate, templateId: selectedTemplate, proofFile });
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history]);
  
  const historyToShow = isHistoryExpanded ? sortedHistory : sortedHistory.slice(0, 1);


  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
        aria-modal="true"
        role="dialog"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* FIXED HEADER */}
        <div className="p-8 pb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Log Follow-up Activity</h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-2">
                <div>
                    <span className="font-semibold text-gray-600 text-sm">Contact:</span>
                    <span className="text-gray-800 ml-2">{contact.keyPerson} @ {contact.company} ({contact.number})</span>
                </div>
                <div>
                    <span className="font-semibold text-gray-600 text-sm">Action:</span>
                    <span className="text-gray-800 ml-2 font-medium">{action}</span>
                </div>
                <div>
                    <span className="font-semibold text-gray-600 text-sm">Details:</span>
                    <span className="text-gray-800 ml-2 text-sm">{details}</span>
                </div>
            </div>
        </div>
        
        {/* SCROLLABLE BODY */}
        <div className="flex-grow overflow-y-auto px-8">
          <form id="follow-up-form" onSubmit={handleSubmit}>
              {/* INTERACTION HISTORY */}
              <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Interaction History</h3>
                    {sortedHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsHistoryExpanded(prev => !prev)}
                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none"
                      >
                        {isHistoryExpanded ? 'Show Less' : `View ${sortedHistory.length - 1} Older Entries`}
                      </button>
                    )}
                  </div>
                  {sortedHistory.length > 0 ? (
                      <div className="space-y-4">
                        {historyToShow.map((log, index) => (
                          <div key={index} className="p-3 bg-gray-100 rounded-md border border-gray-200">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-semibold text-sm text-gray-800">{log.action}</p>
                                <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">For: <span className="font-medium text-gray-700">{log.keyPerson}</span> {log.contactNumber && `(${log.contactNumber})`}</p>
                            <p className="text-xs text-gray-600 mb-2">{log.details}</p>
                            {log.remarks && (
                              <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 mt-2 whitespace-pre-wrap">
                                <span className="font-bold text-xs block text-gray-500">Notes:</span>
                                {log.remarks}
                              </p>
                            )}
                            {log.proofUrl && (
                              <div className="mt-2">
                                  <a href={log.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                      </svg>
                                      View Attached Proof
                                  </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                  ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No past interactions found for this lead.</p>
                  )}
              </div>
              
              {/* FORM FIELDS */}
              <div className="border-t pt-6 mt-6 pb-6">
                  {dateRequirement !== 'hidden' && (
                    <div>
                      <label htmlFor="nextFollowUpDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Next Follow-up Date {dateRequirement === 'required' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="date"
                        id="nextFollowUpDate"
                        name="nextFollowUpDate"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={dateRequirement === 'required'}
                      />
                    </div>
                  )}
                
                {showTemplateSelector && (
                    <div className="mt-6">
                      <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Message Template
                      </label>
                      <select
                        id="template"
                        name="template"
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value as 'tEMP1' | 'tEMP2' | '')}
                        className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- No Template --</option>
                        {contact.tEMP1 && <option value="tEMP1">Template 1: {contact.tEMP1.substring(0,40)}...</option>}
                        {contact.tEMP2 && <option value="tEMP2">Template 2: {contact.tEMP2.substring(0,40)}...</option>}
                      </select>
                    </div>
                  )}
                
                {showProofUploader && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attach Proof (Optional)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="proofFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              <span>Upload a file</span>
                              <input id="proofFile" name="proofFile" type="file" className="sr-only" onChange={handleFileChange} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          {proofFile?.fileName ? (
                              <p className="text-sm font-semibold text-green-600 pt-2">{proofFile.fileName}</p>
                          ) : (
                              <p className="text-xs text-gray-500">PNG, JPG, PDF, etc.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                <div className="mt-6">
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                    Add Notes for Current Action
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes or comments here..."
                  />
                </div>
              </div>
          </form>
        </div>

        {/* FIXED FOOTER */}
        <div className="p-8 pt-6 flex-shrink-0 border-t">
          <div className="flex justify-end space-x-4">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="follow-up-form"
                disabled={isSaveDisabled}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Save Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};