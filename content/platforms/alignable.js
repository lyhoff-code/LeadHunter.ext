// Lead Hunter AI - Alignable Platform Scanner
// Alignable is a social network specifically for small business owners

(function() {
  'use strict';

  const config = {
    name: 'Alignable',
    selectors: {
      commentContainer: [
        '.post-card',
        '.feed-item',
        '[data-post-id]',
        '.activity-item'
      ].join(', '),

      commentText: [
        '.post-content',
        '.post-body',
        '.activity-content',
        'p.post-text'
      ].join(', '),

      authorName: [
        '.post-author-name',
        '.user-name',
        'a[href*="/member/"]'
      ].join(', '),

      authorLink: 'a[href*="/member/"]',
      authorTitle: '.business-name, .company-name',
      authorBio: '.user-headline',

      postContainer: '.post-card, .feed-item',
      postText: '.post-content, .post-body'
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class AlignableScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Alignable posts are gold - all from business owners
          const posts = document.querySelectorAll(config.selectors.postContainer);
          posts.forEach(post => {
            try {
              const textElement = post.querySelector(config.selectors.postText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 20) return;

              const authorElement = post.querySelector(config.selectors.authorName);
              const authorLinkElement = post.querySelector(config.selectors.authorLink);
              const businessElement = post.querySelector(config.selectors.authorTitle);
              const headlineElement = post.querySelector(config.selectors.authorBio);

              const author = {
                name: authorElement?.innerText?.trim() || 'Business Owner',
                title: businessElement?.innerText?.trim() || '',
                bio: headlineElement?.innerText?.trim() || ''
              };

              const profileUrl = authorLinkElement?.href || '';

              // On Alignable, everyone is a business owner, so lower filter threshold
              comments.push({
                text: `[Alignable - Small Business] ${text}`,
                author,
                profileUrl,
                element: post
              });
            } catch (e) {
              // Skip
            }
          });

          // Also scan comments/replies
          const replies = document.querySelectorAll('.comment, .reply, .activity-comment');
          replies.forEach(reply => {
            try {
              const text = reply.innerText?.trim();
              if (!text || text.length < 20) return;

              const authorElement = reply.querySelector('a[href*="/member/"]');

              const author = {
                name: authorElement?.innerText?.trim() || 'Business Owner',
                title: ''
              };

              const profileUrl = authorElement?.href || '';

              comments.push({
                text: `[Alignable Comment] ${text}`,
                author,
                profileUrl,
                element: reply
              });
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }
      }

      new AlignableScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
