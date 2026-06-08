document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  initEventListeners();
  fetchGitHubStats();
});

// Initialize settings by loading saved preferences from localStorage
function initSettings() {
  // Keyword preferences
  loadKeywordPreferences();
  // Author preferences
  loadAuthorPreferences();
}

// Load keyword preferences from localStorage
function loadKeywordPreferences() {
  const selectedKeywordsContainer = document.getElementById('selectedKeywords');
  selectedKeywordsContainer.innerHTML = '';

  // Get the saved keywords, or use the default keywords if none exist
  let savedKeywords = localStorage.getItem('preferredKeywords');
  let keywords = []; // No keywords by default

  if (savedKeywords) {
    try {
      keywords = JSON.parse(savedKeywords);
    } catch (e) {
      console.error('Failed to parse saved keywords:', e);
    }
  }

  // Display the saved keywords
  if (keywords.length > 0) {
    keywords.forEach(keyword => {
      addKeywordTag(keyword);
    });
  } else {
    // Show the empty tag message
    showEmptyTagMessage();
  }
}

// Load author preferences from localStorage
function loadAuthorPreferences() {
  const selectedAuthorsContainer = document.getElementById('selectedAuthors');
  selectedAuthorsContainer.innerHTML = '';

  // Get the saved authors, or an empty array if none exist
  let savedAuthors = localStorage.getItem('preferredAuthors');
  let authors = []; // No authors by default

  if (savedAuthors) {
    try {
      authors = JSON.parse(savedAuthors);
    } catch (e) {
      console.error('Failed to parse saved authors:', e);
    }
  }

  // Display the saved authors
  if (authors.length > 0) {
    authors.forEach(author => {
      addAuthorTag(author);
    });
  } else {
    // Show the empty tag message
    showEmptyAuthorMessage();
  }
}

// Show the empty tag message
function showEmptyTagMessage() {
  const selectedKeywordsContainer = document.getElementById('selectedKeywords');
  const emptyMessage = document.createElement('div');
  emptyMessage.id = 'emptyTagMessage';
  emptyMessage.className = 'empty-tag-message';
  emptyMessage.textContent = 'No keywords added yet. Add some keywords below.';
  selectedKeywordsContainer.appendChild(emptyMessage);
}

// Show the empty author tag message
function showEmptyAuthorMessage() {
  const selectedAuthorsContainer = document.getElementById('selectedAuthors');
  const emptyMessage = document.createElement('div');
  emptyMessage.id = 'emptyAuthorMessage';
  emptyMessage.className = 'empty-tag-message';
  emptyMessage.textContent = 'No authors added yet. Add some authors below.';
  selectedAuthorsContainer.appendChild(emptyMessage);
}

// Hide the empty tag message
function hideEmptyTagMessage() {
  const emptyMessage = document.getElementById('emptyTagMessage');
  if (emptyMessage) {
    emptyMessage.remove();
  }
}

// Hide the empty author tag message
function hideEmptyAuthorMessage() {
  const emptyMessage = document.getElementById('emptyAuthorMessage');
  if (emptyMessage) {
    emptyMessage.remove();
  }
}

// Add a keyword tag
function addKeywordTag(keyword) {
  const selectedKeywordsContainer = document.getElementById('selectedKeywords');

  // Remove the empty tag message
  hideEmptyTagMessage();

  // Check whether the keyword already exists
  const existingTags = selectedKeywordsContainer.querySelectorAll('.category-button');
  for (let i = 0; i < existingTags.length; i++) {
    if (existingTags[i].textContent.trim().startsWith(keyword)) {
      // This keyword already exists; add a flash animation to alert the user
      existingTags[i].classList.add('tag-highlight');
      setTimeout(() => {
        existingTags[i].classList.remove('tag-highlight');
      }, 1000);
      return; // Keyword already exists, do not add it
    }
  }

  // Create a new keyword tag
  const tagElement = document.createElement('span');
  tagElement.className = 'category-button tag-appear';
  tagElement.innerHTML = `${keyword} <button class="remove-tag">×</button>`;

  // Add the remove button event
  const removeButton = tagElement.querySelector('.remove-tag');
  removeButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add the removal animation
    tagElement.classList.add('tag-disappear');

    // Remove the element after the animation finishes
    setTimeout(() => {
      tagElement.remove();

      // If no tags remain, show the empty tag message
      if (selectedKeywordsContainer.querySelectorAll('.category-button').length === 0) {
        showEmptyTagMessage();
      }
    }, 300);
  });

  selectedKeywordsContainer.appendChild(tagElement);

  // Remove the animation class after the appear animation finishes
  setTimeout(() => {
    tagElement.classList.remove('tag-appear');
  }, 300);
}

// Add an author tag
function addAuthorTag(author) {
  const selectedAuthorsContainer = document.getElementById('selectedAuthors');

  // Remove the empty tag message
  hideEmptyAuthorMessage();

  // Check whether the author already exists
  const existingTags = selectedAuthorsContainer.querySelectorAll('.category-button');
  for (let i = 0; i < existingTags.length; i++) {
    if (existingTags[i].textContent.trim().startsWith(author)) {
      // This author already exists; add a flash animation to alert the user
      existingTags[i].classList.add('tag-highlight');
      setTimeout(() => {
        existingTags[i].classList.remove('tag-highlight');
      }, 1000);
      return; // Author already exists, do not add it
    }
  }

  // Create a new author tag
  const tagElement = document.createElement('span');
  tagElement.className = 'category-button tag-appear';
  tagElement.innerHTML = `${author} <button class="remove-tag">×</button>`;

  // Add the remove button event
  const removeButton = tagElement.querySelector('.remove-tag');
  removeButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add the removal animation
    tagElement.classList.add('tag-disappear');

    // Remove the element after the animation finishes
    setTimeout(() => {
      tagElement.remove();

      // If no tags remain, show the empty tag message
      if (selectedAuthorsContainer.querySelectorAll('.category-button').length === 0) {
        showEmptyAuthorMessage();
      }
    }, 300);
  });

  selectedAuthorsContainer.appendChild(tagElement);

  // Remove the animation class after the appear animation finishes
  setTimeout(() => {
    tagElement.classList.remove('tag-appear');
  }, 300);
}

// Initialize event listeners
function initEventListeners() {
  // Add keyword button
  const addKeywordButton = document.getElementById('addKeyword');
  addKeywordButton.addEventListener('click', () => {
    const keywordInput = document.getElementById('keywordInput');
    const keyword = keywordInput.value.trim();

    if (keyword) {
      // Check for a comma and split on it if present
      if (keyword.includes(',')) {
        const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
        keywords.forEach(k => addKeywordTag(k));
      } else {
        addKeywordTag(keyword);
      }
      keywordInput.value = '';
    }
  });

  // Keyword input Enter key event
  const keywordInput = document.getElementById('keywordInput');
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const keyword = keywordInput.value.trim();

      if (keyword) {
        // Check for a comma and split on it if present
        if (keyword.includes(',')) {
          const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
          keywords.forEach(k => addKeywordTag(k));
        } else {
          addKeywordTag(keyword);
        }
        keywordInput.value = '';
      }
    }
  });

  // Add author button
  const addAuthorButton = document.getElementById('addAuthor');
  addAuthorButton.addEventListener('click', () => {
    const authorInput = document.getElementById('authorInput');
    const author = authorInput.value.trim();

    if (author) {
      // Check for a comma and split on it if present
      if (author.includes(',')) {
        const authors = author.split(',').map(a => a.trim()).filter(a => a);
        authors.forEach(a => addAuthorTag(a));
      } else {
        addAuthorTag(author);
      }
      authorInput.value = '';
    }
  });

  // Author input Enter key event
  const authorInput = document.getElementById('authorInput');
  authorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const author = authorInput.value.trim();

      if (author) {
        // Check for a comma and split on it if present
        if (author.includes(',')) {
          const authors = author.split(',').map(a => a.trim()).filter(a => a);
          authors.forEach(a => addAuthorTag(a));
        } else {
          addAuthorTag(author);
        }
        authorInput.value = '';
      }
    }
  });

  // Copy keywords button
  const copyKeywordsButton = document.getElementById('copyKeywords');
  copyKeywordsButton.addEventListener('click', copyKeywords);

  // Copy authors button
  const copyAuthorsButton = document.getElementById('copyAuthors');
  copyAuthorsButton.addEventListener('click', copyAuthors);

  // Save settings button
  const saveSettingsButton = document.getElementById('saveSettings');
  saveSettingsButton.addEventListener('click', saveSettings);

  // Reset settings button
  const resetSettingsButton = document.getElementById('resetSettings');
  resetSettingsButton.addEventListener('click', resetSettings);
}

// Copy keywords to the clipboard
function copyKeywords() {
  const keywordTags = document.getElementById('selectedKeywords').querySelectorAll('.category-button');
  const keywords = [];
  keywordTags.forEach(tag => {
    const keywordName = tag.textContent.trim().replace('×', '').trim();
    keywords.push(keywordName);
  });

  if (keywords.length === 0) {
    showNotification('No keywords to copy!', 'info');
    return;
  }

  const keywordsString = keywords.join(',');
  copyToClipboard(keywordsString, 'Keywords copied to clipboard!');
}

// Copy authors to the clipboard
function copyAuthors() {
  const authorTags = document.getElementById('selectedAuthors').querySelectorAll('.category-button');
  const authors = [];
  authorTags.forEach(tag => {
    const authorName = tag.textContent.trim().replace('×', '').trim();
    authors.push(authorName);
  });

  if (authors.length === 0) {
    showNotification('No authors to copy!', 'info');
    return;
  }

  const authorsString = authors.join(',');
  copyToClipboard(authorsString, 'Authors copied to clipboard!');
}

// Generic helper to copy text to the clipboard
function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification(successMessage, 'success');
    }).catch(err => {
      console.error('Failed to copy:', err);
      fallbackCopyText(text, successMessage);
    });
  } else {
    fallbackCopyText(text, successMessage);
  }
}

// Fallback copy method (for browsers that do not support the clipboard API)
function fallbackCopyText(text, successMessage) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showNotification(successMessage, 'success');
  } catch (err) {
    console.error('Failed to copy:', err);
    showNotification('Failed to copy to clipboard', 'info');
  }

  document.body.removeChild(textArea);
}

// Save settings
function saveSettings() {
  // Get all selected keywords
  const keywordTags = document.getElementById('selectedKeywords').querySelectorAll('.category-button');
  const keywords = [];
  keywordTags.forEach(tag => {
    const keywordName = tag.textContent.trim().replace('×', '').trim();
    keywords.push(keywordName);
  });

  // Get all selected authors
  const authorTags = document.getElementById('selectedAuthors').querySelectorAll('.category-button');
  const authors = [];
  authorTags.forEach(tag => {
    const authorName = tag.textContent.trim().replace('×', '').trim();
    authors.push(authorName);
  });

  // Save settings to localStorage
  localStorage.setItem('preferredKeywords', JSON.stringify(keywords));
  localStorage.setItem('preferredAuthors', JSON.stringify(authors));

  // Show a success notification with a success icon
  showNotification('Settings saved successfully!', 'success');
}

// Reset settings
function resetSettings() {
  // Reset keywords
  const selectedKeywordsContainer = document.getElementById('selectedKeywords');
  selectedKeywordsContainer.innerHTML = '';

  // Reset authors
  const selectedAuthorsContainer = document.getElementById('selectedAuthors');
  selectedAuthorsContainer.innerHTML = '';

  // Show the empty tag messages
  showEmptyTagMessage();
  showEmptyAuthorMessage();

  // Show a reset success notification
  showNotification('Settings reset to default!', 'info');
}

// Show a notification
function showNotification(message, type = 'success') {
  // Check whether a notification element already exists
  let notification = document.querySelector('.settings-notification');

  if (!notification) {
    // Create the notification element
    notification = document.createElement('div');
    notification.className = 'settings-notification';
    document.body.appendChild(notification);
  }

  // Set the icon based on the type
  let icon = '';
  let bgColor = 'var(--primary-color)';
  
  if (type === 'success') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>';
  } else if (type === 'info') {
    icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z" fill="currentColor"/></svg>';
    bgColor = '#3b82f6';
  }
  
  // Set the notification content and styles
  notification.innerHTML = `${icon}<span>${message}</span>`;
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.gap = '8px';
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = bgColor;
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = 'var(--radius-sm)';
  notification.style.boxShadow = 'var(--shadow-md)';
  notification.style.zIndex = '1000';
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(20px)';
  notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  // Show the notification
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);

  // Hide the notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';

    // Remove the element after the animation finishes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Fetch GitHub statistics
async function fetchGitHubStats() {
  try {
    const response = await fetch('https://api.github.com/repos/wlsgur073/daily-arXiv-ai-enhanced');
    const data = await response.json();
    const starCount = data.stargazers_count;
    const forkCount = data.forks_count;

    document.getElementById('starCount').textContent = starCount;
    document.getElementById('forkCount').textContent = forkCount;
  } catch (error) {
    console.error('Failed to fetch GitHub statistics:', error);
    document.getElementById('starCount').textContent = '?';
    document.getElementById('forkCount').textContent = '?';
  }
} 