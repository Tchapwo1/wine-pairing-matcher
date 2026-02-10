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

const app = document.getElementById('app');
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');

// Settings Modal Logic
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
    settingsModal.style.display = 'flex';
  });

  document.getElementById('closeSettings').addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  document.getElementById('saveApiKey').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      initAI();
      settingsModal.style.display = 'none';
      alert('API Key saved! Sommelier Mode active.');
    } else {
      alert('Please enter a valid API Key.');
    }
  });
});


const renderHeader = () => {
  return `
    <header>
      <h1>Sommelier</h1>
      <p class="subtitle">Discover the perfect pairing for your palate.</p>
      <button id="settingsBtn" class="settings-button" title="Settings">⚙️</button>
    </header>
  `;
};

const renderSearch = () => {
  return `
    <div class="search-container">
      <input type="text" id="searchInput" placeholder="Search for food (e.g., Steak) or wine (e.g., Merlot)..." />
    </div>
  `;
};

const renderResults = (results, isAI = false) => {
  if (results.length === 0) {
    return `
      <div style="text-align: center; margin-top: 2rem;">
        <p style="color: #666; font-style: italic; margin-bottom: 2rem;">No local pairings found for this specific item.</p>
        <button id="askAI" style="padding: 1rem 2rem; background: linear-gradient(45deg, #e74c3c, #8e44ad); color: white; border: none; border-radius: 50px; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4); transition: transform 0.2s;">
          ✨ Ask AI Sommelier
        </button>
        <p id="aiStatus" style="color: #bdc3c7; margin-top: 1rem; min-height: 1.5rem;"></p>
      </div>
    `;
  }

  return `
    <div class="results-container">
      ${results.map(item => `
        <div class="card" ${isAI ? 'style="border: 1px solid #8e44ad;"' : ''}>
          <div class="card-header">
            <span class="tag ${item.type}" ${isAI ? 'style="background-color: rgba(142, 68, 173, 0.2); color: #9b59b6;"' : ''}>
              ${isAI ? 'AI Selection' : (item.type === 'wine' ? 'Wine' : (item.restaurant || 'Food'))}
            </span>
            ${item.restaurant ? `<span class="course-tag">${item.course}</span>` : ''}
          </div>
          <h3>${item.name}</h3>
          <p class="matches"><strong>Pair with:</strong> ${item.matches ? item.matches.join(', ') : ''}</p>
          <p>${item.description}</p>
        </div>
      `).join('')}
    </div>
  `;
};

const init = () => {
  initAI();
  app.innerHTML = `
    ${renderHeader()}
    ${renderSearch()}
    <div id="results"></div>
  `;

  // Re-attach settings listeners after innerHTML wipe
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
      settingsModal.style.display = 'flex';
    });
  }

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('results');

  const updateResults = (data, isAI = false) => {
    resultsContainer.innerHTML = renderResults(data, isAI);

    // Attach listener for AI button if it exists
    const askAIButton = document.getElementById('askAI');
    if (askAIButton) {
      askAIButton.addEventListener('click', async () => {
        if (!model) {
          alert('Please set your Gemini API Key in Settings (⚙️) first!');
          return;
        }

        const aiStatus = document.getElementById('aiStatus');
        const query = searchInput.value;

        aiStatus.textContent = `Consulting the virtual cellar for "${query}"...`;
        askAIButton.disabled = true;
        askAIButton.style.opacity = '0.7';

        const aiResults = await getAIPairings(query);

        if (aiResults && aiResults.length > 0) {
          updateResults(aiResults, true);
        } else {
          aiStatus.textContent = "The sommelier is stumped. Please check your API key or try again.";
          askAIButton.disabled = false;
          askAIButton.style.opacity = '1';
        }
      });
    }
  };

  // Initial render
  updateResults(pairingsData);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      updateResults(pairingsData);
      return;
    }

    const filtereddata = pairingsData.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.matches && item.matches.some(match => match.toLowerCase().includes(query))) ||
      (item.restaurant && item.restaurant.toLowerCase().includes(query))
    );
    updateResults(filtereddata);
  });
};

init();
