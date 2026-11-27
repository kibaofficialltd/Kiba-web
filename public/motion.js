/**
 * Black Shores real-time atmospheric canvas renderer & UI motion effects.
 * Renders twinkling starfields, holographic cyan butterflies, ruby motes,
 * pointer constellation resonance, card spotlight/tilt, scroll reveals, and counters.
 */
(() => {
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canHoverTilt =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /**
   * Draw a faceted crystal/ruby diamond path centered at origin.
   */
  function traceDiamond(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.25);
    ctx.lineTo(r * 0.85, 0);
    ctx.lineTo(0, r * 1.25);
    ctx.lineTo(-r * 0.85, 0);
    ctx.closePath();
  }

  /**
   * Draw a glowing holographic butterfly tilted along its flight vector.
   */
  function drawButterfly(ctx, b) {
    const flap = Math.max(0.18, Math.abs(Math.cos(b.wingPhase)));
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);

    // Ambient aura
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, b.size * 2.1);
    aura.addColorStop(0, `rgba(78, 255, 255, ${b.alpha * 0.38})`);
    aura.addColorStop(0.55, `rgba(96, 175, 255, ${b.alpha * 0.14})`);
    aura.addColorStop(1, 'rgba(78, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, b.size * 2.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw mirrored left & right wings scaled by wing flap cosine
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * flap, 1);

      // Upper forewing
      ctx.beginPath();
      ctx.moveTo(0, -b.size * 0.15);
      ctx.bezierCurveTo(
        b.size * 0.55,
        -b.size * 1.15,
        b.size * 1.45,
        -b.size * 0.85,
        b.size * 1.05,
        b.size * 0.05
      );
      ctx.bezierCurveTo(
        b.size * 0.72,
        b.size * 0.2,
        b.size * 0.25,
        b.size * 0.08,
        0,
        b.size * 0.1
      );
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -b.size, b.size * 1.2, b.size * 0.5);
      grad.addColorStop(0, `rgba(180, 255, 255, ${b.alpha * 0.9})`);
      grad.addColorStop(0.6, `rgba(78, 255, 255, ${b.alpha * 0.55})`);
      grad.addColorStop(1, `rgba(59, 130, 246, ${b.alpha * 0.25})`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = `rgba(210, 255, 255, ${b.alpha * 0.85})`;
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // Lower hindwing
      ctx.beginPath();
      ctx.moveTo(0, b.size * 0.08);
      ctx.bezierCurveTo(
        b.size * 0.85,
        b.size * 0.12,
        b.size * 0.92,
        b.size * 0.88,
        b.size * 0.28,
        b.size * 0.95
      );
      ctx.bezierCurveTo(
        b.size * 0.08,
        b.size * 0.72,
        b.size * 0.04,
        b.size * 0.35,
        0,
        b.size * 0.18
      );
      ctx.closePath();
      ctx.fillStyle = `rgba(78, 255, 255, ${b.alpha * 0.42})`;
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Slender luminous body
    ctx.strokeStyle = `rgba(235, 255, 255, ${b.alpha})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -b.size * 0.35);
    ctx.lineTo(0, b.size * 0.45);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Initialize the Black Shores full-viewport Canvas particle & butterfly renderer.
   */
  function initShoreCanvas() {
    const canvas = document.getElementById('shoreCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let lastTime = performance.now();

    const pointer = {
      x: -9999,
      y: -9999,
      nx: 0,
      ny: 0,
      active: false,
      lastRippleAt: 0
    };

    const stars = [];
    const shards = [];
    const butterflies = [];
    const ripples = [];

    function seedScene() {
      stars.length = 0;
      shards.length = 0;
      butterflies.length = 0;

      const area = width * height;
      const isCompact = width < 720;
      const starCount = Math.min(isCompact ? 48 : 90, Math.max(30, Math.floor(area / 18000)));
      const shardCount = isCompact ? 14 : 26;
      const butterflyCount = isCompact ? 6 : 11;

      for (let i = 0; i < starCount; i++) {
        const depth = 0.25 + Math.random() * 0.75;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.7 + Math.random() * 1.7,
          depth,
          hue: Math.random() < 0.16 ? 'ruby' : Math.random() < 0.72 ? 'cyan' : 'white',
          phase: Math.random() * Math.PI * 2,
          speed: 0.9 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 6,
          vy: -3 - Math.random() * 8
        });
      }

      for (let i = 0; i < shardCount; i++) {
        const isRuby = Math.random() < 0.34;
        shards.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 2.2 + Math.random() * 3.8,
          alpha: 0.24 + Math.random() * 0.45,
          spin: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.8,
          vx: (Math.random() - 0.5) * 14,
          vy: -12 - Math.random() * 20,
          swayPhase: Math.random() * Math.PI * 2,
          isRuby
        });
      }

      for (let i = 0; i < butterflyCount; i++) {
        butterflies.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 8 + Math.random() * 8.5,
          vx: (Math.random() - 0.35) * 24,
          vy: -14 - Math.random() * 18,
          wingPhase: Math.random() * Math.PI * 2,
          wingSpeed: 5.5 + Math.random() * 4.5,
          wanderPhase: Math.random() * Math.PI * 2,
          alpha: 0.34 + Math.random() * 0.42,
          angle: 0
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedScene();
    }

    function spawnRipple(x, y, ruby = false) {
      if (ripples.length > 10) ripples.shift();
      ripples.push({
        x,
        y,
        r: 4,
        maxR: 68 + Math.random() * 44,
        alpha: 0.45,
        ruby
      });
    }

    function handlePointerMove(e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = width ? (e.clientX / width - 0.5) * 2 : 0;
      pointer.ny = height ? (e.clientY / height - 0.5) * 2 : 0;
      pointer.active = true;

      document.documentElement.style.setProperty('--mx-global', `${(pointer.nx * 14).toFixed(2)}px`);
      document.documentElement.style.setProperty('--my-global', `${(pointer.ny * 10).toFixed(2)}px`);

      const now = performance.now();
      if (!prefersReducedMotion && now - pointer.lastRippleAt > 240) {
        pointer.lastRippleAt = now;
        spawnRipple(pointer.x, pointer.y, Math.random() < 0.25);
      }
    }

    function handlePointerDown(e) {
      if (prefersReducedMotion) return;
      spawnRipple(e.clientX, e.clientY, true);
    }

    function wrapCoord(obj, pad = 36) {
      if (obj.x < -pad) obj.x = width + pad;
      if (obj.x > width + pad) obj.x = -pad;
      if (obj.y < -pad) obj.y = height + pad;
      if (obj.y > height + pad) obj.y = -pad;
    }

    function renderFrame(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Interactive pointer astral aura + constellation links
      if (pointer.active) {
        const pGlow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 170);
        pGlow.addColorStop(0, 'rgba(78, 255, 255, 0.09)');
        pGlow.addColorStop(0.5, 'rgba(255, 92, 124, 0.035)');
        pGlow.addColorStop(1, 'rgba(78, 255, 255, 0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 170, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars & subtle cursor constellation filaments
      const nearNodes = [];
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!prefersReducedMotion) {
          s.phase += s.speed * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          wrapCoord(s, 12);
        }

        const px = s.x - pointer.nx * s.depth * 18;
        const py = s.y - pointer.ny * s.depth * 14;
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase));
        const alpha = Math.min(0.95, twinkle * (0.45 + s.depth * 0.45));

        if (pointer.active) {
          const dx = px - pointer.x;
          const dy = py - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 150 * 150) {
            nearNodes.push({ x: px, y: py, dist: Math.sqrt(distSq) });
          }
        }

        ctx.fillStyle =
          s.hue === 'ruby'
            ? `rgba(255, 110, 140, ${alpha})`
            : s.hue === 'cyan'
              ? `rgba(120, 255, 255, ${alpha})`
              : `rgba(235, 245, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointer.active && nearNodes.length > 0) {
        ctx.lineWidth = 0.8;
        for (let i = 0; i < nearNodes.length; i++) {
          const a = nearNodes[i];
          const linkAlpha = (1 - a.dist / 150) * 0.22;
          ctx.strokeStyle = `rgba(78, 255, 255, ${linkAlpha})`;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(a.x, a.y);
          ctx.stroke();
        }
      }

      // Faceted ruby & cyan crystal motes
      for (let i = 0; i < shards.length; i++) {
        const m = shards[i];
        if (!prefersReducedMotion) {
          m.swayPhase += dt * 1.4;
          m.spin += m.spinSpeed * dt;
          m.x += (m.vx + Math.sin(m.swayPhase) * 8) * dt;
          m.y += m.vy * dt;
          wrapCoord(m, 24);
        }

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.spin);
        traceDiamond(ctx, m.r);
        ctx.fillStyle = m.isRuby
          ? `rgba(255, 92, 124, ${m.alpha * 0.52})`
          : `rgba(78, 255, 255, ${m.alpha * 0.45})`;
        ctx.strokeStyle = m.isRuby
          ? `rgba(255, 165, 185, ${m.alpha})`
          : `rgba(190, 255, 255, ${m.alpha})`;
        ctx.lineWidth = 0.9;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Holographic cyan butterflies
      for (let i = 0; i < butterflies.length; i++) {
        const b = butterflies[i];
        if (!prefersReducedMotion) {
          b.wanderPhase += dt * 1.6;
          let boost = 1;

          if (pointer.active) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 130 && dist > 1) {
              boost = 1.9;
              b.vx += (dx / dist) * 28 * dt;
              b.vy += (dy / dist) * 28 * dt;
            }
          }

          b.wingPhase += b.wingSpeed * boost * dt;
          b.x += (b.vx + Math.sin(b.wanderPhase) * 14) * dt;
          b.y += (b.vy + Math.cos(b.wanderPhase * 0.8) * 6) * dt;

          // Gentle velocity damping back toward upward drift
          b.vx *= 0.992;
          b.vy = b.vy * 0.992 - 0.12;
          if (b.vy < -36) b.vy = -28;
          b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
          wrapCoord(b, 40);
        }
        drawButterfly(ctx, b);
      }

      // Expanding resonance ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 95 * dt;
        rp.alpha -= 0.55 * dt;
        if (rp.alpha <= 0 || rp.r >= rp.maxR) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = rp.ruby
          ? `rgba(255, 92, 124, ${rp.alpha})`
          : `rgba(78, 255, 255, ${rp.alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function startLoop() {
      if (rafId) window.cancelAnimationFrame(rafId);
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(renderFrame);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (!prefersReducedMotion) {
        startLoop();
      }
    });

    if (prefersReducedMotion) {
      renderFrame(performance.now());
    } else {
      startLoop();
    }
  }

  /**
   * Track pointer spotlight glow & subtle 3D perspective tilt on interactive glass cards.
   */
  function initCardEffects() {
    const cardSelector = '.stat-card, .feature-panel, .comm-card, .panel-card, .cmd-card';

    document.addEventListener(
      'pointermove',
      (e) => {
        const card = e.target?.closest?.(cardSelector);
        if (!card) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const rx = e.clientX - rect.left;
        const ry = e.clientY - rect.top;
        card.style.setProperty('--mx', `${rx.toFixed(1)}px`);
        card.style.setProperty('--my', `${ry.toFixed(1)}px`);

        if (canHoverTilt && !prefersReducedMotion && !card.classList.contains('panel-card')) {
          const nx = rx / rect.width - 0.5;
          const ny = ry / rect.height - 0.5;
          const tiltMax = card.classList.contains('cmd-card') ? 2.4 : 4.2;
          card.style.setProperty('--rx', `${(-ny * tiltMax).toFixed(2)}deg`);
          card.style.setProperty('--ry', `${(nx * tiltMax).toFixed(2)}deg`);
          card.classList.add('is-tilting');
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'pointerout',
      (e) => {
        const card = e.target?.closest?.(cardSelector);
        if (!card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
        card.classList.remove('is-tilting');
      },
      { passive: true }
    );
  }

  /**
   * Trigger staggered entrance reveals as sections and cards enter the viewport.
   */
  let revealObserver = null;

  function observeReveals(root = document) {
    const targets = root.querySelectorAll(
      '.stat-card, .feature-panel, .comm-card, .panel-card, .section-header, .subpage-top'
    );
    targets.forEach((el, idx) => {
      if (el.closest('[hidden]') || el.classList.contains('reveal-ready')) return;
      el.classList.add('reveal-ready');
      const delay = Math.min(idx % 6, 5) * 65;
      el.style.transitionDelay = `${delay}ms`;

      if (prefersReducedMotion || !revealObserver) {
        el.classList.add('is-visible');
      } else {
        revealObserver.observe(el);
      }
    });
  }

  function initScrollEffects() {
    document.documentElement.classList.add('has-motion');

    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.08, rootMargin: '0px 0px -28px 0px' }
      );
    }

    observeReveals(document);

    const progressEl = document.getElementById('scrollProgress');
    const navbarEl = document.querySelector('.navbar');
    const heroImg = document.querySelector('.hero-bg-img');

    let ticking = false;
    function updateOnScroll() {
      ticking = false;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

      if (progressEl) {
        progressEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }
      if (navbarEl) {
        navbarEl.classList.toggle('scrolled', scrollY > 24);
      }
      if (heroImg && !prefersReducedMotion) {
        const shift = Math.min(72, scrollY * 0.16);
        heroImg.style.setProperty('--hero-scroll-y', `${shift.toFixed(1)}px`);
      }
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateOnScroll);
        }
      },
      { passive: true }
    );
    updateOnScroll();
  }

  /**
   * Smoothly count up stat/account figures from zero to their formatted target text.
   */
  function animateText(el, targetNum, formatter, duration = 850) {
    if (!el) return;
    const end = Number(targetNum || 0);
    if (prefersReducedMotion || !Number.isFinite(end) || end <= 0) {
      el.textContent = formatter(end);
      return;
    }

    if (el.dataset.lastTarget === String(end)) {
      el.textContent = formatter(end);
      return;
    }
    el.dataset.lastTarget = String(end);

    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = t >= 1 ? end : Math.round(end * eased);
      el.textContent = formatter(current);
      if (t < 1) {
        window.requestAnimationFrame(step);
      }
    }
    window.requestAnimationFrame(step);
  }

  /**
   * Apply a quick staggered pop-in wave to dynamically rendered list/grid children.
   */
  function animateListItems(container, selector) {
    if (!container || prefersReducedMotion) return;
    const items = container.querySelectorAll(selector);
    items.forEach((item, idx) => {
      item.classList.remove('pop-item');
      item.style.animationDelay = `${Math.min(idx, 18) * 28}ms`;
      // Force reflow on first frame cleanly without reading layout inside loop unnecessarily
      item.classList.add('pop-item');
    });
  }

  window.ShoreMotion = {
    observeReveals,
    animateText,
    animateListItems
  };

  function boot() {
    initShoreCanvas();
    initCardEffects();
    initScrollEffects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
