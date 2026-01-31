// Lead Hunter AI - LinkedIn Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'LinkedIn',
    selectors: {
      // Comments in posts
      commentContainer: [
        '.comments-comment-item',
        '.comments-comment-item__content-wrapper',
        '[data-test-id="comments-comment-item"]',
        '.feed-shared-update-v2__comments-container .comments-comment-item'
      ].join(', '),

      // Comment text
      commentText: [
        '.comments-comment-item__main-content',
        '.comments-comment-texteditor .ql-editor',
        '.update-components-text',
        'span[dir="ltr"]'
      ].join(', '),

      // Author info
      authorName: [
        '.comments-post-meta__name-text',
        '.comments-comment-item__post-meta .hoverable-link-text',
        '.update-components-actor__name span',
        'a.app-aware-link span[aria-hidden="true"]'
      ].join(', '),

      authorLink: [
        '.comments-post-meta__profile-link',
        '.comments-comment-item__post-meta a',
        '.update-components-actor__meta a'
      ].join(', '),

      authorTitle: [
        '.comments-post-meta__headline',
        '.update-components-actor__description'
      ].join(', '),

      authorBio: '.comments-post-meta__headline',

      // Posts (also scan main posts, not just comments)
      postContainer: [
        '.feed-shared-update-v2',
        '.occludable-update',
        '[data-test-id="feed-virtual-list-item"]'
      ].join(', '),

      postText: [
        '.feed-shared-update-v2__description',
        '.feed-shared-text',
        '.update-components-text span[dir="ltr"]'
      ].join(', ')
    }
  };

  // Wait for scanner to be available
  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      // Extend to also scan posts
      class LinkedInScanner extends window.LeadScanner {
        extractComments() {
          const comments = super.extractComments();

          // Also extract from posts
          const posts = document.querySelectorAll(config.selectors.postContainer);
          posts.forEach(post => {
            try {
              const textElement = post.querySelector(config.selectors.postText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              // Get author info from post
              const authorElement = post.querySelector('.update-components-actor__name span[aria-hidden="true"]');
              const authorLinkElement = post.querySelector('.update-components-actor__meta a');
              const titleElement = post.querySelector('.update-components-actor__description');

              const author = {
                name: authorElement?.innerText?.trim() || 'Unknown',
                title: titleElement?.innerText?.trim() || ''
              };

              const profileUrl = authorLinkElement?.href || '';

              // Skip if this is the user's own post or a company post
              if (profileUrl.includes('/company/')) return;

              comments.push({
                text,
                author,
                profileUrl,
                element: post
              });
            } catch (e) {
              // Skip problematic elements
            }
          });

          return comments;
        }
      }

      new LinkedInScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
