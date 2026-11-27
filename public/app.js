const state = {
  page: document.body?.dataset?.page || 'home',
  prefix: '.',
  lbMode: 'rich',
  leaderboards: null,
  lotteryEndAt: 0,
  commandsByCat: {},
  activeCategory: new URLSearchParams(window.location.search).get('cat') || 'all',
  searchQuery: '',
  authProfile: null,
  pendingPhone: ''
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

function formatCompact(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return formatNumber(num);
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function updateNavAuthUi(profile) {
  const navBtn = document.getElementById('navAuthBtn');
  const navMenu = document.getElementById('navAuthMenuLink');
  if (profile) {
    const label = `👤 ${profile.name}`;
    if (navBtn) {
      navBtn.textContent = label;
      navBtn.setAttribute('href', '/profile');
    }
    if (navMenu) {
      navMenu.textContent = label;
      navMenu.setAttribute('href', '/profile');
    }
  } else {
    if (navBtn) {
      navBtn.textContent = 'Login / Link';
      navBtn.setAttribute('href', '/login');
    }
    if (navMenu) {
      navMenu.textContent = 'Login / Link';
      navMenu.setAttribute('href', '/login');
    }
  }
}

async function loadAuthSession() {
  try {
    const res = await fetchJson('/api/auth/me');
    state.authProfile = res.authenticated ? res.profile : null;
  } catch {
    state.authProfile = null;
  }
  updateNavAuthUi(state.authProfile);
  if (state.page === 'login') {
    renderAuthPage();
  }
  if (state.page === 'profile') {
    renderProfilePage();
  }
  window.dispatchEvent(new CustomEvent('shore:authReady', { detail: state.authProfile }));
}

function setMetric(el, value, formatter) {
  if (!el) return;
  if (window.ShoreMotion && typeof window.ShoreMotion.animateText === 'function') {
    window.ShoreMotion.animateText(el, value, formatter);
  } else {
    el.textContent = formatter(value);
  }
}

async function loadOverview() {
  try {
    const data = await fetchJson('/api/overview');
    state.prefix = data.prefix || '.';

    const pill = document.getElementById('botStatusPill');
    const pillText = document.getElementById('botStatusText');
    if (pill && pillText) {
      pill.classList.toggle('offline', !data.online);
      pillText.textContent = data.online ? 'Online' : 'Connecting';
    }

    const footerPhone = document.getElementById('footerPhone');
    if (footerPhone) footerPhone.textContent = data.botPhone;

    const waUrl = data.links.botWhatsAppUrl;
    for (const id of ['heroChatBtn', 'cardBotWaBtn', 'cardAiChatBtn']) {
      const el = document.getElementById(id);
      if (el) el.href = waUrl;
    }

    if (state.page === 'home') {
      const usersEl = document.getElementById('statUsers');
      const rubiesEl = document.getElementById('statRubies');
      const lotteryEl = document.getElementById('statLottery');
      const cmdsEl = document.getElementById('statCommands');

      setMetric(usersEl, data.stats.registeredUsers, (v) => formatNumber(v));
      setMetric(rubiesEl, data.stats.totalRubies, (v) => formatCompact(v));
      setMetric(lotteryEl, data.stats.lotteryRound, (v) => `#${v}`);
      setMetric(cmdsEl, data.stats.totalCommands, (v) => `${v}`);

      const groupBtn = document.getElementById('cardGroupBtn');
      const groupDesc = document.getElementById('groupCardDesc');
      const communityUrl = data.links.groupInviteUrl || 'https://chat.whatsapp.com/JALh5DPX9I6AqMN4uaZzzU';
      if (groupBtn && communityUrl) {
        groupBtn.href = communityUrl;
        groupBtn.textContent = 'Join WhatsApp Community';
      } else if (groupBtn) {
        groupBtn.href = waUrl;
        groupBtn.textContent = 'Add Bot to Group';
        if (groupDesc) {
          groupDesc.textContent = 'Message Shorekeeper or set GROUP_INVITE_URL in config.js to display your group invite link here.';
        }
      }
    }
  } catch (err) {
    console.error('Overview error:', err);
  }
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboardList');
  const legend = document.getElementById('rankLegend');
  const subtitle = document.getElementById('lbSubtitle');
  const data = state.leaderboards;
  if (!container || !data) return;

  const subMap = {
    rich: 'Top travelers sorted by total Rubies (Wallet + Bank).',
    rank: 'Black Shores wealth rank tiers and standings.',
    shame: 'Hall of Shame — travelers with the lowest Rubies.'
  };
  if (subtitle) subtitle.textContent = subMap[state.lbMode] || '';

  const list = data[state.lbMode] || [];
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-note">No registered travelers yet. Use <code>${escapeHtml(state.prefix)}register &lt;name&gt;</code> on WhatsApp.</div>`;
    if (legend) legend.hidden = true;
    return;
  }

  const medals = state.lbMode === 'shame' ? ['🤡', '📉', '💸'] : ['🥇', '🥈', '🥉'];
  const viewerName = data.viewerName || state.authProfile?.name || null;

  container.innerHTML = list
    .map((item, idx) => {
      const badge = medals[idx] ? `${medals[idx]} #${idx + 1}` : `#${idx + 1}`;
      const rankClass = state.lbMode === 'shame' ? 'lb-rank shame' : 'lb-rank';
      const isViewer = viewerName && item.name === viewerName;
      const sub =
        state.lbMode === 'rank'
          ? escapeHtml(item.rank)
          : `👛 ${formatNumber(item.wallet)} &nbsp;|&nbsp; 🏦 ${formatNumber(item.bank)}`;

      return `
        <div class="lb-row ${isViewer ? 'viewer-row' : ''}">
          <div class="lb-left">
            <span class="${rankClass}">${badge}</span>
            <div>
              <div class="lb-name">
                ${escapeHtml(item.name)}
                ${isViewer ? '<span class="you-tag">You</span>' : ''}
              </div>
              <div class="lb-sub">${sub}</div>
            </div>
          </div>
          <div class="lb-val">${formatNumber(item.totalWealth)} ♦</div>
        </div>
      `;
    })
    .join('');

  window.ShoreMotion?.animateListItems?.(container, '.lb-row');

  if (legend) {
    if (state.lbMode === 'rank' && Array.isArray(data.tiers)) {
      legend.hidden = false;
      legend.innerHTML = data.tiers
        .map((t) => `<span class="tier-chip">${escapeHtml(t.title)}: ${t.min > 0 ? formatNumber(t.min) + '+' : '&lt;50,000'} ♦</span>`)
        .join('');
    } else {
      legend.hidden = true;
    }
  }
}

async function loadLeaderboards() {
  try {
    state.leaderboards = await fetchJson('/api/leaderboards');
    renderLeaderboard();
  } catch (err) {
    console.error('Leaderboards error:', err);
  }
}

async function loadLottery() {
  try {
    const data = await fetchJson('/api/lottery');
    state.lotteryEndAt = Date.now() + (data.remainingMs || 0);

    const badge = document.getElementById('lotteryRoundBadge');
    const slotsText = document.getElementById('lotterySlotsText');
    const fill = document.getElementById('lotteryProgressFill');
    const list = document.getElementById('lotterySlotsList');
    const winners = document.getElementById('lotteryLastWinners');

    if (badge) badge.textContent = `#${data.roundId}`;
    if (slotsText) slotsText.textContent = `${data.totalSlots} / ${data.maxSlots}`;
    if (fill) fill.style.width = `${Math.min(100, Math.round((data.totalSlots / (data.maxSlots || 10)) * 100))}%`;

    if (list) {
      list.innerHTML = data.slots?.length
        ? data.slots.map((s) => `<span class="slot-pill">[Slot ${s.slot}] ${escapeHtml(s.name)}</span>`).join('')
        : `<div class="empty-note">No slots claimed yet. Use <code>${escapeHtml(state.prefix)}ll buy</code> then <code>${escapeHtml(state.prefix)}ll entry</code>.</div>`;
    }

    if (winners) {
      winners.innerHTML = data.lastDraw?.winners?.length
        ? data.lastDraw.winners
            .map(
              (w) => `
                <div class="lb-row">
                  <span>Round #${data.lastDraw.roundId} • <strong>${escapeHtml(w.rank)}</strong>: ${escapeHtml(w.name)}</span>
                  <span class="lb-val" style="color:var(--accent)">+${formatNumber(w.prize)} ♦</span>
                </div>
              `
            )
            .join('')
        : '<div class="empty-note">No previous draws recorded yet.</div>';
    }
  } catch (err) {
    console.error('Lottery error:', err);
  }
}

function renderCommands() {
  const grid = document.getElementById('cmdGrid');
  if (!grid) return;

  const query = state.searchQuery.trim().toLowerCase();
  const cat = state.activeCategory;
  const list = [];

  for (const [cName, cmds] of Object.entries(state.commandsByCat)) {
    if (cat !== 'all' && cName !== cat) continue;
    for (const cmd of cmds) {
      if (query) {
        const hay = `${cmd.name} ${(cmd.aliases || []).join(' ')} ${cmd.description} ${cName}`.toLowerCase();
        if (!hay.includes(query)) continue;
      }
      list.push(cmd);
    }
  }

  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-note">No commands match your search.</div>';
    return;
  }

  grid.innerHTML = list
    .map((cmd) => {
      const cmdStr = `${state.prefix}${cmd.name}`;
      const aliases = cmd.aliases?.length
        ? cmd.aliases.slice(0, 4).map((a) => escapeHtml(state.prefix + a)).join(', ')
        : 'None';
      return `
        <div class="cmd-card" data-copy="${escapeHtml(cmdStr)}">
          <div class="cmd-card-top">
            <span class="cmd-name">${escapeHtml(cmdStr)}</span>
            <span class="cmd-cat">${escapeHtml(cmd.category)}</span>
          </div>
          <p class="cmd-desc">${escapeHtml(cmd.description || '')}</p>
          <div class="cmd-usage">Aliases: ${aliases}</div>
        </div>
      `;
    })
    .join('');

  grid.querySelectorAll('.cmd-card').forEach((card) => {
    card.addEventListener('click', () => {
      const cmdStr = card.getAttribute('data-copy');
      if (navigator.clipboard && cmdStr) {
        navigator.clipboard.writeText(cmdStr).then(() => showToast(`Copied ${cmdStr}`)).catch(() => {});
      }
    });
  });

  window.ShoreMotion?.animateListItems?.(grid, '.cmd-card');
}

async function loadCommands() {
  try {
    const data = await fetchJson('/api/commands');
    state.prefix = data.prefix || '.';
    state.commandsByCat = data.categories || {};

    const totalEl = document.getElementById('cmdTotalLabel');
    if (totalEl) totalEl.textContent = data.total;

    const pills = document.getElementById('catPills');
    if (pills) {
      const cats = Object.keys(state.commandsByCat);
      if (!cats.includes(state.activeCategory)) state.activeCategory = 'all';

      pills.innerHTML = [
        `<button class="cat-pill ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">All (${data.total})</button>`,
        ...cats.map(
          (c) => `<button class="cat-pill ${state.activeCategory === c ? 'active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)} (${state.commandsByCat[c].length})</button>`
        )
      ].join('');

      pills.querySelectorAll('.cat-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.activeCategory = btn.getAttribute('data-cat') || 'all';
          pills.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          renderCommands();
        });
      });
    }

    renderCommands();
  } catch (err) {
    console.error('Commands error:', err);
  }
}

/* --- Login / Account Page --- */
function showAuthAlert(message, isSuccess = false) {
  const alertEl = document.getElementById('authAlert');
  if (!alertEl) return;
  if (!message) {
    alertEl.hidden = true;
    return;
  }
  alertEl.textContent = message;
  alertEl.classList.toggle('success', Boolean(isSuccess));
  alertEl.hidden = false;
}

function populateAccountMetrics(p, containerEl) {
  if (!p) return;
  setMetric(document.getElementById('accWallet'), p.wallet, (v) => formatNumber(v));
  setMetric(document.getElementById('accBank'), p.bank, (v) => formatNumber(v));
  setMetric(document.getElementById('accTotal'), p.totalWealth, (v) => formatNumber(v));
  setMetric(document.getElementById('accTickets'), p.lotteryTickets, (v) => formatNumber(v));
  if (containerEl) window.ShoreMotion?.observeReveals?.(containerEl);

  const rankEl = document.getElementById('accRank');
  const standingEl = document.getElementById('accStanding');
  const chatsEl = document.getElementById('accChats');
  const phoneEl = document.getElementById('accPhone');
  if (rankEl) rankEl.textContent = p.rank;
  if (standingEl) standingEl.textContent = p.standing ? `#${p.standing.position} of ${p.standing.total}` : '--';
  if (chatsEl) chatsEl.textContent = formatNumber(p.messagesCount);
  if (phoneEl) phoneEl.textContent = p.phone || 'Verified';

  const nextEl = document.getElementById('accNextRank');
  if (nextEl) {
    nextEl.textContent = p.nextTier
      ? `Next Rank: ${p.nextTier.title} (${formatNumber(p.nextTier.remaining)} ♦ more needed)`
      : 'Maximum Rank Achieved!';
  }

  const rId = document.getElementById('accLotteryRound');
  const rSlot = document.getElementById('accLotterySlot');
  const rFill = document.getElementById('accLotteryFilled');
  if (rId) rId.textContent = `#${p.lottery.roundId}`;
  if (rSlot) rSlot.textContent = p.lottery.userSlot ? `Slot #${p.lottery.userSlot}` : 'Not Entered Yet';
  if (rFill) rFill.textContent = `${p.lottery.totalSlots} / ${p.lottery.maxSlots}`;
}

function renderAuthPage() {
  const authSec = document.getElementById('authSection');
  const accSec = document.getElementById('accountSection');
  if (!authSec || !accSec) return;

  const p = state.authProfile;
  if (!p) {
    authSec.hidden = false;
    accSec.hidden = true;
    return;
  }

  authSec.hidden = true;
  accSec.hidden = false;

  document.getElementById('accName').textContent = p.name;
  document.getElementById('accBio').textContent = p.bio;
  populateAccountMetrics(p, accSec);
}

/* --- Profile & WhatsApp Business Appearance Page --- */
const PRESET_CLASSES = ['preset-aurora', 'preset-ruby', 'preset-shrine', 'preset-amber', 'preset-void'];
const profileDraft = {
  editing: false,
  preset: 'aurora',
  avatarDataUrl: undefined,
  bannerDataUrl: undefined,
  clearAvatar: false,
  clearBanner: false
};

function showEditAlert(message, isSuccess = false) {
  const alertEl = document.getElementById('editAlert');
  if (!alertEl) return;
  if (!message) {
    alertEl.hidden = true;
    return;
  }
  alertEl.textContent = message;
  alertEl.classList.toggle('success', Boolean(isSuccess));
  alertEl.hidden = false;
}

/**
 * Center-crop and compress a gallery image file onto a Canvas before uploading.
 */
async function compressGalleryImage(file, { width, height, quality = 0.86 }) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image from your gallery.');
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read the selected photo.'));
      el.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable on this browser.');

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const targetRatio = width / height;
    const srcRatio = srcW / srcH;

    let cropW = srcW;
    let cropH = srcH;
    let cropX = 0;
    let cropY = 0;

    if (srcRatio > targetRatio) {
      cropW = Math.round(srcH * targetRatio);
      cropX = Math.round((srcW - cropW) / 2);
    } else if (srcRatio < targetRatio) {
      cropH = Math.round(srcW / targetRatio);
      cropY = Math.round((srcH - cropH) / 2);
    }

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function applyBannerVisual(presetName, bannerUrl) {
  const box = document.getElementById('profBannerBox');
  const img = document.getElementById('profBannerImg');
  if (box) {
    box.classList.remove(...PRESET_CLASSES);
    box.classList.add(`preset-${presetName || 'aurora'}`);
  }
  if (img) {
    if (bannerUrl) {
      img.src = bannerUrl;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
  }
  document.querySelectorAll('#presetSwatches .swatch-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === presetName && !bannerUrl);
  });
}

function renderProfilePage() {
  const guestSec = document.getElementById('profileGuestSection');
  const mainSec = document.getElementById('profileMainSection');
  if (!guestSec || !mainSec) return;

  const p = state.authProfile;
  if (!p) {
    guestSec.hidden = false;
    mainSec.hidden = true;
    window.ShoreMotion?.observeReveals?.(guestSec);
    return;
  }

  guestSec.hidden = true;
  mainSec.hidden = false;

  const avatarSrc = (!profileDraft.editing && p.avatarUrl) || (profileDraft.avatarDataUrl) || (profileDraft.clearAvatar ? '/assets/menu.jpg' : p.avatarUrl) || '/assets/menu.jpg';
  const bannerSrc = profileDraft.editing
    ? (profileDraft.bannerDataUrl || (profileDraft.clearBanner ? null : p.bannerUrl))
    : p.bannerUrl;
  const activePreset = profileDraft.editing ? profileDraft.preset : (p.bannerPreset || 'aurora');

  const avImg = document.getElementById('profAvatarImg');
  const edAvImg = document.getElementById('editAvatarPreview');
  if (avImg) avImg.src = avatarSrc;
  if (edAvImg) edAvImg.src = avatarSrc;

  applyBannerVisual(activePreset, bannerSrc);

  document.getElementById('profName').textContent = p.name;
  document.getElementById('profTitle').textContent = p.title || 'Black Shores Traveler';
  document.getElementById('profRank').textContent = p.rank;
  const standingStr = p.standing ? `Standing #${p.standing.position} of ${p.standing.total}` : 'Black Shores';
  document.getElementById('profMeta').textContent = `${p.phone || 'Verified'}  •  ${standingStr}`;
  document.getElementById('profBio').textContent = p.bio || 'Guided by the Black Shores.';

  if (!profileDraft.editing) {
    profileDraft.preset = p.bannerPreset || 'aurora';
    const nameInput = document.getElementById('editNameInput');
    const titleInput = document.getElementById('editTitleInput');
    const bioInput = document.getElementById('editBioInput');
    const bioCount = document.getElementById('editBioCount');
    if (nameInput) nameInput.value = p.name || '';
    if (titleInput) titleInput.value = p.title || '';
    if (bioInput) {
      bioInput.value = p.bio || '';
      if (bioCount) bioCount.textContent = `${bioInput.value.length} / 140`;
    }
  }

  populateAccountMetrics(p, mainSec);
  loadProfileShowcaseDeck();
}

async function loadProfileShowcaseDeck() {
  const grid = document.getElementById('profDeckGrid');
  if (!grid || !state.authProfile) return;
  try {
    const data = await fetchJson('/api/cards/me');
    const deck = data.deck || [];
    if (!deck.length) {
      grid.innerHTML = '<div class="empty-note">No cards pinned yet. Visit <a href="/cards" style="color:var(--accent)">Anime Cards</a> or run <code>.deck add &lt;uid&gt;</code> on WhatsApp!</div>';
      return;
    }
    grid.innerHTML = deck
      .map((card, i) => {
        const rawUrl = String(card.img || '');
        const thumbUrl = card.webp || (rawUrl.toLowerCase().endsWith('.webm') ? '' : rawUrl);
        const media = rawUrl.toLowerCase().endsWith('.webm') && !card.webp
          ? `<video class="deck-slot-img" src="${escapeHtml(rawUrl)}" autoplay loop muted playsinline preload="metadata"></video>`
          : `<img class="deck-slot-img" src="${escapeHtml(thumbUrl || rawUrl)}" alt="${escapeHtml(card.name)}" loading="lazy" referrerpolicy="no-referrer" />`;
        return `
          <div class="deck-slot filled tier-${escapeHtml(card.tier)}">
            ${media}
            <div class="deck-slot-overlay">
              <span class="deck-slot-num">#${i + 1} • ${escapeHtml(card.tier === 'S' ? 'S' : `T${card.tier}`)}</span>
            </div>
            <div class="deck-slot-name">${escapeHtml(card.name)}</div>
          </div>
        `;
      })
      .join('');
  } catch {
    grid.innerHTML = '<div class="empty-note">Showcase Deck offline right now.</div>';
  }
}

function setupProfilePage() {
  const editPanel = document.getElementById('profileEditPanel');
  const toggleBtn = document.getElementById('toggleEditBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const saveBtn = document.getElementById('saveProfileBtn');
  const logoutBtn = document.getElementById('profileLogoutBtn');

  const quickAvatarBtn = document.getElementById('quickAvatarBtn');
  const quickBannerBtn = document.getElementById('quickBannerBtn');
  const editAvatarBtn = document.getElementById('editAvatarBtn');
  const editBannerBtn = document.getElementById('editBannerBtn');
  const resetAvatarBtn = document.getElementById('resetAvatarBtn');
  const resetBannerBtn = document.getElementById('resetBannerBtn');

  const avatarInput = document.getElementById('quickAvatarInput');
  const bannerInput = document.getElementById('quickBannerInput');
  const bioInput = document.getElementById('editBioInput');
  const bioCount = document.getElementById('editBioCount');

  function openEditor() {
    const p = state.authProfile;
    if (!p || !editPanel) return;
    profileDraft.editing = true;
    profileDraft.preset = p.bannerPreset || 'aurora';
    profileDraft.avatarDataUrl = undefined;
    profileDraft.bannerDataUrl = undefined;
    profileDraft.clearAvatar = false;
    profileDraft.clearBanner = false;
    showEditAlert('');
    renderProfilePage();
    editPanel.hidden = false;
    editPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeEditor() {
    if (!editPanel) return;
    profileDraft.editing = false;
    profileDraft.avatarDataUrl = undefined;
    profileDraft.bannerDataUrl = undefined;
    profileDraft.clearAvatar = false;
    profileDraft.clearBanner = false;
    showEditAlert('');
    editPanel.hidden = true;
    renderProfilePage();
  }

  toggleBtn?.addEventListener('click', () => {
    if (editPanel?.hidden) openEditor();
    else closeEditor();
  });
  cancelBtn?.addEventListener('click', closeEditor);

  bioInput?.addEventListener('input', () => {
    if (bioCount) bioCount.textContent = `${bioInput.value.length} / 140`;
  });

  quickAvatarBtn?.addEventListener('click', () => {
    if (!avatarInput) return;
    avatarInput.dataset.mode = 'quick';
    avatarInput.click();
  });
  editAvatarBtn?.addEventListener('click', () => {
    if (!avatarInput) return;
    avatarInput.dataset.mode = 'draft';
    avatarInput.click();
  });

  quickBannerBtn?.addEventListener('click', () => {
    if (!bannerInput) return;
    bannerInput.dataset.mode = 'quick';
    bannerInput.click();
  });
  editBannerBtn?.addEventListener('click', () => {
    if (!bannerInput) return;
    bannerInput.dataset.mode = 'draft';
    bannerInput.click();
  });

  avatarInput?.addEventListener('change', async () => {
    const file = avatarInput.files?.[0];
    const mode = avatarInput.dataset.mode || 'quick';
    avatarInput.value = '';
    if (!file) return;

    try {
      showEditAlert('');
      const dataUrl = await compressGalleryImage(file, { width: 420, height: 420, quality: 0.88 });
      if (mode === 'quick') {
        showToast('Uploading profile photo...');
        const res = await fetchJson('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarDataUrl: dataUrl })
        });
        state.authProfile = res.profile;
        updateNavAuthUi(res.profile);
        renderProfilePage();
        showToast('Profile picture updated & synced to bot!');
      } else {
        profileDraft.avatarDataUrl = dataUrl;
        profileDraft.clearAvatar = false;
        renderProfilePage();
      }
    } catch (err) {
      showEditAlert(err.message);
      showToast(err.message);
    }
  });

  bannerInput?.addEventListener('change', async () => {
    const file = bannerInput.files?.[0];
    const mode = bannerInput.dataset.mode || 'quick';
    bannerInput.value = '';
    if (!file) return;

    try {
      showEditAlert('');
      const dataUrl = await compressGalleryImage(file, { width: 1200, height: 440, quality: 0.84 });
      if (mode === 'quick') {
        showToast('Uploading cover background...');
        const res = await fetchJson('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerDataUrl: dataUrl })
        });
        state.authProfile = res.profile;
        renderProfilePage();
        showToast('Background cover updated & synced to bot!');
      } else {
        profileDraft.bannerDataUrl = dataUrl;
        profileDraft.clearBanner = false;
        renderProfilePage();
      }
    } catch (err) {
      showEditAlert(err.message);
      showToast(err.message);
    }
  });

  resetAvatarBtn?.addEventListener('click', () => {
    profileDraft.avatarDataUrl = undefined;
    profileDraft.clearAvatar = true;
    renderProfilePage();
  });

  resetBannerBtn?.addEventListener('click', () => {
    profileDraft.bannerDataUrl = undefined;
    profileDraft.clearBanner = true;
    renderProfilePage();
  });

  document.querySelectorAll('#presetSwatches .swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset') || 'aurora';
      profileDraft.preset = preset;
      profileDraft.bannerDataUrl = undefined;
      profileDraft.clearBanner = true;
      renderProfilePage();
    });
  });

  editPanel?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showEditAlert('');
    const nameVal = (document.getElementById('editNameInput')?.value || '').trim();
    const titleVal = (document.getElementById('editTitleInput')?.value || '').trim();
    const bioVal = (document.getElementById('editBioInput')?.value || '').trim();

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const payload = {
        name: nameVal,
        title: titleVal,
        bio: bioVal,
        bannerPreset: profileDraft.preset
      };
      if (profileDraft.avatarDataUrl) payload.avatarDataUrl = profileDraft.avatarDataUrl;
      else if (profileDraft.clearAvatar) payload.clearAvatar = true;

      if (profileDraft.bannerDataUrl) payload.bannerDataUrl = profileDraft.bannerDataUrl;
      else if (profileDraft.clearBanner) payload.clearBanner = true;

      const res = await fetchJson('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      state.authProfile = res.profile;
      updateNavAuthUi(res.profile);
      closeEditor();
      showToast('Profile saved & synced to WhatsApp .profile!');
    } catch (err) {
      showEditAlert(err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Sync Profile';
      }
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await fetchJson('/api/auth/logout', { method: 'POST' }).catch(() => {});
    state.authProfile = null;
    updateNavAuthUi(null);
    closeEditor();
    showToast('Session unlinked.');
  });
}

function setupLoginHandlers() {
  const phoneForm = document.getElementById('phoneForm');
  const otpForm = document.getElementById('otpForm');
  const phoneInput = document.getElementById('phoneInput');
  const otpInput = document.getElementById('otpInput');
  const sendBtn = document.getElementById('sendOtpBtn');
  const verifyBtn = document.getElementById('verifyOtpBtn');
  const changeBtn = document.getElementById('changePhoneBtn');
  const resendBtn = document.getElementById('resendOtpBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  async function doRequestOtp() {
    const phone = (phoneInput?.value || state.pendingPhone || '').trim();
    if (!phone) return;
    showAuthAlert('');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending OTP...';
    if (resendBtn) resendBtn.disabled = true;

    try {
      const res = await fetchJson('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      state.pendingPhone = res.digits;
      phoneForm.hidden = true;
      otpForm.hidden = false;
      document.getElementById('otpSentNote').textContent = `6-digit OTP sent to ${res.maskedPhone} on WhatsApp DM!`;
      showAuthAlert('Check your WhatsApp DM from Shorekeeper and enter the code below.', true);
      otpInput?.focus();
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send OTP via WhatsApp DM';
      if (resendBtn) resendBtn.disabled = false;
    }
  }

  phoneForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await doRequestOtp();
  });

  resendBtn?.addEventListener('click', async () => {
    await doRequestOtp();
  });

  changeBtn?.addEventListener('click', () => {
    otpForm.hidden = true;
    phoneForm.hidden = false;
    showAuthAlert('');
  });

  otpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = (otpInput?.value || '').trim();
    const phone = state.pendingPhone || (phoneInput?.value || '').trim();
    if (!otp || !phone) return;

    showAuthAlert('');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
      const res = await fetchJson('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      state.authProfile = res.profile;
      updateNavAuthUi(res.profile);
      window.location.href = '/profile';
      return;
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify & Link Account';
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await fetchJson('/api/auth/logout', { method: 'POST' }).catch(() => {});
    state.authProfile = null;
    updateNavAuthUi(null);
    showAuthAlert('Your website session has been unlinked.', true);
    renderAuthPage();
  });
}

function setupCommonUi() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('navLinks');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
  }
}

async function init() {
  setupCommonUi();
  await Promise.all([loadOverview(), loadAuthSession()]);
  setInterval(loadOverview, 15000);

  if (state.page === 'leaderboard') {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.lbMode = btn.getAttribute('data-lb') || 'rich';
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderLeaderboard();
      });
    });
    await loadLeaderboards();
    setInterval(loadLeaderboards, 15000);
  }

  if (state.page === 'lottery') {
    await loadLottery();
    setInterval(loadLottery, 15000);
    setInterval(() => {
      const el = document.getElementById('lotteryTimer');
      if (el && state.lotteryEndAt) {
        el.textContent = formatCountdown(Math.max(0, state.lotteryEndAt - Date.now()));
      }
    }, 1000);
  }

  if (state.page === 'commands') {
    const search = document.getElementById('cmdSearch');
    if (search) {
      search.addEventListener('input', (e) => {
        state.searchQuery = e.target.value || '';
        renderCommands();
      });
    }
    await loadCommands();
  }

  if (state.page === 'login') {
    setupLoginHandlers();
    setInterval(() => {
      if (state.authProfile) loadAuthSession();
    }, 15000);
  }

  if (state.page === 'profile') {
    setupProfilePage();
    setInterval(() => {
      if (state.authProfile && !profileDraft.editing) loadAuthSession();
    }, 15000);
  }
}

init();
