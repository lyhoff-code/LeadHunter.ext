// Lead Hunter AI - Yelp Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'Yelp',
    selectors: {
      commentContainer: [
        '[data-testid="review-list-item"]',
        '.review',
        '.lemon--li__09f24__1r9wz'
      ].join(', '),

      commentText: [
        '[data-testid="review-text-content"]',
        '.review-content p',
        '.comment__09f24__1YRBo'
      ].join(', '),

      authorName: [
        '[data-testid="review-author-name"]',
        '.user-name a',
        '.user-passport-info .user-name'
      ].join(', '),

      authorLink: [
        'a[href*="/user_details"]',
        '.user-name a'
      ].join(', '),

      authorTitle: '.user-location',
      authorBio: '',

      businessName: [
        'h1[data-testid="biz-name"]',
        '.biz-page-title'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class YelpScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Get business name for context
          const businessNameEl = document.querySelector(config.selectors.businessName);
          const businessName = businessNameEl?.innerText?.trim() || '';

          const reviews = document.querySelectorAll(config.selectors.commentContainer);
          reviews.forEach(review => {
            try {
              const textElement = review.querySelector(config.selectors.commentText);
              if (!textElement) return;

              let text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              // Add business context
              if (businessName) {
                text = `[Yelp review of ${businessName}] ${text}`;
              }

              const authorElement = review.querySelector(config.selectors.authorName);
              const authorLinkElement = review.querySelector(config.selectors.authorLink);
              const locationElement = review.querySelector(config.selectors.authorTitle);

              // Get star rating
              const ratingElement = review.querySelector('[aria-label*="star rating"]');
              const rating = ratingElement?.getAttribute('aria-label') || '';

              const author = {
                name: authorElement?.innerText?.trim() || 'Yelp User',
                title: locationElement?.innerText?.trim() || '',
                bio: rating
              };

              const profileUrl = authorLinkElement?.href || '';

              // Focus on reviews mentioning communication issues
              const isRelevant = rating.includes('1 star') ||
                                 rating.includes('2 star') ||
                                 this.containsRelevantKeywords(text);

              if (isRelevant) {
                comments.push({
                  text,
                  author,
                  profileUrl,
                  element: review
                });
              }
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }

        containsRelevantKeywords(text) {
          const keywords = [
            'no answer', 'didnt answer', 'never answered',
            'no call back', 'never called', 'hard to reach',
            'no response', 'waiting', 'appointment',
            'phone', 'called', 'message', 'voicemail'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }
      }

      new YelpScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
