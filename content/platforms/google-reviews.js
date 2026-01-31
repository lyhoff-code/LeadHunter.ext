// Lead Hunter AI - Google Reviews Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'Google Reviews',
    selectors: {
      // Google Maps reviews
      commentContainer: [
        '.jftiEf',
        '[data-review-id]',
        '.WMbnJf',
        '.gws-localreviews__google-review'
      ].join(', '),

      commentText: [
        '.wiI7pd',
        '.MyEned span',
        '.review-full-text',
        '[data-expandable-section]'
      ].join(', '),

      authorName: [
        '.d4r55',
        '.TSUbDb a',
        '.review-author'
      ].join(', '),

      authorLink: [
        '.WNxzHc a',
        '.TSUbDb a'
      ].join(', '),

      authorTitle: '',
      authorBio: '',

      // Business listings
      businessName: [
        '.qBF1Pd',
        '.DUwDvf',
        '[data-attrid="title"]'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class GoogleReviewsScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Get current business name for context
          const businessNameEl = document.querySelector(config.selectors.businessName);
          const businessName = businessNameEl?.innerText?.trim() || '';

          // Scan reviews
          const reviews = document.querySelectorAll(config.selectors.commentContainer);
          reviews.forEach(review => {
            try {
              // Get review text
              const textElement = review.querySelector(config.selectors.commentText);
              if (!textElement) return;

              let text = textElement.innerText?.trim();
              if (!text || text.length < 20) return;

              // Add business context if available
              if (businessName) {
                text = `[Review of ${businessName}] ${text}`;
              }

              // Get reviewer info
              const authorElement = review.querySelector(config.selectors.authorName);
              const authorLinkElement = review.querySelector(config.selectors.authorLink);

              // Get star rating
              const ratingElement = review.querySelector('.kvMYJc, .z3HNkc');
              const rating = ratingElement?.getAttribute('aria-label') || '';

              const author = {
                name: authorElement?.innerText?.trim() || 'Google User',
                title: rating // Use rating as "title" for context
              };

              const profileUrl = authorLinkElement?.href || '';

              // Negative reviews (1-3 stars) often contain pain points
              // that the business owner would want to address
              const isNegative = rating.includes('1 star') ||
                                 rating.includes('2 star') ||
                                 rating.includes('3 star');

              if (isNegative || this.containsPainKeywords(text)) {
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

        containsPainKeywords(text) {
          const keywords = [
            'no contestan', 'never answer', 'no one answered',
            'cant get through', 'no response', 'waiting forever',
            'terrible service', 'bad communication', 'unprofessional',
            'missed appointment', 'never called back', 'voicemail full'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }
      }

      new GoogleReviewsScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
