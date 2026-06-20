// Authentication Service (localStorage abstraction)

const USERS_KEY = "cinefind_users";
const SESSION_KEY = "cinefind_session";

function getUsers() {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function register(email, password) {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.includes("@")) {
      throw new Error("Invalid email address.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const users = getUsers();
    if (users[emailLower]) {
      throw new Error("An account with this email already exists.");
    }

    const userId = "usr_" + Math.random().toString(36).substr(2, 9);
    const newUser = {
      id: userId,
      email: emailLower,
      password: password, // For mock authentication
      created_at: new Date().toISOString(),
    };

    users[emailLower] = newUser;
    saveUsers(users);

    // Auto-login after registration
    return login(email, password);
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export function login(email, password) {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const emailLower = email.toLowerCase().trim();
    const users = getUsers();
    const user = users[emailLower];

    if (!user || user.password !== password) {
      throw new Error("Invalid email or password.");
    }

    // Set session (without password for safety)
    const session = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      login_time: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Dispatch event to notify application of auth state change
    window.dispatchEvent(new Event("auth_change"));
    
    return session;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("auth_change"));
  return true;
}

export function getCurrentUser() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}
