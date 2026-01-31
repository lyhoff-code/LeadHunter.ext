// Lead Hunter AI - TikTok Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'TikTok',
    selectors: {
      commentContainer: [
        '[data-e2e="comment-item"]',
        '.tiktok-comment-item',
        '[class*="CommentItem"]',
        '[class*="DivCommentItemContainer"]'
      ].join(', '),

      commentText: [
        '[data-e2e="comment-level-1"] span',
        '.tiktok-comment-text',
        '[class*="CommentText"]',
        'p[class*="PCommentText"]'
      ].join(', '),

      authorName: [
        '[data-e2e="comment-username-1"]',
        '.tiktok-comment-username',
        '[class*="CommentUsername"]',
        'a[class*="StyledLink"]'
      ].join(', '),

      authorLink: 'a[href*="/@"]',
      authorTitle: '',
      authorBio: '',

      videoCaption: [
        '[data-e2e="browse-video-desc"]',
        '.tiktok-video-desc',
        '[class*="VideoDesc"]'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class TikTokScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Get video caption for context
          const captionElement = document.querySelector(config.selectors.videoCaption);
          const videoCaption = captionElement?.innerText?.trim() || '';

          // Check if video is business-related
          const isBusinessVideo = this.isBusinessRelated(videoCaption);

          const commentElements = document.querySelectorAll(config.selectors.commentContainer);
          commentElements.forEach(comment => {
            try {
              const textElement = comment.querySelector(config.selectors.commentText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 15) return;

              // Skip generic comments
              if (this.isGenericComment(text)) return;

              const authorElement = comment.querySelector(config.selectors.authorName);
              const authorLinkElement = comment.querySelector(config.selectors.authorLink);

              const author = {
                name: authorElement?.innerText?.trim() || 'TikTok User',
                title: ''
              };

              const profileUrl = authorLinkElement?.href || '';

              // Include if business video OR comment shows business pain
              if (isBusinessVideo || this.hasBusinessPain(text)) {
                comments.push({
                  text: `[TikTok] ${text}`,
                  author,
                  profileUrl,
                  element: comment
                });
              }
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }

        isBusinessRelated(text) {
          const keywords = [
            'business', 'entrepreneur', 'small business',
            'side hustle', 'self employed', 'boss', 'ceo',
            'startup', 'business tip', 'business owner',
            'work life', 'my company', 'contractor'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }

        isGenericComment(text) {
          const patterns = [
            /^[🔥❤️👍👏💯😂🤣😍😭💀]+$/,
            /^(lol|lmao|omg|fr|no way|same|facts?|real|slay)!*$/i,
            /^(this|me|mood|vibe|period|ate)!*$/i,
            /^.{1,5}$/
          ];
          return patterns.some(p => p.test(text.trim()));
        }

        hasBusinessPain(text) {
          const keywords = [
            'my business', 'i own', 'my shop', 'my salon',
            'so many calls', 'cant keep up', 'overwhelmed',
            'need receptionist', 'phone ringing', 'customers',
            'appointments', 'booking', 'scheduling'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }
      }

      new TikTokScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
