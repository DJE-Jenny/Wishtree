/* 저장소 연결: Netlify에 배포되면 /api(Netlify Blobs)에 저장, 그 외(로컬 파일, GitHub Pages 등)에서는 데모 모드 */
(function () {
  'use strict';
  const API_URL = '/api';
  const DEMO_KEY = 'wishtree-demo-v1';
  const DEMO_PASSWORD = '1004'; // 데모 모드 전용
  const ORNAMENT_IDS = (window.ORNAMENTS || []).map((o) => o.id);

  const BAD_WORDS = ['시발', '씨발', 'ㅅㅂ', 'ㅆㅂ', '병신', '개새', '좆', '존나', '지랄', 'fuck', 'shit', 'bitch'];
  const normalize = (s) => String(s || '').toLowerCase().replace(/[\s.,!?~\-_*'"`·:;()[\]{}]/g, '');
  const hasBadWord = (s) => { const n = normalize(s); return BAD_WORDS.some((w) => n.includes(w)); };
  function validate(p) {
    const nick = String(p.nickname || '').trim();
    const msg = String(p.message || '').trim();
    if (nick.length < 2 || nick.length > 10) return '닉네임은 2~10자로 써 주세요.';
    if (!ORNAMENT_IDS.includes(p.ornament)) return '오너먼트를 골라 주세요.';
    if (!msg) return '소원을 적어 주세요.';
    if (msg.length > 100) return '소원은 100자까지 쓸 수 있어요.';
    if (hasBadWord(nick) || hasBadWord(msg)) return '고운 말로 다시 써 볼까요?';
    return '';
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---------- 서버(Netlify) ----------
  async function serverGet(params) {
    const r = await fetch(API_URL + '?' + new URLSearchParams(params), { cache: 'no-store' });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('json')) throw new Error('no api');
    return r.json();
  }
  async function serverPost(body) {
    const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('json')) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // ---------- 데모(이 브라우저에만 저장) ----------
  function demoLoad() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || { wishes: [], nextSlot: 0, locked: false }; }
    catch (e) { return { wishes: [], nextSlot: 0, locked: false }; }
  }
  function demoSave(d) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch (e) { /* 무시 */ } }
  const pub = (w) => ({ id: w.id, nickname: w.nickname, ornament: w.ornament, message: w.message, slot: w.slot, createdAt: w.createdAt });

  const demo = {
    async list() { const d = demoLoad(); return { ok: true, locked: d.locked, wishes: d.wishes.filter((w) => !w.hidden).map(pub) }; },
    async add(p) {
      const d = demoLoad();
      if (d.locked) return { ok: false, error: '지금은 소원 달기가 잠겨 있어요.' };
      const w = { id: uid(), nickname: p.nickname.trim(), ornament: p.ornament, message: p.message.trim(), slot: d.nextSlot++, createdAt: new Date().toISOString(), hidden: false };
      d.wishes.push(w);
      demoSave(d);
      return { ok: true, wish: pub(w) };
    },
    async admin(password, action, extra) {
      if (String(password) !== DEMO_PASSWORD) return { ok: false, error: '비밀번호가 맞지 않아요.' };
      const d = demoLoad();
      if (action === 'list') return { ok: true, locked: d.locked, wishes: d.wishes };
      if (action === 'hide') { const w = d.wishes.find((x) => x.id === extra.id); if (w) w.hidden = !!extra.hidden; }
      else if (action === 'delete') d.wishes = d.wishes.filter((x) => x.id !== extra.id);
      else if (action === 'lock') d.locked = !!extra.locked;
      demoSave(d);
      return { ok: true };
    },
  };

  // 처음 한 번 /api가 살아 있는지 확인해서 모드를 정합니다.
  const isFile = location.protocol === 'file:';
  const ready = (isFile ? Promise.resolve(false) : serverGet({ action: 'ping' }).then((r) => !!(r && r.ok)).catch(() => false))
    .then((server) => {
      window.WishApi.demo = !server;
      window.WishApi.key = server ? 'server:' + location.host : 'demo';
      return server;
    });

  window.WishApi = {
    demo: true,
    key: 'demo',
    ready,
    validate,

    async list() {
      return (await ready) ? serverGet({ action: 'list' }) : demo.list();
    },
    async add(p) {
      const err = validate(p);
      if (err) return { ok: false, error: err };
      const clean = { nickname: p.nickname.trim(), message: p.message.trim(), ornament: p.ornament, deviceId: p.deviceId };
      return (await ready) ? serverPost(Object.assign({ action: 'add' }, clean)) : demo.add(clean);
    },
    // action: 'list' | 'hide' | 'delete' | 'lock'
    async admin(password, action, extra) {
      extra = extra || {};
      return (await ready)
        ? serverPost(Object.assign({ action: 'admin_' + action, password }, extra))
        : demo.admin(password, action, extra);
    },
  };
})();
