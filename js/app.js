let currentDate = '';
let availableDates = [];
let currentView = 'grid'; // 'grid' or 'list'
let currentCategory = 'all';
let urlCategoryParam = null; // category from URL parameter
let urlJsonParam = null; // json from URL parameter (API mode)
let urlAuthorParam = null; // author from URL parameter
let urlKeywordsParam = null; // keywords from URL parameter
let paperData = {};
let flatpickrInstance = null;
let isRangeMode = false;
let activeKeywords = []; // active keywords
let userKeywords = []; // user's keywords
let activeAuthors = []; // active authors
let userAuthors = []; // user's authors
let currentPaperIndex = 0; // index of the paper currently being viewed
let currentFilteredPapers = []; // current filtered paper list
let textSearchQuery = ''; // live text search query
let previousActiveKeywords = null; // saved active keyword set while text search is active
let previousActiveAuthors = null; // saved active author set while text search is active

// Load the user's keyword settings
function loadUserKeywords() {
  const savedKeywords = localStorage.getItem('preferredKeywords');
  if (savedKeywords) {
    try {
      userKeywords = JSON.parse(savedKeywords);
      // Activate all keywords by default
      activeKeywords = [...userKeywords];
    } catch (error) {
      console.error('Failed to parse keywords:', error);
      userKeywords = [];
      activeKeywords = [];
    }
  } else {
    userKeywords = [];
    activeKeywords = [];
  }
  
  // renderKeywordTags();
  renderFilterTags();
}

// Load the user's author settings
function loadUserAuthors() {
  const savedAuthors = localStorage.getItem('preferredAuthors');
  if (savedAuthors) {
    try {
      userAuthors = JSON.parse(savedAuthors);
      // Activate all authors by default
      activeAuthors = [...userAuthors];
    } catch (error) {
      console.error('Failed to parse authors:', error);
      userAuthors = [];
      activeAuthors = [];
    }
  } else {
    userAuthors = [];
    activeAuthors = [];
  }
  
  renderFilterTags();
}

// Render the filter tags (authors and keywords)
function renderFilterTags() {
  const filterTagsElement = document.getElementById('filterTags');
  const filterContainer = document.querySelector('.filter-label-container');

  // If there are no authors or keywords, only hide the tag area, but keep the container (to show the search button)
  if ((!userAuthors || userAuthors.length === 0) && (!userKeywords || userKeywords.length === 0)) {
    filterContainer.style.display = 'flex';
    if (filterTagsElement) {
      filterTagsElement.style.display = 'none';
      filterTagsElement.innerHTML = '';
    }
    return;
  }
  
  filterContainer.style.display = 'flex';
  if (filterTagsElement) {
    filterTagsElement.style.display = 'flex';
  }
  filterTagsElement.innerHTML = '';
  
  // Add author tags first
  if (userAuthors && userAuthors.length > 0) {
    userAuthors.forEach(author => {
      const tagElement = document.createElement('span');
      tagElement.className = `category-button author-button ${activeAuthors.includes(author) ? 'active' : ''}`;
      tagElement.textContent = author;
      tagElement.dataset.author = author;
      tagElement.title = "Match author name";
      
      tagElement.addEventListener('click', () => {
        toggleAuthorFilter(author);
      });
      
      filterTagsElement.appendChild(tagElement);
      
      // Add the appear animation, then remove the animation class
      if (!activeAuthors.includes(author)) {
        tagElement.classList.add('tag-appear');
        setTimeout(() => {
          tagElement.classList.remove('tag-appear');
        }, 300);
      }
    });
  }
  
  // Then add keyword tags
  if (userKeywords && userKeywords.length > 0) {
    userKeywords.forEach(keyword => {
      const tagElement = document.createElement('span');
      tagElement.className = `category-button keyword-button ${activeKeywords.includes(keyword) ? 'active' : ''}`;
      tagElement.textContent = keyword;
      tagElement.dataset.keyword = keyword;
      tagElement.title = "Match keywords in title and abstract";
      
      tagElement.addEventListener('click', () => {
        toggleKeywordFilter(keyword);
      });
      
      filterTagsElement.appendChild(tagElement);
      
      // Add the appear animation, then remove the animation class
      if (!activeKeywords.includes(keyword)) {
        tagElement.classList.add('tag-appear');
        setTimeout(() => {
          tagElement.classList.remove('tag-appear');
        }, 300);
      }
    });
  }
}

// Toggle keyword filter
function toggleKeywordFilter(keyword) {
  const index = activeKeywords.indexOf(keyword);

  if (index === -1) {
    // Activate this keyword
    activeKeywords.push(keyword);
  } else {
    // Deactivate this keyword
    activeKeywords.splice(index, 1);
  }

  // Update the keyword tag UI
  const keywordTags = document.querySelectorAll('[data-keyword]');
  keywordTags.forEach(tag => {
    if (tag.dataset.keyword === keyword) {
      // First remove any leftover highlight animation from the previous time
      tag.classList.remove('tag-highlight');

      // Add/remove the active state
      tag.classList.toggle('active', activeKeywords.includes(keyword));
      
      // Add the highlight animation
      setTimeout(() => {
        tag.classList.add('tag-highlight');
      }, 10);

      // Remove the highlight animation
      setTimeout(() => {
        tag.classList.remove('tag-highlight');
      }, 1000);
    }
  });
  
  // Re-render the paper list
  renderPapers();
}


// Toggle author filter
function toggleAuthorFilter(author) {
  const index = activeAuthors.indexOf(author);

  if (index === -1) {
    // Activate this author
    activeAuthors.push(author);
  } else {
    // Deactivate this author
    activeAuthors.splice(index, 1);
  }

  // Update the author tag UI
  const authorTags = document.querySelectorAll('[data-author]');
  authorTags.forEach(tag => {
    if (tag.dataset.author === author) {
      // First remove any leftover highlight animation from the previous time
      tag.classList.remove('tag-highlight');

      // Add/remove the active state
      tag.classList.toggle('active', activeAuthors.includes(author));
      
      // Add the highlight animation
      setTimeout(() => {
        tag.classList.add('tag-highlight');
      }, 10);

      // Remove the highlight animation
      setTimeout(() => {
        tag.classList.remove('tag-highlight');
      }, 1000);
    }
  });
  
  // Re-render the paper list
  renderPapers();
}

// Get category from URL parameter
function getUrlCategory() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  return category ? decodeURIComponent(category) : null;
}

// Get json from URL parameter (API mode)
function getJsonParam() {
  const params = new URLSearchParams(window.location.search);
  const json = params.get('json');
  return json ? decodeURIComponent(json) : null;
}

// Get author from URL parameter
function getUrlAuthor() {
  const params = new URLSearchParams(window.location.search);
  const author = params.get('author');
  return author ? decodeURIComponent(author).split(',').map(k => k.trim()).filter(k => k) : null;
}

// Get keywords from URL parameter
function getUrlKeywords() {
  const params = new URLSearchParams(window.location.search);
  const keywords = params.get('keywords');
  return keywords ? decodeURIComponent(keywords).split(',').map(k => k.trim()).filter(k => k) : null;
}

// Check whether running in JSON mode
function isJsonMode() {
  return getUrlCategory() !== null || getJsonParam() !== null || getUrlAuthor() !== null || getUrlKeywords() !== null;
}

// Output paper data in JSON format
function outputJsonData(papers, category) {
  const jsonData = {
    category: category,
    author: urlAuthorParam || null,
    keywords: urlKeywordsParam || null,
    count: papers.length,
    papers: papers.map(p => ({
      id: p.id,
      title: p.title,
      authors: p.authors,
      categories: p.category,
      summary: p.summary,
      date: p.date,
      url: p.url,
      reason: p.matchReason
    }))
  };

  // Clear the page content
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Set the JSON content
  document.body.textContent = JSON.stringify(jsonData, null, 2);
}

// Get papers by category (reuses existing logic)
function getPapersByCategory(paperData, category) {
  let papers = [];
  if (category === 'all') {
    const { sortedCategories } = getAllCategories(paperData);
    sortedCategories.forEach(cat => {
      if (paperData[cat]) {
        papers = papers.concat(paperData[cat]);
      }
    });
  } else if (paperData[category]) {
    papers = paperData[category];
  }
  return papers;
}

// Match papers by keywords (reuses existing logic: keywords are combined with "OR")
function matchPapersByKeywords(papers, keywords) {
  if (!keywords || keywords.length === 0) return papers.map(p => ({ ...p, isMatched: false, matchReason: null }));

  return papers.map(paper => {
    const matches = keywords.some(keyword => {
      const searchText = `${paper.title} ${paper.summary}`.toLowerCase();
      return searchText.includes(keyword.toLowerCase());
    });

    if (matches) {
      const matchedKeywords = keywords.filter(keyword => {
        const searchText = `${paper.title} ${paper.summary}`.toLowerCase();
        return searchText.includes(keyword.toLowerCase());
      });
      return {
        ...paper,
        isMatched: true,
        matchReason: matchedKeywords.length > 0 ? `Keywords: ${matchedKeywords.join(', ')}` : null
      };
    }
    return { ...paper, isMatched: false, matchReason: null };
  });
}

// Match papers by author (reuses existing logic)
function matchPapersByAuthor(papers, query_authors) {
  if (!query_authors) return papers.map(p => ({ ...p, isMatched: false, matchReason: null }));

  return papers.map(paper => {
    const matches = query_authors.some(author => {
      const searchText = `${paper.authors}`.toLowerCase();
      return searchText.includes(author.toLowerCase());
    });

    if (matches) {
      const matchedAuthors = query_authors.filter(author => {
        const searchText = `${paper.authors}`.toLowerCase();
        return searchText.includes(author.toLowerCase());
      });
      return {
        ...paper,
        isMatched: true,
        matchReason: matchedAuthors.length > 0 ? `Authors: ${matchedAuthors.join(', ')}` : null
      };
    }
    return { ...paper, isMatched: false, matchReason: null };
  });
}

// Combine keyword and author matching (reuses existing logic: keywords and authors are combined with "OR")
function matchPapersByKeywordsOrAuthor(papers, keywords, author) {
  // First get the keyword match results
  const keywordResults = matchPapersByKeywords(papers, keywords);

  // Then get the author match results
  const authorResults = matchPapersByAuthor(papers, author);

  // Merge: count a match if either the keyword or the author matches
  return papers.map((paper, index) => {
    const keywordMatch = keywordResults[index];
    const authorMatch = authorResults[index];

    const isMatched = keywordMatch.isMatched || authorMatch.isMatched;
    const matchReasons = [];
    if (keywordMatch.isMatched && keywordMatch.matchReason) {
      matchReasons.push(keywordMatch.matchReason);
    }
    if (authorMatch.isMatched && authorMatch.matchReason) {
      matchReasons.push(authorMatch.matchReason);
    }

    return {
      ...paper,
      isMatched: isMatched,
      matchReason: matchReasons.length > 0 ? matchReasons.join(' | ') : null
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();

  fetchGitHubStats();

  // Load the user's keywords
  loadUserKeywords();

  // Load the user's authors
  loadUserAuthors();

  // Parse the category, json, author and keywords parameters from the URL
  urlCategoryParam = getUrlCategory();
  urlJsonParam = getJsonParam();
  urlAuthorParam = getUrlAuthor();
  urlKeywordsParam = getUrlKeywords();

  fetchAvailableDates().then(() => {
    if (availableDates.length > 0) {
      loadPapersByDate(availableDates[0]);
    }
  });
});

async function fetchGitHubStats() {
  try {
    const response = await fetch('https://api.github.com/repos/wlsgur073/daily-arXiv-ai-enhanced');
    const data = await response.json();
    const starCount = data.stargazers_count;
    const forkCount = data.forks_count;
    
    document.getElementById('starCount').textContent = starCount;
    document.getElementById('forkCount').textContent = forkCount;
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    document.getElementById('starCount').textContent = '?';
    document.getElementById('forkCount').textContent = '?';
  }
}

function initEventListeners() {
  // Event listeners related to the date picker
  const calendarButton = document.getElementById('calendarButton');
  calendarButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDatePicker();
  });
  
  const datePickerModal = document.querySelector('.date-picker-modal');
  datePickerModal.addEventListener('click', (event) => {
    if (event.target === datePickerModal) {
      toggleDatePicker();
    }
  });
  
  const datePickerContent = document.querySelector('.date-picker-content');
  datePickerContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('dateRangeMode').addEventListener('change', toggleRangeMode);
  
  // Other existing event listeners
  document.getElementById('closeModal').addEventListener('click', closeModal);
  
  document.querySelector('.paper-modal').addEventListener('click', (event) => {
    const modal = document.querySelector('.paper-modal');
    const pdfContainer = modal.querySelector('.pdf-container');
    
    // If the click is on the modal background
    if (event.target === modal) {
      // Check whether the PDF is in the expanded state
      if (pdfContainer && pdfContainer.classList.contains('expanded')) {
        // If the PDF is expanded, first restore it to its normal size
        const expandButton = modal.querySelector('.pdf-expand-btn');
        if (expandButton) {
          togglePdfSize(expandButton);
        }
        // Stop the event from propagating further to prevent closing the whole modal
        event.stopPropagation();
      } else {
        // If the PDF is not expanded, close the whole modal
        closeModal();
      }
    }
  });
  
  // Add keyboard event listeners - Esc closes the modal, the left/right arrow keys switch papers, the R key shows a random paper
  document.addEventListener('keydown', (event) => {
    // Check whether an input or textarea is currently focused
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.isContentEditable
    );
    
    if (event.key === 'Escape') {
      const paperModal = document.getElementById('paperModal');
      const datePickerModal = document.getElementById('datePickerModal');
      
      // Close the paper modal
      if (paperModal.classList.contains('active')) {
        closeModal();
      }
      // Close the date picker modal
      else if (datePickerModal.classList.contains('active')) {
        toggleDatePicker();
      }
    }
    // Left/right arrow keys navigate papers (only when the paper modal is open)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const paperModal = document.getElementById('paperModal');
      if (paperModal.classList.contains('active')) {
        event.preventDefault(); // Prevent the page from scrolling

        if (event.key === 'ArrowLeft') {
          navigateToPreviousPaper();
        } else if (event.key === 'ArrowRight') {
          navigateToNextPaper();
        }
      }
    }
    // The space key shows a random paper (when no input is focused and the date picker is not open)
    else if (event.key === ' ' || event.key === 'Spacebar') {
      const paperModal = document.getElementById('paperModal');
      const datePickerModal = document.getElementById('datePickerModal');

      // Only trigger when no input is focused and the date picker is not open
      // It is now also allowed to use the R key to switch to a random paper while the paper modal is open
      if (!isInputFocused && !datePickerModal.classList.contains('active')) {
        event.preventDefault(); // Prevent the page from refreshing
        event.stopPropagation(); // Stop the event from bubbling
        showRandomPaper();
      }
    }
  });
  
  // Add mouse-wheel horizontal scrolling support
  const categoryScroll = document.querySelector('.category-scroll');
  const keywordScroll = document.querySelector('.keyword-scroll');
  const authorScroll = document.querySelector('.author-scroll');

  // Add a mouse-wheel event for category scrolling
  if (categoryScroll) {
    categoryScroll.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });
  }
  
  // Add a mouse-wheel event for keyword scrolling
  if (keywordScroll) {
    keywordScroll.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });
  }
  
  // Add a mouse-wheel event for author scrolling
  if (authorScroll) {
    authorScroll.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });
  }

  // Other event listeners...
  const categoryButtons = document.querySelectorAll('.category-button');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      filterByCategory(category);
    });
  });

  // Back-to-top button: show/hide on scroll + click to return to top
  const backToTopButton = document.getElementById('backToTop');
  if (backToTopButton) {
    const updateBackToTopVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollTop > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    };

    // Check once on init (prevents it from not showing when refreshing partway down the page)
    updateBackToTopVisibility();
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });

    backToTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Text search: the magnifier toggles the input field
  const searchToggle = document.getElementById('textSearchToggle');
  const searchWrapper = document.querySelector('#textSearchContainer .search-input-wrapper');
  const searchInput = document.getElementById('textSearchInput');
  const searchClear = document.getElementById('textSearchClear');

  if (searchToggle && searchWrapper && searchInput && searchClear) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      searchWrapper.style.display = 'flex';
      searchInput.focus();
    });

    // Update the query and re-render on input
    const handleInput = () => {
      const value = searchInput.value.trim();
      textSearchQuery = value;
      // When there is non-empty text: actually deactivate the keyword/author filters via the toggle functions, and record the previous state
      if (textSearchQuery.length > 0) {
        if (previousActiveKeywords === null) {
          previousActiveKeywords = [...activeKeywords];
        }
        if (previousActiveAuthors === null) {
          previousActiveAuthors = [...activeAuthors];
        }
        // Deactivate each currently active keyword/author one by one
        // Note: copy the arrays before iterating, to avoid iteration problems caused by modifying the original arrays during toggling
        const keywordsToDisable = [...activeKeywords];
        const authorsToDisable = [...activeAuthors];
        keywordsToDisable.forEach(k => toggleKeywordFilter(k));
        authorsToDisable.forEach(a => toggleAuthorFilter(a));
      } else {
        // The text has been cleared, so restore the previously recorded active keyword/author state
        if (previousActiveKeywords && previousActiveKeywords.length > 0) {
          previousActiveKeywords.forEach(k => {
            // If it is not currently active, toggle it back to active
            if (!activeKeywords.includes(k)) toggleKeywordFilter(k);
          });
        }
        if (previousActiveAuthors && previousActiveAuthors.length > 0) {
          previousActiveAuthors.forEach(a => {
            if (!activeAuthors.includes(a)) toggleAuthorFilter(a);
          });
        }
        previousActiveKeywords = null;
        previousActiveAuthors = null;
        // Automatically hide the input field when the text is empty
        searchWrapper.style.display = 'none';
      }

      // Control whether the clear button is shown
      searchClear.style.display = textSearchQuery.length > 0 ? 'inline-flex' : 'none';

      renderPapers();
    };

    searchInput.addEventListener('input', handleInput);

    // Clear button: clear the text and restore the other filters
    searchClear.addEventListener('click', (e) => {
      e.stopPropagation();
      searchInput.value = '';
      textSearchQuery = '';
      searchClear.style.display = 'none';
      // Restore the previous filter state (if any)
      if (previousActiveKeywords && previousActiveKeywords.length > 0) {
        previousActiveKeywords.forEach(k => {
          if (!activeKeywords.includes(k)) toggleKeywordFilter(k);
        });
      }
      if (previousActiveAuthors && previousActiveAuthors.length > 0) {
        previousActiveAuthors.forEach(a => {
          if (!activeAuthors.includes(a)) toggleAuthorFilter(a);
        });
      }
      previousActiveKeywords = null;
      previousActiveAuthors = null;
      renderPapers();
      // Hide the input field after clearing
      searchWrapper.style.display = 'none';
    });

    // On blur: hide the input field if the text is empty (keep it visible when there is text)
    searchInput.addEventListener('blur', () => {
      const value = searchInput.value.trim();
      if (value.length === 0) {
        searchWrapper.style.display = 'none';
      }
    });

    // Clicking elsewhere does not hide the input field (requirement 4), so no blur-hide logic is added here
  }
}

// Function to detect preferred language based on browser settings
function getPreferredLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  // Check if browser is set to Chinese variants
  if (browserLang.startsWith('zh')) {
    return 'Chinese';
  }
  // Default to English for all other languages
  return 'English';
}

// Function to select the best available language for a date
function selectLanguageForDate(date, preferredLanguage = null) {
  const availableLanguages = window.dateLanguageMap?.get(date) || [];
  
  if (availableLanguages.length === 0) {
    return 'Chinese'; // fallback
  }
  
  // Use provided preference or detect from browser
  const preferred = preferredLanguage || getPreferredLanguage();
  
  // If preferred language is available, use it
  if (availableLanguages.includes(preferred)) {
    return preferred;
  }
  
  // Fallback: prefer Chinese if available, otherwise use the first available
  return availableLanguages.includes('Chinese') ? 'Chinese' : availableLanguages[0];
}

async function fetchAvailableDates() {
  try {
    // Fetch the file list from the data branch
    const fileListUrl = DATA_CONFIG.getDataUrl('assets/file-list.txt');
    const response = await fetch(fileListUrl);
    if (!response.ok) {
      console.error('Error fetching file list:', response.status);
      return [];
    }
    const text = await response.text();
    const files = text.trim().split('\n');

    const dateRegex = /(\d{4}-\d{2}-\d{2})_AI_enhanced_(English|Chinese)\.jsonl/;
    const dateLanguageMap = new Map(); // Store date -> available languages
    const dates = [];
    
    files.forEach(file => {
      const match = file.match(dateRegex);
      if (match && match[1] && match[2]) {
        const date = match[1];
        const language = match[2];
        
        if (!dateLanguageMap.has(date)) {
          dateLanguageMap.set(date, []);
          dates.push(date);
        }
        dateLanguageMap.get(date).push(language);
      }
    });
    
    // Store the language mapping globally for later use
    window.dateLanguageMap = dateLanguageMap;
    availableDates = [...new Set(dates)];
    availableDates.sort((a, b) => new Date(b) - new Date(a));

    initDatePicker(); // Assuming this function uses availableDates

    return availableDates;
  } catch (error) {
    console.error('Failed to fetch available dates:', error);
  }
}

function initDatePicker() {
  const datepickerInput = document.getElementById('datepicker');
  
  if (flatpickrInstance) {
    flatpickrInstance.destroy();
  }
  
  // Build a map of available dates, used to disable invalid dates
  const enabledDatesMap = {};
  availableDates.forEach(date => {
    enabledDatesMap[date] = true;
  });

  // Configure Flatpickr
  flatpickrInstance = flatpickr(datepickerInput, {
    inline: true,
    dateFormat: "Y-m-d",
    defaultDate: availableDates[0],
    enable: [
      function(date) {
        // Only enable valid dates
        const dateStr = date.getFullYear() + "-" +
                        String(date.getMonth() + 1).padStart(2, '0') + "-" +
                        String(date.getDate()).padStart(2, '0');
        // Return false for any date after availableDates[0], otherwise return true
        return dateStr <= availableDates[0];
      }
    ],
    onChange: function(selectedDates, dateStr) {
      if (isRangeMode && selectedDates.length === 2) {
        // Handle date range selection
        const startDate = formatDateForAPI(selectedDates[0]);
        const endDate = formatDateForAPI(selectedDates[1]);
        loadPapersByDateRange(startDate, endDate);
        toggleDatePicker();
      } else if (!isRangeMode && selectedDates.length === 1) {
        // Handle single date selection
        const selectedDate = formatDateForAPI(selectedDates[0]);
        // if (availableDates.includes(selectedDate)) {
          loadPapersByDate(selectedDate);
          toggleDatePicker();
        // }
      }
    }
  });
  
  // Hide the date input field
  const inputElement = document.querySelector('.flatpickr-input');
  if (inputElement) {
    inputElement.style.display = 'none';
  }
}

function formatDateForAPI(date) {
  return date.getFullYear() + "-" + 
         String(date.getMonth() + 1).padStart(2, '0') + "-" + 
         String(date.getDate()).padStart(2, '0');
}

function toggleRangeMode() {
  isRangeMode = document.getElementById('dateRangeMode').checked;
  
  if (flatpickrInstance) {
    flatpickrInstance.set('mode', isRangeMode ? 'range' : 'single');
  }
}

async function loadPapersByDate(date) {
  currentDate = date;
  document.getElementById('currentDate').textContent = formatDate(date);

  // Update the selected date in the date picker
  if (flatpickrInstance) {
    flatpickrInstance.setDate(date, false);
  }

  // No longer reset the active keywords and authors
  // Instead, keep the current selection state

  const container = document.getElementById('paperContainer');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading paper...</p>
    </div>
  `;
  
  try {
    const selectedLanguage = selectLanguageForDate(date);
    // Fetch the data file from the data branch
    const dataUrl = DATA_CONFIG.getDataUrl(`data/${date}_AI_enhanced_${selectedLanguage}.jsonl`);
    const response = await fetch(dataUrl);
    // If the file does not exist (e.g. returns 404), show a "no papers" message in the paper display area
    if (!response.ok) {
      if (response.status === 404) {
        container.innerHTML = `
          <div class="loading-container">
            <p>No papers found for this date.</p>
          </div>
        `;
        paperData = {};
        renderCategoryFilter({ sortedCategories: [], categoryCounts: {} });
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    // An empty file also shows a "no papers" message
    if (!text || text.trim() === '') {
      container.innerHTML = `
        <div class="loading-container">
          <p>No papers found for this date.</p>
        </div>
      `;
      paperData = {};
      renderCategoryFilter({ sortedCategories: [], categoryCounts: {} });
      return;
    }
    
    paperData = parseJsonlData(text, date);

    const categories = getAllCategories(paperData);

    renderCategoryFilter(categories);

    // If the URL has category, json, author or keywords parameters, return JSON directly
    const hasJsonParams = urlCategoryParam !== null || urlJsonParam !== null || urlAuthorParam !== null || urlKeywordsParam !== null;
    if (hasJsonParams) {
      // Get the base paper list (by category or all)
      const targetCategory = urlCategoryParam || urlJsonParam || 'all';
      let papers = getPapersByCategory(paperData, targetCategory);

      // Apply keyword and author matching ("OR" relationship)
      if (urlKeywordsParam || urlAuthorParam) {
        papers = matchPapersByKeywordsOrAuthor(papers, urlKeywordsParam, urlAuthorParam);
      }

      // JSON mode: only return matched papers
      papers = papers.filter(p => p.isMatched);

      outputJsonData(papers, targetCategory);
      return;
    }

    renderPapers();
  } catch (error) {
    console.error('Failed to load paper data:', error);
    container.innerHTML = `
      <div class="loading-container">
        <p>Loading data fails. Please retry.</p>
        <p>Error messages: ${error.message}</p>
      </div>
    `;
  }
}

function parseJsonlData(jsonlText, date) {
  const result = {};
  
  const lines = jsonlText.trim().split('\n');
  
  lines.forEach(line => {
    try {
      const paper = JSON.parse(line);
      
      if (!paper.categories) {
        return;
      }
      
      let allCategories = Array.isArray(paper.categories) ? paper.categories : [paper.categories];
      
      const primaryCategory = allCategories[0];
      
      if (!result[primaryCategory]) {
        result[primaryCategory] = [];
      }
      
      const summary = paper.AI && paper.AI.tldr ? paper.AI.tldr : paper.summary;
      
      result[primaryCategory].push({
        title: paper.title,
        url: paper.abs || paper.pdf || `https://arxiv.org/abs/${paper.id}`,
        authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
        category: allCategories,
        summary: summary,
        details: paper.summary || '',
        date: date,
        id: paper.id,
        motivation: paper.AI && paper.AI.motivation ? paper.AI.motivation : '',
        method: paper.AI && paper.AI.method ? paper.AI.method : '',
        result: paper.AI && paper.AI.result ? paper.AI.result : '',
        conclusion: paper.AI && paper.AI.conclusion ? paper.AI.conclusion : '',
        code_url: paper.code_url || '',
        code_stars: paper.code_stars || 0,
        code_last_update: paper.code_last_update || ''
      });
    } catch (error) {
      console.error('Failed to parse JSON line:', error, line);
    }
  });
  
  return result;
}

// Get all categories and sort them by preference
function getAllCategories(data) {
  const categories = Object.keys(data);
  const catePaperCount = {};
  
  categories.forEach(category => {
    catePaperCount[category] = data[category] ? data[category].length : 0;
  });
  
  return {
    sortedCategories: categories.sort((a, b) => {
      return a.localeCompare(b);
    }),
    categoryCounts: catePaperCount
  };
}

function renderCategoryFilter(categories) {
  const container = document.querySelector('.category-scroll');
  const { sortedCategories, categoryCounts } = categories;
  
  let totalPapers = 0;
  Object.values(categoryCounts).forEach(count => {
    totalPapers += count;
  });
  
  container.innerHTML = `
    <button class="category-button ${currentCategory === 'all' ? 'active' : ''}" data-category="all">All<span class="category-count">${totalPapers}</span></button>
  `;
  
  sortedCategories.forEach(category => {
    const count = categoryCounts[category];
    const button = document.createElement('button');
    button.className = `category-button ${category === currentCategory ? 'active' : ''}`;
    button.innerHTML = `${category}<span class="category-count">${count}</span>`;
    button.dataset.category = category;
    button.addEventListener('click', () => {
      filterByCategory(category);
    });
    
    container.appendChild(button);
  });
  
  document.querySelector('.category-button[data-category="all"]').addEventListener('click', () => {
    filterByCategory('all');
  });
}

function filterByCategory(category) {
  currentCategory = category;

  // Only update the URL parameters if not in JSON mode
  if (!isJsonMode()) {
    const url = new URL(window.location);
    if (category === 'all') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    // Use replaceState to update the URL without refreshing the page
    window.history.replaceState({}, '', url);
  }

  document.querySelectorAll('.category-button').forEach(button => {
    button.classList.toggle('active', button.dataset.category === category);
  });

  // Keep the currently active filter tags
  renderFilterTags();

  // Reset the page scroll position to the top
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  
  renderPapers();
}

// Helper function: highlight the matching content in the text
function highlightMatches(text, terms, className = 'highlight-match') {
  if (!terms || terms.length === 0 || !text) {
    return text;
  }
  
  let result = text;
  
  // Sort the terms by length, from longest to shortest, to avoid a short term being replaced first and breaking a longer match
  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);

  // Create a regular expression for each term, using the 'gi' flags for a global, case-insensitive match
  sortedTerms.forEach(term => {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, `<span class="${className}">$1</span>`);
  });
  
  return result;
}

// Helper function: format the author list (used for paper card display)
// Rule: show all authors when there are <=4; when there are >4, show the first 2 + last 2 with an ellipsis in between
function formatAuthorsForCard(authorsString, authorTerms = []) {
  if (!authorsString) {
    return '';
  }

  // Parse the author string into an array (handling the comma-separated case)
  const authorsArray = authorsString.split(',').map(author => author.trim()).filter(author => author.length > 0);

  if (authorsArray.length === 0) {
    return '';
  }

  // If there are no more than 4 authors, show all of them
  if (authorsArray.length <= 4) {
    return authorsArray.map(author => {
      // Apply highlighting to each author
      const highlightedAuthor = authorTerms.length > 0
        ? highlightMatches(author, authorTerms, 'author-highlight')
        : author;
      return `<span class="author-item">${highlightedAuthor}</span>`;
    }).join(', ');
  }
  
  // More than 4 authors: show the first 2, an ellipsis, then the last 2
  const firstTwo = authorsArray.slice(0, 2);
  const lastTwo = authorsArray.slice(-2);

  const result = [];

  // First 2 authors
  firstTwo.forEach(author => {
    const highlightedAuthor = authorTerms.length > 0 
      ? highlightMatches(author, authorTerms, 'author-highlight')
      : author;
    result.push(`<span class="author-item">${highlightedAuthor}</span>`);
  });
  
  // Ellipsis
  result.push('<span class="author-ellipsis">...</span>');

  // Last 2 authors
  lastTwo.forEach(author => {
    const highlightedAuthor = authorTerms.length > 0 
      ? highlightMatches(author, authorTerms, 'author-highlight')
      : author;
    result.push(`<span class="author-item">${highlightedAuthor}</span>`);
  });
  
  return result.join(', ');
}

function renderPapers() {
  const container = document.getElementById('paperContainer');
  container.innerHTML = '';
  container.className = `paper-container ${currentView === 'list' ? 'list-view' : ''}`;
  
  let papers = [];
  if (currentCategory === 'all') {
    const { sortedCategories } = getAllCategories(paperData);
    sortedCategories.forEach(category => {
      if (paperData[category]) {
        papers = papers.concat(paperData[category]);
      }
    });
  } else if (paperData[currentCategory]) {
    papers = paperData[currentCategory];
  }
  
  // Build the set of matching papers
  let filteredPapers = [...papers];

  // Reset the match state of all papers to avoid leftovers from the previous render
  filteredPapers.forEach(p => {
    p.isMatched = false;
    p.matchReason = undefined;
  });

  // Text search takes priority: when there is non-empty text, only sort (do not hide), just like keywords/authors
  if (textSearchQuery && textSearchQuery.trim().length > 0) {
    const q = textSearchQuery.toLowerCase();

    // Sort: matching papers come first
    filteredPapers.sort((a, b) => {
      const hayA = [
        a.title,
        a.authors,
        Array.isArray(a.category) ? a.category.join(', ') : a.category,
        a.summary,
        a.details || '',
        a.motivation || '',
        a.method || '',
        a.result || '',
        a.conclusion || ''
      ].join(' ').toLowerCase();
      const hayB = [
        b.title,
        b.authors,
        Array.isArray(b.category) ? b.category.join(', ') : b.category,
        b.summary,
        b.details || '',
        b.motivation || '',
        b.method || '',
        b.result || '',
        b.conclusion || ''
      ].join(' ').toLowerCase();
      const am = hayA.includes(q);
      const bm = hayB.includes(q);
      if (am && !bm) return -1;
      if (!am && bm) return 1;
      return 0;
    });

    // Mark the matches, used for card styling and tooltips
    filteredPapers.forEach(p => {
      const hay = [
        p.title,
        p.authors,
        Array.isArray(p.category) ? p.category.join(', ') : p.category,
        p.summary,
        p.details || '',
        p.motivation || '',
        p.method || '',
        p.result || '',
        p.conclusion || ''
      ].join(' ').toLowerCase();
      const matched = hay.includes(q);
      p.isMatched = matched;
      p.matchReason = matched ? [`Text: ${textSearchQuery}`] : undefined;
    });
  } else {
    // Match by keywords and authors, but do not filter; only sort
    if (activeKeywords.length > 0 || activeAuthors.length > 0) {
      // Sort the papers so that matching papers come first
      filteredPapers.sort((a, b) => {
        const aMatchesKeyword = activeKeywords.length > 0 ? 
          activeKeywords.some(keyword => {
            // Only search for keywords in the title and abstract
            const searchText =`${a.title} ${a.summary}`.toLowerCase();
            return searchText.includes(keyword.toLowerCase());
          }) : false;
          
        const aMatchesAuthor = activeAuthors.length > 0 ?
          activeAuthors.some(author => {
            // Only search the author field for author names
            returna.authors.toLowerCase().includes(author.toLowerCase());
          }) : false;
          
        const bMatchesKeyword = activeKeywords.length > 0 ?
          activeKeywords.some(keyword => {
            // Only search for keywords in the title and abstract
            const searchText =`${b.title} ${b.summary}`.toLowerCase();
            return searchText.includes(keyword.toLowerCase());
          }) : false;
          
        const bMatchesAuthor = activeAuthors.length > 0 ?
          activeAuthors.some(author => {
            // Only search the author field for author names
            returnb.authors.toLowerCase().includes(author.toLowerCase());
          }) : false;
      
        // Match state of a and b (counts as a match if either keyword or author matches)
        const aMatches = aMatchesKeyword || aMatchesAuthor;
        const bMatches = bMatchesKeyword || bMatchesAuthor;
        
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
      
      // Mark the matching papers
      filteredPapers.forEach(paper => {
        const matchesKeyword = activeKeywords.length > 0 ?
          activeKeywords.some(keyword => {
            const searchText = `${paper.title} ${paper.summary}`.toLowerCase();
            return searchText.includes(keyword.toLowerCase());
          }) : false;
          
        const matchesAuthor = activeAuthors.length > 0 ?
          activeAuthors.some(author => {
            return paper.authors.toLowerCase().includes(author.toLowerCase());
          }) : false;
          
        // Add a match marker (used later to highlight the whole paper card)
        paper.isMatched = matchesKeyword || matchesAuthor;

        // Add the match reason (used to display the match tooltip)
        if (paper.isMatched) {
          paper.matchReason = [];
          if (matchesKeyword) {
            const matchedKeywords = activeKeywords.filter(keyword => 
              `${paper.title} ${paper.summary}`.toLowerCase().includes(keyword.toLowerCase())
            );
            if (matchedKeywords.length > 0) {
              paper.matchReason.push(`Keywords: ${matchedKeywords.join(', ')}`);
            }
          }
          if (matchesAuthor) {
            const matchedAuthors = activeAuthors.filter(author => 
              paper.authors.toLowerCase().includes(author.toLowerCase())
            );
            if (matchedAuthors.length > 0) {
              paper.matchReason.push(`Authors: ${matchedAuthors.join(', ')}`);
            }
          }
        }
      });
    }
  }
  
  // Match by keywords and authors, but do not filter; only sort
  if (activeKeywords.length > 0 || activeAuthors.length > 0) {
    // Sort the papers so that matching papers come first
    filteredPapers.sort((a, b) => {
      const aMatchesKeyword = activeKeywords.length > 0 ? 
        activeKeywords.some(keyword => {
          // Only search for keywords in the title and abstract
          const searchText =`${a.title} ${a.summary}`.toLowerCase();
          return searchText.includes(keyword.toLowerCase());
        }) : false;
        
      const aMatchesAuthor = activeAuthors.length > 0 ?
        activeAuthors.some(author => {
          // Only search the author field for author names
          returna.authors.toLowerCase().includes(author.toLowerCase());
        }) : false;
        
      const bMatchesKeyword = activeKeywords.length > 0 ?
        activeKeywords.some(keyword => {
          // Only search for keywords in the title and abstract
          const searchText =`${b.title} ${b.summary}`.toLowerCase();
          return searchText.includes(keyword.toLowerCase());
        }) : false;
        
      const bMatchesAuthor = activeAuthors.length > 0 ?
        activeAuthors.some(author => {
          // Only search the author field for author names
          returnb.authors.toLowerCase().includes(author.toLowerCase());
        }) : false;
      
      // Match state of a and b (counts as a match if either keyword or author matches)
      const aMatches = aMatchesKeyword || aMatchesAuthor;
      const bMatches = bMatchesKeyword || bMatchesAuthor;
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
    
    // Mark the matching papers
    filteredPapers.forEach(paper => {
      const matchesKeyword = activeKeywords.length > 0 ?
        activeKeywords.some(keyword => {
          const searchText = `${paper.title} ${paper.summary}`.toLowerCase();
          return searchText.includes(keyword.toLowerCase());
        }) : false;
        
      const matchesAuthor = activeAuthors.length > 0 ?
        activeAuthors.some(author => {
          return paper.authors.toLowerCase().includes(author.toLowerCase());
        }) : false;
        
      // Add a match marker (used later to highlight the whole paper card)
      paper.isMatched = matchesKeyword || matchesAuthor;

      // Add the match reason (used to display the match tooltip)
      if (paper.isMatched) {
        paper.matchReason = [];
        if (matchesKeyword) {
          const matchedKeywords = activeKeywords.filter(keyword => 
            `${paper.title} ${paper.summary}`.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matchedKeywords.length > 0) {
            paper.matchReason.push(`Keywords: ${matchedKeywords.join(', ')}`);
          }
        }
        if (matchesAuthor) {
          const matchedAuthors = activeAuthors.filter(author => 
            paper.authors.toLowerCase().includes(author.toLowerCase())
          );
          if (matchedAuthors.length > 0) {
            paper.matchReason.push(`Authors: ${matchedAuthors.join(', ')}`);
          }
        }
      }
    });
  }
  
  // Store the current filtered paper list, used for arrow-key navigation
  currentFilteredPapers = [...filteredPapers];
  
  if (filteredPapers.length === 0) {
    container.innerHTML = `
      <div class="loading-container">
        <p>No paper found.</p>
      </div>
    `;
    return;
  }
  
  filteredPapers.forEach((paper, index) => {
    const paperCard = document.createElement('div');
    // Add the match highlight class
    paperCard.className = `paper-card ${paper.isMatched ? 'matched-paper' : ''}`;
    paperCard.dataset.id = paper.id || paper.url;

    if (paper.isMatched) {
      // Add the match reason tooltip
      paperCard.title = `Matched: ${paper.matchReason.join(' | ')}`;
    }
    
    const categoryTags = paper.allCategories ? 
      paper.allCategories.map(cat => `<span class="category-tag">${cat}</span>`).join('') : 
      `<span class="category-tag">${paper.category}</span>`;
    
    // Combine the terms to highlight: keywords + text search
    const titleSummaryTerms = [];
    if (activeKeywords.length > 0) {
      titleSummaryTerms.push(...activeKeywords);
    }
    if (textSearchQuery && textSearchQuery.trim().length > 0) {
      titleSummaryTerms.push(textSearchQuery.trim());
    }

    // Highlight the title and summary (keywords and text search)
    const highlightedTitle = titleSummaryTerms.length > 0
      ? highlightMatches(paper.title, titleSummaryTerms, 'keyword-highlight') 
      : paper.title;
    const highlightedSummary = titleSummaryTerms.length > 0 
      ? highlightMatches(paper.summary, titleSummaryTerms, 'keyword-highlight') 
      : paper.summary;

    // Highlight authors (author filter + text search)
    const authorTerms = [];
    if (activeAuthors.length > 0) authorTerms.push(...activeAuthors);
    if (textSearchQuery && textSearchQuery.trim().length > 0) authorTerms.push(textSearchQuery.trim());

    // Format the author list (apply the truncation rule and highlighting)
    const formattedAuthors = formatAuthorsForCard(paper.authors, authorTerms);

    // Build the GitHub button HTML
    // let githubHtml = '';
    // if (paper.code_url) {
    //   const stars = paper.code_stars ? `<span class="github-stars">★ ${paper.code_stars}</span>` : '';
    //   const isHot = paper.code_stars > 100;
      
    //   githubHtml = `
    //     <a href="${paper.code_url}" target="_blank" class="github-link" title="View Code" onclick="event.stopPropagation()">
    //       <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom; margin-right: 4px;">
    //         <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
    //       </svg>
    //       Code ${stars}
    //       ${isHot ? '<span class="hot-icon">🔥</span>' : ''}
    //     </a>
    //   `;
    // }

    paperCard.innerHTML = `
      <div class="paper-card-index">${index + 1}</div>
      ${paper.isMatched ? '<div class="match-badge" title="Matches your search criteria"></div>' : ''}
      <div class="paper-card-header">
        <h3 class="paper-card-title">${highlightedTitle}</h3>
        <p class="paper-card-authors">${formattedAuthors}</p>
        <div class="paper-card-categories">
          ${categoryTags}
        </div>
      </div>
      <div class="paper-card-body">
        <p class="paper-card-summary">${highlightedSummary}</p>
        <div class="paper-card-footer">
          <div class="footer-left">
            <span class="paper-card-date">${formatDate(paper.date)}</span>
          </div>
          <span class="paper-card-link">Details</span>
        </div>
      </div>
    `;
    
    paperCard.addEventListener('click', () => {
      currentPaperIndex = index; // Record the index of the paper currently clicked
      showPaperDetails(paper, index + 1);
    });
    
    container.appendChild(paperCard);
  });
}

function showPaperDetails(paper, paperIndex) {
  const modal = document.getElementById('paperModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const paperLink = document.getElementById('paperLink');
  const pdfLink = document.getElementById('pdfLink');
  const htmlLink = document.getElementById('htmlLink');
  
  // Reset the modal scroll position
  modalBody.scrollTop = 0;

  // Combine the highlight terms: keywords + text search
  const modalTitleTerms = [];
  if (activeKeywords.length > 0) modalTitleTerms.push(...activeKeywords);
  if (textSearchQuery && textSearchQuery.trim().length > 0) modalTitleTerms.push(textSearchQuery.trim());
  // Highlight the title
  const highlightedTitle = modalTitleTerms.length > 0
    ? highlightMatches(paper.title, modalTitleTerms, 'keyword-highlight') 
    : paper.title;
  
  // Add the index number before the title
  modalTitle.innerHTML = paperIndex ? `<span class="paper-index-badge">${paperIndex}</span> ${highlightedTitle}` : highlightedTitle;
  
  const abstractText = paper.details || '';
  
  const categoryDisplay = paper.allCategories ? 
    paper.allCategories.join(', ') : 
    paper.category;
  
  // Highlight authors (author filter + text search)
  const modalAuthorTerms = [];
  if (activeAuthors.length > 0) modalAuthorTerms.push(...activeAuthors);
  if (textSearchQuery && textSearchQuery.trim().length > 0) modalAuthorTerms.push(textSearchQuery.trim());
  const highlightedAuthors = modalAuthorTerms.length > 0 
    ? highlightMatches(paper.authors, modalAuthorTerms, 'author-highlight') 
    : paper.authors;
  
  // Highlight the summary (keywords + text search)
  const highlightedSummary = modalTitleTerms.length > 0
    ? highlightMatches(paper.summary, modalTitleTerms, 'keyword-highlight') 
    : paper.summary;
  
  // Highlight the details (Abstract/details)
  const highlightedAbstract = modalTitleTerms.length > 0
    ? highlightMatches(abstractText, modalTitleTerms, 'keyword-highlight') 
    : abstractText;
  
  // Highlight the other sections (if they exist and are part of the summary)
  const highlightedMotivation = paper.motivation && modalTitleTerms.length > 0
    ? highlightMatches(paper.motivation, modalTitleTerms, 'keyword-highlight') 
    : paper.motivation;
  
  const highlightedMethod = paper.method && modalTitleTerms.length > 0 
    ? highlightMatches(paper.method, modalTitleTerms, 'keyword-highlight') 
    : paper.method;
  
  const highlightedResult = paper.result && modalTitleTerms.length > 0 
    ? highlightMatches(paper.result, modalTitleTerms, 'keyword-highlight') 
    : paper.result;
  
  const highlightedConclusion = paper.conclusion && modalTitleTerms.length > 0 
    ? highlightMatches(paper.conclusion, modalTitleTerms, 'keyword-highlight') 
    : paper.conclusion;
  
  // Determine whether the highlight legend needs to be shown
  const showHighlightLegend = activeKeywords.length > 0 || activeAuthors.length > 0;

  // Add the match marker
  const matchedPaperClass = paper.isMatched ? 'matched-paper-details' : '';
  
  const modalContent = `
    <div class="paper-details ${matchedPaperClass}">
      <p><strong>Authors: </strong>${highlightedAuthors}</p>
      <p><strong>Categories: </strong>${categoryDisplay}</p>
      <p><strong>Date: </strong>${formatDate(paper.date)}</p>
      
      
      <h3>TL;DR</h3>
      <p>${highlightedSummary}</p>
      
      <div class="paper-sections">
        ${paper.motivation ? `<div class="paper-section"><h4>Motivation</h4><p>${highlightedMotivation}</p></div>` : ''}
        ${paper.method ? `<div class="paper-section"><h4>Method</h4><p>${highlightedMethod}</p></div>` : ''}
        ${paper.result ? `<div class="paper-section"><h4>Result</h4><p>${highlightedResult}</p></div>` : ''}
        ${paper.conclusion ? `<div class="paper-section"><h4>Conclusion</h4><p>${highlightedConclusion}</p></div>` : ''}
      </div>
      
      ${highlightedAbstract ? `<h3>Abstract</h3><p class="original-abstract">${highlightedAbstract}</p>` : ''}
      
      <div class="pdf-preview-section">
        <div class="pdf-header">
          <h3>PDF Preview</h3>
          <button class="pdf-expand-btn" onclick="togglePdfSize(this)">
            <svg class="expand-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            <svg class="collapse-icon" viewBox="0 0 24 24" width="24" height="24" style="display: none;">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          </button>
        </div>
        <div class="pdf-container">
          <iframe src="${paper.url.replace('abs', 'pdf')}" width="100%" height="800px" frameborder="0"></iframe>
        </div>
      </div>
    </div>
  `;
  
  // Update modal content
  document.getElementById('modalBody').innerHTML = modalContent;
  document.getElementById('paperLink').href = paper.url;
  document.getElementById('pdfLink').href = paper.url.replace('abs', 'pdf');
  document.getElementById('htmlLink').href = paper.url.replace('abs', 'html');
  
  // --- GitHub Button Logic ---
  const githubLink = document.getElementById('githubLink');
  
  if (paper.code_url) {
    githubLink.href = paper.code_url;
    githubLink.style.display = 'flex'; 
    githubLink.title = "View Code on GitHub";
  } else {
    githubLink.style.display = 'none';
  }
  // ---------------------------

  // Prompt adapted from: https://papers.cool/
  prompt = `Please read this paper ${paper.url.replace('abs', 'pdf')}, and summarize the problem it addresses, the related work, the research method, what experiments were performed and their results, and the conclusion, then give an overall summary of the paper's content`
  document.getElementById('kimiChatLink').href = `https://www.kimi.com/_prefill_chat?prefill_prompt=${prompt}&system_prompt=You are an academic assistant. The following conversation will revolve around the content of the paper below; the paper's PDF and its existing FAQ have already been provided via the links. The user will continue to ask you questions about the paper. Please give professional answers, avoid the first person, and when a point-by-point answer is appropriate, you are encouraged to output in markdown format.&send_immediately=true&force_search=true`;
  
  // Update the paper position info
  const paperPosition = document.getElementById('paperPosition');
  if (paperPosition && currentFilteredPapers.length > 0) {
    paperPosition.textContent = `${currentPaperIndex + 1} / ${currentFilteredPapers.length}`;
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('paperModal');
  const modalBody = document.getElementById('modalBody');

  // Reset the modal scroll position
  modalBody.scrollTop = 0;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Navigate to the previous paper
function navigateToPreviousPaper() {
  if (currentFilteredPapers.length === 0) return;
  
  currentPaperIndex = currentPaperIndex > 0 ? currentPaperIndex - 1 : currentFilteredPapers.length - 1;
  const paper = currentFilteredPapers[currentPaperIndex];
  showPaperDetails(paper, currentPaperIndex + 1);
}

// Navigate to the next paper
function navigateToNextPaper() {
  if (currentFilteredPapers.length === 0) return;
  
  currentPaperIndex = currentPaperIndex < currentFilteredPapers.length - 1 ? currentPaperIndex + 1 : 0;
  const paper = currentFilteredPapers[currentPaperIndex];
  showPaperDetails(paper, currentPaperIndex + 1);
}

// Show a random paper
function showRandomPaper() {
  // Check whether there are any papers available
  if (currentFilteredPapers.length === 0) {
    console.log('No papers available to show random paper');
    return;
  }

  // Generate a random index
  const randomIndex = Math.floor(Math.random() * currentFilteredPapers.length);
  const randomPaper = currentFilteredPapers[randomIndex];

  // Update the current paper index
  currentPaperIndex = randomIndex;

  // Show the random paper
  showPaperDetails(randomPaper, currentPaperIndex + 1);

  // Show the random paper indicator
  showRandomPaperIndicator();
  
  console.log(`Showing random paper: ${randomIndex + 1}/${currentFilteredPapers.length}`);
}

// Show the random paper indicator
function showRandomPaperIndicator() {
  // Remove any existing indicator
  const existingIndicator = document.querySelector('.random-paper-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Create a new indicator
  const indicator = document.createElement('div');
  indicator.className = 'random-paper-indicator';
  indicator.textContent = 'Random Paper';

  // Add it to the page
  document.body.appendChild(indicator);

  // Automatically remove it after 3 seconds
  setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.remove();
    }
  }, 3000);
}

function toggleDatePicker() {
  const datePicker = document.getElementById('datePickerModal');
  datePicker.classList.toggle('active');
  
  if (datePicker.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
    
    // Reinitialize the date picker to ensure it reflects the latest available dates
    if (flatpickrInstance) {
      flatpickrInstance.setDate(currentDate, false);
    }
  } else {
    document.body.style.overflow = '';
  }
}

function toggleView() {
  currentView = currentView === 'grid' ? 'list' : 'grid';
  document.getElementById('paperContainer').classList.toggle('list-view', currentView === 'list');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

async function loadPapersByDateRange(startDate, endDate) {
  // Get all valid dates within the date range
  const validDatesInRange = availableDates.filter(date => {
    return date >= startDate && date <= endDate;
  });
  
  if (validDatesInRange.length === 0) {
    alert('No available papers in the selected date range.');
    return;
  }
  
  currentDate = `${startDate} to ${endDate}`;
  document.getElementById('currentDate').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  
  // No longer reset the active keywords and authors
  // Instead, keep the current selection state
  
  const container = document.getElementById('paperContainer');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading papers from ${formatDate(startDate)} to ${formatDate(endDate)}...</p>
    </div>
  `;
  
  try {
    // Load paper data for all dates
    const allPaperData = {};
    
    for (const date of validDatesInRange) {
      const selectedLanguage = selectLanguageForDate(date);
      // Fetch the data file from the data branch
      const dataUrl = DATA_CONFIG.getDataUrl(`data/${date}_AI_enhanced_${selectedLanguage}.jsonl`);
      const response = await fetch(dataUrl);
      const text = await response.text();
      const dataPapers = parseJsonlData(text, date);
      
      // Merge the data
      Object.keys(dataPapers).forEach(category => {
        if (!allPaperData[category]) {
          allPaperData[category] = [];
        }
        allPaperData[category] = allPaperData[category].concat(dataPapers[category]);
      });
    }
    
    paperData = allPaperData;

    const categories = getAllCategories(paperData);

    renderCategoryFilter(categories);

    // If the URL has category, json, author or keywords parameters, return JSON directly
    const hasJsonParams = urlCategoryParam !== null || urlJsonParam !== null || urlAuthorParam !== null || urlKeywordsParam !== null;
    if (hasJsonParams) {
      // Get the base paper list (by category or all)
      const targetCategory = urlCategoryParam || urlJsonParam || 'all';
      let papers = getPapersByCategory(paperData, targetCategory);

      // Apply keyword and author matching ("OR" relationship)
      if (urlKeywordsParam || urlAuthorParam) {
        papers = matchPapersByKeywordsOrAuthor(papers, urlKeywordsParam, urlAuthorParam);
      }

      // JSON mode: only return matched papers
      papers = papers.filter(p => p.isMatched);

      outputJsonData(papers, targetCategory);
      return;
    }

    renderPapers();
  } catch (error) {
    console.error('Failed to load paper data:', error);
    container.innerHTML = `
      <div class="loading-container">
        <p>Loading data fails. Please retry.</p>
        <p>Error messages: ${error.message}</p>
      </div>
    `;
  }
}

// Clear all active keywords
function clearAllKeywords() {
  activeKeywords = [];
  // renderKeywordTags();
  // Re-render the paper list, removing keyword-match highlighting and priority sorting
  renderPapers();
}

// Clear all author filters
function clearAllAuthors() {
  activeAuthors = [];
  renderFilterTags();
  // Re-render the paper list, removing author-match highlighting and priority sorting
  renderPapers();
}

// Toggle PDF previewer size
function togglePdfSize(button) {
  const pdfContainer = button.closest('.pdf-preview-section').querySelector('.pdf-container');
  const iframe = pdfContainer.querySelector('iframe');
  const expandIcon = button.querySelector('.expand-icon');
  const collapseIcon = button.querySelector('.collapse-icon');
  
  if (pdfContainer.classList.contains('expanded')) {
    // Restore normal size
    pdfContainer.classList.remove('expanded');
    iframe.style.height = '800px';
    expandIcon.style.display = 'block';
    collapseIcon.style.display = 'none';
    
    // Remove the overlay
    const overlay = document.querySelector('.pdf-overlay');
    if (overlay) {
      overlay.remove();
    }
  } else {
    // Enlarge view
    pdfContainer.classList.add('expanded');
    iframe.style.height = '90vh';
    expandIcon.style.display = 'none';
    collapseIcon.style.display = 'block';
    
    // Add the overlay
    const overlay = document.createElement('div');
    overlay.className = 'pdf-overlay';
    document.body.appendChild(overlay);
    
    // Collapse the PDF when the overlay is clicked
    overlay.addEventListener('click', () => {
      togglePdfSize(button);
    });
  }
}
