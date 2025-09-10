
import React, { useState } from 'react';
import type { Contact } from '../types';

interface WhatsAppModalProps {
  contact: Contact | null;
  onClose: () => void;
  onSend: (data: { type: 'template' | 'manual', message: string, templateId?: 'tEMP1' | 'tEMP2' }) => void;
}

type Mode = 'template' | 'manual';

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ contact, onClose, onSend }) => {
  const [mode, setMode] = useState<Mode>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<'tEMP1' | 'tEMP2' | null>(null);
  const [manualMessage, setManualMessage] = useState('');

  if (!contact) return null;
  
  const handleSend = () => {
    if (!contact.number) return;
    
    let message = '';
    let type: 'template' | 'manual' = 'template';
    let templateId: 'tEMP1' | 'tEMP2' | undefined = undefined;

    if (mode === 'template' && selectedTemplate && contact[selectedTemplate]) {
        message = contact[selectedTemplate]!;
        type = 'template';
        templateId = selectedTemplate;
    } else if (mode === 'manual' && manualMessage.trim()) {
        message = manualMessage.trim();
        type = 'manual';
    } else {
        return; // Nothing to send
    }

    const phoneNumber = contact.number.replace(/\D/g, '');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onSend({ type, message, templateId });
  };
  
  const isSendDisabled = (mode === 'template' && !selectedTemplate) || (mode === 'manual' && !manualMessage.trim());

  const templates = [
    { id: 'tEMP1', text: contact.tEMP1 },
    { id: 'tEMP2', text: contact.tEMP2 },
  ].filter(t => t.text) as { id: 'tEMP1' | 'tEMP2'; text: string }[];

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
        aria-modal="true"
        role="dialog"
    >
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Send WhatsApp Message</h2>
        <p className="mb-6 text-gray-600">
          To: <span className="font-semibold">{contact.keyPerson}</span> ({contact.number})
        </p>

        {/* Mode switcher */}
        <div className="flex border border-gray-300 rounded-lg p-1 mb-6 bg-gray-100">
             <button 
                onClick={() => setMode('template')}
                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'template' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
             >
                Use Template
             </button>
             <button 
                onClick={() => setMode('manual')}
                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'manual' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
             >
                Manual Message
             </button>
        </div>

        {mode === 'template' && (
             <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Choose a template:</h3>
              {templates.length > 0 ? (
                templates.map(template => (
                  <div 
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border rounded-md cursor-pointer transition-all ${selectedTemplate === template.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{template.text}</p>
                  </div>
                ))
              ) : (
                 <div className="p-4 border border-gray-300 rounded-md bg-gray-50 text-center">
                    <p className="text-sm text-gray-500">No message templates found for this contact.</p>
                 </div>
              )}
            </div>
        )}

        {mode === 'manual' && (
            <div>
                <label htmlFor="manual-message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Write your message:
                </label>
                <textarea
                    id="manual-message"
                    rows={5}
                    value={manualMessage}
                    onChange={(e) => setManualMessage(e.target.value)}
                    className="w-full p-3 text-sm text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your custom message here..."
                />
            </div>
        )}


        <div className="mt-8 flex justify-end space-x-4">
          <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
              Cancel
          </button>
          <button
              type="button"
              onClick={handleSend}
              disabled={isSendDisabled}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
              Send on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
