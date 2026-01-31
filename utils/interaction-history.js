// Lead Hunter AI - Interaction History

/**
 * Track all interactions with leads across platforms
 */

/**
 * Add interaction to history
 * @param {string} leadId - Lead ID
 * @param {object} interaction - Interaction details
 */
export async function addInteraction(leadId, interaction) {
  const storage = await chrome.storage.local.get(['interactions']);
  const interactions = storage.interactions || {};

  if (!interactions[leadId]) {
    interactions[leadId] = [];
  }

  interactions[leadId].push({
    ...interaction,
    timestamp: new Date().toISOString()
  });

  await chrome.storage.local.set({ interactions });
}

/**
 * Get interactions for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<array>} - Array of interactions
 */
export async function getInteractions(leadId) {
  const storage = await chrome.storage.local.get(['interactions']);
  const interactions = storage.interactions || {};
  return interactions[leadId] || [];
}

/**
 * Check if person was contacted before (across all leads)
 * @param {string} profileUrl - Profile URL
 * @param {string} name - Person name
 * @returns {Promise<object>} - Previous contact info
 */
export async function checkPreviousContact(profileUrl, name) {
  const storage = await chrome.storage.local.get(['leads', 'interactions', 'contactedProfiles']);
  const leads = storage.leads || [];
  const contactedProfiles = storage.contactedProfiles || {};

  // Check by profile URL (most reliable)
  if (profileUrl && contactedProfiles[profileUrl]) {
    return {
      contacted: true,
      method: 'profile_url',
      data: contactedProfiles[profileUrl]
    };
  }

  // Check in existing leads
  const normalizedName = normalizeName(name);
  const matchingLeads = leads.filter(lead => {
    if (lead.profileUrl === profileUrl) return true;
    if (normalizeName(lead.name) === normalizedName) return true;
    return false;
  });

  if (matchingLeads.length > 0) {
    const contacted = matchingLeads.some(l => l.contacted);
    return {
      contacted,
      method: 'lead_match',
      previousLeads: matchingLeads.map(l => ({
        id: l.id,
        platform: l.platform,
        timestamp: l.timestamp,
        contacted: l.contacted
      }))
    };
  }

  return { contacted: false };
}

/**
 * Mark profile as contacted
 * @param {string} profileUrl - Profile URL
 * @param {object} data - Contact data
 */
export async function markProfileContacted(profileUrl, data) {
  if (!profileUrl) return;

  const storage = await chrome.storage.local.get(['contactedProfiles']);
  const contactedProfiles = storage.contactedProfiles || {};

  contactedProfiles[profileUrl] = {
    ...data,
    contactedAt: new Date().toISOString()
  };

  await chrome.storage.local.set({ contactedProfiles });
}

/**
 * Get contact history for a profile
 * @param {string} profileUrl - Profile URL
 * @returns {Promise<array>} - Contact history
 */
export async function getContactHistory(profileUrl) {
  const storage = await chrome.storage.local.get(['leads', 'interactions']);
  const leads = storage.leads || [];
  const interactions = storage.interactions || {};

  const relatedLeads = leads.filter(l => l.profileUrl === profileUrl);
  const history = [];

  relatedLeads.forEach(lead => {
    history.push({
      type: 'lead_detected',
      platform: lead.platform,
      timestamp: lead.timestamp,
      score: lead.score
    });

    const leadInteractions = interactions[lead.id] || [];
    leadInteractions.forEach(int => {
      history.push({
        type: int.type,
        platform: lead.platform,
        timestamp: int.timestamp,
        details: int.details
      });
    });
  });

  // Sort by timestamp
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return history;
}

/**
 * Interaction types
 */
export const INTERACTION_TYPES = {
  DETECTED: 'detected',
  VIEWED: 'viewed',
  MESSAGE_DRAFTED: 'message_drafted',
  MESSAGE_SENT: 'message_sent',
  PROFILE_VISITED: 'profile_visited',
  SENT_TO_CRM: 'sent_to_crm',
  EMAIL_SENT: 'email_sent',
  CALL_MADE: 'call_made',
  MEETING_SCHEDULED: 'meeting_scheduled',
  CONVERTED: 'converted',
  MARKED_NOT_INTERESTED: 'not_interested'
};

/**
 * Log common interactions easily
 */
export const logInteraction = {
  viewed: (leadId) => addInteraction(leadId, { type: INTERACTION_TYPES.VIEWED }),

  messageDrafted: (leadId, message) => addInteraction(leadId, {
    type: INTERACTION_TYPES.MESSAGE_DRAFTED,
    details: { messagePreview: message.substring(0, 100) }
  }),

  messageSent: (leadId, platform) => addInteraction(leadId, {
    type: INTERACTION_TYPES.MESSAGE_SENT,
    details: { platform }
  }),

  profileVisited: (leadId) => addInteraction(leadId, { type: INTERACTION_TYPES.PROFILE_VISITED }),

  sentToCRM: (leadId, crmName, crmId) => addInteraction(leadId, {
    type: INTERACTION_TYPES.SENT_TO_CRM,
    details: { crm: crmName, crmId }
  }),

  converted: (leadId, details) => addInteraction(leadId, {
    type: INTERACTION_TYPES.CONVERTED,
    details
  }),

  notInterested: (leadId, reason) => addInteraction(leadId, {
    type: INTERACTION_TYPES.MARKED_NOT_INTERESTED,
    details: { reason }
  })
};

/**
 * Get interaction summary for analytics
 * @returns {Promise<object>} - Summary stats
 */
export async function getInteractionSummary() {
  const storage = await chrome.storage.local.get(['leads', 'interactions']);
  const leads = storage.leads || [];
  const interactions = storage.interactions || {};

  const summary = {
    totalLeads: leads.length,
    contacted: leads.filter(l => l.contacted).length,
    conversionRate: 0,
    byPlatform: {},
    byType: {},
    timeline: []
  };

  // Count by platform
  leads.forEach(lead => {
    summary.byPlatform[lead.platform] = (summary.byPlatform[lead.platform] || 0) + 1;
  });

  // Count by interaction type
  Object.values(interactions).flat().forEach(int => {
    summary.byType[int.type] = (summary.byType[int.type] || 0) + 1;
  });

  // Calculate conversion rate
  const converted = summary.byType[INTERACTION_TYPES.CONVERTED] || 0;
  if (summary.contacted > 0) {
    summary.conversionRate = Math.round((converted / summary.contacted) * 100);
  }

  return summary;
}

/**
 * Normalize name for comparison
 */
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Find duplicate leads (same person, different platforms)
 * @returns {Promise<array>} - Groups of duplicate leads
 */
export async function findDuplicates() {
  const storage = await chrome.storage.local.get(['leads']);
  const leads = storage.leads || [];

  const byName = {};

  leads.forEach(lead => {
    const normalized = normalizeName(lead.name);
    if (!normalized) return;

    if (!byName[normalized]) {
      byName[normalized] = [];
    }
    byName[normalized].push(lead);
  });

  // Return only groups with more than one lead
  return Object.entries(byName)
    .filter(([_, group]) => group.length > 1)
    .map(([name, group]) => ({
      name,
      leads: group,
      platforms: [...new Set(group.map(l => l.platform))]
    }));
}
