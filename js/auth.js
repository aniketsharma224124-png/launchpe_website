/* ─────────────────────────────────────────
   auth.js — Login / Signup / Auth Gate
───────────────────────────────────────── */

let currentUser = null;
let pendingAuthCallback = null;

// ── Auth State Listener ──────────────────
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  updateNavAuth();
  if (user) {
    // Ensure user doc exists
    const docRef = db.collection('users').doc(user.uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      await docRef.set({
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        plan: null,
        planExpiresAt: null
      });
    }
    // Run pending callback (login gate)
    if (pendingAuthCallback) {
      const cb = pendingAuthCallback;
      pendingAuthCallback = null;
      cb(user);
    }
  }
});

// ── Update Nav Bar ───────────────────────
function updateNavAuth() {
  const navR = document.getElementById('navR');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!navR) return;

  // Remove old auth buttons
  navR.querySelectorAll('.nav-auth-btn, .nav-user-info').forEach(el => el.remove());
  mobileMenu?.querySelectorAll('.nav-auth-btn, .nav-user-info').forEach(el => el.remove());

  if (currentUser) {
    const initial = (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase();
    // Desktop nav
    const userInfo = document.createElement('div');
    userInfo.className = 'nav-user-info';
    userInfo.innerHTML = `
            <div class="nav-avatar">${initial}</div>
            <a href="dashboard.html" class="nav-cta nav-auth-btn">Dashboard</a>
        `;
    navR.appendChild(userInfo);

    // Mobile nav
    if (mobileMenu) {
      const mLink = document.createElement('a');
      mLink.href = 'dashboard.html';
      mLink.className = 'mobile-cta nav-auth-btn';
      mLink.textContent = 'Dashboard';
      mobileMenu.appendChild(mLink);
    }
  } else {
    // Desktop
    const loginBtn = document.createElement('button');
    loginBtn.className = 'nav-cta nav-auth-btn';
    loginBtn.textContent = 'Login';
    loginBtn.onclick = () => openAuthModal('login');
    navR.appendChild(loginBtn);

    // Mobile
    if (mobileMenu) {
      const mBtn = document.createElement('a');
      mBtn.href = '#';
      mBtn.className = 'mobile-cta nav-auth-btn';
      mBtn.textContent = 'Login';
      mBtn.onclick = (e) => { e.preventDefault(); openAuthModal('login'); };
      mobileMenu.appendChild(mBtn);
    }
  }
}

// ── Auth Modal ───────────────────────────
function createAuthModal() {
  if (document.getElementById('authModal')) return;
  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal-overlay';
  modal.innerHTML = `
        <div class="auth-modal">
            <button class="auth-close" onclick="closeAuthModal()">✕</button>
            <div class="auth-logo"><div class="logo-sq">L</div> LaunchPe</div>
            <h3 id="authTitle" class="auth-title">Welcome back</h3>
            <p id="authSubtitle" class="auth-subtitle">Sign in to access your launch dashboard</p>

            <button class="auth-google-btn" onclick="signInWithGoogle()">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
            </button>

            <div class="auth-divider"><span>or</span></div>

            <form id="authForm" onsubmit="handleAuthSubmit(event)">
                <div id="nameField" class="auth-field" style="display:none">
                    <label>Full Name</label>
                    <input type="text" id="authName" placeholder="Aniket Sharma" autocomplete="name">
                </div>
                <div class="auth-field">
                    <label>Email</label>
                    <input type="email" id="authEmail" placeholder="you@example.com" required autocomplete="email">
                </div>
                <div class="auth-field">
                    <label>Password</label>
                    <input type="password" id="authPassword" placeholder="••••••••" required minlength="6" autocomplete="current-password">
                </div>
                <button type="submit" class="auth-submit-btn" id="authSubmitBtn">Sign In</button>
            </form>

            <div class="auth-footer">
                <span id="authToggleText">Don't have an account?</span>
                <button class="auth-toggle" id="authToggleBtn" onclick="toggleAuthMode()">Sign up</button>
            </div>
            <div id="authError" class="auth-error"></div>
        </div>
    `;
  document.body.appendChild(modal);
}

let authMode = 'login'; // or 'signup'

function openAuthModal(mode = 'login') {
  createAuthModal();
  authMode = mode;
  const modal = document.getElementById('authModal');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const nameField = document.getElementById('nameField');
  const submitBtn = document.getElementById('authSubmitBtn');
  const toggleText = document.getElementById('authToggleText');
  const toggleBtn = document.getElementById('authToggleBtn');
  const error = document.getElementById('authError');

  error.textContent = '';

  if (mode === 'login') {
    title.textContent = 'Welcome back';
    subtitle.textContent = 'Sign in to access your launch dashboard';
    nameField.style.display = 'none';
    submitBtn.textContent = 'Sign In';
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = 'Sign up';
  } else {
    title.textContent = 'Create account';
    subtitle.textContent = 'Start launching your product today';
    nameField.style.display = 'block';
    submitBtn.textContent = 'Create Account';
    toggleText.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Sign in';
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function toggleAuthMode() {
  openAuthModal(authMode === 'login' ? 'signup' : 'login');
}

// ── Email Auth ───────────────────────────
async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const error = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');

  error.textContent = '';
  btn.disabled = true;
  btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';

  try {
    if (authMode === 'signup') {
      const name = document.getElementById('authName').value.trim();
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name) {
        await cred.user.updateProfile({ displayName: name });
      }
      showToast('🎉 Account created! Welcome to LaunchPe');
    } else {
      await auth.signInWithEmailAndPassword(email, password);
      showToast('👋 Welcome back!');
    }
    closeAuthModal();
  } catch (err) {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered. Try signing in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment.'
    };
    error.textContent = messages[err.code] || err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? 'Sign In' : 'Create Account';
  }
}

// ── Google Auth ──────────────────────────
async function signInWithGoogle() {
  const error = document.getElementById('authError');
  try {
    await auth.signInWithPopup(googleProvider);
    showToast('👋 Welcome! Signed in with Google');
    closeAuthModal();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      error.textContent = err.message;
    }
  }
}

// ── Sign Out ─────────────────────────────
async function signOutUser() {
  await auth.signOut();
  showToast('👋 Signed out successfully');
  if (window.location.pathname.includes('dashboard')) {
    window.location.href = 'index.html';
  }
}

// ── Auth Gate ────────────────────────────
// Call this before any protected action
function requireAuth(callback) {
  if (currentUser) {
    callback(currentUser);
  } else {
    pendingAuthCallback = callback;
    openAuthModal('login');
  }
}

// ── Show Toast (if not defined by demo.js) ──
if (typeof showToast === 'undefined') {
  function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
}
