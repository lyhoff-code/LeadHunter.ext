// Lead Hunter AI - Background Service Worker

import { analyzeWithGemini } from '../utils/gemini.js';
import { sendToHubSpot } from '../utils/hubspot.js';
import { generateMessageDraft } from '../utils/message-generator.js';
import { passesKeywordFilter, detectIndustryFromBusiness } from '../utils/keywords.js';
import { sendToWebhook, testWebhook } from '../utils/webhooks.js';
import { sendToGoogleSheets } from '../utils/google-sheets.js';
import { findEmail, checkCredits, isValidDomain, cleanDomain, extractDomainFromEmail } from '../utils/email-finder.js';
import { detectUrgencyFromText, calculateUrgencyDecay } from '../utils/urgency.js';
import { checkPreviousContact, markProfileContacted, logInteraction, addInteraction } from '../utils/interaction-history.js';
import { analyzeImageWithGemini, isValidImageUrl } from '../utils/gemini-vision.js';
import { translations } from '../utils/i18n.js';

// Helper to get translation
function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// State
let settings = {};
let stats = { scanned: 0, leadsFound: 0, hotLeads: 0 };
let isScanning = true;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Lead Hunter AI installed');
  await loadSettings();
  await cleanInvalidWebsitesFromLeads();
});

// Also load on startup
chrome.runtime.onStartup.addListener(async () => {
  await loadSettings();
  await cleanInvalidWebsitesFromLeads();
});

/**
 * Clean invalid websites (like google.com) from existing leads
 * This runs on startup to fix leads that were saved before validation was added
 */
async function cleanInvalidWebsitesFromLeads() {
  try {
    const storage = await chrome.storage.local.get(['leads']);
    const leads = storage.leads || [];
    let cleanedCount = 0;

    for (const lead of leads) {
      if (lead.website) {
        const domain = cleanDomain(lead.website);
        if (!domain || !isValidDomain(domain)) {
          console.log('[Cleanup] Removing invalid website from lead:', lead.name, '->', lead.website);
          lead.website = null;
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      await chrome.storage.local.set({ leads });
      console.log(`[Cleanup] Cleaned ${cleanedCount} leads with invalid websites`);
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning leads:', error);
  }
}

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
    competitors: 'Ruby\nSmith.ai\nAnswerConnect\nPATLive\nVoiceNation\nAnswering Service\nReceptionist\nVirtual Receptionist\nAI Receptionist\nDialpad\nGrashopper\nRingCentral\nNextiva\nAircall',
    industries: [],
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

    case 'BUSINESS_SCRAPED':
      return await handleScrapedBusiness(message.data);

    case 'MANUAL_LEAD_ADDED':
      // Manual leads added from popup - send to integrations
      console.log('[Lead Hunter] Manual lead added, sending to integrations:', message.lead?.name);
      if (message.lead) {
        await autoSendIntegrations(message.lead);
      }
      return { success: true };

    case 'ANALYZE_IMAGE':
      return await handleImageAnalysis(message.imageUrl, message.context);

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

  // Step 1: Keyword filter (now returns object with leadType)
  const filterResult = passesKeywordFilter(comment, settings);
  if (!filterResult || !filterResult.pass) {
    return { skip: true, reason: 'keyword_filter' };
  }

  const { leadType, reason: filterReason, priority: filterPriority, industry: detectedIndustry } = filterResult;

  // Step 2: Check for previous contact
  const previousContact = await checkPreviousContact(profileUrl, author?.name);

  // Step 3: Detect text-based urgency (backup for non-AI mode)
  const textUrgency = detectUrgencyFromText(comment);

  // Step 4: Check for Gemini API key
  if (!settings.geminiKey) {
    // Fallback: basic keyword scoring
    let score = basicScoring(comment);

    // Adjust score based on lead type
    if (leadType === 'prospect') {
      score = Math.min(score, 4); // Prospects get max 4 without AI analysis
    }

    // For prospects, we still save them but with lower score
    if (leadType === 'pain' && score < 5) {
      return { skip: true, reason: 'low_score' };
    }

    const lead = createLead({
      comment,
      platform,
      author,
      profileUrl,
      timestamp,
      score,
      urgencyLevel: leadType === 'pain' ? textUrgency : 'low',
      analysis: leadType === 'pain'
        ? 'Analisis basico (sin API key de Gemini)'
        : 'Prospecto detectado - sin señales de dolor explicitas',
      previouslyContacted: previousContact.contacted,
      messageDraft: generateMessageDraft({ comment, author, platform, score }, settings),
      leadType: leadType,
      filterReason: filterReason,
      filterPriority: filterPriority,
      detectedIndustry: detectedIndustry
    });

    await saveLead(lead);
    await autoSendIntegrations(lead);
    return { success: true, lead };
  }

  // Step 5: AI Analysis with Gemini
  try {
    const analysis = await analyzeWithGemini(comment, settings);

    // For prospects without AI confirmation, still save but with lower score
    if (!analysis || analysis.score < 4) {
      if (leadType === 'prospect') {
        // Save prospect even if AI gives low score
        const lead = createLead({
          comment,
          platform,
          author,
          profileUrl,
          timestamp,
          score: 3,
          urgencyLevel: 'low',
          frustrationLevel: 0,
          buyingIntent: 'unknown',
          suggestedApproach: 'cold',
          analysis: 'Prospecto - dueño de negocio sin dolor explícito. Requiere enfoque diferente.',
          painPoints: [],
          industry: detectedIndustry || 'unknown',
          isBusinessOwner: true,
          mentionsCompetitor: false,
          previouslyContacted: previousContact.contacted,
          previousInteractions: previousContact.previousLeads || [],
          messageDraft: '',
          leadType: 'prospect',
          filterReason: filterReason,
          filterPriority: 'low',
          detectedIndustry: detectedIndustry
        });

        await saveLead(lead);
        return { success: true, lead };
      }
      return { skip: true, reason: 'ai_rejected' };
    }

    // Determine final lead type based on AI analysis
    const finalLeadType = (analysis.painPoints && analysis.painPoints.length > 0) ? 'pain' : leadType;

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
      industry: analysis.industry || detectedIndustry,
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
      }, settings),
      leadType: finalLeadType,
      filterReason: filterReason,
      filterPriority: filterPriority,
      detectedIndustry: detectedIndustry
    });

    await saveLead(lead);

    // Auto-send to integrations if enabled
    await autoSendIntegrations(lead);

    // Notify if hot lead (only for pain leads)
    if (analysis.score >= 8 && settings.notifyHotLeads && finalLeadType === 'pain') {
      await sendNotification(lead);
    }

    // Update hot lead stats (only for pain leads with high score)
    if (analysis.score >= 8 && finalLeadType === 'pain') {
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
  // Reload settings to ensure we have latest
  await loadSettings();

  console.log('[Lead Hunter] Auto-send integrations check:', {
    leadName: lead.name,
    autoSendSheets: settings.autoSendSheets,
    hasGoogleSheetsUrl: !!settings.googleSheetsUrl,
    googleSheetsUrl: settings.googleSheetsUrl ? settings.googleSheetsUrl.substring(0, 50) + '...' : 'NOT SET',
    autoSendHubspot: settings.autoSendHubspot,
    autoSendWebhook: settings.autoSendWebhook
  });

  const promises = [];

  if (settings.autoSendHubspot && settings.hubspotKey) {
    console.log('[Lead Hunter] Sending to HubSpot...');
    promises.push(
      sendToHubSpot(lead, settings.hubspotKey)
        .then(result => {
          lead.sentToHubspot = true;
          lead.hubspotId = result.id;
          updateLeadInStorage(lead);
          console.log('[Lead Hunter] HubSpot auto-send success:', result.id);
        })
        .catch(e => console.error('[Lead Hunter] HubSpot auto-send error:', e))
    );
  }

  if (settings.autoSendWebhook && settings.webhookUrl) {
    console.log('[Lead Hunter] Sending to Webhook...');
    promises.push(
      sendToWebhook(lead, settings.webhookUrl).catch(e => console.error('[Lead Hunter] Webhook auto-send error:', e))
    );
  }

  if (settings.autoSendSheets && settings.googleSheetsUrl) {
    console.log('[Lead Hunter] Sending to Google Sheets...', settings.googleSheetsUrl);
    promises.push(
      sendToGoogleSheets(lead, settings.googleSheetsUrl)
        .then(result => {
          lead.sentToSheets = true;
          updateLeadInStorage(lead);
          console.log('[Lead Hunter] Google Sheets auto-send success!');
        })
        .catch(e => console.error('[Lead Hunter] Sheets auto-send error:', e.message))
    );
  } else {
    console.log('[Lead Hunter] Google Sheets NOT enabled or URL not set:', {
      autoSendSheets: settings.autoSendSheets,
      hasUrl: !!settings.googleSheetsUrl
    });
  }

  if (settings.autoFindEmail && settings.hunterKey && lead.profileUrl) {
    console.log('[Lead Hunter] Finding email with Hunter.io...');
    promises.push(
      enrichLeadWithEmail(lead).catch(e => console.error('[Lead Hunter] Email auto-find error:', e))
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);
    console.log('[Lead Hunter] All auto-send integrations completed');
  } else {
    console.log('[Lead Hunter] No integrations enabled');
  }
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

// Enrich lead with email using Hunter.io
async function enrichLeadWithEmail(lead) {
  if (!settings.hunterKey) {
    console.log('[Hunter.io] No API key configured');
    return;
  }

  // Skip if lead already has email
  if (lead.email) {
    console.log('[Hunter.io] Lead already has email:', lead.email);
    return;
  }

  // Extract domain using multiple strategies
  let domain = null;

  // Strategy 1: Extract from website (most reliable)
  if (lead.website) {
    domain = cleanDomain(lead.website);
    if (!domain) {
      // Try parsing as URL
      try {
        let websiteUrl = lead.website.trim();
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
          websiteUrl = 'https://' + websiteUrl;
        }
        const url = new URL(websiteUrl);
        const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
        if (isValidDomain(hostname)) {
          domain = hostname;
        }
      } catch (e) {
        // Try regex extraction as fallback
        const domainMatch = lead.website.match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})/);
        if (domainMatch) {
          const extracted = domainMatch[1].toLowerCase();
          if (isValidDomain(extracted)) {
            domain = extracted;
          }
        }
      }
    }
  }

  // Strategy 2: Extract from existing email (if they have one from page)
  if (!domain && lead.existingEmail) {
    domain = extractDomainFromEmail(lead.existingEmail);
  }

  // Strategy 3: Check if company name looks like a domain
  if (!domain && lead.company) {
    // Only use company if it looks like a domain (has a dot and TLD)
    const companyLower = lead.company.toLowerCase().trim();
    if (companyLower.match(/^[a-z0-9][-a-z0-9]*\.[a-z]{2,}$/)) {
      if (isValidDomain(companyLower)) {
        domain = companyLower;
      }
    }
    // NOTE: We do NOT guess "Company LLC" -> "companyllc.com"
    // This wastes Hunter.io credits on non-existent domains
  }

  // Validate final domain
  if (!domain || !isValidDomain(domain)) {
    console.log('[Hunter.io] No valid domain found for lead:', lead.name, '| website:', lead.website, '| company:', lead.company);
    return;
  }

  console.log('[Hunter.io] Searching email for domain:', domain);

  // Parse name into first/last
  const nameParts = (lead.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  try {
    const result = await findEmail(domain, firstName, lastName, settings.hunterKey);

    if (result.success && result.email) {
      console.log('[Hunter.io] Found email:', result.email, 'confidence:', result.confidence);

      lead.email = result.email;
      lead.emailConfidence = result.confidence;

      // Update lead in storage
      const storage = await chrome.storage.local.get(['leads']);
      const leads = storage.leads || [];
      const index = leads.findIndex(l => l.id === lead.id);
      if (index !== -1) {
        leads[index] = lead;
        await chrome.storage.local.set({ leads });

        // Broadcast update to popup
        chrome.runtime.sendMessage({ type: 'LEAD_UPDATED', lead }).catch(() => {});
      }
    } else {
      console.log('[Hunter.io] No email found for:', domain, firstName, lastName);
    }
  } catch (error) {
    console.error('[Hunter.io] Email enrichment error:', error.message);
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
    notes: '',
    // New fields for lead type differentiation
    leadType: data.leadType || 'pain', // 'pain' or 'prospect'
    filterReason: data.filterReason || null,
    filterPriority: data.filterPriority || 'medium',
    detectedIndustry: data.detectedIndustry || null
  };
}

// Save lead to storage
async function saveLead(lead) {
  const storage = await chrome.storage.local.get(['leads']);
  const leads = storage.leads || [];

  // Normalize for comparison
  const normalizeName = (name) => (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizePhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);
  const normalizeEmail = (email) => (email || '').toLowerCase().trim();

  const newName = normalizeName(lead.name);
  const newPhone = normalizePhone(lead.phone);
  const newEmail = normalizeEmail(lead.email);
  const newComment = (lead.comment || '').trim();

  // Find existing lead to merge with (if any)
  let existingLead = null;
  let existingIndex = -1;

  for (let i = 0; i < leads.length; i++) {
    const l = leads[i];

    // Same phone number - CROSS PLATFORM
    const existingPhone = normalizePhone(l.phone);
    if (newPhone && newPhone.length >= 7 && existingPhone === newPhone) {
      existingLead = l;
      existingIndex = i;
      break;
    }

    // Same email - CROSS PLATFORM
    const existingEmail = normalizeEmail(l.email);
    if (newEmail && existingEmail === newEmail) {
      existingLead = l;
      existingIndex = i;
      break;
    }

    // Same profile URL
    if (lead.profileUrl && l.profileUrl && lead.profileUrl === l.profileUrl) {
      existingLead = l;
      existingIndex = i;
      break;
    }

    // Same comment on same platform
    if (newComment && l.comment && l.comment.trim() === newComment && l.platform === lead.platform) {
      existingLead = l;
      existingIndex = i;
      break;
    }

    // Same name + platform
    const existingName = normalizeName(l.name);
    if (newName && newName !== 'unknown' && existingName === newName && l.platform === lead.platform) {
      existingLead = l;
      existingIndex = i;
      break;
    }
  }

  // If existing lead found, ENRICH with missing data
  if (existingLead) {
    let updated = false;

    // Add missing phone
    if (lead.phone && !existingLead.phone) {
      existingLead.phone = lead.phone;
      updated = true;
    }

    // Add missing email
    if (lead.email && !existingLead.email) {
      existingLead.email = lead.email;
      updated = true;
    }

    // Add missing website (cleaned and validated)
    if (lead.website && !existingLead.website) {
      const cleanedWebsite = cleanDomain(lead.website);
      if (cleanedWebsite && isValidDomain(cleanedWebsite)) {
        existingLead.website = 'https://' + cleanedWebsite;
        updated = true;
      }
    }

    // Add missing company
    if (lead.company && !existingLead.company) {
      existingLead.company = lead.company;
      updated = true;
    }

    // Add missing address
    if (lead.address && !existingLead.address) {
      existingLead.address = lead.address;
      updated = true;
    }

    // Update score if new one is higher
    if (lead.score > existingLead.score) {
      existingLead.score = lead.score;
      existingLead.urgencyLevel = lead.urgencyLevel;
      existingLead.analysis = lead.analysis;
      existingLead.painPoints = lead.painPoints;
      updated = true;
    }

    if (updated) {
      leads[existingIndex] = existingLead;
      await chrome.storage.local.set({ leads, stats });
      console.log('[Enrich] Updated existing lead:', existingLead.name);
      chrome.runtime.sendMessage({ type: 'LEAD_UPDATED', lead: existingLead }).catch(() => {});
    } else {
      console.log('Lead already complete:', lead.name);
    }
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

// Handle scraped business from business pages
async function handleScrapedBusiness(data) {
  try {
    // Clean website URL before processing
    if (data.website) {
      const cleaned = cleanDomain(data.website);
      if (cleaned) {
        // Convert domain back to full URL
        data.website = 'https://' + cleaned;
      } else {
        // Try to fix common issues
        let websiteUrl = data.website.trim();
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
          websiteUrl = 'https://' + websiteUrl;
        }
        // Validate and keep or discard
        if (!isValidDomain(cleanDomain(websiteUrl))) {
          console.log('[Lead] Discarding invalid website:', data.website);
          data.website = null;
        } else {
          data.website = websiteUrl;
        }
      }
    }

    // Check for duplicates based on multiple criteria
    const storage = await chrome.storage.local.get(['leads', 'settings']);
    const leads = storage.leads || [];
    const userSettings = storage.settings || {};

    // INDUSTRY FILTER: Only save if business matches selected industries
    let detectedIndustryInfo = null;
    if (userSettings.industries && userSettings.industries.length > 0) {
      // Detect industry from business name, description, and category
      detectedIndustryInfo = detectIndustryFromBusiness({
        name: data.name,
        description: data.description,
        category: data.category,
        title: data.category, // Some platforms use title for category
        bio: data.description
      }, userSettings.industries);

      if (!detectedIndustryInfo) {
        console.log('[Industry Filter] Business does not match selected industries:', data.name);
        console.log('[Industry Filter] Selected industries:', userSettings.industries);
        return { success: false, error: 'industry_not_matched', message: 'Business does not match selected industries' };
      }

      console.log('[Industry Filter] Matched industry:', detectedIndustryInfo.industry,
                  '| Keywords:', detectedIndustryInfo.matchedKeywords.join(', '),
                  '| Source:', detectedIndustryInfo.source);
    }

    // Normalize for comparison
    const normalizeName = (name) => (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizePhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);
    const normalizeEmail = (email) => (email || '').toLowerCase().trim();

    const newName = normalizeName(data.name);
    const newPhone = normalizePhone(data.phone);
    const newEmail = normalizeEmail(data.email);

    // Find existing lead to merge with (if any)
    let existingLead = null;
    let existingIndex = -1;

    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];

      // Same phone number - CROSS PLATFORM
      const existingPhone = normalizePhone(l.phone);
      if (newPhone && newPhone.length >= 7 && existingPhone === newPhone) {
        console.log('[Dedup] Found existing by phone:', newPhone);
        existingLead = l;
        existingIndex = i;
        break;
      }

      // Same email - CROSS PLATFORM
      const existingEmail = normalizeEmail(l.email);
      if (newEmail && existingEmail === newEmail) {
        console.log('[Dedup] Found existing by email:', newEmail);
        existingLead = l;
        existingIndex = i;
        break;
      }

      // Same URL
      if (l.profileUrl && data.url && l.profileUrl === data.url) {
        existingLead = l;
        existingIndex = i;
        break;
      }

      // Same business name - CROSS PLATFORM for scraped leads
      const existingName = normalizeName(l.name);
      if (newName && newName.length > 3 && existingName === newName && l.leadType === 'scraped') {
        console.log('[Dedup] Found existing by name:', newName);
        existingLead = l;
        existingIndex = i;
        break;
      }
    }

    // If existing lead found, ENRICH with missing data instead of rejecting
    if (existingLead) {
      let updated = false;

      // Add missing phone
      if (data.phone && !existingLead.phone) {
        existingLead.phone = data.phone;
        updated = true;
        console.log('[Enrich] Added phone:', data.phone);
      }

      // Add missing email
      if (data.email && !existingLead.email) {
        existingLead.email = data.email;
        updated = true;
        console.log('[Enrich] Added email:', data.email);
      }

      // Add missing website (cleaned and validated)
      if (data.website && !existingLead.website) {
        const cleanedWebsite = cleanDomain(data.website);
        if (cleanedWebsite && isValidDomain(cleanedWebsite)) {
          existingLead.website = 'https://' + cleanedWebsite;
          updated = true;
          console.log('[Enrich] Added website:', existingLead.website);
        }
      }

      // Add missing address
      if (data.address && !existingLead.address) {
        existingLead.address = data.address;
        updated = true;
        console.log('[Enrich] Added address:', data.address);
      }

      // Add missing rating/reviews
      if (data.rating && !existingLead.rating) {
        existingLead.rating = data.rating;
        existingLead.reviewCount = data.reviewCount;
        updated = true;
      }

      // Add missing category/industry
      if (data.category && !existingLead.title) {
        existingLead.title = data.category;
        updated = true;
      }

      if (data.industry && !existingLead.industry) {
        existingLead.industry = data.industry;
        updated = true;
      }

      if (updated) {
        leads[existingIndex] = existingLead;
        await chrome.storage.local.set({ leads });
        console.log('[Enrich] Updated existing lead:', existingLead.name);

        // Broadcast update to popup
        chrome.runtime.sendMessage({ type: 'LEAD_UPDATED', lead: existingLead }).catch(() => {});

        return { success: true, enriched: true, lead: existingLead };
      }

      console.log('Business already complete:', data.name);
      return { success: false, error: 'duplicate' };
    }

    // FINAL validation: ensure website is valid before creating lead
    // This is a safety net to catch any invalid domains that slipped through
    if (data.website) {
      const finalDomain = cleanDomain(data.website);
      if (!finalDomain || !isValidDomain(finalDomain)) {
        console.log('[Lead] Final check: Rejecting invalid website:', data.website);
        data.website = null;
      }
    }

    // Determine industry from detection or fallback
    const detectedIndustry = detectedIndustryInfo?.industry || data.industry || data.category || 'unknown';
    const industryMatchKeywords = detectedIndustryInfo?.matchedKeywords || [];
    const industryMatchSource = detectedIndustryInfo?.source || 'category';

    // Build analysis message
    let analysisMsg = `Negocio de ${detectedIndustry} scrapeado de ${data.platform}. `;
    if (industryMatchKeywords.length > 0) {
      analysisMsg += `Detectado por: "${industryMatchKeywords.join(', ')}" en ${industryMatchSource}. `;
    }
    analysisMsg += 'Sin señales de dolor - contactar con enfoque frío.';

    // Create scraped business lead (COLD - no pain points)
    const lead = {
      id: generateId(),
      name: data.name || 'Unknown Business',
      title: data.category || '',
      bio: data.description || '',
      profileUrl: data.url,
      platform: data.platform,
      comment: '', // No comment for scraped businesses
      score: 2, // Low score - no pain signal
      urgencyLevel: 'low',
      frustrationLevel: 0,
      buyingIntent: 'unknown',
      suggestedApproach: 'cold', // COLD because no pain points detected
      analysis: analysisMsg,
      painPoints: [],
      industry: detectedIndustry,
      industryMatchKeywords: industryMatchKeywords, // Keywords that matched
      industryMatchSource: industryMatchSource, // Where the match was found (name, category, description)
      isBusinessOwner: true,
      mentionsCompetitor: false,
      messageDraft: '',
      timestamp: data.scrapedAt || new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      contacted: false,
      sentToHubspot: false,
      sentToWebhook: false,
      sentToSheets: false,
      email: data.email || null,
      emailConfidence: data.email ? 100 : null,
      company: data.name || null,
      website: data.website || null, // Already validated above
      phone: data.phone || null,
      address: data.address || null,
      rating: data.rating || null,
      reviewCount: data.reviewCount || null,
      employees: data.employees || null,
      previouslyContacted: false,
      previousInteractions: [],
      screenshot: null,
      notes: '',
      leadType: 'scraped', // Mark as scraped from business page
      filterReason: 'business_page_scrape',
      filterPriority: 'low',
      detectedIndustry: data.industry || null
    };

    // Update stats
    stats.leadsFound++;
    stats.scanned++;

    // Save to storage
    leads.unshift(lead);

    // Keep only last 500 leads
    if (leads.length > 500) {
      leads.splice(500);
    }

    await chrome.storage.local.set({ leads, stats });

    // Auto-send to integrations
    await autoSendIntegrations(lead);

    // Broadcast to popup
    chrome.runtime.sendMessage({ type: 'NEW_LEAD', lead }).catch(() => {
      // Popup not open - ignore
    });

    console.log('Business scraped and saved:', data.name);
    return { success: true, lead };
  } catch (error) {
    console.error('Scraped business save error:', error);
    return { success: false, error: error.message };
  }
}

// Analyze image with Gemini Vision
async function handleImageAnalysis(imageUrl, context = {}) {
  if (!isScanning) {
    return { success: false, error: 'Scanning paused' };
  }

  if (!settings.geminiKey) {
    return { success: false, error: 'No Gemini API key configured' };
  }

  if (!imageUrl || !isValidImageUrl(imageUrl)) {
    return { success: false, error: 'Invalid image URL' };
  }

  try {
    console.log('[LeadHunter] Analyzing image with Gemini Vision...');

    // Analyze image with Gemini
    const result = await analyzeImageWithGemini(
      imageUrl,
      settings.geminiKey,
      settings.industries || []
    );

    if (!result || !result.hasContactInfo) {
      console.log('[LeadHunter] No contact info found in image');
      return { success: true, hasContactInfo: false };
    }

    // Only create lead if we have meaningful contact info
    const hasUsefulData = result.data.email || result.data.phone || result.data.website ||
                          (result.data.name && result.data.company);

    if (!hasUsefulData) {
      console.log('[LeadHunter] Image contact info not useful enough');
      return { success: true, hasContactInfo: false };
    }

    // Check for duplicates with normalization
    const storage = await chrome.storage.local.get(['leads']);
    const leads = storage.leads || [];

    // Normalize for comparison
    const normalizeName = (name) => (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizePhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);
    const normalizeEmail = (email) => (email || '').toLowerCase().trim();

    const newEmail = normalizeEmail(result.data.email);
    const newPhone = normalizePhone(result.data.phone);
    const newName = normalizeName(result.data.name);
    const newCompany = normalizeName(result.data.company);

    const isDuplicate = leads.some(l => {
      // Same email
      if (newEmail && normalizeEmail(l.email) === newEmail) return true;
      // Same phone
      if (newPhone && newPhone.length >= 7 && normalizePhone(l.phone) === newPhone) return true;
      // Same website
      if (result.data.website && l.website === result.data.website) return true;
      // Same name + company
      if (newName && newCompany && normalizeName(l.name) === newName && normalizeName(l.company) === newCompany) return true;
      return false;
    });

    if (isDuplicate) {
      console.log('[LeadHunter] Contact from image already exists');
      return { success: true, hasContactInfo: true, duplicate: true, data: result.data };
    }

    // Create lead from image data
    const lead = {
      id: generateId(),
      name: result.data.name || result.data.company || 'Unknown',
      title: result.data.jobTitle || '',
      bio: result.notes || '',
      profileUrl: context.postUrl || imageUrl,
      platform: context.platform || 'image',
      comment: context.postText || result.rawText || '',
      score: result.confidence === 'high' ? 4 : (result.confidence === 'medium' ? 3 : 2),
      urgencyLevel: 'low',
      frustrationLevel: 0,
      buyingIntent: 'unknown',
      suggestedApproach: 'cold',
      analysis: `Contacto extraído de imagen (${result.imageType || 'unknown'}). ${result.notes || ''}`,
      painPoints: [],
      industry: result.data.industry || settings.industries?.[0] || 'unknown',
      isBusinessOwner: true,
      mentionsCompetitor: false,
      messageDraft: '',
      timestamp: new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      contacted: false,
      sentToHubspot: false,
      sentToWebhook: false,
      sentToSheets: false,
      email: result.data.email || null,
      emailConfidence: result.data.email ? (result.confidence === 'high' ? 90 : 70) : null,
      company: result.data.company || null,
      website: result.data.website || null,
      phone: result.data.phone || null,
      address: result.data.address || null,
      previouslyContacted: false,
      previousInteractions: [],
      screenshot: null,
      notes: `Fuente: Imagen ${result.imageType || ''}. Autor: ${context.authorName || 'Unknown'}`,
      leadType: 'image', // New lead type for image-extracted contacts
      filterReason: 'image_extraction',
      filterPriority: 'low',
      detectedIndustry: result.data.industry || null,
      imageSource: imageUrl,
      socialMedia: result.data.socialMedia || {}
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

    // Auto-send to integrations
    await autoSendIntegrations(lead);

    // Broadcast to popup
    chrome.runtime.sendMessage({ type: 'NEW_LEAD', lead }).catch(() => {
      // Popup not open - ignore
    });

    // Show notification
    if (settings.notifyHotLeads) {
      const lang = settings.language || 'en';
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: `📇 ${t('notifContactFoundImage', lang)}`,
        message: `${lead.name}${lead.company ? ' - ' + lead.company : ''}`,
        priority: 1
      });
    }

    console.log('[LeadHunter] Image contact saved:', lead.name);
    return { success: true, hasContactInfo: true, data: result.data, lead };

  } catch (error) {
    console.error('[LeadHunter] Image analysis error:', error);
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

// Find email for lead (manual search from popup)
async function handleFindEmail(lead) {
  if (!settings.hunterKey) {
    return { success: false, error: 'No Hunter.io API key configured' };
  }

  // Extract domain using multiple strategies
  let domain = null;

  // Strategy 1: Extract from website (most reliable)
  if (lead.website) {
    domain = cleanDomain(lead.website);
    if (!domain) {
      try {
        let websiteUrl = lead.website.trim();
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
          websiteUrl = 'https://' + websiteUrl;
        }
        const url = new URL(websiteUrl);
        const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
        if (isValidDomain(hostname)) {
          domain = hostname;
        }
      } catch (e) {
        // Try regex extraction
        const domainMatch = lead.website.match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})/);
        if (domainMatch) {
          const extracted = domainMatch[1].toLowerCase();
          if (isValidDomain(extracted)) {
            domain = extracted;
          }
        }
      }
    }
  }

  // Strategy 2: Extract from existing email
  if (!domain && lead.email) {
    domain = extractDomainFromEmail(lead.email);
  }

  // Strategy 3: Only use company if it looks like a domain
  if (!domain && lead.company) {
    const companyLower = lead.company.toLowerCase().trim();
    if (companyLower.match(/^[a-z0-9][-a-z0-9]*\.[a-z]{2,}$/)) {
      if (isValidDomain(companyLower)) {
        domain = companyLower;
      }
    }
  }

  // Validate domain
  if (!domain || !isValidDomain(domain)) {
    return {
      success: false,
      error: 'No se encontró un dominio válido. Asegúrate de que el lead tenga un sitio web (website) registrado.'
    };
  }

  const nameParts = (lead.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  console.log('[Hunter.io] Manual search for:', domain, firstName, lastName);

  try {
    const result = await findEmail(domain, firstName, lastName, settings.hunterKey);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send notification
async function sendNotification(lead) {
  const lang = settings.language || 'en';
  const urgencyEmoji = {
    critical: '🔥🔥',
    high: '🔥',
    medium: '⚡',
    low: '💤'
  };

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: `${urgencyEmoji[lead.urgencyLevel] || '⚡'} ${t('notifLeadDetected', lang)} (${lead.score}/10)`,
    message: `${lead.name} ${t('notifIn', lang)} ${lead.platform}: "${lead.comment.substring(0, 50)}..."`,
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
