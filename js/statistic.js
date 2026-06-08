let currentDate = '';
let availableDates = [];
let paperData = {};
let flatpickrInstance = null;
let isRangeMode = false;
let allPapersData = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check screen size
  const checkScreenSize = () => {
    if (window.innerWidth < 768) {
      const warningModal = document.createElement('div');
      warningModal.className = 'screen-size-warning';
      warningModal.innerHTML = `
        <div class="warning-content">
          <h3>⚠️ Screen Size Notice</h3>
          <p>We've detected that you're using a device with a small screen. For the best data visualization experience, we recommend viewing this statistics page on a larger screen device (such as a tablet or computer).</p>
          <button onclick="this.parentElement.parentElement.remove()">Got it</button>
        </div>
      `;
      document.body.appendChild(warningModal);
    }
  };

  checkScreenSize();
  // Recheck on window resize
  window.addEventListener('resize', checkScreenSize);

  initEventListeners();
  fetchGitHubStats();
  
  fetchAvailableDates().then(() => {
    if (availableDates.length > 0) {
      loadPapersByDateRange(availableDates[0], availableDates[0]);
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
    console.error('Failed to fetch GitHub statistics:', error);
    document.getElementById('starCount').textContent = '?';
    document.getElementById('forkCount').textContent = '?';
  }
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

function initEventListeners() {
  // Only allow opening the date picker via the calendar button
  const calendarButton = document.getElementById('calendarButton');
  calendarButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDatePicker();
  });

  // Close when clicking the modal background
  const datePickerModal = document.querySelector('.date-picker-modal');
  datePickerModal.addEventListener('click', (event) => {
    if (event.target === datePickerModal) {
      toggleDatePicker();
    }
  });

  // Prevent click events inside the date picker content area from bubbling up
  const datePickerContent = document.querySelector('.date-picker-content');
  datePickerContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('dateRangeMode').addEventListener('change', toggleRangeMode);

  // Add the sidebar close button event
  const closeButton = document.querySelector('.close-sidebar');
  if (closeButton) {
    closeButton.addEventListener('click', closeSidebar);
  }

  // Close the sidebar when clicking outside of it
  document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('paperSidebar');
    const isClickInside = sidebar.contains(event.target);
    const isClickOnKeyword = event.target.closest('.keyword-item') || 
                            event.target.closest('.keyword-cloud text');
    
    if (!isClickInside && !isClickOnKeyword && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });
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
    return 'English'; // fallback
  }
  
  // Use provided preference or detect from browser
  const preferred = preferredLanguage || getPreferredLanguage();
  
  // If preferred language is available, use it
  if (availableLanguages.includes(preferred)) {
    return preferred;
  }
  
  // Fallback: prefer English if available, otherwise use the first available
  return availableLanguages.includes('English') ? 'English' : availableLanguages[0];
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
  
  // Create a map of available dates, used to disable invalid dates
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
        return !!enabledDatesMap[dateStr];
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
        if (availableDates.includes(selectedDate)) {
          loadPapersByDateRange(selectedDate, selectedDate);
          toggleDatePicker();
        }
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

async function loadPapersByDateRange(startDate, endDate) {
  // Get all valid dates within the date range
  const validDatesInRange = availableDates.filter(date => {
    return date >= startDate && date <= endDate;
  });
  
  if (validDatesInRange.length === 0) {
    alert('No available papers in the selected date range.');
    return;
  }
  
  if (startDate === endDate) {  
    currentDate = startDate;
    document.getElementById('currentDate').textContent = formatDate(startDate);
  } else {
    currentDate = `${startDate} - ${endDate}`;
    document.getElementById('currentDate').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  
  const container = document.getElementById('papersList');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading papers from ${formatDate(startDate)} to ${formatDate(endDate)}...</p>
    </div>
  `;
  
  try {
    // Load paper data for all dates
    const allPaperData = {};
    allPapersData = []; // Reset the global paper data

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
        // Add the papers to the global array
        allPapersData = allPapersData.concat(dataPapers[category]);
      });
    }

    paperData = allPaperData;

    // Extract all paper titles
    const allTitle = [];
    Object.keys(paperData).forEach(category => {
      paperData[category].forEach(paper => {
        allTitle.push(paper.title);
      });
    });

    // Extract keywords and summarize them
    const extractKeywords = (text) => {
      // Remove special characters and extra whitespace
      const cleanText = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

      // Use compromise for text processing
      const doc = nlp(cleanText);

      // Extract noun phrases and important terms
      const terms = new Set();

      // Extract noun phrases
      doc.match('#Noun+').forEach(match => {
        const phrase = match.text().toLowerCase();
        if (phrase.split(' ').length <= 3) { // Phrases of at most 3 words
          terms.add(phrase);
        }
      });

      // Extract adjective + noun combinations
      doc.match('(#Adjective+ #Noun+)').forEach(match => {
        const phrase = match.text().toLowerCase();
        if (phrase.split(' ').length <= 3) {
          terms.add(phrase);
        }
      });

      // Define stop words
      const stopWords = new Set([
        'the', 'is', 'at', 'which', 'and', 'or', 'in', 'to', 'for', 'of', 
        'with', 'by', 'on', 'this', 'that', 'our', 'method', 'based', 
        'towards', 'via', 'multi', 'text', 'using', 'aware', 'data', 'from',
        'paper', 'propose', 'proposed', 'approach', 'model', 'system', 
        'framework', 'results', 'show', 'demonstrates', 'experimental', 
        'experiments', 'evaluation', 'performance', 'state', 'art', 'sota',
        'dataset', 'datasets', 'task', 'tasks', 'learning', 'neural', 
        'network', 'networks', 'deep', 'machine', 'artificial', 'intelligence', 
        'ai', 'ml', 'dl'
      ]);
      
      // Filter out stop words and short words
      const filteredTerms = Array.from(terms).filter(term => {
        const words = term.split(' ');
        return words.every(word => word.length > 2) &&
               !words.every(word => stopWords.has(word));
      });

      // Count term frequencies
      const termFreq = {};
      filteredTerms.forEach(term => {
        termFreq[term] = (termFreq[term] || 0) + 1;
        // Give multi-word phrases a higher weight
        if (term.includes(' ')) {
          termFreq[term] *= 1.5;
        }
      });

      // Compute TF (term frequency) values
      const tfScores = {};
      const totalTerms = Object.values(termFreq).reduce((a, b) => a + b, 0);
      Object.entries(termFreq).forEach(([term, freq]) => {
        tfScores[term] = freq / totalTerms;
      });

      // Sort by TF value and return the top 10 keywords/phrases
      return Object.entries(tfScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([term]) => term);
    };

    // Process all summaries
    const allKeywords = new Map();
    const keywordTrends = new Map(); // Add the keyword trend data structure

    // Initialize the per-date data structure
    validDatesInRange.forEach(date => {
      keywordTrends.set(date, new Map());
    });

    // Count keywords by date
    allTitle.forEach((abstract, index) => {
      const date = validDatesInRange[Math.floor(index / (allTitle.length / validDatesInRange.length))];
      const keywords = extractKeywords(abstract);

      keywords.forEach(keyword => {
        // Update the overall statistics
        allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + 1);

        // Update the per-date statistics
        const dateStats = keywordTrends.get(date);
        dateStats.set(keyword, (dateStats.get(keyword) || 0) + 1);
      });
    });

    // Generate the keyword cloud data
    const keywordCloudData = Array.from(allKeywords.entries())
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 30)
      .map(([keyword, count]) => ({
        text: keyword,
        size: Math.max(12, Math.min(50, count * 3))
      }));

    // Prepare the line chart data
    const top10Keywords = keywordCloudData.slice(0, 10).map(d => d.text);
    const trendData = top10Keywords.map(keyword => {
      return {
        keyword: keyword,
        values: Array.from(keywordTrends.entries()).map(([date, stats]) => ({
          date: new Date(date + 'T00:00:00Z'),  // Ensure the date is parsed correctly by adding a time part
          count: stats.get(keyword) || 0
        })).sort((a, b) => a.date - b.date)  // Ensure the data is sorted by date
      };
    });

    // Create the visualization
    container.innerHTML = `
      <div class="statistics-section">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.41 11.58L12.41 2.58C12.05 2.22 11.55 2 11 2H4C2.9 2 2 2.9 2 4V11C2 11.55 2.22 12.05 2.59 12.42L11.59 21.42C11.95 21.78 12.45 22 13 22C13.55 22 14.05 21.78 14.41 21.41L21.41 14.41C21.78 14.05 22 13.55 22 13C22 12.45 21.77 11.94 21.41 11.58ZM5.5 7C4.67 7 4 6.33 4 5.5C4 4.67 4.67 4 5.5 4C6.33 4 7 4.67 7 5.5C7 6.33 6.33 7 5.5 7Z" fill="currentColor"/>
          </svg>
          Popular Keywords
        </h2>
        <div class="statistics-card">
          <div class="keyword-list">
            ${keywordCloudData.map((item, index) => `
              <div class="keyword-item" onclick="showRelatedPapers('${item.text}')">
                <span class="keyword-rank">${index + 1}</span>
                <span class="keyword-text">${item.text}</span>
                <span class="keyword-count">${allKeywords.get(item.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${startDate !== endDate ? `
        <h2 class="trend-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 18.5L9.5 12.5L13.5 16.5L22 6.92L20.59 5.5L13.5 13.5L9.5 9.5L2 17L3.5 18.5Z" fill="currentColor"/>
          </svg>
          Keywords Trend
        </h2>
        <div class="statistics-card">
          <div id="trendChart" style="width: 100%; height: 400px;"></div>
        </div>
        ` : ''}
      </div>
    `;

    // Only create the trend chart in date range mode
    if (startDate !== endDate) {
      // Create the line chart
      const margin = {top: 20, right: 180, bottom: 80, left: 60}; // Increase the bottom margin to fit longer date labels
      const width = document.getElementById('trendChart').offsetWidth - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const svg = d3.select('#trendChart')
        .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

      // Set up the scales
      const x = d3.scaleTime()
        .domain(d3.extent(validDatesInRange, d => new Date(d)))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(trendData, d => d3.max(d.values, v => v.count))])
        .range([height, 0]);

      // Create the color scale using softer colors
      const color = d3.scaleOrdinal()
        .range(['#4e79a7', '#f28e2c', '#59a14f', '#e15759', '#76b7b2',
                '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab']);

      // Add the X-axis gridlines
      svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.1)
        .call(d3.axisBottom(x)
          .ticks(8)
          .tickSize(-height)
          .tickFormat(''));

      // Add the Y-axis gridlines
      svg.append('g')
        .attr('class', 'grid')
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.1)
        .call(d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(''));

      // Add a function to determine an appropriate date format
      function determineDateFormat(dates) {
        const startDate = new Date(dates[0]);
        const endDate = new Date(dates[dates.length - 1]);

        // Check whether it spans multiple years
        const sameYear = startDate.getFullYear() === endDate.getFullYear();
        // Check whether it is within the same month
        const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

        if (sameMonth) {
          return d3.timeFormat("%d"); // Show the day only
        } else if (sameYear) {
          return d3.timeFormat("%m-%d"); // Show month-day
        } else {
          return d3.timeFormat("%Y-%m-%d"); // Show the full date
        }
      }

      // Get the date formatting function
      const dateFormat = determineDateFormat(validDatesInRange);

      // Add the X-axis
      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .ticks(Math.min(validDatesInRange.length, 8))
          .tickFormat(dateFormat))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "#666")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

      // Add the Y-axis
      svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y)
          .ticks(5))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#666");

      // Add the Y-axis title
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "#666")
        .style("font-size", "12px")
        .text("Frequency");

      // Add the X-axis title, showing the year and month (when omitted from the labels)
      const startDate = new Date(validDatesInRange[0]);
      const endDate = new Date(validDatesInRange[validDatesInRange.length - 1]);
      let xAxisTitle = "";
      
      if (startDate.getFullYear() === endDate.getFullYear()) {
        if (startDate.getMonth() === endDate.getMonth()) {
          xAxisTitle = `${startDate.getFullYear()}/${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        } else {
          xAxisTitle = `${startDate.getFullYear()}`;
        }
      }
      
      if (xAxisTitle) {
        svg.append("text")
          .attr("transform", `translate(${width/2}, ${height + margin.bottom - 5})`)
          .style("text-anchor", "middle")
          .style("fill", "#666")
          .style("font-size", "12px")
          .text(xAxisTitle);
      }

      // Thicken the axis lines
      svg.selectAll('.x-axis path, .y-axis path, .x-axis line, .y-axis line')
        .style('stroke', '#666')
        .style('stroke-width', '1.5px');

      // Define the area generator
      const area = d3.area()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(d.count))
        .curve(d3.curveBasis); // Use a smoother curve

      // Define the line generator
      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count))
        .curve(d3.curveBasis); // Use the same smooth curve

      // Add the gradient definitions
      const gradient = svg.append("defs")
        .selectAll("linearGradient")
        .data(trendData)
        .enter()
        .append("linearGradient")
        .attr("id", (d, i) => `gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d => color(d.keyword))
        .attr("stop-opacity", 0.3);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d => color(d.keyword))
        .attr("stop-opacity", 0.05);

      // Draw the areas
      const areas = svg.selectAll('.area')
        .data(trendData)
        .enter()
        .append('path')
          .attr('class', 'area')
          .attr('d', d => area(d.values))
          .style('fill', (d, i) => `url(#gradient-${i})`)
          .style('opacity', 0.7);

      // Draw the lines
      const paths = svg.selectAll('.line')
        .data(trendData)
        .enter()
        .append('path')
          .attr('class', 'line')
          .attr('d', d => line(d.values))
          .style('stroke', d => color(d.keyword))
          .style('fill', 'none')
          .style('stroke-width', 2)
          .style('opacity', 0.8);

      // Add the legend
      const legend = svg.selectAll('.legend')
        .data(trendData)
        .enter()
        .append('g')
          .attr('class', 'legend')
          .attr('transform', (d, i) => `translate(${width + 20},${i * 25})`);

      legend.append('rect')
        .attr('x', 0)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => color(d.keyword))
        .style('opacity', 0.7);

      legend.append('text')
        .attr('x', 28)
        .attr('y', 13)
        .text(d => d.keyword)
        .style('font-size', '12px')
        .style('alignment-baseline', 'middle');

      // Add interactive effects
      legend.style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          const keyword = d.keyword;

          // Lower the opacity of the other lines and areas
          areas.style('opacity', 0.1);
          paths.style('opacity', 0.1);

          // Highlight the currently selected line and area
          svg.selectAll('.area')
            .filter(p => p.keyword === keyword)
            .style('opacity', 0.9);

          svg.selectAll('.line')
            .filter(p => p.keyword === keyword)
            .style('opacity', 1)
            .style('stroke-width', 3);
        })
        .on('mouseout', function() {
          // Restore the original state
          areas.style('opacity', 0.7);
          paths.style('opacity', 0.8)
            .style('stroke-width', 2);
        });
    }

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
        conclusion: paper.AI && paper.AI.conclusion ? paper.AI.conclusion : ''
      });
    } catch (error) {
      console.error('Failed to parse JSON line:', error, line);
    }
  });

  return result;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

// The part of the showRelatedPapers function that generates the paper cards
function showRelatedPapers(keyword) {
    const sidebar = document.getElementById('paperSidebar');
    const selectedKeywordElement = document.getElementById('selectedKeyword');
    const relatedPapersContainer = document.getElementById('relatedPapers');

    // Update the keyword display
    selectedKeywordElement.textContent = 'Keyword: ' + keyword;

    // Find papers that contain the keyword
    const relatedPapers = allPapersData.filter(paper => {
        const searchText = (paper.title + ' ' + paper.summary).toLowerCase();
        return searchText.includes(keyword.toLowerCase());
    });

    // Generate the HTML for the related papers
    const papersHTML = relatedPapers.map((paper, index) => `
        <div class="paper-card">
            <div class="paper-number">${index + 1}</div>
            <a href="${paper.url}" target="_blank" class="paper-title">${paper.title}</a>
            <div class="paper-authors">${paper.authors}</div>
            <div class="paper-categories">
                ${paper.category.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
            </div>
            <div class="paper-summary">${paper.summary}</div>
        </div>
    `).join('');
    
    // Update the sidebar content
    relatedPapersContainer.innerHTML = relatedPapers.length > 0
        ? papersHTML
        : '<p>No related papers found.</p>';

    // Show the sidebar
    sidebar.classList.add('active');
}

// New function: close the sidebar
function closeSidebar() {
  const sidebar = document.getElementById('paperSidebar');
  sidebar.classList.remove('active');
}