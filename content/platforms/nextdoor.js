// Lead Hunter AI - Nextdoor Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'Nextdoor',
    selectors: {
      commentContainer: [
        '[data-testid="comment"]',
        '.css-comment',
        '[class*="CommentItem"]'
      ].join(', '),

      commentText: [
        '[data-testid="comment-text"]',
        '[class*="CommentContent"]',
        'p[class*="Body"]'
      ].join(', '),

      authorName: [
        '[data-testid="comment-author"]',
        '[class*="AuthorName"]',
        'a[href*="/profile/"]'
      ].join(', '),

      authorLink: 'a[href*="/profile/"]',
      authorTitle: '[class*="AuthorNeighborhood"]',
      authorBio: '',

      postContainer: [
        '[data-testid="post-card"]',
        '[class*="StoryCard"]',
        'article'
      ].join(', '),

      postText: [
        '[data-testid="post-content"]',
        '[class*="StoryContent"]',
        '[class*="PostBody"]'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class NextdoorScanner extends window.LeadScanner {
        extractComments() {
          const comments = super.extractComments();

          // Nextdoor posts are very relevant - local business owners
          const posts = document.querySelectorAll(config.selectors.postContainer);
          posts.forEach(post => {
            try {
              const textElement = post.querySelector(config.selectors.postText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              const authorElement = post.querySelector('[class*="AuthorName"], a[href*="/profile/"]');
              const authorLinkElement = post.querySelector('a[href*="/profile/"]');
              const neighborhoodElement = post.querySelector('[class*="Neighborhood"]');

              const author = {
                name: authorElement?.innerText?.trim() || 'Neighbor',
                title: neighborhoodElement?.innerText?.trim() || ''
              };

              const profileUrl = authorLinkElement?.href || '';

              comments.push({
                text,
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
      }

      new NextdoorScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
