

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { saveContact, updateContact, deletePerson as deletePersonAPI, logFollowUp, fetchInitialData } from './services/apiService';
import type { Contact, FollowUpLog, User } from './types';
import { DataTable } from './components/DataTable';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ContactFormModal } from './components/ContactFormModal';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { WhatsAppModal } from './components/WhatsAppModal';
import { Login } from './components/Login';
import { FollowUpModal, type FollowUpSaveData } from './components/FollowUpModal';
import { PIPELINE_STAGES, ADMIN_USER } from './constants';
import { Analysis } from './components/Analysis';
import { AdminPanel } from './components/AdminPanel';
import { DashboardIcon, AnalysisIcon, AdminIcon, ComparisonIcon, TeamIcon, UsersIcon } from './components/icons';
import { ComparisonPanel } from './components/ComparisonPanel';
import { TeamView } from './components/TeamView';
import { UserManagementPanel } from './components/UserManagementPanel';
import { getCache, setCache } from './services/cachingService';

const SESSION_STORAGE_KEY = 'salesAppLoggedInUser';
const INITIAL_DATA_CACHE_KEY = 'initialDataCache';


type FollowUpData = {
    contact: Contact;
    action: string;
    details: string;
};

type View = 'dashboard' | 'analysis' | 'admin' | 'team';
type AdminView = 'overview' | 'comparison' | 'users';
export type ModalMode = 'new-lead' | 'new-person' | 'edit-person' | 'edit-company';
export type LoggedInUserRole = 'salesPerson' | 'intern' | 'admin';

type ModalState = {
  isOpen: boolean;
  mode: ModalMode;
  contact?: Contact; // The person being edited or the company reference for a new person/company
};

const App: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => sessionStorage.getItem(SESSION_STORAGE_KEY));
  const [loggedInUserRole, setLoggedInUserRole] = useState<LoggedInUserRole | null>(null);
  
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'new-lead' });
  const [whatsAppModalContact, setWhatsAppModalContact] = useState<Contact | null>(null);
  const [followUpModalData, setFollowUpModalData] = useState<FollowUpData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [adminView, setAdminView] = useState<AdminView>('overview');
  const [primarySalesPerson, setPrimarySalesPerson] = useState<string | null>(null);

  const loadData = useCallback(async (showLoader = true) => {
    const cachedData = getCache<{ contacts: Contact[], followUps: FollowUpLog[] }>(INITIAL_DATA_CACHE_KEY);

    // If there's cached data, display it immediately and prevent the full-screen loader.
    if (cachedData) {
      setContacts(cachedData.contacts);
      setFollowUps(cachedData.followUps);
      showLoader = false; // Don't show the main loader as we already have data to display.
    }

    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      // Always fetch fresh data from the network.
      const { contacts: fetchedContacts, followUps: fetchedFollowUps } = await fetchInitialData();
      setContacts(fetchedContacts);
      setFollowUps(fetchedFollowUps);
      // Update the cache with the fresh data.
      setCache(INITIAL_DATA_CACHE_KEY, { contacts: fetchedContacts, followUps: fetchedFollowUps });
    } catch (err) {
      // Only show a blocking error if there was no cached data to begin with.
      if (!cachedData) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } else {
        console.error("Failed to refresh data in the background:", err);
        // Optionally, show a non-blocking toast notification here to inform the user.
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (loggedInUser) {
        if (loggedInUser === ADMIN_USER) {
          setCurrentView('admin');
          setAdminView('overview');
        } else {
          setCurrentView('dashboard');
        }
        loadData();
    }
  }, [loadData, loggedInUser]);
  
  useEffect(() => {
    if (loggedInUser) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, loggedInUser);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [loggedInUser]);

  useEffect(() => {
    if (loggedInUserRole === 'intern' && loggedInUser && contacts.length > 0) {
        const salesPersonCounts = contacts
            .filter(c => c.internName === loggedInUser && c.salesPerson)
            .reduce((acc, c) => {
                acc[c.salesPerson] = (acc[c.salesPerson] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        if (Object.keys(salesPersonCounts).length > 0) {
            const primary = Object.entries(salesPersonCounts).sort((a, b) => b[1] - a[1])[0][0];
            setPrimarySalesPerson(primary);
        } else {
            setPrimarySalesPerson(null);
        }
    } else {
        setPrimarySalesPerson(null);
    }
  }, [loggedInUser, loggedInUserRole, contacts]);


  const salesPersons = useMemo(() => {
    const uniqueSalesPersons = new Set(contacts.map(c => c.salesPerson).filter(Boolean));
    return Array.from(uniqueSalesPersons).sort();
  }, [contacts]);
  
  const interns = useMemo(() => {
    const uniqueInterns = new Set(contacts.map(c => c.internName).filter(Boolean));
    return Array.from(uniqueInterns as Set<string>).sort();
  }, [contacts]);

  const salesPersonInterns = useMemo(() => {
    if (loggedInUserRole !== 'salesPerson' || !loggedInUser) {
        return [];
    }
    const internSet = new Set<string>();
    contacts
        .filter(c => c.salesPerson === loggedInUser && c.internName)
        .forEach(c => {
            if (c.internName) {
                internSet.add(c.internName);
            }
        });
    
    return Array.from(internSet).sort();
  }, [contacts, loggedInUser, loggedInUserRole]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(contacts.map(c => c.country).filter(Boolean));
    return Array.from(countries).sort();
  }, [contacts]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(contacts.map(c => c.company).filter(Boolean));
    return Array.from(companies).sort();
  }, [contacts]);

  const handleLogin = (user: string, role: LoggedInUserRole) => {
    setLoggedInUser(user);
    setLoggedInUserRole(role);
  };
  const handleLogout = () => {
      setLoggedInUser(null);
      setLoggedInUserRole(null);
      setContacts([]);
      setFollowUps([]);
  };
  
  const handleOpenModal = useCallback((mode: ModalMode, contact?: Contact) => {
    setModalState({ isOpen: true, mode, contact });
  }, []);
  const handleCloseModal = () => setModalState({ isOpen: false, mode: 'new-lead' });

  const handleSaveContact = useCallback(async (data: any) => {
      const { mode, contact: originalContact } = modalState;
      const originalContacts = [...contacts];
      handleCloseModal();

      try {
          if (mode === 'new-lead') {
              const response = await saveContact(data, mode);
              const newLeadNo = response.data?.newLeadNo;

              if (!newLeadNo) {
                  throw new Error("Failed to get new Lead-no from server.");
              }
              
              const newContactsFromSave: Contact[] = data.personsData.map((person: Partial<Contact>, index: number) => ({
                  ...data.companyData, ...person, id: -(Date.now() + index),
                  leadNo: newLeadNo, contactRow: 0, companyRow: 0,
                  verification: 'Not verified', status: '',
              }));
              setContacts(prev => [...prev, ...newContactsFromSave]);

              const creationLog: FollowUpLog = {
                  leadNo: newContactsFromSave[0].leadNo,
                  company: newContactsFromSave[0].company,
                  keyPerson: newContactsFromSave[0].keyPerson,
                  salesPerson: loggedInUserRole === 'intern' ? newContactsFromSave[0].salesPerson : loggedInUser!,
                  timestamp: new Date().toISOString(),
                  action: 'Lead Created',
                  details: 'New lead added to the system.',
                  remarks: loggedInUserRole === 'intern' ? `(By Intern: ${loggedInUser}) System auto-log` : 'System auto-log',
              };

              setFollowUps(prev => [...prev, creationLog]);
              await logFollowUp(creationLog);

          } else if (mode === 'new-person' && originalContact) {
              await saveContact(data, mode, originalContact);
              await loadData(false);
          } else if (mode === 'edit-person' && originalContact) {
              const updatedContact = { ...originalContact, ...data };
              setContacts(prev => prev.map(c => c.id === originalContact.id ? updatedContact : c));
              await updateContact(updatedContact);
          } else if (mode === 'edit-company' && originalContact) {
              setContacts(prev => prev.map(c => c.leadNo === originalContact.leadNo ? { ...c, ...data } : c));
              await updateContact({ ...originalContact, ...data });
          }
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save contact.');
          setContacts(originalContacts);
      }
  }, [modalState, loggedInUser, loggedInUserRole, loadData, contacts]);
  
  const handleDeletePerson = useCallback(async (person: Contact) => {
      if (window.confirm(`Are you sure you want to delete ${person.keyPerson}?`)) {
          const originalContacts = contacts;
          try {
              setContacts(prev => prev.filter(p => p.id !== person.id));
              await deletePersonAPI(person.contactRow);
          } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete contact.');
              setContacts(originalContacts);
          }
      }
  }, [contacts]);

  const handleStatusChange = useCallback(async (contact: Contact, newStatus: string) => {
    const updatedContact = { ...contact, status: newStatus };
    const originalContacts = [...contacts];
    const originalFollowUps = [...followUps];
    
    setContacts(prev => prev.map(c => c.id === contact.id ? updatedContact : c));
    const newLog: FollowUpLog = {
        leadNo: contact.leadNo, company: contact.company, keyPerson: contact.keyPerson,
        contactNumber: contact.number,
        salesPerson: loggedInUserRole === 'intern' ? contact.salesPerson : loggedInUser!,
        timestamp: new Date().toISOString(),
        action: 'Status Changed', details: `Status set to ${newStatus}`,
        remarks: loggedInUserRole === 'intern' ? `(By Intern: ${loggedInUser}) System auto-log` : 'System auto-log',
    };
    setFollowUps(prev => [...prev, newLog]);

    try {
        await Promise.all([ updateContact(updatedContact), logFollowUp(newLog) ]);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status.');
        setContacts(originalContacts);
        setFollowUps(originalFollowUps);
    }
  }, [loggedInUser, loggedInUserRole, contacts, followUps]);

  const handleQuickAction = (contact: Contact, action: string) => {
    setFollowUpModalData({ contact, action, details: `Quick Action: ${action}` });
  };
  
  const handleLogSocialClick = useCallback(async (contact: Contact, action: string, details: string) => {
      const originalFollowUps = [...followUps];
      const newLog: FollowUpLog = {
          leadNo: contact.leadNo, company: contact.company, keyPerson: contact.keyPerson,
          contactNumber: contact.number, salesPerson: loggedInUserRole === 'intern' ? contact.salesPerson : loggedInUser!,
          timestamp: new Date().toISOString(), action, details,
          remarks: loggedInUserRole === 'intern' ? `(By Intern: ${loggedInUser}) Clicked from social links` : 'Clicked from social links'
      };
      setFollowUps(prev => [...prev, newLog]);

      try { await logFollowUp(newLog); } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to log action.');
          setFollowUps(originalFollowUps);
      }
  }, [loggedInUser, loggedInUserRole, followUps]);

  const handleOpenWhatsAppModal = (contact: Contact) => setWhatsAppModalContact(contact);
  const handleCloseWhatsAppModal = () => setWhatsAppModalContact(null);
  
  const handleSendWhatsApp = (data: { type: 'template' | 'manual', message: string, templateId?: 'tEMP1' | 'tEMP2' }) => {
      if (!whatsAppModalContact) return;
      const { type, message, templateId } = data;
      const details = type === 'template' ? `Sent template: ${templateId}` : `Sent manual message: "${message.substring(0, 50)}..."`;
      handleLogSocialClick(whatsAppModalContact, "WhatsApp Message Sent", details);
      handleCloseWhatsAppModal();
  };
  
  const handleSaveFollowUp = useCallback(async (data: FollowUpSaveData) => {
    if (!followUpModalData) return;
    const { contact, action, details } = followUpModalData;
    const { remarks, nextFollowUpDate, templateId, proofFile } = data;
    
    setFollowUpModalData(null);

    const originalContacts = [...contacts];
    const originalFollowUps = [...followUps];

    const updatedContact = { ...contact, nextFollowUpDate };
    if (templateId) { (updatedContact as any)[templateId] = remarks; }
    
    if (['Not Interested', 'Deal Lost', 'On Hold'].includes(action)) {
        updatedContact.status = action;
    }
    
    const getFinalRemarks = () => {
        const internTag = `(By Intern: ${loggedInUser})`;
        if (loggedInUserRole !== 'intern') return remarks;
        return remarks ? `${remarks} ${internTag}` : internTag;
    };

    const newLog: FollowUpLog = {
      leadNo: contact.leadNo, company: contact.company, keyPerson: contact.keyPerson,
      contactNumber: contact.number, salesPerson: loggedInUserRole === 'intern' ? contact.salesPerson : loggedInUser!,
      timestamp: new Date().toISOString(), action, details, remarks: getFinalRemarks(),
    };
    
    setContacts(prev => prev.map(c => c.id === contact.id ? updatedContact : c));
    setFollowUps(prev => [...prev, newLog]);
      
    try {
      await Promise.all([
        logFollowUp({ ...newLog, nextFollowUpDate, proofFile }),
        updateContact(updatedContact)
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save follow-up.');
      setContacts(originalContacts); 
      setFollowUps(originalFollowUps);
    }
  }, [followUpModalData, loggedInUser, loggedInUserRole, contacts, followUps]);

  const leadPipelineStages = useMemo(() => {
    const stages = new Map<string, string>();
    [...followUps].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach(log => {
        if (log.leadNo && (PIPELINE_STAGES.includes(log.action) || log.action === 'Lead Created')) {
            stages.set(log.leadNo, log.action);
        }
    });
    return stages;
  }, [followUps]);
  
  const lastActionsMap = useMemo(() => {
    const map = new Map<string, FollowUpLog>();
    [...followUps].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(log => { if (log.leadNo && !map.has(log.leadNo)) map.set(log.leadNo, log); });
    return map;
  }, [followUps]);

  const reminders = useMemo(() => {
    if (!loggedInUser || loggedInUser === ADMIN_USER) return { overdue: [], upcoming: [] };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(); sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const overdue: Contact[] = [], upcoming: Contact[] = [];
    contacts.filter(c => c.salesPerson === loggedInUser && c.nextFollowUpDate).forEach(c => {
        const followUpDate = new Date(c.nextFollowUpDate!);
        if (isNaN(followUpDate.getTime())) return;
        const followUpDateStartOfDay = new Date(followUpDate); followUpDateStartOfDay.setHours(0, 0, 0, 0);
        if (followUpDateStartOfDay < today) overdue.push(c);
        else if (followUpDate >= today && followUpDate <= sevenDaysFromNow) upcoming.push(c);
    });
    return { 
        overdue: overdue.sort((a, b) => new Date(a.nextFollowUpDate!).getTime() - new Date(b.nextFollowUpDate!).getTime()), 
        upcoming: upcoming.sort((a, b) => new Date(a.nextFollowUpDate!).getTime() - new Date(b.nextFollowUpDate!).getTime())
    };
  }, [contacts, loggedInUser]);
  
  const handleReminderClick = useCallback((contact: Contact) => {
    setActiveFilter(null); setCountryFilter(''); setCompanyFilter('');
    setSearchQuery(contact.company); 
  }, []);
  
  const handleAdminDrillDown = useCallback((salesperson: string, filter: string) => {
    setCurrentView('dashboard'); setSalesPersonFilter(salesperson); setActiveFilter(filter);
    setSearchQuery(''); setCountryFilter(''); setCompanyFilter('');
  }, []);

  const todaysFollowUpCount = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      let relevantContacts = contacts;
      if (loggedInUserRole === 'intern') relevantContacts = contacts.filter(c => c.internName === loggedInUser);
      else if (loggedInUserRole === 'salesPerson') relevantContacts = contacts.filter(c => c.salesPerson === loggedInUser);
      else return 0;
      return relevantContacts.filter(c => c.nextFollowUpDate && c.nextFollowUpDate.startsWith(todayStr)).length;
  }, [contacts, loggedInUser, loggedInUserRole]);

  const filteredAllContacts = useMemo(() => {
      if (loggedInUserRole === 'admin') {
          return salesPersonFilter ? contacts.filter(c => c.salesPerson === salesPersonFilter) : contacts;
      }
      if (loggedInUserRole === 'salesPerson') return contacts.filter(c => c.salesPerson === loggedInUser);
      if (loggedInUserRole === 'intern') return contacts.filter(c => c.internName === loggedInUser);
      return [];
  }, [contacts, loggedInUser, loggedInUserRole, salesPersonFilter]);

  const filteredContacts = useMemo(() => {
    return filteredAllContacts.filter(contact => {
        const matchesCountry = countryFilter ? contact.country === countryFilter : true;
        const matchesCompany = companyFilter ? contact.company === companyFilter : true;
        const lowerCaseSearchQuery = searchQuery.toLowerCase();
        const matchesSearch = searchQuery ? 
            (contact.company?.toLowerCase().includes(lowerCaseSearchQuery) || 
             contact.leadNo?.toLowerCase().includes(lowerCaseSearchQuery) ||
             contact.keyPerson?.toLowerCase().includes(lowerCaseSearchQuery))
            : true;
        let matchesFilter = true;
        if (activeFilter) {
            if (PIPELINE_STAGES.includes(activeFilter) || activeFilter === 'Fresh' || activeFilter === 'Lead Created') {
                matchesFilter = (leadPipelineStages.get(contact.leadNo) || 'Fresh') === activeFilter;
            } else if (activeFilter === 'today') {
                matchesFilter = contact.nextFollowUpDate?.startsWith(new Date().toISOString().split('T')[0]) || false;
            } else {
                matchesFilter = contact.status === activeFilter;
            }
        }
        return matchesSearch && matchesFilter && matchesCountry && matchesCompany;
    });
  }, [filteredAllContacts, searchQuery, activeFilter, countryFilter, companyFilter, leadPipelineStages]);
  
  const uniqueLeads = useMemo(() => {
      const seen = new Set<string>();
      return filteredContacts.filter(c => c.leadNo && !seen.has(c.leadNo) ? (seen.add(c.leadNo), true) : false);
  }, [filteredContacts]);

  const activeLeadNos = useMemo(() => new Set(filteredContacts.map(c => c.leadNo)), [filteredContacts]);

  if (!loggedInUser) {
    return <Login onLogin={handleLogin} />;
  }

  const mainContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={loadData} />;
    
    if (currentView === 'admin') {
        if (adminView === 'overview') {
            return <AdminPanel contacts={contacts} followUps={followUps} salesPersons={salesPersons} leadPipelineStages={leadPipelineStages} onDrillDown={handleAdminDrillDown} />;
        }
        if (adminView === 'comparison') {
            return <ComparisonPanel contacts={contacts} followUps={followUps} salesPersons={salesPersons} />;
        }
        if (adminView === 'users') {
            return <UserManagementPanel />;
        }
    }
    
    if (currentView === 'team') {
        return <TeamView contacts={contacts} followUps={followUps} loggedInUser={loggedInUser} />
    }

    return (
        <>
            {currentView === 'dashboard' && 
                <Dashboard uniqueLeads={uniqueLeads} allContacts={filteredAllContacts} leadPipelineStages={leadPipelineStages} activeFilter={activeFilter} onFilterChange={setActiveFilter} todaysFollowUpCount={todaysFollowUpCount} />
            }
            {currentView === 'analysis' && loggedInUserRole === 'salesPerson' &&
                <Analysis uniqueLeads={uniqueLeads} allContacts={filteredContacts} followUps={followUps.filter(f => f.salesPerson === loggedInUser)} leadPipelineStages={leadPipelineStages} />
            }
            {currentView === 'dashboard' && (
                <div className="mt-8">
                  <div className="flex justify-end items-center mb-4">
                      {(loggedInUserRole === 'salesPerson' || (loggedInUserRole === 'intern' && primarySalesPerson)) && (
                        <button onClick={() => handleOpenModal('new-lead')} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow">
                          + Add New Lead
                        </button>
                      )}
                  </div>
                  <DataTable contacts={filteredContacts} activeLeadNos={activeLeadNos} lastActionsMap={lastActionsMap} onEditPerson={(contact) => handleOpenModal('edit-person', contact)} onEditCompany={(contact) => handleOpenModal('edit-company', contact)} onAddPerson={(contact) => handleOpenModal('new-person', contact)} onDeletePerson={handleDeletePerson} onOpenWhatsAppModal={handleOpenWhatsAppModal} onStatusChange={handleStatusChange} onQuickAction={handleQuickAction} onLogSocialClick={handleLogSocialClick} />
                </div>
            )}
        </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
        <div className="flex">
            <nav className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 space-y-6">
                {loggedInUserRole === 'admin' ? (
                    <>
                        <button onClick={() => { setCurrentView('admin'); setAdminView('overview'); }} title="Overview Dashboard" className={`p-3 rounded-xl transition-colors ${currentView === 'admin' && adminView === 'overview' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><AdminIcon /></button>
                        <button onClick={() => { setCurrentView('admin'); setAdminView('comparison'); }} title="Salesperson Comparison" className={`p-3 rounded-xl transition-colors ${currentView === 'admin' && adminView === 'comparison' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><ComparisonIcon /></button>
                         <button onClick={() => { setCurrentView('admin'); setAdminView('users'); }} title="User Management" className={`p-3 rounded-xl transition-colors ${currentView === 'admin' && adminView === 'users' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><UsersIcon /></button>
                    </>
                ) : (
                    <>
                         <button onClick={() => setCurrentView('dashboard')} title="Dashboard" className={`p-3 rounded-xl transition-colors ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><DashboardIcon /></button>
                         {loggedInUserRole === 'salesPerson' && (
                            <>
                                <button onClick={() => setCurrentView('analysis')} title="Analysis" className={`p-3 rounded-xl transition-colors ${currentView === 'analysis' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><AnalysisIcon /></button>
                                <button onClick={() => setCurrentView('team')} title="Team View" className={`p-3 rounded-xl transition-colors ${currentView === 'team' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><TeamIcon /></button>
                            </>
                         )}
                    </>
                )}
            </nav>

            <main className="flex-1">
                <Header user={loggedInUser} onLogout={handleLogout} searchQuery={searchQuery} onSearchChange={setSearchQuery} countryFilter={countryFilter} onCountryFilterChange={setCountryFilter} companyFilter={companyFilter} onCompanyFilterChange={setCompanyFilter} uniqueCountries={uniqueCountries} uniqueCompanies={uniqueCompanies} reminders={reminders} onReminderClick={handleReminderClick} salesPersonFilter={salesPersonFilter} onSalesPersonFilterChange={setSalesPersonFilter} salesPersons={salesPersons} />
                <div className="p-6 md:p-8">
                    {mainContent()}
                </div>
            </main>
        </div>

        {modalState.isOpen && ( <ContactFormModal mode={modalState.mode} initialData={modalState.contact} onClose={handleCloseModal} onSave={handleSaveContact} loggedInUser={loggedInUser} loggedInUserRole={loggedInUserRole} interns={loggedInUserRole === 'salesPerson' ? salesPersonInterns : interns} primarySalesPerson={primarySalesPerson} /> )}
        {whatsAppModalContact && ( <WhatsAppModal contact={whatsAppModalContact} onClose={handleCloseWhatsAppModal} onSend={handleSendWhatsApp} /> )}
        {followUpModalData && ( <FollowUpModal logDetails={followUpModalData} history={followUps.filter(f => f.leadNo?.trim() === followUpModalData.contact.leadNo?.trim())} onClose={() => setFollowUpModalData(null)} onSave={handleSaveFollowUp} /> )}
    </div>
  );
};

export default App;
