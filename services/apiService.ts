import type { Contact, FollowUpLog, User } from '../types';
import type { ModalMode } from '../App';
import { API_URL } from '../constants';

interface InitialData {
    contacts: Contact[];
    followUps: FollowUpLog[];
}

interface ApiResponse {
    status: 'success' | 'error';
    message?: string;
    data?: any;
}

// Helper function to normalize a raw log object from any API response
const normalizeFollowUpLog = (log: any): FollowUpLog => ({
    leadNo: log['Lead-no'] || log.leadNo || '',
    company: log.Company || log.company || '',
    keyPerson: log['Key Person'] || log.keyPerson || '',
    contactNumber: log['Contact Number'] || log.contactNumber || '',
    salesPerson: log['Sales Person'] || log.salesPerson || '',
    timestamp: log.Timestamp || log.timestamp || new Date().toISOString(),
    action: log.Action || log.action || '',
    details: log.Details || log.details || '',
    remarks: log.Remarks || log.remarks || '',
    proofUrl: log['Proof URL'] || log.proofUrl || undefined,
});

// Fetches user lists for the login screen from the central user management system.
export const fetchLoginData = async (): Promise<{ salesPersons: string[], interns: string[] }> => {
    try {
        const users = await fetchUsers();
        
        const salesPersons: string[] = [];
        const interns: string[] = [];

        if (Array.isArray(users)) {
            users.forEach(user => {
                if (user.role === 'Sales Person') {
                    salesPersons.push(user.name);
                } else if (user.role === 'Intern') {
                    interns.push(user.name);
                }
            });
        }

        return { salesPersons: salesPersons.sort(), interns: interns.sort() };
    } catch (error) {
        console.error("Failed to fetch login data:", error);
        throw new Error("Could not load user lists. Please check the API endpoint and your network connection.");
    }
};


export const fetchInitialData = async (): Promise<InitialData> => {
  let response;
  try {
    if (!API_URL || !API_URL.startsWith('https://script.google.com/')) {
        throw new Error("Configuration Error: The Google Apps Script URL in constants.ts is missing or invalid. Please ensure it is set correctly and has been deployed.");
    }
    const url = new URL(API_URL);
    url.searchParams.append('action', 'getInitialData');

    response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const result = await response.json();
    
    if (result.status === 'error') {
        throw new Error(result.message);
    }
    const data = result.data;
    
    if (!data || !Array.isArray(data.contacts) || !Array.isArray(data.followUps)) {
        throw new Error("Fetched data is not in the expected format (object with contacts and followUps arrays).");
    }
    
    const contacts = data.contacts.map((item: any, index: number): Contact => ({
      id: item.contactRow || -(Date.now() + index),
      contactRow: item.contactRow,
      companyRow: item.companyRow,
      leadNo: item['Lead-no'] || '',
      country: item.Country || '',
      salesPerson: item['Sales Person'] || '',
      internName: item['Intern Name'] || undefined,
      company: item.Company || '',
      importValue: item['Import Value in Mn $ (Chiansaw & Brushcutters)'] || null,
      totalImportValue: item['Total Import Value ($)'] || null,
      website: item.Website || null,
      companyLinkedinPage: item['Linkedin Page (Company)'] || item['Linkedin Page'] || null,
      facebook: item.Facebook || null,
      instagram: item.Instagram || null,
      keyPerson: item['Key Person'] || '',
      designation: item.Designation || '',
      number: String(item.Number || ''),
      email: item.Email || null,
      personLinkedinPage: item['Linkedin Page (Person)'] || null,
      verification: item.Verification || 'Not verified',
      nextFollowUpDate: item['Next Follow-up Date'] || null,
      tEMP1: item.TEMP1 || null,
      tEMP2: item.TEMP2 || null,
      status: item.Status || '',
    }));

    const followUps: FollowUpLog[] = data.followUps.map(normalizeFollowUpLog);

    return { contacts, followUps };

  } catch (error) {
    console.error("Failed to fetch initial data:", error);
    if (error instanceof SyntaxError) {
        console.error("Response that failed to parse:", response ? await response.text() : "No response");
        throw new Error("The app received invalid data from the server. This is often caused by an error in the Google Apps Script or because it was not re-deployed after changes. Please check the script and deploy it again.");
    }
     if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
`Connection to Google Sheets failed. This is usually a configuration or network issue, not a code bug.

Please check the following:
1.  Are you connected to the internet?
2.  Is the Google Apps Script URL in the 'constants.ts' file correct?
3.  Have you re-deployed your script after making changes?
4.  Is the script deployed with "Who has access" set to "Anyone"?

If you've checked all of the above, try visiting the script URL directly in your browser to authorize its permissions.`
      );
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not fetch data. Please check the API endpoint and your network connection.");
  }
};

const postToAction = async (payload: object): Promise<ApiResponse> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            },
        });

        const result: ApiResponse = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'The API operation failed.');
        }
        return result;
    } catch (error) {
        console.error("API POST action failed:", error);
        if (error instanceof Error) {
            throw new Error(`Could not save data to the sheet. Reason: ${error.message}`);
        }
        throw new Error("An unknown error occurred while saving data to the sheet.");
    }
};

export const authenticateUser = async (name: string, password: string, role: string): Promise<ApiResponse> => {
    return postToAction({ action: 'login', name, password, role });
};

export const fetchUsers = async (): Promise<User[]> => {
    const response = await postToAction({ action: 'getUsers' });
    return response.data as User[];
};

export const addUser = async (userData: Omit<User, 'userRow'> & { password?: string }): Promise<ApiResponse> => {
    return postToAction({ action: 'addUser', userData });
};

export const updateUser = async (userData: User & { password?: string }): Promise<ApiResponse> => {
    return postToAction({ action: 'updateUser', userData });
};

export const deleteUser = async (userRow: number): Promise<ApiResponse> => {
    return postToAction({ action: 'deleteUser', userRow });
};

export const saveContact = async (data: any, mode: ModalMode, originalContact?: Contact): Promise<ApiResponse> => {
    const payload: any = { 
      action: 'saveContact', 
      mode, 
    };

    if (mode === 'new-lead') {
        payload.contactData = data;
    } else {
        payload.contactData = data;
        if (mode === 'new-person' && originalContact) {
            payload.leadNo = originalContact.leadNo;
            payload.companyName = originalContact.company;
        }
    }
    
    return postToAction(payload);
};

export const updateContact = async (contact: Contact) => {
    const contactDataForSheet = { ...contact } as any;
    
    if (contactDataForSheet.nextFollowUpDate && /^\d{4}-\d{2}-\d{2}$/.test(contactDataForSheet.nextFollowUpDate)) {
        try {
            const [year, month, day] = contactDataForSheet.nextFollowUpDate.split('-').map(Number);
            const utcDate = new Date(Date.UTC(year, month - 1, day));
            contactDataForSheet.nextFollowUpDate = utcDate.toISOString();
        } catch (e) { console.error("Error processing date:", e); }
    }

    return postToAction({ action: 'updateContact', contactData: contactDataForSheet });
};

export const deletePerson = async (contactRow: number) => {
    return postToAction({ action: 'deletePerson', contactRow });
};

export const logFollowUp = async (logData: object): Promise<ApiResponse> => {
    const logDataWithDate = { ...logData } as any;
    if (logDataWithDate.nextFollowUpDate && /^\d{4}-\d{2}-\d{2}$/.test(logDataWithDate.nextFollowUpDate)) {
        try {
             const [year, month, day] = logDataWithDate.nextFollowUpDate.split('-').map(Number);
             const utcDate = new Date(Date.UTC(year, month - 1, day));
             logDataWithDate.nextFollowUpDate = utcDate.toISOString();
        } catch(e) { /* ignore */}
    }
    
    const payload = {
        action: 'logFollowUp',
        logData: logDataWithDate,
    };
    
    const result = await postToAction(payload);
    
    if (result.data) {
        result.data = normalizeFollowUpLog(result.data);
    }

    return result;
};
