// Lead Hunter AI - HubSpot CRM Integration

const HUBSPOT_API_URL = 'https://api.hubapi.com';

/**
 * Send a lead to HubSpot as a contact
 * @param {object} lead - The lead object
 * @param {string} apiKey - HubSpot Private App token
 * @returns {object} - HubSpot contact response
 */
export async function sendToHubSpot(lead, apiKey) {
  if (!apiKey) {
    throw new Error('HubSpot API key not configured');
  }

  // First, check if contact already exists (by email, phone, or name)
  const existingContact = await findExistingContact(lead, apiKey);

  if (existingContact) {
    console.log('[HubSpot] Contact already exists, updating with new data...');
    return await updateContact(existingContact.id, lead, apiKey, existingContact.properties);
  }

  // Map lead data to HubSpot contact properties (only standard properties)
  const properties = {
    firstname: extractFirstName(lead.name),
    lastname: extractLastName(lead.name)
  };

  // Add email if available (important for HubSpot deduplication)
  if (lead.email) {
    properties.email = lead.email;
  }

  // Add phone if available
  if (lead.phone) {
    properties.phone = lead.phone;
  }

  // Add company name if available
  if (lead.company || lead.name) {
    properties.company = lead.company || lead.name;
  }

  // Add website if available
  if (lead.website) {
    properties.website = lead.website;
  } else if (lead.profileUrl && !lead.profileUrl.includes('facebook.com') && !lead.profileUrl.includes('linkedin.com')) {
    properties.website = lead.profileUrl;
  }

  // Add job title if available
  if (lead.title) {
    properties.jobtitle = lead.title;
  }

  // Add lifecycle stage
  properties.lifecyclestage = 'lead';

  // Add hs_lead_status
  if (lead.score >= 8) {
    properties.hs_lead_status = 'NEW';
  } else if (lead.leadType === 'pain') {
    properties.hs_lead_status = 'OPEN';
  } else {
    properties.hs_lead_status = 'OPEN';
  }

  try {
    // Create the contact
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (response.ok) {
      const data = await response.json();

      // Create a note with full lead details
      await createNote(data.id, lead, apiKey);

      return data;
    }

    // If contact exists (409 conflict), update instead (fallback)
    if (response.status === 409) {
      const errorData = await response.json();
      const existingId = errorData.message?.match(/ID: (\d+)/)?.[1];

      if (existingId) {
        console.log('[HubSpot] Conflict detected, updating existing contact...');
        return await updateContact(existingId, lead, apiKey);
      }
    }

    const error = await response.json();
    throw new Error(error.message || 'Failed to create contact');
  } catch (error) {
    console.error('HubSpot error:', error);
    throw error;
  }
}

/**
 * Update an existing contact - only fills in missing data, doesn't overwrite
 * @param {string} contactId - HubSpot contact ID
 * @param {object} lead - Lead data
 * @param {string} apiKey - HubSpot API key
 * @param {object} existingProps - Existing contact properties (optional)
 */
async function updateContact(contactId, lead, apiKey, existingProps = {}) {
  // Build properties to update - only add if not already present in contact
  const properties = {};

  // Helper to check if property is empty/missing
  const isEmpty = (value) => !value || value.trim() === '';

  // Update phone if lead has it and contact doesn't
  if (lead.phone && isEmpty(existingProps.phone)) {
    properties.phone = lead.phone;
    console.log('[HubSpot] Adding missing phone:', lead.phone);
  }

  // Update email if lead has it and contact doesn't
  if (lead.email && isEmpty(existingProps.email)) {
    properties.email = lead.email;
    console.log('[HubSpot] Adding missing email:', lead.email);
  }

  // Update company if lead has it and contact doesn't
  if (lead.company && isEmpty(existingProps.company)) {
    properties.company = lead.company;
    console.log('[HubSpot] Adding missing company:', lead.company);
  }

  // Update website if lead has it and contact doesn't
  if (lead.website && isEmpty(existingProps.website)) {
    properties.website = lead.website;
    console.log('[HubSpot] Adding missing website:', lead.website);
  }

  // Update job title if lead has it and contact doesn't
  if (lead.title && isEmpty(existingProps.jobtitle)) {
    properties.jobtitle = lead.title;
    console.log('[HubSpot] Adding missing job title:', lead.title);
  }

  // Update address if lead has it and contact doesn't
  if (lead.address && isEmpty(existingProps.address)) {
    properties.address = lead.address;
    console.log('[HubSpot] Adding missing address:', lead.address);
  }

  // Only make API call if we have properties to update
  if (Object.keys(properties).length > 0) {
    console.log('[HubSpot] Updating contact with:', properties);
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('HubSpot update warning:', error.message);
      // Don't throw - continue to add note
    } else {
      console.log('[HubSpot] Contact updated successfully');
    }
  } else {
    console.log('[HubSpot] No new data to add - contact already has all info');
  }

  // Add note about the new lead activity
  await createNote(contactId, lead, apiKey);

  return { id: contactId, updated: true };
}

/**
 * Create a note associated with a contact
 */
async function createNote(contactId, lead, apiKey) {
  // Different note format based on lead type
  let noteBody;

  if (lead.leadType === 'image') {
    noteBody = `
🎯 Lead Hunter AI - Contacto de Imagen

📷 Tipo: Extraído de imagen con AI Vision
📱 Plataforma: ${lead.platform}
📅 Fecha: ${new Date(lead.timestamp).toLocaleString()}
🏷️ Industria: ${lead.industry || 'N/A'}

📞 Información de Contacto:
${lead.phone ? `• Teléfono: ${lead.phone}` : ''}
${lead.email ? `• Email: ${lead.email}` : ''}
${lead.website ? `• Website: ${lead.website}` : ''}
${lead.address ? `• Dirección: ${lead.address}` : ''}
${lead.company ? `• Empresa: ${lead.company}` : ''}

🔗 Fuente: ${lead.profileUrl || 'N/A'}
🖼️ Imagen: ${lead.imageSource || 'N/A'}

💡 Nota: ${lead.notes || 'Contacto extraído automáticamente de imagen usando Gemini Vision AI.'}
`.trim();
  } else if (lead.leadType === 'scraped') {
    noteBody = `
🎯 Lead Hunter AI - Negocio Scrapeado

🏢 Tipo: Negocio extraído automáticamente
📱 Plataforma: ${lead.platform}
📅 Fecha: ${new Date(lead.timestamp).toLocaleString()}
🏷️ Industria: ${lead.industry || 'N/A'}

📞 Información de Contacto:
${lead.phone ? `• Teléfono: ${lead.phone}` : ''}
${lead.email ? `• Email: ${lead.email}` : ''}
${lead.website ? `• Website: ${lead.website}` : ''}
${lead.address ? `• Dirección: ${lead.address}` : ''}

🔗 Página original: ${lead.profileUrl || 'N/A'}

💡 Nota: Este contacto fue extraído automáticamente de una página de negocio.
No hay señales de dolor explícitas - usar enfoque frío para contactar.
`.trim();
  } else {
    noteBody = `
🎯 Lead Hunter AI - Lead Detectado

📊 Score: ${lead.score}/10
📱 Plataforma: ${lead.platform}
📅 Fecha: ${new Date(lead.timestamp).toLocaleString()}
🏷️ Tipo: ${lead.leadType === 'pain' ? '🔥 Lead con Dolor' : lead.leadType === 'prospect' ? '👤 Prospecto' : '📌 Manual'}

💬 Comentario Original:
"${lead.comment || 'N/A'}"

🔍 Análisis:
${lead.analysis || 'N/A'}

${lead.painPoints?.length ? `\n😣 Puntos de Dolor:\n${lead.painPoints.map(p => `• ${p}`).join('\n')}` : ''}

${lead.mentionsCompetitor ? '\n⚠️ Menciona competidor - Buscando solución activamente' : ''}

🔗 Perfil: ${lead.profileUrl || 'N/A'}

📝 Mensaje Sugerido:
${lead.messageDraft || 'N/A'}
`.trim();
  }

  try {
    // Create engagement (note)
    await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: noteBody
        },
        associations: [{
          to: { id: contactId },
          types: [{
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 202 // Note to Contact
          }]
        }]
      })
    });
  } catch (error) {
    console.warn('Could not create note:', error);
    // Don't throw - contact was created successfully
  }
}

/**
 * Format lead data for HubSpot message field
 */
function formatLeadMessage(lead) {
  return `[Lead Hunter AI] Score: ${lead.score}/10 | ${lead.platform} | "${lead.comment.substring(0, 200)}..."`;
}

/**
 * Extract first name from full name
 */
function extractFirstName(fullName) {
  if (!fullName) return 'Lead';
  const parts = fullName.trim().split(' ');
  return parts[0] || 'Lead';
}

/**
 * Extract last name from full name
 */
function extractLastName(fullName) {
  if (!fullName) return 'Hunter';
  const parts = fullName.trim().split(' ');
  return parts.slice(1).join(' ') || 'Hunter';
}

/**
 * Test HubSpot connection
 */
export async function testHubSpotConnection(apiKey) {
  try {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API error');
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Search for existing contact by name
 */
export async function searchContact(name, apiKey) {
  try {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'firstname',
            operator: 'CONTAINS_TOKEN',
            value: name.split(' ')[0]
          }]
        }],
        limit: 5
      })
    });

    if (!response.ok) {
      return { results: [] };
    }

    return await response.json();
  } catch (error) {
    return { results: [] };
  }
}

/**
 * Find existing contact by email, phone, or name to prevent duplicates
 * @param {object} lead - The lead object
 * @param {string} apiKey - HubSpot API key
 * @returns {object|null} - Existing contact or null
 */
async function findExistingContact(lead, apiKey) {
  const filterGroups = [];

  // Search by email (most reliable)
  if (lead.email) {
    filterGroups.push({
      filters: [{
        propertyName: 'email',
        operator: 'EQ',
        value: lead.email
      }]
    });
  }

  // Search by phone (normalize phone for comparison)
  if (lead.phone) {
    const normalizedPhone = lead.phone.replace(/\D/g, '');
    // Try exact match first
    filterGroups.push({
      filters: [{
        propertyName: 'phone',
        operator: 'CONTAINS_TOKEN',
        value: normalizedPhone.slice(-10) // Last 10 digits
      }]
    });
  }

  // Search by name (firstname + lastname)
  if (lead.name) {
    const firstName = extractFirstName(lead.name);
    const lastName = extractLastName(lead.name);

    if (firstName && firstName !== 'Lead' && lastName && lastName !== 'Hunter') {
      filterGroups.push({
        filters: [
          {
            propertyName: 'firstname',
            operator: 'EQ',
            value: firstName
          },
          {
            propertyName: 'lastname',
            operator: 'EQ',
            value: lastName
          }
        ]
      });
    }
  }

  if (filterGroups.length === 0) {
    return null;
  }

  try {
    // Search with OR logic between filter groups
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: filterGroups,
        properties: ['email', 'phone', 'firstname', 'lastname', 'company', 'website', 'jobtitle'],
        limit: 10
      })
    });

    if (!response.ok) {
      console.warn('HubSpot search failed:', await response.text());
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Find best match - prioritize email match, then phone, then name
      for (const contact of data.results) {
        const props = contact.properties;

        // Exact email match is definitive
        if (lead.email && props.email &&
            props.email.toLowerCase() === lead.email.toLowerCase()) {
          console.log('[HubSpot] Found existing contact by email:', props.email);
          return contact;
        }
      }

      // Check phone match
      if (lead.phone) {
        const leadPhoneNormalized = lead.phone.replace(/\D/g, '').slice(-10);
        for (const contact of data.results) {
          const props = contact.properties;
          if (props.phone) {
            const contactPhoneNormalized = props.phone.replace(/\D/g, '').slice(-10);
            if (leadPhoneNormalized === contactPhoneNormalized) {
              console.log('[HubSpot] Found existing contact by phone:', props.phone);
              return contact;
            }
          }
        }
      }

      // Check name match (require both first and last name)
      if (lead.name) {
        const leadFirst = extractFirstName(lead.name).toLowerCase();
        const leadLast = extractLastName(lead.name).toLowerCase();

        for (const contact of data.results) {
          const props = contact.properties;
          if (props.firstname && props.lastname) {
            const contactFirst = props.firstname.toLowerCase();
            const contactLast = props.lastname.toLowerCase();

            if (leadFirst === contactFirst && leadLast === contactLast) {
              console.log('[HubSpot] Found existing contact by name:', props.firstname, props.lastname);
              return contact;
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('HubSpot search error:', error);
    return null;
  }
}
