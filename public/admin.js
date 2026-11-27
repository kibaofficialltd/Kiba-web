/**
 * Black Shores Admin Portal for Owner & Bot Moderators.
 */
(() => {
  if (document.body?.dataset?.page !== 'admin') return;

  const adminState = {
    overview: null,
    activeTab: 'users',
    userSearch: '',
    userFilter: 'all'
  };

  async function postAdmin(payload) {
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Action failed');
    }
    return data;
  }

  function renderAccessDenied(title, desc, showLogin = true) {
    const gate = document.getElementById('adminAccessGate');
    const workspace = document.getElementById('adminWorkspace');
    const topActions = document.getElementById('adminTopActions');
    const roleBadge = document.getElementById('adminRoleBadge');
    const titleEl = document.getElementById('adminGateTitle');
    const descEl = document.getElementById('adminGateDesc');
    const loginBtn = document.getElementById('adminGateLoginBtn');

    if (workspace) workspace.hidden = true;
    if (topActions) topActions.hidden = true;
    if (gate) gate.hidden = false;
    if (roleBadge) roleBadge.textContent = 'Restricted';
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (loginBtn) loginBtn.hidden = !showLogin;
  }

  function renderStats() {
    const d = adminState.overview;
    if (!d) return;

    const badge = document.getElementById('adminRoleBadge');
    if (badge) {
      badge.textContent = d.actor?.isOwner ? '👑 Owner Access' : '🛡️ Bot Moderator';
    }

    document.getElementById('admStatUsers').textContent = formatNumber(d.stats.registeredUsers);
    document.getElementById('admStatMods').textContent = formatNumber(d.stats.modsCount);
    document.getElementById('admStatRubies').textContent = formatCompact(d.stats.totalRubies);
    document.getElementById('admStatCards').textContent = formatNumber(d.stats.catalogTotal);
    document.getElementById('admStatSpawns').textContent = formatNumber(d.stats.activeSpawns);
    document.getElementById('admStatCmds').textContent = formatNumber(d.stats.commandsTotal);
    document.getElementById('admStatBanned').textContent = formatNumber(d.stats.bannedCount);

    const isOwner = Boolean(d.actor?.isOwner);
    document.querySelectorAll('.owner-only-card').forEach((el) => {
      el.hidden = !isOwner;
    });
  }

  function renderUsers() {
    const container = document.getElementById('adminUsersList');
    const d = adminState.overview;
    if (!container || !d) return;

    const q = adminState.userSearch.trim().toLowerCase();
    const filter = adminState.userFilter;

    const filtered = (d.users || []).filter((u) => {
      if (filter === 'mod' && !u.isMod && !u.isOwner) return false;
      if (filter === 'banned' && !u.banned) return false;
      if (filter === 'afk' && !u.afk) return false;
      if (q) {
        const hay = `${u.name} ${u.key} ${u.maskedPhone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-note">No travelers match your current filter.</div>';
      return;
    }

    const actorIsOwner = Boolean(d.actor?.isOwner);

    container.innerHTML = filtered
      .map((u) => {
        const roleTag = u.isOwner
          ? '<span class="adm-pill adm-owner">👑 Owner</span>'
          : u.isMod
            ? '<span class="adm-pill adm-mod">🛡️ Bot Mod</span>'
            : '<span class="adm-pill">👤 Traveler</span>';
        const banTag = u.banned ? '<span class="adm-pill adm-banned">🚫 Banned</span>' : '';
        const afkTag = u.afk ? '<span class="adm-pill adm-afk">🌙 AFK</span>' : '';

        const canBan = !u.isOwner && (actorIsOwner || !u.isMod);
        const modBtn = actorIsOwner && !u.isOwner
          ? `<button type="button" class="btn btn-sm-ghost adm-act-mod" data-key="${escapeHtml(u.key)}" data-next="${u.isMod ? '0' : '1'}">${u.isMod ? 'Remove Mod' : 'Make Mod'}</button>`
          : '';
        const rubyBtn = actorIsOwner
          ? `<button type="button" class="btn btn-sm-ghost adm-act-ruby" data-key="${escapeHtml(u.key)}" data-name="${escapeHtml(u.name)}" data-wallet="${u.wallet}">💎 Edit Rubies</button>`
          : '';
        const banBtn = canBan
          ? `<button type="button" class="btn btn-sm-ghost ${u.banned ? '' : 'btn-danger-ghost'} adm-act-ban" data-key="${escapeHtml(u.key)}" data-next="${u.banned ? '0' : '1'}">${u.banned ? 'Unban' : 'Ban'}</button>`
          : '';

        return `
          <div class="panel-card admin-row">
            <div class="admin-row-info">
              <div class="admin-row-title">
                <strong>${escapeHtml(u.name)}</strong>
                ${roleTag}${banTag}${afkTag}
              </div>
              <div class="admin-row-meta">
                <span>📱 ${escapeHtml(u.maskedPhone || u.key)}</span>
                <span>💎 Wallet: <strong>${formatNumber(u.wallet)}</strong></span>
                <span>🏦 Bank: <strong>${formatNumber(u.bank)}</strong></span>
                <span>🃏 Cards: <strong>${formatNumber(u.cardsOwned)}</strong></span>
                <span>🎬 Ads: <strong>${u.adsWatchedToday}/10</strong></span>
              </div>
            </div>
            <div class="admin-row-actions">
              ${rubyBtn}
              ${modBtn}
              ${banBtn}
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.adm-act-ban').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-key');
        const enabled = btn.getAttribute('data-next') === '1';
        btn.disabled = true;
        try {
          const res = await postAdmin({ action: 'ban', targetKey: key, enabled });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.adm-act-mod').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-key');
        const enabled = btn.getAttribute('data-next') === '1';
        btn.disabled = true;
        try {
          const res = await postAdmin({ action: 'mod', targetKey: key, enabled });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.adm-act-ruby').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-key');
        const name = btn.getAttribute('data-name');
        const wallet = Number(btn.getAttribute('data-wallet') || 0);
        const input = window.prompt(
          `Add/Remove Rubies for ${name} (current wallet: ${formatNumber(wallet)} ♦).\nEnter a positive number to add or negative number to deduct (e.g. 50000 or -5000):`,
          '10000'
        );
        if (input === null) return;
        const amount = parseInt(input.trim(), 10);
        if (isNaN(amount) || amount === 0) {
          showToast('Cancelled — invalid Ruby amount.');
          return;
        }
        try {
          const res = await postAdmin({ action: 'rubies', targetKey: key, mode: 'add', amount });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  function renderGroups() {
    const container = document.getElementById('adminGroupsList');
    const d = adminState.overview;
    if (!container || !d) return;

    if (!d.groups?.length) {
      container.innerHTML = '<div class="empty-note">No WhatsApp groups recorded yet.</div>';
      return;
    }

    const actorIsOwner = Boolean(d.actor?.isOwner);

    container.innerHTML = d.groups
      .map((g) => {
        const gamblePill =
          g.gambleState === 'on' || g.gambleState === 'default'
            ? `<span class="adm-pill adm-mod">🎰 Gamble: ${g.gambleState === 'default' ? 'Default' : 'ON'}</span>`
            : `<span class="adm-pill">${g.gambleState === 'off' ? '🚫 Gamble OFF' : '🔒 Gamble Locked'}</span>`;
        const spawnPill = g.spawnsEnabled
          ? '<span class="adm-pill adm-owner">🃏 Spawns ON</span>'
          : '<span class="adm-pill adm-banned">🃏 Spawns OFF</span>';

        const gambleBtn = actorIsOwner
          ? `<button type="button" class="btn btn-sm-ghost adm-grp-gamble" data-gid="${escapeHtml(g.jid)}" data-mode="${g.gambleState === 'on' ? 'off' : 'on'}">${g.gambleState === 'on' ? 'Turn Gamble OFF' : 'Turn Gamble ON'}</button>`
          : '';
        const rainBtn = actorIsOwner
          ? `<button type="button" class="btn btn-sm-ghost adm-grp-rain" data-gid="${escapeHtml(g.jid)}">🌧️ Ruby Rain</button>`
          : '';

        return `
          <div class="panel-card admin-row">
            <div class="admin-row-info">
              <div class="admin-row-title">
                <strong>${escapeHtml(g.name)}</strong>
                ${spawnPill}${gamblePill}
              </div>
              <div class="admin-row-meta">
                <code>${escapeHtml(g.jid)}</code>
                <span>Welcome: ${g.welcome ? 'ON' : 'OFF'}</span>
                <span>AntiLink: ${g.antilink ? 'ON' : 'OFF'}</span>
              </div>
            </div>
            <div class="admin-row-actions">
              <button type="button" class="btn btn-sm-ghost adm-grp-spawn-now" data-gid="${escapeHtml(g.jid)}">🃏 Spawn Card Now</button>
              <button type="button" class="btn btn-sm-ghost adm-grp-spawns" data-gid="${escapeHtml(g.jid)}" data-next="${g.spawnsEnabled ? '0' : '1'}">${g.spawnsEnabled ? 'Disable Spawns' : 'Enable Spawns'}</button>
              ${gambleBtn}
              ${rainBtn}
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.adm-grp-spawns').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await postAdmin({
            action: 'groupSpawns',
            groupJid: btn.getAttribute('data-gid'),
            enabled: btn.getAttribute('data-next') === '1'
          });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.adm-grp-gamble').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await postAdmin({
            action: 'groupGamble',
            groupJid: btn.getAttribute('data-gid'),
            mode: btn.getAttribute('data-mode')
          });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.adm-grp-spawn-now').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await postAdmin({ action: 'triggerSpawn', groupJid: btn.getAttribute('data-gid') });
          showToast(res.message);
          await loadAdminOverview();
        } catch (err) {
          showToast(err.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.adm-grp-rain').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await postAdmin({ action: 'triggerRubyRain', groupJid: btn.getAttribute('data-gid') });
          showToast(res.message);
        } catch (err) {
          showToast(err.message);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  async function loadAdminOverview() {
    try {
      const res = await fetch('/api/admin/overview', { credentials: 'same-origin', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          renderAccessDenied('WhatsApp Login Required', 'Sign in with your Owner or Bot Moderator WhatsApp number to access the Admin Portal.', true);
        } else {
          renderAccessDenied('Access Restricted', data.error || 'Only the Owner and Bot Moderators can view the Admin Portal.', false);
        }
        return;
      }

      adminState.overview = data;
      document.getElementById('adminAccessGate').hidden = true;
      document.getElementById('adminWorkspace').hidden = false;
      document.getElementById('adminTopActions').hidden = false;

      renderStats();
      renderUsers();
      renderGroups();
    } catch (err) {
      renderAccessDenied('Portal Offline', err.message || 'Could not reach the Shorekeeper Admin API.', false);
    }
  }

  function setupAdminPage() {
    document.querySelectorAll('[data-atab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-atab') || 'users';
        adminState.activeTab = tab;
        document.querySelectorAll('[data-atab]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('admTabUsers').hidden = tab !== 'users';
        document.getElementById('admTabGroups').hidden = tab !== 'groups';
        document.getElementById('admTabSystem').hidden = tab !== 'system';
      });
    });

    document.getElementById('adminUserSearch')?.addEventListener('input', (e) => {
      adminState.userSearch = e.target.value || '';
      renderUsers();
    });
    document.getElementById('adminUserFilter')?.addEventListener('change', (e) => {
      adminState.userFilter = e.target.value || 'all';
      renderUsers();
    });
    document.getElementById('btnAdminRefresh')?.addEventListener('click', loadAdminOverview);

    document.getElementById('btnReloadCatalog')?.addEventListener('click', async () => {
      try {
        const res = await postAdmin({ action: 'reloadCatalog' });
        showToast(res.message);
        await loadAdminOverview();
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('btnGlobalRubyRain')?.addEventListener('click', async () => {
      try {
        const res = await postAdmin({ action: 'triggerRubyRain', groupJid: 'all' });
        showToast(res.message);
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('btnForceLotteryDraw')?.addEventListener('click', async () => {
      try {
        const res = await postAdmin({ action: 'drawLottery' });
        showToast(res.message);
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('btnReloadCommands')?.addEventListener('click', async () => {
      try {
        const res = await postAdmin({ action: 'reloadCommands' });
        showToast(res.message);
        await loadAdminOverview();
      } catch (err) {
        showToast(err.message);
      }
    });

    loadAdminOverview();
  }

  setupAdminPage();
})();
