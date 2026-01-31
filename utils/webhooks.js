// Lead Hunter AI - Webhooks/n8n Integration

/**
 * Send lead to webhook (n8n, Zapier, Make, custom)
 * @param {object} lead - Lead data
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<object>} - Response
 */
export async function sendToWebhook(lead, webhookUrl) {
  if (!webhookUrl) {
    throw new Error('No webhook URL configured');
  }

  const payload = {
    // Lead info
    id: lead.id,
    name: lead.name,
    title: lead.title,
    bio: lead.bio,
    profileUrl: lead.profileUrl,
    platform: lead.platform,

    // Comment & analysis
    comment: lead.comment,
    score: lead.score,
    urgencyLevel: lead.urgencyLevel || 'medium',
    analysis: lead.analysis,
    painPoints: lead.painPoints || [],

    // Flags
    isBusinessOwner: lead.isBusinessOwner,
    mentionsCompetitor: lead.mentionsCompetitor,

    // Generated content
    messageDraft: lead.messageDraft,

    // Metadata
    timestamp: lead.timestamp,
    detectedAt: new Date().toISOString(),

    // Enrichment data (if available)
    email: lead.email || null,
    company: lead.company || null,
    website: lead.website || null,
    phone: lead.phone || null,

    // Source
    source: 'Lead Hunter AI',
    version: '1.0.0'
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadHunterAI/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    // Try to parse response
    let data;
    try {
      data = await response.json();
    } catch {
      data = { success: true };
    }

    return {
      success: true,
      data,
      sentAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}

/**
 * Test webhook connection
 * @param {string} webhookUrl - Webhook URL to test
 * @returns {Promise<object>} - Test result
 */
export async function testWebhook(webhookUrl) {
  const testPayload = {
    test: true,
    message: 'Lead Hunter AI webhook test',
    timestamp: new Date().toISOString(),
    source: 'Lead Hunter AI'
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create n8n workflow template
 * @returns {object} - n8n workflow JSON
 */
export function generateN8nWorkflowTemplate() {
  return {
    name: "Lead Hunter AI - New Lead Handler",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "lead-hunter",
          responseMode: "onReceived",
          responseData: "allEntries"
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [250, 300]
      },
      {
        parameters: {
          conditions: {
            number: [{
              value1: "={{$json[\"score\"]}}",
              operation: "largerEqual",
              value2: 8
            }]
          }
        },
        name: "Hot Lead?",
        type: "n8n-nodes-base.if",
        position: [450, 300]
      },
      {
        parameters: {
          channel: "#leads",
          text: "🔥 *Hot Lead Detected!*\n\n*Name:* {{$json[\"name\"]}}\n*Platform:* {{$json[\"platform\"]}}\n*Score:* {{$json[\"score\"]}}/10\n\n*Comment:*\n{{$json[\"comment\"]}}\n\n*Profile:* {{$json[\"profileUrl\"]}}"
        },
        name: "Slack Notification",
        type: "n8n-nodes-base.slack",
        position: [650, 200]
      },
      {
        parameters: {
          resource: "contact",
          operation: "create",
          email: "={{$json[\"email\"]}}",
          additionalFields: {
            firstName: "={{$json[\"name\"].split(' ')[0]}}",
            lastName: "={{$json[\"name\"].split(' ').slice(1).join(' ')}}",
            company: "={{$json[\"company\"]}}",
            description: "={{$json[\"comment\"]}}"
          }
        },
        name: "Create HubSpot Contact",
        type: "n8n-nodes-base.hubspot",
        position: [650, 400]
      }
    ],
    connections: {
      "Webhook": {
        main: [[{ node: "Hot Lead?", type: "main", index: 0 }]]
      },
      "Hot Lead?": {
        main: [
          [{ node: "Slack Notification", type: "main", index: 0 }],
          [{ node: "Create HubSpot Contact", type: "main", index: 0 }]
        ]
      }
    }
  };
}
