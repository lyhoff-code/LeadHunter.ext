// Lead Hunter AI - Background Service Worker

import { analyzeWithGemini } from '../utils/gemini.js';
import { sendToHubSpot } from '../utils/hubspot.js';
import { generateMessageDraft } from '../utils/message-generator.js';
import { passesKeywordFilter } from '../utils/keywords.js';

// State
let settings = {};
let stats = { scanned: 0 };
let isScanning = true;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Lead Hunter AI installed');
  await loadSettings();
});

// Load settings from storage
async function loadSettings() {
  const storage = await chrome.storage.local.get(['settings', 'stats']);
  settings = storage.settings || getDefaultSettings();
  stats = storage.stats || { scanned: 0 };
  isScanning = settings.scanning !== false;
}

function getDefaultSettings() {
  return {
    geminiKey: '',
    hubspotKey: '',
    minWords: 8,
    customKeywords: '',
    competitors: 'Ruby\nSmith.ai\nAnswering Service',
    industries: ['plumbing', 'hvac', 'dental', 'contractors', 'medical', 'legal', 'realestate', 'automotive'],
    notifyHotLeads: true,
    soundEnabled: false,
    scanning: true
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

    case 'SETTINGS_UPDATED':
      settings = message.settings;
      isScanning = settings.scanning !== false;
      return { success: true };

    case 'TOGGLE_SCANNING':
      isScanning = message.enabled;
      return { success: true };

    case 'GET_SETTINGS':
      return { settings, isScanning };

    case 'INCREMENT_SCANNED':
      stats.scanned++;
      await chrome.storage.local.set({ stats });
      return { success: true };

    default:
      return { error: 'Unknown message type' };
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

  // Step 2: Check for Gemini API key
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
      analysis: 'Analisis basico (sin API key de Gemini)',
      messageDraft: generateMessageDraft({ comment, author, platform, score }, settings)
    });

    await saveLead(lead);
    return { success: true, lead };
  }

  // Step 3: AI Analysis with Gemini
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
      analysis: analysis.reasoning,
      painPoints: analysis.painPoints,
      isBusinessOwner: analysis.isBusinessOwner,
      mentionsCompetitor: analysis.mentionsCompetitor,
      messageDraft: generateMessageDraft({
        comment,
        author,
        platform,
        score: analysis.score,
        painPoints: analysis.painPoints
      }, settings)
    });

    await saveLead(lead);

    // Notify if hot lead
    if (analysis.score >= 8 && settings.notifyHotLeads) {
      await sendNotification(lead);
    }

    return { success: true, lead };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return { error: error.message };
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
  return {
    id: generateId(),
    name: data.author?.name || 'Usuario',
    title: data.author?.title || '',
    bio: data.author?.bio || '',
    profileUrl: data.profileUrl,
    platform: data.platform,
    comment: data.comment,
    score: data.score,
    analysis: data.analysis,
    painPoints: data.painPoints || [],
    isBusinessOwner: data.isBusinessOwner,
    mentionsCompetitor: data.mentionsCompetitor,
    messageDraft: data.messageDraft,
    timestamp: data.timestamp || new Date().toISOString(),
    contacted: false,
    sentToHubspot: false
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

  await chrome.storage.local.set({ leads });

  // Broadcast to popup (only if open)
  chrome.runtime.sendMessage({ type: 'NEW_LEAD', lead }).catch(() => {
    // Popup not open - ignore
  });
}

// Send to HubSpot
async function handleHubSpotSend(lead) {
  if (!settings.hubspotKey) {
    return { success: false, error: 'No HubSpot API key configured' };
  }

  try {
    const result = await sendToHubSpot(lead, settings.hubspotKey);
    return { success: true, hubspotId: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send notification
async function sendNotification(lead) {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: `Lead Caliente Detectado! (${lead.score}/10)`,
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
