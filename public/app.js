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
    if (navBtn) navBtn.textContent = label;
    if (navMenu) navMenu.textContent = label;
  } else {
    if (navBtn) navBtn.textContent = 'Login / Link';
    if (navMenu) navMenu.textContent = 'Login / Link';
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
    for (const id of ['heroChatBtn', 'cardBotWaBtn']) {
      const el = document.getElementById(id);
      if (el) el.href = waUrl;
    }

    if (state.page === 'home') {
      const usersEl = document.getElementById('statUsers');
      const rubiesEl = document.getElementById('statRubies');
      const lotteryEl = document.getElementById('statLottery');
      const cmdsEl = document.getElementById('statCommands');

      if (usersEl) usersEl.textContent = formatNumber(data.stats.registeredUsers);
      if (rubiesEl) rubiesEl.textContent = formatCompact(data.stats.totalRubies);
      if (lotteryEl) lotteryEl.textContent = `#${data.stats.lotteryRound}`;
      if (cmdsEl) cmdsEl.textContent = `${data.stats.totalCommands}`;

      const groupBtn = document.getElementById('cardGroupBtn');
      const groupDesc = document.getElementById('groupCardDesc');
      if (groupBtn && data.links.groupInviteUrl) {
        groupBtn.href = data.links.groupInviteUrl;
        groupBtn.textContent = 'Join WhatsApp Group';
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
  document.getElementById('accWallet').textContent = formatNumber(p.wallet);
  document.getElementById('accBank').textContent = formatNumber(p.bank);
  document.getElementById('accTotal').textContent = formatNumber(p.totalWealth);
  document.getElementById('accTickets').textContent = formatNumber(p.lotteryTickets);

  document.getElementById('accRank').textContent = p.rank;
  document.getElementById('accStanding').textContent = p.standing ? `#${p.standing.position} of ${p.standing.total}` : '--';
  document.getElementById('accChats').textContent = formatNumber(p.messagesCount);
  document.getElementById('accPhone').textContent = p.phone || 'Verified';

  const nextEl = document.getElementById('accNextRank');
  if (nextEl) {
    nextEl.textContent = p.nextTier
      ? `Next Rank: ${p.nextTier.title} (${formatNumber(p.nextTier.remaining)} ♦ more needed)`
      : 'Maximum Rank Achieved!';
  }

  document.getElementById('accLotteryRound').textContent = `#${p.lottery.roundId}`;
  document.getElementById('accLotterySlot').textContent = p.lottery.userSlot ? `Slot #${p.lottery.userSlot}` : 'Not Entered Yet';
  document.getElementById('accLotteryFilled').textContent = `${p.lottery.totalSlots} / ${p.lottery.maxSlots}`;
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
      renderAuthPage();
      otpForm.hidden = true;
      phoneForm.hidden = false;
      if (otpInput) otpInput.value = '';
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
}

init();
