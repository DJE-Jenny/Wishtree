/* 오너먼트 10종 — 모든 그림은 고리(0,0)에서 아래로 매달리도록 그려져 있습니다. */
(function () {
  window.ORNAMENTS = [
    { id: 'bauble_red', name: '빨간 구슬' },
    { id: 'bauble_gold', name: '금빛 구슬' },
    { id: 'bauble_green', name: '초록 구슬' },
    { id: 'star', name: '별' },
    { id: 'bell', name: '종' },
    { id: 'candy_cane', name: '지팡이사탕' },
    { id: 'snowflake', name: '눈송이' },
    { id: 'gift', name: '선물상자' },
    { id: 'stocking', name: '양말' },
    { id: 'gingerbread', name: '진저브레드맨' },
  ];

  function starPath(cx, cy, R, r, n) {
    n = n || 5;
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? r : R;
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      d += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2);
    }
    return d + 'Z';
  }
  window.starPath = starPath;

  const cap =
    '<path d="M-3.2,-1 a3.2,3.2 0 1,1 6.4,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>' +
    '<rect x="-7" y="0" width="14" height="9" rx="2" fill="url(#oCap)"/>' +
    '<path d="M-7,3.2h14M-7,6.2h14" stroke="#6e4a14" stroke-width=".7" opacity=".55"/>';

  const sphere = (grad) =>
    '<circle cy="32" r="24" fill="url(#' + grad + ')"/>' +
    '<circle cy="32" r="24" fill="url(#oRim)"/>';

  const shine =
    '<ellipse cx="-9" cy="21" rx="7.5" ry="4.2" fill="#fff" opacity=".55" transform="rotate(-35 -9 21)"/>' +
    '<circle cx="-14.5" cy="30" r="1.7" fill="#fff" opacity=".55"/>' +
    '<path d="M12,47 A20,20 0 0 0 20,36" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2.2" stroke-linecap="round"/>';

  // 눈송이 팔 하나
  const arm =
    '<line x1="0" y1="0" x2="0" y2="-23"/><line x1="0" y1="-14" x2="-6.5" y2="-20"/><line x1="0" y1="-14" x2="6.5" y2="-20"/>' +
    '<line x1="0" y1="-7" x2="-4" y2="-11"/><line x1="0" y1="-7" x2="4" y2="-11"/>';
  let flakeArms = '';
  for (let i = 0; i < 6; i++) flakeArms += '<g transform="rotate(' + i * 60 + ')">' + arm + '</g>';

  const defs = `
<defs>
  <linearGradient id="oCap" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8a5d1d"/><stop offset=".45" stop-color="#fbe6a6"/><stop offset="1" stop-color="#9c6a24"/>
  </linearGradient>
  <radialGradient id="oRed" cx=".38" cy=".3" r=".78">
    <stop offset="0" stop-color="#ffa393"/><stop offset=".3" stop-color="#e03b40"/><stop offset=".78" stop-color="#8f121b"/><stop offset="1" stop-color="#560910"/>
  </radialGradient>
  <radialGradient id="oGold" cx=".38" cy=".3" r=".78">
    <stop offset="0" stop-color="#fff7d6"/><stop offset=".3" stop-color="#f2c462"/><stop offset=".78" stop-color="#a66f1e"/><stop offset="1" stop-color="#63400e"/>
  </radialGradient>
  <radialGradient id="oGreen" cx=".38" cy=".3" r=".78">
    <stop offset="0" stop-color="#c2f0c9"/><stop offset=".3" stop-color="#3f9c5e"/><stop offset=".78" stop-color="#16502e"/><stop offset="1" stop-color="#0a2a17"/>
  </radialGradient>
  <radialGradient id="oRim" cx=".5" cy=".5" r=".5">
    <stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
  </radialGradient>
  <linearGradient id="oStar" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff6cf"/><stop offset=".5" stop-color="#f2bf52"/><stop offset="1" stop-color="#a8721c"/>
  </linearGradient>
  <linearGradient id="oBell" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7a4e14"/><stop offset=".28" stop-color="#e9bf62"/><stop offset=".5" stop-color="#fff1c4"/><stop offset=".78" stop-color="#c98f34"/><stop offset="1" stop-color="#6d440f"/>
  </linearGradient>
  <linearGradient id="oGift" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#df4248"/><stop offset="1" stop-color="#8a121a"/>
  </linearGradient>
  <linearGradient id="oSock" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e0464a"/><stop offset="1" stop-color="#8c131b"/>
  </linearGradient>
  <radialGradient id="oGinger" cx=".4" cy=".35" r=".8">
    <stop offset="0" stop-color="#dc9a59"/><stop offset="1" stop-color="#94541f"/>
  </radialGradient>
  <clipPath id="oSphereClip"><circle cy="32" r="24"/></clipPath>

  <g id="orn-bauble_red">
    ${cap}${sphere('oRed')}
    <path d="M-23.6,27 Q0,36.5 23.6,27" fill="none" stroke="#f5c26b" stroke-width="1.7"/>
    <path d="M-23,37.5 Q0,47 23,37.5" fill="none" stroke="#f5c26b" stroke-width="1.7"/>
    <circle cx="-14" cy="34.6" r="1.6" fill="#ffe7ab"/><circle cx="-4.6" cy="36.6" r="1.6" fill="#ffe7ab"/>
    <circle cx="4.6" cy="36.6" r="1.6" fill="#ffe7ab"/><circle cx="14" cy="34.6" r="1.6" fill="#ffe7ab"/>
    ${shine}
  </g>

  <g id="orn-bauble_gold">
    ${cap}${sphere('oGold')}
    <g clip-path="url(#oSphereClip)" stroke="#7a4d12" stroke-width="1" opacity=".45" fill="none">
      <path d="M-30,10 L10,60 M-30,24 L-2,60 M-20,4 L22,58 M-6,4 L30,50 M30,10 L-10,60 M30,24 L2,60 M20,4 L-22,58 M6,4 L-30,50"/>
    </g>
    <circle cy="32" r="5" fill="none" stroke="#fff4cf" stroke-width="1.2" opacity=".7"/>
    ${shine}
  </g>

  <g id="orn-bauble_green">
    ${cap}${sphere('oGreen')}
    <path d="M-24,31 Q0,40 24,31" fill="none" stroke="#f3ead6" stroke-width="3.2" opacity=".92"/>
    <path d="M-23,36.5 Q0,45 23,36.5" fill="none" stroke="#c9333a" stroke-width="1.6" opacity=".9"/>
    <g fill="#f6eedc" opacity=".9">
      <circle cx="-12" cy="20" r="1.4"/><circle cx="0" cy="15" r="1.6"/><circle cx="12" cy="20" r="1.4"/>
      <circle cx="-8" cy="49" r="1.3"/><circle cx="8" cy="49" r="1.3"/><circle cx="0" cy="52" r="1.5"/>
    </g>
    ${shine}
  </g>

  <g id="orn-star">
    <path d="M-3,0 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>
    <path d="${starPath(0, 30, 27, 11.5)}" fill="url(#oStar)" stroke="#fff2c2" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="${starPath(0, 30, 27, 11.5)}" fill="none" stroke="#8c5c17" stroke-width=".6" opacity=".5" transform="translate(0 1)"/>
    <path d="M0,3 L0,30 M-25.7,21.7 L0,30 M25.7,21.7 L0,30 M-15.9,51.8 L0,30 M15.9,51.8 L0,30" stroke="#fffbe6" stroke-width=".8" opacity=".55"/>
    <ellipse cx="-6" cy="22" rx="4" ry="2.4" fill="#fff" opacity=".6" transform="rotate(-30 -6 22)"/>
  </g>

  <g id="orn-bell">
    <path d="M-3,0 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>
    <circle cy="53" r="4.6" fill="#b88a3a"/>
    <path d="M0,8 C-7,8 -11,12 -12,20 C-13,32 -15,41 -23,49 L23,49 C15,41 13,32 12,20 C11,12 7,8 0,8 Z" fill="url(#oBell)"/>
    <ellipse cy="49" rx="23.5" ry="4" fill="#a8732a"/>
    <ellipse cy="48" rx="21" ry="2.4" fill="#f5d48a" opacity=".6"/>
    <path d="M-6,16 C-8,26 -9,34 -14,42" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M0,9 C-10,1 -17,8 -11,14 C-7,16 -2,12 0,9 Z M0,9 C10,1 17,8 11,14 C7,16 2,12 0,9 Z" fill="#b3202a"/>
    <path d="M-1,10 L-6,22 L-3,21 L-1,24 Z M1,10 L6,22 L3,21 L1,24 Z" fill="#9a1922"/>
    <circle cy="9.5" r="3" fill="#d43a40"/>
  </g>

  <g id="orn-candy_cane">
    <path d="M-17,2 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6" transform="translate(11 0)"/>
    <path d="M8,66 L8,24 Q8,7 -5,7 Q-17,7 -17,19" fill="none" stroke="#fbf6ec" stroke-width="10.5" stroke-linecap="round"/>
    <path d="M8,66 L8,24 Q8,7 -5,7 Q-17,7 -17,19" fill="none" stroke="#c8222c" stroke-width="10.5" stroke-dasharray="5 6.5"/>
    <path d="M5.5,64 L5.5,24 Q5.5,10 -5,10" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M8,30 C-2,22 -6,32 1,34 C4,35 6,33 8,30 Z M8,30 C18,22 22,32 15,34 C12,35 10,33 8,30 Z" fill="#2f7d4a"/>
    <path d="M7,31 L3,42 M9,31 L13,42" stroke="#2f7d4a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="8" cy="30.5" r="2.6" fill="#3f9c5e"/>
  </g>

  <g id="orn-snowflake">
    <path d="M-3,0 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>
    <g transform="translate(0 31)" stroke-linecap="round" fill="none">
      <g stroke="#bfe3ff" stroke-opacity=".35" stroke-width="6">${flakeArms}</g>
      <g stroke="#fbf6ea" stroke-width="2.6">${flakeArms}</g>
      <circle r="4.5" fill="#fffaf0" stroke="none"/>
      <circle r="2" fill="#cfe9ff" stroke="none"/>
    </g>
  </g>

  <g id="orn-gift">
    <path d="M-3,0 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>
    <rect x="-18" y="19" width="36" height="34" rx="2.5" fill="url(#oGift)"/>
    <rect x="-18" y="19" width="36" height="6" fill="#000" opacity=".18"/>
    <rect x="-20.5" y="13" width="41" height="10" rx="2" fill="#c52d34"/>
    <rect x="-20.5" y="13" width="41" height="3" rx="1.5" fill="#fff" opacity=".18"/>
    <rect x="-3.6" y="13" width="7.2" height="40" fill="#f2c66d"/>
    <rect x="-1.2" y="13" width="1.6" height="40" fill="#fff4cf" opacity=".7"/>
    <path d="M0,13 C-10,2 -19,8 -12,13 Z M0,13 C10,2 19,8 12,13 Z" fill="#f2c66d" stroke="#b48633" stroke-width=".8"/>
    <circle cy="12.5" r="3" fill="#e5b252"/>
    <g fill="#fff" opacity=".22"><circle cx="-11" cy="33" r="1.4"/><circle cx="11" cy="41" r="1.4"/><circle cx="-10" cy="46" r="1.4"/><circle cx="10" cy="28" r="1.4"/></g>
  </g>

  <g id="orn-stocking">
    <path d="M-3,0 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>
    <path d="M-12,14 L10,14 L10,38 C10,45 17,47 22,51 C28,57 23,66 13,65 L-4,64 C-15,63 -17,53 -12,45 Z" fill="url(#oSock)"/>
    <path d="M13,65 C21,66 27,58 22,51 C19,49 15,52 14,57 C13,60 11,63 13,65 Z" fill="#2f7d4a"/>
    <path d="M-4,64 C-12,63 -16,57 -14,51 C-10,53 -6,58 -4,64 Z" fill="#2f7d4a"/>
    <g fill="#f6eedc" opacity=".75"><circle cx="-4" cy="26" r="1.5"/><circle cx="3" cy="33" r="1.5"/><circle cx="-6" cy="40" r="1.5"/><circle cx="5" cy="46" r="1.5"/></g>
    <rect x="-15.5" y="3" width="29" height="13" rx="5.5" fill="#f6eedc"/>
    <g fill="#fff"><circle cx="-11" cy="6" r="2.2"/><circle cx="-5" cy="5" r="2.4"/><circle cx="1" cy="6" r="2.2"/><circle cx="7.5" cy="5.4" r="2.3"/></g>
    <rect x="-15.5" y="12" width="29" height="4" rx="2" fill="#000" opacity=".08"/>
  </g>

  <g id="orn-gingerbread">
    <path d="M-3,1 a3,3 0 1,1 6,0" fill="none" stroke="#e9c47c" stroke-width="1.6"/>
    <g fill="url(#oGinger)" stroke="#7c4317" stroke-width=".9">
      <ellipse cx="-13" cy="33" rx="9" ry="5" transform="rotate(-20 -13 33)"/>
      <ellipse cx="13" cy="33" rx="9" ry="5" transform="rotate(20 13 33)"/>
      <ellipse cx="-8" cy="54" rx="5.6" ry="9.5" transform="rotate(15 -8 54)"/>
      <ellipse cx="8" cy="54" rx="5.6" ry="9.5" transform="rotate(-15 8 54)"/>
      <rect x="-10.5" y="24" width="21" height="27" rx="9"/>
      <circle cy="15" r="10"/>
    </g>
    <g fill="none" stroke="#fffaf0" stroke-width="1.4" stroke-linecap="round">
      <path d="M-20,31 l2,3 l2,-3 l2,3"/><path d="M14,31 l2,3 l2,-3 l2,3"/>
      <path d="M-11,59 l2,2 l2,-2 l2,2"/><path d="M5,59 l2,2 l2,-2 l2,2"/>
      <path d="M-4,18 Q0,21.5 4,18"/>
    </g>
    <circle cx="-3.5" cy="13" r="1.4" fill="#3a2010"/><circle cx="3.5" cy="13" r="1.4" fill="#3a2010"/>
    <circle cy="30" r="2.1" fill="#c8222c"/><circle cy="37" r="2.1" fill="#2f7d4a"/><circle cy="44" r="2.1" fill="#c8222c"/>
    <path d="M-7,7 Q0,3 7,7" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
  </g>
</defs>`;

  const host = document.getElementById('ornament-defs');
  if (host) host.innerHTML = defs;
})();
