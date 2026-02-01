// Lead Hunter AI - Industry-specific Pain Keywords
// Auto-populated when user selects industries

export const INDUSTRY_PAIN_KEYWORDS = {
  // Home Services
  plumbing: [
    'emergency plumbing',
    'after hours calls',
    'weekend calls',
    'pipe burst',
    'water damage calls',
    'clogged drain emergency'
  ],
  hvac: [
    'no heat emergency',
    'ac broken',
    'hvac emergency',
    'after hours hvac',
    'weekend service calls',
    'furnace not working',
    'ac not cooling'
  ],
  electrical: [
    'power outage',
    'electrical emergency',
    'no power',
    'sparking outlet',
    'after hours electrician'
  ],
  contractors: [
    'project delays',
    'client calls',
    'subcontractor coordination',
    'estimate requests',
    'quote requests'
  ],
  roofing: [
    'roof leak',
    'storm damage',
    'emergency roof repair',
    'hail damage',
    'roof inspection'
  ],
  landscaping: [
    'lawn service calls',
    'scheduling issues',
    'seasonal rush',
    'customer complaints'
  ],
  cleaning: [
    'last minute booking',
    'emergency cleaning',
    'same day service',
    'scheduling conflicts'
  ],
  pest: [
    'pest emergency',
    'bee removal',
    'rodent problem',
    'termite inspection',
    'same day service'
  ],
  painting: [
    'estimate requests',
    'quote calls',
    'scheduling painters',
    'color consultation'
  ],
  locksmith: [
    'lockout emergency',
    'locked out',
    '24/7 locksmith',
    'emergency locksmith',
    'car lockout'
  ],

  // Healthcare
  dental: [
    'dental emergency',
    'tooth pain',
    'appointment scheduling',
    'patient no-shows',
    'cancellations',
    'new patient calls',
    'insurance questions'
  ],
  medical: [
    'patient calls',
    'appointment requests',
    'prescription refills',
    'after hours calls',
    'urgent care',
    'medical questions'
  ],
  chiropractic: [
    'appointment scheduling',
    'new patient intake',
    'insurance verification',
    'back pain emergency'
  ],
  veterinary: [
    'pet emergency',
    'after hours vet',
    'sick pet',
    'appointment scheduling',
    'medication refills'
  ],
  optometry: [
    'eye exam scheduling',
    'contact lens orders',
    'glasses ready',
    'vision emergency'
  ],
  medspa: [
    'appointment booking',
    'consultation requests',
    'treatment questions',
    'scheduling conflicts'
  ],

  // Professional Services
  legal: [
    'client intake',
    'new case calls',
    'legal emergency',
    'court dates',
    'client questions',
    'consultation requests'
  ],
  accounting: [
    'tax season calls',
    'deadline questions',
    'client documents',
    'bookkeeping questions',
    'payroll issues'
  ],
  insurance: [
    'quote requests',
    'claim questions',
    'policy changes',
    'new client calls',
    'coverage questions'
  ],
  realestate: [
    'showing requests',
    'buyer inquiries',
    'seller leads',
    'open house',
    'listing questions',
    'property inquiries'
  ],
  mortgage: [
    'rate inquiries',
    'application status',
    'document requests',
    'pre-approval',
    'loan questions'
  ],
  financial: [
    'client meetings',
    'portfolio questions',
    'market updates',
    'new client intake',
    'retirement planning'
  ],

  // Automotive
  automotive: [
    'car breakdown',
    'check engine light',
    'appointment scheduling',
    'repair estimates',
    'service reminders',
    'parts ready'
  ],
  towing: [
    'roadside emergency',
    'car accident',
    'vehicle breakdown',
    '24/7 towing',
    'jump start'
  ],
  autobody: [
    'accident repair',
    'insurance claims',
    'estimate requests',
    'repair status',
    'parts availability'
  ],
  carwash: [
    'membership questions',
    'gift cards',
    'detailing appointments',
    'fleet services'
  ],

  // Other Services
  photography: [
    'booking inquiries',
    'wedding dates',
    'session scheduling',
    'photo delivery',
    'event coverage'
  ],
  salon: [
    'appointment booking',
    'walk-ins',
    'cancellations',
    'product questions',
    'stylist availability'
  ],
  fitness: [
    'membership inquiries',
    'class scheduling',
    'personal training',
    'cancellation policy',
    'trial membership'
  ],
  restaurant: [
    'reservation requests',
    'large party booking',
    'catering inquiries',
    'menu questions',
    'hours of operation'
  ],
  moving: [
    'quote requests',
    'moving date availability',
    'packing services',
    'storage options',
    'last minute moves'
  ],
  storage: [
    'unit availability',
    'pricing questions',
    'access hours',
    'size recommendations',
    'move-in specials'
  ]
};

// Common pain keywords for all industries
export const COMMON_PAIN_KEYWORDS = [
  'missed calls',
  'voicemail full',
  'cant answer phone',
  'too busy to answer',
  'losing customers',
  'after hours',
  'weekends',
  '24/7',
  'overwhelmed',
  'need receptionist',
  'hiring receptionist',
  'front desk help',
  'phone keeps ringing',
  'customer complaints',
  'no time to call back'
];

/**
 * Get pain keywords for selected industries
 * @param {string[]} industries - Array of selected industry keys
 * @returns {string[]} - Array of pain keywords
 */
export function getPainKeywordsForIndustries(industries) {
  const keywords = [...COMMON_PAIN_KEYWORDS];

  for (const industry of industries) {
    if (INDUSTRY_PAIN_KEYWORDS[industry]) {
      keywords.push(...INDUSTRY_PAIN_KEYWORDS[industry]);
    }
  }

  // Remove duplicates
  return [...new Set(keywords)];
}
