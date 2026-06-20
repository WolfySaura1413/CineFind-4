// Database Service (localStorage abstraction for lists and reviews)

const WATCHLIST_KEY = "cinefind_watchlist";
const WATCHED_KEY = "cinefind_watched";
const REVIEWS_KEY = "cinefind_reviews";

// Helper utilities
function getStorageItem(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : {};
}

function setStorageItem(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Watchlist operations
export function getWatchlist(userId) {
  if (!userId) return [];
  const db = getStorageItem(WATCHLIST_KEY);
  return db[userId] || [];
}

export function isInWatchlist(userId, titleId) {
  const list = getWatchlist(userId);
  return list.some(item => String(item.title_id) === String(titleId));
}

export function addToWatchlist(userId, titleId, titleName, posterUrl) {
  if (!userId) throw new Error("Authentication required.");
  const db = getStorageItem(WATCHLIST_KEY);
  const userList = db[userId] || [];
  
  if (userList.some(item => String(item.title_id) === String(titleId))) {
    return userList; // Already in watchlist
  }

  const newItem = {
    id: "wl_" + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    title_id: String(titleId),
    title_name: titleName,
    poster_url: posterUrl || "",
    added_at: new Date().toISOString(),
  };

  userList.push(newItem);
  db[userId] = userList;
  setStorageItem(WATCHLIST_KEY, db);

  // Auto-remove from watched list when moving back to watchlist
  try {
    removeFromWatched(userId, titleId);
  } catch (e) {
    // Ignore error if not in watched list
  }

  window.dispatchEvent(new Event("watchlist_change"));
  return userList;
}

export function removeFromWatchlist(userId, titleId) {
  if (!userId) throw new Error("Authentication required.");
  const db = getStorageItem(WATCHLIST_KEY);
  const userList = db[userId] || [];
  
  const filteredList = userList.filter(item => String(item.title_id) !== String(titleId));
  db[userId] = filteredList;
  setStorageItem(WATCHLIST_KEY, db);

  window.dispatchEvent(new Event("watchlist_change"));
  return filteredList;
}

// Watched operations
export function getWatched(userId) {
  if (!userId) return [];
  const db = getStorageItem(WATCHED_KEY);
  return db[userId] || [];
}

export function isInWatched(userId, titleId) {
  const list = getWatched(userId);
  return list.some(item => String(item.title_id) === String(titleId));
}

export function addToWatched(userId, titleId, titleName, posterUrl) {
  if (!userId) throw new Error("Authentication required.");
  const db = getStorageItem(WATCHED_KEY);
  const userList = db[userId] || [];

  if (userList.some(item => String(item.title_id) === String(titleId))) {
    return userList; // Already in watched
  }

  const newItem = {
    id: "wd_" + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    title_id: String(titleId),
    title_name: titleName,
    poster_url: posterUrl || "",
    added_at: new Date().toISOString(),
    watched_at: new Date().toISOString(),
  };

  userList.push(newItem);
  db[userId] = userList;
  setStorageItem(WATCHED_KEY, db);

  // Auto-remove from watchlist when marking as watched
  try {
    removeFromWatchlist(userId, titleId);
  } catch (e) {
    // Ignore error if not in watchlist
  }

  window.dispatchEvent(new Event("watched_change"));
  return userList;
}

export function removeFromWatched(userId, titleId) {
  if (!userId) throw new Error("Authentication required.");
  const db = getStorageItem(WATCHED_KEY);
  const userList = db[userId] || [];

  const filteredList = userList.filter(item => String(item.title_id) !== String(titleId));
  db[userId] = filteredList;
  setStorageItem(WATCHED_KEY, db);

  window.dispatchEvent(new Event("watched_change"));
  return filteredList;
}

// Reviews operations
export function getReviews(titleId) {
  const db = getStorageItem(REVIEWS_KEY);
  const titleReviews = db[titleId] || [];
  return titleReviews;
}

export function addReview(userId, userEmail, titleId, titleName, rating, body, isPublic) {
  if (!userId) throw new Error("Authentication required.");
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5 stars.");

  const db = getStorageItem(REVIEWS_KEY);
  const titleReviews = db[titleId] || [];

  // Remove existing review by this user if exists (to update it)
  const filteredReviews = titleReviews.filter(review => review.user_id !== userId);

  const newReview = {
    id: "rev_" + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    user_email: userEmail,
    title_id: String(titleId),
    title_name: titleName,
    rating: parseInt(rating, 10),
    body: body || "",
    is_public: !!isPublic,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  filteredReviews.push(newReview);
  db[titleId] = filteredReviews;
  setStorageItem(REVIEWS_KEY, db);

  window.dispatchEvent(new Event("reviews_change"));
  return newReview;
}

export function getUserReviews(userId) {
  if (!userId) return [];
  const db = getStorageItem(REVIEWS_KEY);
  const allUserReviews = [];

  for (const titleId in db) {
    const reviews = db[titleId];
    const userReviews = reviews.filter(rev => rev.user_id === userId);
    allUserReviews.push(...userReviews);
  }

  // Sort by created_at descending
  return allUserReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
