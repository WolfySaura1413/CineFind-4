import * as authService from "./services/auth.js";
import * as dbService from "./services/db.js";
import * as watchmodeService from "./services/watchmode.js";
import { getLogoForSource } from "./utils/constants.js";

// Global App State
let currentTab = "home";
let searchTimeout = null;
let currentSearchType = "";
let selectedTitle = null; // Currently opened in details modal
let selectedReviewRating = 0;
let intendedScreenAfterAuth = null; // Redirect target if auth modal was prompted

// UI Elements Cache
const DOM = {
  // Navigation Tabs
  tabs: document.querySelectorAll(".nav-tab"),
  screens: document.querySelectorAll(".screen-section"),
  
  // Header
  userStatus: document.getElementById("header-user-status"),

  // Home Screen
  homeSearchTrigger: document.getElementById("home-search-trigger"),
  trendingGrid: document.getElementById("trending-grid"),

  // Search Screen
  searchInput: document.getElementById("search-input"),
  searchClearBtn: document.getElementById("search-clear-btn"),
  filterTabs: document.querySelectorAll(".filter-tab"),
  searchResultsGrid: document.getElementById("search-results-grid"),

  // My Lists Screen
  toggleWatchlistBtn: document.getElementById("toggle-watchlist-btn"),
  toggleWatchedBtn: document.getElementById("toggle-watched-btn"),
  listsGrid: document.getElementById("lists-grid"),
  currentListTab: "watchlist", // watchlist or watched

  // Profile Screen
  profileEmail: document.getElementById("profile-email"),
  profileJoined: document.getElementById("profile-joined"),
  logoutBtn: document.getElementById("logout-btn"),
  profileReviewsList: document.getElementById("profile-reviews-list"),

  // Auth Modal
  authModal: document.getElementById("auth-modal"),
  authCloseBtn: document.getElementById("auth-close-btn"),
  authForm: document.getElementById("auth-form"),
  authEmailInput: document.getElementById("auth-email"),
  authPasswordInput: document.getElementById("auth-password"),
  authSubmitBtn: document.getElementById("auth-submit-btn"),
  authModalTitle: document.getElementById("auth-modal-title"),
  authModalSubtitle: document.getElementById("auth-modal-subtitle"),
  authErrorBanner: document.getElementById("auth-error"),
  authToggleBtn: document.getElementById("auth-toggle-btn"),
  authToggleText: document.getElementById("auth-toggle-text"),
  isRegisterMode: false,

  // Detail Modal
  detailModal: document.getElementById("detail-modal"),
  detailCloseBtn: document.getElementById("detail-close-btn"),
  detailPoster: document.getElementById("detail-poster"),
  detailTitle: document.getElementById("detail-title"),
  detailYear: document.getElementById("detail-year"),
  detailType: document.getElementById("detail-type"),
  detailGenres: document.getElementById("detail-genres"),
  detailStarsAvg: document.getElementById("detail-stars-avg"),
  detailRatingAvgText: document.getElementById("detail-rating-avg-text"),
  detailBtnWatchlist: document.getElementById("detail-btn-watchlist"),
  detailBtnWatched: document.getElementById("detail-btn-watched"),
  detailPlot: document.getElementById("detail-plot"),
  detailSourcesList: document.getElementById("detail-sources-list"),
  detailReviewsContainer: document.getElementById("detail-reviews-container"),
  starsSelector: document.getElementById("stars-selector"),
  reviewForm: document.getElementById("review-form"),
  reviewBody: document.getElementById("review-body"),
  reviewPublic: document.getElementById("review-public"),
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateUserHeader();
  loadTrending();
});

// Event Listeners Routing
function setupEventListeners() {
  // Navigation Tabs
  DOM.tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const screenId = tab.getAttribute("data-screen");
      switchScreen(screenId);
    });
  });

  // Home Screen Search Trigger
  DOM.homeSearchTrigger.addEventListener("click", () => {
    switchScreen("search");
    DOM.searchInput.focus();
  });

  // Search Inputs and Filters
  DOM.searchInput.addEventListener("input", handleSearchInput);
  DOM.searchClearBtn.addEventListener("click", () => {
    DOM.searchInput.value = "";
    DOM.searchClearBtn.style.display = "none";
    DOM.searchResultsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍿</span>
        <p>Type a movie or TV show name to start searching.</p>
      </div>
    `;
    DOM.searchInput.focus();
  });

  DOM.filterTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      DOM.filterTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSearchType = btn.getAttribute("data-type");
      triggerSearch();
    });
  });

  // My Lists Toggles
  DOM.toggleWatchlistBtn.addEventListener("click", () => {
    DOM.currentListTab = "watchlist";
    DOM.toggleWatchlistBtn.classList.add("active");
    DOM.toggleWatchedBtn.classList.remove("active");
    renderMyLists();
  });

  DOM.toggleWatchedBtn.addEventListener("click", () => {
    DOM.currentListTab = "watched";
    DOM.toggleWatchedBtn.classList.add("active");
    DOM.toggleWatchlistBtn.classList.remove("active");
    renderMyLists();
  });

  // Auth Modals Toggle & Submission
  DOM.authCloseBtn.addEventListener("click", () => closeAuthModal());
  DOM.authToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    toggleAuthMode();
  });
  DOM.authForm.addEventListener("submit", handleAuthSubmit);

  // Detail Modal Close
  DOM.detailCloseBtn.addEventListener("click", () => {
    DOM.detailModal.classList.remove("active");
    selectedTitle = null;
  });

  // Star Rating Selector in Review Block
  const starSpans = DOM.starsSelector.querySelectorAll("span");
  starSpans.forEach(span => {
    span.addEventListener("click", () => {
      const val = parseInt(span.getAttribute("data-val"), 10);
      setReviewRating(val);
    });
  });

  // Review Form Submit
  DOM.reviewForm.addEventListener("submit", handleReviewSubmit);

  // Logout Button
  DOM.logoutBtn.addEventListener("click", () => {
    authService.logout();
    switchScreen("home");
  });

  // Listen for storage / custom state changes to synchronize views
  window.addEventListener("auth_change", () => {
    updateUserHeader();
    if (!authService.isAuthenticated() && (currentTab === "lists" || currentTab === "profile")) {
      switchScreen("home");
    }
  });

  window.addEventListener("watchlist_change", () => {
    if (currentTab === "lists") renderMyLists();
    if (selectedTitle) updateDetailActionsState();
  });

  window.addEventListener("watched_change", () => {
    if (currentTab === "lists") renderMyLists();
    if (selectedTitle) updateDetailActionsState();
  });

  window.addEventListener("reviews_change", () => {
    if (selectedTitle) renderDetailReviews();
  });
}

// User Status Header Helper
function updateUserHeader() {
  const user = authService.getCurrentUser();
  if (user) {
    DOM.userStatus.innerHTML = `<span class="user-badge" id="header-profile-btn">${user.email}</span>`;
    document.getElementById("header-profile-btn").addEventListener("click", () => {
      switchScreen("profile");
    });
  } else {
    DOM.userStatus.innerHTML = `<button class="login-link-btn" id="header-login-btn">Log In</button>`;
    document.getElementById("header-login-btn").addEventListener("click", () => {
      openAuthModal();
    });
  }
}

// Routing & Auth Guards
function switchScreen(screenId) {
  // Auth Guards for My Lists and Profile
  if ((screenId === "lists" || screenId === "profile") && !authService.isAuthenticated()) {
    intendedScreenAfterAuth = screenId;
    openAuthModal();
    return;
  }

  currentTab = screenId;

  // Update nav tabs
  DOM.tabs.forEach(tab => {
    if (tab.getAttribute("data-screen") === screenId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Switch visible screen container
  DOM.screens.forEach(screen => {
    if (screen.id === `screen-${screenId}`) {
      screen.classList.add("active");
    } else {
      screen.classList.remove("active");
    }
  });

  // Screen specific loaders
  if (screenId === "lists") {
    renderMyLists();
  } else if (screenId === "profile") {
    renderProfile();
  }
}

// Auth Modal Functions
function openAuthModal() {
  DOM.authErrorBanner.style.display = "none";
  DOM.authEmailInput.value = "";
  DOM.authPasswordInput.value = "";
  DOM.isRegisterMode = false;
  updateAuthModalUI();
  DOM.authModal.classList.add("active");
}

function closeAuthModal() {
  DOM.authModal.classList.remove("active");
  intendedScreenAfterAuth = null;
}

function toggleAuthMode() {
  DOM.isRegisterMode = !DOM.isRegisterMode;
  DOM.authErrorBanner.style.display = "none";
  updateAuthModalUI();
}

function updateAuthModalUI() {
  if (DOM.isRegisterMode) {
    DOM.authModalTitle.textContent = "Create Account";
    DOM.authModalSubtitle.textContent = "Sign up to track lists and rate shows";
    DOM.authSubmitBtn.textContent = "Sign Up";
    DOM.authToggleText.textContent = "Already have an account?";
    DOM.authToggleBtn.textContent = "Log In";
  } else {
    DOM.authModalTitle.textContent = "Log In";
    DOM.authModalSubtitle.textContent = "Log in to save watchlists and write reviews";
    DOM.authSubmitBtn.textContent = "Log In";
    DOM.authToggleText.textContent = "Don't have an account?";
    DOM.authToggleBtn.textContent = "Sign Up";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  DOM.authErrorBanner.style.display = "none";

  const email = DOM.authEmailInput.value;
  const password = DOM.authPasswordInput.value;

  try {
    if (DOM.isRegisterMode) {
      await authService.register(email, password);
    } else {
      await authService.login(email, password);
    }

    // Success
    closeAuthModal();
    if (intendedScreenAfterAuth) {
      switchScreen(intendedScreenAfterAuth);
      intendedScreenAfterAuth = null;
    }
  } catch (error) {
    DOM.authErrorBanner.textContent = error.message || "An authentication error occurred.";
    DOM.authErrorBanner.style.display = "block";
  }
}

// Home screen trending loader
async function loadTrending() {
  try {
    const titles = await watchmodeService.getTrendingTitles();
    renderGrid(DOM.trendingGrid, titles);
  } catch (error) {
    console.error("Failed to load trending titles:", error);
    DOM.trendingGrid.innerHTML = `<div class="empty-state"><p>Failed to load trending content. Connect to internet or set up API keys.</p></div>`;
  }
}

// Search operations
function handleSearchInput() {
  const query = DOM.searchInput.value;
  if (query.length > 0) {
    DOM.searchClearBtn.style.display = "block";
  } else {
    DOM.searchClearBtn.style.display = "none";
  }

  // Debounce API calls (300ms)
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    triggerSearch();
  }, 300);
}

async function triggerSearch() {
  const query = DOM.searchInput.value.trim();
  if (!query) {
    DOM.searchResultsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍿</span>
        <p>Type a movie or TV show name to start searching.</p>
      </div>
    `;
    return;
  }

  DOM.searchResultsGrid.innerHTML = `<div class="loading-placeholder">Searching matches...</div>`;

  try {
    const results = await watchmodeService.searchTitles(query, currentSearchType);
    if (results.length === 0) {
      DOM.searchResultsGrid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>No results found for "${query}". Try adjusting filters or check spelling.</p>
        </div>
      `;
    } else {
      renderGrid(DOM.searchResultsGrid, results);
    }
  } catch (error) {
    console.error("Search failed:", error);
    DOM.searchResultsGrid.innerHTML = `<div class="empty-state"><p>Search unavailable. Connect API key or try again.</p></div>`;
  }
}

// Render cards grids
function renderGrid(container, titles) {
  container.innerHTML = "";
  const user = authService.getCurrentUser();

  titles.forEach(title => {
    const isWl = user ? dbService.isInWatchlist(user.id, title.id) : false;
    const isWd = user ? dbService.isInWatched(user.id, title.id) : false;
    
    // Calculate display rating from reviews
    const reviews = dbService.getReviews(title.id);
    const avgRating = reviews.length > 0
      ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
      : (title.user_rating ? Math.round(title.user_rating) : 0);

    const starsHtml = avgRating > 0 ? "★".repeat(avgRating) + "☆".repeat(5 - avgRating) : "☆☆☆☆☆";

    // Setup streaming logos icons only on cards
    let logosHtml = "";
    // Grab mock streaming details if we are in mock mode
    let sources = [];
    if (title.id.length < 3) {
      // Fetch mock sources from service
      watchmodeService.getTitleSources(title.id).then(srcs => {
        const logoBadges = srcs.slice(0, 3).map(s => getLogoForSource(s.source_id, s.name)).join("");
        const logosElem = document.getElementById(`logos-card-${title.id}`);
        if (logosElem) logosElem.innerHTML = logoBadges;
      });
    }

    const card = document.createElement("div");
    card.className = "movie-card";
    card.setAttribute("data-id", title.id);

    // Watchlist quick-save button class
    let saveBtnClass = "";
    let saveBtnText = "+";
    if (isWl) {
      saveBtnClass = "active-watchlist";
      saveBtnText = "✓";
    } else if (isWd) {
      saveBtnClass = "active-watched";
      saveBtnText = "★";
    }

    card.innerHTML = `
      <div class="card-poster-wrapper">
        <img class="card-poster" src="${title.poster}" alt="${title.name}" loading="lazy">
        <span class="card-media-badge">${title.type === "tv_series" ? "TV" : "Movie"}</span>
        <button class="card-save-btn ${saveBtnClass}" data-id="${title.id}" title="Save to Watch List">${saveBtnText}</button>
      </div>
      <div class="card-details">
        <h4 class="card-title">${title.name}</h4>
        <div class="card-meta-row">
          <span class="card-rating-stars">${starsHtml}</span>
          <div class="card-logos-container" id="logos-card-${title.id}">
            ${logosHtml}
          </div>
        </div>
      </div>
    `;

    // Event listener to open Details Modal (except when clicking save button)
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("card-save-btn")) {
        e.stopPropagation();
        handleQuickSave(title);
      } else {
        openDetailModal(title.id);
      }
    });

    container.appendChild(card);
  });
}

// Handle quick saving watchlist/watched from grid cards
function handleQuickSave(title) {
  const user = authService.getCurrentUser();
  if (!user) {
    intendedScreenAfterAuth = currentTab;
    openAuthModal();
    return;
  }

  const isWl = dbService.isInWatchlist(user.id, title.id);
  const isWd = dbService.isInWatched(user.id, title.id);

  if (isWl) {
    // If in watchlist, toggle to Watched
    dbService.addToWatched(user.id, title.id, title.name, title.poster);
  } else if (isWd) {
    // If in watched, remove
    dbService.removeFromWatched(user.id, title.id);
  } else {
    // Default add to Watchlist
    dbService.addToWatchlist(user.id, title.id, title.name, title.poster);
  }
}

// My Lists Screen
function renderMyLists() {
  const user = authService.getCurrentUser();
  if (!user) return;

  let list = [];
  let emptyMsg = "";
  let icon = "";

  if (DOM.currentListTab === "watchlist") {
    list = dbService.getWatchlist(user.id);
    emptyMsg = "Your Watch List is empty. Discover trending titles or search to add them!";
    icon = "🍿";
  } else {
    list = dbService.getWatched(user.id);
    emptyMsg = "You haven't marked any movies or TV shows as watched yet.";
    icon = "🎬";
  }

  if (list.length === 0) {
    DOM.listsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">${icon}</span>
        <p>${emptyMsg}</p>
      </div>
    `;
    return;
  }

  // Re-fetch details mapping so cards display correctly
  DOM.listsGrid.innerHTML = `<div class="loading-placeholder">Loading saved lists...</div>`;
  
  // Fetch details for lists
  Promise.all(list.map(item => watchmodeService.getTitleDetails(item.title_id)))
    .then(titles => {
      renderGrid(DOM.listsGrid, titles);
    })
    .catch(err => {
      console.error("Failed to render My Lists:", err);
      DOM.listsGrid.innerHTML = `<div class="empty-state"><p>Could not retrieve saved list items.</p></div>`;
    });
}

// Profile Screen
function renderProfile() {
  const user = authService.getCurrentUser();
  if (!user) return;

  DOM.profileEmail.textContent = user.email;
  const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  DOM.profileJoined.textContent = `Member since: ${joinedDate}`;

  renderProfileReviews();
}

function renderProfileReviews() {
  const user = authService.getCurrentUser();
  const reviews = dbService.getUserReviews(user.id);

  if (reviews.length === 0) {
    DOM.profileReviewsList.innerHTML = `
      <div class="no-sources-text" style="text-align: center; margin-top: 20px;">
        You haven't written any reviews yet. Click on any title details to write one!
      </div>
    `;
    return;
  }

  DOM.profileReviewsList.innerHTML = reviews.map(rev => `
    <div class="review-card">
      <div class="review-card-header">
        <span class="review-card-title-name">${rev.title_name}</span>
        <span class="review-card-stars">${"★".repeat(rev.rating)}${"☆".repeat(5 - rev.rating)}</span>
      </div>
      <p class="review-card-body">${rev.body || "<i>No written review body.</i>"}</p>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 6px;">
        <span>${rev.is_public ? "🌍 Public" : "🔒 Private"}</span>
        <span>${new Date(rev.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join("");
}

// Detail Modal Controller
async function openDetailModal(titleId) {
  selectedTitle = null;
  DOM.detailPoster.src = "";
  DOM.detailTitle.textContent = "Loading...";
  DOM.detailYear.textContent = "";
  DOM.detailType.textContent = "";
  DOM.detailGenres.innerHTML = "";
  DOM.detailPlot.textContent = "Fetching summary details...";
  DOM.detailSourcesList.innerHTML = `<div class="no-sources-text">Checking availability...</div>`;
  DOM.detailReviewsContainer.innerHTML = "";
  
  setReviewRating(0);
  DOM.reviewBody.value = "";
  DOM.reviewForm.reset();

  DOM.detailModal.classList.add("active");

  try {
    const details = await watchmodeService.getTitleDetails(titleId);
    selectedTitle = details;

    DOM.detailPoster.src = details.poster;
    DOM.detailPoster.alt = details.name;
    DOM.detailTitle.textContent = details.name;
    DOM.detailYear.textContent = details.year;
    DOM.detailType.textContent = details.type === "tv_series" ? "TV Series" : "Movie";
    
    DOM.detailGenres.innerHTML = (details.genre_names || [])
      .map(genre => `<span class="genre-badge">${genre}</span>`).join("");
    
    DOM.detailPlot.textContent = details.plot_overview || "No description available.";

    updateDetailActionsState();
    loadSources(titleId);
    renderDetailReviews();

  } catch (error) {
    console.error("Failed to load details modal:", error);
    DOM.detailTitle.textContent = "Error Loading Title";
    DOM.detailPlot.textContent = "Could not retrieve details from server.";
  }
}

function updateDetailActionsState() {
  const user = authService.getCurrentUser();
  if (!user || !selectedTitle) {
    DOM.detailBtnWatchlist.className = "btn btn-action";
    DOM.detailBtnWatched.className = "btn btn-action";
    return;
  }

  const isWl = dbService.isInWatchlist(user.id, selectedTitle.id);
  const isWd = dbService.isInWatched(user.id, selectedTitle.id);

  if (isWl) {
    DOM.detailBtnWatchlist.className = "btn btn-action active-watchlist";
    DOM.detailBtnWatchlist.innerHTML = `<span class="btn-icon">✓</span> Watch List`;
  } else {
    DOM.detailBtnWatchlist.className = "btn btn-action";
    DOM.detailBtnWatchlist.innerHTML = `<span class="btn-icon">+</span> Watch List`;
  }

  if (isWd) {
    DOM.detailBtnWatched.className = "btn btn-action active-watched";
    DOM.detailBtnWatched.innerHTML = `<span class="btn-icon">★</span> Watched`;
  } else {
    DOM.detailBtnWatched.className = "btn btn-action";
    DOM.detailBtnWatched.innerHTML = `<span class="btn-icon">✓</span> Mark Watched`;
  }

  // Setup click listeners for detail actions
  DOM.detailBtnWatchlist.onclick = () => {
    if (isWl) {
      dbService.removeFromWatchlist(user.id, selectedTitle.id);
    } else {
      dbService.addToWatchlist(user.id, selectedTitle.id, selectedTitle.name, selectedTitle.poster);
    }
  };

  DOM.detailBtnWatched.onclick = () => {
    if (isWd) {
      dbService.removeFromWatched(user.id, selectedTitle.id);
    } else {
      dbService.addToWatched(user.id, selectedTitle.id, selectedTitle.name, selectedTitle.poster);
    }
  };
}

async function loadSources(titleId) {
  try {
    const sources = await watchmodeService.getTitleSources(titleId);
    
    if (sources.length === 0) {
      DOM.detailSourcesList.innerHTML = `<div class="no-sources-text">Not currently available to stream</div>`;
      return;
    }

    DOM.detailSourcesList.innerHTML = sources.map(source => {
      // Determine platform specific links
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      let link = "#";
      if (isIOS && source.deeplink_ios) {
        link = source.deeplink_ios;
      } else if (isAndroid && source.deeplink_android) {
        link = source.deeplink_android;
      } else {
        // Default to a generic fallback web link or placeholder
        link = `https://www.google.com/search?q=Watch+${encodeURIComponent(selectedTitle.name)}+on+${encodeURIComponent(source.name)}`;
      }

      const logoHtml = getLogoForSource(source.source_id, source.name);

      return `
        <a href="${link}" target="_blank" class="source-item">
          <div class="source-left">
            ${logoHtml}
            <span class="source-name">${source.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="source-type ${source.type}">${source.type}</span>
            <span class="source-link-arrow">➔</span>
          </div>
        </a>
      `;
    }).join("");

  } catch (error) {
    console.error("Failed to load sources:", error);
    DOM.detailSourcesList.innerHTML = `<div class="no-sources-text">Failed to retrieve streaming availability.</div>`;
  }
}

// Detail Reviews Renderer
function renderDetailReviews() {
  if (!selectedTitle) return;
  const reviews = dbService.getReviews(selectedTitle.id);
  const user = authService.getCurrentUser();

  // Filter: show public reviews OR user's own private reviews
  const visibleReviews = reviews.filter(rev => rev.is_public || (user && rev.user_id === user.id));

  // Update average rating displayed in header block
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    DOM.detailStarsAvg.textContent = "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
    DOM.detailRatingAvgText.textContent = `${avg.toFixed(1)} / 5`;
  } else {
    // Fallback to title default rating or empty stars
    const val = selectedTitle.user_rating ? Math.round(selectedTitle.user_rating) : 0;
    DOM.detailStarsAvg.textContent = val > 0 ? "★".repeat(val) + "☆".repeat(5 - val) : "☆☆☆☆☆";
    DOM.detailRatingAvgText.textContent = selectedTitle.user_rating ? `${selectedTitle.user_rating.toFixed(1)} / 5` : "No ratings yet";
  }

  if (visibleReviews.length === 0) {
    DOM.detailReviewsContainer.innerHTML = `<div class="no-sources-text">No reviews yet. Be the first to share your thoughts!</div>`;
    return;
  }

  DOM.detailReviewsContainer.innerHTML = visibleReviews.map(rev => {
    const isOwner = user && rev.user_id === user.id;
    return `
      <div class="review-card">
        <div class="review-card-header">
          <span class="review-card-email">${isOwner ? "You (Private/Public)" : rev.user_email}</span>
          <span class="review-card-stars">${"★".repeat(rev.rating)}${"☆".repeat(5 - rev.rating)}</span>
        </div>
        <p class="review-card-body">${rev.body || "<i>Rated only.</i>"}</p>
        <div style="font-size: 9px; color: var(--text-muted); margin-top: 4px; display: flex; justify-content: space-between;">
          <span>${rev.is_public ? "🌍 Public Review" : "🔒 Private Log"}</span>
          <span>${new Date(rev.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }).join("");
}

// Set Review Rating Selector
function setReviewRating(rating) {
  selectedReviewRating = rating;
  const starSpans = DOM.starsSelector.querySelectorAll("span");
  
  starSpans.forEach(span => {
    const val = parseInt(span.getAttribute("data-val"), 10);
    if (val <= rating) {
      span.classList.add("active");
    } else {
      span.classList.remove("active");
    }
  });
}

// Submit Review Form
function handleReviewSubmit(e) {
  e.preventDefault();
  const user = authService.getCurrentUser();
  
  if (!user) {
    DOM.detailModal.classList.remove("active");
    intendedScreenAfterAuth = currentTab;
    openAuthModal();
    return;
  }

  if (!selectedTitle) return;

  if (selectedReviewRating === 0) {
    alert("Please select a rating (1-5 stars) before submitting.");
    return;
  }

  const body = DOM.reviewBody.value.trim();
  const isPublic = DOM.reviewPublic.checked;

  try {
    dbService.addReview(
      user.id,
      user.email,
      selectedTitle.id,
      selectedTitle.name,
      selectedReviewRating,
      body,
      isPublic
    );

    // Reset input fields
    setReviewRating(0);
    DOM.reviewBody.value = "";
    
    // Refresh list and triggers grid ratings to update
    renderDetailReviews();
    loadTrending();
    if (currentTab === "lists") renderMyLists();
  } catch (error) {
    alert(error.message);
  }
}
