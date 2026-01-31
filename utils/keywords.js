// Lead Hunter AI - Keyword Filter System

// Default pain point keywords (Spanish & English)
const DEFAULT_PAIN_KEYWORDS = [
  // Phone/Calls issues
  'no contestan', 'nadie contesta', 'nunca contestan', 'no me contestan',
  'pierdo llamadas', 'llamadas perdidas', 'missed calls', 'missing calls',
  'no puedo contestar', 'cant answer', "can't answer",
  'telefono suena', 'phone rings', 'ringing off the hook',
  'desbordado de llamadas', 'too many calls', 'overwhelmed with calls',

  // Appointments/Scheduling
  'citas perdidas', 'missed appointments', 'cancellations',
  'no show', 'no shows', 'pacientes no llegan',
  'agenda llena', 'schedule full', 'cant schedule',
  'reservaciones', 'bookings', 'appointments',

  // Staff/Receptionist needs
  'necesito recepcionista', 'need receptionist',
  'secretaria', 'secretary', 'front desk',
  'nadie en recepcion', 'no one at front desk',
  'personal insuficiente', 'understaffed', 'short staffed',
  'no tengo quien conteste', 'no one to answer',

  // Customer service issues
  'clientes se quejan', 'customers complain', 'complaints',
  'mala atencion', 'poor service', 'bad service',
  'clientes molestos', 'angry customers', 'frustrated customers',
  'perdiendo clientes', 'losing customers', 'lost customers',

  // Messages/Communication
  'mensajes sin responder', 'unanswered messages',
  'buzón lleno', 'voicemail full', 'voicemails',
  'no respondo a tiempo', 'cant respond in time',
  'comunicacion', 'communication',

  // General business pain
  'estoy solo', 'solo en el negocio', 'running alone',
  'no doy abasto', 'overwhelmed', 'too busy',
  'necesito ayuda', 'need help', 'struggling',
  'automatizar', 'automate', 'automation',
  'solución', 'solution', 'resolver'
];

// Business owner indicators
const OWNER_INDICATORS = [
  // Spanish
  'mi negocio', 'mi empresa', 'mi clinica', 'mi consultorio',
  'mi taller', 'mi oficina', 'mi restaurante', 'mi salon',
  'soy dueño', 'soy propietario', 'tengo una', 'tengo un',
  'somos una empresa', 'nuestra empresa', 'nuestro negocio',
  'abri mi', 'empece mi', 'fundé',

  // English
  'my business', 'my company', 'my clinic', 'my office',
  'my shop', 'my restaurant', 'my salon', 'my practice',
  'i own', 'i started', 'i run', 'i manage',
  'we are a', 'our company', 'our business',
  'small business', 'local business'
];

// Industry-specific keywords
const INDUSTRY_KEYWORDS = {
  plumbing: ['plomero', 'plumber', 'plomeria', 'plumbing', 'tuberias', 'pipes', 'drain', 'drenaje'],
  hvac: ['hvac', 'aire acondicionado', 'ac', 'air conditioning', 'heating', 'calefaccion', 'ventilation'],
  dental: ['dentista', 'dental', 'dentist', 'clinica dental', 'consultorio dental', 'orthodontist', 'ortodoncia'],
  contractors: ['contratista', 'contractor', 'construccion', 'construction', 'remodeling', 'remodelacion'],
  medical: ['doctor', 'medico', 'clinica', 'clinic', 'consultorio', 'practice', 'pacientes', 'patients'],
  legal: ['abogado', 'lawyer', 'attorney', 'legal', 'bufete', 'law firm', 'despacho'],
  realestate: ['real estate', 'bienes raices', 'inmobiliaria', 'realtor', 'agente', 'property'],
  automotive: ['mecanico', 'mechanic', 'taller', 'auto shop', 'car repair', 'automotive']
};

// Garbage/low-value indicators (skip these)
const GARBAGE_INDICATORS = [
  /^(jaja|haha|lol|lmao|rofl)+$/i,
  /^[🔥❤️👍👏💯😂🤣]+$/,
  /^(wow|nice|cool|great|awesome|genial|increible)!*$/i,
  /^(thanks|gracias|ty|thx)!*$/i,
  /^(congrats|felicidades|congratulations)!*$/i,
  /^(following|siguiendo|subscribed)$/i,
  /^(bump|up|☝️|👆)$/i
];

/**
 * Check if a comment passes the keyword filter
 * @param {string} comment - The comment text to analyze
 * @param {object} settings - User settings
 * @returns {boolean} - True if comment should be analyzed by AI
 */
export function passesKeywordFilter(comment, settings = {}) {
  if (!comment || typeof comment !== 'string') {
    return false;
  }

  const trimmed = comment.trim();
  const lowerComment = trimmed.toLowerCase();

  // Check minimum word count
  const minWords = settings.minWords || 8;
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < minWords) {
    return false;
  }

  // Check for garbage/low-value content
  for (const pattern of GARBAGE_INDICATORS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Check for pain keywords (at least one required)
  const allPainKeywords = [...DEFAULT_PAIN_KEYWORDS];

  // Add custom keywords from settings
  if (settings.customKeywords) {
    const custom = settings.customKeywords
      .split('\n')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
    allPainKeywords.push(...custom);
  }

  const hasPainKeyword = allPainKeywords.some(keyword =>
    lowerComment.includes(keyword.toLowerCase())
  );

  // Check for owner indicators
  const hasOwnerIndicator = OWNER_INDICATORS.some(indicator =>
    lowerComment.includes(indicator.toLowerCase())
  );

  // Check for competitor mentions
  let mentionsCompetitor = false;
  if (settings.competitors) {
    const competitors = settings.competitors
      .split('\n')
      .map(c => c.trim().toLowerCase())
      .filter(c => c.length > 0);

    mentionsCompetitor = competitors.some(comp =>
      lowerComment.includes(comp)
    );
  }

  // Check for industry keywords if industries are specified
  let hasIndustryMatch = true; // Default to true if no industries specified
  if (settings.industries && settings.industries.length > 0) {
    hasIndustryMatch = settings.industries.some(industry => {
      const keywords = INDUSTRY_KEYWORDS[industry] || [];
      return keywords.some(kw => lowerComment.includes(kw.toLowerCase()));
    });
  }

  // Pass if:
  // 1. Has pain keyword AND (owner indicator OR competitor mention), OR
  // 2. Has competitor mention (they're actively looking), OR
  // 3. Has multiple pain keywords (strong signal)
  const painKeywordCount = allPainKeywords.filter(kw =>
    lowerComment.includes(kw.toLowerCase())
  ).length;

  if (mentionsCompetitor) {
    return true;
  }

  if (hasPainKeyword && hasOwnerIndicator) {
    return true;
  }

  if (painKeywordCount >= 2) {
    return true;
  }

  // If industry match required and has pain keyword
  if (hasPainKeyword && hasIndustryMatch && wordCount >= 15) {
    return true;
  }

  return false;
}

/**
 * Get all matching keywords in a comment
 * @param {string} comment - The comment text
 * @param {object} settings - User settings
 * @returns {object} - Object with matched keywords by category
 */
export function getMatchedKeywords(comment, settings = {}) {
  const lowerComment = comment.toLowerCase();

  const result = {
    painPoints: [],
    ownerIndicators: [],
    industries: [],
    competitors: []
  };

  // Pain keywords
  const allPainKeywords = [...DEFAULT_PAIN_KEYWORDS];
  if (settings.customKeywords) {
    const custom = settings.customKeywords.split('\n').filter(k => k.trim());
    allPainKeywords.push(...custom);
  }

  result.painPoints = allPainKeywords.filter(kw =>
    lowerComment.includes(kw.toLowerCase())
  );

  // Owner indicators
  result.ownerIndicators = OWNER_INDICATORS.filter(ind =>
    lowerComment.includes(ind.toLowerCase())
  );

  // Industries
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matched = keywords.filter(kw => lowerComment.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      result.industries.push({ industry, keywords: matched });
    }
  }

  // Competitors
  if (settings.competitors) {
    const competitors = settings.competitors.split('\n').filter(c => c.trim());
    result.competitors = competitors.filter(comp =>
      lowerComment.includes(comp.toLowerCase())
    );
  }

  return result;
}

export { DEFAULT_PAIN_KEYWORDS, OWNER_INDICATORS, INDUSTRY_KEYWORDS };
