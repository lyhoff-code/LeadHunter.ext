// Lead Hunter AI - Thumbtack Platform Scanner
// Thumbtack connects service providers with customers

(function() {
  'use strict';

  const config = {
    name: 'Thumbtack',
    selectors: {
      commentContainer: [
        '[data-testid="review"]',
        '.review-card',
        '[class*="Review"]'
      ].join(', '),

      commentText: [
        '[data-testid="review-text"]',
        '.review-text',
        '[class*="ReviewText"]'
      ].join(', '),

      authorName: [
        '[data-testid="reviewer-name"]',
        '.reviewer-name'
      ].join(', '),

      authorLink: '',
      authorTitle: '',
      authorBio: '',

      // Pro profiles and forum discussions
      proContainer: [
        '.pro-card',
        '[data-testid="pro-list-item"]'
      ].join(', '),

      forumPost: [
        '.forum-post',
        '.discussion-item',
        '[class*="ForumPost"]'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class ThumbtackScanner extends window.LeadScanner {
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

              // Reviews mentioning communication issues
              if (this.isRelevant(text)) {
                const author = {
                  name: review.querySelector(config.selectors.authorName)?.innerText?.trim() || 'Customer',
                  title: ''
                };

                comments.push({
                  text: `[Thumbtack Review] ${text}`,
                  author,
                  profileUrl: '',
                  element: review
                });
              }
            } catch (e) {
              // Skip
            }
          });

          // Scan forum posts (pro discussions)
          const forumPosts = document.querySelectorAll(config.selectors.forumPost);
          forumPosts.forEach(post => {
            try {
              const text = post.innerText?.trim();
              if (!text || text.length < 30) return;

              // Forum posts from service providers discussing business challenges
              const author = {
                name: post.querySelector('a[href*="/pro/"]')?.innerText?.trim() || 'Service Pro',
                title: 'Thumbtack Pro'
              };

              const profileUrl = post.querySelector('a[href*="/pro/"]')?.href || '';

              comments.push({
                text: `[Thumbtack Pro Forum] ${text}`,
                author,
                profileUrl,
                element: post
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
            'didnt answer', 'no callback', 'communication',
            'phone', 'called', 'message', 'appointment',
            'busy', 'overwhelmed', 'too many', 'cant keep up'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }
      }

      new ThumbtackScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
