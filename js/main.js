/* ─────────────────────────────────────────
   main.js — LaunchPe Interactions
───────────────────────────────────────── */

const RAZORPAY_KEY = 'rzp_live_SMkFubr1NSP3J5';

// ── Nav scroll effect ─────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Scroll reveal ─────────────────────────
const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.08 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// ── FAQ accordion ─────────────────────────
document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});

// ── Smooth scroll for anchor links ────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileMenu();
        }
    });
});

// ── Mobile hamburger menu ─────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMobileMenu() {
    if (hamburger && mobileMenu) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        const isActive = hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = isActive ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

// ── Event delegation ──────────────────────
document.addEventListener('click', e => {
    // Example pills
    const pill = e.target.closest('.ex-pill');
    if (pill && pill.dataset.url) {
        pick(pill.dataset.url);
        return;
    }

    // Analyze button
    if (e.target.closest('#btnGo')) {
        runDemo();
        return;
    }

    // Pricing buttons → Razorpay checkout
    if (e.target.closest('#basicBtn')) {
        requireAuth((user) => {
            openRazorpay('Basic Launch', 89900, user);
        });
        return;
    }
    if (e.target.closest('#premiumBtn')) {
        requireAuth((user) => {
            openRazorpay('Premium Growth', 249900, user);
        });
        return;
    }

    // Clickable proof cards (viral founders)
    const pcard = e.target.closest('.pcard[data-post-url]');
    if (pcard) {
        const url = pcard.getAttribute('data-post-url');
        if (url && url !== '#') {
            window.open(url, '_blank');
        }
        return;
    }
});

// ── Razorpay Checkout ─────────────────────
function openRazorpay(planName, amountPaise, user) {
    const options = {
        key: RAZORPAY_KEY,
        amount: amountPaise,
        currency: 'INR',
        name: 'LaunchPe',
        description: `${planName} — Viral Launch Intelligence`,
        image: 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
            '<rect width="32" height="32" rx="6" fill="#0D0D12"/>' +
            '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ' +
            'font-size="16" font-weight="700" font-family="serif" fill="#FAFAF8">L</text></svg>'
        ),
        prefill: {
            email: user.email,
            name: user.displayName || ''
        },
        notes: {
            plan: planName,
            userId: user.uid
        },
        theme: {
            color: '#2D6A4F'
        },
        handler: async function (response) {
            // Payment success → store in Firestore
            try {
                const now = new Date();
                const expiresAt = new Date(now);
                expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

                await db.collection('users').doc(user.uid).set({
                    plan: planName,
                    planPurchasedAt: firebase.firestore.Timestamp.fromDate(now),
                    planExpiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
                    paymentId: response.razorpay_payment_id
                }, { merge: true });

                showToast(`🎉 ${planName} activated! Check your dashboard.`);

                // Show success modal
                showPaymentSuccess(planName, response.razorpay_payment_id);
            } catch (err) {
                console.error('Error saving plan:', err);
                const strErr = err.message || JSON.stringify(err) || String(err);
                showToast('Payment received but error saving: ' + strErr);
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
        showToast('❌ Payment failed: ' + (response.error.description || 'Please try again'));
    });
    rzp.open();
}

// ── Payment Success Modal ─────────────────
function showPaymentSuccess(planName, paymentId) {
    const modal = document.createElement('div');
    modal.className = 'payment-success-overlay';
    modal.innerHTML = `
        <div class="payment-success-modal">
            <div class="payment-success-icon">🎉</div>
            <h3>Payment Successful!</h3>
            <p>Your <strong>${planName}</strong> plan is now active for 30 days.</p>
            <p class="payment-id">Payment ID: ${paymentId}</p>
            <div class="payment-success-btns">
                <a href="dashboard.html" class="btn-solid btn-sm">Go to Dashboard →</a>
                <button class="btn-outline btn-sm" onclick="this.closest('.payment-success-overlay').remove()">Continue</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// ── Enter key on demo input ───────────────
document.getElementById('urlInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') runDemo();
});

// ── Back to top button ────────────────────
const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.innerHTML = '↑';
backToTop.setAttribute('aria-label', 'Back to top');
document.body.appendChild(backToTop);

window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
}, { passive: true });

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
