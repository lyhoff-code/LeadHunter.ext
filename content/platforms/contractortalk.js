// Lead Hunter AI - ContractorTalk Platform Scanner
// ContractorTalk is a forum for contractors

(function() {
  'use strict';

  const config = {
    name: 'ContractorTalk',
    selectors: {
      // vBulletin forum structure
      commentContainer: [
        '.postcontainer',
        '.post',
        '#posts .postbit',
        '.message--post'
      ].join(', '),

      commentText: [
        '.postcontent',
        '.postbody',
        'blockquote.postcontent',
        '.message-body'
      ].join(', '),

      authorName: [
        '.username',
        '.postauthor a',
        'a.username',
        '.message-name'
      ].join(', '),

      authorLink: 'a[href*="member.php"], a[href*="/members/"]',
      authorTitle: '.usertitle, .userTitle',
      authorBio: '.signature',

      threadTitle: '.thread-title, h1.p-title-value, h1'
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class ContractorTalkScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Get thread title
          const threadTitle = document.querySelector(config.selectors.threadTitle)?.innerText?.trim() || '';

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
                name: authorElement?.innerText?.trim() || 'Contractor',
                title: titleElement?.innerText?.trim() || '',
                bio: ''
              };

              const profileUrl = authorLinkElement?.href || '';

              const fullText = threadTitle
                ? `[ContractorTalk - ${threadTitle}] ${text}`
                : `[ContractorTalk Forum] ${text}`;

              // All contractors - target industry
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

      new ContractorTalkScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
