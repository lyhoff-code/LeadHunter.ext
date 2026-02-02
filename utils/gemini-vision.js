// Gemini Vision API - Image Analysis for Lead Detection

const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Analyze an image using Gemini Vision API
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} apiKey - Gemini API key
 * @param {string[]} industries - Selected industries for context
 * @returns {Promise<object>} - Extracted contact information
 */
export async function analyzeImageWithGemini(imageUrl, apiKey, industries = []) {
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Convert image URL to base64
  const imageData = await fetchImageAsBase64(imageUrl);

  if (!imageData) {
    throw new Error('Failed to fetch image');
  }

  const industryContext = industries.length > 0
    ? `Focus on businesses in these industries: ${industries.join(', ')}.`
    : '';

  const prompt = `Analyze this image and extract any business contact information you can find.
${industryContext}

Look for:
- Business name or person name
- Email addresses
- Phone numbers (any format)
- Website URLs
- Physical address
- Job title or role
- Company/business type
- Social media handles

Also determine if this image contains:
- A business card
- A flyer or advertisement
- A screenshot with contact info
- A social media profile
- An invoice or receipt with business info
- Any other business-related content

Return your response as JSON with this exact structure:
{
  "hasContactInfo": true/false,
  "confidence": "high"/"medium"/"low",
  "imageType": "business_card"/"flyer"/"screenshot"/"profile"/"invoice"/"other"/"none",
  "data": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "phone": "extracted phone or null",
    "website": "extracted website or null",
    "address": "extracted address or null",
    "company": "extracted company name or null",
    "jobTitle": "extracted job title or null",
    "industry": "detected industry or null",
    "socialMedia": {
      "facebook": "handle or null",
      "instagram": "handle or null",
      "linkedin": "handle or null",
      "twitter": "handle or null"
    }
  },
  "rawText": "any text found in the image",
  "notes": "any relevant observations"
}

If no contact information is found, return hasContactInfo: false with empty data.
Only return the JSON, no additional text.`;

  try {
    const response = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: imageData.mimeType,
                data: imageData.base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;

  } catch (error) {
    console.error('Gemini Vision error:', error);
    throw error;
  }
}

/**
 * Fetch image and convert to base64
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
async function fetchImageAsBase64(imageUrl) {
  try {
    // Handle data URLs directly
    if (imageUrl.startsWith('data:')) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          mimeType: matches[1],
          base64: matches[2]
        };
      }
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';

    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * Check if an image URL is valid and should be analyzed
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (!url) return false;

  // Skip common non-useful images
  const skipPatterns = [
    /emoji/i,
    /avatar.*default/i,
    /placeholder/i,
    /spacer/i,
    /pixel\.gif/i,
    /tracking/i,
    /analytics/i,
    /beacon/i,
    /1x1/i,
    /blank\./i,
    /transparent\./i,
    /icon.*small/i,
    /badge/i,
    /button/i,
    /logo.*small/i,
    /sprite/i
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(url)) return false;
  }

  // Must be an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
  const isDataUrl = url.startsWith('data:image/');
  const hasImageInUrl = /\/(image|photo|pic|img|media)\//i.test(url);

  return hasImageExtension || isDataUrl || hasImageInUrl;
}

/**
 * Check if image dimensions suggest it might contain useful content
 * @param {HTMLImageElement} img - Image element
 * @returns {boolean}
 */
export function isImageSizeRelevant(img) {
  const minWidth = 100;
  const minHeight = 100;
  const maxAspectRatio = 10; // Skip very thin banners

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width < minWidth || height < minHeight) return false;

  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  if (aspectRatio > maxAspectRatio) return false;

  return true;
}

/**
 * Generate a unique hash for an image URL to avoid re-processing
 * @param {string} url - Image URL
 * @returns {string}
 */
export function getImageHash(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
