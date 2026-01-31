// Lead Hunter AI - DentalTown Platform Scanner
// DentalTown is a forum for dental professionals

(function() {
  'use strict';

  const config = {
    name: 'DentalTown',
    selectors: {
      commentContainer: [
        '.message-body',
        '.forum-post',
        '.post-container',
        '.bbp-reply-content',
        'article.post'
      ].join(', '),

      commentText: [
        '.message-content',
        '.post-content',
        '.entry-content',
        'p'
      ].join(', '),

      authorName: [
        '.message-author',
        '.post-author',
        '.username',
        '.author-name'
      ].join(', '),

      authorLink: 'a[href*="/profile/"], a[href*="/members/"], a[href*="/users/"]',
      authorTitle: '.user-title, .member-title',
      authorBio: '.user-signature',

      threadTitle: '.thread-title, .topic-title, h1.entry-title'
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class DentalTownScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Get thread title for context
          const threadTitle = document.querySelector(config.selectors.threadTitle)?.innerText?.trim() || '';

          // Scan forum posts
          const posts = document.querySelectorAll(config.selectors.commentContainer);
          posts.forEach(post => {
            try {
              const textElement = post.querySelector(config.selectors.commentText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              const authorElement = post.querySelector(config.selectors.authorName);
              const authorLinkElement = post.querySelector(config.selectors.authorLink);
              const titleElement = post.querySelector(config.selectors.authorTitle);

              const author = {
                name: authorElement?.innerText?.trim() || 'Dental Professional',
                title: titleElement?.innerText?.trim() || 'Dentist',
                bio: ''
              };

              const profileUrl = authorLinkElement?.href || '';

              // Add thread context
              const fullText = threadTitle
                ? `[DentalTown - ${threadTitle}] ${text}`
                : `[DentalTown Forum] ${text}`;

              // All users here are dental professionals - high value
              comments.push({
                text: fullText,
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

      new DentalTownScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
