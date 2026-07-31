
export const API_URL = "https://script.google.com/macros/s/AKfycbxrv0goAVQJkYiNBrDoay5nUjL1P3dBQlWVRlcLhZz1v2hn3nghBhGkv7sOboYPRUBfjg/exec";

export const ADMIN_USER = "Admin";

// Grouped actions for the Quick Actions dropdown in the data table.
export const QUICK_ACTION_GROUPS = {
  'Initial Contact': ["Call", "Intro Email", "LinkedIn"],
  'Engagement': ["Price List Shared", "Meeting", "Proposal"],
  'Closing': ["Negotiation", "Order Received", "Payment Received"],
  'Lead Status Update': ["Not Interested", "Deal Lost", "On Hold"],
  'General': ["Set Follow-up", "Add Note"],
};

// The positive stages of the sales pipeline for visualization in the Pipeline Tracker.
// The order here determines the display order.
export const PIPELINE_STAGES = [
    "Call",
    "Intro Email",
    "LinkedIn",
    "Price List Shared",
    "Meeting",
    "Proposal",
    "Negotiation",
    "Order Received",
    "Payment Received"
];

// Consistent status options used for filtering and selection.
export const STATUS_OPTIONS = ["Hot", "Warm", "Cold", "Not Interested", "Deal Lost", "On Hold"];


// Kept for consistency, though table headers are currently hardcoded in DataTable.
export const TABLE_HEADERS = [
  "Lead-no",
  "Company & Contact",
  "Country",
  "Last Action",
  "Next Follow-up",
  "Quick Actions",
  "Status",
  "Socials & Actions",
];
