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
  // Home Services
  plumbing: ['plomero', 'plumber', 'plomeria', 'plumbing', 'tuberias', 'pipes', 'drain', 'drenaje', 'water heater', 'faucet', 'toilet', 'leak'],
  hvac: ['hvac', 'aire acondicionado', 'ac', 'air conditioning', 'heating', 'calefaccion', 'ventilation', 'furnace', 'heat pump', 'cooling', 'ductwork', 'hvac owner', 'hvac business', 'hvac company'],
  electrical: ['electricista', 'electrician', 'electrical', 'wiring', 'panel', 'outlet', 'circuit', 'voltage'],
  contractors: ['contratista', 'contractor', 'construccion', 'construction', 'remodeling', 'remodelacion', 'general contractor', 'gc', 'builder'],
  roofing: ['techador', 'roofer', 'roofing', 'techo', 'roof', 'shingles', 'gutters'],
  landscaping: ['jardinero', 'landscaper', 'landscaping', 'lawn care', 'lawn', 'garden', 'tree service', 'mowing'],
  cleaning: ['limpieza', 'cleaning', 'cleaner', 'maid', 'janitorial', 'house cleaning', 'commercial cleaning'],
  pest: ['fumigador', 'pest control', 'exterminator', 'termite', 'bug', 'rodent', 'pest'],
  painting: ['pintor', 'painter', 'painting', 'pintura', 'house painter'],
  locksmith: ['cerrajero', 'locksmith', 'locks', 'keys', 'security'],

  // Healthcare
  dental: ['dentista', 'dental', 'dentist', 'clinica dental', 'consultorio dental', 'orthodontist', 'ortodoncia', 'dental office', 'dental practice'],
  medical: ['doctor', 'medico', 'clinica', 'clinic', 'consultorio', 'practice', 'pacientes', 'patients', 'medical office', 'physician'],
  chiropractic: ['quiropractico', 'chiropractor', 'chiropractic', 'spine', 'adjustment'],
  veterinary: ['veterinario', 'vet', 'veterinary', 'veterinarian', 'animal clinic', 'pet clinic'],
  optometry: ['optometrista', 'optometrist', 'optometry', 'eye doctor', 'vision', 'optical'],
  medspa: ['med spa', 'medspa', 'medical spa', 'botox', 'aesthetic', 'laser', 'skin clinic'],

  // Professional Services
  legal: ['abogado', 'lawyer', 'attorney', 'legal', 'bufete', 'law firm', 'despacho', 'law office'],
  accounting: ['contador', 'accountant', 'accounting', 'cpa', 'tax', 'bookkeeper', 'bookkeeping'],
  insurance: ['seguros', 'insurance', 'insurance agent', 'insurance agency', 'broker'],
  realestate: ['real estate', 'bienes raices', 'inmobiliaria', 'realtor', 'agente', 'property', 'real estate agent', 'broker'],
  mortgage: ['hipoteca', 'mortgage', 'loan officer', 'lending', 'home loan'],
  financial: ['asesor financiero', 'financial advisor', 'financial planner', 'wealth', 'investment'],

  // Automotive
  automotive: ['mecanico', 'mechanic', 'taller', 'auto shop', 'car repair', 'automotive', 'auto repair', 'garage'],
  towing: ['grua', 'towing', 'tow truck', 'roadside assistance'],
  autobody: ['carroceria', 'auto body', 'body shop', 'collision', 'paint shop'],
  carwash: ['lavado de autos', 'car wash', 'carwash', 'auto detailing', 'detailing'],

  // Other Services
  photography: ['fotografo', 'photographer', 'photography', 'photo studio', 'wedding photographer'],
  salon: ['salon', 'spa', 'beauty', 'hair salon', 'nail salon', 'barber', 'estetica'],
  fitness: ['gimnasio', 'gym', 'fitness', 'personal trainer', 'crossfit', 'yoga studio'],
  restaurant: ['restaurante', 'restaurant', 'cafe', 'bar', 'food', 'catering'],
  moving: ['mudanza', 'moving', 'mover', 'moving company', 'relocation'],
  storage: ['almacen', 'storage', 'self storage', 'warehouse']
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
 * @returns {object|boolean} - Object with pass status and lead type, or false
 */
export function passesKeywordFilter(comment, settings = {}) {
  if (!comment || typeof comment !== 'string') {
    return false;
  }

  const trimmed = comment.trim();
  const lowerComment = trimmed.toLowerCase();

  // Check minimum word count (reduced for prospects)
  const minWords = settings.minWords || 8;
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < Math.min(minWords, 5)) {
    return false;
  }

  // Check for garbage/low-value content
  for (const pattern of GARBAGE_INDICATORS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Check for pain keywords
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

  const painKeywordCount = allPainKeywords.filter(kw =>
    lowerComment.includes(kw.toLowerCase())
  ).length;

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

  // Check for industry keywords
  let hasIndustryMatch = false;
  let matchedIndustry = null;
  if (settings.industries && settings.industries.length > 0) {
    for (const industry of settings.industries) {
      const keywords = INDUSTRY_KEYWORDS[industry] || [];
      if (keywords.some(kw => lowerComment.includes(kw.toLowerCase()))) {
        hasIndustryMatch = true;
        matchedIndustry = industry;
        break;
      }
    }
  }

  // PAIN LEAD: Has explicit pain signals
  // Priority 1: Mentions competitor (actively looking!)
  if (mentionsCompetitor) {
    return { pass: true, leadType: 'pain', reason: 'competitor_mention', priority: 'critical' };
  }

  // Priority 2: Pain keyword + owner indicator
  if (hasPainKeyword && hasOwnerIndicator) {
    return { pass: true, leadType: 'pain', reason: 'pain_and_owner', priority: 'high' };
  }

  // Priority 3: Multiple pain keywords
  if (painKeywordCount >= 2) {
    return { pass: true, leadType: 'pain', reason: 'multiple_pain_keywords', priority: 'high' };
  }

  // Priority 4: Pain keyword + industry match + enough words
  if (hasPainKeyword && hasIndustryMatch && wordCount >= 12) {
    return { pass: true, leadType: 'pain', reason: 'pain_and_industry', priority: 'medium' };
  }

  // PROSPECT LEAD: Business owner without explicit pain
  // They might need our service but haven't expressed pain yet

  // Prospect 1: Any industry match with minimum content
  if (hasIndustryMatch && wordCount >= 5) {
    return { pass: true, leadType: 'prospect', reason: 'industry_match', priority: 'low', industry: matchedIndustry };
  }

  // Prospect 2: Owner indicator + any substantial content
  if (hasOwnerIndicator && wordCount >= 8) {
    return { pass: true, leadType: 'prospect', reason: 'business_owner', priority: 'low' };
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
