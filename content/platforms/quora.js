// Lead Hunter AI - Quora Platform Scanner

(function() {
  'use strict';

  const config = {
    name: 'Quora',
    selectors: {
      commentContainer: [
        '.q-box.qu-pb--medium',
        '[class*="AnswerBase"]',
        '.Answer'
      ].join(', '),

      commentText: [
        '.q-text.qu-wordBreak--break-word',
        '[class*="AnswerContent"]',
        '.inline_editor_content'
      ].join(', '),

      authorName: [
        '.q-text.qu-bold',
        '[class*="CredentialBase"]',
        '.feed_item_answer_user'
      ].join(', '),

      authorLink: 'a[href*="/profile/"]',
      authorTitle: '.q-text.qu-color--gray',
      authorBio: '.q-text.qu-color--gray',

      postContainer: [
        '[class*="QuestionPage"]',
        '.Answer',
        '.dom_annotate_question_answer_item'
      ].join(', '),

      postText: [
        '[class*="AnswerContent"]',
        '.inline_editor_content'
      ].join(', ')
    }
  };

  function initScanner() {
    if (typeof window.LeadScanner !== 'undefined') {
      class QuoraScanner extends window.LeadScanner {
        extractComments() {
          const comments = [];

          // Scan answers (more valuable than questions)
          const answers = document.querySelectorAll('.q-box[class*="Answer"], [class*="AnswerBase"]');
          answers.forEach(answer => {
            try {
              const textElement = answer.querySelector('.q-text.qu-wordBreak--break-word, [class*="AnswerContent"]');
              if (!textElement) return;

              const text = textElement.innerText?.trim();
              if (!text || text.length < 30) return;

              const authorElement = answer.querySelector('.q-text.qu-bold a, [class*="UserLink"]');
              const credentialElement = answer.querySelector('.q-text.qu-color--gray');

              const author = {
                name: authorElement?.innerText?.trim() || 'Quora User',
                title: credentialElement?.innerText?.trim() || '',
                bio: credentialElement?.innerText?.trim() || ''
              };

              const profileUrl = authorElement?.href || '';

              comments.push({
                text,
                author,
                profileUrl,
                element: answer
              });
            } catch (e) {
              // Skip
            }
          });

          // Also scan questions
          const questions = document.querySelectorAll('.q-text.qu-wordBreak--break-word.qu-color--gray_dark');
          questions.forEach(question => {
            try {
              const text = question.innerText?.trim();
              if (!text || text.length < 20) return;

              // Questions often show pain points
              comments.push({
                text: `[Question] ${text}`,
                author: { name: 'Quora User', title: '' },
                profileUrl: '',
                element: question.closest('.q-box') || question
              });
            } catch (e) {
              // Skip
            }
          });

          return comments;
        }
      }

      new QuoraScanner(config);
    } else {
      setTimeout(initScanner, 100);
    }
  }

  initScanner();
})();
