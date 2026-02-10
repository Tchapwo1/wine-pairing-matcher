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

// ... previous imports and setup ...

const app = document.getElementById('app');
// Main content container
const mainContent = document.getElementById('mainContent');

// ... (keep settings/AI logic as is) ...

const renderDishSelection = (title, dishes) => {
  // Generate HTML for the dishes list
  const dishCards = dishes.map(dish => {
    // Mock image based on cuisine/type if possible, else generic
    let imgSrc = "https://source.unsplash.com/400x300/?food,dinner";
    if (title.includes('Italian')) imgSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuDsqFCvnOcKD9XRXc3DWIxT8B0jBYRImjtkJ_bGKJcLKwRsaRS5-LKM2LObJK1kLkakXEX4Biknv4bntF4riYvuqaaA-CLD_rtnFIUh_OlS-dIbFmJV0IHcYAmXYHN7KOLrR2haLnvuHijBgvxu9IHJvx-wUx63ImOS-V_lDDu_kJe-RCXPHSPfWbd6mn2_JCqsX8OROPCEkdKEcvNpA6H-MmMP8H44Hg5SNqgQVluIj5RgtAlFF36OfjI74JM8Qt9JMFt_MsqSMW8";
    if (title.includes('French')) imgSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuCDal-bNFqfqH7H5R6cVtcpwRAyj4evZS2LqVojQEshQeaFqz19013w8jdahfxi-xfmCwhIaceidPD2QQKIzExdbTq0wJMkxdCAZK81G6I9s-3DWYthb-HEmzxA6q17HTE7SX48mbInZA8sDhjp3xgc-T9li11NDg6aiJmWFLIluvDSK6SIljS5hd9xxfOrnAsOMRtXqa2x0dqlDWLOZTcrxbXW33jQuPMxFGdo1pPJlpw1ZHimiiJfALYlmxzaO28o4SBSwywuHpk"; // Osso buco image as placeholder

    // Tags generation
    const tags = [];
    if (dish.type === 'wine') tags.push({ text: 'Wine', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' });
    if (dish.course) tags.push({ text: dish.course, class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 capitalize' });

    return `
        <!-- Card -->
        <div class="group relative bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-primary/30 transition-all">
            <div class="flex h-32">
                <div class="w-32 h-full flex-shrink-0 relative overflow-hidden">
                    <img alt="${dish.name}" class="absolute w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${imgSrc}" onError="this.src='https://source.unsplash.com/400x300/?food'"/>
                </div>
                <div class="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white leading-tight mb-1">${dish.name}</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">${dish.description}</p>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex gap-2">
                            ${tags.map(t => `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${t.class}">${t.text}</span>`).join('')}
                        </div>
                        <button class="w-8 h-8 rounded-full bg-background-light dark:bg-background-dark flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <span class="material-icons-round text-lg">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
  }).join('');

  return `
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 pt-12 pb-4">
        <div class="flex items-center justify-between mb-4">
            <button id="backBtn" class="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-gray-600 dark:text-gray-300">
                <span class="material-icons-round">chevron_left</span>
            </button>
            <div class="flex gap-4">
                <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-gray-600 dark:text-gray-300">
                    <span class="material-icons-round">search</span>
                </button>
                <button class="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-gray-600 dark:text-gray-300">
                    <span class="material-icons-round">tune</span>
                </button>
            </div>
        </div>
        <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">${title}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Select a dish to pair with the perfect wine.</p>
        </div>
    </header>
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto pb-24 h-full">
        <!-- Filters / Preferences -->
        <div class="px-6 py-6">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Preferences</h3>
            <div class="flex flex-wrap gap-2">
                <button class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-md shadow-primary/20 transition-transform active:scale-95">
                    <span class="material-icons-round text-base">check</span>
                    Prefer Red
                </button>
                <button class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-surface-dark border border-transparent dark:border-gray-800 hover:border-primary/50 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors active:scale-95">
                    Prefer White
                </button>
                <button class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-surface-dark border border-transparent dark:border-gray-800 hover:border-primary/50 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors active:scale-95">
                    Budget-friendly
                </button>
            </div>
        </div>
        <!-- Dish List -->
        <div class="px-6 space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Suggested Dishes</h2>
                <span class="text-xs text-primary font-medium">View all</span>
            </div>
            ${dishCards}
        </div>
        <!-- Bottom Spacer -->
        <div class="h-10"></div>
    </main>
    <!-- Fixed Bottom Nav (Context) -->
    <div class="absolute bottom-0 w-full bg-white dark:bg-surface-darker/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-4 pb-8 z-40">
        <div class="flex justify-between items-center max-w-sm mx-auto">
            <div class="flex flex-col">
                <span class="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Step 2 of 3</span>
                <span class="text-sm text-gray-900 dark:text-white font-medium">Selecting Dish</span>
            </div>
            <div class="flex gap-1 h-1 w-24">
                <div class="h-full w-1/3 bg-primary rounded-full"></div>
                <div class="h-full w-1/3 bg-primary rounded-full"></div>
                <div class="h-full w-1/3 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
        </div>
    </div>
    `;
};

// ... inside init ...
const updateResults = (data, isAI = false, query = '') => {
  // If we have a query or filter active, switch to "Results View" (Step 2)
  if (query || currentFilter !== 'all' || isAI) {
    // Save current Home state if needed (or just overwrite)
    // Render Step 2 View
    const title = isAI ? "AI Suggestions" : (query ? `Results for "${query}"` : "Filtered Selection");

    // Replace EVERYTHING in the mobile container with the new view
    // We target the parent of <header> and <main> which is the .w-full.max-w-md container
    // Actually, let's target document.body for simplicity or the specific container ID if we added one
    // In index.html, the container has classes but no ID. Let's assume we replace the innerHTML of the container.
    // BUT wait, we need to be able to go BACK.

    // Better approach: Hide Home content, Show Results content.
    // Since we didn't setup a router, let's just swap HTML for now.
    const container = document.querySelector('.w-full.max-w-md'); // The main app container

    // Check if we are already in results view to avoid full re-render flickering?
    // For now, simpler is better.

    // Store Original Home HTML to restore on Back?
    if (!window.homeHTML) window.homeHTML = container.innerHTML;

    container.innerHTML = renderDishSelection(title, data);

    // Re-attach Back Button Listener
    document.getElementById('backBtn').addEventListener('click', () => {
      container.innerHTML = window.homeHTML;
      // Re-init Home Logic (listeners need to be re-attached!)
      init();
    });

  } else {
    // ... (Default Home View logic) ... 
    // We shouldn't reach here if we replaced the HTML.
    // If we are in Home View, this function behaves as before (rendering cards into resultsContainer).
    // BUT if we want the "Step 2" design for ALL results...

    // Let's keep the Home View for "Browsing" and switch to Step 2 for "Searching/Selecting".
    if (initialContent) initialContent.classList.remove('hidden');
    if (resultsTitle) resultsTitle.innerHTML = `Explore by <span class="font-medium text-primary">Region</span>`;
    resultsContainer.innerHTML = '';
    if (initialContent && !resultsContainer.contains(initialContent)) {
      resultsContainer.appendChild(initialContent);
      initialContent.classList.remove('hidden');
    }
  }
};

// Update: Initial Search Listener needs to trigger the View Switch
// ...


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

  // State for View Management
  let originalInnerHtml = null;
  const mainContainer = document.querySelector('.w-full.max-w-md'); // The main mobile container

  const renderHome = () => {
    if (!originalInnerHtml) return; // Should not happen if set correctly
    mainContainer.innerHTML = originalInnerHtml;
    // Re-initialize logic for Home View
    init();
  };

  const updateResults = (data, isAI = false, query = '') => {
    // Determine target view
    const isHomeView = !query && currentFilter === 'all' && !isAI;

    if (isHomeView) {
      // We are in Home State.
      // If we are currently in "Results View" (inner HTML replaced), restore Home.
      // BUT `updateResults` is called by listeners.

      // Scenario A: User clears search input -> Go back to Home?
      // Yes.

      // Ensure we are rendering into the correct container.
      // If `resultsContainer` (from closure) doesn't exist in DOM, we must have swapped views.
      if (!document.getElementById('resultsContainer')) {
        renderHome();
        return;
      }

      // Normal Home Behavior: Show Region Cards
      const homeResultsContainer = document.getElementById('resultsContainer');
      const homeInitialContent = document.getElementById('initialContent');
      const homeResultsTitle = document.getElementById('resultsTitle');

      if (homeInitialContent) homeInitialContent.classList.remove('hidden');
      if (homeResultsTitle) homeResultsTitle.innerHTML = `Explore by <span class="font-medium text-primary">Region</span>`;
      if (homeResultsContainer) {
        homeResultsContainer.innerHTML = '';
        if (homeInitialContent && !homeResultsContainer.contains(homeInitialContent)) {
          homeResultsContainer.appendChild(homeInitialContent);
        }
      }
    } else {
      // Switch to "Step 2: Dish Selection" View
      if (!originalInnerHtml) originalInnerHtml = mainContainer.innerHTML;

      const title = isAI ? "AI Suggestions" : (query ? `Results for "${query}"` : "Filtered Selection");

      mainContainer.innerHTML = renderDishSelection(title, data);

      // Attach Logic for New View
      // 1. Back Button
      document.getElementById('backBtn').addEventListener('click', () => {
        renderHome();
      });

      // 2. Search/Filter Buttons in New Header (Placeholder for now, or re-wire)
      // ideally these would allow searching *within* the results, but for now they can just be static or reset.

    }
  };

  // Search Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = filterData(query);
      updateResults(filtered, false, query);
    });
  }

  // Filter Chip Listeners
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();

      const filterValue = chip.getAttribute('data-filter');

      // Handle Region Cards (French/Italian etc) acting as filters/search triggers
      if (['french', 'italian', 'spanish'].includes(filterValue)) {
        // Trigger Search which triggers View Switch
        if (searchInput) {
          searchInput.value = filterValue;
          searchInput.dispatchEvent(new Event('input'));
        }
        return;
      }

      // Standard Filter Chips Logic
      // Update UI (Chips)
      chips.forEach(c => {
        c.classList.remove('bg-primary', 'text-white', 'active', 'shadow-lg', 'shadow-primary/20');
        c.classList.add('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
        if (c.querySelector('.material-icons-round') && c.textContent.trim() === 'All') {
          // Reset 'All' specific icon/style logic if needed
        }
      });

      // Apply Active Style
      if (chip.tagName === 'BUTTON') {
        chip.classList.remove('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
        chip.classList.add('bg-primary', 'text-white', 'active', 'shadow-lg', 'shadow-primary/20');
      }

      currentFilter = filterValue;

      const query = searchInput ? searchInput.value.toLowerCase() : '';
      const filtered = filterData(query);
      updateResults(filtered, false, query);
    });
  });
};

init();
