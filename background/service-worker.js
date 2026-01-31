// Lead Hunter AI - Background Service Worker

import { analyzeWithGemini } from '../utils/gemini.js';
import { sendToHubSpot } from '../utils/hubspot.js';
import { generateMessageDraft } from '../utils/message-generator.js';
import { passesKeywordFilter } from '../utils/keywords.js';
import { sendToWebhook, testWebhook } from '../utils/webhooks.js';
import { sendToGoogleSheets } from '../utils/google-sheets.js';
import { findEmail, checkCredits } from '../utils/email-finder.js';
import { detectUrgencyFromText, calculateUrgencyDecay } from '../utils/urgency.js';
import { checkPreviousContact, markProfileContacted, logInteraction, addInteraction } from '../utils/interaction-history.js';

// State
let settings = {};
let stats = { scanned: 0, leadsFound: 0, hotLeads: 0 };
let isScanning = true;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Lead Hunter AI installed');
  await loadSettings();
});

// Also load on startup
chrome.runtime.onStartup.addListener(async () => {
  await loadSettings();
});

// Load settings from storage
async function loadSettings() {
  const storage = await chrome.storage.local.get(['settings', 'stats']);
  settings = storage.settings || getDefaultSettings();
  stats = storage.stats || { scanned: 0, leadsFound: 0, hotLeads: 0 };
  isScanning = settings.scanning !== false;
}

function getDefaultSettings() {
  return {
    geminiKey: '',
    hubspotKey: '',
    hunterKey: '',
    webhookUrl: '',
    googleSheetsUrl: '',
    minWords: 8,
    customKeywords: '',
    competitors: 'Ruby\nSmith.ai\nAnswering Service',
    industries: ['plumbing', 'hvac', 'dental', 'contractors', 'medical', 'legal', 'realestate', 'automotive'],
    notifyHotLeads: true,
    soundEnabled: false,
    scanning: true,
    autoSendHubspot: false,
    autoSendWebhook: false,
    autoSendSheets: false,
    autoFindEmail: false
  };
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'ANALYZE_COMMENT':
      return await analyzeComment(message.data);

    case 'SEND_TO_HUBSPOT':
      return await handleHubSpotSend(message.lead);

    case 'SEND_TO_WEBHOOK':
      return await handleWebhookSend(message.lead);

    case 'TEST_WEBHOOK':
      return await testWebhook(message.url);

    case 'SEND_TO_SHEETS':
      return await handleSheetsSend(message.lead);

    case 'FIND_EMAIL':
      return await handleFindEmail(message.lead);

    case 'CHECK_HUNTER_CREDITS':
      return await checkCredits(settings.hunterKey);

    case 'CHECK_PREVIOUS_CONTACT':
      return await checkPreviousContact(message.profileUrl, message.name);

    case 'MARK_CONTACTED':
      await markProfileContacted(message.profileUrl, message.data);
      return { success: true };

    case 'LOG_INTERACTION':
      await addInteraction(message.leadId, message.interaction);
      return { success: true };

    case 'SETTINGS_UPDATED':
      settings = message.settings;
      isScanning = settings.scanning !== false;
      return { success: true };

    case 'TOGGLE_SCANNING':
      isScanning = message.enabled;
      return { success: true };

    case 'GET_SETTINGS':
      return { settings, isScanning };

    case 'GET_STATS':
      return { stats };

    case 'INCREMENT_SCANNED':
      stats.scanned++;
      await chrome.storage.local.set({ stats });
      return { success: true };

    case 'CAPTURE_TAB':
      return await captureCurrentTab();

    case 'SAVE_MANUAL_CONTACT':
      return await saveManualContact(message.data);

    default:
      return { error: 'Unknown message type' };
  }
}

// Capture current tab screenshot
async function captureCurrentTab() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    return { success: true, dataUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Analyze a comment
async function analyzeComment(data) {
  if (!isScanning) {
    return { skip: true, reason: 'scanning_paused' };
  }

  const { comment, platform, author, profileUrl, timestamp } = data;

  // Increment scanned count
  stats.scanned++;
  await chrome.storage.local.set({ stats });

  // Step 1: Keyword filter
  if (!passesKeywordFilter(comment, settings)) {
    return { skip: true, reason: 'keyword_filter' };
  }

  // Step 2: Check for previous contact
  const previousContact = await checkPreviousContact(profileUrl, author?.name);

  // Step 3: Detect text-based urgency (backup for non-AI mode)
  const textUrgency = detectUrgencyFromText(comment);

  // Step 4: Check for Gemini API key
  if (!settings.geminiKey) {
    // Fallback: basic keyword scoring
    const score = basicScoring(comment);
    if (score < 5) {
      return { skip: true, reason: 'low_score' };
    }

    const lead = createLead({
      comment,
      platform,
      author,
      profileUrl,
      timestamp,
      score,
      urgencyLevel: textUrgency,
      analysis: 'Analisis basico (sin API key de Gemini)',
      previouslyContacted: previousContact.contacted,
      messageDraft: generateMessageDraft({ comment, author, platform, score }, settings)
    });

    await saveLead(lead);
    await autoSendIntegrations(lead);
    return { success: true, lead };
  }

  // Step 5: AI Analysis with Gemini
  try {
    const analysis = await analyzeWithGemini(comment, settings);

    if (!analysis || analysis.score < 4) {
      return { skip: true, reason: 'ai_rejected' };
    }

    const lead = createLead({
      comment,
      platform,
      author,
      profileUrl,
      timestamp,
      score: analysis.score,
      urgencyLevel: analysis.urgency || textUrgency,
      frustrationLevel: analysis.frustrationLevel,
      buyingIntent: analysis.buyingIntent,
      suggestedApproach: analysis.suggestedApproach,
      analysis: analysis.reasoning,
      painPoints: analysis.painPoints,
      industry: analysis.industry,
      isBusinessOwner: analysis.isBusinessOwner,
      mentionsCompetitor: analysis.mentionsCompetitor,
      previouslyContacted: previousContact.contacted,
      previousInteractions: previousContact.previousLeads || [],
      messageDraft: generateMessageDraft({
        comment,
        author,
        platform,
        score: analysis.score,
        painPoints: analysis.painPoints
      }, settings)
    });

    await saveLead(lead);

    // Auto-send to integrations if enabled
    await autoSendIntegrations(lead);

    // Notify if hot lead
    if (analysis.score >= 8 && settings.notifyHotLeads) {
      await sendNotification(lead);
    }

    // Update hot lead stats
    if (analysis.score >= 8) {
      stats.hotLeads++;
      await chrome.storage.local.set({ stats });
    }

    return { success: true, lead };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return { error: error.message };
  }
}

// Auto-send to integrations
async function autoSendIntegrations(lead) {
  const promises = [];

  if (settings.autoSendHubspot && settings.hubspotKey) {
    promises.push(
      sendToHubSpot(lead, settings.hubspotKey)
        .then(result => {
          lead.sentToHubspot = true;
          lead.hubspotId = result.id;
          updateLeadInStorage(lead);
          console.log('HubSpot auto-send success:', result.id);
        })
        .catch(e => console.error('HubSpot auto-send error:', e))
    );
  }

  if (settings.autoSendWebhook && settings.webhookUrl) {
    promises.push(
      sendToWebhook(lead, settings.webhookUrl).catch(e => console.error('Webhook auto-send error:', e))
    );
  }

  if (settings.autoSendSheets && settings.googleSheetsUrl) {
    promises.push(
      sendToGoogleSheets(lead, settings.googleSheetsUrl).catch(e => console.error('Sheets auto-send error:', e))
    );
  }

  if (settings.autoFindEmail && settings.hunterKey && lead.profileUrl) {
    promises.push(
      enrichLeadWithEmail(lead).catch(e => console.error('Email auto-find error:', e))
    );
  }

  await Promise.all(promises);
}

// Update lead in storage
async function updateLeadInStorage(lead) {
  const storage = await chrome.storage.local.get(['leads']);
  const leads = storage.leads || [];
  const index = leads.findIndex(l => l.id === lead.id);
  if (index !== -1) {
    leads[index] = lead;
    await chrome.storage.local.set({ leads });
  }
}

// Enrich lead with email
async function enrichLeadWithEmail(lead) {
  if (!settings.hunterKey) return;

  // Try to find email based on available info
  // This is a simplified version - in reality, you'd need domain + name
  const nameParts = (lead.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // We'd need a domain - for now, skip if we don't have company info
  if (!lead.company && !lead.website) {
    return;
  }

  const domain = lead.website
    ? new URL(lead.website).hostname.replace('www.', '')
    : `${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  try {
    const result = await findEmail(domain, firstName, lastName, settings.hunterKey);
    if (result.success && result.email) {
      lead.email = result.email;
      lead.emailConfidence = result.confidence;

      // Update lead in storage
      const storage = await chrome.storage.local.get(['leads']);
      const leads = storage.leads || [];
      const index = leads.findIndex(l => l.id === lead.id);
      if (index !== -1) {
        leads[index] = lead;
        await chrome.storage.local.set({ leads });
      }
    }
  } catch (error) {
    console.error('Email enrichment error:', error);
  }
}

// Basic keyword scoring when no API key
function basicScoring(comment) {
  const lowerComment = comment.toLowerCase();
  let score = 0;

  // High-value pain points
  const highValue = [
    'no contestan', 'nadie contesta', 'nunca contestan',
    'pierdo llamadas', 'llamadas perdidas', 'missed calls',
    'necesito recepcionista', 'need receptionist',
    'citas perdidas', 'missed appointments',
    'clientes se quejan', 'customers complain',
    'no puedo contestar', 'cant answer'
  ];

  // Medium-value indicators
  const mediumValue = [
    'telefono', 'phone', 'llamadas', 'calls',
    'mensajes', 'messages', 'citas', 'appointments',
    'recepcionista', 'receptionist', 'secretary',
    'contestar', 'answer', 'responder', 'respond',
    'ocupado', 'busy', 'overwhelmed'
  ];

  // Business owner indicators
  const ownerIndicators = [
    'mi negocio', 'my business', 'mi empresa', 'my company',
    'mi clinica', 'my clinic', 'mi consultorio', 'my office',
    'soy dueno', 'i own', 'tengo una', 'i have a',
    'somos una', 'we are a', 'nuestra empresa', 'our company'
  ];

  // Competitor mentions (they're actively looking)
  const competitors = (settings.competitors || '').toLowerCase().split('\n').filter(c => c.trim());

  highValue.forEach(kw => {
    if (lowerComment.includes(kw)) score += 3;
  });

  mediumValue.forEach(kw => {
    if (lowerComment.includes(kw)) score += 1;
  });

  ownerIndicators.forEach(kw => {
    if (lowerComment.includes(kw)) score += 2;
  });

  competitors.forEach(comp => {
    if (comp && lowerComment.includes(comp)) score += 4;
  });

  // Normalize to 1-10
  return Math.min(10, Math.max(1, Math.round(score)));
}

// Create lead object
function createLead(data) {
  stats.leadsFound++;

  return {
    id: generateId(),
    name: data.author?.name || 'Usuario',
    title: data.author?.title || '',
    bio: data.author?.bio || '',
    profileUrl: data.profileUrl,
    platform: data.platform,
    comment: data.comment,
    score: data.score,
    urgencyLevel: data.urgencyLevel || 'medium',
    frustrationLevel: data.frustrationLevel || 5,
    buyingIntent: data.buyingIntent || 'unknown',
    suggestedApproach: data.suggestedApproach || 'warm',
    analysis: data.analysis,
    painPoints: data.painPoints || [],
    industry: data.industry || 'unknown',
    isBusinessOwner: data.isBusinessOwner,
    mentionsCompetitor: data.mentionsCompetitor,
    messageDraft: data.messageDraft,
    timestamp: data.timestamp || new Date().toISOString(),
    detectedAt: new Date().toISOString(),
    contacted: false,
    sentToHubspot: false,
    sentToWebhook: false,
    sentToSheets: false,
    email: data.email || null,
    emailConfidence: data.emailConfidence || null,
    company: data.company || null,
    website: data.website || null,
    phone: data.phone || null,
    previouslyContacted: data.previouslyContacted || false,
    previousInteractions: data.previousInteractions || [],
    screenshot: null,
    notes: ''
  };
}

// Save lead to storage
async function saveLead(lead) {
  const storage = await chrome.storage.local.get(['leads']);
  const leads = storage.leads || [];

  // Check for duplicates (same comment)
  const isDuplicate = leads.some(l =>
    l.comment === lead.comment && l.platform === lead.platform
  );

  if (isDuplicate) {
    return;
  }

  leads.unshift(lead);

  // Keep only last 500 leads
  if (leads.length > 500) {
    leads.splice(500);
  }

  await chrome.storage.local.set({ leads, stats });

  // Broadcast to popup (only if open)
  chrome.runtime.sendMessage({ type: 'NEW_LEAD', lead }).catch(() => {
    // Popup not open - ignore
  });
}

// Save manual contact (from profile page)
async function saveManualContact(data) {
  try {
    // Check for duplicates (same profile URL)
    const storage = await chrome.storage.local.get(['leads']);
    const leads = storage.leads || [];

    const isDuplicate = leads.some(l =>
      l.profileUrl === data.profileUrl
    );

    if (isDuplicate) {
      return { success: false, error: 'Contact already saved' };
    }

    // Create manual lead object
    const lead = {
      id: generateId(),
      name: data.name || 'Unknown',
      title: data.title || '',
      bio: data.bio || '',
      profileUrl: data.profileUrl,
      platform: data.platform,
      comment: '', // No comment for manual saves
      score: 0, // Manual save = no score
      urgencyLevel: 'low',
      frustrationLevel: 0,
      buyingIntent: 'unknown',
      suggestedApproach: 'cold',
      analysis: 'Manually saved contact',
      painPoints: [],
      industry: data.industries?.[0] || 'unknown',
      targetIndustries: data.industries || [],
      isBusinessOwner: null,
      mentionsCompetitor: false,
      messageDraft: '',
      timestamp: data.timestamp || new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      contacted: false,
      sentToHubspot: false,
      sentToWebhook: false,
      sentToSheets: false,
      email: null,
      emailConfidence: null,
      company: data.company || null,
      website: null,
      phone: null,
      location: data.location || null,
      profilePic: data.profilePic || null,
      previouslyContacted: false,
      previousInteractions: [],
      screenshot: null,
      notes: '',
      leadType: 'manual' // Mark as manually saved
    };

    // Update stats
    stats.leadsFound++;

    // Save to storage
    leads.unshift(lead);

    // Keep only last 500 leads
    if (leads.length > 500) {
      leads.splice(500);
    }

    await chrome.storage.local.set({ leads, stats });

    // Broadcast to popup
    chrome.runtime.sendMessage({ type: 'NEW_LEAD', lead }).catch(() => {
      // Popup not open - ignore
    });

    return { success: true, lead };
  } catch (error) {
    console.error('Manual save error:', error);
    return { success: false, error: error.message };
  }
}

// Send to HubSpot
async function handleHubSpotSend(lead) {
  if (!settings.hubspotKey) {
    return { success: false, error: 'No HubSpot API key configured' };
  }

  try {
    const result = await sendToHubSpot(lead, settings.hubspotKey);
    await logInteraction.sentToCRM(lead.id, 'HubSpot', result.id);
    return { success: true, hubspotId: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send to Webhook
async function handleWebhookSend(lead) {
  if (!settings.webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }

  try {
    const result = await sendToWebhook(lead, settings.webhookUrl);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send to Google Sheets
async function handleSheetsSend(lead) {
  if (!settings.googleSheetsUrl) {
    return { success: false, error: 'No Google Sheets URL configured' };
  }

  try {
    const result = await sendToGoogleSheets(lead, settings.googleSheetsUrl);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Find email for lead
async function handleFindEmail(lead) {
  if (!settings.hunterKey) {
    return { success: false, error: 'No Hunter.io API key configured' };
  }

  const nameParts = (lead.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  if (!lead.company && !lead.website) {
    return { success: false, error: 'Need company or website to find email' };
  }

  const domain = lead.website
    ? new URL(lead.website).hostname.replace('www.', '')
    : `${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  try {
    const result = await findEmail(domain, firstName, lastName, settings.hunterKey);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send notification
async function sendNotification(lead) {
  const urgencyEmoji = {
    critical: '🔥🔥',
    high: '🔥',
    medium: '⚡',
    low: '💤'
  };

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: `${urgencyEmoji[lead.urgencyLevel] || '⚡'} Lead Detectado! (${lead.score}/10)`,
    message: `${lead.name} en ${lead.platform}: "${lead.comment.substring(0, 50)}..."`,
    priority: 2
  });
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Periodic stats update to popup
setInterval(() => {
  chrome.runtime.sendMessage({ type: 'STATS_UPDATE', stats }).catch(() => {
    // Popup not open - ignore
  });
}, 5000);

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    settings = changes.settings.newValue;
    isScanning = settings.scanning !== false;
  }
});
