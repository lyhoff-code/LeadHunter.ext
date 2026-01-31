// Lead Hunter AI - Gemini API Integration

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Analyze a comment using Gemini AI
 * @param {string} comment - The comment text to analyze
 * @param {object} settings - User settings including API key
 * @returns {object} - Analysis result with score and reasoning
 */
export async function analyzeWithGemini(comment, settings) {
  if (!settings.geminiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = buildAnalysisPrompt(comment, settings);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${settings.geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response
    const analysis = JSON.parse(text);
    return normalizeAnalysis(analysis);
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw error;
  }
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(comment, settings) {
  const industries = settings.industries?.join(', ') || 'small businesses';
  const competitors = settings.competitors?.split('\n').filter(c => c.trim()).join(', ') || 'Ruby, Smith.ai';

  return `Eres un experto en ventas B2B analizando comentarios de redes sociales para encontrar leads potenciales.

El servicio que vendemos: AI Receptionist / Virtual Receptionist para pequeños negocios (${industries}).

Analiza el siguiente comentario y determina si es un lead potencial:

COMENTARIO:
"${comment}"

CRITERIOS DE EVALUACIÓN:
1. ¿Expresa dolor relacionado con: llamadas perdidas, citas, recepción, atención al cliente, comunicación?
2. ¿Parece ser dueño o gerente de un negocio?
3. ¿Menciona competidores (${competitors})? Esto indica que busca solución activamente.
4. ¿La industria coincide con nuestro target?
5. ¿Qué tan frustrado o urgente suena el mensaje?

RESPONDE EN JSON con este formato exacto:
{
  "score": <número del 1-10, donde 10 es lead perfecto>,
  "isBusinessOwner": <boolean>,
  "mentionsCompetitor": <boolean>,
  "painPoints": [<lista de dolores específicos detectados>],
  "industry": "<industria detectada o 'unknown'>",
  "reasoning": "<explicación breve de por qué este score en español>",
  "urgency": "<critical|high|medium|low>",
  "frustrationLevel": <1-10 qué tan frustrado suena>,
  "buyingIntent": "<none|researching|comparing|ready_to_buy>",
  "suggestedApproach": "<cold|warm|hot - cómo debería ser el approach>"
}

SCORING GUIDE:
- 9-10: Dueño de negocio con dolor claro y urgente, menciona competidores o busca solución
- 7-8: Dolor claro relacionado con llamadas/citas, probable dueño de negocio
- 5-6: Indica problemas de comunicación pero contexto incompleto
- 3-4: Menciona temas relacionados pero sin dolor claro
- 1-2: No es lead relevante

URGENCY GUIDE:
- critical: Palabras como "urgente", "desesperado", "ayuda", "ahora mismo", múltiples signos de exclamación
- high: "hoy", "esta semana", "frustrado", "harto", "cansado de"
- medium: "necesito", "buscando", "problema"
- low: Menciones casuales sin urgencia aparente

Sé conservador. Solo scores altos para leads genuinos.`;
}

/**
 * Normalize the analysis response
 */
function normalizeAnalysis(analysis) {
  return {
    score: Math.max(1, Math.min(10, parseInt(analysis.score) || 1)),
    isBusinessOwner: Boolean(analysis.isBusinessOwner),
    mentionsCompetitor: Boolean(analysis.mentionsCompetitor),
    painPoints: Array.isArray(analysis.painPoints) ? analysis.painPoints : [],
    industry: analysis.industry || 'unknown',
    reasoning: analysis.reasoning || 'No analysis available',
    urgency: ['critical', 'high', 'medium', 'low'].includes(analysis.urgency) ? analysis.urgency : 'medium',
    frustrationLevel: Math.max(1, Math.min(10, parseInt(analysis.frustrationLevel) || 5)),
    buyingIntent: ['none', 'researching', 'comparing', 'ready_to_buy'].includes(analysis.buyingIntent)
      ? analysis.buyingIntent : 'none',
    suggestedApproach: ['cold', 'warm', 'hot'].includes(analysis.suggestedApproach)
      ? analysis.suggestedApproach : 'warm'
  };
}

/**
 * Test the Gemini API connection
 */
export async function testGeminiConnection(apiKey) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Responde solo con: "OK"'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API error');
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
