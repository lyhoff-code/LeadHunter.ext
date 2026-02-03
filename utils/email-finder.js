// Lead Hunter AI - Email Finder Integration (Hunter.io)

/**
 * Find email using Hunter.io API
 * Free tier: 25 searches/month
 *
 * @param {string} domain - Company domain
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} apiKey - Hunter.io API key
 * @returns {Promise<object>} - Email data
 */
export async function findEmail(domain, firstName, lastName, apiKey) {
  if (!apiKey) {
    throw new Error('No Hunter.io API key configured');
  }

  const params = new URLSearchParams({
    domain,
    first_name: firstName,
    last_name: lastName,
    api_key: apiKey
  });

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/email-finder?${params.toString()}`
    );

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].details || 'Hunter.io error');
    }

    if (data.data && data.data.email) {
      return {
        success: true,
        email: data.data.email,
        confidence: data.data.score,
        firstName: data.data.first_name,
        lastName: data.data.last_name,
        position: data.data.position,
        company: data.data.company,
        sources: data.data.sources
      };
    }

    return { success: false, reason: 'Email not found' };
  } catch (error) {
    console.error('Hunter.io error:', error);
    throw error;
  }
}

/**
 * Verify if an email exists
 * @param {string} email - Email to verify
 * @param {string} apiKey - Hunter.io API key
 * @returns {Promise<object>} - Verification result
 */
export async function verifyEmail(email, apiKey) {
  if (!apiKey) {
    throw new Error('No Hunter.io API key configured');
  }

  const params = new URLSearchParams({
    email,
    api_key: apiKey
  });

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/email-verifier?${params.toString()}`
    );

    const data = await response.json();

    if (data.data) {
      return {
        success: true,
        status: data.data.status,
        result: data.data.result,
        score: data.data.score,
        disposable: data.data.disposable,
        webmail: data.data.webmail
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
}

/**
 * Domain search - find all emails at a domain
 * @param {string} domain - Company domain
 * @param {string} apiKey - Hunter.io API key
 * @returns {Promise<object>} - Domain data with emails
 */
export async function domainSearch(domain, apiKey) {
  if (!apiKey) {
    throw new Error('No Hunter.io API key configured');
  }

  const params = new URLSearchParams({
    domain,
    api_key: apiKey
  });

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?${params.toString()}`
    );

    const data = await response.json();

    if (data.data) {
      return {
        success: true,
        domain: data.data.domain,
        company: data.data.organization,
        emails: data.data.emails || [],
        pattern: data.data.pattern
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Domain search error:', error);
    throw error;
  }
}

/**
 * Validate if a string is a valid domain format
 * @param {string} domain - Domain to validate
 * @returns {boolean} - True if valid domain
 */
export function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;

  // Clean the domain
  const cleaned = domain.trim().toLowerCase();

  // Must have at least one dot
  if (!cleaned.includes('.')) return false;

  // Domain regex: alphanumeric with hyphens, dots for subdomains, valid TLD
  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  if (!domainPattern.test(cleaned)) return false;

  // Exclude social media and platform domains (not useful for Hunter.io)
  const excludedDomains = [
    'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
    'linkedin.com', 'youtube.com', 'google.com', 'yelp.com', 'bbb.org',
    'yellowpages.com', 'manta.com', 'thumbtack.com', 'houzz.com',
    'angi.com', 'homeadvisor.com', 'nextdoor.com', 'crunchbase.com',
    'zoominfo.com', 'apollo.io', 'indeed.com', 'ziprecruiter.com',
    'trustpilot.com', 'healthgrades.com', 'zocdoc.com', 'alignable.com',
    'reddit.com', 'quora.com', 'pinterest.com', 'tiktok.com',
    'apple.com', 'android.com', 'whatsapp.com', 'telegram.org',
    'example.com', 'test.com', 'localhost', 'gmail.com', 'yahoo.com',
    'hotmail.com', 'outlook.com', 'mail.com', 'icloud.com'
  ];

  for (const excluded of excludedDomains) {
    if (cleaned === excluded || cleaned.endsWith('.' + excluded)) {
      return false;
    }
  }

  return true;
}

/**
 * Clean and normalize a domain
 * @param {string} domain - Raw domain input
 * @returns {string|null} - Cleaned domain or null
 */
export function cleanDomain(domain) {
  if (!domain || typeof domain !== 'string') return null;

  let cleaned = domain.trim().toLowerCase();

  // Remove protocol
  cleaned = cleaned.replace(/^(https?:\/\/)?/, '');

  // Remove www.
  cleaned = cleaned.replace(/^www\./, '');

  // Remove path, query, hash
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];

  // Remove port
  cleaned = cleaned.split(':')[0];

  // Validate and return
  return isValidDomain(cleaned) ? cleaned : null;
}

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string|null} - Domain or null
 */
export function extractDomainFromEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return null;

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return null;

  const domain = parts[1];

  // Exclude common email providers (not useful for Hunter.io company search)
  const emailProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
    'mail.com', 'ymail.com', 'msn.com', 'comcast.net', 'att.net',
    'verizon.net', 'cox.net', 'sbcglobal.net', 'earthlink.net',
    'proton.me', 'tutanota.com', 'zoho.com'
  ];

  if (emailProviders.includes(domain)) return null;

  return isValidDomain(domain) ? domain : null;
}

/**
 * Extract domain from profile URL or company name
 * @param {object} lead - Lead data
 * @returns {string|null} - Domain or null
 */
export function extractDomain(lead) {
  // Priority 1: Try to extract from website if available
  if (lead.website) {
    const websiteDomain = cleanDomain(lead.website);
    if (websiteDomain) return websiteDomain;

    // Try parsing as URL if cleanDomain failed
    try {
      let websiteUrl = lead.website.trim();
      if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      const url = new URL(websiteUrl);
      const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
      if (isValidDomain(hostname)) return hostname;
    } catch {
      // URL parsing failed, try regex extraction
      const domainMatch = lead.website.match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})/);
      if (domainMatch) {
        const extracted = domainMatch[1].toLowerCase();
        if (isValidDomain(extracted)) return extracted;
      }
    }
  }

  // Priority 2: Try to extract from email if available
  if (lead.email) {
    const emailDomain = extractDomainFromEmail(lead.email);
    if (emailDomain) return emailDomain;
  }

  // Priority 3: Try to extract from profileUrl for certain platforms
  if (lead.profileUrl) {
    try {
      const url = new URL(lead.profileUrl);
      // For LinkedIn company pages, we can't extract domain
      // For other platforms, the profileUrl itself isn't useful
    } catch {
      // Not a valid URL
    }
  }

  // NOTE: We intentionally do NOT guess domain from company name
  // as "Company LLC" -> "companyllc.com" is unreliable and wastes Hunter.io credits
  // Instead, we return null and let the caller handle it

  return null;
}

/**
 * Parse name into first and last name
 * @param {string} fullName - Full name
 * @returns {object} - { firstName, lastName }
 */
export function parseName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

/**
 * Check remaining Hunter.io credits
 * @param {string} apiKey - Hunter.io API key
 * @returns {Promise<object>} - Account info
 */
export async function checkCredits(apiKey) {
  if (!apiKey) {
    throw new Error('No Hunter.io API key configured');
  }

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/account?api_key=${apiKey}`
    );

    const data = await response.json();

    if (data.data) {
      return {
        success: true,
        email: data.data.email,
        plan: data.data.plan_name,
        searches: {
          used: data.data.requests.searches.used,
          available: data.data.requests.searches.available
        },
        verifications: {
          used: data.data.requests.verifications.used,
          available: data.data.requests.verifications.available
        }
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Check credits error:', error);
    throw error;
  }
}
