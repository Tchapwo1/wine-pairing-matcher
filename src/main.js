import './style.css';
import basicPairings from './data/pairings.json';
import restaurantPairings from './data/restaurant_pairings.json';

const pairingsData = [...basicPairings, ...restaurantPairings];

const app = document.getElementById('app');

const renderHeader = () => {
  return `
    <header>
      <h1>Sommelier</h1>
      <p class="subtitle">Discover the perfect pairing for your palate.</p>
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

const renderResults = (results) => {
  if (results.length === 0) {
    return `<p style="color: #666; font-style: italic;">No pairings found. Try exploring different flavors.</p>`;
  }

  return `
    <div class="results-container">
      ${results.map(item => `
        <div class="card">
          <div class="card-header">
            <span class="tag ${item.type}">${item.type === 'wine' ? 'Wine' : (item.restaurant || 'Food')}</span>
            ${item.restaurant ? `<span class="course-tag">${item.course}</span>` : ''}
          </div>
          <h3>${item.name}</h3>
          <p class="matches"><strong>Pair with:</strong> ${item.matches.join(', ')}</p>
          <p>${item.description}</p>
        </div>
      `).join('')}
    </div>
  `;
};

const init = () => {
  app.innerHTML = `
    ${renderHeader()}
    ${renderSearch()}
    <div id="results"></div>
  `;

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('results');

  // Initial render (show all or recommended)
  resultsContainer.innerHTML = renderResults(pairingsData);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtereddata = pairingsData.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.matches.some(match => match.toLowerCase().includes(query))
    );
    resultsContainer.innerHTML = renderResults(filtereddata);
  });
};

init();
