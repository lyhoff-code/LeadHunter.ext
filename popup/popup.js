// Lead Hunter AI - Popup Controller

class PopupController {
  constructor() {
    this.currentTab = 'dashboard';
    this.leads = [];
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderDashboard();
    this.renderLeadsList();
    this.loadSettings();
  }

  async loadData() {
    const storage = await chrome.storage.local.get(['leads', 'settings', 'stats']);
    this.leads = storage.leads || [];
    this.settings = storage.settings || this.getDefaultSettings();
    this.stats = storage.stats || { scanned: 0 };
  }

  getDefaultSettings() {
    return {
      geminiKey: '',
      hubspotKey: '',
      minWords: 8,
      customKeywords: '',
      competitors: 'Ruby\nSmith.ai\nAnswering Service',
      industries: ['plumbing', 'hvac', 'dental', 'contractors', 'medical', 'legal', 'realestate', 'automotive'],
      notifyHotLeads: true,
      soundEnabled: false,
      scanning: true
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

    // Settings
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

    // Modal
    document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('leadModal').addEventListener('click', (e) => {
      if (e.target.id === 'leadModal') this.closeModal();
    });

    // Modal actions
    document.getElementById('copyDraft').addEventListener('click', () => this.copyDraft());
    document.getElementById('sendToHubspot').addEventListener('click', () => this.sendToHubspot());
    document.getElementById('openProfile').addEventListener('click', () => this.openProfile());
    document.getElementById('markContacted').addEventListener('click', () => this.markContacted());

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

    // Recent leads
    const recentList = document.getElementById('recentLeadsList');
    const recent = this.leads.slice(0, 5);

    if (recent.length === 0) {
      recentList.innerHTML = '<p class="empty-state">No hay leads detectados aun. Navega por las plataformas para empezar.</p>';
      return;
    }

    recentList.innerHTML = recent.map(lead => this.renderLeadCard(lead)).join('');
    this.attachLeadCardListeners();
  }

  renderLeadsList() {
    const list = document.getElementById('allLeadsList');

    if (this.leads.length === 0) {
      list.innerHTML = '<p class="empty-state">No hay leads detectados.</p>';
      return;
    }

    list.innerHTML = this.leads.map(lead => this.renderLeadCard(lead)).join('');
    this.attachLeadCardListeners();
  }

  renderLeadCard(lead) {
    const scoreClass = lead.score >= 8 ? 'hot' : lead.score >= 5 ? 'warm' : 'cold';
    const timeAgo = this.getTimeAgo(lead.timestamp);

    return `
      <div class="lead-card ${scoreClass}" data-lead-id="${lead.id}">
        <div class="lead-card-header">
          <span class="lead-card-name">${this.escapeHtml(lead.name || 'Usuario')}</span>
          <span class="lead-card-score">${lead.score}/10</span>
        </div>
        <p class="lead-card-preview">${this.escapeHtml(lead.comment.substring(0, 80))}...</p>
        <div class="lead-card-meta">
          <span>${lead.platform}</span>
          <span>${timeAgo}</span>
        </div>
      </div>
    `;
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

    const list = document.getElementById('allLeadsList');
    if (filtered.length === 0) {
      list.innerHTML = '<p class="empty-state">No hay leads con estos filtros.</p>';
      return;
    }

    list.innerHTML = filtered.map(lead => this.renderLeadCard(lead)).join('');
    this.attachLeadCardListeners();
  }

  openLeadModal(lead) {
    this.currentLead = lead;

    document.getElementById('modalName').textContent = lead.name || 'Usuario';
    document.getElementById('modalTitle').textContent = lead.title || lead.bio || '';
    document.getElementById('modalPlatform').textContent = lead.platform;
    document.getElementById('modalScore').textContent = lead.score;
    document.getElementById('modalComment').textContent = lead.comment;
    document.getElementById('modalAnalysis').textContent = lead.analysis || 'Analisis no disponible';
    document.getElementById('modalDraft').value = lead.messageDraft || '';

    document.getElementById('leadModal').classList.add('active');
  }

  closeModal() {
    document.getElementById('leadModal').classList.remove('active');
    this.currentLead = null;
  }

  async copyDraft() {
    const draft = document.getElementById('modalDraft').value;
    await navigator.clipboard.writeText(draft);

    const btn = document.getElementById('copyDraft');
    const originalText = btn.textContent;
    btn.textContent = 'Copiado!';
    setTimeout(() => btn.textContent = originalText, 2000);
  }

  async sendToHubspot() {
    if (!this.currentLead) return;

    const btn = document.getElementById('sendToHubspot');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Enviando...';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TO_HUBSPOT',
        lead: this.currentLead
      });

      if (response.success) {
        btn.innerHTML = '<span class="btn-icon">✅</span> Enviado!';
        this.currentLead.sentToHubspot = true;
        await this.saveLeads();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btn.innerHTML = '<span class="btn-icon">❌</span> Error';
      console.error('HubSpot error:', error);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">📊</span> Enviar a HubSpot';
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

    const btn = document.getElementById('markContacted');
    btn.innerHTML = '<span class="btn-icon">✅</span> Contactado';
    btn.disabled = true;
  }

  async toggleScanning() {
    this.settings.scanning = !this.settings.scanning;
    await chrome.storage.local.set({ settings: this.settings });

    const btn = document.getElementById('toggleScanning');
    const indicator = document.getElementById('statusIndicator');

    if (this.settings.scanning) {
      btn.innerHTML = '<span class="btn-icon">⏸️</span> Pausar Escaneo';
      indicator.classList.remove('paused');
      indicator.querySelector('.status-text').textContent = 'Activo';
    } else {
      btn.innerHTML = '<span class="btn-icon">▶️</span> Reanudar Escaneo';
      indicator.classList.add('paused');
      indicator.querySelector('.status-text').textContent = 'Pausado';
    }

    chrome.runtime.sendMessage({ type: 'TOGGLE_SCANNING', enabled: this.settings.scanning });
  }

  exportLeads() {
    if (this.leads.length === 0) {
      alert('No hay leads para exportar');
      return;
    }

    const headers = ['Nombre', 'Plataforma', 'Score', 'Comentario', 'Perfil', 'Fecha', 'Contactado'];
    const rows = this.leads.map(l => [
      l.name || '',
      l.platform,
      l.score,
      `"${(l.comment || '').replace(/"/g, '""')}"`,
      l.profileUrl || '',
      new Date(l.timestamp).toLocaleString(),
      l.contacted ? 'Si' : 'No'
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
    document.getElementById('minWords').value = this.settings.minWords || 8;
    document.getElementById('customKeywords').value = this.settings.customKeywords || '';
    document.getElementById('competitors').value = this.settings.competitors || '';
    document.getElementById('notifyHotLeads').checked = this.settings.notifyHotLeads !== false;
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled || false;

    // Industries
    const industries = this.settings.industries || [];
    document.querySelectorAll('input[name="industry"]').forEach(checkbox => {
      checkbox.checked = industries.includes(checkbox.value);
    });

    // Update scanning button state
    if (!this.settings.scanning) {
      const btn = document.getElementById('toggleScanning');
      const indicator = document.getElementById('statusIndicator');
      btn.innerHTML = '<span class="btn-icon">▶️</span> Reanudar Escaneo';
      indicator.classList.add('paused');
      indicator.querySelector('.status-text').textContent = 'Pausado';
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
      minWords: parseInt(document.getElementById('minWords').value) || 8,
      customKeywords: document.getElementById('customKeywords').value,
      competitors: document.getElementById('competitors').value,
      industries,
      notifyHotLeads: document.getElementById('notifyHotLeads').checked,
      soundEnabled: document.getElementById('soundEnabled').checked
    };

    await chrome.storage.local.set({ settings: this.settings });

    // Notify background script
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: this.settings });

    const btn = document.getElementById('saveSettings');
    const originalText = btn.textContent;
    btn.textContent = 'Guardado!';
    btn.style.background = '#10b981';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  }

  async saveLeads() {
    await chrome.storage.local.set({ leads: this.leads });
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
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
