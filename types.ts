export interface Contact {
  id: number; // Frontend unique ID, typically contactRow
  contactRow: number; // Row number in Contacts sheet for updates/deletes
  companyRow: number; // Row number in Companies sheet for updates

  // --- Company Fields ---
  leadNo: string;
  country: string;
  salesPerson: string;
  internName?: string;
  company: string;
  importValue: string | null;
  totalImportValue: string | null;
  website: string | null;
  companyLinkedinPage: string | null;
  facebook: string | null;
  instagram: string | null;
  
  // --- Person Fields ---
  keyPerson: string;
  designation: string;
  number: string;
  email: string | null;
  personLinkedinPage: string | null;

  // --- Sheet/App Fields ---
  // These fields are associated with a person/contact, not the company
  verification: 'Verified' | 'Not verified' | string;
  nextFollowUpDate: string | null;
  tEMP1: string | null;
  tEMP2: string | null;
  status?: string;
}

export interface FollowUpLog {
  leadNo: string;
  company: string;
  keyPerson: string;
  contactNumber?: string;
  salesPerson: string;
  timestamp: string;
  action: string;
  details: string;
  remarks: string;
  proofUrl?: string;
}

// Added for the new Admin User Management panel
export interface User {
  userRow: number;
  name: string;
  role: 'Sales Person' | 'Intern' | 'Admin';
  password?: string;
}