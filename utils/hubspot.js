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

  // Map lead data to HubSpot contact properties
  const properties = {
    // Standard properties
    firstname: extractFirstName(lead.name),
    lastname: extractLastName(lead.name),
    jobtitle: lead.title || '',

    // Custom properties (need to be created in HubSpot first)
    // Using notes and description for custom data
    hs_lead_status: lead.score >= 8 ? 'NEW' : 'OPEN',

    // Store lead data in notes
    notes_last_contacted: '',
    notes_last_activity: new Date().toISOString(),

    // Additional data in message field or custom props
    message: formatLeadMessage(lead)
  };

  // Add email if available
  if (lead.email) {
    properties.email = lead.email;
  }

  // Add phone if available
  if (lead.phone) {
    properties.phone = lead.phone;
  }

  // Add company name if available
  if (lead.company) {
    properties.company = lead.company;
  }

  // Add website if available
  if (lead.website) {
    properties.website = lead.website;
  } else if (lead.profileUrl) {
    // If we have a profile URL that looks like LinkedIn, try to add it
    if (lead.profileUrl.includes('linkedin.com')) {
      properties.hs_linkedinid = lead.profileUrl;
    }
    // Store profile URL in website field as fallback
    properties.website = lead.profileUrl;
  }

  // Add address if available
  if (lead.address) {
    properties.address = lead.address;
  }

  // Add industry if available
  if (lead.industry && lead.industry !== 'unknown') {
    properties.industry = lead.industry;
  }

  try {
    // First, try to create the contact
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

    // If contact exists (409 conflict), update instead
    if (response.status === 409) {
      const errorData = await response.json();
      const existingId = errorData.message?.match(/ID: (\d+)/)?.[1];

      if (existingId) {
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
 * Update an existing contact
 */
async function updateContact(contactId, lead, apiKey) {
  const properties = {
    notes_last_activity: new Date().toISOString(),
    message: formatLeadMessage(lead)
  };

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
    throw new Error(error.message || 'Failed to update contact');
  }

  const data = await response.json();

  // Add note about the new lead activity
  await createNote(contactId, lead, apiKey);

  return data;
}

/**
 * Create a note associated with a contact
 */
async function createNote(contactId, lead, apiKey) {
  // Different note format for scraped businesses vs social media leads
  let noteBody;

  if (lead.leadType === 'scraped') {
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
