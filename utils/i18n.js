// Lead Hunter AI - Internationalization (i18n)

export const translations = {
  en: {
    // Header
    appName: 'Lead Hunter AI',
    statusActive: 'Active',
    statusPaused: 'Paused',

    // Tabs
    tabDashboard: 'Dashboard',
    tabLeads: 'Leads',
    tabSettings: 'Settings',

    // Dashboard
    leadsToday: 'Leads Today',
    leadsTotal: 'Total Leads',
    hotLeads: 'Hot Leads',
    scanned: 'Scanned',
    byUrgency: 'By Urgency',
    urgencyCritical: 'Critical',
    urgencyHigh: 'High',
    urgencyMedium: 'Medium',
    urgencyLow: 'Low',
    recentLeads: 'Recent Leads',
    noLeadsYet: 'No leads detected yet. Browse the platforms to start.',
    pauseScanning: 'Pause',
    resumeScanning: 'Resume',
    exportCsv: 'Export CSV',

    // Leads list
    allPlatforms: 'All platforms',
    allScores: 'All scores',
    hot: 'Hot (8-10)',
    warm: 'Warm (5-7)',
    cold: 'Cold (1-4)',
    allUrgency: 'All urgency',
    allTypes: 'All types',
    painLeads: '🔥 Pain Leads',
    prospectLeads: '👤 Prospects',
    scrapedLeads: '🏢 Scraped',
    autoDetected: 'Auto-detected',
    manuallySaved: 'Manually saved',
    noLeads: 'No leads detected.',
    noLeadsFilter: 'No leads match these filters.',

    // Manual Lead Form
    addLead: 'Add Lead',
    addManualLead: 'Add Manual Lead',
    businessName: 'Business Name',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    address: 'Address',
    category: 'Category / Industry',
    notes: 'Notes',
    cancel: 'Cancel',
    saveLead: 'Save Lead',
    leadSaved: 'Lead saved successfully!',
    fillAtLeastOne: 'Please fill at least name, phone, or email',

    // Settings
    settingsAI: 'AI & Analysis',
    geminiApiKey: 'Gemini API Key',
    getFree: 'Get free',
    settingsCRM: 'CRM Integrations',
    hubspotApiKey: 'HubSpot API Key',
    createPrivateApp: 'Create Private App',
    autoSendHubspot: 'Send automatically to HubSpot',
    settingsWebhook: 'Webhooks / n8n',
    webhookUrl: 'Webhook URL',
    webhookDesc: 'Automatically send leads to n8n, Zapier, Make, etc.',
    autoSendWebhook: 'Send automatically when lead detected',
    testWebhook: 'Test Webhook',
    settingsSheets: 'Google Sheets',
    sheetsUrl: 'Google Sheets Web App URL',
    viewInstructions: 'View instructions',
    autoSendSheets: 'Send automatically to Google Sheets',
    settingsEmail: 'Email Finder (Hunter.io)',
    hunterApiKey: 'Hunter.io API Key',
    freeSearches: '25 free searches/month',
    autoFindEmail: 'Find email automatically',
    searchesRemaining: 'Searches remaining',
    settingsFilters: 'Pain Filters',
    customKeywords: 'Custom keywords (one per line)',
    minWords: 'Minimum words per comment',
    settingsIndustries: 'Target Industries',
    // Industry Categories
    categoryHomeServices: '🔧 Home Services',
    categoryHealthcare: '🏥 Healthcare',
    categoryProfessional: '💼 Professional Services',
    categoryAutomotive: '🚗 Automotive',
    categoryOther: '📦 Other Services',
    // Home Services
    industryPlumbing: 'Plumbers',
    industryHvac: 'HVAC',
    industryElectrical: 'Electricians',
    industryContractors: 'Contractors',
    industryRoofing: 'Roofing',
    industryLandscaping: 'Landscaping',
    industryCleaning: 'Cleaning',
    industryPest: 'Pest Control',
    industryPainting: 'Painting',
    industryLocksmith: 'Locksmith',
    // Healthcare
    industryDental: 'Dentists',
    industryMedical: 'Medical Clinics',
    industryChiropractic: 'Chiropractors',
    industryVeterinary: 'Veterinarians',
    industryOptometry: 'Optometrists',
    industryMedspa: 'Med Spas',
    // Professional
    industryLegal: 'Legal / Law Firms',
    industryAccounting: 'Accounting',
    industryInsurance: 'Insurance',
    industryRealestate: 'Real Estate',
    industryMortgage: 'Mortgage',
    industryFinancial: 'Financial Advisors',
    // Automotive
    industryAutomotive: 'Auto Repair',
    industryTowing: 'Towing',
    industryAutobody: 'Auto Body',
    industryCarwash: 'Car Wash',
    // Other
    industryPhotography: 'Photography',
    industrySalon: 'Salons & Spas',
    industryFitness: 'Fitness / Gyms',
    industryRestaurant: 'Restaurants',
    industryMoving: 'Moving Companies',
    industryStorage: 'Storage',
    settingsNotifications: 'Notifications',
    notifyHotLeads: 'Notify hot leads (8+)',
    soundAlert: 'Sound alert',
    settingsImageScanning: 'Image Scanning (AI Vision)',
    enableImageScanning: 'Scan images for contacts',
    imageScanningDesc: 'Uses Gemini Vision to extract contact info from images (business cards, flyers, etc.)',
    imageLeads: '📷 From Images',
    settingsCompetitors: 'Competitors to Detect',
    competitorsDesc: 'If they mention these, they are actively looking for a solution',
    settingsLanguage: 'Language',
    settingsAppearance: 'Appearance',
    darkMode: 'Dark mode (night mode)',
    saveSettings: 'Save Settings',
    saved: 'Saved!',

    // Lead Modal
    originalComment: 'Original Comment',
    aiAnalysis: 'AI Analysis',
    analysisNotAvailable: 'Analysis not available',
    industry: 'Industry',
    intent: 'Intent',
    approach: 'Approach',
    painPointsDetected: 'Pain Points Detected',
    suggestedMessage: 'Suggested Message',
    copy: 'Copy',
    copied: 'Copied!',
    quickReply: 'Quick Reply',
    contactInfo: 'Contact Information',
    email: 'Email',
    search: 'Search',
    company: 'Company',
    addCompany: 'Add company...',
    website: 'Website',
    notes: 'Notes',
    addNotes: 'Add notes about this lead...',
    sendToHubspot: 'HubSpot',
    sendToWebhook: 'Webhook',
    sendToSheets: 'Sheets',
    screenshot: 'Screenshot',
    viewProfile: 'View Profile',
    markContacted: 'Mark Contacted',
    contacted: 'Contacted',
    respondIn: 'Respond in',
    timeExpired: 'Time expired!',
    ago: 'ago',
    previousContact: 'You already contacted this person before',

    // Time
    now: 'Now',
    minutes: 'm',
    hours: 'h',
    days: 'd',

    // Sheets Modal
    setupSheets: 'Setup Google Sheets',
    sheetsStep1: 'Create a new Google Sheet',
    sheetsStep2: 'Go to Extensions > Apps Script',
    sheetsStep3: 'Paste this code:',
    copyCode: 'Copy Code',
    sheetsStep4: 'Click Deploy > New deployment',
    sheetsStep5: 'Select "Web app"',
    sheetsStep6: 'In "Who has access" select "Anyone"',
    sheetsStep7: 'Click Deploy and copy the URL',
    sheetsStep8: 'Paste the URL in Lead Hunter settings',

    // Errors
    noLeadsToExport: 'No leads to export',
    enterWebhookFirst: 'Enter a webhook URL first',
    testing: 'Testing...',
    success: 'Success!',
    error: 'Error',

    // Tooltips - Urgency
    tooltipCritical: 'CRITICAL: Actively looking NOW. Respond within 2 hours!',
    tooltipHigh: 'HIGH: Urgent need, respond within 12 hours',
    tooltipMedium: 'MEDIUM: Interested but not urgent. 24h to respond',
    tooltipLow: 'LOW: Passive interest. Can respond within 72h',

    // Tooltips - Score
    tooltipScoreHot: 'HOT LEAD (8-10): High buying intent, ideal prospect',
    tooltipScoreWarm: 'WARM LEAD (5-7): Some interest, needs nurturing',
    tooltipScoreCold: 'COLD LEAD (1-4): Low intent, long-term prospect',
    tooltipScoreManual: 'MANUAL: Saved manually, no AI score',
    tooltipScoreProspect: 'PROSPECT: Business owner in target industry, no explicit pain signal yet',
    tooltipScraped: 'SCRAPED: Contact info extracted from business page automatically',
    tooltipImage: 'IMAGE: Contact info extracted from image using AI Vision',

    // Tooltips - Dashboard
    tooltipLeadsToday: 'Leads captured in the last 24 hours',
    tooltipLeadsTotal: 'Total leads in your database',
    tooltipHotLeads: 'Leads with score 8 or higher (high intent)',
    tooltipScanned: 'Comments analyzed by the extension',

    // Notifications
    notifLeadDetected: 'Lead Detected!',
    notifContactFoundImage: 'Contact Found in Image!',
    notifIn: 'on',

    // Gemini Prompt
    geminiPromptRole: 'You are a B2B sales expert analyzing social media comments to find potential leads.',
    geminiPromptService: 'The service we sell: AI Receptionist / Virtual Receptionist for small businesses',
    geminiPromptAnalyze: 'Analyze the following comment and determine if it is a potential lead:',
    geminiPromptComment: 'COMMENT:',
    geminiPromptCriteria: 'EVALUATION CRITERIA:',
    geminiPromptCriteria1: 'Does it express pain related to: missed calls, appointments, reception, customer service, communication?',
    geminiPromptCriteria2: 'Does it appear to be a business owner or manager?',
    geminiPromptCriteria3: 'Does it mention competitors? This indicates they are actively looking for a solution.',
    geminiPromptCriteria4: 'Does the industry match our target?',
    geminiPromptCriteria5: 'How frustrated or urgent does the message sound?',
    geminiPromptRespondJson: 'RESPOND IN JSON with this exact format:',
    geminiPromptScoreDesc: 'number from 1-10, where 10 is perfect lead',
    geminiPromptPainPointsDesc: 'list of specific pain points detected',
    geminiPromptIndustryDesc: 'detected industry or unknown',
    geminiPromptReasoningDesc: 'brief explanation of why this score',
    geminiPromptScoringGuide: 'SCORING GUIDE:',
    geminiPromptScore910: '9-10: Business owner with clear and urgent pain, mentions competitors or looking for solution',
    geminiPromptScore78: '7-8: Clear pain related to calls/appointments, likely business owner',
    geminiPromptScore56: '5-6: Indicates communication issues but incomplete context',
    geminiPromptScore34: '3-4: Mentions related topics but no clear pain',
    geminiPromptScore12: '1-2: Not a relevant lead',
    geminiPromptUrgencyGuide: 'URGENCY GUIDE:',
    geminiPromptUrgencyCritical: 'critical: Words like "urgent", "desperate", "help", "right now", multiple exclamation marks',
    geminiPromptUrgencyHigh: 'high: "today", "this week", "frustrated", "fed up", "tired of"',
    geminiPromptUrgencyMedium: 'medium: "I need", "looking for", "problem"',
    geminiPromptUrgencyLow: 'low: Casual mentions without apparent urgency',
    geminiPromptConservative: 'Be conservative. Only high scores for genuine leads.'
  },

  es: {
    // Header
    appName: 'Lead Hunter AI',
    statusActive: 'Activo',
    statusPaused: 'Pausado',

    // Tabs
    tabDashboard: 'Dashboard',
    tabLeads: 'Leads',
    tabSettings: 'Config',

    // Dashboard
    leadsToday: 'Leads Hoy',
    leadsTotal: 'Total Leads',
    hotLeads: 'Leads Calientes',
    scanned: 'Escaneados',
    byUrgency: 'Por Urgencia',
    urgencyCritical: 'Crítico',
    urgencyHigh: 'Alto',
    urgencyMedium: 'Medio',
    urgencyLow: 'Bajo',
    recentLeads: 'Leads Recientes',
    noLeadsYet: 'No hay leads detectados. Navega por las plataformas para empezar.',
    pauseScanning: 'Pausar',
    resumeScanning: 'Reanudar',
    exportCsv: 'Exportar CSV',

    // Leads list
    allPlatforms: 'Todas las plataformas',
    allScores: 'Todos los scores',
    hot: 'Calientes (8-10)',
    warm: 'Tibios (5-7)',
    cold: 'Fríos (1-4)',
    allUrgency: 'Toda urgencia',
    allTypes: 'Todos los tipos',
    painLeads: '🔥 Leads con Dolor',
    prospectLeads: '👤 Prospectos',
    scrapedLeads: '🏢 Scrapeados',
    autoDetected: 'Auto-detectado',
    manuallySaved: 'Guardado manual',
    noLeads: 'No hay leads detectados.',
    noLeadsFilter: 'No hay leads con estos filtros.',

    // Manual Lead Form
    addLead: 'Agregar Lead',
    addManualLead: 'Agregar Lead Manual',
    businessName: 'Nombre del Negocio',
    phone: 'Teléfono',
    email: 'Correo',
    website: 'Sitio Web',
    address: 'Dirección',
    category: 'Categoría / Industria',
    notes: 'Notas',
    cancel: 'Cancelar',
    saveLead: 'Guardar Lead',
    leadSaved: '¡Lead guardado exitosamente!',
    fillAtLeastOne: 'Por favor llena al menos nombre, teléfono o correo',

    // Settings
    settingsAI: 'IA y Análisis',
    geminiApiKey: 'Gemini API Key',
    getFree: 'Obtener gratis',
    settingsCRM: 'Integraciones CRM',
    hubspotApiKey: 'HubSpot API Key',
    createPrivateApp: 'Crear Private App',
    autoSendHubspot: 'Enviar automáticamente a HubSpot',
    settingsWebhook: 'Webhooks / n8n',
    webhookUrl: 'Webhook URL',
    webhookDesc: 'Envía leads automáticamente a n8n, Zapier, Make, etc.',
    autoSendWebhook: 'Enviar automáticamente al detectar lead',
    testWebhook: 'Probar Webhook',
    settingsSheets: 'Google Sheets',
    sheetsUrl: 'Google Sheets Web App URL',
    viewInstructions: 'Ver instrucciones',
    autoSendSheets: 'Enviar automáticamente a Google Sheets',
    settingsEmail: 'Buscador de Email (Hunter.io)',
    hunterApiKey: 'Hunter.io API Key',
    freeSearches: '25 búsquedas gratis/mes',
    autoFindEmail: 'Buscar email automáticamente',
    searchesRemaining: 'Búsquedas restantes',
    settingsFilters: 'Filtros de Dolor',
    customKeywords: 'Keywords personalizadas (una por línea)',
    minWords: 'Mínimo de palabras por comentario',
    settingsIndustries: 'Industrias Objetivo',
    // Categorías de Industrias
    categoryHomeServices: '🔧 Servicios del Hogar',
    categoryHealthcare: '🏥 Salud',
    categoryProfessional: '💼 Servicios Profesionales',
    categoryAutomotive: '🚗 Automotriz',
    categoryOther: '📦 Otros Servicios',
    // Servicios del Hogar
    industryPlumbing: 'Plomeros',
    industryHvac: 'HVAC / Climatización',
    industryElectrical: 'Electricistas',
    industryContractors: 'Contratistas',
    industryRoofing: 'Techadores',
    industryLandscaping: 'Jardinería',
    industryCleaning: 'Limpieza',
    industryPest: 'Control de Plagas',
    industryPainting: 'Pintores',
    industryLocksmith: 'Cerrajeros',
    // Salud
    industryDental: 'Dentistas',
    industryMedical: 'Clínicas Médicas',
    industryChiropractic: 'Quiroprácticos',
    industryVeterinary: 'Veterinarios',
    industryOptometry: 'Optometristas',
    industryMedspa: 'Med Spas',
    // Profesionales
    industryLegal: 'Abogados / Bufetes',
    industryAccounting: 'Contadores',
    industryInsurance: 'Seguros',
    industryRealestate: 'Bienes Raíces',
    industryMortgage: 'Hipotecas',
    industryFinancial: 'Asesores Financieros',
    // Automotriz
    industryAutomotive: 'Talleres Mecánicos',
    industryTowing: 'Grúas',
    industryAutobody: 'Carrocerías',
    industryCarwash: 'Lavado de Autos',
    // Otros
    industryPhotography: 'Fotografía',
    industrySalon: 'Salones y Spas',
    industryFitness: 'Gimnasios',
    industryRestaurant: 'Restaurantes',
    industryMoving: 'Mudanzas',
    industryStorage: 'Almacenamiento',
    settingsNotifications: 'Notificaciones',
    notifyHotLeads: 'Notificar leads calientes (8+)',
    soundAlert: 'Sonido de alerta',
    settingsImageScanning: 'Escaneo de Imágenes (AI Vision)',
    enableImageScanning: 'Escanear imágenes para contactos',
    imageScanningDesc: 'Usa Gemini Vision para extraer info de contacto de imágenes (tarjetas, flyers, etc.)',
    imageLeads: '📷 De Imágenes',
    settingsCompetitors: 'Competidores a Detectar',
    competitorsDesc: 'Si mencionan estos, están buscando solución activamente',
    settingsLanguage: 'Idioma',
    settingsAppearance: 'Apariencia',
    darkMode: 'Modo oscuro (modo noche)',
    saveSettings: 'Guardar Configuración',
    saved: '¡Guardado!',

    // Lead Modal
    originalComment: 'Comentario Original',
    aiAnalysis: 'Análisis IA',
    analysisNotAvailable: 'Análisis no disponible',
    industry: 'Industria',
    intent: 'Intent',
    approach: 'Approach',
    painPointsDetected: 'Puntos de Dolor Detectados',
    suggestedMessage: 'Mensaje Sugerido',
    copy: 'Copiar',
    copied: '¡Copiado!',
    quickReply: 'Respuesta Rápida',
    contactInfo: 'Información de Contacto',
    email: 'Email',
    search: 'Buscar',
    company: 'Empresa',
    addCompany: 'Agregar empresa...',
    website: 'Website',
    notes: 'Notas',
    addNotes: 'Agregar notas sobre este lead...',
    sendToHubspot: 'HubSpot',
    sendToWebhook: 'Webhook',
    sendToSheets: 'Sheets',
    screenshot: 'Screenshot',
    viewProfile: 'Ver Perfil',
    markContacted: 'Marcar Contactado',
    contacted: 'Contactado',
    respondIn: 'Responder en',
    timeExpired: '¡Tiempo vencido!',
    ago: 'hace',
    previousContact: 'Ya contactaste a esta persona antes',

    // Time
    now: 'Ahora',
    minutes: 'm',
    hours: 'h',
    days: 'd',

    // Sheets Modal
    setupSheets: 'Configurar Google Sheets',
    sheetsStep1: 'Crea una nueva Google Sheet',
    sheetsStep2: 'Ve a Extensiones > Apps Script',
    sheetsStep3: 'Pega este código:',
    copyCode: 'Copiar Código',
    sheetsStep4: 'Click en Implementar > Nueva implementación',
    sheetsStep5: 'Selecciona "Aplicación web"',
    sheetsStep6: 'En "Quién tiene acceso" selecciona "Cualquier persona"',
    sheetsStep7: 'Click en Implementar y copia la URL',
    sheetsStep8: 'Pega la URL en la configuración de Lead Hunter',

    // Errors
    noLeadsToExport: 'No hay leads para exportar',
    enterWebhookFirst: 'Ingresa una URL de webhook primero',
    testing: 'Probando...',
    success: '¡Exitoso!',
    error: 'Error',

    // Tooltips - Urgency
    tooltipCritical: 'CRÍTICO: Buscando AHORA. ¡Responde en 2 horas!',
    tooltipHigh: 'ALTO: Necesidad urgente, responde en 12 horas',
    tooltipMedium: 'MEDIO: Interesado pero no urgente. 24h para responder',
    tooltipLow: 'BAJO: Interés pasivo. Puedes responder en 72h',

    // Tooltips - Score
    tooltipScoreHot: 'LEAD CALIENTE (8-10): Alta intención de compra',
    tooltipScoreWarm: 'LEAD TIBIO (5-7): Algo de interés, necesita seguimiento',
    tooltipScoreCold: 'LEAD FRÍO (1-4): Baja intención, prospecto a largo plazo',
    tooltipScoreManual: 'MANUAL: Guardado manualmente, sin score de IA',
    tooltipScoreProspect: 'PROSPECTO: Dueño de negocio en industria objetivo, sin señal de dolor explícita',
    tooltipScraped: 'SCRAPEADO: Info de contacto extraída automáticamente de página de negocio',
    tooltipImage: 'IMAGEN: Info de contacto extraída de imagen usando AI Vision',

    // Tooltips - Dashboard
    tooltipLeadsToday: 'Leads capturados en las últimas 24 horas',
    tooltipLeadsTotal: 'Total de leads en tu base de datos',
    tooltipHotLeads: 'Leads con score 8 o más (alta intención)',
    tooltipScanned: 'Comentarios analizados por la extensión',

    // Notifications
    notifLeadDetected: '¡Lead Detectado!',
    notifContactFoundImage: '¡Contacto Encontrado en Imagen!',
    notifIn: 'en',

    // Gemini Prompt
    geminiPromptRole: 'Eres un experto en ventas B2B analizando comentarios de redes sociales para encontrar leads potenciales.',
    geminiPromptService: 'El servicio que vendemos: AI Receptionist / Virtual Receptionist para pequeños negocios',
    geminiPromptAnalyze: 'Analiza el siguiente comentario y determina si es un lead potencial:',
    geminiPromptComment: 'COMENTARIO:',
    geminiPromptCriteria: 'CRITERIOS DE EVALUACIÓN:',
    geminiPromptCriteria1: '¿Expresa dolor relacionado con: llamadas perdidas, citas, recepción, atención al cliente, comunicación?',
    geminiPromptCriteria2: '¿Parece ser dueño o gerente de un negocio?',
    geminiPromptCriteria3: '¿Menciona competidores? Esto indica que busca solución activamente.',
    geminiPromptCriteria4: '¿La industria coincide con nuestro target?',
    geminiPromptCriteria5: '¿Qué tan frustrado o urgente suena el mensaje?',
    geminiPromptRespondJson: 'RESPONDE EN JSON con este formato exacto:',
    geminiPromptScoreDesc: 'número del 1-10, donde 10 es lead perfecto',
    geminiPromptPainPointsDesc: 'lista de dolores específicos detectados',
    geminiPromptIndustryDesc: 'industria detectada o unknown',
    geminiPromptReasoningDesc: 'explicación breve de por qué este score',
    geminiPromptScoringGuide: 'GUÍA DE SCORING:',
    geminiPromptScore910: '9-10: Dueño de negocio con dolor claro y urgente, menciona competidores o busca solución',
    geminiPromptScore78: '7-8: Dolor claro relacionado con llamadas/citas, probable dueño de negocio',
    geminiPromptScore56: '5-6: Indica problemas de comunicación pero contexto incompleto',
    geminiPromptScore34: '3-4: Menciona temas relacionados pero sin dolor claro',
    geminiPromptScore12: '1-2: No es lead relevante',
    geminiPromptUrgencyGuide: 'GUÍA DE URGENCIA:',
    geminiPromptUrgencyCritical: 'critical: Palabras como "urgente", "desesperado", "ayuda", "ahora mismo", múltiples signos de exclamación',
    geminiPromptUrgencyHigh: 'high: "hoy", "esta semana", "frustrado", "harto", "cansado de"',
    geminiPromptUrgencyMedium: 'medium: "necesito", "buscando", "problema"',
    geminiPromptUrgencyLow: 'low: Menciones casuales sin urgencia aparente',
    geminiPromptConservative: 'Sé conservador. Solo scores altos para leads genuinos.'
  }
};

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {string} lang - Language code (en/es)
 * @returns {string} - Translated text
 */
export function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en[key] || key;
}

/**
 * Get current language from storage
 * @returns {Promise<string>} - Language code
 */
export async function getCurrentLanguage() {
  const storage = await chrome.storage.local.get(['settings']);
  return storage.settings?.language || 'en';
}

/**
 * Set language
 * @param {string} lang - Language code
 */
export async function setLanguage(lang) {
  const storage = await chrome.storage.local.get(['settings']);
  const settings = storage.settings || {};
  settings.language = lang;
  await chrome.storage.local.set({ settings });
}
