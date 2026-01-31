// Lead Hunter AI - Popup Controller

import { generateAppsScriptCode } from '../utils/google-sheets.js';
import { translations, t, getCurrentLanguage } from '../utils/i18n.js';

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
    this.settings = storage.settings || this.getDefaultSettings();
    this.stats = storage.stats || { scanned: 0, leadsFound: 0, hotLeads: 0 };
  }

  getDefaultSettings() {
    return {
      geminiKey: '',
      hubspotKey: '',
      hunterKey: '',
      webhookUrl: '',
      googleSheetsUrl: '',
      minWords: 8,
      customKeywords: '',
      competitors: 'Ruby\nSmith.ai\nAnswering Service',
      industries: ['plumbing', 'hvac', 'dental', 'contractors', 'medical', 'legal', 'realestate', 'automotive'],
      notifyHotLeads: true,
      soundEnabled: false,
      scanning: true,
      autoSendWebhook: false,
      autoSendSheets: false,
      autoFindEmail: false
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

    document.getElementById('leadsToday').textContent = leadsToday;
    document.getElementById('leadsTotal').textContent = this.leads.length;
    document.getElementById('hotLeads').textContent = hotLeads;
    document.getElementById('scannedComments').textContent = this.stats.scanned || 0;

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
    const scoreClass = lead.score >= 8 ? 'hot' : lead.score >= 5 ? 'warm' : 'cold';
    const timeAgo = this.getTimeAgo(lead.timestamp);
    const urgencyEmoji = this.getUrgencyEmoji(lead.urgencyLevel);

    return `
      <div class="lead-card ${scoreClass}" data-lead-id="${lead.id}">
        <div class="lead-card-header">
          <span class="lead-card-name">${this.escapeHtml(lead.name || 'Usuario')}</span>
          <div>
            <span class="lead-card-urgency">${urgencyEmoji}</span>
            <span class="lead-card-score">${lead.score}/10</span>
          </div>
        </div>
        <p class="lead-card-preview">${this.escapeHtml((lead.comment || '').substring(0, 80))}...</p>
        <div class="lead-card-meta">
          <span>${lead.platform}</span>
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
      alert(t('enterWebhookFirst', this.currentLanguage));
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
      alert(t('noLeadsToExport', this.currentLanguage));
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
    document.getElementById('competitors').value = this.settings.competitors || '';
    document.getElementById('notifyHotLeads').checked = this.settings.notifyHotLeads !== false;
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled || false;
    document.getElementById('autoSendWebhook').checked = this.settings.autoSendWebhook || false;
    document.getElementById('autoSendSheets').checked = this.settings.autoSendSheets || false;
    document.getElementById('autoFindEmail').checked = this.settings.autoFindEmail || false;

    // Industries
    const industries = this.settings.industries || [];
    document.querySelectorAll('input[name="industry"]').forEach(checkbox => {
      checkbox.checked = industries.includes(checkbox.value);
    });

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
      autoSendWebhook: document.getElementById('autoSendWebhook').checked,
      autoSendSheets: document.getElementById('autoSendSheets').checked,
      autoFindEmail: document.getElementById('autoFindEmail').checked
    };

    await chrome.storage.local.set({ settings: this.settings });

    // Notify background script
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: this.settings });

    const btn = document.getElementById('saveSettings');
    const originalText = btn.textContent;
    btn.textContent = t('saved', this.currentLanguage);
    btn.style.background = '#10b981';

    setTimeout(() => {
      btn.textContent = t('saveSettings', this.currentLanguage);
      btn.style.background = '';
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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
