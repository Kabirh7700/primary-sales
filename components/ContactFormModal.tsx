
import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';
import type { ModalMode, LoggedInUserRole } from '../App';

interface ContactFormModalProps {
  mode: ModalMode;
  initialData?: Partial<Contact>; // Can be a full contact for edit, or just company data for new-person/company
  onClose: () => void;
  onSave: (data: any) => void;
  loggedInUser: string | null;
  loggedInUserRole: LoggedInUserRole | null;
  interns: string[];
  primarySalesPerson: string | null;
}

const companyFields: (keyof Contact)[] = ['salesPerson', 'company', 'country', 'internName', 'importValue', 'totalImportValue', 'website', 'companyLinkedinPage', 'facebook', 'instagram'];
const personFields: (keyof Contact)[] = ['keyPerson', 'designation', 'number', 'email', 'personLinkedinPage'];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({ mode, initialData, onClose, onSave, loggedInUser, loggedInUserRole, interns, primarySalesPerson }) => {
  const [companyData, setCompanyData] = useState<Partial<Contact>>({});
  const [personsData, setPersonsData] = useState<Partial<Contact>[]>([{}]);

  useEffect(() => {
    if (mode === 'new-lead') {
        if (loggedInUserRole === 'intern') {
            setCompanyData({ salesPerson: primarySalesPerson || undefined, internName: loggedInUser || undefined });
        } else { // salesperson
            setCompanyData({ salesPerson: loggedInUser });
        }
        setPersonsData([{}]);
    } else if (mode === 'new-person' && initialData) {
      setCompanyData({ 
        ...companyFields.reduce((acc, field) => ({ ...acc, [field]: initialData[field] || '' }), {}),
        salesPerson: initialData.salesPerson,
      });
      setPersonsData([{}]);
    } else if (mode === 'edit-person' && initialData) {
      setCompanyData({}); // Not used in form, just for consistency
      setPersonsData([initialData]);
    } else if (mode === 'edit-company' && initialData) {
        setCompanyData(initialData);
        setPersonsData([]); // No person data needed for company edit
    }
  }, [mode, initialData, loggedInUser, loggedInUserRole, primarySalesPerson]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newPersons = [...personsData];
    newPersons[index] = { ...newPersons[index], [name]: value };
    setPersonsData(newPersons);
  };
  
  const addPerson = () => {
    setPersonsData([...personsData, {}]);
  };

  const removePerson = (index: number) => {
    if (personsData.length > 1) {
        setPersonsData(personsData.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loggedInUserRole === 'intern' && mode === 'new-lead' && !companyData.salesPerson) {
        alert("Your primary salesperson could not be determined. You can't add a new lead until you are assigned to at least one existing lead.");
        return;
    }

    if (mode === 'new-lead') {
        onSave({ companyData, personsData });
    } else if (mode === 'edit-company') {
        onSave(companyData);
    } else { // 'new-person' or 'edit-person'
        onSave(personsData[0]);
    }
  };
  
  const titles: Record<ModalMode, string> = {
      'new-lead': 'Add New Lead',
      'edit-person': `Edit Contact - ${initialData?.keyPerson}`,
      'new-person': `Add New Contact to ${initialData?.company}`,
      'edit-company': `Edit Company - ${initialData?.company}`
  };

  const formatLabel = (key: string) => {
    switch (key) {
        case 'importValue': return 'Import Value in Mn $';
        case 'totalImportValue': return 'Total Import Value ($)';
        case 'internName': return 'Assign Intern';
        case 'salesPerson': return 'Sales Person';
        default: return key.replace(/([A-Z])/g, ' $1').replace('company', 'Company ').replace('person', 'Person ').replace(/^./, (str) => str.toUpperCase());
    }
  };
  
  const isCompanyFieldDisabled = mode === 'new-person';

  const renderCompanyFields = () => (
    <fieldset className="mb-6 p-4 border rounded-md">
      <legend className="px-2 font-semibold text-gray-700">Company Information</legend>
      {loggedInUserRole === 'intern' && mode === 'new-lead' && !primarySalesPerson && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Notice</p>
          <p>Your primary salesperson isn't set. Please be assigned a lead by a salesperson before you can add a new one.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {companyFields.map(key => {
            // Case 1: SalesPerson field (only shown, disabled, in new-lead mode)
            if (key === 'salesPerson') {
                if (mode === 'new-lead') {
                    return (
                        <div key={key}>
                            <label htmlFor={`company-${key}`} className="block text-sm font-medium text-gray-600 mb-1">{formatLabel(key)}</label>
                            <input type="text" id={`company-${key}`} name={key} value={companyData[key] || ''}
                                disabled
                                className="w-full px-3 py-2 text-gray-800 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed" />
                        </div>
                    );
                }
                return null; // Hide in all other modes
            }

            // Case 2: InternName field (special handling)
            if (key === 'internName') {
                // SalesPerson can select/type intern in new-lead or edit-company mode
                if (loggedInUserRole === 'salesPerson' && (mode === 'new-lead' || mode === 'edit-company')) {
                    return (
                        <div key={key}>
                            <label htmlFor="company-internName" className="block text-sm font-medium text-gray-600 mb-1">{formatLabel(key)}</label>
                            <input
                                id="company-internName"
                                name="internName"
                                type="text"
                                value={companyData.internName || ''}
                                onChange={handleCompanyChange}
                                list="interns-list"
                                className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Select or type to add new"
                            />
                            <datalist id="interns-list">
                                {interns.map(i => <option key={i} value={i} />)}
                            </datalist>
                        </div>
                    );
                }
                // Intern sees disabled field in new-lead mode
                if (loggedInUserRole === 'intern' && mode === 'new-lead') {
                    return (
                        <div key={key}>
                            <label htmlFor={`company-${key}`} className="block text-sm font-medium text-gray-600 mb-1">{formatLabel(key)}</label>
                            <input type="text" id={`company-${key}`} name={key} value={companyData[key] || ''}
                                disabled
                                className="w-full px-3 py-2 text-gray-800 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed" />
                        </div>
                    );
                }
                // Fall through to generic renderer for other cases (e.g., disabled field in new-person mode)
            }

            // Case 3: All other fields (including internName fall-through)
            return (
                <div key={key}>
                    <label htmlFor={`company-${key}`} className="block text-sm font-medium text-gray-600 mb-1">{formatLabel(key)}</label>
                    <input type={(key === 'importValue' || key === 'totalImportValue') ? 'number' : 'text'} step="0.01"
                        id={`company-${key}`} name={key} value={companyData[key] || ''} onChange={handleCompanyChange}
                        disabled={isCompanyFieldDisabled} required={key === 'company'}
                        className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
            );
        })}
      </div>
    </fieldset>
  );

  const renderPersonFields = (person: Partial<Contact>, index: number) => (
    <fieldset key={index} className="p-4 border rounded-md relative mb-6">
        <legend className="px-2 font-semibold text-gray-700">
            {`Contact Person ${mode === 'new-lead' ? `#${index + 1}` : ''}`}
        </legend>
        {mode === 'new-lead' && personsData.length > 1 && (
             <button type="button" onClick={() => removePerson(index)} 
                className="absolute top-0 right-2 text-red-500 hover:text-red-700 font-bold"
                title="Remove Person"
             >&times;</button>
        )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {personFields.map(key => (
                <div key={key}>
                    <label htmlFor={`${key}-${index}`} className="block text-sm font-medium text-gray-600 mb-1">{formatLabel(key)}</label>
                    <input type="text" id={`${key}-${index}`} name={key} value={person[key] || ''} 
                    onChange={(e) => handlePersonChange(index, e)}
                    required={key === 'keyPerson' || key === 'number'}
                    className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            ))}
        </div>
    </fieldset>
  );


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{titles[mode]}</h2>
        <form onSubmit={handleSubmit}>
            {(mode === 'new-lead' || mode === 'new-person' || mode === 'edit-company') && renderCompanyFields()}

            {(mode === 'new-lead' || mode === 'new-person' || mode === 'edit-person') && personsData.map((person, index) => renderPersonFields(person, index))}

            {mode === 'new-lead' && (
                <div className="mt-4">
                    <button type="button" onClick={addPerson}
                        className="w-full px-4 py-2 text-sm border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-md hover:bg-gray-100 hover:border-gray-400 focus:outline-none">
                        + Add Another Person
                    </button>
                </div>
            )}

            <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none">
                    Cancel
                </button>
                <button type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none">
                    Save
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
