// Lead Hunter AI - Gemini API Integration

import { translations } from './i18n.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Helper to get translation
function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en[key] || key;
}

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
 * Build the analysis prompt in the selected language
 */
function buildAnalysisPrompt(comment, settings) {
  const lang = settings.language || 'en';
  const industries = settings.industries?.join(', ') || 'small businesses';
  const competitors = settings.competitors?.split('\n').filter(c => c.trim()).join(', ') || 'Ruby, Smith.ai';

  return `${t('geminiPromptRole', lang)}

${t('geminiPromptService', lang)} (${industries}).

${t('geminiPromptAnalyze', lang)}

${t('geminiPromptComment', lang)}
"${comment}"

${t('geminiPromptCriteria', lang)}
1. ${t('geminiPromptCriteria1', lang)}
2. ${t('geminiPromptCriteria2', lang)}
3. ${t('geminiPromptCriteria3', lang)} (${competitors})
4. ${t('geminiPromptCriteria4', lang)}
5. ${t('geminiPromptCriteria5', lang)}

${t('geminiPromptRespondJson', lang)}
{
  "score": <${t('geminiPromptScoreDesc', lang)}>,
  "isBusinessOwner": <boolean>,
  "mentionsCompetitor": <boolean>,
  "painPoints": [<${t('geminiPromptPainPointsDesc', lang)}>],
  "industry": "<${t('geminiPromptIndustryDesc', lang)}>",
  "reasoning": "<${t('geminiPromptReasoningDesc', lang)}>",
  "urgency": "<critical|high|medium|low>",
  "frustrationLevel": <1-10>,
  "buyingIntent": "<none|researching|comparing|ready_to_buy>",
  "suggestedApproach": "<cold|warm|hot>"
}

${t('geminiPromptScoringGuide', lang)}
- ${t('geminiPromptScore910', lang)}
- ${t('geminiPromptScore78', lang)}
- ${t('geminiPromptScore56', lang)}
- ${t('geminiPromptScore34', lang)}
- ${t('geminiPromptScore12', lang)}

${t('geminiPromptUrgencyGuide', lang)}
- ${t('geminiPromptUrgencyCritical', lang)}
- ${t('geminiPromptUrgencyHigh', lang)}
- ${t('geminiPromptUrgencyMedium', lang)}
- ${t('geminiPromptUrgencyLow', lang)}

${t('geminiPromptConservative', lang)}`;
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
