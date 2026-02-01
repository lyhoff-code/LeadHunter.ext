// Lead Hunter AI - Business Page Scraper
// Extracts contact info from business pages and directories

(function() {
  'use strict';

  // Avoid duplicate initialization
  if (window.leadHunterBusinessScraper) return;
  window.leadHunterBusinessScraper = true;

  const platform = detectPlatform();
  let lastScrapedUrl = '';

  /**
   * Detect which platform we're on
   */
  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('facebook.com')) return 'facebook';
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('yelp.com')) return 'yelp';
    if (host.includes('google.com')) return 'google';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('thumbtack.com')) return 'thumbtack';
    if (host.includes('houzz.com')) return 'houzz';
    if (host.includes('alignable.com')) return 'alignable';
    return 'website';
  }

  /**
   * Check if current page is a business page
   */
  function isBusinessPage() {
    const url = window.location.href;
    const path = window.location.pathname;

    switch (platform) {
      case 'facebook':
        // Facebook business pages have specific patterns
        // Also check for contact info visible on page (sidebar)
        const hasContactInfo = document.body.innerText.includes('Contact info') ||
                               document.body.innerText.includes('Información de contacto') ||
                               document.querySelector('a[href*="tel:"]') ||
                               document.querySelector('a[href^="mailto:"]');

        const hasBusinessIndicators = (
          document.querySelector('[data-pagelet="ProfileActions"]') ||
          document.querySelector('[aria-label="Page"]') ||
          document.querySelector('div[role="main"] a[href*="/about"]') ||
          (path.match(/^\/[^\/]+\/?$/) && document.querySelector('a[href*="/reviews"]')) ||
          // Also detect if we're on a business page that shows contact info in sidebar
          (hasContactInfo && (
            document.querySelector('h1') ||
            document.querySelector('[role="main"]')
          ))
        );

        return (
          !path.includes('/groups/') &&
          !path.includes('/profile.php?id=1') && // Skip personal profiles (usually numeric IDs)
          !path.includes('/friends') &&
          !path.includes('/messages') &&
          hasBusinessIndicators
        );

      case 'linkedin':
        // LinkedIn company pages
        return path.includes('/company/') || path.includes('/school/');

      case 'yelp':
        // Yelp business pages
        return path.includes('/biz/');

      case 'google':
        // Google Maps business listings
        return url.includes('/maps/place/') || url.includes('maps/search');

      case 'instagram':
        // Instagram business profiles (harder to detect)
        return path.match(/^\/[^\/]+\/?$/) &&
               (document.querySelector('a[href*="tel:"]') ||
                document.querySelector('a[href*="mailto:"]') ||
                document.querySelector('[data-testid="contact-options"]'));

      case 'thumbtack':
        return path.includes('/pro/') || path.includes('/profile/');

      case 'houzz':
        return path.includes('/professionals/') || path.includes('/pro/');

      case 'alignable':
        return path.includes('/biz/');

      default:
        // Generic website - check for business indicators
        return hasBusinessIndicators();
    }
  }

  /**
   * Check for business indicators on generic websites
   */
  function hasBusinessIndicators() {
    // Check for schema.org LocalBusiness or Organization
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of schemaScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] && (
          data['@type'].includes('Business') ||
          data['@type'].includes('Organization') ||
          data['@type'].includes('LocalBusiness') ||
          data['@type'].includes('Service') ||
          data['@type'] === 'Plumber' ||
          data['@type'] === 'Electrician' ||
          data['@type'] === 'HVAC' ||
          data['@type'] === 'Dentist' ||
          data['@type'] === 'Attorney'
        )) {
          return true;
        }
      } catch (e) {}
    }

    // Check for contact page indicators
    const hasContactInfo = (
      document.querySelector('a[href^="tel:"]') ||
      document.querySelector('a[href^="mailto:"]') ||
      document.body.innerHTML.match(/\(\d{3}\)\s*\d{3}[-.]?\d{4}/) ||
      document.body.innerHTML.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)
    );

    return hasContactInfo;
  }

  /**
   * Extract business information based on platform
   */
  function extractBusinessInfo() {
    switch (platform) {
      case 'facebook':
        return extractFacebookBusiness();
      case 'linkedin':
        return extractLinkedInCompany();
      case 'yelp':
        return extractYelpBusiness();
      case 'google':
        return extractGoogleBusiness();
      case 'instagram':
        return extractInstagramBusiness();
      case 'thumbtack':
        return extractThumbstackBusiness();
      case 'houzz':
        return extractHouzzBusiness();
      case 'alignable':
        return extractAlignableBusiness();
      default:
        return extractGenericBusiness();
    }
  }

  /**
   * Extract from Facebook Business Page
   */
  function extractFacebookBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      description: ''
    };

    // Business name - try multiple selectors
    const nameEl = document.querySelector('h1') ||
                   document.querySelector('[data-pagelet="ProfileActions"] h1') ||
                   document.querySelector('span[dir="auto"] > h1') ||
                   document.querySelector('[role="main"] h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Look in the About section or page info
    const pageText = document.body.innerText;

    // Phone - look for tel: links first (most reliable)
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      info.phone = phoneLink.href.replace('tel:', '').trim();
    } else {
      // Fallback to regex patterns
      // Look for international format first (+1 419-296-2751)
      const phoneMatch = pageText.match(/[+]1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) ||
                         pageText.match(/\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}/) ||
                         pageText.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) info.phone = phoneMatch[0];
    }

    // Email - look for mailto: links first (most reliable)
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) {
      info.email = emailLink.href.replace('mailto:', '').split('?')[0].trim();
    } else {
      // Fallback to regex
      const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !emailMatch[0].includes('facebook.com') && !emailMatch[0].includes('example')) {
        info.email = emailMatch[0];
      }
    }

    // Website - look for external links
    const websiteLinks = document.querySelectorAll('a[href*="l.facebook.com/l.php"]');
    for (const link of websiteLinks) {
      try {
        const url = new URL(link.href);
        const externalUrl = url.searchParams.get('u');
        if (externalUrl && !externalUrl.includes('facebook.com')) {
          info.website = decodeURIComponent(externalUrl);
          break;
        }
      } catch (e) {}
    }

    // Also look for direct links with .com/.net/.org that aren't Facebook
    if (!info.website) {
      const allLinks = document.querySelectorAll('a[href*=".com"], a[href*=".net"], a[href*=".org"]');
      for (const link of allLinks) {
        const href = link.href;
        if (href && !href.includes('facebook.com') && !href.includes('google.com') &&
            !href.includes('instagram.com') && link.textContent.includes('.')) {
          // Check if link text looks like a domain
          const text = link.textContent.trim();
          if (text.match(/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}$/)) {
            info.website = text.startsWith('http') ? text : 'https://' + text;
            break;
          }
        }
      }
    }

    // Address - look for location links or text
    const addressLink = document.querySelector('a[href*="maps"], a[href*="place"]');
    if (addressLink) {
      info.address = addressLink.textContent.trim();
    } else {
      // Look for address patterns in text
      const addressMatch = pageText.match(/\d+\s+[A-Za-z]+\s+(St|Street|Rd|Road|Ave|Avenue|Blvd|Dr|Drive|Ln|Lane|Way|Ct|Court)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/i);
      if (addressMatch) info.address = addressMatch[0];
    }

    // Category
    const categoryEl = document.querySelector('a[href*="/pages/category/"]') ||
                       document.querySelector('[data-pagelet="ProfileTilesFeed"] span');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    console.log('[Lead Hunter] Extracted Facebook business:', info);
    return info;
  }

  /**
   * Extract from LinkedIn Company Page
   */
  function extractLinkedInCompany() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      description: '',
      employees: ''
    };

    // Company name
    const nameEl = document.querySelector('h1.org-top-card-summary__title') ||
                   document.querySelector('h1[class*="org-top-card"]') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Website
    const websiteEl = document.querySelector('a[data-control-name="top_card_website"]') ||
                      document.querySelector('a[href*="company-website"]') ||
                      document.querySelector('.org-top-card-primary-actions a[href^="http"]');
    if (websiteEl) info.website = websiteEl.href;

    // Industry/Category
    const industryEl = document.querySelector('.org-top-card-summary-info-list__info-item') ||
                       document.querySelector('[class*="org-top-card"] .text-body-small');
    if (industryEl) info.category = industryEl.textContent.trim();

    // Description
    const descEl = document.querySelector('.org-top-card-summary__tagline') ||
                   document.querySelector('p[class*="org-about"]');
    if (descEl) info.description = descEl.textContent.trim();

    // Company size
    const sizeEl = document.querySelector('.org-about-company-module__company-size-definition-text');
    if (sizeEl) info.employees = sizeEl.textContent.trim();

    // Look for contact info in the page
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    return info;
  }

  /**
   * Extract from Yelp Business Page
   */
  function extractYelpBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      rating: '',
      reviewCount: ''
    };

    // Business name
    const nameEl = document.querySelector('h1[class*="heading"]') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('p[class*="phone"]');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Website
    const websiteEl = document.querySelector('a[href*="/biz_redir"]') ||
                      document.querySelector('a[class*="website"]');
    if (websiteEl) info.website = websiteEl.href;

    // Address
    const addressEl = document.querySelector('address') ||
                      document.querySelector('p[class*="address"]');
    if (addressEl) info.address = addressEl.textContent.trim();

    // Category
    const categoryLinks = document.querySelectorAll('a[href*="/search?find_desc="]');
    if (categoryLinks.length > 0) {
      info.category = Array.from(categoryLinks).map(a => a.textContent.trim()).join(', ');
    }

    // Rating
    const ratingEl = document.querySelector('[aria-label*="star rating"]') ||
                     document.querySelector('[class*="rating"]');
    if (ratingEl) info.rating = ratingEl.getAttribute('aria-label') || ratingEl.textContent.trim();

    return info;
  }

  /**
   * Extract from Google Maps/Business
   */
  function extractGoogleBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      rating: '',
      reviewCount: ''
    };

    // Business name - try multiple selectors
    const nameSelectors = [
      'h1.DUwDvf',
      'h1[class*="header"]',
      'h1.fontHeadlineLarge',
      'div[role="main"] h1',
      '[data-header-feature-id="title"]',
      'h1'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        info.name = el.textContent.trim();
        break;
      }
    }

    // Phone - try multiple approaches
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      info.phone = phoneLink.href.replace('tel:', '').trim();
    } else {
      // Try button with phone data
      const phoneButton = document.querySelector('button[data-item-id*="phone"]') ||
                          document.querySelector('button[aria-label*="Phone"]') ||
                          document.querySelector('button[aria-label*="phone"]') ||
                          document.querySelector('[data-tooltip="Copy phone number"]');
      if (phoneButton) {
        const label = phoneButton.getAttribute('aria-label') || phoneButton.textContent;
        const phoneMatch = label.match(/[\d\s()+-]+/);
        if (phoneMatch) info.phone = phoneMatch[0].trim();
      }
    }

    // If still no phone, search in page text
    if (!info.phone) {
      const pageText = document.body.innerText;
      const phonePatterns = [
        /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
        /\(\d{3}\)\s*\d{3}[-.]?\d{4}/,
        /\d{3}[-.\s]\d{3}[-.\s]\d{4}/
      ];
      for (const pattern of phonePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          info.phone = match[0];
          break;
        }
      }
    }

    // Website - try multiple selectors
    const websiteSelectors = [
      'a[data-item-id="authority"]',
      'a[aria-label*="Website"]',
      'a[aria-label*="website"]',
      'a[data-tooltip="Open website"]',
      'a.CsEnBe[href^="http"]'
    ];
    for (const sel of websiteSelectors) {
      const el = document.querySelector(sel);
      if (el && el.href && !el.href.includes('google.com')) {
        info.website = el.href;
        break;
      }
    }

    // Also check for website in text buttons
    if (!info.website) {
      const buttons = document.querySelectorAll('button[aria-label], a[aria-label]');
      for (const btn of buttons) {
        const label = btn.getAttribute('aria-label') || '';
        if (label.toLowerCase().includes('website') || label.toLowerCase().includes('sitio web')) {
          // The website might be in the button's text or a sibling
          const text = btn.textContent.trim();
          if (text.includes('.com') || text.includes('.net') || text.includes('.org')) {
            info.website = text.startsWith('http') ? text : 'https://' + text;
            break;
          }
        }
      }
    }

    // Address
    const addressSelectors = [
      'button[data-item-id="address"]',
      'button[aria-label*="Address"]',
      'button[aria-label*="address"]',
      '[data-tooltip="Copy address"]'
    ];
    for (const sel of addressSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        info.address = el.getAttribute('aria-label')?.replace('Address:', '').trim() ||
                       el.textContent.trim();
        break;
      }
    }

    // Category
    const categorySelectors = [
      'button[jsaction*="category"]',
      '.DkEaL',
      'span.DkEaL',
      '[class*="category"]'
    ];
    for (const sel of categorySelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        info.category = el.textContent.trim();
        break;
      }
    }

    // Rating and reviews
    const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]') ||
                     document.querySelector('span.ceNzKf[role="img"]');
    if (ratingEl) {
      info.rating = ratingEl.textContent.trim() || ratingEl.getAttribute('aria-label');
    }

    const reviewEl = document.querySelector('span[aria-label*="reviews"]') ||
                     document.querySelector('span.F7nice span:last-child');
    if (reviewEl) {
      const reviewMatch = reviewEl.textContent.match(/[\d,]+/);
      if (reviewMatch) info.reviewCount = reviewMatch[0].replace(',', '');
    }

    // Email - check page text
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('google.com') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Google business:', info);
    return info;
  }

  /**
   * Extract from Instagram Business Profile
   */
  function extractInstagramBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      category: '',
      description: ''
    };

    // Username/Name
    const nameEl = document.querySelector('h2') || document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Bio/Description
    const bioEl = document.querySelector('div[class*="biography"]') ||
                  document.querySelector('span[class*="-webProfileBio"]');
    if (bioEl) info.description = bioEl.textContent.trim();

    // External link
    const linkEl = document.querySelector('a[class*="profile-link"]') ||
                   document.querySelector('a[href*="l.instagram.com"]');
    if (linkEl) info.website = linkEl.href;

    // Contact button info
    const contactBtn = document.querySelector('[data-testid="contact-options"]');
    if (contactBtn) {
      const pageText = contactBtn.parentElement?.innerText || '';
      const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) info.email = emailMatch[0];
      const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) info.phone = phoneMatch[0];
    }

    return info;
  }

  /**
   * Extract from Thumbtack Pro Profile
   */
  function extractThumbstackBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      category: '',
      description: ''
    };

    const nameEl = document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    const pageText = document.body.innerText;
    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    return info;
  }

  /**
   * Extract from Houzz Pro Profile
   */
  function extractHouzzBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: ''
    };

    const nameEl = document.querySelector('h1[class*="pro-title"]') || document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    const phoneEl = document.querySelector('a[href^="tel:"]');
    if (phoneEl) info.phone = phoneEl.href.replace('tel:', '');

    const websiteEl = document.querySelector('a[class*="website"]');
    if (websiteEl) info.website = websiteEl.href;

    return info;
  }

  /**
   * Extract from Alignable Business Profile
   */
  function extractAlignableBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      category: ''
    };

    const nameEl = document.querySelector('h1') || document.querySelector('.business-name');
    if (nameEl) info.name = nameEl.textContent.trim();

    const pageText = document.body.innerText;
    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    const websiteEl = document.querySelector('a[class*="website"]');
    if (websiteEl) info.website = websiteEl.href;

    return info;
  }

  /**
   * Extract from generic business website
   */
  function extractGenericBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: window.location.origin,
      address: '',
      category: '',
      description: ''
    };

    // Try schema.org first
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of schemaScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const biz = Array.isArray(data) ? data.find(d => d['@type']) : data;
        if (biz) {
          info.name = biz.name || info.name;
          info.email = biz.email || info.email;
          info.phone = biz.telephone || info.phone;
          info.address = typeof biz.address === 'string' ? biz.address :
                        (biz.address?.streetAddress || '') + ' ' + (biz.address?.addressLocality || '');
          info.category = biz['@type'] || info.category;
          info.description = biz.description || info.description;
        }
      } catch (e) {}
    }

    // Fallback to page content
    if (!info.name) {
      const titleEl = document.querySelector('h1') || document.querySelector('title');
      if (titleEl) info.name = titleEl.textContent.trim().split('|')[0].split('-')[0].trim();
    }

    // Phone
    if (!info.phone) {
      const phoneEl = document.querySelector('a[href^="tel:"]');
      if (phoneEl) {
        info.phone = phoneEl.href.replace('tel:', '').replace(/[^\d+]/g, '');
      } else {
        const phoneMatch = document.body.innerText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) info.phone = phoneMatch[0];
      }
    }

    // Email
    if (!info.email) {
      const emailEl = document.querySelector('a[href^="mailto:"]');
      if (emailEl) {
        info.email = emailEl.href.replace('mailto:', '').split('?')[0];
      } else {
        const emailMatch = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !emailMatch[0].includes('example') && !emailMatch[0].includes('sentry')) {
          info.email = emailMatch[0];
        }
      }
    }

    // Meta description
    if (!info.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) info.description = metaDesc.content;
    }

    return info;
  }

  /**
   * Check if business matches selected industries
   */
  async function matchesSelectedIndustries(businessInfo) {
    const storage = await chrome.storage.local.get(['settings']);
    const settings = storage.settings || {};
    const selectedIndustries = settings.industries || [];

    if (selectedIndustries.length === 0) {
      // If no industries selected, accept all businesses
      return { matches: true, industry: businessInfo.category || 'Unknown' };
    }

    const textToCheck = [
      businessInfo.name,
      businessInfo.category,
      businessInfo.description,
      window.location.href
    ].join(' ').toLowerCase();

    const industryKeywords = {
      plumbing: ['plumb', 'plumber', 'plomero', 'drain', 'pipe', 'faucet', 'water heater'],
      hvac: ['hvac', 'heating', 'cooling', 'air condition', 'furnace', 'clima', 'ac repair', 'heat pump'],
      electrical: ['electric', 'electrician', 'wiring', 'outlet', 'panel', 'electricista'],
      contractors: ['contractor', 'construction', 'remodel', 'renovation', 'building', 'contratista'],
      roofing: ['roof', 'roofing', 'shingle', 'gutter', 'techo', 'tejado'],
      landscaping: ['landscape', 'landscaping', 'lawn', 'garden', 'yard', 'tree', 'jardin'],
      cleaning: ['clean', 'cleaning', 'maid', 'janitorial', 'limpieza'],
      pest: ['pest', 'exterminator', 'termite', 'bug', 'rodent', 'plaga'],
      painting: ['paint', 'painter', 'painting', 'pintura', 'pintor'],
      locksmith: ['locksmith', 'lock', 'key', 'cerrajero'],
      dental: ['dental', 'dentist', 'dentistry', 'orthodont', 'dentista'],
      medical: ['medical', 'clinic', 'doctor', 'physician', 'health', 'clinica', 'medico'],
      chiropractic: ['chiropractic', 'chiropractor', 'spine', 'quiropractico'],
      veterinary: ['vet', 'veterinary', 'veterinarian', 'animal', 'pet', 'veterinario'],
      optometry: ['optometry', 'optometrist', 'eye', 'vision', 'optical', 'optometrista'],
      medspa: ['medspa', 'med spa', 'botox', 'aesthetic', 'laser', 'skin'],
      legal: ['law', 'lawyer', 'attorney', 'legal', 'abogado', 'bufete'],
      accounting: ['account', 'cpa', 'tax', 'bookkeep', 'contador', 'contabilidad'],
      insurance: ['insurance', 'insurer', 'seguro', 'poliza'],
      realestate: ['real estate', 'realtor', 'realty', 'property', 'inmobiliaria', 'bienes raices'],
      mortgage: ['mortgage', 'loan', 'lending', 'hipoteca'],
      financial: ['financial', 'advisor', 'wealth', 'investment', 'finanzas'],
      automotive: ['auto', 'car', 'mechanic', 'repair', 'garage', 'taller', 'mecanico'],
      towing: ['towing', 'tow', 'roadside', 'grua'],
      autobody: ['auto body', 'body shop', 'collision', 'carroceria'],
      carwash: ['car wash', 'carwash', 'detailing', 'lavado'],
      photography: ['photo', 'photography', 'photographer', 'fotografia', 'fotografo'],
      salon: ['salon', 'spa', 'beauty', 'hair', 'nail', 'estetica'],
      fitness: ['fitness', 'gym', 'personal train', 'workout', 'gimnasio'],
      restaurant: ['restaurant', 'food', 'dining', 'cafe', 'restaurante'],
      moving: ['moving', 'mover', 'relocation', 'mudanza'],
      storage: ['storage', 'self storage', 'almacen']
    };

    for (const industry of selectedIndustries) {
      const keywords = industryKeywords[industry] || [industry];
      for (const keyword of keywords) {
        if (textToCheck.includes(keyword)) {
          return { matches: true, industry };
        }
      }
    }

    return { matches: false, industry: null };
  }

  /**
   * Send business info to background script
   */
  async function sendToBackground(businessInfo, industry) {
    const data = {
      type: 'BUSINESS_SCRAPED',
      data: {
        ...businessInfo,
        platform,
        url: window.location.href,
        scrapedAt: new Date().toISOString(),
        leadType: 'scraped',
        industry
      }
    };

    try {
      await chrome.runtime.sendMessage(data);
      console.log('[Lead Hunter] Business info sent:', businessInfo.name);
      showNotification(businessInfo.name);
    } catch (error) {
      console.error('[Lead Hunter] Error sending business info:', error);
    }
  }

  /**
   * Show visual notification on page
   */
  function showNotification(businessName) {
    const notification = document.createElement('div');
    notification.className = 'lead-hunter-scraped-notification';
    notification.innerHTML = `
      <div class="lead-hunter-notification-content">
        <span class="lead-hunter-icon">🏢</span>
        <span class="lead-hunter-text">Business captured: <strong>${businessName}</strong></span>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .lead-hunter-scraped-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        max-width: 350px;
      }
      .lead-hunter-notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .lead-hunter-icon {
        font-size: 20px;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Check if current page is a directory/listing page with multiple businesses
   */
  function isDirectoryPage() {
    const url = window.location.href;
    const path = window.location.pathname;

    switch (platform) {
      case 'yelp':
        return path.includes('/search') || path.match(/^\/[^\/]+\/[^\/]+$/);
      case 'google':
        return url.includes('/maps/search') || url.includes('tbm=lcl');
      case 'thumbtack':
        return path.includes('/search') || path.includes('/k/');
      case 'houzz':
        return path.includes('/professionals/');
      default:
        return false;
    }
  }

  /**
   * Extract multiple businesses from Yelp search results
   */
  function extractYelpListings() {
    const businesses = [];
    const listings = document.querySelectorAll('[data-testid="serp-ia-card"], .container__09f24__mpR8_');

    listings.forEach(listing => {
      const info = {
        name: '',
        phone: '',
        website: '',
        address: '',
        category: '',
        rating: '',
        url: ''
      };

      const nameEl = listing.querySelector('a[class*="businessName"], h3 a, a[href*="/biz/"]');
      if (nameEl) {
        info.name = nameEl.textContent.trim();
        info.url = nameEl.href;
      }

      const phoneEl = listing.querySelector('a[href^="tel:"]');
      if (phoneEl) info.phone = phoneEl.href.replace('tel:', '');

      const addressEl = listing.querySelector('[class*="secondaryAttributes"] span, address');
      if (addressEl) info.address = addressEl.textContent.trim();

      const categoryEls = listing.querySelectorAll('a[href*="/search?find_desc="]');
      if (categoryEls.length > 0) {
        info.category = Array.from(categoryEls).map(a => a.textContent.trim()).join(', ');
      }

      if (info.name) businesses.push(info);
    });

    return businesses;
  }

  /**
   * Extract multiple businesses from Google Maps search
   */
  function extractGoogleListings() {
    const businesses = [];
    // Multiple selectors for different Google Maps layouts
    const listings = document.querySelectorAll('div[role="feed"] > div, div.Nv2PK, a.hfpxzc, div[jsaction*="mouseover:pane"]');

    console.log('[Lead Hunter] Found', listings.length, 'potential listings');

    listings.forEach(listing => {
      const info = {
        name: '',
        phone: '',
        website: '',
        address: '',
        category: '',
        rating: '',
        url: ''
      };

      // Name - multiple selectors
      const nameEl = listing.querySelector('.qBF1Pd') ||
                     listing.querySelector('.fontHeadlineSmall') ||
                     listing.querySelector('div.NrDZNb') ||
                     listing.querySelector('.OSrXXb') ||
                     listing.getAttribute('aria-label');

      if (nameEl) {
        info.name = typeof nameEl === 'string' ? nameEl : nameEl.textContent.trim();
      }

      // URL to business page
      const linkEl = listing.querySelector('a[href*="maps/place"]') ||
                     listing.querySelector('a.hfpxzc') ||
                     (listing.tagName === 'A' ? listing : null);
      if (linkEl) info.url = linkEl.href;

      // Get all text content to search for info
      const listingText = listing.innerText || '';

      // Phone - search in listing text
      const phonePatterns = [
        /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
        /\(\d{3}\)\s*\d{3}[-.]?\d{4}/,
        /\d{3}[-.\s]\d{3}[-.\s]\d{4}/
      ];
      for (const pattern of phonePatterns) {
        const match = listingText.match(pattern);
        if (match) {
          info.phone = match[0];
          break;
        }
      }

      // Address - look for text patterns
      const addressEl = listing.querySelector('.W4Efsd') ||
                        listing.querySelector('[class*="address"]');
      if (addressEl) {
        // Get address from spans within
        const spans = addressEl.querySelectorAll('span');
        for (const span of spans) {
          const text = span.textContent.trim();
          // Address usually has numbers and street indicators
          if (text.match(/\d+.*(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Ct)/i) ||
              text.match(/^\d+\s+\w+/)) {
            info.address = text;
            break;
          }
        }
      }

      // Category - usually first span in info section
      const categoryEl = listing.querySelector('.W4Efsd span:first-child') ||
                         listing.querySelector('.DkEaL') ||
                         listing.querySelector('[class*="category"]');
      if (categoryEl) {
        const catText = categoryEl.textContent.trim();
        // Category usually doesn't have numbers and is short
        if (catText.length < 50 && !catText.match(/\d{3}/)) {
          info.category = catText;
        }
      }

      // Rating
      const ratingEl = listing.querySelector('span.MW4etd') ||
                       listing.querySelector('[role="img"][aria-label*="stars"]');
      if (ratingEl) {
        info.rating = ratingEl.textContent.trim() ||
                      ratingEl.getAttribute('aria-label')?.match(/[\d.]+/)?.[0];
      }

      // Only add if we have a name
      if (info.name && info.name.length > 1) {
        businesses.push(info);
        console.log('[Lead Hunter] Extracted listing:', info.name);
      }
    });

    return businesses;
  }

  /**
   * Extract multiple businesses from Thumbtack search
   */
  function extractThumbstackListings() {
    const businesses = [];
    const listings = document.querySelectorAll('[data-testid="pro-card"], .ProCard');

    listings.forEach(listing => {
      const info = {
        name: '',
        phone: '',
        website: '',
        category: '',
        url: ''
      };

      const nameEl = listing.querySelector('h2, .pro-name');
      if (nameEl) info.name = nameEl.textContent.trim();

      const linkEl = listing.querySelector('a[href*="/pro/"], a[href*="/profile/"]');
      if (linkEl) info.url = linkEl.href;

      if (info.name) businesses.push(info);
    });

    return businesses;
  }

  /**
   * Extract listings based on platform
   */
  function extractListings() {
    switch (platform) {
      case 'yelp':
        return extractYelpListings();
      case 'google':
        return extractGoogleListings();
      case 'thumbtack':
        return extractThumbstackListings();
      default:
        return [];
    }
  }

  /**
   * Show notification for multiple businesses
   */
  function showMultiNotification(count) {
    const notification = document.createElement('div');
    notification.className = 'lead-hunter-scraped-notification';
    notification.innerHTML = `
      <div class="lead-hunter-notification-content">
        <span class="lead-hunter-icon">🏢</span>
        <span class="lead-hunter-text"><strong>${count}</strong> businesses captured from this page</span>
      </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Main scraping function
   */
  async function scrapeIfBusinessPage() {
    // Don't scrape the same URL twice
    if (window.location.href === lastScrapedUrl) return;

    // Check if scanning is enabled
    const storage = await chrome.storage.local.get(['settings']);
    const settings = storage.settings || {};
    if (settings.scanning === false) return;

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if it's a directory page with multiple listings
    if (isDirectoryPage()) {
      console.log('[Lead Hunter] Directory page detected, extracting listings...');
      const listings = extractListings();

      if (listings.length > 0) {
        let savedCount = 0;

        for (const business of listings) {
          const { matches, industry } = await matchesSelectedIndustries(business);
          if (matches && business.name) {
            await sendToBackground({
              ...business,
              url: business.url || window.location.href
            }, industry);
            savedCount++;
            // Small delay between sends to avoid overwhelming
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        if (savedCount > 0) {
          showMultiNotification(savedCount);
          lastScrapedUrl = window.location.href;
        }

        console.log(`[Lead Hunter] Saved ${savedCount}/${listings.length} businesses from directory`);
      }
      return;
    }

    // Single business page
    if (!isBusinessPage()) {
      console.log('[Lead Hunter] Not a business page');
      return;
    }

    const businessInfo = extractBusinessInfo();

    // Validate we have useful info
    if (!businessInfo.name && !businessInfo.phone && !businessInfo.email) {
      console.log('[Lead Hunter] No useful business info found');
      return;
    }

    // Check if matches selected industries
    const { matches, industry } = await matchesSelectedIndustries(businessInfo);
    if (!matches) {
      console.log('[Lead Hunter] Business does not match selected industries');
      return;
    }

    lastScrapedUrl = window.location.href;
    await sendToBackground(businessInfo, industry);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrapeIfBusinessPage);
  } else {
    scrapeIfBusinessPage();
  }

  // Also run on URL changes (SPA navigation)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      lastScrapedUrl = ''; // Reset to allow scraping new page
      setTimeout(scrapeIfBusinessPage, 2000);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
