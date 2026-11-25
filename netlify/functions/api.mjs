/**
 * Wish Tree 서버 — Netlify Function + Netlify Blobs
 *
 * 따로 설정할 것이 없습니다. Netlify에 배포하면 /api 주소로 자동 동작하고,
 * 소원은 이 사이트 전용 저장소(Netlify Blobs)에 저장됩니다.
 *
 * 교사 비밀번호: 기본 1004
 *   바꾸려면 Netlify → Site configuration → Environment variables에
 *   TEACHER_PASSWORD 를 추가하고 다시 배포하세요. (코드를 고칠 필요 없음)
 */
import { getStore } from '@netlify/blobs';

const DEFAULT_PASSWORD = '1004';
const BOARD_KEY = 'board';
const ORNAMENT_IDS = ['bauble_red', 'bauble_gold', 'bauble_green', 'star', 'bell', 'candy_cane', 'snowflake', 'gift', 'stocking', 'gingerbread'];
const BAD_WORDS = ['시발', '씨발', 'ㅅㅂ', 'ㅆㅂ', '병신', '개새', '좆', '존나', '지랄', 'fuck', 'shit', 'bitch'];
const POST_INTERVAL_MS = 10_000; // 같은 기기에서 연속으로 달 수 있는 최소 간격

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

function teacherPassword() {
  const fromEnv = (globalThis.Netlify && Netlify.env && Netlify.env.get('TEACHER_PASSWORD')) || process.env.TEACHER_PASSWORD;
  return String(fromEnv || DEFAULT_PASSWORD).trim();
}

const store = () => getStore({ name: 'wish-tree', consistency: 'strong' });
const emptyBoard = () => ({ wishes: [], nextSlot: 0, locked: false, recent: {} });

async function readBoard(s) {
  const res = await s.getWithMetadata(BOARD_KEY, { type: 'json' });
  if (!res || !res.data) return { board: emptyBoard(), etag: null };
  return { board: Object.assign(emptyBoard(), res.data), etag: res.etag };
}

/**
 * 여러 학생이 동시에 달아도 서로 덮어쓰지 않도록, 읽은 뒤 바뀌지 않았을 때만 저장합니다.
 * 바뀌었으면 다시 읽고 다시 시도합니다.
 */
async function updateBoard(mutate) {
  const s = store();
  for (let attempt = 0; attempt < 12; attempt++) {
    const { board, etag } = await readBoard(s);
    const result = mutate(board);
    if (result && result.abort) return result.abort;
    const opts = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
    const { modified } = await s.setJSON(BOARD_KEY, board, opts);
    if (modified) return result.value;
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120 * (attempt + 1)));
  }
  return { ok: false, error: '사람이 많아 잠시 붐비고 있어요. 다시 눌러 주세요.' };
}

const normalize = (s) => String(s || '').toLowerCase().replace(/[\s.,!?~\-_*'"`·:;()[\]{}]/g, '');
const hasBadWord = (s) => { const n = normalize(s); return BAD_WORDS.some((w) => n.includes(w)); };
const publicView = (w) => ({ id: w.id, nickname: w.nickname, ornament: w.ornament, message: w.message, slot: w.slot, createdAt: w.createdAt });
const adminView = (w) => Object.assign(publicView(w), { hidden: !!w.hidden });

async function addWish(p) {
  const nickname = String(p.nickname || '').trim();
  const message = String(p.message || '').trim();
  const ornament = String(p.ornament || '');
  const deviceId = String(p.deviceId || '').slice(0, 40);

  if (nickname.length < 2 || nickname.length > 10) return { ok: false, error: '닉네임은 2~10자로 써 주세요.' };
  if (!ORNAMENT_IDS.includes(ornament)) return { ok: false, error: '오너먼트를 골라 주세요.' };
  if (!message) return { ok: false, error: '소원을 적어 주세요.' };
  if (message.length > 100) return { ok: false, error: '소원은 100자까지 쓸 수 있어요.' };
  if (hasBadWord(nickname) || hasBadWord(message)) return { ok: false, error: '고운 말로 다시 써 볼까요?' };

  return updateBoard((b) => {
    if (b.locked) return { abort: { ok: false, error: '지금은 소원 달기가 잠겨 있어요.' } };
    const now = Date.now();
    for (const k in b.recent) if (now - b.recent[k] > POST_INTERVAL_MS) delete b.recent[k];
    if (deviceId && b.recent[deviceId]) {
      return { abort: { ok: false, error: '잠깐만요! 10초 뒤에 다시 달 수 있어요.' } };
    }
    const w = { id: crypto.randomUUID(), nickname, ornament, message, slot: b.nextSlot, createdAt: new Date(now).toISOString(), hidden: false };
    b.nextSlot += 1;
    b.wishes.push(w);
    if (deviceId) b.recent[deviceId] = now;
    return { value: { ok: true, wish: publicView(w) } };
  });
}

export default async (req) => {
  try {
    if (req.method === 'GET') {
      const action = new URL(req.url).searchParams.get('action') || 'list';
      if (action === 'ping') return json({ ok: true, message: 'Wish Tree 서버가 잘 동작하고 있어요.' });
      if (action === 'list') {
        const { board } = await readBoard(store());
        return json({ ok: true, locked: !!board.locked, wishes: board.wishes.filter((w) => !w.hidden).map(publicView) });
      }
      return json({ ok: false, error: '알 수 없는 요청이에요.' }, 400);
    }

    if (req.method !== 'POST') return json({ ok: false, error: '허용되지 않는 요청이에요.' }, 405);
    let body;
    try { body = await req.json(); } catch (e) { return json({ ok: false, error: '잘못된 요청이에요.' }, 400); }

    if (body.action === 'add') return json(await addWish(body));

    if (String(body.action || '').startsWith('admin_')) {
      if (String(body.password || '') !== teacherPassword()) return json({ ok: false, error: '비밀번호가 맞지 않아요.' });
      switch (body.action) {
        case 'admin_list': {
          const { board } = await readBoard(store());
          return json({ ok: true, locked: !!board.locked, wishes: board.wishes.map(adminView) });
        }
        case 'admin_hide':
          return json(await updateBoard((b) => {
            const w = b.wishes.find((x) => x.id === body.id);
            if (!w) return { abort: { ok: false, error: '이미 지워진 소원이에요.' } };
            w.hidden = !!body.hidden;
            return { value: { ok: true } };
          }));
        case 'admin_delete':
          return json(await updateBoard((b) => {
            b.wishes = b.wishes.filter((x) => x.id !== body.id);
            return { value: { ok: true } };
          }));
        case 'admin_lock':
          return json(await updateBoard((b) => {
            b.locked = !!body.locked;
            return { value: { ok: true } };
          }));
      }
    }
    return json({ ok: false, error: '알 수 없는 요청이에요.' }, 400);
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: '서버에 잠시 문제가 생겼어요. 다시 시도해 주세요.' }, 500);
  }
};

export const config = { path: '/api' };
