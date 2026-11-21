/**
 * KIBAOFFICIAL SMP — hero scenery.
 *
 * Deliberately hand-drawn and dependency-free: blocky Minecraft terrain
 * silhouettes, a castle, pine forest, moon and drifting motes. Rendered as
 * inline SVG (a few KB, no image request) so it stays sharp and fast on
 * mobile. If /public/brand/hero.jpg exists, the page uses that instead.
 */

function rng(seed: number) {
  let s = seed % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Stepped, block-built ridge silhouette. */
function ridge(seed: number, base: number, amp: number, col = 46): string {
  const random = rng(seed);
  let x = 0;
  let y = base - Math.round((random() * amp) / 12) * 12;
  let d = `M-40 ${y}`;
  while (x < 1480) {
    x += Math.round(col * (0.55 + random() * 1.5));
    const next = base - Math.round((random() * amp) / 12) * 12;
    d += ` H${x} V${next}`;
    y = next;
  }
  return `${d} V900 H-40 Z`;
}

function pine(x: number, base: number, height: number, fill: string) {
  const w = height * 0.42;
  return (
    <g key={`pine-${x}-${height}`} fill={fill}>
      <rect x={x - 2} y={base - height * 0.12} width={4} height={height * 0.14} />
      <polygon points={`${x},${base - height} ${x - w / 2},${base - height * 0.25} ${x + w / 2},${base - height * 0.25}`} />
      <polygon points={`${x},${base - height * 0.82} ${x - w * 0.62},${base - height * 0.08} ${x + w * 0.62},${base - height * 0.08}`} />
    </g>
  );
}

function castle(x: number, base: number) {
  const stone = "#0c1611";
  const rim = "rgba(201,169,97,0.16)";
  const win = "rgba(232,206,138,0.5)";
  return (
    <g transform={`translate(${x} ${base})`} aria-hidden="true">
      {/* main keep */}
      <rect x="0" y="-96" width="104" height="96" fill={stone} />
      <rect x="0" y="-96" width="104" height="4" fill={rim} />
      {/* battlements */}
      {[0, 22, 44, 66, 88].map((bx) => (
        <rect key={bx} x={bx} y="-108" width="12" height="14" fill={stone} />
      ))}
      {/* left tower */}
      <rect x="-34" y="-142" width="42" height="142" fill={stone} />
      <rect x="-34" y="-142" width="3" height="142" fill={rim} />
      <rect x="-38" y="-152" width="50" height="12" fill={stone} />
      <rect x="-30" y="-124" width="7" height="12" fill={win} />
      <rect x="-14" y="-96" width="7" height="12" fill={win} />
      {/* right tower */}
      <rect x="96" y="-124" width="38" height="124" fill={stone} />
      <rect x="96" y="-124" width="3" height="124" fill={rim} />
      <rect x="92" y="-134" width="46" height="12" fill={stone} />
      <rect x="116" y="-104" width="7" height="11" fill={win} />
      {/* gate */}
      <path d="M40 0v-52a14 14 0 0 1 28 0V0Z" fill="#050a08" />
      <rect x="44" y="-40" width="4" height="10" fill={win} opacity="0.5" />
      <rect x="60" y="-40" width="4" height="10" fill={win} opacity="0.5" />
      {/* flag */}
      <rect x="13" y="-178" width="2" height="38" fill="#20302a" />
      <path d="M15 -178 L44 -168 L15 -158 Z" fill="rgba(111,174,123,0.5)" />
    </g>
  );
}

export function Scenery() {
  const stars = Array.from({ length: 34 }, (_, i) => {
    const r = rng(100 + i)();
    const r2 = rng(200 + i)();
    return {
      x: 40 + r * 1360,
      y: 30 + r2 * 260,
      o: 0.12 + ((i * 37) % 40) / 100,
      s: i % 7 === 0 ? 1.6 : 1,
    };
  });

  const pines = [
    [64, 700, 150], [126, 706, 108], [176, 700, 78], [248, 704, 122],
    [330, 700, 86], [1188, 706, 96], [1252, 702, 138], [1320, 708, 104],
    [1382, 704, 72], [1078, 700, 64], [900, 706, 52],
  ] as const;

  return (
    <div className="hero-scene" aria-hidden="true">
      <svg
        className="parallax parallax-far"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <radialGradient id="moon-glow">
            <stop stopColor="#e8e2cd" stopOpacity="0.9" />
            <stop offset="0.35" stopColor="#cfd8c2" stopOpacity="0.35" />
            <stop offset="1" stopColor="#cfd8c2" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moon-core">
            <stop stopColor="#f2ecd8" />
            <stop offset="1" stopColor="#cfc9b4" />
          </radialGradient>
          <linearGradient id="sky-veil" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#0a1410" stopOpacity="0" />
            <stop offset="1" stopColor="#0a1410" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <g opacity="0.7">
          {stars.map((star, i) => (
            <circle key={i} cx={star.x} cy={star.y} r={star.s} fill="#dfe8d8" opacity={star.o} />
          ))}
        </g>

        <circle cx="1128" cy="168" r="150" fill="url(#moon-glow)" />
        <circle cx="1128" cy="168" r="52" fill="url(#moon-core)" opacity="0.92" />
        <circle cx="1108" cy="158" r="9" fill="#c4bfab" opacity="0.35" />
        <circle cx="1142" cy="184" r="6" fill="#c4bfab" opacity="0.3" />
        <circle cx="1130" cy="142" r="4" fill="#c4bfab" opacity="0.25" />

        <path d={ridge(7, 452, 130)} fill="#0d1913" opacity="0.85" />
        <path d={ridge(21, 520, 165)} fill="#0a1410" opacity="0.92" />
        <rect x="0" y="330" width="1440" height="420" fill="url(#sky-veil)" opacity="0.5" />
        <path d={ridge(33, 604, 120, 52)} fill="#08110d" />
      </svg>

      <svg
        className="parallax parallax-mid"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <path d={ridge(56, 660, 80, 58)} fill="#07100c" />
        {castle(1010, 664)}
        <g opacity="0.85">
          {pines.map(([x, base, h]) => pine(x, base, h, "#06100b"))}
        </g>
        <rect x="0" y="560" width="1440" height="340" fill="url(#fog)" opacity="0.35" />
        <defs>
          <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#0a1410" stopOpacity="0" />
            <stop offset="1" stopColor="#0a1410" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="parallax parallax-near"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <path d={ridge(88, 742, 46, 74)} fill="#050b08" />
        <path d={ridge(104, 800, 30, 90)} fill="#040806" />
      </svg>

      <div className="hero-fog" />
      <div className="particles">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="particle" />
        ))}
      </div>
    </div>
  );
}
