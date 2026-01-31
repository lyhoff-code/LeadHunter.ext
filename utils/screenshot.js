// Lead Hunter AI - Screenshot Capture

/**
 * Capture screenshot of a DOM element
 * Uses html2canvas library (loaded dynamically)
 *
 * @param {HTMLElement} element - Element to capture
 * @returns {Promise<string>} - Base64 image data
 */
export async function captureElement(element) {
  if (!element) {
    throw new Error('No element provided');
  }

  // Load html2canvas if not already loaded
  await loadHtml2Canvas();

  try {
    const canvas = await window.html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
  }
}

/**
 * Capture visible tab screenshot (requires activeTab permission)
 * @returns {Promise<string>} - Base64 image data
 */
export async function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

/**
 * Load html2canvas library dynamically
 */
async function loadHtml2Canvas() {
  if (window.html2canvas) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  });
}

/**
 * Save screenshot to storage
 * @param {string} leadId - Lead ID
 * @param {string} imageData - Base64 image data
 */
export async function saveScreenshot(leadId, imageData) {
  const storage = await chrome.storage.local.get(['screenshots']);
  const screenshots = storage.screenshots || {};

  screenshots[leadId] = {
    data: imageData,
    capturedAt: new Date().toISOString()
  };

  // Limit storage (keep last 50 screenshots)
  const keys = Object.keys(screenshots);
  if (keys.length > 50) {
    const sortedKeys = keys.sort((a, b) => {
      return new Date(screenshots[a].capturedAt) - new Date(screenshots[b].capturedAt);
    });
    const toDelete = sortedKeys.slice(0, keys.length - 50);
    toDelete.forEach(key => delete screenshots[key]);
  }

  await chrome.storage.local.set({ screenshots });
}

/**
 * Get screenshot for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<object|null>} - Screenshot data or null
 */
export async function getScreenshot(leadId) {
  const storage = await chrome.storage.local.get(['screenshots']);
  const screenshots = storage.screenshots || {};
  return screenshots[leadId] || null;
}

/**
 * Download screenshot as file
 * @param {string} imageData - Base64 image data
 * @param {string} filename - Filename
 */
export function downloadScreenshot(imageData, filename = 'lead-screenshot.png') {
  const link = document.createElement('a');
  link.href = imageData;
  link.download = filename;
  link.click();
}

/**
 * Create a simple text-based "screenshot" when image capture fails
 * @param {object} lead - Lead data
 * @returns {string} - Text representation
 */
export function createTextSnapshot(lead) {
  return `
╔══════════════════════════════════════════════════════════════╗
║  LEAD HUNTER AI - Lead Snapshot                               ║
╠══════════════════════════════════════════════════════════════╣
║  Name: ${(lead.name || 'Unknown').padEnd(52)} ║
║  Platform: ${(lead.platform || 'Unknown').padEnd(48)} ║
║  Score: ${String(lead.score || 0).padEnd(51)} ║
║  Urgency: ${(lead.urgencyLevel || 'medium').padEnd(49)} ║
╠══════════════════════════════════════════════════════════════╣
║  Comment:                                                     ║
║  ${wrapText(lead.comment || '', 60).join('\n║  ')}
╠══════════════════════════════════════════════════════════════╣
║  Profile: ${(lead.profileUrl || 'N/A').substring(0, 49).padEnd(49)} ║
║  Captured: ${new Date().toISOString().padEnd(48)} ║
╚══════════════════════════════════════════════════════════════╝
`.trim();
}

/**
 * Wrap text to specified width
 */
function wrapText(text, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine.padEnd(width));
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine.padEnd(width));
  }

  return lines.length ? lines : ['(empty)'.padEnd(width)];
}
