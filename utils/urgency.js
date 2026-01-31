// Lead Hunter AI - Urgency Detection & Timer

/**
 * Urgency levels and their decay times
 */
export const URGENCY_CONFIG = {
  critical: {
    label: 'Crítico',
    emoji: '🔥🔥',
    color: '#dc2626',
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    description: 'Responder inmediatamente'
  },
  high: {
    label: 'Alto',
    emoji: '🔥',
    color: '#ea580c',
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    description: 'Responder hoy'
  },
  medium: {
    label: 'Medio',
    emoji: '⚡',
    color: '#ca8a04',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Responder en 24h'
  },
  low: {
    label: 'Bajo',
    emoji: '💤',
    color: '#6b7280',
    maxAge: 72 * 60 * 60 * 1000, // 72 hours
    description: 'Cuando puedas'
  },
  cold: {
    label: 'Frío',
    emoji: '❄️',
    color: '#3b82f6',
    maxAge: Infinity,
    description: 'Probablemente tarde'
  }
};

/**
 * Detect urgency level from comment text using keywords
 * @param {string} comment - Comment text
 * @returns {string} - Urgency level
 */
export function detectUrgencyFromText(comment) {
  const lower = comment.toLowerCase();

  // Critical urgency indicators
  const criticalPatterns = [
    /\burgente?\b/i,
    /\basap\b/i,
    /\bahora mismo\b/i,
    /\bimmediately\b/i,
    /\bdesesperado/i,
    /\bemergencia/i,
    /\bhelp me\b/i,
    /\bayuda\b.*\bporfavor\b/i,
    /\bno puedo mas\b/i,
    /\bestoy perdiendo\b/i,
    /!!!+/
  ];

  // High urgency indicators
  const highPatterns = [
    /\bhoy\b/i,
    /\btoday\b/i,
    /\besta semana\b/i,
    /\bthis week\b/i,
    /\blo antes posible\b/i,
    /\bneed.*fast\b/i,
    /\brapido\b/i,
    /\bquickly\b/i,
    /\bfrustrado/i,
    /\bfrustrated/i,
    /\bharto/i,
    /\bcansado de\b/i,
    /\btired of\b/i
  ];

  // Medium urgency indicators
  const mediumPatterns = [
    /\bnecesito\b/i,
    /\bneed\b/i,
    /\bbuscando\b/i,
    /\blooking for\b/i,
    /\bquiero\b/i,
    /\bwant\b/i,
    /\bproblema\b/i,
    /\bproblem\b/i,
    /\bissue\b/i
  ];

  // Check patterns
  for (const pattern of criticalPatterns) {
    if (pattern.test(lower)) return 'critical';
  }

  for (const pattern of highPatterns) {
    if (pattern.test(lower)) return 'high';
  }

  for (const pattern of mediumPatterns) {
    if (pattern.test(lower)) return 'medium';
  }

  return 'low';
}

/**
 * Calculate urgency decay based on time since comment
 * @param {string} timestamp - Original timestamp
 * @param {string} baseUrgency - Initial urgency level
 * @returns {object} - Current urgency status
 */
export function calculateUrgencyDecay(timestamp, baseUrgency = 'medium') {
  const now = Date.now();
  const commentTime = new Date(timestamp).getTime();
  const age = now - commentTime;

  // Get base config
  const baseConfig = URGENCY_CONFIG[baseUrgency] || URGENCY_CONFIG.medium;

  // Decay logic: urgency decreases over time
  let currentLevel = baseUrgency;

  if (age > 72 * 60 * 60 * 1000) {
    currentLevel = 'cold';
  } else if (age > 24 * 60 * 60 * 1000) {
    currentLevel = baseUrgency === 'critical' ? 'medium' : 'low';
  } else if (age > 12 * 60 * 60 * 1000) {
    currentLevel = baseUrgency === 'critical' ? 'high' : baseUrgency === 'high' ? 'medium' : baseUrgency;
  }

  const config = URGENCY_CONFIG[currentLevel];

  return {
    level: currentLevel,
    label: config.label,
    emoji: config.emoji,
    color: config.color,
    description: config.description,
    age: age,
    ageFormatted: formatAge(age),
    isDecayed: currentLevel !== baseUrgency,
    originalLevel: baseUrgency,
    respondBy: getRespondByTime(commentTime, baseUrgency)
  };
}

/**
 * Format age in human-readable format
 * @param {number} ms - Age in milliseconds
 * @returns {string} - Formatted age
 */
export function formatAge(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return 'Ahora';
}

/**
 * Get "respond by" deadline
 * @param {number} commentTime - Comment timestamp
 * @param {string} urgency - Urgency level
 * @returns {string} - Deadline description
 */
function getRespondByTime(commentTime, urgency) {
  const config = URGENCY_CONFIG[urgency];
  const deadline = new Date(commentTime + config.maxAge);
  const now = new Date();

  if (deadline < now) {
    return 'Vencido';
  }

  const diff = deadline - now;
  const hours = Math.floor(diff / (60 * 60 * 1000));

  if (hours < 1) {
    return 'Menos de 1 hora';
  }
  if (hours < 24) {
    return `${hours} horas`;
  }

  return `${Math.floor(hours / 24)} días`;
}

/**
 * Sort leads by urgency priority
 * @param {array} leads - Array of leads
 * @returns {array} - Sorted leads
 */
export function sortByUrgency(leads) {
  const priority = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    cold: 4
  };

  return [...leads].sort((a, b) => {
    const aPriority = priority[a.urgencyLevel] ?? 3;
    const bPriority = priority[b.urgencyLevel] ?? 3;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Same urgency - sort by score
    return (b.score || 0) - (a.score || 0);
  });
}

/**
 * Get urgency stats for dashboard
 * @param {array} leads - Array of leads
 * @returns {object} - Stats by urgency
 */
export function getUrgencyStats(leads) {
  const stats = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    cold: 0,
    total: leads.length,
    needsAttention: 0
  };

  leads.forEach(lead => {
    const level = lead.urgencyLevel || 'medium';
    if (stats.hasOwnProperty(level)) {
      stats[level]++;
    }
    if (level === 'critical' || level === 'high') {
      stats.needsAttention++;
    }
  });

  return stats;
}
