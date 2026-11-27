/**
 * Black Shores Anime Cards Portal (Catalog, Gacha Packs, Collection/Deck, Market).
 */
(() => {
  if (document.body?.dataset?.page !== 'cards') return;

  const TIER_KEYS = ['all', 'S', '6', '5', '4', '3', '2', '1'];

  const cardsState = {
    activeTab: 'catalog',
    catalogQuery: '',
    catalogTier: 'all',
    catalogEventOnly: false,
    catalogPage: 1,
    catalogTotalPages: 1,
    catalogData: null,

    colQuery: '',
    colTier: 'all',
    meData: null,

    marketQuery: '',
    marketTier: 'all',
    marketItems: []
  };

  let searchTimer = null;

  function renderCardMediaHtml(card, cls = 'anime-card-img') {
    const rawUrl = String(card.img || '');
    const thumbUrl = card.webp || (rawUrl.toLowerCase().endsWith('.webm') ? '' : rawUrl);

    if (rawUrl.toLowerCase().endsWith('.webm') && !card.webp) {
      return `<video class="${cls}" src="${escapeHtml(rawUrl)}" autoplay loop muted playsinline preload="metadata"></video>`;
    }
    return `<img class="${cls}" src="${escapeHtml(thumbUrl || rawUrl)}" alt="${escapeHtml(card.name)}" loading="lazy" referrerpolicy="no-referrer" />`;
  }

  function openCardModal(card) {
    const modal = document.getElementById('cardModal');
    const body = document.getElementById('cardModalBody');
    if (!modal || !body || !card) return;

    const rawUrl = String(card.img || '');
    const mediaHtml = rawUrl.toLowerCase().endsWith('.webm')
      ? `<video class="card-modal-media" src="${escapeHtml(rawUrl)}" autoplay loop muted playsinline controls></video>`
      : `<img class="card-modal-media" src="${escapeHtml(rawUrl)}" alt="${escapeHtml(card.name)}" referrerpolicy="no-referrer" />`;

    body.innerHTML = `
      <div class="card-modal-grid">
        <div class="card-modal-art">${mediaHtml}</div>
        <div class="card-modal-info">
          <span class="tier-pill-badge" style="border-color:${escapeHtml(card.tierColor || '#4effff')}; color:${escapeHtml(card.tierColor || '#4effff')};">${escapeHtml(card.tierLabel || card.tierBadge || 'Card')}</span>
          <h2 style="margin:10px 0 6px;">${escapeHtml(card.name)}</h2>
          <p class="subpage-desc" style="margin-bottom:16px;">${escapeHtml(card.series || 'Unknown Series')}</p>
          <div class="lb-list">
            ${card.uid ? `<div class="lb-row"><span>🆔 Owned UID</span><strong>#${escapeHtml(card.uid)}</strong></div>` : ''}
            ${card.event ? `<div class="lb-row"><span>🎉 Event</span><strong>${escapeHtml(card.event)}</strong></div>` : ''}
            <div class="lb-row"><span>🔥 Burn Value</span><strong style="color:var(--ruby)">${formatNumber(card.burnValue || 250)} ♦</strong></div>
            <div class="lb-row"><span>🧬 Catalog ID</span><code style="font-size:0.78rem;">${escapeHtml(card.cardId || card.id)}</code></div>
          </div>
          <p class="field-hint" style="margin-top:14px;">Use <code>.cardinfo ${escapeHtml(card.uid ? `#${card.uid}` : card.name)}</code> on WhatsApp to send this card in chat!</p>
        </div>
      </div>
    `;
    modal.hidden = false;
  }

  function updateWalletBanner(wallet) {
    const chip = document.getElementById('cardsWalletChip');
    const amt = document.getElementById('cardsWalletAmt');
    if (!chip || !amt) return;
    if (typeof wallet === 'number' && state.authProfile) {
      chip.hidden = false;
      amt.textContent = `${formatNumber(wallet)} ♦`;
    } else if (state.authProfile) {
      chip.hidden = false;
      amt.textContent = `${formatNumber(state.authProfile.wallet)} ♦`;
    } else {
      chip.hidden = true;
    }
  }

  function renderTierPills(containerId, activeTier, countsMap, onPick) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = TIER_KEYS.map((t) => {
      const label = t === 'all' ? 'All' : t === 'S' ? '💠 Tier S' : `Tier ${t}`;
      const countStr = countsMap && t !== 'all' && countsMap[t] !== undefined ? ` (${formatNumber(countsMap[t])})` : '';
      return `<button type="button" class="cat-pill ${activeTier === t ? 'active' : ''}" data-tier="${t}">${label}${countStr}</button>`;
    }).join('');

    el.querySelectorAll('.cat-pill').forEach((btn) => {
      btn.addEventListener('click', () => onPick(btn.getAttribute('data-tier') || 'all'));
    });
  }

  /* --- Tab 1: Catalog --- */
  async function loadCatalog() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    const params = new URLSearchParams({
      q: cardsState.catalogQuery,
      tier: cardsState.catalogTier,
      event: cardsState.catalogEventOnly ? '1' : '0',
      page: String(cardsState.catalogPage),
      limit: '24'
    });

    try {
      const data = await fetchJson(`/api/cards/catalog?${params.toString()}`);
      cardsState.catalogData = data;
      cardsState.catalogTotalPages = data.totalPages || 1;
      cardsState.catalogPage = data.page || 1;

      const badge = document.getElementById('catalogTotalBadge');
      if (badge) badge.textContent = `${formatNumber(data.totalCatalog)} Cards`;

      renderTierPills('catalogTierPills', cardsState.catalogTier, data.tierCounts, (tier) => {
        cardsState.catalogTier = tier;
        cardsState.catalogPage = 1;
        loadCatalog();
      });

      renderPacks(data.packs || []);

      if (!data.items?.length) {
        grid.innerHTML = '<div class="empty-note">No anime cards match your search filter.</div>';
        document.getElementById('catalogPager').hidden = true;
        return;
      }

      grid.innerHTML = data.items
        .map(
          (c, idx) => `
            <article class="anime-card tier-${escapeHtml(c.tier)}" data-cidx="${idx}">
              <div class="anime-card-frame">
                ${renderCardMediaHtml(c)}
                <span class="anime-tier-tag" style="color:${escapeHtml(c.tierColor)}; border-color:${escapeHtml(c.tierColor)}55;">${escapeHtml(c.tier === 'S' ? 'S' : `T${c.tier}`)}${c.animated ? ' ⚡' : ''}</span>
                ${c.event ? `<span class="anime-event-tag">🎉 ${escapeHtml(c.event)}</span>` : ''}
              </div>
              <div class="anime-card-meta">
                <h3 class="anime-card-title">${escapeHtml(c.name)}</h3>
                <div class="anime-card-series">${escapeHtml(c.series)}</div>
                <div class="anime-card-foot">
                  <span>🔥 ${formatNumber(c.burnValue)} ♦</span>
                </div>
              </div>
            </article>
          `
        )
        .join('');

      grid.querySelectorAll('.anime-card').forEach((cardEl) => {
        cardEl.addEventListener('click', () => {
          const item = data.items[Number(cardEl.getAttribute('data-cidx'))];
          if (item) openCardModal(item);
        });
      });

      const pager = document.getElementById('catalogPager');
      const label = document.getElementById('catalogPager') && document.getElementById('catPageLabel');
      if (pager && label) {
        pager.hidden = data.totalPages <= 1;
        label.textContent = `Page ${data.page} / ${data.totalPages} (${formatNumber(data.total)} matches)`;
        document.getElementById('catPrevBtn').disabled = data.page <= 1;
        document.getElementById('catNextBtn').disabled = data.page >= data.totalPages;
      }

      window.ShoreMotion?.animateListItems?.(grid, '.anime-card');
    } catch (err) {
      grid.innerHTML = `<div class="empty-note">Could not load card catalog: ${escapeHtml(err.message)}</div>`;
    }
  }

  /* --- Tab 2: Gacha Packs --- */
  function renderPacks(packs) {
    const grid = document.getElementById('packsGrid');
    const guest = document.getElementById('packsGuestBanner');
    const roleBanner = document.getElementById('packsRoleBanner');
    if (!grid) return;

    const isLinked = Boolean(state.authProfile);
    const canSummon = Boolean(state.authProfile?.canSummonPack);

    if (guest) guest.hidden = isLinked;
    if (roleBanner) roleBanner.hidden = !isLinked || canSummon;
    if (!packs.length) return;

    grid.innerHTML = packs
      .map(
        (p) => `
          <div class="panel-card pack-card pack-${escapeHtml(p.id)}">
            <div class="pack-emoji">${escapeHtml(p.emoji)}</div>
            <h3 class="pack-title">${escapeHtml(p.name)}</h3>
            <p class="pack-desc">${escapeHtml(p.description)}</p>
            <div class="pack-price">${formatNumber(p.price)} ♦</div>
            <button type="button" class="btn primary full-btn summon-pack-btn" data-pack="${escapeHtml(p.id)}" ${!canSummon ? 'disabled' : ''}>
              ${!isLinked ? 'Link Account' : canSummon ? `Summon (${p.count} Card${p.count > 1 ? 's' : ''})` : 'Mod / Owner Only'}
            </button>
          </div>
        `
      )
      .join('');

    grid.querySelectorAll('.summon-pack-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!state.authProfile?.canSummonPack) {
          showToast('Only Bot Moderators and the Owner can summon packs.');
          return;
        }
        const packId = btn.getAttribute('data-pack');
        if (!packId) return;
        const orig = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Summoning...';
        try {
          const res = await fetchJson('/api/cards/pack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packId })
          });
          updateWalletBanner(res.wallet);
          if (state.authProfile) state.authProfile.wallet = res.wallet;
          cardsState.meData = {
            wallet: res.wallet,
            collection: res.collection,
            deck: res.deck
          };
          showPackResult(res.pack, res.pulled);
          showToast(`Summoned ${res.pack.name}!`);
        } catch (err) {
          showToast(err.message);
        } finally {
          btn.disabled = !state.authProfile?.canSummonPack;
          btn.textContent = orig;
        }
      });
    });
  }

  function showPackResult(pack, pulled) {
    const box = document.getElementById('packResultBox');
    const title = document.getElementById('packResultTitle');
    const grid = document.getElementById('packResultGrid');
    if (!box || !title || !grid) return;

    title.textContent = `${pack.emoji} ${pack.name} Results (${pulled.length} pulled!)`;
    grid.innerHTML = pulled
      .map(
        (c, idx) => `
          <article class="anime-card tier-${escapeHtml(c.tier)}" data-pidx="${idx}">
            <div class="anime-card-frame">
              ${renderCardMediaHtml(c)}
              <span class="anime-tier-tag" style="color:${escapeHtml(c.tierColor)}; border-color:${escapeHtml(c.tierColor)}55;">${escapeHtml(c.tier === 'S' ? 'S' : `T${c.tier}`)}</span>
            </div>
            <div class="anime-card-meta">
              <h3 class="anime-card-title">${escapeHtml(c.name)}</h3>
              <div class="anime-card-series">${escapeHtml(c.series)}</div>
              <div class="anime-card-foot">
                <span>UID #${escapeHtml(c.uid)}</span>
                <span>🔥 ${formatNumber(c.burnValue)} ♦</span>
              </div>
            </div>
          </article>
        `
      )
      .join('');

    grid.querySelectorAll('.anime-card').forEach((el) => {
      el.addEventListener('click', () => {
        const c = pulled[Number(el.getAttribute('data-pidx'))];
        if (c) openCardModal(c);
      });
    });

    box.hidden = false;
    window.ShoreMotion?.animateListItems?.(grid, '.anime-card');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* --- Tab 3: Collection & Deck --- */
  async function runCardAction(payload, okMsg) {
    const res = await fetchJson('/api/cards/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    updateWalletBanner(res.wallet);
    if (state.authProfile) state.authProfile.wallet = res.wallet;
    cardsState.meData = {
      wallet: res.wallet,
      collection: res.collection,
      deck: res.deck
    };
    if (Array.isArray(res.market)) {
      cardsState.marketItems = res.market;
      renderMarketGrid();
    }
    renderCollectionTab();
    if (okMsg) showToast(okMsg);
    return res;
  }

  async function loadMyCards() {
    const guest = document.getElementById('colGuestBanner');
    const wrap = document.getElementById('colAuthWrap');
    if (!guest || !wrap) return;

    if (!state.authProfile) {
      guest.hidden = false;
      wrap.hidden = true;
      return;
    }

    guest.hidden = true;
    wrap.hidden = false;

    try {
      const data = await fetchJson('/api/cards/me');
      cardsState.meData = data;
      updateWalletBanner(data.wallet);
      renderCollectionTab();
    } catch (err) {
      document.getElementById('myCollectionGrid').innerHTML = `<div class="empty-note">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderCollectionTab() {
    const data = cardsState.meData;
    if (!data) return;

    const deck = data.deck || [];
    const col = data.collection || { total: 0, tierCounts: {}, items: [] };

    const deckBadge = document.getElementById('deckCountBadge');
    const summaryChip = document.getElementById('colSummaryChip');
    if (deckBadge) deckBadge.textContent = `${deck.length} / 6 Slots`;
    if (summaryChip) summaryChip.textContent = `Owned: ${col.total} Cards`;

    const deckGrid = document.getElementById('myDeckGrid');
    if (deckGrid) {
      const slots = [];
      for (let i = 0; i < 6; i++) {
        const card = deck[i];
        if (card) {
          slots.push(`
            <div class="deck-slot filled tier-${escapeHtml(card.tier)}">
              ${renderCardMediaHtml(card, 'deck-slot-img')}
              <div class="deck-slot-overlay">
                <span class="deck-slot-num">#${i + 1} • ${escapeHtml(card.tier === 'S' ? 'S' : `T${card.tier}`)}</span>
                <button type="button" class="deck-rm-btn" data-slot="${i + 1}" title="Remove from deck">✕</button>
              </div>
              <div class="deck-slot-name">${escapeHtml(card.name)}</div>
            </div>
          `);
        } else {
          slots.push(`<div class="deck-slot empty"><span>Slot ${i + 1}</span><small>Pin from collection</small></div>`);
        }
      }
      deckGrid.innerHTML = slots.join('');
      deckGrid.querySelectorAll('.deck-rm-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await runCardAction({ action: 'deckRemove', slot: Number(btn.getAttribute('data-slot')) }, 'Removed from Showcase Deck.');
          } catch (err) {
            showToast(err.message);
          }
        });
      });
    }

    renderTierPills('colTierPills', cardsState.colTier, col.tierCounts, (tier) => {
      cardsState.colTier = tier;
      renderCollectionTab();
    });

    const colGrid = document.getElementById('myCollectionGrid');
    if (!colGrid) return;

    const q = cardsState.colQuery.trim().toLowerCase();
    const filtered = (col.items || []).filter((c) => {
      if (cardsState.colTier !== 'all' && c.tier.toUpperCase() !== cardsState.colTier.toUpperCase()) return false;
      if (q && !`${c.name} ${c.series} ${c.uid} #${c.uid}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (!filtered.length) {
      colGrid.innerHTML = '<div class="empty-note">No cards in your collection match yet. Catch spawns in groups or summon a Gacha Pack!</div>';
      return;
    }

    colGrid.innerHTML = filtered
      .map(
        (c, idx) => `
          <article class="anime-card owned tier-${escapeHtml(c.tier)}" data-oidx="${idx}">
            <div class="anime-card-frame">
              ${renderCardMediaHtml(c)}
              <span class="anime-tier-tag" style="color:${escapeHtml(c.tierColor)}; border-color:${escapeHtml(c.tierColor)}55;">#${escapeHtml(c.uid)} • ${escapeHtml(c.tier === 'S' ? 'S' : `T${c.tier}`)}</span>
            </div>
            <div class="anime-card-meta">
              <h3 class="anime-card-title">${escapeHtml(c.name)}</h3>
              <div class="anime-card-series">${escapeHtml(c.series)}</div>
              <div class="owned-actions-row">
                <button type="button" class="btn btn-mini act-deck" data-uid="${escapeHtml(c.uid)}">${c.inDeck ? '📌 Pinned' : '📌 Deck'}</button>
                <button type="button" class="btn btn-mini act-sell" data-uid="${escapeHtml(c.uid)}" ${c.listedId ? 'disabled' : ''}>${c.listedId ? `🏷️ #${escapeHtml(c.listedId)}` : '🏷️ Sell'}</button>
                <button type="button" class="btn btn-mini act-burn" data-uid="${escapeHtml(c.uid)}" data-val="${c.burnValue}" ${c.listedId ? 'disabled' : ''}>🔥 ${formatCompact(c.burnValue)}</button>
              </div>
            </div>
          </article>
        `
      )
      .join('');

    colGrid.querySelectorAll('.anime-card').forEach((cardEl) => {
      cardEl.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const item = filtered[Number(cardEl.getAttribute('data-oidx'))];
        if (item) openCardModal(item);
      });
    });

    colGrid.querySelectorAll('.act-deck').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-uid');
        try {
          await runCardAction({ action: 'deckAdd', uid }, `Pinned card #${uid} to your Deck!`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    colGrid.querySelectorAll('.act-burn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-uid');
        const val = btn.getAttribute('data-val');
        if (!window.confirm(`Burn card #${uid} permanently for ${Number(val).toLocaleString()} ♦ Rubies?`)) return;
        try {
          await runCardAction({ action: 'burn', uid }, `Burned #${uid} for +${Number(val).toLocaleString()} ♦!`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    colGrid.querySelectorAll('.act-sell').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-uid');
        const raw = window.prompt(`Enter Market Price in ♦ Rubies for card #${uid} (min 100):`, '10000');
        if (!raw) return;
        const price = parseInt(raw, 10);
        try {
          await runCardAction({ action: 'listMarket', uid, price }, `Listed card #${uid} on the Market!`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  /* --- Tab 4: Market --- */
  async function loadMarket() {
    const grid = document.getElementById('marketGrid');
    if (!grid) return;
    try {
      const data = await fetchJson('/api/cards/market');
      cardsState.marketItems = data.items || [];
      renderMarketGrid();
    } catch (err) {
      grid.innerHTML = `<div class="empty-note">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderMarketGrid() {
    const grid = document.getElementById('marketGrid');
    if (!grid) return;

    renderTierPills('marketTierPills', cardsState.marketTier, null, (tier) => {
      cardsState.marketTier = tier;
      renderMarketGrid();
    });

    const q = cardsState.marketQuery.trim().toLowerCase();
    const filtered = (cardsState.marketItems || []).filter((l) => {
      if (cardsState.marketTier !== 'all' && l.tier.toUpperCase() !== cardsState.marketTier.toUpperCase()) return false;
      if (q && !`${l.name} ${l.series} ${l.id} ${l.sellerName}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-note">No active Market listings match right now.</div>';
      return;
    }

    const myKey = state.authProfile?.key || '';
    grid.innerHTML = filtered
      .map((l, idx) => {
        const isMine = myKey && l.sellerKey === myKey;
        return `
          <article class="anime-card tier-${escapeHtml(l.tier)}" data-midx="${idx}">
            <div class="anime-card-frame">
              ${renderCardMediaHtml(l)}
              <span class="anime-tier-tag" style="color:${escapeHtml(l.tierColor || '#4effff')};">ID #${escapeHtml(l.id)} • ${escapeHtml(l.tier === 'S' ? 'S' : `T${l.tier}`)}</span>
            </div>
            <div class="anime-card-meta">
              <h3 class="anime-card-title">${escapeHtml(l.name)}</h3>
              <div class="anime-card-series">${escapeHtml(l.series)} • Seller: ${escapeHtml(l.sellerName)}</div>
              <div class="owned-actions-row" style="margin-top:10px;">
                <span style="font-family:'JetBrains Mono',monospace; font-weight:700; color:var(--ruby);">${formatNumber(l.price)} ♦</span>
                ${
                  isMine
                    ? `<button type="button" class="btn btn-mini act-cancel" data-id="${escapeHtml(l.id)}">Cancel</button>`
                    : `<button type="button" class="btn btn-mini act-buy" data-id="${escapeHtml(l.id)}" data-price="${l.price}" ${!state.authProfile ? 'disabled' : ''}>Buy Now</button>`
                }
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('.anime-card').forEach((cardEl) => {
      cardEl.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const item = filtered[Number(cardEl.getAttribute('data-midx'))];
        if (item) openCardModal(item);
      });
    });

    grid.querySelectorAll('.act-buy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const price = btn.getAttribute('data-price');
        if (!window.confirm(`Buy market listing #${id} for ${Number(price).toLocaleString()} ♦ Rubies?`)) return;
        try {
          await runCardAction({ action: 'buyMarket', listingId: id }, `Purchased card listing #${id}!`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    grid.querySelectorAll('.act-cancel').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          await runCardAction({ action: 'cancelMarket', listingId: id }, `Removed listing #${id}.`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  function switchTab(tabName) {
    cardsState.activeTab = tabName;
    document.querySelectorAll('.cards-tabs-bar .tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-ctab') === tabName);
    });
    document.getElementById('tabCatalog').hidden = tabName !== 'catalog';
    document.getElementById('tabPacks').hidden = tabName !== 'packs';
    document.getElementById('tabCollection').hidden = tabName !== 'collection';
    document.getElementById('tabMarket').hidden = tabName !== 'market';

    if (tabName === 'packs') renderPacks(cardsState.catalogData?.packs || []);
    if (tabName === 'collection') loadMyCards();
    if (tabName === 'market') loadMarket();
  }

  function bootCards() {
    document.querySelectorAll('.cards-tabs-bar .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-ctab') || 'catalog'));
    });

    document.getElementById('catalogSearch')?.addEventListener('input', (e) => {
      cardsState.catalogQuery = e.target.value || '';
      cardsState.catalogPage = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadCatalog, 240);
    });

    document.getElementById('catalogEventOnly')?.addEventListener('change', (e) => {
      cardsState.catalogEventOnly = Boolean(e.target.checked);
      cardsState.catalogPage = 1;
      loadCatalog();
    });

    document.getElementById('catPrevBtn')?.addEventListener('click', () => {
      if (cardsState.catalogPage > 1) {
        cardsState.catalogPage -= 1;
        loadCatalog();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('catNextBtn')?.addEventListener('click', () => {
      if (cardsState.catalogPage < cardsState.catalogTotalPages) {
        cardsState.catalogPage += 1;
        loadCatalog();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('colSearch')?.addEventListener('input', (e) => {
      cardsState.colQuery = e.target.value || '';
      renderCollectionTab();
    });

    document.getElementById('marketSearch')?.addEventListener('input', (e) => {
      cardsState.marketQuery = e.target.value || '';
      renderMarketGrid();
    });

    document.getElementById('marketRefreshBtn')?.addEventListener('click', loadMarket);
    document.getElementById('packClearBtn')?.addEventListener('click', () => {
      document.getElementById('packResultBox').hidden = true;
    });

    const modal = document.getElementById('cardModal');
    document.getElementById('cardModalClose')?.addEventListener('click', () => {
      if (modal) modal.hidden = true;
    });
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.hidden = true;
    });

    loadCatalog();

    window.addEventListener('shore:authReady', () => {
      updateWalletBanner();
      if (cardsState.catalogData?.packs) renderPacks(cardsState.catalogData.packs);
      if (cardsState.activeTab === 'collection') loadMyCards();
      if (cardsState.activeTab === 'market') renderMarketGrid();
    });
  }

  bootCards();
})();
