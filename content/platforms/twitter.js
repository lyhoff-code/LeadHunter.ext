// Lead Hunter AI - Twitter/X Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'Twitter',
    selectors: {
      // Tweets (they serve as both posts and replies)
      commentContainer: [
        '[data-testid="tweet"]',
        'article[role="article"]',
        '[data-testid="cellInnerDiv"]'
      ].join(', '),

      commentText: [
        '[data-testid="tweetText"]',
        '[lang] span'
      ].join(', '),

      authorName: [
        '[data-testid="User-Name"] a span',
        'a[role="link"][href*="/"] span'
      ].join(', '),

      authorLink: [
        '[data-testid="User-Name"] a[href*="/"]',
        'a[role="link"][tabindex="-1"]'
      ].join(', '),

      authorTitle: '[data-testid="UserDescription"]',
      authorBio: '[data-testid="UserDescription"]',

      postContainer: '[data-testid="tweet"]',
      postText: '[data-testid="tweetText"]'
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class TwitterScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];
          const tweets = document.querySelectorAll(config.selectors.commentContainer);

          tweets.forEach(tweet => {
            try {
              const textElement = tweet.querySelector(config.selectors.commentText);
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 20) return;

              // Skip promoted tweets
              if (tweet.innerText.includes('Promoted') || tweet.innerText.includes('Ad')) return;

              const authorElement = tweet.querySelector('[data-testid="User-Name"] span:not([data-testid])');
              const authorLinkElement = tweet.querySelector('[data-testid="User-Name"] a[href^="/"]');
              const bioElement = tweet.querySelector('[data-testid="UserDescription"]');

              const author = {
                name: authorElement?.innerText?.trim() || 'Unknown',
                title: '',
                bio: bioElement?.innerText?.trim() || ''
              };

              let profileUrl = '';
              if (authorLinkElement?.href) {
                profileUrl = authorLinkElement.href;
              }

              comments.push({
                text,
                author,
                profileUrl,
                element: tweet
              });
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }
      }

      new TwitterScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
