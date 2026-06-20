// Authentication Service — Firebase Auth
// UI components must never import from firebase.js directly.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth } from "./firebase.js";

// ---------------------------------------------------------------------------
// In-memory session cache — updated by onAuthStateChanged.
// Keeps getCurrentUser() synchronous so app.js needs no changes on reads.
// ---------------------------------------------------------------------------
let _currentUser = null;

// Promise that resolves once Firebase completes its first auth check.
// Await this in app.js before rendering auth-guarded content.
let _authReadyResolve;
export const authReady = new Promise((resolve) => {
  _authReadyResolve = resolve;
});

onAuthStateChanged(auth, (firebaseUser) => {
  _currentUser = firebaseUser
    ? {
        id:         firebaseUser.uid,
        email:      firebaseUser.email || firebaseUser.displayName || "Google User",
        displayName: firebaseUser.displayName || null,
        photoURL:   firebaseUser.photoURL   || null,
        created_at: firebaseUser.metadata.creationTime,
      }
    : null;

  // Resolve the ready-promise (no-op on subsequent calls).
  _authReadyResolve();

  // Notify the application.
  window.dispatchEvent(new Event("auth_change"));
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns the cached user object, or null if not authenticated. */
export function getCurrentUser() {
  return _currentUser;
}

/** Synchronous auth check — safe to call anywhere. */
export function isAuthenticated() {
  return _currentUser !== null;
}

/**
 * Register a new user with email + password.
 * Firebase automatically signs the user in after successful registration.
 */
export async function register(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { id: cred.user.uid, email: cred.user.email };
  } catch (error) {
    console.error("Registration error:", error);
    throw new Error(_mapAuthError(error.code));
  }
}

/** Sign an existing user in with email + password. */
export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { id: cred.user.uid, email: cred.user.email };
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(_mapAuthError(error.code));
  }
}

/**
 * Sign in (or register) using Google OAuth popup.
 * Works for both new and returning Google users.
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    return { id: cred.user.uid, email: cred.user.email };
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") return null; // User dismissed
    console.error("Google sign-in error:", error);
    throw new Error(_mapAuthError(error.code));
  }
}

/** Sign the current user out. */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to log out. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _mapAuthError(code) {
  const MAP = {
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/invalid-email":          "Invalid email address.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/invalid-credential":     "Invalid email or password.",
    "auth/too-many-requests":      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-blocked":          "Popup was blocked. Please allow popups for this site.",
  };
  return MAP[code] || "An authentication error occurred. Please try again.";
}
