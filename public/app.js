/* Wish Tree — 거실 장면, 오너먼트 배치, 소원 쓰기·읽기 */
window.WishApi.ready.then(function () {
  'use strict';

  const cfg = window.WISH_TREE_CONFIG || {};
  const API = window.WishApi;
  const ORN = window.ORNAMENTS;
  const ORN_BY_ID = Object.fromEntries(ORN.map((o) => [o.id, o]));
  const owner = String(cfg.ownerName || '').trim();
  const TITLE = owner ? owner + "'s Wish Tree" : 'Wish Tree';
  const POLL_MS = Math.max(3, Number(cfg.pollSeconds) || 5) * 1000;
  const NS = 'http://www.w3.org/2000/svg';
  const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const $ = (s, r) => (r || document).querySelector(s);

  document.title = TITLE;
  $('#treeTitle').textContent = TITLE;
  if (API.demo) $('#demoBanner').hidden = false;

  // ---------- 작은 도구 ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ } },
  };
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const f1 = (n) => n.toFixed(1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  let deviceId = store.get('wishtree-device', '');
  if (!deviceId) { deviceId = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); store.set('wishtree-device', deviceId); }
  const MINE_KEY = 'wishtree-mine:' + API.key;
  const mine = new Set(store.get(MINE_KEY, []));

  // ---------- 장면: 정적인 배경 ----------
  const svg = $('#scene');
  svg.innerHTML = `
<defs>
  <pattern id="wallStripe" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 0V48" stroke="#fff" stroke-opacity=".022" stroke-width="12"/><path d="M0 0V48" stroke="#000" stroke-opacity=".08" stroke-width="1"/></pattern>
  <pattern id="wainscot" x="0" y="612" width="170" height="210" patternUnits="userSpaceOnUse"><rect x="14" y="28" width="142" height="150" rx="4" fill="#18221b" stroke="#0e1611" stroke-width="3"/><rect x="18" y="32" width="134" height="142" rx="3" fill="none" stroke="#2f3e33" stroke-width="1.2"/></pattern>
  <linearGradient id="floorG" x1="0" y1="822" x2="0" y2="1300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8a5a34"/><stop offset=".5" stop-color="#6a4224"/><stop offset="1" stop-color="#3e2514"/></linearGradient>
  <pattern id="planks" x="0" y="822" width="220" height="40" patternUnits="userSpaceOnUse"><path d="M0 39.5H220M70 0V40M180 0V40" stroke="#2a160a" stroke-opacity=".38"/><path d="M0 2H220" stroke="#c48a55" stroke-opacity=".12"/></pattern>
  <radialGradient id="treeGlow" cx="600" cy="470" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f7c66d" stop-opacity=".42"/><stop offset=".42" stop-color="#e3953f" stop-opacity=".13"/><stop offset="1" stop-color="#e3953f" stop-opacity="0"/></radialGradient>
  <radialGradient id="fireGlow" cx="1025" cy="770" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".45"/><stop offset=".5" stop-color="#ff7a2a" stop-opacity=".1"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" cx="600" cy="480" r="980" gradientUnits="userSpaceOnUse"><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
  <linearGradient id="nightG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1430"/><stop offset="1" stop-color="#2b4569"/></linearGradient>
  <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde8ab"/><stop offset=".35" stop-color="#c8963e"/><stop offset=".6" stop-color="#f4d58b"/><stop offset="1" stop-color="#85581a"/></linearGradient>
  <radialGradient id="mirrorG" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#3b4a43"/><stop offset="1" stop-color="#121a16"/></radialGradient>
  <linearGradient id="tierG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b2516"/><stop offset=".32" stop-color="#22573a"/><stop offset=".52" stop-color="#2f6c46"/><stop offset=".75" stop-color="#1c4a30"/><stop offset="1" stop-color="#0a2214"/></linearGradient>
  <linearGradient id="tierShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03100a" stop-opacity=".55"/><stop offset=".38" stop-color="#03100a" stop-opacity="0"/><stop offset="1" stop-color="#ffd58a" stop-opacity=".07"/></linearGradient>
  <pattern id="weave" width="14" height="11" patternUnits="userSpaceOnUse"><rect width="14" height="11" fill="#b58149"/><path d="M0 5.5Q3.5 0 7 5.5T14 5.5" stroke="#764c22" fill="none" stroke-width="1.8"/><path d="M0 11Q3.5 5.5 7 11T14 11" stroke="#e4bb80" stroke-opacity=".55" fill="none" stroke-width="1"/></pattern>
  <pattern id="rugP" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#7d2621"/><path d="M0 10L10 2L20 10L30 2L40 10M0 18L10 10L20 18L30 10L40 18" stroke="#c9a66b" stroke-opacity=".35" fill="none"/></pattern>
  <clipPath id="winClip"><rect x="86" y="316" width="228" height="268"/></clipPath>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="bigGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="tierShadow" x="-10%" y="-10%" width="120%" height="150%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#020c06" flood-opacity=".6"/></filter>
  <filter id="ornShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="1.5" dy="4" stdDeviation="2.6" flood-color="#000" flood-opacity=".5"/></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
</defs>

<!-- 벽 -->
<rect x="-3000" y="-3000" width="7200" height="3612" fill="#1f2a22"/>
<rect x="-3000" y="-3000" width="7200" height="3612" fill="url(#wallStripe)"/>
<rect x="-3000" y="602" width="7200" height="12" fill="#2c3a2f"/>
<rect x="-3000" y="614" width="7200" height="208" fill="url(#wainscot)"/>
<rect x="-3000" y="806" width="7200" height="18" fill="#2a362c"/>
<!-- 바닥 -->
<rect x="-3000" y="822" width="7200" height="4000" fill="url(#floorG)"/>
<rect x="-3000" y="822" width="7200" height="4000" fill="url(#planks)"/>
<rect x="-3000" y="-3000" width="7200" height="7200" fill="url(#treeGlow)"/>
<rect x="-3000" y="-3000" width="7200" height="7200" fill="url(#fireGlow)"/>

<!-- 창문 -->
<g id="window">
  <rect x="62" y="292" width="276" height="316" rx="6" fill="#0f1712" opacity=".5" filter="url(#blur6)"/>
  <rect x="70" y="300" width="260" height="300" rx="5" fill="#e6dbc4"/>
  <rect x="86" y="316" width="228" height="268" fill="url(#nightG)"/>
  <g clip-path="url(#winClip)">
    <circle cx="266" cy="360" r="18" fill="#f6efd6" opacity=".9" filter="url(#glow)"/>
    <g fill="#fff" opacity=".7"><circle cx="110" cy="336" r="1"/><circle cx="160" cy="352" r="1.2"/><circle cx="230" cy="330" r="1"/><circle cx="296" cy="410" r="1"/><circle cx="128" cy="400" r="1"/></g>
    <path d="M86 528Q150 486 220 516T314 504V584H86Z" fill="#dfe8f2"/>
    <path d="M86 552Q170 530 240 548T314 540V584H86Z" fill="#c9d6e4"/>
    <g fill="#18304a"><path d="M118 530l11-32 11 32z"/><path d="M262 516l9-28 9 28z"/></g>
    <g id="snow"></g>
  </g>
  <path d="M200 316V584M86 450H314" stroke="#e6dbc4" stroke-width="9"/>
  <rect x="54" y="596" width="292" height="16" rx="3" fill="#d6c8ab"/>
  <path d="M86 316H314" stroke="#000" stroke-opacity=".25" stroke-width="4"/>
  <!-- 리스 -->
  <g transform="translate(200 262)">
    <path d="M0 -40V-6" stroke="#b3202a" stroke-width="3"/>
    <circle r="30" fill="none" stroke="#24563a" stroke-width="13"/>
    <circle r="30" fill="none" stroke="#3b7d52" stroke-width="5" stroke-dasharray="3 5"/>
    <g fill="#c8222c"><circle cx="-18" cy="-22" r="3"/><circle cx="24" cy="-14" r="3"/><circle cx="-26" cy="12" r="3"/><circle cx="12" cy="27" r="3"/></g>
    <path d="M-12 26q12-14 24 0l-12 7z" fill="#b3202a"/>
  </g>
</g>

<!-- 벽난로 -->
<g id="fireplace">
  <ellipse cx="1025" cy="350" rx="92" ry="122" fill="#0b120e" opacity=".5" filter="url(#blur6)"/>
  <ellipse cx="1025" cy="346" rx="86" ry="116" fill="url(#mirrorG)" stroke="url(#goldG)" stroke-width="15"/>
  <ellipse cx="1025" cy="346" rx="72" ry="102" fill="none" stroke="#f4d58b" stroke-opacity=".35" stroke-width="1.5"/>
  <path d="M985 270q20-30 50-24" stroke="#fff" stroke-opacity=".12" stroke-width="9" fill="none" stroke-linecap="round"/>
  <rect x="870" y="523" width="310" height="22" rx="3" fill="#efe5d1"/>
  <rect x="882" y="545" width="286" height="10" fill="#d4c4a5"/>
  <path d="M892 555H1158V822H1108V652Q1108 620 1076 620H974Q942 620 942 652V822H892Z" fill="#e2d4b8"/>
  <path d="M892 555H1158V566H892Z" fill="#000" opacity=".08"/>
  <path d="M942 822V652Q942 620 974 620H1076Q1108 620 1108 652V822Z" fill="#120a06"/>
  <ellipse cx="1025" cy="800" rx="70" ry="26" fill="#ff8a32" opacity=".45" filter="url(#bigGlow)"/>
  <g filter="url(#glow)">
    <path class="flame f1" d="M985 806C980 770 1000 760 998 730C1015 750 1022 765 1018 806Z" fill="#ff7b25"/>
    <path class="flame f2" d="M1012 806C1004 760 1030 748 1024 706C1048 736 1056 770 1046 806Z" fill="#ff9a33"/>
    <path class="flame f3" d="M1040 806C1036 776 1056 768 1054 742C1068 760 1072 782 1066 806Z" fill="#ff7b25"/>
    <path class="flame f2" d="M1006 806C1004 784 1018 776 1020 752C1032 772 1038 790 1034 806Z" fill="#ffd36b"/>
  </g>
  <rect x="972" y="800" width="104" height="16" rx="8" fill="#5a331b"/>
  <rect x="986" y="808" width="84" height="14" rx="7" fill="#7a4626"/>
  <circle cx="986" cy="815" r="7" fill="#a8703f"/>
  <rect x="866" y="820" width="318" height="16" rx="2" fill="#c9b897"/>
  <!-- 촛불 -->
  <g>
    <rect x="896" y="476" width="13" height="47" rx="2" fill="#b3202a"/><rect x="896" y="476" width="4" height="47" fill="#fff" opacity=".15"/>
    <rect x="918" y="492" width="13" height="31" rx="2" fill="#b3202a"/><rect x="918" y="492" width="4" height="31" fill="#fff" opacity=".15"/>
    <rect x="1140" y="484" width="13" height="39" rx="2" fill="#b3202a"/><rect x="1140" y="484" width="4" height="39" fill="#fff" opacity=".15"/>
    <g filter="url(#glow)" fill="#ffd27a">
      <ellipse class="flame cf" cx="902.5" cy="466" rx="3.6" ry="8"/>
      <ellipse class="flame cf" cx="924.5" cy="482" rx="3.6" ry="8"/>
      <ellipse class="flame cf" cx="1146.5" cy="474" rx="3.6" ry="8"/>
    </g>
    <circle cx="902" cy="470" r="26" fill="#ffc66b" opacity=".12"/>
    <circle cx="1146" cy="478" r="26" fill="#ffc66b" opacity=".12"/>
  </g>
  <g id="garland"></g>
</g>

<!-- 러그와 선물 -->
<ellipse cx="600" cy="905" rx="350" ry="56" fill="#000" opacity=".35" filter="url(#blur6)"/>
<ellipse cx="600" cy="896" rx="340" ry="52" fill="url(#rugP)"/>
<ellipse cx="600" cy="896" rx="318" ry="44" fill="none" stroke="#e9d8b6" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"/>
<rect x="-3000" y="-3000" width="7200" height="7200" fill="url(#vignette)" pointer-events="none"/>

<g id="treeGroup">
  <g id="tree"></g>
  <g id="lights"></g>
  <g id="star"></g>
</g>
<g id="basket">
  <ellipse cx="600" cy="872" rx="108" ry="12" fill="#000" opacity=".35"/>
  <path d="M500 780H700L680 872H520Z" fill="url(#weave)"/>
  <path d="M500 780H700L680 872H520Z" fill="url(#tierShade)" opacity=".6"/>
  <rect x="492" y="772" width="216" height="16" rx="7" fill="#c99459"/>
  <rect x="492" y="772" width="216" height="5" rx="2.5" fill="#f0cf96" opacity=".5"/>
</g>
<g id="gifts">
  <g transform="translate(412 818)"><rect width="66" height="52" rx="3" fill="#a51b25"/><rect x="29" width="9" height="52" fill="#f2c66d"/><rect y="20" width="66" height="9" fill="#f2c66d"/><path d="M33 0c-14-14-26-2-14 2zM33 0c14-14 26-2 14 2z" fill="#f2c66d"/></g>
  <g transform="translate(706 830)"><rect width="56" height="44" rx="3" fill="#2a6b43"/><rect x="24" width="8" height="44" fill="#f3ead6"/><path d="M28 0c-12-12-22-2-12 2zM28 0c12-12 22-2 12 2z" fill="#f3ead6"/></g>
  <g transform="translate(756 852)"><rect width="38" height="26" rx="3" fill="#efe2c6"/><rect x="16" width="6" height="26" fill="#b3202a"/></g>
</g>
<g id="ornaments" filter="url(#ornShadow)"></g>
<g id="fx"></g>`;

  const treeG = $('#tree', svg), lightsG = $('#lights', svg), starG = $('#star', svg);
  const ornG = $('#ornaments', svg), fxG = $('#fx', svg);
  const defsEl = $('defs', svg);

  // ---------- 트리 ----------
  const CX = 600, TOP = 130, BASE = 790;
  const halfW = (y) => Math.max(0, ((y - TOP) / (BASE - TOP)) * 330);
  const TIERS = [[130, 242], [188, 352], [282, 462], [384, 572], [484, 682], [588, 794]];

  (function buildTree() {
    const rnd = mulberry(11);
    const greens = ['#4c9663', '#2f7047', '#5fae73', '#1b4a2e', '#6fbd7f'];
    TIERS.forEach(([t, b], i) => {
      const ht = i === 0 ? 0 : halfW(t) * 0.52;
      const hb = halfW(b) + 18;
      const n = 5 + i * 2;
      let d = 'M' + f1(CX - ht) + ',' + t + ' Q' + f1(CX - (ht + hb) / 2 - 12) + ',' + f1((t + b) / 2) + ' ' + f1(CX - hb) + ',' + b;
      for (let k = 0; k < n; k++) {
        const x0 = CX - hb + (2 * hb * k) / n;
        const x1 = CX - hb + (2 * hb * (k + 1)) / n;
        const tipY = b + (k === n - 1 ? 0 : rnd() * 8 - 2);
        d += ' Q' + f1((x0 + x1) / 2) + ',' + f1(b - 20 - rnd() * 6) + ' ' + f1(x1) + ',' + f1(tipY);
      }
      d += ' Q' + f1(CX + (ht + hb) / 2 + 12) + ',' + f1((t + b) / 2) + ' ' + f1(CX + ht) + ',' + t + ' Z';

      const g = el('g', {}, treeG);
      const clipId = 'tierClip' + i;
      el('path', { d }, el('clipPath', { id: clipId }, defsEl));
      el('path', { d, fill: 'url(#tierG)', filter: 'url(#tierShadow)' }, g);

      // 솔잎 질감
      const tex = el('g', { 'clip-path': 'url(#' + clipId + ')' }, g);
      const buckets = {};
      greens.forEach((c) => (buckets[c] = ''));
      const count = 170 + i * 90;
      for (let k = 0; k < count; k++) {
        const y = t + rnd() * (b - t + 12);
        const hw = ht + ((hb - ht) * (y - t)) / (b - t);
        const x = CX + (rnd() * 2 - 1) * hw;
        const dir = Math.sign(x - CX) || 1;
        const len = 5 + rnd() * 10;
        const dx = dir * (1.5 + rnd() * 6);
        const edge = Math.abs(x - CX) / Math.max(1, hw);
        const c = edge > 0.75 && rnd() < 0.6 ? greens[3] : greens[Math.floor(rnd() * greens.length)];
        buckets[c] += 'M' + f1(x) + ',' + f1(y) + 'l' + f1(dx) + ',' + f1(len);
      }
      for (const c in buckets) el('path', { d: buckets[c], stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none', opacity: 0.72 }, tex);
      el('path', { d, fill: 'url(#tierShade)' }, g);
    });

    // 전구 줄
    const r2 = mulberry(29);
    const wires = el('g', { fill: 'none', stroke: '#3a2a14', 'stroke-opacity': 0.55, 'stroke-width': 1.2 }, lightsG);
    const bulbs = el('g', { filter: 'url(#glow)' }, lightsG);
    TIERS.forEach(([t, b], i) => {
      const y0 = t + (b - t) * (i === 0 ? 0.72 : 0.58);
      const hw = halfW(y0) * 0.98 + (i === 0 ? 4 : 14);
      const tilt = (i % 2 ? 1 : -1) * 12;
      const p0 = { x: CX - hw, y: y0 - tilt }, p2 = { x: CX + hw, y: y0 + tilt }, p1 = { x: CX, y: y0 + 26 + i * 3 };
      el('path', { d: 'M' + f1(p0.x) + ',' + f1(p0.y) + ' Q' + f1(p1.x) + ',' + f1(p1.y) + ' ' + f1(p2.x) + ',' + f1(p2.y) }, wires);
      const N = Math.max(3, Math.round((2 * hw) / 30));
      for (let j = 0; j <= N; j++) {
        const u = j / N, iu = 1 - u;
        const x = iu * iu * p0.x + 2 * iu * u * p1.x + u * u * p2.x;
        const y = iu * iu * p0.y + 2 * iu * u * p1.y + u * u * p2.y;
        bulb(bulbs, x, y + 2.5, 4.3, r2);
      }
    });
    for (let k = 0; k < 46; k++) {
      const y = TOP + 40 + r2() * (BASE - TOP - 60);
      const x = CX + (r2() * 2 - 1) * halfW(y) * 0.8;
      bulb(bulbs, x, y, 2.6, r2, 0.75);
    }

    // 꼭대기 별
    el('circle', { cx: CX, cy: 116, r: 70, fill: '#ffd98a', opacity: 0.16, filter: 'url(#bigGlow)' }, starG);
    const rays = el('g', { class: 'rays', stroke: '#ffe7ab', 'stroke-opacity': 0.25, 'stroke-width': 2, 'stroke-linecap': 'round' }, starG);
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6, r0 = 48, r1 = k % 2 ? 66 : 84;
      el('line', { x1: f1(CX + r0 * Math.cos(a)), y1: f1(116 + r0 * Math.sin(a)), x2: f1(CX + r1 * Math.cos(a)), y2: f1(116 + r1 * Math.sin(a)) }, rays);
    }
    el('path', { d: window.starPath(CX, 118, 42, 18), fill: 'url(#goldG)', stroke: '#fff1c4', 'stroke-width': 2, 'stroke-linejoin': 'round', filter: 'url(#glow)' }, starG);
    el('path', { d: window.starPath(CX, 118, 22, 9), fill: '#fff6d6', opacity: 0.55 }, starG);
  })();

  function bulb(parent, x, y, r, rnd, op) {
    const warm = rnd() < 0.82;
    const c = el('circle', { cx: f1(x), cy: f1(y), r, fill: warm ? '#ffd98c' : '#ffad5c', class: 'bulb' }, parent);
    if (op) c.setAttribute('opacity', op);
    c.style.animationDelay = (-rnd() * 5).toFixed(2) + 's';
    c.style.animationDuration = (2.4 + rnd() * 3).toFixed(2) + 's';
  }

  // 창밖 눈, 벽난로 가랜드
  (function () {
    const rnd = mulberry(5);
    const snow = $('#snow', svg);
    for (let k = 0; k < 46; k++) {
      const c = el('circle', { cx: f1(86 + rnd() * 228), cy: 316, r: (0.9 + rnd() * 1.8).toFixed(2), fill: '#fff', opacity: (0.5 + rnd() * 0.5).toFixed(2), class: 'flake' }, snow);
      c.style.animationDuration = (7 + rnd() * 7).toFixed(2) + 's';
      c.style.animationDelay = (-rnd() * 14).toFixed(2) + 's';
    }
    const gar = $('#garland', svg);
    const cols = ['#f3e8d2', '#b3262e', '#2f6b45', '#d9a441'];
    el('path', { d: 'M878,548 Q1025,612 1172,548', fill: 'none', stroke: '#6b4a2a', 'stroke-width': 1.2 }, gar);
    const N = 17;
    for (let k = 0; k <= N; k++) {
      const u = k / N, iu = 1 - u;
      const x = iu * iu * 878 + 2 * iu * u * 1025 + u * u * 1172;
      const y = iu * iu * 548 + 2 * iu * u * 612 + u * u * 548;
      el('circle', { cx: f1(x), cy: f1(y + 4), r: 8.5, fill: cols[k % 4] }, gar);
      el('circle', { cx: f1(x - 2.5), cy: f1(y + 1.5), r: 3, fill: '#fff', opacity: 0.22 }, gar);
    }
  })();

  // ---------- 카메라 (화면 맞춤, 확대) ----------
  let baseBox, camBox, camRaf, focusTimer, focused = false;
  function computeBase() {
    const w = innerWidth, h = innerHeight, a = w / h;
    const W0 = 720, H0 = 880;
    let vw, vh;
    if (a > W0 / H0) { vh = H0; vw = H0 * a; } else { vw = W0; vh = W0 / a; }
    const cy = a > W0 / H0 ? 482 : 470;
    return { x: CX - vw / 2, y: cy - vh / 2, w: vw, h: vh };
  }
  function setBox(b) {
    camBox = b;
    svg.setAttribute('viewBox', [b.x, b.y, b.w, b.h].map((n) => n.toFixed(2)).join(' '));
  }
  function tweenBox(to, ms) {
    cancelAnimationFrame(camRaf);
    if (REDUCE || !camBox) return setBox(to);
    const from = Object.assign({}, camBox), t0 = performance.now();
    const step = (now) => {
      const k = ease(Math.min(1, (now - t0) / ms));
      setBox({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k });
      if (k < 1) camRaf = requestAnimationFrame(step);
    };
    camRaf = requestAnimationFrame(step);
  }
  function zoomFactor() { return clamp(scale * 0.62, 0.3, 0.55); }
  function focusOn(x, y) {
    const f = zoomFactor();
    const w = baseBox.w * f, h = baseBox.h * f;
    focused = true;
    document.body.classList.add('zoomed');
    tweenBox({ x: x - w / 2, y: y - h * 0.48, w, h }, 850);
    clearTimeout(focusTimer);
    focusTimer = setTimeout(resetCam, 5200);
  }
  function resetCam() {
    clearTimeout(focusTimer);
    if (!focused) return;
    focused = false;
    document.body.classList.remove('zoomed');
    tweenBox(baseBox, 850);
  }
  baseBox = computeBase();
  setBox(baseBox);
  addEventListener('resize', () => {
    baseBox = computeBase();
    if (!focused) { cancelAnimationFrame(camRaf); setBox(baseBox); }
  });

  // ---------- 오너먼트 배치 ----------
  function halton(i, b) {
    let f = 1, r = 0;
    while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); }
    return r;
  }
  // 자리 번호 → 트리 위 좌표. 같은 번호는 언제나 같은 자리이고, 번호가 늘어도 고르게 퍼집니다.
  function slotPos(slot) {
    const i = Number(slot) + 1;
    const u = halton(i, 2), v = halton(i, 3);
    const t = 0.08 + 0.87 * Math.sqrt(v);
    const y = TOP + t * (BASE - TOP);
    const hw = halfW(y) * 0.84;
    return { x: CX + (u * 2 - 1) * hw, y };
  }
  // 오너먼트가 많아질수록 조금씩 작아져서 겹치지 않습니다(개수 제한 없음).
  const ornScale = (n) => clamp(0.86 * Math.sqrt(40 / Math.max(40, n)), 0.3, 0.86);

  const wishes = new Map();
  const nodes = new Map();
  const recentLocal = new Map();
  let scale = ornScale(0), locked = false, firstLoad = true;

  function makeNode(w) {
    const p = slotPos(w.slot);
    const g = el('g', { class: 'orn' + (mine.has(w.id) ? ' mine' : ''), transform: 'translate(' + f1(p.x) + ',' + f1(p.y) + ')', tabindex: 0, role: 'button', 'aria-label': w.nickname + '의 소원' });
    g.dataset.id = w.id;
    g._x = p.x; g._y = p.y;
    const sway = el('g', { class: 'sway' }, g);
    sway.style.animationDelay = (-Math.random() * 7).toFixed(2) + 's';
    sway.style.animationDuration = (5 + Math.random() * 3).toFixed(2) + 's';
    const sc = el('g', { class: 'sc', transform: 'scale(' + scale.toFixed(3) + ')' }, sway);
    el('line', { x1: 0, y1: -18, x2: 0, y2: -2, class: 'thread' }, sc);
    el('circle', { cx: 0, cy: 30, r: 36, class: 'hit' }, sc);
    if (mine.has(w.id)) el('circle', { cx: 0, cy: 31, r: 33, class: 'mine-ring' }, sc);
    const u = el('use', {}, sc);
    u.setAttribute('href', '#orn-' + (ORN_BY_ID[w.ornament] ? w.ornament : 'bauble_red'));
    // 아래쪽 오너먼트가 위쪽 것을 살짝 덮도록 y 순서로 끼워 넣기
    let before = null;
    for (const c of ornG.children) if (c._y > p.y) { before = c; break; }
    ornG.insertBefore(g, before);
    return g;
  }

  function sync(list) {
    const ids = new Set(list.map((w) => w.id));
    const now = Date.now();
    for (const [id, t] of recentLocal) if (now - t > 20000) recentLocal.delete(id);
    for (const [id, node] of nodes) {
      if (!ids.has(id) && !recentLocal.has(id)) { node.remove(); nodes.delete(id); wishes.delete(id); }
    }
    const added = [];
    for (const w of list) {
      if (!wishes.has(w.id)) added.push(w);
      wishes.set(w.id, w);
    }
    const ns = ornScale(wishes.size);
    if (Math.abs(ns - scale) > 0.001) {
      scale = ns;
      for (const n of nodes.values()) n.querySelector('.sc').setAttribute('transform', 'scale(' + scale.toFixed(3) + ')');
    }
    for (const w of added) {
      const n = makeNode(w);
      nodes.set(w.id, n);
      if (!firstLoad) n.classList.add('pop');
    }
    updateCounts();
    return added;
  }

  function updateCounts() {
    $('#count').textContent = wishes.size;
    $('#mineCount').textContent = mineSorted().length;
  }
  const bySlot = (a, b) => a.slot - b.slot;
  const allSorted = () => [...wishes.values()].sort(bySlot);
  const mineSorted = () => [...wishes.values()].filter((w) => mine.has(w.id)).sort(bySlot);

  // ---------- 효과: 날아가기, 반짝임, 위치 표시 ----------
  function animate(ms, fn, done) {
    if (REDUCE) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      fn(k);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  }

  function fly(w, done) {
    const n = nodes.get(w.id);
    if (!n || REDUCE) return done();
    n.style.opacity = '0';
    const s0 = { x: camBox.x + camBox.w / 2, y: camBox.y + camBox.h + 40 };
    const e = { x: n._x, y: n._y };
    const c = { x: (s0.x + e.x) / 2 + (e.x < CX ? -140 : 140), y: Math.min(s0.y, e.y) - 200 };
    const tmp = el('g', { filter: 'url(#ornShadow)' }, fxG);
    const inner = el('g', {}, tmp);
    el('use', {}, inner).setAttribute('href', '#orn-' + w.ornament);
    animate(1150, (k) => {
      const q = ease(k), iq = 1 - q;
      const x = iq * iq * s0.x + 2 * iq * q * c.x + q * q * e.x;
      const y = iq * iq * s0.y + 2 * iq * q * c.y + q * q * e.y;
      const s = 1.7 * scale + (scale - 1.7 * scale) * q;
      tmp.setAttribute('transform', 'translate(' + f1(x) + ',' + f1(y) + ') rotate(' + f1(Math.sin(k * 9) * 14 * (1 - k)) + ') scale(' + s.toFixed(3) + ')');
    }, () => {
      tmp.remove();
      n.style.opacity = '';
      sparkle(e.x, e.y + 30 * scale);
      done();
    });
  }

  function sparkle(x, y) {
    if (REDUCE) return;
    const g = el('g', { filter: 'url(#glow)' }, fxG);
    const parts = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + Math.random() * 0.4;
      const dist = (26 + Math.random() * 40) * (0.6 + scale);
      const c = el('circle', { cx: x, cy: y, r: (1.4 + Math.random() * 2.2).toFixed(2), fill: k % 3 ? '#ffe2a0' : '#fff' }, g);
      parts.push({ c, a, dist });
    }
    animate(800, (k) => {
      const q = 1 - Math.pow(1 - k, 3);
      parts.forEach((p) => {
        p.c.setAttribute('cx', f1(x + Math.cos(p.a) * p.dist * q));
        p.c.setAttribute('cy', f1(y + Math.sin(p.a) * p.dist * q + 10 * k * k));
        p.c.setAttribute('opacity', (1 - k).toFixed(2));
      });
    }, () => g.remove());
  }

  let markerTimer;
  function showMarker(w, label) {
    const n = nodes.get(w.id);
    if (!n) return;
    fxG.querySelectorAll('.marker').forEach((m) => m.remove());
    clearTimeout(markerTimer);
    const f = zoomFactor();
    const u = (baseBox.w * f) / innerWidth; // 확대된 화면에서 1px에 해당하는 장면 단위
    const m = el('g', { class: 'marker', transform: 'translate(' + f1(n._x) + ',' + f1(n._y) + ')' }, fxG);
    const cy = 31 * scale, R = 36 * scale;
    el('circle', { cx: 0, cy, r: R, class: 'pulse' }, m);
    el('circle', { cx: 0, cy, r: R, class: 'pulse p2' }, m);
    const top = el('g', { transform: 'translate(0,' + f1(-20 * scale - 8 * u) + ') scale(' + u.toFixed(3) + ')' }, m);
    const bob = el('g', { class: 'bob' }, top);
    el('path', { d: 'M-8,-26H8V-12H15L0,2L-15,-12H-8Z', fill: '#ffd98a', stroke: '#6b4513', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, bob);
    const text = label || '여기에 달렸어요';
    const tw = text.length * 14 + 28;
    el('rect', { x: -tw / 2, y: -64, width: tw, height: 32, rx: 16, fill: '#2a1d10', 'fill-opacity': 0.9, stroke: '#f5c26b', 'stroke-width': 1.5 }, bob);
    const tx = el('text', { x: 0, y: -42.5, 'text-anchor': 'middle', class: 'marker-text' }, bob);
    tx.textContent = text;
    markerTimer = setTimeout(() => { m.classList.add('fade'); setTimeout(() => m.remove(), 600); }, 5000);
  }

  function locate(w, label) {
    const n = nodes.get(w.id);
    if (!n) return;
    focusOn(n._x, n._y + 30 * scale);
    setTimeout(() => showMarker(w, label), REDUCE ? 0 : 500);
  }

  // ---------- 소원 카드 ----------
  let cardList = [], cardIdx = 0;
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  function openCard(id) {
    cardList = (mine.has(id) ? mineSorted() : allSorted()).map((w) => w.id);
    cardIdx = Math.max(0, cardList.indexOf(id));
    renderCard();
    openModal('#cardBackdrop');
  }
  function renderCard() {
    const w = wishes.get(cardList[cardIdx]);
    if (!w) return;
    $('#cardUse').setAttribute('href', '#orn-' + (ORN_BY_ID[w.ornament] ? w.ornament : 'bauble_red'));
    $('#cardMsg').textContent = w.message;
    $('#cardName').textContent = w.nickname;
    $('#cardTime').textContent = fmtTime(w.createdAt);
    $('#cardPos').textContent = cardIdx + 1 + ' / ' + cardList.length;
    $('#cardMine').hidden = !mine.has(w.id);
  }
  $('#cardPrev').onclick = () => { cardIdx = (cardIdx - 1 + cardList.length) % cardList.length; renderCard(); };
  $('#cardNext').onclick = () => { cardIdx = (cardIdx + 1) % cardList.length; renderCard(); };

  ornG.addEventListener('click', (e) => {
    const g = e.target.closest('.orn');
    if (g) { e.stopPropagation(); openCard(g.dataset.id); }
  });
  ornG.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.orn')) { e.preventDefault(); openCard(e.target.closest('.orn').dataset.id); }
  });
  svg.addEventListener('click', () => { if (focused) resetCam(); });

  // ---------- 모달 ----------
  function openModal(sel) {
    const b = $(sel);
    b.hidden = false;
    requestAnimationFrame(() => b.classList.add('open'));
  }
  function closeModal(b) {
    b.classList.remove('open');
    setTimeout(() => (b.hidden = true), 220);
  }
  document.querySelectorAll('.backdrop').forEach((b) => {
    b.addEventListener('click', (e) => { if (e.target === b || e.target.closest('[data-close]')) closeModal(b); });
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.backdrop:not([hidden])').forEach(closeModal);
    const card = $('#cardBackdrop');
    if (!card.hidden && e.key === 'ArrowRight') $('#cardNext').click();
    if (!card.hidden && e.key === 'ArrowLeft') $('#cardPrev').click();
  });

  // ---------- 소원 쓰기 ----------
  let selected = ORN[Math.floor(Math.random() * ORN.length)].id;
  const grid = $('#ornGrid');
  ORN.forEach((o) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'orn-opt';
    b.setAttribute('role', 'radio');
    b.dataset.id = o.id;
    b.title = o.name;
    b.innerHTML = '<svg viewBox="-36 -8 72 80" aria-hidden="true"><g class="prev"><use href="#orn-' + o.id + '"/></g></svg><span>' + o.name + '</span>';
    b.onclick = () => selectOrn(o.id);
    grid.appendChild(b);
  });
  function selectOrn(id) {
    selected = id;
    grid.querySelectorAll('.orn-opt').forEach((b) => {
      const on = b.dataset.id === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on);
    });
    $('#ornName').textContent = ORN_BY_ID[id].name;
  }
  selectOrn(selected);

  const msgEl = $('#message'), nickEl = $('#nickname'), errEl = $('#writeError');
  msgEl.addEventListener('input', () => ($('#msgCount').textContent = msgEl.value.length));

  $('#btnWrite').onclick = () => {
    if (locked) return toast('지금은 소원 달기가 잠겨 있어요.');
    nickEl.value = nickEl.value || store.get('wishtree-nickname', '');
    errEl.textContent = '';
    openModal('#writeBackdrop');
    setTimeout(() => (nickEl.value ? msgEl : nickEl).focus(), 250);
  };

  let busy = false;
  $('#btnSubmit').onclick = async () => {
    if (busy) return;
    const p = { nickname: nickEl.value, message: msgEl.value, ornament: selected, deviceId };
    const err = API.validate(p);
    if (err) { errEl.textContent = err; return; }
    busy = true;
    const btn = $('#btnSubmit');
    btn.disabled = true;
    btn.textContent = '다는 중…';
    errEl.textContent = '';
    try {
      const res = await API.add(p);
      if (!res || !res.ok) { errEl.textContent = (res && res.error) || '다시 시도해 주세요.'; return; }
      const w = res.wish;
      store.set('wishtree-nickname', p.nickname.trim());
      mine.add(w.id);
      store.set(MINE_KEY, [...mine]);
      recentLocal.set(w.id, Date.now());
      msgEl.value = '';
      $('#msgCount').textContent = '0';
      closeModal($('#writeBackdrop'));
      resetCam();
      sync([...wishes.values(), w]);
      setTimeout(() => fly(w, () => setTimeout(() => locate(w), 200)), 260);
    } catch (e) {
      errEl.textContent = '연결이 불안정해요. 잠시 후 다시 시도해 주세요.';
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = '트리에 달기';
    }
  };

  // ---------- 내 오너먼트 찾기 ----------
  let mineIdx = -1;
  $('#btnMine').onclick = () => {
    const list = mineSorted();
    if (!list.length) return toast('아직 단 오너먼트가 없어요. 소원을 달아 보세요!');
    mineIdx = (mineIdx + 1) % list.length;
    locate(list[mineIdx], list.length > 1 ? '내 오너먼트 ' + (mineIdx + 1) + '/' + list.length : '내 오너먼트');
  };

  // ---------- 불러오기 ----------
  let loading = false;
  async function refresh() {
    if (loading) return;
    loading = true;
    try {
      const r = await API.list();
      if (r && r.ok) { locked = !!r.locked; sync(r.wishes || []); }
      else if (firstLoad) toast((r && r.error) || '트리를 불러오지 못했어요.');
    } catch (e) {
      if (firstLoad) toast('트리를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.');
    } finally {
      loading = false;
      firstLoad = false;
    }
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
});
