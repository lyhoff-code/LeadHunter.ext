// Lead Hunter AI - HVAC-Talk Platform Scanner
// HVAC-Talk is a forum for HVAC professionals

(function() {
  'use strict';

  const config = {
    name: 'HVAC-Talk',
    selectors: {
      commentContainer: [
        '.message--post',
        '.messageContent',
        '.post',
        '#posts .post',
        '.postcontainer'
      ].join(', '),

      commentText: [
        '.message-body',
        '.messageContent article',
        '.content',
        '.postcontent',
        'blockquote.postcontent'
      ].join(', '),

      authorName: [
        '.message-name',
        '.username',
        '.author',
        'a.username'
      ].join(', '),

      authorLink: 'a[href*="/members/"], a[href*="member.php"]',
      authorTitle: '.userTitle, .usertitle',
      authorBio: '.signature',

      threadTitle: '.p-title-value, .thread-title, h1'
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class HVACTalkScanner extends window.LeadScanner {
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
                name: authorElement?.innerText?.trim() || 'HVAC Professional',
                title: titleElement?.innerText?.trim() || 'HVAC Tech',
                bio: ''
              };

              const profileUrl = authorLinkElement?.href || '';

              // Add context
              const fullText = threadTitle
                ? `[HVAC-Talk - ${threadTitle}] ${text}`
                : `[HVAC-Talk Forum] ${text}`;

              // All users are HVAC professionals - target industry
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

      new HVACTalkScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
