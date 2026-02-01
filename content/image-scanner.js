// Lead Hunter AI - Image Scanner Content Script
// Detects and analyzes images in social media posts for contact information

(function() {
  'use strict';

  // Track processed images to avoid duplicates
  const processedImages = new Set();
  const pendingImages = new Map();

  // Rate limiting
  let lastAnalysisTime = 0;
  const MIN_INTERVAL_MS = 2000; // Minimum 2 seconds between analyses
  const MAX_QUEUE_SIZE = 10;

  // Settings
  let settings = {
    scanning: true,
    geminiKey: '',
    industries: [],
    imageScanning: true
  };

  // Platform-specific image selectors
  const PLATFORM_SELECTORS = {
    facebook: {
      images: [
        // Feed images
        'div[data-pagelet*="Feed"] img[src*="fbcdn"]',
        'div[role="article"] img[src*="fbcdn"]',
        'div[data-pagelet*="GroupFeed"] img',
        '.userContentWrapper img',
        'a[rel="theater"] img',
        // Photo viewer / Theater mode images (when you click on a photo)
        'div[data-pagelet="MediaViewerPhoto"] img',
        'img[data-visualcompletion="media-vc-image"]',
        'div[role="dialog"] img[src*="fbcdn"]',
        'div[aria-label*="Photo"] img',
        '[data-pagelet="ProfilePhotoViewer"] img',
        // General large images
        'img[src*="fbcdn"][style*="max-width"]',
        'img[src*="scontent"]'
      ],
      container: 'div[role="article"], div[data-pagelet*="Feed"] > div, div[role="dialog"]'
    },
    linkedin: {
      images: [
        '.feed-shared-image img',
        '.feed-shared-article__preview-image',
        '.update-components-image img',
        '.feed-shared-update-v2 img'
      ],
      container: '.feed-shared-update-v2, .occludable-update'
    },
    twitter: {
      images: [
        'article img[src*="pbs.twimg.com/media"]',
        'div[data-testid="tweetPhoto"] img'
      ],
      container: 'article[data-testid="tweet"]'
    },
    nextdoor: {
      images: [
        '.post-content img',
        '.media-attachment img',
        'article img'
      ],
      container: 'article, .post-container'
    },
    instagram: {
      images: [
        'article img[src*="cdninstagram"]',
        'div[role="presentation"] img'
      ],
      container: 'article'
    }
  };

  /**
   * Detect current platform
   */
  function detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('facebook.com')) return 'facebook';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('nextdoor.com')) return 'nextdoor';
    if (hostname.includes('instagram.com')) return 'instagram';
    return 'generic';
  }

  /**
   * Get image selectors for current platform
   */
  function getImageSelectors() {
    const platform = detectPlatform();
    return PLATFORM_SELECTORS[platform]?.images || ['img'];
  }

  /**
   * Check if we're in a photo viewer/lightbox
   */
  function isInPhotoViewer() {
    return (
      window.location.href.includes('/photo') ||
      document.querySelector('div[role="dialog"] img[src*="fbcdn"]') ||
      document.querySelector('[data-pagelet="MediaViewerPhoto"]') ||
      document.querySelector('div[aria-label*="Photo viewer"]')
    );
  }

  /**
   * Check if image should be analyzed
   */
  function shouldAnalyzeImage(img) {
    // Skip if already processed
    const src = img.src || img.dataset.src;
    if (!src || processedImages.has(src)) return false;

    // If we're in photo viewer, be more permissive
    const inPhotoViewer = isInPhotoViewer();

    // Skip small images (likely icons/avatars)
    const width = img.naturalWidth || img.width || parseInt(img.style.width) || 0;
    const height = img.naturalHeight || img.height || parseInt(img.style.height) || 0;

    // In photo viewer, don't require size check (image might be loading)
    const minSize = inPhotoViewer ? 100 : 150;
    if (width > 0 && height > 0 && (width < minSize || height < minSize)) return false;

    // Skip profile pictures and avatars (but not in photo viewer)
    const skipPatterns = [
      /emoji/i,
      /icon.*\d+/i,
      /badge/i,
      /button/i,
      /static.*images/i,
      /rsrc\.php/i,  // Facebook static resources
      /sprite/i
    ];

    // Only skip profile/avatar patterns if NOT in photo viewer
    if (!inPhotoViewer) {
      skipPatterns.push(/profile/i);
      skipPatterns.push(/avatar/i);
    }

    for (const pattern of skipPatterns) {
      if (pattern.test(src)) return false;
    }

    // Must be a reasonable aspect ratio (not a thin banner)
    if (width > 0 && height > 0) {
      const ratio = Math.max(width, height) / Math.min(width, height);
      if (ratio > 5) return false;
    }

    // If in photo viewer and image src contains scontent or fbcdn, definitely analyze it
    if (inPhotoViewer && (src.includes('scontent') || src.includes('fbcdn'))) {
      console.log('[LeadHunter] Photo viewer image detected:', src.substring(0, 80));
      return true;
    }

    return true;
  }

  /**
   * Extract context around the image (post text, author, etc.)
   */
  function extractImageContext(img) {
    const platform = detectPlatform();
    const selectors = PLATFORM_SELECTORS[platform];

    let container = img.closest(selectors?.container || 'article, div');
    if (!container) container = img.parentElement?.parentElement;

    const context = {
      platform,
      postText: '',
      authorName: '',
      timestamp: '',
      postUrl: window.location.href
    };

    if (!container) return context;

    // Try to find post text
    const textSelectors = [
      '[data-ad-preview="message"]',
      '.userContent',
      '.feed-shared-text',
      '.update-components-text',
      '.tweet-text',
      'p',
      'span[dir="auto"]'
    ];

    for (const selector of textSelectors) {
      const textEl = container.querySelector(selector);
      if (textEl?.textContent?.trim()) {
        context.postText = textEl.textContent.trim().substring(0, 500);
        break;
      }
    }

    // Try to find author name
    const authorSelectors = [
      'h2 a[role="link"]',
      '.update-components-actor__name',
      'a[data-hovercard]',
      '.author-name',
      'strong'
    ];

    for (const selector of authorSelectors) {
      const authorEl = container.querySelector(selector);
      if (authorEl?.textContent?.trim()) {
        context.authorName = authorEl.textContent.trim();
        break;
      }
    }

    return context;
  }

  /**
   * Queue image for analysis
   */
  function queueImageForAnalysis(img) {
    const src = img.src || img.dataset.src;
    if (!src || pendingImages.has(src)) return;

    // Limit queue size
    if (pendingImages.size >= MAX_QUEUE_SIZE) {
      console.log('[LeadHunter] Image queue full, skipping');
      return;
    }

    const context = extractImageContext(img);
    pendingImages.set(src, { img, context, addedAt: Date.now() });

    // Mark as processed to avoid re-queuing
    processedImages.add(src);

    // Process queue
    processImageQueue();
  }

  /**
   * Process queued images
   */
  async function processImageQueue() {
    if (!settings.scanning || !settings.geminiKey || !settings.imageScanning) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastAnalysisTime < MIN_INTERVAL_MS) {
      setTimeout(processImageQueue, MIN_INTERVAL_MS);
      return;
    }

    // Get next image from queue
    const entries = Array.from(pendingImages.entries());
    if (entries.length === 0) return;

    const [src, data] = entries[0];
    pendingImages.delete(src);

    lastAnalysisTime = now;

    try {
      console.log('[LeadHunter] Analyzing image:', src.substring(0, 100));

      // Send to background for analysis
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_IMAGE',
        imageUrl: src,
        context: data.context
      });

      if (response?.success && response?.hasContactInfo) {
        console.log('[LeadHunter] Contact info found in image:', response.data);
        showImageDetectionIndicator(data.img, response.data);
      }

    } catch (error) {
      console.error('[LeadHunter] Image analysis error:', error);
    }

    // Continue processing queue
    if (pendingImages.size > 0) {
      setTimeout(processImageQueue, MIN_INTERVAL_MS);
    }
  }

  /**
   * Show visual indicator that contact was found in image
   */
  function showImageDetectionIndicator(img, data) {
    // Create overlay indicator
    const indicator = document.createElement('div');
    indicator.className = 'leadhunter-image-indicator';
    indicator.innerHTML = `
      <div class="leadhunter-badge">
        <span class="icon">📇</span>
        <span class="text">Contact Found!</span>
      </div>
    `;

    // Style the indicator
    indicator.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10000;
      pointer-events: none;
    `;

    const badge = indicator.querySelector('.leadhunter-badge');
    badge.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      animation: leadhunter-pulse 2s ease-in-out infinite;
    `;

    // Add animation
    if (!document.getElementById('leadhunter-image-styles')) {
      const style = document.createElement('style');
      style.id = 'leadhunter-image-styles';
      style.textContent = `
        @keyframes leadhunter-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes leadhunter-fadeout {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Position relative to image
    const imgContainer = img.parentElement;
    if (imgContainer) {
      const computedStyle = window.getComputedStyle(imgContainer);
      if (computedStyle.position === 'static') {
        imgContainer.style.position = 'relative';
      }
      imgContainer.appendChild(indicator);

      // Remove after 5 seconds
      setTimeout(() => {
        indicator.style.animation = 'leadhunter-fadeout 0.5s ease forwards';
        setTimeout(() => indicator.remove(), 500);
      }, 5000);
    }
  }

  /**
   * Scan for the main photo in photo viewer
   */
  function scanPhotoViewer() {
    if (!settings.scanning || !settings.imageScanning) return;

    // Specific selectors for Facebook photo viewer
    const photoViewerSelectors = [
      'div[data-pagelet="MediaViewerPhoto"] img',
      'img[data-visualcompletion="media-vc-image"]',
      'div[role="dialog"] img[src*="scontent"]',
      'div[role="dialog"] img[src*="fbcdn"]',
      '[aria-label*="Photo"] img[src*="scontent"]'
    ];

    for (const selector of photoViewerSelectors) {
      const img = document.querySelector(selector);
      if (img && img.src && (img.src.includes('scontent') || img.src.includes('fbcdn'))) {
        // Check if it's a substantial image
        const width = img.naturalWidth || img.width || 500;
        const height = img.naturalHeight || img.height || 500;
        if (width >= 100 && height >= 100) {
          if (!processedImages.has(img.src)) {
            console.log('[LeadHunter] Found photo viewer image:', img.src.substring(0, 80));
            queueImageForAnalysis(img);
            return;
          }
        }
      }
    }
  }

  /**
   * Scan for new images on the page
   */
  function scanForImages() {
    if (!settings.scanning || !settings.imageScanning) return;

    // If we're in photo viewer, prioritize that
    if (isInPhotoViewer()) {
      scanPhotoViewer();
    }

    const selectors = getImageSelectors();
    const allSelectors = selectors.join(', ');

    try {
      const images = document.querySelectorAll(allSelectors);

      images.forEach(img => {
        if (shouldAnalyzeImage(img)) {
          // Wait for image to load if needed
          if (img.complete && img.naturalWidth > 0) {
            queueImageForAnalysis(img);
          } else {
            img.addEventListener('load', () => {
              if (shouldAnalyzeImage(img)) {
                queueImageForAnalysis(img);
              }
            }, { once: true });
          }
        }
      });
    } catch (error) {
      console.error('[LeadHunter] Error scanning images:', error);
    }
  }

  /**
   * Setup mutation observer for new images
   */
  function setupObserver() {
    let lastUrl = window.location.href;

    const observer = new MutationObserver((mutations) => {
      let hasNewImages = false;
      let hasDialogChange = false;

      // Check if URL changed (SPA navigation)
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        // If navigated to a photo, scan after a delay
        if (lastUrl.includes('/photo')) {
          console.log('[LeadHunter] Navigated to photo URL');
          setTimeout(scanForImages, 1000);
        }
      }

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IMG') {
              hasNewImages = true;
            } else if (node.querySelectorAll) {
              const imgs = node.querySelectorAll('img');
              if (imgs.length > 0) hasNewImages = true;

              // Check if a dialog was added (Facebook photo viewer)
              if (node.matches && (
                node.matches('div[role="dialog"]') ||
                node.querySelector('div[role="dialog"]')
              )) {
                hasDialogChange = true;
              }
            }
          }
        });
      });

      if (hasNewImages || hasDialogChange) {
        // Debounce scanning
        clearTimeout(window.leadHunterImageScanTimeout);
        const delay = hasDialogChange ? 1500 : 500; // More delay for dialog (image needs to load)
        window.leadHunterImageScanTimeout = setTimeout(scanForImages, delay);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      const stored = await chrome.storage.local.get(['settings']);
      if (stored.settings) {
        settings = { ...settings, ...stored.settings };
      }
    } catch (error) {
      console.error('[LeadHunter] Error loading settings:', error);
    }
  }

  /**
   * Listen for settings updates
   */
  function listenForSettingsUpdates() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') {
        settings = { ...settings, ...message.settings };
        console.log('[LeadHunter] Image scanner settings updated');
      }
      if (message.type === 'TOGGLE_SCANNING') {
        settings.scanning = message.enabled;
      }
    });
  }

  /**
   * Initialize image scanner
   */
  async function init() {
    console.log('[LeadHunter] Image Scanner initializing...');

    await loadSettings();
    listenForSettingsUpdates();

    // Only run on supported platforms
    const platform = detectPlatform();
    if (platform === 'generic') {
      console.log('[LeadHunter] Image Scanner: Not a supported platform');
      return;
    }

    console.log(`[LeadHunter] Image Scanner active on ${platform}`);

    // Initial scan
    setTimeout(scanForImages, 2000);

    // Setup observer for new content
    setupObserver();

    // Periodic scan as fallback
    setInterval(scanForImages, 10000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
