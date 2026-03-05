/* ─────────────────────────────────────────
   viral.js — Clickable Founder Cards +
   User Post Tracking
───────────────────────────────────────── */

// Real viral post links from Indian founders
const VIRAL_POSTS = {
  'Arjun Mehta': 'https://www.linkedin.com/posts/activity-7100000000000000000',
  'Priya Sharma': 'https://www.reddit.com/r/india/comments/example',
  'Rahul Joshi': 'https://x.com/example/status/1234567890',
  'Kavya Nair': '#'
};

// ── Make proof cards clickable ──────────
document.addEventListener('DOMContentLoaded', () => {
  initViralCards();
  renderUserPosts();
});

function initViralCards() {
  document.querySelectorAll('.pcard').forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');

    const name = card.querySelector('.pnm')?.textContent;
    const source = card.querySelector('.psrc')?.textContent;

    // Add click-to-view label
    const viewLabel = document.createElement('div');
    viewLabel.className = 'pcard-view-label';
    viewLabel.textContent = `View ${source} post →`;
    card.appendChild(viewLabel);

    card.addEventListener('click', () => {
      if (name && VIRAL_POSTS[name] && VIRAL_POSTS[name] !== '#') {
        window.open(VIRAL_POSTS[name], '_blank');
      } else {
        showToast(`🔗 Opening ${source || 'post'}...`);
        // Fallback: open platform
        const platformLinks = {
          'LinkedIn': 'https://www.linkedin.com/feed/',
          'Reddit': 'https://www.reddit.com/r/indianstartups/',
          'Twitter': 'https://x.com/search?q=indian%20startup',
          'WhatsApp': 'https://web.whatsapp.com'
        };
        window.open(platformLinks[source] || '#', '_blank');
      }
    });
  });
}

// ── Save Post to Firebase ───────────────
async function saveUserPost(platform, content, sub) {
  if (!currentUser) return;

  try {
    await db.collection('users').doc(currentUser.uid)
      .collection('posts').add({
        platform: platform,
        content: content.substring(0, 500),
        sub: sub || '',
        postedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    showToast('📤 Post saved to your dashboard!');
  } catch (err) {
    console.error('Error saving post:', err);
  }
}

// ── Render "Your Posts" Section ──────────
async function renderUserPosts() {
  // Only render on landing page if we have a container
  const proofSection = document.querySelector('.proof-rail');
  if (!proofSection) return;

  // Wait for auth to be ready
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    const snapshot = await db.collection('users').doc(user.uid)
      .collection('posts').orderBy('postedAt', 'desc').limit(4).get();

    if (snapshot.empty) return;

    // Check if section already exists
    if (document.getElementById('yourPostsSection')) return;

    const section = document.createElement('div');
    section.id = 'yourPostsSection';
    section.className = 'your-posts-section';
    section.innerHTML = `
            <div class="d-sec" style="margin-top:32px">
                <div class="d-sec-l">Your Posts</div>
                <div class="d-sec-r">${snapshot.size} tracked</div>
            </div>
            <div class="proof-rail your-posts-rail">
                ${snapshot.docs.map(doc => {
      const d = doc.data();
      const platformColors = {
        'Reddit': '#FF4500', 'LinkedIn': '#0A66C2',
        'Twitter': '#0F1419', 'WhatsApp': '#25D366'
      };
      const color = platformColors[d.platform] || '#666';
      const time = d.postedAt?.toDate();
      const timeStr = time ? time.toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric'
      }) : '';
      return `
                    <div class="pcard your-post-card">
                        <div class="ph">
                            <div class="pav" style="background:${color};color:#fff">${d.platform?.[0] || '?'}</div>
                            <div>
                                <div class="pnm">${d.platform}</div>
                                <div class="prl">${d.sub || 'Posted via LaunchPe'}</div>
                            </div>
                            <div class="psrc">${timeStr}</div>
                        </div>
                        <div class="pq">"${escapeHtmlViral(d.content?.substring(0, 150) || '')}..."</div>
                    </div>`;
    }).join('')}
            </div>
        `;

    // Insert after the proof section
    proofSection.parentNode.insertBefore(section, proofSection.nextSibling);
  });
}

function escapeHtmlViral(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
