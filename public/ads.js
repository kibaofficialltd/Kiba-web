const adsState = {
  data: null,
  session: null,
  timerId: null,
  adsenseLoadedClient: '',
  tabHiddenMs: 0,
  lastHiddenAt: 0
};

async function fetchAdsJson(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    ...opts
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, data: json };
}

function ensureAdSenseScript(clientId) {
  if (!clientId || adsState.adsenseLoadedClient === clientId) return;
  const existing = document.querySelector(`script[src*="adsbygoogle.js"]`);
  if (existing) {
    adsState.adsenseLoadedClient = clientId;
    return;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
  adsState.adsenseLoadedClient = clientId;
}

function renderAdSenseUnit(tierId) {
  const box = document.getElementById('adsenseSlotBox');
  if (!box) return;

  const cfg = adsState.data?.adsense || {};
  const clientId = cfg.clientId || '';
  const slotId = tierId === '120s' ? (cfg.slot120s || cfg.slot60s) : (cfg.slot60s || cfg.slot120s);

  if (clientId && slotId) {
    ensureAdSenseScript(clientId);
    box.innerHTML =
      `<ins class="adsbygoogle" style="display:block; width:100%; min-height:250px;" data-ad-client="${escapeHtml(clientId)}" data-ad-slot="${escapeHtml(slotId)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
    return;
  }

  if (clientId) {
    ensureAdSenseScript(clientId);
    box.innerHTML =
      `<div class="adsense-placeholder">` +
      `<div class="adsense-tag">Sponsored Showcase</div>` +
      `<p>Keep this page open until the timer completes to claim your Ruby reward.</p>` +
      `</div>`;
    return;
  }

  box.innerHTML =
    `<div class="adsense-placeholder">` +
    `<div class="adsense-tag">Sponsored Showcase</div>` +
    `<p>Keep this page open until the timer completes to claim your Ruby reward.</p>` +
    `</div>`;
}

function formatSecShort(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${String(rem).padStart(2, '0')}s` : `${rem}s`;
}

function renderAdsHud() {
  const d = adsState.data;
  if (!d) return;

  const badge = document.getElementById('adsDailyBadge');
  const walletChip = document.getElementById('adsWalletChip');
  const walletAmt = document.getElementById('adsWalletAmt');
  const authNotice = document.getElementById('adsAuthNotice');
  const watchedEl = document.getElementById('hudWatchedToday');
  const remainEl = document.getElementById('hudRemainingToday');
  const totalRubiesEl = document.getElementById('hudTotalAdRubies');
  const resetEl = document.getElementById('hudResetTimer');

  if (badge) badge.textContent = `${d.watchedToday || 0} / ${d.dailyLimit || 10} Today`;
  if (watchedEl) watchedEl.textContent = `${d.watchedToday || 0} / ${d.dailyLimit || 10}`;
  if (remainEl) remainEl.textContent = `${d.remainingToday ?? 10}`;
  if (totalRubiesEl) totalRubiesEl.textContent = formatNumber(d.totalRubiesEarned || 0);
  if (resetEl) resetEl.textContent = formatCountdown((d.resetInSeconds || 0) * 1000);

  if (d.authenticated) {
    if (authNotice) authNotice.hidden = true;
    if (walletChip) walletChip.hidden = false;
    if (walletAmt) walletAmt.textContent = `${formatNumber(d.wallet || 0)} ♦`;
  } else {
    if (authNotice) authNotice.hidden = false;
    if (walletChip) walletChip.hidden = true;
  }

  const limitReached = d.authenticated && (d.remainingToday ?? 0) <= 0;
  const activeRunning = Boolean(adsState.session);

  for (const id of ['btnStart60s', 'btnStart120s']) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.disabled = !d.authenticated || limitReached || activeRunning;
    if (limitReached) {
      btn.textContent = '🚫 Daily Limit Reached (10/10)';
    } else if (id === 'btnStart60s') {
      btn.textContent = '▶ Watch 60s Ad (+10,000 ♦)';
    } else {
      btn.textContent = '▶ Watch 2m Ad (+30,000 ♦)';
    }
  }

  if (d.adsense?.configured) {
    ensureAdSenseScript(d.adsense.clientId);
  }
}

function stopWatchTimer() {
  if (adsState.timerId) {
    clearInterval(adsState.timerId);
    adsState.timerId = null;
  }
}

function updateStageProgress() {
  const sess = adsState.session;
  const stage = document.getElementById('adWatchStage');
  const countdownEl = document.getElementById('adCountdownNum');
  const fillEl = document.getElementById('adProgressFill');
  const claimBtn = document.getElementById('btnClaimAdReward');
  const statusEl = document.getElementById('adStageStatusText');

  if (!sess || !stage) return;

  const totalMs = sess.requiredSec * 1000;
  const elapsedMs = Math.max(0, Date.now() - sess.startedAt);
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const pct = Math.min(100, (elapsedMs / totalMs) * 100);

  if (countdownEl) countdownEl.textContent = formatSecShort(remainingMs / 1000);
  if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;

  if (remainingMs <= 0) {
    if (countdownEl) countdownEl.textContent = '0s';
    if (statusEl) statusEl.textContent = '🎉 Ad timer complete! Click Claim below to receive your Rubies.';
    if (claimBtn) {
      claimBtn.disabled = false;
      claimBtn.textContent = `🎁 Claim +${formatNumber(sess.rewardRubies)} ♦ Rubies`;
    }
    stopWatchTimer();
  } else if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.textContent = `⏳ Watching Ad... (${formatSecShort(remainingMs / 1000)} left)`;
  }
}

function openWatchStage(session, renderUnit = true) {
  adsState.session = session;
  const stage = document.getElementById('adWatchStage');
  const tierLabel = document.getElementById('adStageTierLabel');
  const rewardLabel = document.getElementById('adStageRewardLabel');

  if (tierLabel) tierLabel.textContent = `⏱️ ${session.title}`;
  if (rewardLabel) rewardLabel.textContent = `Reward: +${formatNumber(session.rewardRubies)} ♦ Rubies`;
  if (stage) stage.hidden = false;

  if (renderUnit) {
    renderAdSenseUnit(session.tier);
  }

  renderAdsHud();
  stopWatchTimer();
  updateStageProgress();
  adsState.timerId = setInterval(updateStageProgress, 500);
  stage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeWatchStage() {
  stopWatchTimer();
  adsState.session = null;
  const stage = document.getElementById('adWatchStage');
  if (stage) stage.hidden = true;
  renderAdsHud();
}

async function startAdWatch(tierId) {
  const { ok, data } = await fetchAdsJson('/api/ads/start', {
    method: 'POST',
    body: JSON.stringify({ tier: tierId })
  });
  if (!ok || !data.success) {
    showToast(data.error || 'Could not start ad session.');
    return;
  }
  showToast(`Started ${data.session.title} — stay ${data.session.requiredSec}s to claim!`);
  openWatchStage(data.session, true);
}

async function claimCurrentAd() {
  const sess = adsState.session;
  if (!sess) return;

  const claimBtn = document.getElementById('btnClaimAdReward');
  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.textContent = 'Crediting Rubies...';
  }

  const { ok, data } = await fetchAdsJson('/api/ads/claim', {
    method: 'POST',
    body: JSON.stringify({ sessionId: sess.sessionId })
  });

  if (!ok || !data.success) {
    showToast(data.error || 'Could not claim reward yet.');
    if (data.tooEarly) {
      updateStageProgress();
      adsState.timerId = setInterval(updateStageProgress, 500);
    }
    return;
  }

  closeWatchStage();
  showToast(`🎉 +${formatNumber(data.rewardRubies)} ♦ Rubies credited! (${data.watchedToday}/${data.dailyLimit} today)`);
  await loadAdsStatus();
}

async function loadAdsStatus() {
  try {
    const { ok, data } = await fetchAdsJson('/api/ads/status');
    if (!ok) return;
    adsState.data = data;
    renderAdsHud();
    if (data.activeSession && !adsState.session) {
      openWatchStage(data.activeSession, true);
    }
  } catch (err) {
    console.error('Ads status error:', err);
  }
}

function setupAdsPage() {
  document.getElementById('btnStart60s')?.addEventListener('click', () => startAdWatch('60s'));
  document.getElementById('btnStart120s')?.addEventListener('click', () => startAdWatch('120s'));
  document.getElementById('btnClaimAdReward')?.addEventListener('click', claimCurrentAd);
  document.getElementById('btnCancelAdWatch')?.addEventListener('click', () => {
    closeWatchStage();
    showToast('Ad watch cancelled.');
  });

  document.addEventListener('visibilitychange', () => {
    const warn = document.getElementById('adFocusWarning');
    if (warn && adsState.session) {
      warn.hidden = !document.hidden;
    }
  });

  loadAdsStatus();
  setInterval(loadAdsStatus, 20000);
}

setupAdsPage();
