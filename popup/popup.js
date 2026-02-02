// Lead Hunter AI - Popup Controller

import { generateAppsScriptCode } from '../utils/google-sheets.js';
import { translations, t, getCurrentLanguage } from '../utils/i18n.js';
import { getPainKeywordsForIndustries, COMMON_PAIN_KEYWORDS } from '../utils/industry-keywords.js';

class PopupController {
  constructor() {
    this.currentTab = 'dashboard';
    this.leads = [];
    this.settings = {};
    this.currentLead = null;
    this.currentLanguage = 'en';
    this.init();
  }

  async init() {
    await this.loadData();
    this.currentLanguage = this.settings.language || 'en';
    this.applyTranslations();
    this.setupEventListeners();
    this.renderDashboard();
    this.renderLeadsList();
    this.loadSettings();
    this.loadAppsScriptCode();
    this.setupRippleEffects();
  }

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  applyTranslations() {
    const lang = this.currentLanguage;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key, lang);

      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = translation;
      } else if (el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    });

    // Update language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = lang;
    }

    // Apply tooltips
    this.applyTooltips();
  }

  /**
   * Apply tooltips to all elements with data-tooltip attribute
   */
  applyTooltips() {
    const lang = this.currentLanguage;
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      const key = el.getAttribute('data-tooltip');
      const tooltip = t(key, lang);
      el.setAttribute('title', tooltip);
    });
  }

  /**
   * Apply dark mode to body
   */
  applyDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  /**
   * Toggle collapsible industry category
   */
  toggleCategory(header) {
    const category = header.closest('.industry-category');
    const toggle = header.querySelector('.category-toggle');

    if (category.classList.contains('collapsed')) {
      category.classList.remove('collapsed');
      toggle.textContent = '▼';
    } else {
      category.classList.add('collapsed');
      toggle.textContent = '▶';
    }
  }

  /**
   * Update category selected counts
   */
  updateCategoryCounts() {
    document.querySelectorAll('.industry-category').forEach(category => {
      const checkboxes = category.querySelectorAll('input[name="industry"]');
      const checked = category.querySelectorAll('input[name="industry"]:checked').length;
      const countEl = category.querySelector('.category-count');

      if (countEl) {
        countEl.textContent = `(${checked}/${checkboxes.length})`;
        if (checked > 0) {
          countEl.classList.add('has-selected');
        } else {
          countEl.classList.remove('has-selected');
        }
      }
    });
  }

  /**
   * Update pain keywords based on selected industries
   */
  updateKeywordsForIndustries() {
    const industries = [];
    document.querySelectorAll('input[name="industry"]:checked').forEach(cb => {
      industries.push(cb.value);
    });

    // Get keywords for selected industries
    const keywords = getPainKeywordsForIndustries(industries);

    // Update the textarea
    const textarea = document.getElementById('customKeywords');
    if (textarea) {
      textarea.value = keywords.join('\n');
    }
  }

  /**
   * Change language and save preference
   */
  async changeLanguage(lang) {
    this.currentLanguage = lang;
    this.settings.language = lang;
    await chrome.storage.local.set({ settings: this.settings });
    this.applyTranslations();
    this.renderDashboard();
    this.renderLeadsList();
  }

  async loadData() {
    const storage = await chrome.storage.local.get(['leads', 'settings', 'stats']);
    this.leads = storage.leads || [];
    // Merge stored settings with defaults so new fields get default values
    const defaults = this.getDefaultSettings();
    this.settings = { ...defaults, ...storage.settings };
    // Ensure competitors has a value (for users who saved settings before this field existed)
    if (!this.settings.competitors || this.settings.competitors.trim() === '') {
      this.settings.competitors = defaults.competitors;
    }
    this.stats = storage.stats || { scanned: 0, leadsFound: 0, hotLeads: 0 };
  }

  getDefaultSettings() {
    // Default competitors for AI receptionist / virtual receptionist services
    const defaultCompetitors = [
      'Ruby',
      'Smith.ai',
      'Answering Service',
      'AnswerConnect',
      'PATLive',
      'Moneypenny',
      'Davinci Virtual',
      'Gabbyville',
      'Nexa',
      'VoiceNation',
      'MAP Communications',
      'Specialty Answering Service',
      'AnswerFirst',
      'Go Answer',
      'Abby Connect',
      'My Receptionist',
      'Alliance Virtual',
      'Intelligent Office'
    ].join('\n');

    return {
      geminiKey: '',
      hubspotKey: '',
      hunterKey: '',
      webhookUrl: '',
      googleSheetsUrl: '',
      minWords: 8,
      customKeywords: '',
      competitors: defaultCompetitors,
      industries: [],
      notifyHotLeads: true,
      soundEnabled: false,
      scanning: true,
      autoSendHubspot: false,
      autoSendWebhook: false,
      autoSendSheets: false,
      autoFindEmail: false,
      darkMode: false,
      imageScanning: true
    };
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Quick actions
    document.getElementById('toggleScanning').addEventListener('click', () => this.toggleScanning());
    document.getElementById('exportLeads').addEventListener('click', () => this.exportLeads());

    // Filters
    document.getElementById('platformFilter').addEventListener('change', () => this.filterLeads());
    document.getElementById('scoreFilter').addEventListener('change', () => this.filterLeads());
    document.getElementById('urgencyFilter').addEventListener('change', () => this.filterLeads());
    document.getElementById('typeFilter').addEventListener('change', () => this.filterLeads());

    // Settings
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    document.getElementById('testWebhook').addEventListener('click', () => this.testWebhook());
    document.getElementById('showSheetsInstructions').addEventListener('click', (e) => {
      e.preventDefault();
      this.showSheetsModal();
    });

    // Language selector
    document.getElementById('languageSelect').addEventListener('change', (e) => {
      this.changeLanguage(e.target.value);
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Collapsible industry categories
    document.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', () => this.toggleCategory(header));
    });

    // Update category counts and keywords when checkboxes change
    document.querySelectorAll('input[name="industry"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateCategoryCounts();
        this.updateKeywordsForIndustries();
      });
    });

    document.getElementById('leadModal').addEventListener('click', (e) => {
      if (e.target.id === 'leadModal') this.closeModal();
    });

    document.getElementById('sheetsModal').addEventListener('click', (e) => {
      if (e.target.id === 'sheetsModal') this.closeSheetsModal();
    });

    // Modal actions
    document.getElementById('copyDraft').addEventListener('click', () => this.copyDraft());
    document.getElementById('quickReply').addEventListener('click', () => this.quickReply());
    document.getElementById('sendToHubspot').addEventListener('click', () => this.sendToHubspot());
    document.getElementById('sendToWebhook').addEventListener('click', () => this.sendToWebhook());
    document.getElementById('sendToSheets').addEventListener('click', () => this.sendToSheets());
    document.getElementById('captureScreenshot').addEventListener('click', () => this.captureScreenshot());
    document.getElementById('openProfile').addEventListener('click', () => this.openProfile());
    document.getElementById('markContacted').addEventListener('click', () => this.markContacted());
    document.getElementById('findEmail').addEventListener('click', () => this.findEmail());

    // Apps Script copy
    document.getElementById('copyAppsScript').addEventListener('click', () => this.copyAppsScript());

    // Manual Lead Form
    document.getElementById('addManualLead').addEventListener('click', () => this.showAddLeadModal());
    document.getElementById('closeAddLeadModal').addEventListener('click', () => this.closeAddLeadModal());
    document.getElementById('cancelAddLead').addEventListener('click', () => this.closeAddLeadModal(true));
    document.getElementById('manualLeadForm').addEventListener('submit', (e) => this.saveManualLead(e));
    document.getElementById('addLeadModal').addEventListener('click', (e) => {
      if (e.target.id === 'addLeadModal') this.closeAddLeadModal();
    });

    // Listen for updates from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'NEW_LEAD') {
        this.leads.unshift(message.lead);
        this.renderDashboard();
        this.renderLeadsList();
      } else if (message.type === 'STATS_UPDATE') {
        this.stats = message.stats;
        this.renderDashboard();
      }
    });
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    this.currentTab = tabId;
  }

  renderDashboard() {
    const today = new Date().toDateString();
    const leadsToday = this.leads.filter(l => new Date(l.timestamp).toDateString() === today).length;
    const hotLeads = this.leads.filter(l => l.score >= 8).length;

    // Animate the numbers for better visual feedback
    this.animateNumber(document.getElementById('leadsToday'), leadsToday);
    this.animateNumber(document.getElementById('leadsTotal'), this.leads.length);
    this.animateNumber(document.getElementById('hotLeads'), hotLeads);
    this.animateNumber(document.getElementById('scannedComments'), this.stats.scanned || 0);

    // Urgency counts
    const urgencyCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    this.leads.forEach(lead => {
      const level = lead.urgencyLevel || 'medium';
      if (urgencyCounts.hasOwnProperty(level)) {
        urgencyCounts[level]++;
      }
    });

    document.getElementById('urgencyCritical').textContent = urgencyCounts.critical;
    document.getElementById('urgencyHigh').textContent = urgencyCounts.high;
    document.getElementById('urgencyMedium').textContent = urgencyCounts.medium;
    document.getElementById('urgencyLow').textContent = urgencyCounts.low;

    // Recent leads
    const recentList = document.getElementById('recentLeadsList');
    const recent = this.leads.slice(0, 5);

    if (recent.length === 0) {
      recentList.innerHTML = `<p class="empty-state">${t('noLeadsYet', this.currentLanguage)}</p>`;
      return;
    }

    recentList.innerHTML = recent.map(lead => this.renderLeadCard(lead)).join('');
    this.attachLeadCardListeners();
  }

  renderLeadsList() {
    const list = document.getElementById('allLeadsList');

    if (this.leads.length === 0) {
      list.innerHTML = `<p class="empty-state">${t('noLeads', this.currentLanguage)}</p>`;
      return;
    }

    list.innerHTML = this.leads.map(lead => this.renderLeadCard(lead)).join('');
    this.attachLeadCardListeners();
  }

  renderLeadCard(lead) {
    const isManual = lead.leadType === 'manual';
    const isProspect = lead.leadType === 'prospect';
    const isScraped = lead.leadType === 'scraped';
    const isImage = lead.leadType === 'image';
    const isPain = lead.leadType === 'pain' || (!isManual && !isProspect && !isScraped && !isImage);

    // Determine score class
    let scoreClass = 'cold';
    if (isManual) {
      scoreClass = 'manual';
    } else if (isScraped || isImage) {
      scoreClass = 'scraped';
    } else if (isProspect) {
      scoreClass = 'prospect';
    } else if (lead.score >= 8) {
      scoreClass = 'hot';
    } else if (lead.score >= 5) {
      scoreClass = 'warm';
    }

    const timeAgo = this.getTimeAgo(lead.timestamp);

    // Emoji and tooltip based on lead type
    let urgencyEmoji, urgencyTooltip;
    if (isManual) {
      urgencyEmoji = '📌';
      urgencyTooltip = t('tooltipScoreManual', this.currentLanguage);
    } else if (isImage) {
      urgencyEmoji = '📷';
      urgencyTooltip = t('tooltipImage', this.currentLanguage) || 'Contact extracted from image using AI Vision';
    } else if (isScraped) {
      urgencyEmoji = '🏢';
      urgencyTooltip = t('tooltipScraped', this.currentLanguage) || 'Scraped business - Contact info extracted from business page';
    } else if (isProspect) {
      urgencyEmoji = '👤';
      urgencyTooltip = t('tooltipProspect', this.currentLanguage) || 'Prospect - Business owner without explicit pain signals';
    } else {
      urgencyEmoji = this.getUrgencyEmoji(lead.urgencyLevel);
      urgencyTooltip = this.getUrgencyTooltip(lead.urgencyLevel);
    }

    const scoreTooltip = this.getScoreTooltip(lead.score, isManual);

    // Preview text
    let preview;
    if (isManual) {
      preview = lead.title || lead.company || t('manuallySaved', this.currentLanguage);
    } else if (isImage) {
      const contactInfo = [lead.phone, lead.email, lead.website].filter(Boolean).join(' • ');
      preview = contactInfo || lead.company || t('imageLeads', this.currentLanguage) || 'From Image';
    } else if (isScraped) {
      const contactInfo = [lead.phone, lead.email, lead.website].filter(Boolean).join(' • ');
      preview = contactInfo || lead.title || lead.category || t('scrapedLeads', this.currentLanguage);
    } else {
      preview = (lead.comment || '').substring(0, 80) + '...';
    }

    // Score display
    let scoreDisplay;
    if (isManual) {
      scoreDisplay = '📌';
    } else if (isImage) {
      scoreDisplay = '📷';
    } else if (isScraped) {
      scoreDisplay = '🏢';
    } else if (isProspect) {
      scoreDisplay = '👤';
    } else {
      scoreDisplay = `${lead.score}/10`;
    }

    // Lead type badge
    let typeBadge = '';
    if (isImage) {
      typeBadge = '<span class="lead-type-badge scraped">📷 IMAGE</span>';
    } else if (isScraped) {
      typeBadge = '<span class="lead-type-badge scraped">SCRAPED</span>';
    } else if (isProspect) {
      typeBadge = '<span class="lead-type-badge prospect">PROSPECT</span>';
    } else if (isPain && lead.score >= 7) {
      typeBadge = '<span class="lead-type-badge pain">PAIN</span>';
    }

    // Industry badge if detected
    const industryBadge = (lead.detectedIndustry || lead.industry)
      ? `<span class="lead-industry-badge">${lead.detectedIndustry || lead.industry}</span>`
      : '';

    return `
      <div class="lead-card ${scoreClass}" data-lead-id="${lead.id}">
        <div class="lead-card-header">
          <span class="lead-card-name">${this.escapeHtml(lead.name || 'User')}</span>
          <div class="lead-card-badges">
            ${typeBadge}
            <span class="lead-card-urgency" title="${urgencyTooltip}">${urgencyEmoji}</span>
            <span class="lead-card-score" title="${scoreTooltip}">${scoreDisplay}</span>
          </div>
        </div>
        <p class="lead-card-preview">${this.escapeHtml(preview)}</p>
        <div class="lead-card-meta">
          <span>${lead.platform}</span>
          ${industryBadge}
          <span>${timeAgo}</span>
        </div>
      </div>
    `;
  }

  getUrgencyEmoji(level) {
    const emojis = {
      critical: '🔥🔥',
      high: '🔥',
      medium: '⚡',
      low: '💤',
      cold: '❄️'
    };
    return emojis[level] || '⚡';
  }

  getUrgencyTooltip(level) {
    const tooltips = {
      critical: t('tooltipCritical', this.currentLanguage),
      high: t('tooltipHigh', this.currentLanguage),
      medium: t('tooltipMedium', this.currentLanguage),
      low: t('tooltipLow', this.currentLanguage)
    };
    return tooltips[level] || tooltips.medium;
  }

  getScoreTooltip(score, isManual) {
    if (isManual) return t('tooltipScoreManual', this.currentLanguage);
    if (score >= 8) return t('tooltipScoreHot', this.currentLanguage);
    if (score >= 5) return t('tooltipScoreWarm', this.currentLanguage);
    return t('tooltipScoreCold', this.currentLanguage);
  }

  attachLeadCardListeners() {
    document.querySelectorAll('.lead-card').forEach(card => {
      card.addEventListener('click', () => {
        const leadId = card.dataset.leadId;
        const lead = this.leads.find(l => l.id === leadId);
        if (lead) this.openLeadModal(lead);
      });
    });
  }

  filterLeads() {
    const platform = document.getElementById('platformFilter').value;
    const score = document.getElementById('scoreFilter').value;
    const urgency = document.getElementById('urgencyFilter').value;
    const type = document.getElementById('typeFilter').value;

    let filtered = [...this.leads];

    if (platform !== 'all') {
      filtered = filtered.filter(l => l.platform.toLowerCase() === platform);
    }

    if (score === 'hot') {
      filtered = filtered.filter(l => l.score >= 8);
    } else if (score === 'warm') {
      filtered = filtered.filter(l => l.score >= 5 && l.score < 8);
    } else if (score === 'cold') {
      filtered = filtered.filter(l => l.score < 5);
    }

    if (urgency !== 'all') {
      filtered = filtered.filter(l => l.urgencyLevel === urgency);
    }

    if (type === 'manual') {
      filtered = filtered.filter(l => l.leadType === 'manual');
    } else if (type === 'pain') {
      filtered = filtered.filter(l => l.leadType === 'pain' || (!l.leadType && l.leadType !== 'prospect' && l.leadType !== 'manual' && l.leadType !== 'scraped' && l.leadType !== 'image'));
    } else if (type === 'prospect') {
      filtered = filtered.filter(l => l.leadType === 'prospect');
    } else if (type === 'scraped') {
      filtered = filtered.filter(l => l.leadType === 'scraped');
    } else if (type === 'image') {
      filtered = filtered.filter(l => l.leadType === 'image');
    }

    const list = document.getElementById('allLeadsList');
    if (filtered.length === 0) {
      list.innerHTML = `<p class="empty-state">${t('noLeadsFilter', this.currentLanguage)}</p>`;
      return;
    }

    list.innerHTML = filtered.map(lead => this.renderLeadCard(lead)).join('');
    this.attachLeadCardListeners();
  }

  openLeadModal(lead) {
    this.currentLead = lead;

    // Basic info
    document.getElementById('modalName').textContent = lead.name || 'Usuario';
    document.getElementById('modalTitle').textContent = lead.title || lead.bio || '';
    document.getElementById('modalPlatform').textContent = lead.platform;
    document.getElementById('modalScore').textContent = lead.score;
    document.getElementById('modalComment').textContent = lead.comment;
    document.getElementById('modalAnalysis').textContent = lead.analysis || t('analysisNotAvailable', this.currentLanguage);
    document.getElementById('modalDraft').value = lead.messageDraft || '';

    // Urgency
    const urgencyEl = document.getElementById('modalUrgency');
    urgencyEl.textContent = `${this.getUrgencyEmoji(lead.urgencyLevel)} ${this.capitalizeFirst(lead.urgencyLevel || 'medium')}`;
    urgencyEl.className = `lead-urgency ${lead.urgencyLevel || 'medium'}`;

    // Timer
    this.updateUrgencyTimer(lead);

    // Previous contact warning
    const warningEl = document.getElementById('previousContactWarning');
    warningEl.style.display = lead.previouslyContacted ? 'block' : 'none';

    // Analysis details
    document.getElementById('modalIndustry').textContent = `${t('industry', this.currentLanguage)}: ${lead.industry || '-'}`;
    document.getElementById('modalIntent').textContent = `${t('intent', this.currentLanguage)}: ${lead.buyingIntent || '-'}`;
    document.getElementById('modalApproach').textContent = `${t('approach', this.currentLanguage)}: ${lead.suggestedApproach || '-'}`;

    // Pain points
    const painPointsSection = document.getElementById('painPointsSection');
    const painPointsList = document.getElementById('modalPainPoints');
    if (lead.painPoints && lead.painPoints.length > 0) {
      painPointsSection.style.display = 'block';
      painPointsList.innerHTML = lead.painPoints.map(p => `<li>${this.escapeHtml(p)}</li>`).join('');
    } else {
      painPointsSection.style.display = 'none';
    }

    // Contact info
    document.getElementById('modalEmail').textContent = lead.email || '-';
    document.getElementById('modalCompany').value = lead.company || '';
    document.getElementById('modalWebsite').value = lead.website || '';
    document.getElementById('modalNotes').value = lead.notes || '';

    // Update contacted button state
    const contactedBtn = document.getElementById('markContacted');
    if (lead.contacted) {
      contactedBtn.innerHTML = `<span class="btn-icon">✅</span> ${t('contacted', this.currentLanguage)}`;
      contactedBtn.disabled = true;
    } else {
      contactedBtn.innerHTML = `<span class="btn-icon">✅</span> ${t('markContacted', this.currentLanguage)}`;
      contactedBtn.disabled = false;
    }

    document.getElementById('leadModal').classList.add('active');
  }

  updateUrgencyTimer(lead) {
    const timerEl = document.getElementById('urgencyTimer');
    const timerTextEl = document.getElementById('timerText');
    const timerAgeEl = document.getElementById('timerAge');

    const age = Date.now() - new Date(lead.timestamp).getTime();
    const ageFormatted = this.formatAge(age);

    timerAgeEl.textContent = `${ageFormatted} ${t('ago', this.currentLanguage)}`;

    // Calculate response deadline based on urgency
    const deadlines = {
      critical: 2 * 60 * 60 * 1000,  // 2 hours
      high: 12 * 60 * 60 * 1000,     // 12 hours
      medium: 24 * 60 * 60 * 1000,   // 24 hours
      low: 72 * 60 * 60 * 1000       // 72 hours
    };

    const deadline = deadlines[lead.urgencyLevel] || deadlines.medium;
    const remaining = deadline - age;

    if (remaining <= 0) {
      timerTextEl.textContent = t('timeExpired', this.currentLanguage);
      timerEl.classList.add('expired');
    } else {
      timerTextEl.textContent = `${t('respondIn', this.currentLanguage)}: ${this.formatAge(remaining)}`;
      timerEl.classList.remove('expired');
      if (lead.urgencyLevel === 'critical') {
        timerEl.classList.add('critical');
      } else {
        timerEl.classList.remove('critical');
      }
    }
  }

  formatAge(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}${t('days', this.currentLanguage)} ${hours % 24}${t('hours', this.currentLanguage)}`;
    if (hours > 0) return `${hours}${t('hours', this.currentLanguage)} ${minutes % 60}${t('minutes', this.currentLanguage)}`;
    if (minutes > 0) return `${minutes}${t('minutes', this.currentLanguage)}`;
    return t('now', this.currentLanguage);
  }

  closeModal() {
    // Save any edits to the lead
    if (this.currentLead) {
      this.currentLead.company = document.getElementById('modalCompany').value;
      this.currentLead.website = document.getElementById('modalWebsite').value;
      this.currentLead.notes = document.getElementById('modalNotes').value;
      this.currentLead.messageDraft = document.getElementById('modalDraft').value;
      this.saveLeads();
    }

    document.getElementById('leadModal').classList.remove('active');
    this.currentLead = null;
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
    this.currentLead = null;
  }

  showSheetsModal() {
    document.getElementById('sheetsModal').classList.add('active');
  }

  closeSheetsModal() {
    document.getElementById('sheetsModal').classList.remove('active');
  }

  // ==================== MANUAL LEAD FUNCTIONS ====================

  async showAddLeadModal() {
    // Restore saved form data (in case popup was closed while filling)
    await this.restoreManualLeadForm();
    // Show the modal
    document.getElementById('addLeadModal').classList.add('active');
    // Setup auto-save listeners
    this.setupManualLeadAutoSave();
  }

  closeAddLeadModal(clearData = false) {
    document.getElementById('addLeadModal').classList.remove('active');
    // Only clear saved data if explicitly requested (Cancel button or successful save)
    if (clearData) {
      this.clearManualLeadDraft();
      document.getElementById('manualLeadForm').reset();
    }
  }

  setupManualLeadAutoSave() {
    const fields = ['manualName', 'manualPhone', 'manualEmail', 'manualWebsite', 'manualAddress', 'manualCategory', 'manualNotes'];

    fields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && !element.dataset.autoSaveSetup) {
        element.dataset.autoSaveSetup = 'true';
        element.addEventListener('input', () => this.autoSaveManualLeadForm());
        element.addEventListener('change', () => this.autoSaveManualLeadForm());
      }
    });
  }

  async autoSaveManualLeadForm() {
    const formData = {
      name: document.getElementById('manualName').value,
      phone: document.getElementById('manualPhone').value,
      email: document.getElementById('manualEmail').value,
      website: document.getElementById('manualWebsite').value,
      address: document.getElementById('manualAddress').value,
      category: document.getElementById('manualCategory').value,
      notes: document.getElementById('manualNotes').value,
      savedAt: Date.now()
    };

    await chrome.storage.local.set({ manualLeadDraft: formData });
    console.log('[Lead Hunter] Auto-saved manual lead form');
  }

  async restoreManualLeadForm() {
    try {
      const result = await chrome.storage.local.get(['manualLeadDraft']);
      const draft = result.manualLeadDraft;

      if (draft && draft.savedAt) {
        // Only restore if draft is less than 24 hours old
        const hoursSinceSave = (Date.now() - draft.savedAt) / (1000 * 60 * 60);
        if (hoursSinceSave < 24) {
          document.getElementById('manualName').value = draft.name || '';
          document.getElementById('manualPhone').value = draft.phone || '';
          document.getElementById('manualEmail').value = draft.email || '';
          document.getElementById('manualWebsite').value = draft.website || '';
          document.getElementById('manualAddress').value = draft.address || '';
          document.getElementById('manualCategory').value = draft.category || '';
          document.getElementById('manualNotes').value = draft.notes || '';
          console.log('[Lead Hunter] Restored manual lead form draft');
        } else {
          // Draft too old, clear it
          this.clearManualLeadDraft();
        }
      }
    } catch (e) {
      console.log('[Lead Hunter] No draft to restore');
    }
  }

  async clearManualLeadDraft() {
    await chrome.storage.local.remove(['manualLeadDraft']);
    console.log('[Lead Hunter] Cleared manual lead form draft');
  }

  async saveManualLead(e) {
    e.preventDefault();

    const name = document.getElementById('manualName').value.trim();
    const phone = document.getElementById('manualPhone').value.trim();
    const email = document.getElementById('manualEmail').value.trim();
    const website = document.getElementById('manualWebsite').value.trim();
    const address = document.getElementById('manualAddress').value.trim();
    const category = document.getElementById('manualCategory').value;
    const notes = document.getElementById('manualNotes').value.trim();

    // Validate at least name or phone or email
    if (!name && !phone && !email) {
      this.showToast(t('fillAtLeastOne', this.currentLanguage) || 'Please fill at least name, phone, or email', 'error');
      return;
    }

    // Create the lead object
    const lead = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || 'Unknown',
      phone: phone,
      email: email,
      website: website,
      address: address,
      category: category,
      notes: notes,
      platform: 'manual',
      leadType: 'manual',
      score: 7, // Default score for manual leads
      urgencyLevel: 'medium',
      timestamp: new Date().toISOString(),
      url: '',
      comment: notes || `Manual lead: ${name}`,
      analysis: {
        summary: 'Manually added lead',
        industry: category || 'Unknown',
        intent: 'unknown',
        approach: 'direct'
      }
    };

    // Add to leads array
    this.leads.unshift(lead);

    // Save to storage
    await this.saveLeads();

    // Notify background script
    try {
      await chrome.runtime.sendMessage({
        type: 'MANUAL_LEAD_ADDED',
        lead: lead
      });
    } catch (e) {
      console.log('Background notification failed:', e);
    }

    // Close modal AND clear the draft (successful save)
    this.closeAddLeadModal(true);

    // Show success message
    this.showToast(t('leadSaved', this.currentLanguage) || 'Lead saved successfully!', 'success');

    // Refresh the leads list
    this.renderDashboard();
    this.renderLeadsList();

    // Switch to leads tab to show the new lead
    this.switchTab('leads');
  }

  showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  loadAppsScriptCode() {
    try {
      const code = generateAppsScriptCode();
      document.getElementById('appsScriptCode').textContent = code;
    } catch (e) {
      document.getElementById('appsScriptCode').textContent = '// Error loading code';
    }
  }

  async copyAppsScript() {
    const code = document.getElementById('appsScriptCode').textContent;
    await navigator.clipboard.writeText(code);

    const btn = document.getElementById('copyAppsScript');
    btn.textContent = `${t('copied', this.currentLanguage)}`;
    setTimeout(() => btn.textContent = `📋 ${t('copyCode', this.currentLanguage)}`, 2000);
  }

  async copyDraft() {
    const draft = document.getElementById('modalDraft').value;
    await navigator.clipboard.writeText(draft);

    const btn = document.getElementById('copyDraft');
    const originalText = btn.innerHTML;
    btn.innerHTML = `✅ ${t('copied', this.currentLanguage)}`;
    setTimeout(() => btn.innerHTML = originalText, 2000);
  }

  async quickReply() {
    // Copy draft and open profile
    await this.copyDraft();
    this.openProfile();
  }

  async sendToHubspot() {
    if (!this.currentLead) return;

    const btn = document.getElementById('sendToHubspot');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TO_HUBSPOT',
        lead: this.currentLead
      });

      if (response.success) {
        btn.innerHTML = '<span class="btn-icon">✅</span>';
        this.currentLead.sentToHubspot = true;
        await this.saveLeads();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btn.innerHTML = '<span class="btn-icon">❌</span>';
      console.error('HubSpot error:', error);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">📊</span> HubSpot';
    }, 2000);
  }

  async sendToWebhook() {
    if (!this.currentLead) return;

    const btn = document.getElementById('sendToWebhook');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TO_WEBHOOK',
        lead: this.currentLead
      });

      if (response.success) {
        btn.innerHTML = '<span class="btn-icon">✅</span>';
        this.currentLead.sentToWebhook = true;
        await this.saveLeads();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btn.innerHTML = '<span class="btn-icon">❌</span>';
      console.error('Webhook error:', error);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🔗</span> Webhook';
    }, 2000);
  }

  async sendToSheets() {
    if (!this.currentLead) return;

    const btn = document.getElementById('sendToSheets');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TO_SHEETS',
        lead: this.currentLead
      });

      if (response.success) {
        btn.innerHTML = '<span class="btn-icon">✅</span>';
        this.currentLead.sentToSheets = true;
        await this.saveLeads();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btn.innerHTML = '<span class="btn-icon">❌</span>';
      console.error('Sheets error:', error);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">📗</span> Sheets';
    }, 2000);
  }

  async captureScreenshot() {
    const btn = document.getElementById('captureScreenshot');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>';

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });

      if (response.success) {
        // Download the screenshot
        const a = document.createElement('a');
        a.href = response.dataUrl;
        a.download = `lead-${this.currentLead?.name || 'screenshot'}-${Date.now()}.png`;
        a.click();

        btn.innerHTML = '<span class="btn-icon">✅</span>';
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btn.innerHTML = '<span class="btn-icon">❌</span>';
      console.error('Screenshot error:', error);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">📸</span> Screenshot';
    }, 2000);
  }

  async findEmail() {
    if (!this.currentLead) return;

    const btn = document.getElementById('findEmail');
    btn.disabled = true;
    btn.innerHTML = '⏳';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_EMAIL',
        lead: this.currentLead
      });

      if (response.success && response.email) {
        document.getElementById('modalEmail').textContent = response.email;
        this.currentLead.email = response.email;
        await this.saveLeads();
        btn.innerHTML = '✅';
      } else {
        throw new Error(response.error || 'Not found');
      }
    } catch (error) {
      btn.innerHTML = '❌';
      console.error('Email finder error:', error);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `🔍 ${t('search', this.currentLanguage)}`;
    }, 2000);
  }

  async testWebhook() {
    const url = document.getElementById('webhookUrl').value;
    if (!url) {
      this.showToast(t('enterWebhookFirst', this.currentLanguage), 'error');
      return;
    }

    const btn = document.getElementById('testWebhook');
    btn.disabled = true;
    btn.textContent = `${t('testing', this.currentLanguage)}`;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_WEBHOOK',
        url
      });

      if (response.success) {
        btn.textContent = `${t('success', this.currentLanguage)}`;
        btn.style.background = '#10b981';
        btn.style.color = 'white';
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      btn.textContent = t('error', this.currentLanguage);
      btn.style.background = '#ef4444';
      btn.style.color = 'white';
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = t('testWebhook', this.currentLanguage);
      btn.style.background = '';
      btn.style.color = '';
    }, 3000);
  }

  openProfile() {
    if (this.currentLead && this.currentLead.profileUrl) {
      chrome.tabs.create({ url: this.currentLead.profileUrl });
    }
  }

  async markContacted() {
    if (!this.currentLead) return;

    this.currentLead.contacted = true;
    this.currentLead.contactedAt = new Date().toISOString();
    await this.saveLeads();

    // Mark in interaction history
    chrome.runtime.sendMessage({
      type: 'MARK_CONTACTED',
      profileUrl: this.currentLead.profileUrl,
      data: {
        leadId: this.currentLead.id,
        platform: this.currentLead.platform
      }
    });

    const btn = document.getElementById('markContacted');
    btn.innerHTML = `<span class="btn-icon">✅</span> ${t('contacted', this.currentLanguage)}`;
    btn.disabled = true;
  }

  async toggleScanning() {
    this.settings.scanning = !this.settings.scanning;
    await chrome.storage.local.set({ settings: this.settings });

    const btn = document.getElementById('toggleScanning');
    const indicator = document.getElementById('statusIndicator');

    if (this.settings.scanning) {
      btn.innerHTML = `<span class="btn-icon">⏸️</span> ${t('pauseScanning', this.currentLanguage)}`;
      indicator.classList.remove('paused');
      indicator.querySelector('.status-text').textContent = t('statusActive', this.currentLanguage);
    } else {
      btn.innerHTML = `<span class="btn-icon">▶️</span> ${t('resumeScanning', this.currentLanguage)}`;
      indicator.classList.add('paused');
      indicator.querySelector('.status-text').textContent = t('statusPaused', this.currentLanguage);
    }

    chrome.runtime.sendMessage({ type: 'TOGGLE_SCANNING', enabled: this.settings.scanning });
  }

  exportLeads() {
    if (this.leads.length === 0) {
      this.showToast(t('noLeadsToExport', this.currentLanguage), 'error');
      return;
    }

    const headers = ['Name', 'Platform', 'Score', 'Urgency', 'Email', 'Company', 'Comment', 'Profile', 'Date', 'Contacted'];
    const rows = this.leads.map(l => [
      l.name || '',
      l.platform,
      l.score,
      l.urgencyLevel || 'medium',
      l.email || '',
      l.company || '',
      `"${(l.comment || '').replace(/"/g, '""')}"`,
      l.profileUrl || '',
      new Date(l.timestamp).toLocaleString(),
      l.contacted ? 'Yes' : 'No'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-hunter-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  loadSettings() {
    document.getElementById('geminiKey').value = this.settings.geminiKey || '';
    document.getElementById('hubspotKey').value = this.settings.hubspotKey || '';
    document.getElementById('hunterKey').value = this.settings.hunterKey || '';
    document.getElementById('webhookUrl').value = this.settings.webhookUrl || '';
    document.getElementById('googleSheetsUrl').value = this.settings.googleSheetsUrl || '';
    document.getElementById('minWords').value = this.settings.minWords || 8;
    document.getElementById('customKeywords').value = this.settings.customKeywords || '';
    document.getElementById('competitors').value = this.settings.competitors || this.getDefaultSettings().competitors;
    document.getElementById('notifyHotLeads').checked = this.settings.notifyHotLeads !== false;
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled || false;
    document.getElementById('autoSendHubspot').checked = this.settings.autoSendHubspot || false;
    document.getElementById('autoSendWebhook').checked = this.settings.autoSendWebhook || false;
    document.getElementById('autoSendSheets').checked = this.settings.autoSendSheets || false;
    document.getElementById('autoFindEmail').checked = this.settings.autoFindEmail || false;
    document.getElementById('darkMode').checked = this.settings.darkMode || false;
    document.getElementById('imageScanning').checked = this.settings.imageScanning !== false; // Default true

    // Apply dark mode
    this.applyDarkMode(this.settings.darkMode);

    // Industries
    const industries = this.settings.industries || [];
    document.querySelectorAll('input[name="industry"]').forEach(checkbox => {
      checkbox.checked = industries.includes(checkbox.value);
    });

    // Update category counts
    this.updateCategoryCounts();

    // Auto-populate keywords if industries selected but keywords empty
    if (industries.length > 0 && !this.settings.customKeywords) {
      this.updateKeywordsForIndustries();
    }

    // Update scanning button state
    if (!this.settings.scanning) {
      const btn = document.getElementById('toggleScanning');
      const indicator = document.getElementById('statusIndicator');
      btn.innerHTML = `<span class="btn-icon">▶️</span> ${t('resumeScanning', this.currentLanguage)}`;
      indicator.classList.add('paused');
      indicator.querySelector('.status-text').textContent = t('statusPaused', this.currentLanguage);
    }

    // Update language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect && this.settings.language) {
      languageSelect.value = this.settings.language;
    }

    // Check Hunter credits if key exists
    if (this.settings.hunterKey) {
      this.checkHunterCredits();
    }
  }

  async checkHunterCredits() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_HUNTER_CREDITS' });
      if (response.success) {
        document.getElementById('hunterCredits').style.display = 'block';
        document.getElementById('hunterCreditsCount').textContent =
          `${response.searches.available - response.searches.used}/${response.searches.available}`;
      }
    } catch (e) {
      // Ignore
    }
  }

  async saveSettings() {
    const industries = [];
    document.querySelectorAll('input[name="industry"]:checked').forEach(cb => {
      industries.push(cb.value);
    });

    this.settings = {
      ...this.settings,
      geminiKey: document.getElementById('geminiKey').value,
      hubspotKey: document.getElementById('hubspotKey').value,
      hunterKey: document.getElementById('hunterKey').value,
      webhookUrl: document.getElementById('webhookUrl').value,
      googleSheetsUrl: document.getElementById('googleSheetsUrl').value,
      minWords: parseInt(document.getElementById('minWords').value) || 8,
      customKeywords: document.getElementById('customKeywords').value,
      competitors: document.getElementById('competitors').value,
      industries,
      notifyHotLeads: document.getElementById('notifyHotLeads').checked,
      soundEnabled: document.getElementById('soundEnabled').checked,
      autoSendHubspot: document.getElementById('autoSendHubspot').checked,
      autoSendWebhook: document.getElementById('autoSendWebhook').checked,
      autoSendSheets: document.getElementById('autoSendSheets').checked,
      autoFindEmail: document.getElementById('autoFindEmail').checked,
      darkMode: document.getElementById('darkMode').checked,
      imageScanning: document.getElementById('imageScanning').checked
    };

    await chrome.storage.local.set({ settings: this.settings });

    // Apply dark mode immediately
    this.applyDarkMode(this.settings.darkMode);

    // Notify background script
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: this.settings });

    const btn = document.getElementById('saveSettings');
    const originalText = btn.textContent;
    btn.textContent = t('saved', this.currentLanguage);
    btn.classList.add('loading');

    // Show success toast
    this.showToast(t('saved', this.currentLanguage), 'success');

    setTimeout(() => {
      btn.textContent = t('saveSettings', this.currentLanguage);
      btn.classList.remove('loading');
    }, 2000);
  }

  async saveLeads() {
    await chrome.storage.local.set({ leads: this.leads });
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    if (seconds < 60) return t('now', this.currentLanguage);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('minutes', this.currentLanguage)}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('hours', this.currentLanguage)}`;
    return `${Math.floor(seconds / 86400)}${t('days', this.currentLanguage)}`;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - 'success', 'error', or 'info'
   * @param {number} duration - Duration in ms (default 3000)
   */
  showToast(message, type = 'success', duration = 3000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Add ripple effect to element
   * @param {HTMLElement} element - Element to add ripple to
   * @param {Event} event - Click event
   */
  createRipple(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove());
  }

  /**
   * Animate number counting up
   * @param {HTMLElement} element - Element containing the number
   * @param {number} target - Target number
   * @param {number} duration - Animation duration in ms
   */
  animateNumber(element, target, duration = 500) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const animate = () => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        element.textContent = target;
        element.classList.add('animated');
        setTimeout(() => element.classList.remove('animated'), 500);
      } else {
        element.textContent = Math.round(current);
        requestAnimationFrame(animate);
      }
    };

    if (start !== target) {
      requestAnimationFrame(animate);
    }
  }

  /**
   * Setup ripple effects on all buttons
   */
  setupRippleEffects() {
    document.querySelectorAll('.btn, .tab').forEach(element => {
      element.addEventListener('click', (e) => this.createRipple(element, e));
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
