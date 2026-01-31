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
    platform: lead.platform || '',
    score: lead.score || 0,
    urgency: lead.urgencyLevel || 'medium',
    comment: lead.comment || '',
    profileUrl: lead.profileUrl || '',
    email: lead.email || '',
    company: lead.company || '',
    analysis: lead.analysis || '',
    painPoints: (lead.painPoints || []).join(', '),
    messageDraft: lead.messageDraft || '',
    contacted: lead.contacted ? 'Yes' : 'No',
    isBusinessOwner: lead.isBusinessOwner ? 'Yes' : 'Unknown'
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Create sheet if doesn't exist
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      // Add headers
      newSheet.getRange(1, 1, 1, 14).setValues([[
        'Timestamp', 'Name', 'Platform', 'Score', 'Urgency',
        'Comment', 'Profile URL', 'Email', 'Company',
        'Analysis', 'Pain Points', 'Message Draft', 'Contacted', 'Business Owner'
      ]]);
      newSheet.getRange(1, 1, 1, 14).setFontWeight('bold');
    }

    const data = JSON.parse(e.postData.contents);

    const row = [
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.platform || '',
      data.score || 0,
      data.urgency || 'medium',
      data.comment || '',
      data.profileUrl || '',
      data.email || '',
      data.company || '',
      data.analysis || '',
      data.painPoints || '',
      data.messageDraft || '',
      data.contacted || 'No',
      data.isBusinessOwner || 'Unknown'
    ];

    const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    targetSheet.appendRow(row);

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
    'Timestamp', 'Name', 'Platform', 'Score', 'Urgency',
    'Comment', 'Profile URL', 'Email', 'Company',
    'Analysis', 'Pain Points', 'Contacted', 'Business Owner'
  ];

  const rows = leads.map(lead => [
    lead.timestamp || '',
    escapeCsvField(lead.name || ''),
    lead.platform || '',
    lead.score || 0,
    lead.urgencyLevel || 'medium',
    escapeCsvField(lead.comment || ''),
    lead.profileUrl || '',
    lead.email || '',
    lead.company || '',
    escapeCsvField(lead.analysis || ''),
    escapeCsvField((lead.painPoints || []).join('; ')),
    lead.contacted ? 'Yes' : 'No',
    lead.isBusinessOwner ? 'Yes' : 'Unknown'
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
