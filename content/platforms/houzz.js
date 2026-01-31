// Lead Hunter AI - Houzz Platform Scanner
// Houzz is for home contractors and designers

(function() {
  'use strict';

  const config = {
    name: 'Houzz',
    selectors: {
      commentContainer: [
        '.review-item',
        '[data-testid="review"]',
        '.hz-review-item'
      ].join(', '),

      commentText: [
        '.review-body',
        '.review-text',
        '[data-testid="review-body"]'
      ].join(', '),

      authorName: [
        '.review-author',
        '.reviewer-name'
      ].join(', '),

      authorLink: 'a[href*="/user/"]',
      authorTitle: '.reviewer-info',
      authorBio: '',

      // Discussion forums
      discussionContainer: [
        '.discussion-item',
        '.advice-item',
        '[class*="Discussion"]'
      ].join(', '),

      discussionText: [
        '.discussion-body',
        '.question-text',
        '.advice-text'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class HouzzScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Scan reviews
          const reviews = document.querySelectorAll(config.selectors.commentContainer);
          reviews.forEach(review => {
            try {
              const textElement = review.querySelector(config.selectors.commentText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              if (this.isRelevant(text)) {
                const author = {
                  name: review.querySelector(config.selectors.authorName)?.innerText?.trim() || 'Homeowner',
                  title: review.querySelector(config.selectors.authorTitle)?.innerText?.trim() || ''
                };

                const profileUrl = review.querySelector(config.selectors.authorLink)?.href || '';

                comments.push({
                  text: `[Houzz Review] ${text}`,
                  author,
                  profileUrl,
                  element: review
                });
              }
            } catch (e) {
              // Skip
            }
          });

          // Scan discussions (pros asking for advice)
          const discussions = document.querySelectorAll(config.selectors.discussionContainer);
          discussions.forEach(discussion => {
            try {
              const textElement = discussion.querySelector(config.selectors.discussionText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              // Professionals asking business questions
              const author = {
                name: discussion.querySelector('a[href*="/pro/"], a[href*="/user/"]')?.innerText?.trim() || 'Houzz User',
                title: discussion.querySelector('.user-title, .pro-badge')?.innerText?.trim() || ''
              };

              const profileUrl = discussion.querySelector('a[href*="/pro/"], a[href*="/user/"]')?.href || '';

              comments.push({
                text: `[Houzz Discussion] ${text}`,
                author,
                profileUrl,
                element: discussion
              });
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }

        isRelevant(text) {
          const keywords = [
            'no response', 'never responded', 'hard to reach',
            'communication', 'phone', 'called', 'message',
            'appointment', 'schedule', 'busy', 'overwhelmed',
            'contractor', 'plumber', 'electrician', 'designer'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }
      }

      new HouzzScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
