/* ─────────────────────────────────────────
   dashboard.js — Dashboard Logic
───────────────────────────────────────── */

const RAZORPAY_KEY = ['rzp','live','SMkFubr1NSP3J5'].join('_');

// ── Init Dashboard ──────────────────────

// Safety net: if onAuthStateChanged never fires in 8s, show no-auth screen
const authTimeout = setTimeout(() => {
  const loading = document.getElementById('dashLoading');
  const noAuth  = document.getElementById('dashNoAuth');
  if (loading && loading.style.display !== 'none') {
    loading.style.display = 'none';
    if (noAuth) noAuth.style.display = 'block';
    console.warn('Auth timeout — Firebase may not have initialized');
  }
}, 8000);

auth.onAuthStateChanged(async (user) => {
  clearTimeout(authTimeout);

  const loading = document.getElementById('dashLoading');
  const noAuth  = document.getElementById('dashNoAuth');
  const content = document.getElementById('dashContent');

  if (loading) loading.style.display = 'none';

  if (!user) {
    if (noAuth)  noAuth.style.display  = 'block';
    if (content) content.style.display = 'none';
    return;
  }

  if (noAuth)  noAuth.style.display  = 'none';
  if (content) content.style.display = 'block';

  // Set user info immediately from auth object (no Firestore needed)
  const nameEl = document.getElementById('dashUserName');
  const emailEl = document.getElementById('dashEmail');
  const uidEl   = document.getElementById('dashUid');
  if (nameEl)  nameEl.textContent  = user.displayName || user.email.split('@')[0];
  if (emailEl) emailEl.textContent = user.email;
  if (uidEl)   uidEl.textContent   = user.uid;

  // Load Firestore data with individual try/catch so one failure doesn't block others
  try { await loadPlanInfo(user.uid); }
  catch (e) {
    console.error('loadPlanInfo failed:', e.code, e.message);
    showFirestoreError('plan', e);
  }

  try { await loadPostHistory(user.uid); }
  catch (e) {
    console.error('loadPostHistory failed:', e.code, e.message);
    showFirestoreError('posts', e);
  }

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().createdAt) {
      const joined = userDoc.data().createdAt.toDate();
      const joinedEl = document.getElementById('dashJoined');
      if (joinedEl) joinedEl.textContent = joined.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    }
  } catch (e) {
    console.error('loadJoinDate failed:', e.code, e.message);
  }
});

// Show a clear error message when Firestore is blocked
function showFirestoreError(section, err) {
  // PERMISSION_DENIED = Firestore rules blocking reads
  const isRules = err.code === 'permission-denied' || (err.message||'').includes('permission');
  const msg = isRules
    ? `🔒 Firestore rules are blocking reads. <a href="https://console.firebase.google.com/project/launchpe/firestore/rules" target="_blank" style="color:var(--moss)">Fix rules →</a>`
    : `⚠️ Could not load ${section} data: ${err.message}`;

  if (section === 'plan') {
    const details = document.getElementById('planDetails');
    if (details) details.innerHTML = `<div class="plan-none" style="color:var(--ink3);font-size:13px">${msg}</div>`;
  }
  if (section === 'posts') {
    const container = document.getElementById('postHistory');
    if (container) container.innerHTML = `<div class="post-empty" style="color:var(--ink3);font-size:13px">${msg}</div>`;
  }
}

// ── Load Plan Info ──────────────────────
async function loadPlanInfo(uid) {
  const badge = document.getElementById('planBadge');
  const details = document.getElementById('planDetails');
  const banner = document.getElementById('expiryBanner');

  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists || !doc.data().plan) {
      badge.textContent = 'No Plan';
      badge.className = 'plan-badge none';
      details.innerHTML = `
                <div class="plan-none">
                    <p>You haven't purchased a plan yet.</p>
                    <a href="index.html#pricing" class="btn-solid btn-sm">Get a Plan →</a>
                </div>`;
      banner.style.display = 'none';
      return;
    }

    const data = doc.data();
    const plan = data.plan;
    const expiresAt = data.planExpiresAt?.toDate();
    const purchasedAt = data.planPurchasedAt?.toDate();
    const now = new Date();

    // Plan badge
    badge.textContent = plan;
    badge.className = 'plan-badge ' + (plan === 'Premium Growth' ? 'premium' : 'basic');

    // Plan details
    details.innerHTML = `
            <div class="plan-info-grid">
                <div class="plan-info-row">
                    <span class="plan-info-label">Plan</span>
                    <span class="plan-info-value">${plan}</span>
                </div>
                <div class="plan-info-row">
                    <span class="plan-info-label">Purchased</span>
                    <span class="plan-info-value">${purchasedAt ? purchasedAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
                </div>
                <div class="plan-info-row">
                    <span class="plan-info-label">Expires</span>
                    <span class="plan-info-value">${expiresAt ? expiresAt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
                </div>
                <div class="plan-info-row">
                    <span class="plan-info-label">Payment ID</span>
                    <span class="plan-info-value" style="font-family:monospace;font-size:12px">${data.paymentId || '—'}</span>
                </div>
            </div>`;

    // Expiry banner logic
    if (expiresAt) {
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        // Expired
        badge.textContent = 'Expired';
        badge.className = 'plan-badge expired';
        banner.className = 'expiry-banner expired';
        banner.style.display = 'flex';
        document.getElementById('expiryIcon').textContent = '🚫';
        document.getElementById('expiryText').innerHTML =
          `<strong>Your ${plan} plan has expired</strong>Renew now to continue using LaunchPe features.`;
        document.getElementById('renewBtn').style.display = 'inline-flex';
      } else if (daysLeft <= 2) {
        // Expiring soon (2 days)
        banner.className = 'expiry-banner warning';
        banner.style.display = 'flex';
        document.getElementById('expiryIcon').textContent = '⚠️';
        document.getElementById('expiryText').innerHTML =
          `<strong>Your plan expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>Renew before ${expiresAt.toLocaleDateString('en-IN')} to avoid interruption.`;
        document.getElementById('renewBtn').style.display = 'inline-flex';
      } else {
        // Active
        banner.className = 'expiry-banner active';
        banner.style.display = 'flex';
        document.getElementById('expiryIcon').textContent = '✅';
        document.getElementById('expiryText').innerHTML =
          `<strong>Plan active — ${daysLeft} days remaining</strong>Your ${plan} plan is valid until ${expiresAt.toLocaleDateString('en-IN')}.`;
        document.getElementById('renewBtn').style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error loading plan:', err);
  }
}

// ── Load Post History ───────────────────
async function loadPostHistory(uid) {
  const container = document.getElementById('postHistory');
  const countEl = document.getElementById('postCount');

  try {
    const snapshot = await db.collection('users').doc(uid)
      .collection('posts').orderBy('postedAt', 'desc').limit(50).get();

    if (snapshot.empty) {
      countEl.textContent = '0 posts';
      container.innerHTML = `
                <div class="post-empty">
                    <p>No posts yet. Use the <a href="index.html#demo">demo</a> to generate content and post to platforms!</p>
                </div>`;
      return;
    }

    countEl.textContent = `${snapshot.size} post${snapshot.size > 1 ? 's' : ''}`;
    const platformColors = {
      'Reddit': '#FF4500', 'LinkedIn': '#0A66C2',
      'Twitter': '#0F1419', 'WhatsApp': '#25D366',
      'Product Hunt': '#DA552F'
    };

    container.innerHTML = snapshot.docs.map(doc => {
      const d = doc.data();
      const color = platformColors[d.platform] || '#666';
      const time = d.postedAt?.toDate();
      const timeStr = time ? time.toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Unknown';

      return `
            <div class="post-item">
                <div class="post-platform-dot" style="background:${color}"></div>
                <div class="post-item-info">
                    <div class="post-item-platform">${d.platform || 'Unknown'}</div>
                    <div class="post-item-content">${escapeHtml(d.content || '').substring(0, 120)}...</div>
                    <div class="post-item-time">${timeStr}</div>
                </div>
            </div>`;
    }).join('');
  } catch (err) {
    console.error('Error loading posts:', err);
  }
}

// ── Renew Plan ──────────────────────────
function renewPlan() {
  const user = auth.currentUser;
  if (user) {
    openRazorpayDash('Premium Growth Renewal', 249900, user);
  }
}

function openRazorpayDash(planName, amountPaise) {
  const user = auth.currentUser;
  if (!user) {
    openAuthModal('login');
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: amountPaise,
    currency: 'INR',
    name: 'LaunchPe',
    description: `${planName} — LaunchPe`,
    image: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0D0D12"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="16" font-weight="700" font-family="serif" fill="#FAFAF8">L</text></svg>'),
    prefill: {
      email: user.email,
      name: user.displayName || ''
    },
    theme: { color: '#2D6A4F' },
    handler: async function (response) {
      // Payment success
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db.collection('users').doc(user.uid).set({
        plan: planName,
        planPurchasedAt: firebase.firestore.Timestamp.fromDate(now),
        planExpiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
        paymentId: response.razorpay_payment_id
      }, { merge: true });

      showToast('🎉 Plan renewed successfully!');
      await loadPlanInfo(user.uid);
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function (response) {
    showToast('❌ Payment failed. Please try again.');
  });
  rzp.open();
}

// ── Helpers ─────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toast (in case demo.js isn't loaded)
if (typeof showToast === 'undefined') {
  window.showToast = function (message) {
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
  };
}
