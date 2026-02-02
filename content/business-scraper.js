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
    // Social Media
    if (host.includes('facebook.com')) return 'facebook';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter';
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('nextdoor.com')) return 'nextdoor';

    // Business Directories
    if (host.includes('yelp.com')) return 'yelp';
    if (host.includes('bbb.org')) return 'bbb';
    if (host.includes('yellowpages.com')) return 'yellowpages';
    if (host.includes('manta.com')) return 'manta';
    if (host.includes('trustpilot.com')) return 'trustpilot';

    // Home Services
    if (host.includes('thumbtack.com')) return 'thumbtack';
    if (host.includes('houzz.com')) return 'houzz';
    if (host.includes('angi.com') || host.includes('angieslist.com')) return 'angi';
    if (host.includes('homeadvisor.com')) return 'homeadvisor';
    if (host.includes('alignable.com')) return 'alignable';

    // Healthcare
    if (host.includes('healthgrades.com')) return 'healthgrades';
    if (host.includes('zocdoc.com')) return 'zocdoc';

    // B2B Data
    if (host.includes('crunchbase.com')) return 'crunchbase';
    if (host.includes('zoominfo.com')) return 'zoominfo';
    if (host.includes('apollo.io')) return 'apollo';

    // Job Sites (for finding businesses)
    if (host.includes('indeed.com')) return 'indeed';
    if (host.includes('ziprecruiter.com')) return 'ziprecruiter';

    // Q&A / Forums
    if (host.includes('reddit.com')) return 'reddit';
    if (host.includes('quora.com')) return 'quora';

    // Maps
    if (host.includes('google.com')) return 'google';

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

      case 'twitter':
        // X/Twitter profiles - check if it's a profile page with potential business info
        const isProfilePage = path.match(/^\/[^\/]+\/?$/) && !path.includes('/status/');
        const hasTwitterContact = document.querySelector('a[href*="tel:"]') ||
                                  document.querySelector('a[href*="mailto:"]') ||
                                  document.querySelector('a[data-testid="UserUrl"]') ||
                                  document.body.innerText.includes('@') && document.body.innerText.includes('.com');
        return isProfilePage && hasTwitterContact;

      case 'bbb':
        return path.includes('/profile/');

      case 'yellowpages':
        return path.includes('/mip/') || (path.match(/\/[^\/]+\/[^\/]+/) && document.querySelector('.business-name'));

      case 'manta':
        return path.includes('/c/') || path.includes('/company/');

      case 'trustpilot':
        return path.includes('/review/');

      case 'angi':
        return path.includes('/companylist/') || path.includes('/reviews/');

      case 'homeadvisor':
        return path.includes('/rated.') || path.includes('/pro/');

      case 'nextdoor':
        return path.includes('/pages/') || path.includes('/business/');

      case 'healthgrades':
        return path.includes('/physician/') || path.includes('/dentist/') || path.includes('/provider/');

      case 'zocdoc':
        return path.includes('/doctor/') || path.includes('/dentist/');

      case 'crunchbase':
        return path.includes('/organization/');

      case 'zoominfo':
        return path.includes('/c/') || path.includes('/company/');

      case 'apollo':
        return path.includes('/companies/') || path.includes('/organization/');

      case 'indeed':
        return path.includes('/cmp/') || path.includes('/companies/');

      case 'ziprecruiter':
        return path.includes('/c/') || path.includes('/company/');

      case 'reddit':
        // Reddit - look for business mentions in posts
        return path.includes('/r/') && (
          document.body.innerText.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) ||
          document.body.innerText.includes('@') && document.body.innerText.includes('.com')
        );

      case 'quora':
        // Quora - similar approach
        return document.body.innerText.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) ||
               (document.body.innerText.includes('@') && document.body.innerText.includes('.com'));

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
   * UNIVERSAL DATA EXTRACTION - Searches entire page for contact info
   * This is used to enrich data from platform-specific extractors
   */
  function universalExtract() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: ''
    };

    const pageText = document.body.innerText || '';
    const pageHtml = document.body.innerHTML || '';

    // ========== NAME EXTRACTION ==========
    // Priority 1: Schema.org data
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of schemaScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const biz = Array.isArray(data) ? data.find(d => d.name) : data;
        if (biz && biz.name) {
          info.name = biz.name;
          if (biz.telephone) info.phone = biz.telephone;
          if (biz.email) info.email = biz.email;
          if (biz.url && !biz.url.includes(window.location.hostname)) info.website = biz.url;
          if (biz.address) {
            info.address = typeof biz.address === 'string' ? biz.address :
              [biz.address.streetAddress, biz.address.addressLocality, biz.address.addressRegion, biz.address.postalCode]
                .filter(Boolean).join(', ');
          }
          break;
        }
      } catch (e) {}
    }

    // Priority 2: H1 headings
    if (!info.name) {
      const h1Elements = document.querySelectorAll('h1');
      for (const h1 of h1Elements) {
        const text = h1.textContent.trim();
        if (text.length > 2 && text.length < 100 && !text.match(/^(home|contact|about|menu|search)/i)) {
          info.name = text.split('|')[0].split('-')[0].split('–')[0].trim();
          break;
        }
      }
    }

    // Priority 3: Title tag
    if (!info.name) {
      const title = document.querySelector('title');
      if (title) {
        info.name = title.textContent.split('|')[0].split('-')[0].split('–')[0].trim();
      }
    }

    // Priority 4: og:site_name or og:title
    if (!info.name) {
      const ogName = document.querySelector('meta[property="og:site_name"]') ||
                     document.querySelector('meta[property="og:title"]');
      if (ogName) {
        info.name = ogName.content.split('|')[0].split('-')[0].trim();
      }
    }

    // ========== PHONE EXTRACTION ==========
    // Priority 1: tel: links
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    if (telLinks.length > 0) {
      for (const link of telLinks) {
        const phone = link.href.replace('tel:', '').replace(/[^\d+()-.\s]/g, '').trim();
        if (phone.replace(/\D/g, '').length >= 10) {
          info.phone = phone;
          break;
        }
      }
    }

    // Priority 2: itemprop="telephone"
    if (!info.phone) {
      const telProp = document.querySelector('[itemprop="telephone"]');
      if (telProp) {
        info.phone = telProp.textContent.trim();
      }
    }

    // Priority 3: Data attributes containing phone
    if (!info.phone) {
      const phoneAttrs = document.querySelectorAll('[data-phone], [data-tel], [data-telephone]');
      for (const el of phoneAttrs) {
        const phone = el.getAttribute('data-phone') || el.getAttribute('data-tel') || el.getAttribute('data-telephone');
        if (phone) {
          info.phone = phone;
          break;
        }
      }
    }

    // Priority 4: Search in page text with multiple patterns
    if (!info.phone) {
      const phonePatterns = [
        /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        /\(\d{3}\)\s*\d{3}[-.]?\d{4}/g,
        /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g,
        /1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g
      ];
      for (const pattern of phonePatterns) {
        const matches = pageText.match(pattern);
        if (matches && matches.length > 0) {
          // Filter out obvious non-phone numbers (like years, zip codes in context)
          for (const match of matches) {
            const digits = match.replace(/\D/g, '');
            if (digits.length >= 10 && digits.length <= 11) {
              info.phone = match;
              break;
            }
          }
          if (info.phone) break;
        }
      }
    }

    // ========== EMAIL EXTRACTION ==========
    // Priority 1: mailto: links
    const mailLinks = document.querySelectorAll('a[href^="mailto:"]');
    if (mailLinks.length > 0) {
      for (const link of mailLinks) {
        const email = link.href.replace('mailto:', '').split('?')[0].trim();
        if (email.includes('@') && !email.includes('example') && !email.includes('noreply') &&
            !email.includes('support@') && !email.includes('info@sentry')) {
          info.email = email;
          break;
        }
      }
    }

    // Priority 2: itemprop="email"
    if (!info.email) {
      const emailProp = document.querySelector('[itemprop="email"]');
      if (emailProp) {
        const email = emailProp.textContent.trim() || emailProp.getAttribute('content');
        if (email && email.includes('@')) {
          info.email = email;
        }
      }
    }

    // Priority 3: Search in page text
    if (!info.email) {
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = pageText.match(emailPattern);
      if (matches) {
        const excludeDomains = ['example.com', 'sentry.io', 'facebook.com', 'twitter.com',
                                'instagram.com', 'linkedin.com', 'google.com', 'youtube.com',
                                'yelp.com', 'bbb.org', 'noreply', 'no-reply'];
        for (const email of matches) {
          const shouldExclude = excludeDomains.some(domain => email.toLowerCase().includes(domain));
          if (!shouldExclude) {
            info.email = email;
            break;
          }
        }
      }
    }

    // ========== WEBSITE EXTRACTION ==========
    // Priority 1: itemprop="url" (not current domain)
    if (!info.website) {
      const urlProp = document.querySelector('[itemprop="url"]');
      if (urlProp) {
        const url = urlProp.href || urlProp.getAttribute('content');
        if (url && !url.includes(window.location.hostname)) {
          info.website = url;
        }
      }
    }

    // Priority 2: Look for external links with "website" text
    if (!info.website) {
      const links = document.querySelectorAll('a[href^="http"]');
      const currentHost = window.location.hostname;
      for (const link of links) {
        const text = link.textContent.toLowerCase();
        const href = link.href;
        if ((text.includes('website') || text.includes('sitio web') || text.includes('visit')) &&
            !href.includes(currentHost)) {
          info.website = href;
          break;
        }
      }
    }

    // Priority 3: Links that look like company domains
    if (!info.website) {
      const links = document.querySelectorAll('a[href^="http"]');
      const currentHost = window.location.hostname;
      const excludeHosts = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
                            'youtube.com', 'google.com', 'yelp.com', 'bbb.org', 'maps.google',
                            'pinterest.com', 'tiktok.com', 'x.com', 'apple.com', 'android.com'];
      for (const link of links) {
        const href = link.href;
        try {
          const url = new URL(href);
          const isExternal = !url.hostname.includes(currentHost) && !currentHost.includes(url.hostname);
          const isExcluded = excludeHosts.some(h => url.hostname.includes(h));
          const textLooksLikeDomain = link.textContent.trim().match(/^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}$/);
          if (isExternal && !isExcluded && textLooksLikeDomain) {
            info.website = href;
            break;
          }
        } catch (e) {}
      }
    }

    // ========== ADDRESS EXTRACTION ==========
    // Priority 1: itemprop="address"
    if (!info.address) {
      const addressProp = document.querySelector('[itemprop="address"]');
      if (addressProp) {
        info.address = addressProp.textContent.replace(/\s+/g, ' ').trim();
      }
    }

    // Priority 2: Address patterns in text
    if (!info.address) {
      const addressPatterns = [
        /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Parkway|Pkwy|Circle|Cir|Place|Pl)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi,
        /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}/gi
      ];
      for (const pattern of addressPatterns) {
        const matches = pageText.match(pattern);
        if (matches && matches.length > 0) {
          info.address = matches[0].trim();
          break;
        }
      }
    }

    // Priority 3: Look for elements with address-related classes
    if (!info.address) {
      const addressSelectors = [
        '.address', '[class*="address"]', '[class*="location"]',
        'address', '[data-address]', '.street-address'
      ];
      for (const sel of addressSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.replace(/\s+/g, ' ').trim();
          if (text.length > 10 && text.length < 200 && text.match(/\d/)) {
            info.address = text;
            break;
          }
        }
      }
    }

    console.log('[Lead Hunter] Universal extraction found:', info);
    return info;
  }

  /**
   * Enrich business info with universal extraction
   * Only fills in missing fields
   */
  function enrichWithUniversal(info) {
    const universal = universalExtract();

    if (!info.name && universal.name) info.name = universal.name;
    if (!info.phone && universal.phone) info.phone = universal.phone;
    if (!info.email && universal.email) info.email = universal.email;
    if (!info.website && universal.website) info.website = universal.website;
    if (!info.address && universal.address) info.address = universal.address;

    return info;
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
   * Always enriches with universal extraction for missing fields
   */
  function extractBusinessInfo() {
    let info;

    switch (platform) {
      case 'facebook':
        info = extractFacebookBusiness();
        break;
      case 'linkedin':
        info = extractLinkedInCompany();
        break;
      case 'yelp':
        info = extractYelpBusiness();
        break;
      case 'google':
        info = extractGoogleBusiness();
        break;
      case 'instagram':
        info = extractInstagramBusiness();
        break;
      case 'twitter':
        info = extractTwitterBusiness();
        break;
      case 'bbb':
        info = extractBBBBusiness();
        break;
      case 'yellowpages':
        info = extractYellowPagesBusiness();
        break;
      case 'manta':
        info = extractMantaBusiness();
        break;
      case 'trustpilot':
        info = extractTrustpilotBusiness();
        break;
      case 'angi':
        info = extractAngiBusiness();
        break;
      case 'homeadvisor':
        info = extractHomeAdvisorBusiness();
        break;
      case 'nextdoor':
        info = extractNextdoorBusiness();
        break;
      case 'healthgrades':
        info = extractHealthgradesBusiness();
        break;
      case 'zocdoc':
        info = extractZocdocBusiness();
        break;
      case 'crunchbase':
        info = extractCrunchbaseBusiness();
        break;
      case 'zoominfo':
        info = extractZoominfoBusiness();
        break;
      case 'apollo':
        info = extractApolloBusiness();
        break;
      case 'indeed':
        info = extractIndeedBusiness();
        break;
      case 'ziprecruiter':
        info = extractZiprecruiterBusiness();
        break;
      case 'reddit':
      case 'quora':
        info = extractForumBusiness();
        break;
      case 'thumbtack':
        info = extractThumbstackBusiness();
        break;
      case 'houzz':
        info = extractHouzzBusiness();
        break;
      case 'alignable':
        info = extractAlignableBusiness();
        break;
      default:
        info = extractGenericBusiness();
        break;
    }

    // ALWAYS enrich with universal extraction to fill missing fields
    info = enrichWithUniversal(info);

    console.log('[Lead Hunter] Final extracted info:', info);
    return info;
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
    const nameSelectors = [
      'h1',
      '[data-pagelet="ProfileActions"] h1',
      'span[dir="auto"] > h1',
      '[role="main"] h1',
      'div[role="main"] span[dir="auto"]',
      '[data-pagelet="page_title"] span'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 1) {
        info.name = el.textContent.trim();
        break;
      }
    }

    const pageText = document.body.innerText;

    // Phone - look for tel: links first (most reliable)
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      info.phone = phoneLink.href.replace('tel:', '').trim();
    } else {
      // Search in page text with multiple patterns
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

    // Email - look for mailto: links first
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) {
      info.email = emailLink.href.replace('mailto:', '').split('?')[0].trim();
    } else {
      // Search in page text
      const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !emailMatch[0].includes('facebook.com') && !emailMatch[0].includes('example')) {
        info.email = emailMatch[0];
      }
    }

    // Website - look for external links (Facebook redirects)
    const websiteLinks = document.querySelectorAll('a[href*="l.facebook.com/l.php"], a[href*="lm.facebook.com"]');
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

    // Also check for direct external links
    if (!info.website) {
      const allLinks = document.querySelectorAll('a[href^="http"]');
      for (const link of allLinks) {
        const href = link.href;
        const text = link.textContent.trim();
        if (href && !href.includes('facebook.com') && !href.includes('google.com') &&
            !href.includes('instagram.com') && !href.includes('twitter.com')) {
          // Check if link text looks like a domain
          if (text.match(/^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}$/)) {
            info.website = text.startsWith('http') ? text : 'https://' + text;
            break;
          }
          // Or if the href itself is a simple domain
          if (href.match(/^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}\/?$/)) {
            info.website = href;
            break;
          }
        }
      }
    }

    // Address - look for location links or text patterns
    const addressLink = document.querySelector('a[href*="maps"], a[href*="place"]');
    if (addressLink) {
      info.address = addressLink.textContent.trim();
    }

    // Try to find address in the sidebar/about section
    if (!info.address) {
      const addressPatterns = [
        /\d+\s+[A-Za-z]+\s+(St|Street|Rd|Road|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pkwy|Parkway)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/i,
        /\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/i
      ];
      for (const pattern of addressPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          info.address = match[0];
          break;
        }
      }
    }

    // Category
    const categorySelectors = [
      'a[href*="/pages/category/"]',
      '[data-pagelet="ProfileTilesFeed"] span',
      'div[role="main"] a[role="link"][tabindex="0"]'
    ];
    for (const sel of categorySelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 2 && el.textContent.trim().length < 50) {
        const text = el.textContent.trim();
        // Skip if it looks like a name or other content
        if (!text.includes('@') && !text.match(/^\d/)) {
          info.category = text;
          break;
        }
      }
    }

    // Description - from About section
    const aboutSection = document.querySelector('[data-pagelet="ProfileTilesFeed"]') ||
                         document.querySelector('div[role="main"] div[class*="about"]');
    if (aboutSection) {
      const descText = aboutSection.textContent.substring(0, 500);
      if (descText.length > 50) {
        info.description = descText.trim();
      }
    }

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

    // Company name - multiple selectors for different LinkedIn layouts
    const nameSelectors = [
      'h1.org-top-card-summary__title',
      'h1[class*="org-top-card"]',
      'h1.ember-view',
      '.org-top-card-summary__title',
      'h1 span[dir="ltr"]',
      'h1'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim() && el.textContent.trim().length > 1) {
        info.name = el.textContent.trim();
        break;
      }
    }

    // Website - multiple selectors
    const websiteSelectors = [
      'a[data-control-name="top_card_website"]',
      'a[href*="company-website"]',
      '.org-top-card-primary-actions a[href^="http"]',
      'a[data-tracking-control-name*="website"]',
      '.org-page-details__definition-text a[href^="http"]'
    ];
    for (const sel of websiteSelectors) {
      const el = document.querySelector(sel);
      if (el && el.href && !el.href.includes('linkedin.com')) {
        info.website = el.href;
        break;
      }
    }

    // Also search for website in page text
    if (!info.website) {
      const links = document.querySelectorAll('a[href^="http"]');
      for (const link of links) {
        const href = link.href;
        if (href && !href.includes('linkedin.com') && !href.includes('google.com') &&
            !href.includes('facebook.com') && !href.includes('twitter.com')) {
          const text = link.textContent.trim();
          if (text.match(/^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}$/)) {
            info.website = href;
            break;
          }
        }
      }
    }

    // Industry/Category
    const industrySelectors = [
      '.org-top-card-summary-info-list__info-item',
      '[class*="org-top-card"] .text-body-small',
      '.org-page-details__definition-text',
      '.org-about-company-module__description'
    ];
    for (const sel of industrySelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        info.category = el.textContent.trim().split('\n')[0].trim();
        break;
      }
    }

    // Description
    const descSelectors = [
      '.org-top-card-summary__tagline',
      'p[class*="org-about"]',
      '.org-about-us-organization-description__text',
      '.break-words'
    ];
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 20) {
        info.description = el.textContent.trim().substring(0, 500);
        break;
      }
    }

    // Company size / employees
    const sizeEl = document.querySelector('.org-about-company-module__company-size-definition-text') ||
                   document.querySelector('[class*="employee"]');
    if (sizeEl) info.employees = sizeEl.textContent.trim();

    // Address/Location
    const locationEl = document.querySelector('.org-top-card-summary-info-list__info-item:nth-child(2)') ||
                       document.querySelector('[class*="headquarters"]');
    if (locationEl) info.address = locationEl.textContent.trim();

    // Phone and Email from page text
    const pageText = document.body.innerText;

    // Phone patterns
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

    // Email
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('linkedin.com') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted LinkedIn company:', info);
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
      description: '',
      address: ''
    };

    // Username/Name - try multiple selectors
    const nameSelectors = [
      'header h2',
      'header h1',
      'section h1',
      'h2._aacl',
      'h1._aacl',
      'span._aacl._aaco._aacu._aacx._aad6._aade'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 1) {
        info.name = el.textContent.trim();
        break;
      }
    }

    // Bio/Description - try multiple selectors
    const bioSelectors = [
      'div[class*="biography"]',
      'span[class*="-webProfileBio"]',
      'header section > div > span',
      '._aacl._aaco._aacu._aacx._aad6._aade'
    ];
    for (const sel of bioSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 10) {
        info.description = el.textContent.trim();
        break;
      }
    }

    // External link in bio
    const linkSelectors = [
      'a[class*="profile-link"]',
      'a[href*="l.instagram.com"]',
      'header a[href^="http"]',
      'div[role="link"] a[href^="http"]'
    ];
    for (const sel of linkSelectors) {
      const el = document.querySelector(sel);
      if (el && el.href && !el.href.includes('instagram.com')) {
        // Extract actual URL from Instagram redirect
        if (el.href.includes('l.instagram.com')) {
          try {
            const url = new URL(el.href);
            const actualUrl = url.searchParams.get('u');
            if (actualUrl) {
              info.website = decodeURIComponent(actualUrl);
              break;
            }
          } catch (e) {}
        } else {
          info.website = el.href;
          break;
        }
      }
    }

    // Get page text for searching
    const pageText = document.body.innerText;

    // Contact button and action buttons
    const contactSelectors = [
      '[data-testid="contact-options"]',
      'div[role="button"]',
      'a[href^="tel:"]',
      'a[href^="mailto:"]'
    ];

    // Phone
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      info.phone = phoneLink.href.replace('tel:', '').trim();
    } else {
      // Search in page text
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

    // Email
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (emailLink) {
      info.email = emailLink.href.replace('mailto:', '').split('?')[0].trim();
    } else {
      const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !emailMatch[0].includes('instagram.com') && !emailMatch[0].includes('example')) {
        info.email = emailMatch[0];
      }
    }

    // Category (from business profile)
    const categoryEl = document.querySelector('div[class*="category"]') ||
                       document.querySelector('a[href*="/explore/locations/"]');
    if (categoryEl) {
      info.category = categoryEl.textContent.trim();
    }

    // Address (from business profile)
    const addressEl = document.querySelector('a[href*="maps"]') ||
                      document.querySelector('div[class*="address"]');
    if (addressEl) {
      info.address = addressEl.textContent.trim();
    }

    console.log('[Lead Hunter] Extracted Instagram business:', info);
    return info;
  }

  /**
   * Extract from X/Twitter Profile
   */
  function extractTwitterBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      description: ''
    };

    // Name - display name and username
    const nameSelectors = [
      '[data-testid="UserName"] span:first-child',
      'h1[role="heading"] span',
      'div[data-testid="UserName"] div span',
      'h2[role="heading"] span'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 1) {
        info.name = el.textContent.trim();
        break;
      }
    }

    // Bio/Description
    const bioSelectors = [
      '[data-testid="UserDescription"]',
      'div[data-testid="UserDescription"] span',
      '[data-testid="UserBio"]'
    ];
    for (const sel of bioSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 5) {
        info.description = el.textContent.trim();
        break;
      }
    }

    // Website from profile
    const websiteSelectors = [
      'a[data-testid="UserUrl"]',
      'a[href*="t.co"]',
      '[data-testid="UserProfileHeader_Items"] a[href^="http"]'
    ];
    for (const sel of websiteSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        // Twitter uses t.co redirects, try to get the display text
        const displayText = el.textContent.trim();
        if (displayText && displayText.includes('.') && !displayText.includes('twitter') && !displayText.includes('x.com')) {
          info.website = displayText.startsWith('http') ? displayText : 'https://' + displayText;
          break;
        } else if (el.href && !el.href.includes('twitter.com') && !el.href.includes('x.com')) {
          info.website = el.href;
          break;
        }
      }
    }

    // Location
    const locationEl = document.querySelector('[data-testid="UserLocation"]') ||
                       document.querySelector('[data-testid="UserProfileHeader_Items"] span[data-testid="UserLocation"]');
    if (locationEl) {
      info.address = locationEl.textContent.trim();
    }

    // Get page text for searching phone/email
    const pageText = document.body.innerText;

    // Phone patterns
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

    // Email
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('twitter.com') && !emailMatch[0].includes('x.com') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    // Category from bio (heuristic)
    if (info.description) {
      const categoryKeywords = ['plumber', 'electrician', 'contractor', 'lawyer', 'attorney', 'dentist',
                                'doctor', 'realtor', 'agent', 'consultant', 'designer', 'developer',
                                'photographer', 'owner', 'ceo', 'founder', 'manager'];
      const descLower = info.description.toLowerCase();
      for (const keyword of categoryKeywords) {
        if (descLower.includes(keyword)) {
          info.category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          break;
        }
      }
    }

    console.log('[Lead Hunter] Extracted Twitter/X business:', info);
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
   * Extract from BBB Business Profile
   */
  function extractBBBBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      rating: '',
      accredited: false
    };

    // Business name
    const nameSelectors = [
      '.bds-h2.text-size-5',
      'h1.bds-h1',
      '.dtm-business-name',
      'h1',
      '[class*="business-name"]'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 1) {
        info.name = el.textContent.trim();
        break;
      }
    }

    // Phone - BBB usually has phone in contact section
    const phoneLink = document.querySelector('a[href^="tel:"]');
    if (phoneLink) {
      info.phone = phoneLink.href.replace('tel:', '').trim();
    } else {
      const pageText = document.body.innerText;
      const phonePatterns = [
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

    // Website
    const websiteSelectors = [
      'a[href*="bbbclick"][data-link-type="website"]',
      '.dtm-url a',
      'a.website-link',
      'a[data-tracking*="website"]'
    ];
    for (const sel of websiteSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        // BBB uses redirect links, try to get the display URL
        const displayUrl = el.textContent.trim();
        if (displayUrl && displayUrl.includes('.')) {
          info.website = displayUrl.startsWith('http') ? displayUrl : 'https://' + displayUrl;
        } else if (el.href) {
          info.website = el.href;
        }
        break;
      }
    }

    // Address
    const addressSelectors = [
      '.dtm-address',
      'address',
      '.bds-body.text-size-5[class*="address"]',
      '[class*="address-line"]'
    ];
    const addressParts = [];
    for (const sel of addressSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        info.address = el.textContent.replace(/\s+/g, ' ').trim();
        break;
      }
    }

    // If no address from selectors, search in page text
    if (!info.address) {
      const pageText = document.body.innerText;
      const addressMatch = pageText.match(/\d+\s+[A-Za-z]+\s+(St|Street|Rd|Road|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/i);
      if (addressMatch) {
        info.address = addressMatch[0];
      }
    }

    // Category/Business Type
    const categorySelectors = [
      '.dtm-category a',
      '.business-categories a',
      '[class*="category"] a',
      'dd[class*="category"]'
    ];
    for (const sel of categorySelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        info.category = el.textContent.trim();
        break;
      }
    }

    // Rating
    const ratingEl = document.querySelector('.dtm-rating') ||
                     document.querySelector('[class*="letter-grade"]') ||
                     document.querySelector('.bds-rating');
    if (ratingEl) {
      info.rating = ratingEl.textContent.trim();
    }

    // Accreditation status
    const accreditedEl = document.querySelector('.dtm-accredited') ||
                         document.body.innerText.match(/BBB Accredited/i);
    info.accredited = !!accreditedEl;

    // Email from page text
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('bbb.org') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted BBB business:', info);
    return info;
  }

  /**
   * Extract from YellowPages Business Profile
   */
  function extractYellowPagesBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: ''
    };

    // Business name
    const nameEl = document.querySelector('.business-name h1') ||
                   document.querySelector('h1.dockable-business-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a.phone') ||
                    document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('.phone');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Website
    const websiteEl = document.querySelector('a.website-link') ||
                      document.querySelector('a[class*="website"]') ||
                      document.querySelector('a[data-analytics*="website"]');
    if (websiteEl) info.website = websiteEl.href;

    // Address
    const addressEl = document.querySelector('.address') ||
                      document.querySelector('.street-address') ||
                      document.querySelector('address');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Category
    const categoryEl = document.querySelector('.categories a') ||
                       document.querySelector('.business-categories');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    // Email from page
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('yellowpages') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted YellowPages business:', info);
    return info;
  }

  /**
   * Extract from Manta Business Profile
   */
  function extractMantaBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      employees: '',
      revenue: ''
    };

    // Business name
    const nameEl = document.querySelector('h1[itemprop="name"]') ||
                   document.querySelector('.company-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('[itemprop="telephone"]');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Website
    const websiteEl = document.querySelector('a[itemprop="url"]') ||
                      document.querySelector('a.website');
    if (websiteEl && !websiteEl.href.includes('manta.com')) {
      info.website = websiteEl.href;
    }

    // Address
    const addressEl = document.querySelector('[itemprop="address"]') ||
                      document.querySelector('.address');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Category
    const categoryEl = document.querySelector('[itemprop="industry"]') ||
                       document.querySelector('.industry');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    // Company size
    const employeesEl = document.querySelector('[itemprop="numberOfEmployees"]');
    if (employeesEl) info.employees = employeesEl.textContent.trim();

    // Email
    const emailEl = document.querySelector('a[href^="mailto:"]');
    if (emailEl) {
      info.email = emailEl.href.replace('mailto:', '').split('?')[0];
    }

    console.log('[Lead Hunter] Extracted Manta business:', info);
    return info;
  }

  /**
   * Extract from Trustpilot Business Profile
   */
  function extractTrustpilotBusiness() {
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
    const nameEl = document.querySelector('h1[data-business-unit-name]') ||
                   document.querySelector('span[data-business-unit-name]') ||
                   document.querySelector('h1');
    if (nameEl) {
      info.name = nameEl.getAttribute('data-business-unit-name') || nameEl.textContent.trim();
    }

    // Website - Trustpilot shows the website domain
    const websiteEl = document.querySelector('a[data-business-unit-website]') ||
                      document.querySelector('.business-unit-profile-summary a[href^="http"]');
    if (websiteEl) {
      const domain = websiteEl.getAttribute('data-business-unit-website') ||
                     websiteEl.textContent.trim();
      if (domain && !domain.includes('trustpilot')) {
        info.website = domain.startsWith('http') ? domain : 'https://' + domain;
      }
    }

    // Rating
    const ratingEl = document.querySelector('[data-rating-typography]') ||
                     document.querySelector('.star-rating');
    if (ratingEl) {
      info.rating = ratingEl.textContent.trim() || ratingEl.getAttribute('data-rating');
    }

    // Review count
    const reviewEl = document.querySelector('[data-reviews-count-typography]');
    if (reviewEl) {
      const match = reviewEl.textContent.match(/[\d,]+/);
      if (match) info.reviewCount = match[0].replace(',', '');
    }

    // Category
    const categoryEl = document.querySelector('.business-unit-categories a') ||
                       document.querySelector('[data-business-unit-categories]');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    // Address from page text
    const pageText = document.body.innerText;
    const addressMatch = pageText.match(/\d+\s+[A-Za-z]+\s+(St|Street|Rd|Road|Ave|Avenue)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/i);
    if (addressMatch) {
      info.address = addressMatch[0];
    }

    // Phone
    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    // Email
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('trustpilot') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Trustpilot business:', info);
    return info;
  }

  /**
   * Extract from Angi (formerly Angie's List) Business Profile
   */
  function extractAngiBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      rating: ''
    };

    // Business name
    const nameEl = document.querySelector('h1[data-testid="business-name"]') ||
                   document.querySelector('.business-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('[data-testid="phone-number"]');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Website
    const websiteEl = document.querySelector('a[data-testid="website-link"]') ||
                      document.querySelector('a.website-link');
    if (websiteEl && !websiteEl.href.includes('angi.com')) {
      info.website = websiteEl.href;
    }

    // Address
    const addressEl = document.querySelector('[data-testid="address"]') ||
                      document.querySelector('.service-area');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Category
    const categoryEl = document.querySelector('[data-testid="category"]') ||
                       document.querySelector('.business-category');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    // Rating
    const ratingEl = document.querySelector('[data-testid="rating"]') ||
                     document.querySelector('.rating-value');
    if (ratingEl) info.rating = ratingEl.textContent.trim();

    // Email from page
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('angi') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Angi business:', info);
    return info;
  }

  /**
   * Extract from HomeAdvisor Business Profile
   */
  function extractHomeAdvisorBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      rating: ''
    };

    // Business name
    const nameEl = document.querySelector('.pro-name') ||
                   document.querySelector('h1[itemprop="name"]') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('[itemprop="telephone"]');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Website
    const websiteEl = document.querySelector('a[itemprop="url"]') ||
                      document.querySelector('.website-link');
    if (websiteEl && !websiteEl.href.includes('homeadvisor.com')) {
      info.website = websiteEl.href;
    }

    // Address
    const addressEl = document.querySelector('[itemprop="address"]') ||
                      document.querySelector('.service-area');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Category
    const categoryEl = document.querySelector('.pro-category') ||
                       document.querySelector('[itemprop="category"]');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    // Rating
    const ratingEl = document.querySelector('[itemprop="ratingValue"]') ||
                     document.querySelector('.rating');
    if (ratingEl) info.rating = ratingEl.textContent.trim();

    console.log('[Lead Hunter] Extracted HomeAdvisor business:', info);
    return info;
  }

  /**
   * Extract from Nextdoor Business Page
   */
  function extractNextdoorBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: ''
    };

    // Business name
    const nameEl = document.querySelector('h1[data-testid="business-name"]') ||
                   document.querySelector('.business-profile-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]');
    if (phoneEl) info.phone = phoneEl.href.replace('tel:', '');

    // Website
    const websiteEl = document.querySelector('a[data-testid="business-website"]');
    if (websiteEl && !websiteEl.href.includes('nextdoor.com')) {
      info.website = websiteEl.href;
    }

    // Address
    const addressEl = document.querySelector('[data-testid="business-address"]') ||
                      document.querySelector('.business-address');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Category
    const categoryEl = document.querySelector('[data-testid="business-category"]');
    if (categoryEl) info.category = categoryEl.textContent.trim();

    // Email from page
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('nextdoor') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Nextdoor business:', info);
    return info;
  }

  /**
   * Extract from Healthgrades Provider Profile
   */
  function extractHealthgradesBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      specialty: '',
      rating: ''
    };

    // Provider/Practice name
    const nameEl = document.querySelector('h1[itemprop="name"]') ||
                   document.querySelector('.provider-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('[itemprop="telephone"]');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Website
    const websiteEl = document.querySelector('a[data-testid="website-link"]') ||
                      document.querySelector('a.website');
    if (websiteEl && !websiteEl.href.includes('healthgrades.com')) {
      info.website = websiteEl.href;
    }

    // Address
    const addressEl = document.querySelector('[itemprop="address"]') ||
                      document.querySelector('.location-address');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Specialty
    const specialtyEl = document.querySelector('[itemprop="medicalSpecialty"]') ||
                        document.querySelector('.provider-specialty');
    if (specialtyEl) {
      info.specialty = specialtyEl.textContent.trim();
      info.category = info.specialty;
    }

    // Rating
    const ratingEl = document.querySelector('[itemprop="ratingValue"]') ||
                     document.querySelector('.patient-satisfaction-score');
    if (ratingEl) info.rating = ratingEl.textContent.trim();

    // Email from page
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('healthgrades') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Healthgrades business:', info);
    return info;
  }

  /**
   * Extract from Zocdoc Provider Profile
   */
  function extractZocdocBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      specialty: '',
      rating: '',
      insurance: ''
    };

    // Provider name
    const nameEl = document.querySelector('h1[data-test="doctor-profile-name"]') ||
                   document.querySelector('.profile-header h1') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]');
    if (phoneEl) info.phone = phoneEl.href.replace('tel:', '');

    // Address
    const addressEl = document.querySelector('[data-test="location-address"]') ||
                      document.querySelector('.location-info');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Specialty
    const specialtyEl = document.querySelector('[data-test="specialty"]') ||
                        document.querySelector('.specialty-list');
    if (specialtyEl) {
      info.specialty = specialtyEl.textContent.trim();
      info.category = info.specialty;
    }

    // Rating
    const ratingEl = document.querySelector('[data-test="rating"]') ||
                     document.querySelector('.rating-score');
    if (ratingEl) info.rating = ratingEl.textContent.trim();

    // Insurance accepted
    const insuranceEl = document.querySelector('[data-test="insurance-list"]');
    if (insuranceEl) info.insurance = insuranceEl.textContent.trim();

    console.log('[Lead Hunter] Extracted Zocdoc business:', info);
    return info;
  }

  /**
   * Extract from Crunchbase Organization Profile
   */
  function extractCrunchbaseBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      description: '',
      founded: '',
      employees: '',
      funding: ''
    };

    // Company name
    const nameEl = document.querySelector('h1[class*="profile-name"]') ||
                   document.querySelector('.entity-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Website
    const websiteEl = document.querySelector('a[class*="website-link"]') ||
                      document.querySelector('a[data-cb-route="website"]');
    if (websiteEl && !websiteEl.href.includes('crunchbase.com')) {
      info.website = websiteEl.href;
    }

    // Description
    const descEl = document.querySelector('[class*="description"]') ||
                   document.querySelector('.short-description');
    if (descEl) info.description = descEl.textContent.trim().substring(0, 500);

    // Location/Address
    const locationEl = document.querySelector('[class*="location-info"]') ||
                       document.querySelector('[data-cb-route="headquarters"]');
    if (locationEl) info.address = locationEl.textContent.trim();

    // Industry/Category
    const industryEl = document.querySelector('[class*="industries"]') ||
                       document.querySelector('[data-cb-route="industries"]');
    if (industryEl) info.category = industryEl.textContent.trim();

    // Founded date
    const foundedEl = document.querySelector('[data-cb-route="founded-date"]');
    if (foundedEl) info.founded = foundedEl.textContent.trim();

    // Employee count
    const employeesEl = document.querySelector('[class*="employee"]') ||
                        document.querySelector('[data-cb-route="number-of-employees"]');
    if (employeesEl) info.employees = employeesEl.textContent.trim();

    // Total funding
    const fundingEl = document.querySelector('[class*="total-funding"]');
    if (fundingEl) info.funding = fundingEl.textContent.trim();

    // Phone and email from page text
    const pageText = document.body.innerText;
    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('crunchbase') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Crunchbase business:', info);
    return info;
  }

  /**
   * Extract from ZoomInfo Company Profile
   */
  function extractZoominfoBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      employees: '',
      revenue: ''
    };

    // Company name
    const nameEl = document.querySelector('h1[class*="company-name"]') ||
                   document.querySelector('.company-header h1') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Website
    const websiteEl = document.querySelector('a[class*="website"]') ||
                      document.querySelector('a[data-testid="company-website"]');
    if (websiteEl && !websiteEl.href.includes('zoominfo.com')) {
      info.website = websiteEl.href;
    }

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]') ||
                    document.querySelector('[class*="phone-number"]');
    if (phoneEl) {
      info.phone = phoneEl.href ? phoneEl.href.replace('tel:', '') : phoneEl.textContent.trim();
    }

    // Address
    const addressEl = document.querySelector('[class*="headquarters"]') ||
                      document.querySelector('.company-location');
    if (addressEl) info.address = addressEl.textContent.replace(/\s+/g, ' ').trim();

    // Industry
    const industryEl = document.querySelector('[class*="industry"]');
    if (industryEl) info.category = industryEl.textContent.trim();

    // Employees
    const employeesEl = document.querySelector('[class*="employee-count"]');
    if (employeesEl) info.employees = employeesEl.textContent.trim();

    // Revenue
    const revenueEl = document.querySelector('[class*="revenue"]');
    if (revenueEl) info.revenue = revenueEl.textContent.trim();

    // Email from page
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('zoominfo') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted ZoomInfo business:', info);
    return info;
  }

  /**
   * Extract from Apollo.io Company Profile
   */
  function extractApolloBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      employees: ''
    };

    // Company name
    const nameEl = document.querySelector('h1[class*="company"]') ||
                   document.querySelector('.organization-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Website
    const websiteEl = document.querySelector('a[class*="website"]') ||
                      document.querySelector('a[href^="http"]:not([href*="apollo.io"])');
    if (websiteEl && !websiteEl.href.includes('apollo.io')) {
      info.website = websiteEl.href;
    }

    // Phone
    const phoneEl = document.querySelector('a[href^="tel:"]');
    if (phoneEl) info.phone = phoneEl.href.replace('tel:', '');

    // Location
    const locationEl = document.querySelector('[class*="location"]') ||
                       document.querySelector('.headquarters');
    if (locationEl) info.address = locationEl.textContent.trim();

    // Industry
    const industryEl = document.querySelector('[class*="industry"]');
    if (industryEl) info.category = industryEl.textContent.trim();

    // Employees
    const employeesEl = document.querySelector('[class*="employee"]');
    if (employeesEl) info.employees = employeesEl.textContent.trim();

    // Email
    const pageText = document.body.innerText;
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('apollo.io') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Apollo business:', info);
    return info;
  }

  /**
   * Extract from Indeed Company Profile
   */
  function extractIndeedBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      employees: '',
      rating: ''
    };

    // Company name
    const nameEl = document.querySelector('h1[data-testid="company-name"]') ||
                   document.querySelector('.cmp-CompanyHeader-name') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Website
    const websiteEl = document.querySelector('a[data-testid="company-website"]') ||
                      document.querySelector('a.cmp-AboutSection-websiteLink');
    if (websiteEl && !websiteEl.href.includes('indeed.com')) {
      info.website = websiteEl.href;
    }

    // Location/Address
    const locationEl = document.querySelector('[data-testid="company-location"]') ||
                       document.querySelector('.cmp-CompanyHeader-location');
    if (locationEl) info.address = locationEl.textContent.trim();

    // Industry
    const industryEl = document.querySelector('[data-testid="company-industry"]') ||
                       document.querySelector('.cmp-AboutSection-industry');
    if (industryEl) info.category = industryEl.textContent.trim();

    // Company size
    const sizeEl = document.querySelector('[data-testid="company-size"]') ||
                   document.querySelector('.cmp-AboutSection-size');
    if (sizeEl) info.employees = sizeEl.textContent.trim();

    // Rating
    const ratingEl = document.querySelector('[data-testid="company-rating"]') ||
                     document.querySelector('.cmp-CompanyHeader-rating');
    if (ratingEl) info.rating = ratingEl.textContent.trim();

    // Phone and email from page
    const pageText = document.body.innerText;
    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('indeed') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted Indeed business:', info);
    return info;
  }

  /**
   * Extract from ZipRecruiter Company Profile
   */
  function extractZiprecruiterBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      employees: ''
    };

    // Company name
    const nameEl = document.querySelector('h1[class*="company-name"]') ||
                   document.querySelector('.company-header h1') ||
                   document.querySelector('h1');
    if (nameEl) info.name = nameEl.textContent.trim();

    // Website
    const websiteEl = document.querySelector('a[class*="website"]');
    if (websiteEl && !websiteEl.href.includes('ziprecruiter.com')) {
      info.website = websiteEl.href;
    }

    // Location
    const locationEl = document.querySelector('[class*="location"]') ||
                       document.querySelector('.company-location');
    if (locationEl) info.address = locationEl.textContent.trim();

    // Industry
    const industryEl = document.querySelector('[class*="industry"]');
    if (industryEl) info.category = industryEl.textContent.trim();

    // Size
    const sizeEl = document.querySelector('[class*="company-size"]');
    if (sizeEl) info.employees = sizeEl.textContent.trim();

    // Phone and email from page
    const pageText = document.body.innerText;
    const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes('ziprecruiter') && !emailMatch[0].includes('example')) {
      info.email = emailMatch[0];
    }

    console.log('[Lead Hunter] Extracted ZipRecruiter business:', info);
    return info;
  }

  /**
   * Extract business info from forum posts (Reddit, Quora)
   */
  function extractForumBusiness() {
    const info = {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      category: '',
      source: platform
    };

    const pageText = document.body.innerText;

    // Phone patterns
    const phonePatterns = [
      /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\(\d{3}\)\s*\d{3}[-.]?\d{4}/g,
      /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g
    ];

    for (const pattern of phonePatterns) {
      const matches = pageText.match(pattern);
      if (matches && matches.length > 0) {
        info.phone = matches[0];
        break;
      }
    }

    // Email
    const emailMatches = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
      for (const email of emailMatches) {
        if (!email.includes('reddit') && !email.includes('quora') &&
            !email.includes('example') && !email.includes('noreply')) {
          info.email = email;
          break;
        }
      }
    }

    // Website - look for URLs in text
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})(?:\/\S*)?/g;
    const urlMatches = pageText.match(urlPattern);
    if (urlMatches) {
      for (const url of urlMatches) {
        if (!url.includes('reddit.com') && !url.includes('quora.com') &&
            !url.includes('google.com') && !url.includes('imgur.com') &&
            !url.includes('redd.it') && !url.includes('qph.')) {
          info.website = url.startsWith('http') ? url : 'https://' + url;
          // Try to extract business name from domain
          try {
            const domain = new URL(info.website).hostname.replace('www.', '');
            info.name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
          } catch (e) {}
          break;
        }
      }
    }

    // Try to get name from title or heading
    if (!info.name) {
      const titleEl = document.querySelector('h1') || document.querySelector('title');
      if (titleEl) {
        const title = titleEl.textContent.trim();
        // Extract business names mentioned in title (heuristic)
        const businessPatterns = [
          /(?:recommend|review|about|hired|called|contact)\s+([A-Z][a-zA-Z\s&']+(?:LLC|Inc|Corp|Co|Services?)?)/i,
          /([A-Z][a-zA-Z\s&']+(?:Plumbing|Electric|HVAC|Roofing|Landscaping|Cleaning|Services?))/i
        ];
        for (const pattern of businessPatterns) {
          const match = title.match(pattern);
          if (match) {
            info.name = match[1].trim();
            break;
          }
        }
      }
    }

    console.log('[Lead Hunter] Extracted forum business info:', info);
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

    // Comprehensive industry keywords with all variations
    const industryKeywords = {
      // Home Services - Plumbing
      plumbing: ['plumb', 'plumber', 'plumbers', 'plomero', 'plomeria', 'drain', 'drains', 'drainage',
                 'pipe', 'pipes', 'piping', 'faucet', 'faucets', 'water heater', 'sewer', 'septic',
                 'toilet', 'bathroom', 'sink', 'leak', 'clog', 'unclog', 'rooter', 'tuberia'],

      // Home Services - HVAC
      hvac: ['hvac', 'heating', 'heater', 'cooling', 'air condition', 'ac ', 'a/c', 'furnace',
             'clima', 'climatizacion', 'ac repair', 'heat pump', 'ductwork', 'ventilation',
             'thermostat', 'refriger', 'calefaccion', 'aire acondicionado', 'mini split', 'central air'],

      // Home Services - Electrical
      electrical: ['electric', 'electri', 'electrician', 'electricians', 'electricista', 'wiring',
                   'outlet', 'outlets', 'panel', 'panels', 'circuit', 'breaker', 'lighting', 'voltage',
                   'rewire', 'generator', 'instalacion electrica', 'luz', 'power'],

      // Home Services - General Contractors
      contractors: ['contractor', 'contractors', 'contracting', 'construction', 'construct', 'builder',
                    'remodel', 'remodeling', 'renovation', 'renovations', 'building', 'contratista',
                    'general contractor', 'home improvement', 'handyman', 'remodelacion', 'obras'],

      // Home Services - Roofing
      roofing: ['roof', 'roofs', 'roofer', 'roofers', 'roofing', 'shingle', 'shingles', 'gutter',
                'gutters', 'techo', 'techos', 'tejado', 'siding', 'flashing', 'leak', 'slate', 'tile roof'],

      // Home Services - Landscaping
      landscaping: ['landscape', 'landscaper', 'landscapers', 'landscaping', 'lawn', 'lawns', 'lawncare',
                    'garden', 'gardener', 'gardening', 'yard', 'yards', 'tree', 'trees', 'jardin',
                    'jardinero', 'jardineria', 'mowing', 'trimming', 'poda', 'cesped', 'irrigation', 'sprinkler'],

      // Home Services - Cleaning
      cleaning: ['clean', 'cleaner', 'cleaners', 'cleaning', 'maid', 'maids', 'janitorial', 'janitor',
                 'limpieza', 'housekeep', 'sanitiz', 'disinfect', 'carpet clean', 'window clean',
                 'pressure wash', 'power wash', 'servicio de limpieza'],

      // Home Services - Pest Control
      pest: ['pest', 'pests', 'exterminator', 'extermination', 'termite', 'termites', 'bug', 'bugs',
             'rodent', 'rodents', 'plaga', 'plagas', 'fumiga', 'insect', 'ant ', 'ants', 'roach',
             'cockroach', 'mouse', 'mice', 'rat ', 'rats', 'bedbug', 'mosquito', 'control de plagas'],

      // Home Services - Painting
      painting: ['paint', 'painter', 'painters', 'painting', 'pintura', 'pintor', 'pintores',
                 'interior paint', 'exterior paint', 'house paint', 'residential paint', 'commercial paint',
                 'stain', 'staining', 'coating', 'drywall', 'wallpaper'],

      // Home Services - Locksmith
      locksmith: ['locksmith', 'locksmiths', 'lock', 'locks', 'key', 'keys', 'cerrajero', 'cerrajeria',
                  'deadbolt', 'rekey', 'lockout', 'security', 'safe', 'door lock', 'llaves'],

      // Healthcare - Dental
      dental: ['dental', 'dentist', 'dentists', 'dentistry', 'orthodont', 'ortho', 'dentista',
               'odontolog', 'teeth', 'tooth', 'oral', 'braces', 'implant', 'crown', 'cavity',
               'endodont', 'periodont', 'denture', 'veneer', 'whitening', 'clinica dental'],

      // Healthcare - Medical
      medical: ['medical', 'medicine', 'clinic', 'clinics', 'doctor', 'doctors', 'physician', 'physicians',
                'health', 'healthcare', 'clinica', 'medico', 'medicina', 'hospital', 'practice', 'primary care',
                'urgent care', 'family medicine', 'internal medicine', 'pediatr', 'consultorio'],

      // Healthcare - Chiropractic
      chiropractic: ['chiropractic', 'chiropractor', 'chiropractors', 'spine', 'spinal', 'quiropractico',
                     'quiropractic', 'adjustment', 'back pain', 'neck pain', 'wellness', 'alignment'],

      // Healthcare - Veterinary
      veterinary: ['vet', 'vets', 'veterinary', 'veterinarian', 'veterinarians', 'animal', 'animals',
                   'pet', 'pets', 'veterinario', 'veterinaria', 'dog', 'cat', 'clinic animal', 'animal hospital',
                   'grooming', 'boarding', 'mascota', 'perro', 'gato'],

      // Healthcare - Optometry
      optometry: ['optometry', 'optometrist', 'optometrists', 'eye', 'eyes', 'vision', 'optical', 'optic',
                  'optometrista', 'glasses', 'contacts', 'lens', 'lenses', 'eyewear', 'ophthalmolog',
                  'oculista', 'lentes', 'anteojos', 'gafas'],

      // Healthcare - Med Spa
      medspa: ['medspa', 'med spa', 'medi spa', 'botox', 'aesthetic', 'aesthetics', 'laser', 'skin',
               'skincare', 'cosmetic', 'beauty clinic', 'anti-aging', 'filler', 'injection', 'rejuvenation',
               'spa medico', 'estetica medica', 'dermatolog'],

      // Professional - Legal
      legal: ['law', 'laws', 'lawyer', 'lawyers', 'attorney', 'attorneys', 'legal', 'abogado', 'abogados',
              'bufete', 'law firm', 'law office', 'litigation', 'injury', 'accident', 'divorce', 'criminal',
              'defense', 'immigration', 'estate', 'despacho juridico', 'licenciado'],

      // Professional - Accounting
      accounting: ['account', 'accountant', 'accountants', 'accounting', 'cpa', 'tax', 'taxes', 'taxation',
                   'bookkeep', 'bookkeeper', 'contador', 'contabilidad', 'contadores', 'fiscal', 'audit',
                   'payroll', 'financial statement', 'impuestos', 'declaracion'],

      // Professional - Insurance
      insurance: ['insurance', 'insurer', 'insurers', 'insuring', 'seguro', 'seguros', 'poliza', 'aseguradora',
                  'coverage', 'policy', 'policies', 'agent', 'broker', 'life insurance', 'auto insurance',
                  'home insurance', 'health insurance', 'agente de seguros'],

      // Professional - Real Estate
      realestate: ['real estate', 'realestate', 'realtor', 'realtors', 'realty', 'property', 'properties',
                   'inmobiliaria', 'bienes raices', 'broker', 'agent', 'home sale', 'house sale', 'listing',
                   'buyer', 'seller', 'mortgage', 'corredor', 'agente inmobiliario', 'venta de casas'],

      // Professional - Mortgage
      mortgage: ['mortgage', 'mortgages', 'loan', 'loans', 'lending', 'lender', 'hipoteca', 'hipotecario',
                 'refinance', 'refinancing', 'home loan', 'credit', 'prestamo', 'financiamiento'],

      // Professional - Financial
      financial: ['financial', 'finance', 'advisor', 'advisors', 'wealth', 'investment', 'investments',
                  'finanzas', 'financiero', 'asesor', 'planning', 'retirement', 'portfolio', 'stock',
                  'mutual fund', 'asset', 'capital', 'inversiones'],

      // Automotive - Repair
      automotive: ['auto', 'autos', 'automobile', 'car', 'cars', 'mechanic', 'mechanics', 'mechanical',
                   'repair', 'repairs', 'garage', 'taller', 'mecanico', 'automotriz', 'vehicle', 'motor',
                   'engine', 'brake', 'transmission', 'oil change', 'tune up', 'diagnostico'],

      // Automotive - Towing
      towing: ['towing', 'tow', 'tows', 'roadside', 'grua', 'gruas', 'remolque', 'emergency', 'breakdown',
               'jump start', 'flat tire', 'lockout', 'winch', 'recovery', 'auxilio vial'],

      // Automotive - Body Shop
      autobody: ['auto body', 'autobody', 'body shop', 'bodyshop', 'collision', 'collisions', 'carroceria',
                 'dent', 'dents', 'scratch', 'paint job', 'refinish', 'bumper', 'fender', 'hojalateria',
                 'pintura automotriz'],

      // Automotive - Car Wash
      carwash: ['car wash', 'carwash', 'detailing', 'detail', 'lavado', 'lavado de autos', 'auto spa',
                'wax', 'waxing', 'polish', 'polishing', 'interior clean', 'exterior wash', 'hand wash'],

      // Creative - Photography
      photography: ['photo', 'photos', 'photography', 'photographer', 'photographers', 'fotografia',
                    'fotografo', 'portrait', 'wedding photo', 'event photo', 'studio', 'headshot',
                    'session', 'picture', 'imagen', 'retrato', 'foto estudio'],

      // Personal Services - Salon
      salon: ['salon', 'salons', 'spa', 'spas', 'beauty', 'hair', 'hairstyl', 'nail', 'nails', 'estetica',
              'peluqueria', 'barbershop', 'barber', 'stylist', 'manicure', 'pedicure', 'facial',
              'massage', 'wax', 'corte', 'cabello', 'belleza'],

      // Personal Services - Fitness
      fitness: ['fitness', 'gym', 'gyms', 'personal train', 'trainer', 'trainers', 'workout', 'workouts',
                'gimnasio', 'exercise', 'crossfit', 'yoga', 'pilates', 'boot camp', 'weight', 'cardio',
                'entrenador', 'entrenamiento', 'health club'],

      // Food Services - Restaurant
      restaurant: ['restaurant', 'restaurants', 'restaurante', 'food', 'foods', 'dining', 'dine', 'cafe',
                   'cafeteria', 'catering', 'bistro', 'grill', 'bar', 'pub', 'eatery', 'kitchen',
                   'comida', 'cocina', 'chef', 'menu'],

      // Moving & Storage
      moving: ['moving', 'mover', 'movers', 'move', 'relocation', 'relocate', 'mudanza', 'mudanzas',
               'hauling', 'transport', 'packing', 'pack', 'load', 'unload', 'truck', 'van', 'fletes'],

      storage: ['storage', 'storages', 'self storage', 'self-storage', 'almacen', 'almacenamiento',
                'warehouse', 'unit', 'mini storage', 'climate control', 'bodega', 'guardamuebles']
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
   * Wait for page to be fully loaded and stable
   */
  async function waitForPageLoad() {
    // Initial wait
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Wait for any lazy-loaded content
    let lastHeight = document.body.scrollHeight;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentHeight = document.body.scrollHeight;
      if (currentHeight === lastHeight) break;
      lastHeight = currentHeight;
      attempts++;
    }

    // Extra wait for AJAX content
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Main scraping function with retry logic
   */
  async function scrapeIfBusinessPage() {
    // Don't scrape the same URL twice
    if (window.location.href === lastScrapedUrl) return;

    // Check if scanning is enabled
    const storage = await chrome.storage.local.get(['settings']);
    const settings = storage.settings || {};
    if (settings.scanning === false) return;

    console.log('[Lead Hunter] Starting extraction for:', window.location.href);

    // Wait for page to load properly
    await waitForPageLoad();

    // Check if it's a directory page with multiple listings
    if (isDirectoryPage()) {
      console.log('[Lead Hunter] Directory page detected, extracting listings...');
      const listings = extractListings();

      if (listings.length > 0) {
        let savedCount = 0;

        for (const business of listings) {
          // Enrich each listing with universal extraction
          const enrichedBusiness = enrichWithUniversal(business);
          const { matches, industry } = await matchesSelectedIndustries(enrichedBusiness);
          if (matches && enrichedBusiness.name) {
            await sendToBackground({
              ...enrichedBusiness,
              url: enrichedBusiness.url || window.location.href
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

    // Try to extract data - with retry if needed
    let businessInfo = extractBusinessInfo();
    let retryCount = 0;
    const maxRetries = 2;

    // If we got very little data, retry after waiting more
    while (retryCount < maxRetries) {
      const hasEnoughData = (businessInfo.name || businessInfo.phone || businessInfo.email);
      const hasMultipleFields = [businessInfo.name, businessInfo.phone, businessInfo.email, businessInfo.website]
        .filter(Boolean).length >= 2;

      if (hasEnoughData && hasMultipleFields) break;

      console.log(`[Lead Hunter] Incomplete data, retrying (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      businessInfo = extractBusinessInfo();
      retryCount++;
    }

    // Log what we found
    console.log('[Lead Hunter] Extracted data:', {
      name: businessInfo.name || '(not found)',
      phone: businessInfo.phone || '(not found)',
      email: businessInfo.email || '(not found)',
      website: businessInfo.website || '(not found)',
      address: businessInfo.address || '(not found)'
    });

    // Validate we have useful info (at least one field)
    if (!businessInfo.name && !businessInfo.phone && !businessInfo.email) {
      console.log('[Lead Hunter] No useful business info found after retries');
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
    // Small delay to ensure page is ready
    setTimeout(scrapeIfBusinessPage, 500);
  }

  // Also run on URL changes (SPA navigation)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      lastScrapedUrl = ''; // Reset to allow scraping new page
      setTimeout(scrapeIfBusinessPage, 1500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
