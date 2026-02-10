import './style.css';
import basicPairings from './data/pairings.json';
import restaurantPairings from './data/restaurant_pairings.json';

const pairingsData = [...basicPairings, ...restaurantPairings];

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;

const initAI = () => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
};

const getAIPairings = async (query) => {
  if (!model) return null;

  try {
    const prompt = `Suggest 3 wine pairings for "${query}". Return ONLY a JSON array with objects containing: name (wine name), type ("wine"), matches (array with "${query}"), and description (why it works). Do not use markdown code blocks.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};

const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');

// Settings Modal Logic & Event Listeners
const attachEventListeners = () => {
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
      settingsModal.classList.remove('hidden');
      settingsModal.classList.add('flex');
    });
  }

  const closeSettingsBtn = document.getElementById('closeSettings');
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
      settingsModal.classList.remove('flex');
    });
  }

  const saveApiKeyBtn = document.getElementById('saveApiKey');
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        localStorage.setItem('gemini_api_key', key);
        initAI();
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('flex');
        alert('API Key saved! Sommelier Mode active.');
      } else {
        alert('Please enter a valid API Key.');
      }
    });
  }
};

const renderResults = (results, isAI = false) => {
  if (results.length === 0) {
    return `
      <div class="flex flex-col items-center justify-center py-10 text-center animate-fade-in-up">
        <span class="text-4xl mb-4">🥂</span>
        <p class="text-gray-400 font-light mb-6">No direct matches found in our cellar.</p>
        <button id="askAI" class="flex items-center space-x-2 bg-gradient-to-r from-primary to-rose-600 text-white px-6 py-3 rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
          <span class="material-icons-round text-sm">auto_awesome</span>
          <span>Ask AI Sommelier</span>
        </button>
        <p id="aiStatus" class="text-gray-500 text-sm mt-4 min-h-[1.5rem]"></p>
      </div>
    `;
  }

  return results.map((item, index) => `
    <div class="relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all duration-300 animate-fade-in-up" style="animation-delay: ${index * 50}ms" ${isAI ? 'style="border-color: #8e44ad;"' : ''}>
      <div class="flex justify-between items-start mb-2">
        <div class="flex space-x-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'wine' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}">
                ${isAI ? 'AI Selection' : (item.type === 'wine' ? 'Wine' : 'Food')}
            </span>
            ${item.course ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize">${item.course}</span>` : ''}
        </div>
        ${item.restaurant ? `<span class="text-xs text-gray-400 font-mono">${item.restaurant}</span>` : ''}
      </div>
      
      <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2 tracking-wide">${item.name}</h3>
      
      <div class="mb-3">
        <p class="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-[10px] mb-1">Best Pairing</p>
        <p class="text-primary font-medium">${item.matches ? item.matches.join(', ') : 'Various options'}</p>
      </div>
      
      <p class="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed">${item.description}</p>
    </div>
  `).join('');
};

const init = () => {
  initAI();
  attachEventListeners(); // Initial settings listeners

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('resultsContainer');
  const initialContent = document.getElementById('initialContent');
  const resultsTitle = document.getElementById('resultsTitle');
  const mainContent = document.getElementById('mainContent');

  // Filter Logic
  let currentFilter = 'all';

  const filterData = (query) => {
    let filtered = pairingsData;

    // Apply category filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (currentFilter === 'wine') return item.type === 'wine';
        if (currentFilter === 'food') return item.type === 'food';
        if (['starter', 'main', 'dessert'].includes(currentFilter)) {
          return item.course === currentFilter;
        }
        return true;
      });
    }

    // Apply search query
    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.matches && item.matches.some(match => match.toLowerCase().includes(query))) ||
        (item.restaurant && item.restaurant.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const updateResults = (data, isAI = false, query = '') => {
    // Determine visibility of initial content
    if (query || currentFilter !== 'all' || isAI) {
      if (initialContent) initialContent.classList.add('hidden');
      if (resultsTitle) resultsTitle.innerHTML = isAI ? `AI <span class="font-medium text-primary">Suggestions</span>` : `Found <span class="font-medium text-primary">${data.length} Results</span>`;
      resultsContainer.innerHTML = renderResults(data, isAI);
    } else {
      if (initialContent) initialContent.classList.remove('hidden');
      if (resultsTitle) resultsTitle.innerHTML = `Explore by <span class="font-medium text-primary">Region</span>`;
      resultsContainer.innerHTML = '';
      if (initialContent && !resultsContainer.contains(initialContent)) {
        // If initialContent was removed from resultsContainer logic (it's separate in HTML), this is fine.
        // In the HTML structure provided, initialContent is INSIDE resultsContainer.
        // But my logic clears resultsContainer.innerHTML. 
        // Correction: The provided HTML has initialContent INSIDE resultsContainer.
        // So clearing innerHTML removes it. We need to re-append it or toggle visibility properly.
        // Actually, looking at the HTML, initialContent is a child of resultsContainer.
        // If I clear resultsContainer, I lose initialContent reference if I didn't save it?
        // No, `const initialContent = ...` saves the reference.
        resultsContainer.appendChild(initialContent);
        initialContent.classList.remove('hidden');
      }
    }

    // Attach listener for AI button if it exists
    const askAIButton = document.getElementById('askAI');
    if (askAIButton) {
      askAIButton.addEventListener('click', async () => {
        if (!model) {
          settingsModal.classList.remove('hidden');
          settingsModal.classList.add('flex');
          alert('Please set your Gemini API Key in Settings first!');
          return;
        }

        const aiStatus = document.getElementById('aiStatus');

        aiStatus.textContent = `Consulting the virtual cellar for "${query}"...`;
        askAIButton.disabled = true;
        askAIButton.classList.add('opacity-70', 'cursor-not-allowed');

        const aiResults = await getAIPairings(query);

        if (aiResults && aiResults.length > 0) {
          updateResults(aiResults, true, query);
        } else {
          aiStatus.textContent = "The sommelier is stumped. Please check your API key or try again.";
          askAIButton.disabled = false;
          askAIButton.classList.remove('opacity-70', 'cursor-not-allowed');
        }
      });
    }
  };

  // Search Listener
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = filterData(query);
    updateResults(filtered, false, query);
  });

  // Filter Chip Listeners (Update Logic for Tailwind classes)
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default

      const filterValue = chip.getAttribute('data-filter');

      // Handle Region Cards (French/Italian etc) acting as filters/search triggers
      if (['french', 'italian', 'spanish'].includes(filterValue)) {
        // These acts as search shortcuts
        searchInput.value = filterValue;
        searchInput.dispatchEvent(new Event('input'));
        return;
      }

      // Standard Filter Chips Logic
      // UI Updates: Remove active styles from all buttons
      document.querySelectorAll('.filter-container .filter-chip').forEach(c => {
        c.classList.remove('bg-primary', 'text-white', 'active', 'shadow-lg', 'shadow-primary/20');
        c.classList.add('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
      });

      // Apply Active Style to clicked button
      if (chip.classList.contains('filter-chip') && chip.parentElement.classList.contains('filter-container')) {
        chip.classList.remove('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
        chip.classList.add('bg-primary', 'text-white', 'active', 'shadow-lg', 'shadow-primary/20');
      }

      // Update State
      currentFilter = filterValue;

      // Re-render
      const query = searchInput.value.toLowerCase();
      const filtered = filterData(query);
      updateResults(filtered, false, query);
    });
  });
};

init();
