// Lead Hunter AI - Facebook Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'Facebook',
    selectors: {
      // Comments
      commentContainer: [
        '[aria-label*="Comment"]',
        '[data-testid="UFI2Comment/root_depth_0"]',
        '.x1y1aw1k.xn6708d', // FB's obfuscated comment class
        'div[class*="x1y1aw1k"]',
        '.UFIComment'
      ].join(', '),

      commentText: [
        '[data-ad-preview="message"]',
        '.x1lliihq.x6ikm8r',
        'div[dir="auto"]',
        '.UFICommentBody'
      ].join(', '),

      authorName: [
        'a[role="link"] span.xt0psk2',
        '.x193iq5w.xeuugli',
        'a.UFICommentActorName'
      ].join(', '),

      authorLink: [
        'a[role="link"][href*="facebook.com"]',
        'a[data-hovercard]'
      ].join(', '),

      authorTitle: '',
      authorBio: '',

      // Posts
      postContainer: [
        '[data-pagelet*="FeedUnit"]',
        '[data-testid="Keycommand_wrapper_FeedUnit"]',
        '.x1yztbdb.x1n2onr6',
        '.userContentWrapper'
      ].join(', '),

      postText: [
        '[data-ad-comet-preview="message"]',
        '[data-ad-preview="message"]',
        'div[dir="auto"][style*="webkit-line-clamp"]',
        '.userContent'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class FacebookScanner extends window.LeadScanner {
        extractComments() {
          const comments = super.extractComments();

          // Also scan group posts
          const posts = document.querySelectorAll(config.selectors.postContainer);
          posts.forEach(post => {
            try {
              const textElement = post.querySelector(config.selectors.postText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              const authorElement = post.querySelector('a[role="link"] strong span');
              const authorLinkElement = post.querySelector('a[role="link"][href*="facebook.com"]');

              const author = {
                name: authorElement?.innerText?.trim() || 'Unknown',
                title: ''
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

      new FacebookScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
