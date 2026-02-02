// Lead Hunter AI - Google Sheets Integration

/**
 * Send lead to Google Sheets via Apps Script Web App
 * User needs to deploy a simple Apps Script and provide the URL
 *
 * @param {object} lead - Lead data
 * @param {string} sheetsWebhookUrl - Google Apps Script Web App URL
 * @returns {Promise<object>} - Response
 */
export async function sendToGoogleSheets(lead, sheetsWebhookUrl) {
  if (!sheetsWebhookUrl) {
    throw new Error('No Google Sheets webhook URL configured');
  }

  const row = {
    timestamp: new Date().toISOString(),
    name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    website: lead.website || '',
    address: lead.address || '',
    category: lead.category || lead.industry || '',
    platform: lead.platform || '',
    score: lead.score || 0,
    urgency: lead.urgencyLevel || 'medium',
    leadType: lead.leadType || 'pain',
    comment: lead.comment || '',
    profileUrl: lead.profileUrl || lead.url || '',
    company: lead.company || '',
    analysis: typeof lead.analysis === 'object' ? lead.analysis.summary || '' : (lead.analysis || ''),
    painPoints: (lead.painPoints || []).join(', '),
    notes: lead.notes || '',
    contacted: lead.contacted ? 'Yes' : 'No'
  };

  try {
    const response = await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      throw new Error(`Google Sheets error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Google Sheets error:', error);
    throw error;
  }
}

/**
 * Generate the Apps Script code for the user to deploy
 * @returns {string} - Apps Script code
 */
export function generateAppsScriptCode() {
  return `// Lead Hunter AI - Google Sheets Integration
//
// SETUP:
// 1. Create a new Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code
// 4. Click Deploy > New deployment
// 5. Select "Web app"
// 6. Set "Who has access" to "Anyone"
// 7. Click Deploy and copy the URL
// 8. Paste the URL in Lead Hunter extension settings

const SHEET_NAME = 'Leads'; // Change if needed

function doPost(e) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Create sheet if doesn't exist
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 17).setValues([[
        'Timestamp', 'Name', 'Phone', 'Email', 'Website', 'Address',
        'Category', 'Platform', 'Score', 'Urgency', 'Lead Type',
        'Comment', 'Profile URL', 'Company', 'Analysis', 'Pain Points', 'Notes'
      ]]);
      sheet.getRange(1, 1, 1, 17).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const data = JSON.parse(e.postData.contents);

    const row = [
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.website || '',
      data.address || '',
      data.category || '',
      data.platform || '',
      data.score || 0,
      data.urgency || 'medium',
      data.leadType || 'pain',
      data.comment || '',
      data.profileUrl || '',
      data.company || '',
      data.analysis || '',
      data.painPoints || '',
      data.notes || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Lead Hunter AI - Google Sheets Integration is active')
    .setMimeType(ContentService.MimeType.TEXT);
}
`;
}

/**
 * Export leads to CSV format
 * @param {array} leads - Array of leads
 * @returns {string} - CSV string
 */
export function exportToCSV(leads) {
  const headers = [
    'Timestamp', 'Name', 'Phone', 'Email', 'Website', 'Address',
    'Category', 'Platform', 'Score', 'Urgency', 'Lead Type',
    'Comment', 'Profile URL', 'Company', 'Analysis', 'Pain Points', 'Notes', 'Contacted'
  ];

  const rows = leads.map(lead => [
    lead.timestamp || '',
    escapeCsvField(lead.name || ''),
    lead.phone || '',
    lead.email || '',
    lead.website || '',
    escapeCsvField(lead.address || ''),
    lead.category || lead.industry || '',
    lead.platform || '',
    lead.score || 0,
    lead.urgencyLevel || 'medium',
    lead.leadType || 'pain',
    escapeCsvField(lead.comment || ''),
    lead.profileUrl || lead.url || '',
    lead.company || '',
    escapeCsvField(typeof lead.analysis === 'object' ? lead.analysis.summary || '' : (lead.analysis || '')),
    escapeCsvField((lead.painPoints || []).join('; ')),
    escapeCsvField(lead.notes || ''),
    lead.contacted ? 'Yes' : 'No'
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}

function escapeCsvField(field) {
  if (typeof field !== 'string') return field;
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
