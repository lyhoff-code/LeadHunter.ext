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
 * Extract domain from profile URL or company name
 * @param {object} lead - Lead data
 * @returns {string|null} - Domain or null
 */
export function extractDomain(lead) {
  // Try to extract from website if available
  if (lead.website) {
    try {
      const url = new URL(lead.website);
      return url.hostname.replace('www.', '');
    } catch {
      // Not a valid URL
    }
  }

  // Try to extract from company name (basic heuristic)
  if (lead.company) {
    const cleaned = lead.company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    return `${cleaned}.com`; // Guess - not reliable
  }

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
