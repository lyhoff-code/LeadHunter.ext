// Lead Hunter AI - YouTube Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'YouTube',
    selectors: {
      commentContainer: [
        'ytd-comment-thread-renderer',
        'ytd-comment-renderer',
        '#comment'
      ].join(', '),

      commentText: [
        '#content-text',
        '.yt-formatted-string[slot="content"]'
      ].join(', '),

      authorName: [
        '#author-text span',
        'a#author-text'
      ].join(', '),

      authorLink: 'a#author-text',
      authorTitle: '',
      authorBio: '',

      videoTitle: 'h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata'
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class YouTubeScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Get video title for context
          const videoTitle = document.querySelector(config.selectors.videoTitle)?.innerText?.trim() || '';

          // Check if video is relevant (business/industry related)
          const isRelevantVideo = this.isRelevantVideo(videoTitle);

          const commentElements = document.querySelectorAll(config.selectors.commentContainer);
          commentElements.forEach(comment => {
            try {
              const textElement = comment.querySelector(config.selectors.commentText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 20) return;

              // Skip generic comments
              if (this.isGenericComment(text)) return;

              const authorElement = comment.querySelector(config.selectors.authorName);
              const authorLinkElement = comment.querySelector(config.selectors.authorLink);

              const author = {
                name: authorElement?.innerText?.trim() || 'YouTube User',
                title: ''
              };

              const profileUrl = authorLinkElement?.href || '';

              // Only include if video is relevant OR comment mentions business pain
              if (isRelevantVideo || this.hasBusinessPain(text)) {
                const fullText = videoTitle
                  ? `[YouTube - ${videoTitle.substring(0, 50)}] ${text}`
                  : `[YouTube Comment] ${text}`;

                comments.push({
                  text: fullText,
                  author,
                  profileUrl,
                  element: comment
                });
              }
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }

        isRelevantVideo(title) {
          const keywords = [
            'business', 'entrepreneur', 'small business',
            'plumber', 'plumbing', 'hvac', 'contractor',
            'dentist', 'dental', 'clinic', 'medical',
            'receptionist', 'phone calls', 'customer service',
            'automation', 'ai', 'virtual assistant'
          ];
          const lower = title.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }

        isGenericComment(text) {
          const patterns = [
            /^(great|nice|awesome|cool|wow|amazing|love|loved|thanks?|thx)\s*(!|\.)*$/i,
            /^(first|second|third)!*$/i,
            /^(lol|lmao|rofl|haha)+$/i,
            /^[🔥❤️👍👏💯😂🤣👀]+$/,
            /^(subscribe|subscribed|like|liked).*$/i
          ];
          return patterns.some(p => p.test(text.trim()));
        }

        hasBusinessPain(text) {
          const keywords = [
            'my business', 'my company', 'i own',
            'cant keep up', 'overwhelmed', 'too many calls',
            'need help', 'receptionist', 'phone',
            'customers', 'clients', 'appointments'
          ];
          const lower = text.toLowerCase();
          return keywords.some(kw => lower.includes(kw));
        }
      }

      new YouTubeScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
