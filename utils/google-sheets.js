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
    console.error('[Lead Hunter] No Google Sheets URL configured');
    throw new Error('No Google Sheets webhook URL configured');
  }

  // Validate URL format
  if (!sheetsWebhookUrl.includes('script.google.com')) {
    console.error('[Lead Hunter] Invalid Google Sheets URL - must be a script.google.com URL');
    throw new Error('Invalid Google Sheets URL - must be a script.google.com URL');
  }

  // Format phone as text to avoid #ERROR! in Google Sheets
  const formatPhone = (phone) => {
    if (!phone) return '';
    // Remove any formula-like characters and format as plain text
    let cleaned = String(phone).trim();
    // If starts with + or = or -, prefix with apostrophe for Sheets
    if (cleaned.match(/^[+=\-@]/)) {
      cleaned = "'" + cleaned;
    }
    return cleaned;
  };

  const row = {
    timestamp: new Date().toISOString(),
    name: lead.name || '',
    phone: formatPhone(lead.phone),
    email: lead.email || '',
    website: lead.website || '',
    address: lead.address || '',
    category: lead.category || lead.industry || '',
    platform: lead.platform || '',
    score: lead.score || 0,
    urgency: lead.urgencyLevel || 'medium',
    leadType: lead.leadType || 'scraped',
    profileUrl: lead.profileUrl || lead.url || '',
    company: lead.company || lead.name || '',
    analysis: typeof lead.analysis === 'object' ? lead.analysis.summary || '' : (lead.analysis || ''),
    notes: lead.notes || ''
  };

  console.log('[Lead Hunter] Sending to Google Sheets:', { url: sheetsWebhookUrl, lead: lead.name });

  try {
    const response = await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(row),
      redirect: 'follow'  // Follow redirects (Apps Script uses redirects)
    });

    // Apps Script may return opaque response or redirect
    // A successful POST to Apps Script usually returns 200 or follows redirect
    console.log('[Lead Hunter] Google Sheets response status:', response.status);

    if (!response.ok && response.status !== 0) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Lead Hunter] Google Sheets error response:', errorText);
      throw new Error(`Google Sheets error: ${response.status} - ${errorText}`);
    }

    // Try to parse response
    try {
      const result = await response.json();
      console.log('[Lead Hunter] Google Sheets success:', result);
      return { success: true, result };
    } catch (e) {
      // Response might not be JSON, that's OK if status was 200
      console.log('[Lead Hunter] Google Sheets sent (no JSON response)');
      return { success: true };
    }
  } catch (error) {
    console.error('[Lead Hunter] Google Sheets fetch error:', error.message);

    // If it's a network error, might be CORS - try with no-cors mode as fallback
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('[Lead Hunter] Retrying Google Sheets with no-cors mode...');
      try {
        await fetch(sheetsWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain'  // no-cors only allows simple headers
          },
          body: JSON.stringify(row)
        });
        console.log('[Lead Hunter] Google Sheets sent via no-cors (cannot verify success)');
        return { success: true, mode: 'no-cors' };
      } catch (retryError) {
        console.error('[Lead Hunter] Google Sheets no-cors retry failed:', retryError.message);
        throw retryError;
      }
    }

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

const SHEET_NAME = 'Leads';

function doPost(e) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Create sheet if doesn't exist
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      // Add headers - matching extension data fields
      sheet.getRange(1, 1, 1, 14).setValues([[
        'Date', 'Company', 'Phone', 'Email', 'Website', 'Address',
        'Category', 'Platform', 'Score', 'Urgency', 'Type',
        'Profile URL', 'Analysis', 'Notes'
      ]]);
      sheet.getRange(1, 1, 1, 14).setFontWeight('bold');
      sheet.setFrozenRows(1);
      // Format Phone column as plain text
      sheet.getRange('C:C').setNumberFormat('@');
      // Auto-resize columns
      sheet.autoResizeColumns(1, 14);
    }

    const data = JSON.parse(e.postData.contents);

    // Clean phone to avoid formula errors
    let phone = String(data.phone || '');
    if (phone.match(/^[+=\\-@]/)) {
      phone = "'" + phone;
    }

    // Format timestamp to readable date
    let date = data.timestamp || new Date().toISOString();
    try {
      date = new Date(date).toLocaleString('en-US');
    } catch(e) {}

    const row = [
      date,
      data.company || data.name || '',
      phone,
      data.email || '',
      data.website || '',
      data.address || '',
      data.category || '',
      data.platform || '',
      data.score || 0,
      data.urgency || 'medium',
      data.leadType || 'scraped',
      data.profileUrl || '',
      data.analysis || '',
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
