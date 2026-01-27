// Authentication Module
// Handles user login/logout and session management

const BACKEND_URL = 'http://localhost:4000';

// State
let currentUser = null;

// ========================================
// User Session Management
// ========================================

// Check if user is logged in on page load
async function checkAuthStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/user`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.user) {
            currentUser = data.user;
            window.currentUser = data.user;
            updateUIForLoggedInUser(currentUser);
        } else {
            currentUser = null;
            window.currentUser = null;
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        currentUser = null;
        window.currentUser = null;
        updateUIForLoggedOutUser();
    }
}

// ========================================
// Login/Logout Functions
// ========================================

function loginWithGoogle() {
    // Redirect to backend OAuth route
    window.location.href = `${BACKEND_URL}/auth/google`;
}

async function logout() {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = null;
            window.currentUser = null;
            updateUIForLoggedOutUser();
            // Optional: redirect to landing page
            navigateTo('landing');
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// ========================================
// UI Updates
// ========================================

function updateUIForLoggedInUser(user) {
    // Update navbar with user info
    const navLinks = document.querySelector('.nav-links');

    // Remove login button if exists
    const existingLoginBtn = document.getElementById('login-btn');
    if (existingLoginBtn) existingLoginBtn.remove();

    // Add user menu if not exists
    if (!document.getElementById('user-menu')) {
        const userMenu = document.createElement('li');
        userMenu.id = 'user-menu';
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <div class="user-profile" onclick="toggleUserDropdown()">
                <img src="${user.avatar_url || '👤'}" alt="${user.name}" class="user-avatar">
                <span class="user-name">${user.name || user.email}</span>
                <span class="dropdown-arrow">▼</span>
            </div>
            <div class="user-dropdown hidden">
                <div class="user-info">
                    <p class="user-email">${user.email}</p>
                </div>
                <hr>
                <button onclick="logout()" class="logout-btn">🚪 Abmelden</button>
            </div>
        `;
        navLinks.appendChild(userMenu);
    }
}

function updateUIForLoggedOutUser() {
    // Update navbar with login button
    const navLinks = document.querySelector('.nav-links');

    // Remove user menu if exists
    const existingUserMenu = document.getElementById('user-menu');
    if (existingUserMenu) existingUserMenu.remove();

    // Add login button if not exists
    if (!document.getElementById('login-btn')) {
        const loginBtn = document.createElement('li');
        loginBtn.id = 'login-btn';
        loginBtn.innerHTML = `
            <button class="btn btn-primary" onclick="loginWithGoogle()">
                <span>🔐</span> Mit Google anmelden
            </button>
        `;
        navLinks.appendChild(loginBtn);
    }
}

function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('user-menu');
    if (userMenu && !userMenu.contains(e.target)) {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
    }
});

// ========================================
// API Helper Functions
// ========================================

// Helper to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    // If unauthorized, prompt login
    if (response.status === 401) {
        alert('Bitte melden Sie sich an, um fortzufahren.');
        loginWithGoogle();
        throw new Error('Unauthorized');
    }

    return response;
}

// ========================================
// Character & Story API with Auth
// ========================================

async function loadUserCharacters() {
    if (!currentUser) return [];

    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/characters`);
        const data = await response.json();
        return data.characters || [];
    } catch (error) {
        console.error('Failed to load characters:', error);
        return [];
    }
}

async function saveCharacterToBackend(characterData) {
    if (!currentUser) {
        alert('Bitte melden Sie sich an, um Charaktere zu speichern.');
        loginWithGoogle();
        return null;
    }

    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/characters`, {
            method: 'POST',
            body: JSON.stringify(characterData)
        });
        const data = await response.json();
        return data.character;
    } catch (error) {
        console.error('Failed to save character:', error);
        return null;
    }
}

async function loadUserStories() {
    if (!currentUser) return [];

    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/stories`);
        const data = await response.json();
        return data.stories || [];
    } catch (error) {
        console.error('Failed to load stories:', error);
        return [];
    }
}

async function saveStoryToBackend(storyData) {
    if (!currentUser) {
        alert('Bitte melden Sie sich an, um Geschichten zu speichern.');
        loginWithGoogle();
        return null;
    }

    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/stories`, {
            method: 'POST',
            body: JSON.stringify(storyData)
        });
        const data = await response.json();
        return data.story;
    } catch (error) {
        console.error('Failed to save story:', error);
        return null;
    }
}

// ========================================
// Initialize on page load
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Update character
async function updateCharacterInBackend(id, characterData) {
    if (!currentUser) return null;
    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/characters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(characterData)
        });
        const data = await response.json();
        return data.character;
    } catch (error) {
        console.error('Failed to update character:', error);
        return null;
    }
}

// Delete character
async function deleteCharacterFromBackend(id) {
    if (!currentUser) return false;
    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/characters/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete character:', error);
        return false;
    }
}

// Update story
async function updateStoryInBackend(id, storyData) {
    if (!currentUser) return null;
    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/stories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(storyData)
        });
        const data = await response.json();
        return data.story;
    } catch (error) {
        console.error('Failed to update story:', error);
        return null;
    }
}

// Delete story
async function deleteStoryFromBackend(id) {
    if (!currentUser) return false;
    try {
        const response = await authenticatedFetch(`${BACKEND_URL}/api/stories/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete story:', error);
        return false;
    }
}
