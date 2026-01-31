// Lead Hunter AI - Main Content Scanner

class LeadScanner {
  constructor(platformConfig) {
    this.platform = platformConfig.name;
    this.selectors = platformConfig.selectors;
    this.scannedComments = new Set();
    this.isScanning = true;
    this.scanInterval = null;
    this.observer = null;

    this.init();
  }

  async init() {
    // Check if scanning is enabled
    const { settings } = await chrome.storage.local.get(['settings']);
    this.isScanning = settings?.scanning !== false;

    // Start scanning
    this.startScanning();

    // Listen for toggle messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TOGGLE_SCANNING') {
        this.isScanning = message.enabled;
        if (this.isScanning) {
          this.startScanning();
        } else {
          this.stopScanning();
        }
      }
    });

    // Observe DOM changes for dynamically loaded content
    this.setupMutationObserver();

    console.log(`[Lead Hunter AI] Scanner initialized for ${this.platform}`);
  }

  startScanning() {
    if (this.scanInterval) return;

    // Initial scan
    this.scanPage();

    // Periodic scan every 3 seconds
    this.scanInterval = setInterval(() => {
      if (this.isScanning) {
        this.scanPage();
      }
    }, 3000);
  }

  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (!this.isScanning) return;

      // Debounce
      clearTimeout(this.mutationTimeout);
      this.mutationTimeout = setTimeout(() => {
        this.scanPage();
      }, 500);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async scanPage() {
    if (!this.isScanning) return;

    const comments = this.extractComments();

    for (const comment of comments) {
      // Skip if already scanned
      const commentHash = this.hashComment(comment.text);
      if (this.scannedComments.has(commentHash)) {
        continue;
      }

      this.scannedComments.add(commentHash);

      // Send to background for analysis
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'ANALYZE_COMMENT',
          data: {
            comment: comment.text,
            platform: this.platform,
            author: comment.author,
            profileUrl: comment.profileUrl,
            timestamp: new Date().toISOString()
          }
        });

        // If it's a lead, highlight it
        if (response?.success && response.lead) {
          this.highlightComment(comment.element, response.lead.score);
        }
      } catch (error) {
        // Extension context invalidated or background not ready
        console.debug('[Lead Hunter AI] Analysis error:', error);
      }
    }
  }

  extractComments() {
    const comments = [];

    // Get all comment containers
    const containers = document.querySelectorAll(this.selectors.commentContainer);

    containers.forEach(container => {
      try {
        // Get comment text
        const textElement = container.querySelector(this.selectors.commentText);
        if (!textElement) return;

        const text = textElement.innerText?.trim();
        if (!text || text.length < 20) return;

        // Get author info
        const authorElement = container.querySelector(this.selectors.authorName);
        const authorLinkElement = container.querySelector(this.selectors.authorLink);

        const author = {
          name: authorElement?.innerText?.trim() || 'Unknown',
          title: container.querySelector(this.selectors.authorTitle)?.innerText?.trim() || '',
          bio: container.querySelector(this.selectors.authorBio)?.innerText?.trim() || ''
        };

        const profileUrl = authorLinkElement?.href || '';

        comments.push({
          text,
          author,
          profileUrl,
          element: container
        });
      } catch (e) {
        // Skip problematic elements
      }
    });

    return comments;
  }

  highlightComment(element, score) {
    if (!element || element.classList.contains('lh-highlighted')) return;

    element.classList.add('lh-highlighted');

    // Add score badge
    const badge = document.createElement('div');
    badge.className = `lh-score-badge lh-score-${this.getScoreClass(score)}`;
    badge.innerHTML = `
      <span class="lh-score">${score}</span>
      <span class="lh-label">Lead</span>
    `;

    // Position badge
    element.style.position = 'relative';
    element.appendChild(badge);

    // Add glow effect for hot leads
    if (score >= 8) {
      element.classList.add('lh-hot-lead');
    } else if (score >= 5) {
      element.classList.add('lh-warm-lead');
    }
  }

  getScoreClass(score) {
    if (score >= 8) return 'hot';
    if (score >= 5) return 'warm';
    return 'cold';
  }

  hashComment(text) {
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${this.platform}-${hash}`;
  }
}

// Export for platform scripts
window.LeadScanner = LeadScanner;
