// Lead Hunter AI - Manual Contact Save Button

(function() {
  'use strict';

  let saveButton = null;
  let currentPlatform = null;
  let settings = {};

  // Platform detection and profile selectors
  const platformConfigs = {
    linkedin: {
      match: /linkedin\.com/,
      profilePage: /linkedin\.com\/in\//,
      selectors: {
        name: 'h1.text-heading-xlarge, .pv-top-card--list li:first-child',
        title: '.text-body-medium.break-words, .pv-top-card--list-bullet li',
        company: '.pv-top-card--experience-list-item, .experience-item__subtitle',
        location: '.text-body-small.inline, .pv-top-card--list-bullet li:last-child',
        profilePic: '.pv-top-card-profile-picture__image, .presence-entity__image'
      }
    },
    facebook: {
      match: /facebook\.com/,
      profilePage: /facebook\.com\/(?!watch|groups|pages|marketplace|gaming|stories)[\w.]+\/?$/,
      selectors: {
        name: 'h1 span, [data-pagelet="ProfileTilesFeed"] h1',
        title: '[data-pagelet="ProfileTilesFeed"] span',
        company: '',
        location: '',
        profilePic: 'image[data-imgperflogname="profileCoverPhoto"], svg image'
      }
    },
    twitter: {
      match: /twitter\.com|x\.com/,
      profilePage: /(?:twitter|x)\.com\/(?!home|explore|notifications|messages|i\/|search)[\w]+\/?$/,
      selectors: {
        name: '[data-testid="UserName"] span:first-child, [data-testid="UserName"] div > span',
        title: '[data-testid="UserDescription"]',
        company: '',
        location: '[data-testid="UserProfileHeader_Items"] span',
        profilePic: '[data-testid="UserAvatar"] img'
      }
    },
    instagram: {
      match: /instagram\.com/,
      profilePage: /instagram\.com\/(?!p\/|reel\/|stories\/|explore\/|direct\/)[\w.]+\/?$/,
      selectors: {
        name: 'header h2, header h1',
        title: 'header section > div:last-child span',
        company: '',
        location: '',
        profilePic: 'header img'
      }
    }
  };

  // Initialize
  async function init() {
    // Load settings
    const storage = await chrome.storage.local.get(['settings']);
    settings = storage.settings || {};

    // Detect platform
    detectPlatform();

    // Check if on profile page and add button
    checkAndAddButton();

    // Listen for URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(checkAndAddButton, 1000);
      }
    }).observe(document, { subtree: true, childList: true });

    // Listen for settings updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATED') {
        settings = message.settings;
      }
    });
  }

  function detectPlatform() {
    for (const [name, config] of Object.entries(platformConfigs)) {
      if (config.match.test(location.hostname)) {
        currentPlatform = { name, ...config };
        break;
      }
    }
  }

  function checkAndAddButton() {
    // Remove existing button
    if (saveButton) {
      saveButton.remove();
      saveButton = null;
    }

    if (!currentPlatform) return;

    // Check if on profile page
    if (!currentPlatform.profilePage.test(location.href)) return;

    // Wait a bit for page to load
    setTimeout(createSaveButton, 1500);
  }

  function createSaveButton() {
    if (saveButton) return;

    saveButton = document.createElement('div');
    saveButton.id = 'lh-manual-save-btn';
    saveButton.innerHTML = `
      <button class="lh-save-btn">
        <span class="lh-save-icon">+</span>
        <span class="lh-save-text">Save Contact</span>
      </button>
      <div class="lh-save-success" style="display: none;">
        <span>Saved!</span>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      #lh-manual-save-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .lh-save-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
      }

      .lh-save-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
      }

      .lh-save-btn:active {
        transform: translateY(0);
      }

      .lh-save-icon {
        font-size: 18px;
        font-weight: bold;
      }

      .lh-save-success {
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      }

      .lh-save-btn.loading {
        opacity: 0.7;
        pointer-events: none;
      }

      .lh-save-btn.loading .lh-save-icon {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(saveButton);

    // Add click handler
    saveButton.querySelector('.lh-save-btn').addEventListener('click', handleSaveClick);
  }

  async function handleSaveClick() {
    const btn = saveButton.querySelector('.lh-save-btn');
    const successMsg = saveButton.querySelector('.lh-save-success');

    btn.classList.add('loading');
    btn.querySelector('.lh-save-icon').textContent = '...';

    try {
      // Extract profile data
      const profileData = extractProfileData();

      if (!profileData.name) {
        throw new Error('Could not extract profile data');
      }

      // Send to background script
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_MANUAL_CONTACT',
        data: {
          ...profileData,
          platform: currentPlatform.name,
          profileUrl: location.href,
          timestamp: new Date().toISOString(),
          industries: settings.industries || []
        }
      });

      if (response.success) {
        // Show success
        btn.style.display = 'none';
        successMsg.style.display = 'block';

        setTimeout(() => {
          btn.style.display = 'flex';
          successMsg.style.display = 'none';
          btn.classList.remove('loading');
          btn.querySelector('.lh-save-icon').textContent = '+';
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      console.error('[Lead Hunter AI] Save error:', error);
      btn.classList.remove('loading');
      btn.querySelector('.lh-save-icon').textContent = '!';
      btn.querySelector('.lh-save-text').textContent = 'Error';

      setTimeout(() => {
        btn.querySelector('.lh-save-icon').textContent = '+';
        btn.querySelector('.lh-save-text').textContent = 'Save Contact';
      }, 2000);
    }
  }

  function extractProfileData() {
    const selectors = currentPlatform.selectors;
    const data = {
      name: '',
      title: '',
      company: '',
      location: '',
      profilePic: '',
      bio: ''
    };

    // Extract each field
    if (selectors.name) {
      const el = document.querySelector(selectors.name);
      data.name = el?.innerText?.trim() || '';
    }

    if (selectors.title) {
      const el = document.querySelector(selectors.title);
      data.title = el?.innerText?.trim() || '';
    }

    if (selectors.company) {
      const el = document.querySelector(selectors.company);
      data.company = el?.innerText?.trim() || '';
    }

    if (selectors.location) {
      const el = document.querySelector(selectors.location);
      data.location = el?.innerText?.trim() || '';
    }

    if (selectors.profilePic) {
      const el = document.querySelector(selectors.profilePic);
      data.profilePic = el?.src || el?.getAttribute('xlink:href') || '';
    }

    return data;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
