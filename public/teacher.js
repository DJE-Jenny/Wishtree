/* 교사용 대시보드: 비밀번호 확인, 소원 목록, 숨김·삭제, 잠금, CSV 다운로드 */
window.WishApi.ready.then(function () {
  'use strict';
  const cfg = window.WISH_TREE_CONFIG || {};
  const API = window.WishApi;
  const owner = String(cfg.ownerName || '').trim();
  const TITLE = owner ? owner + "'s Wish Tree" : 'Wish Tree';
  const ORN_NAME = Object.fromEntries((window.ORNAMENTS || []).map((o) => [o.id, o.name]));
  const $ = (s) => document.querySelector(s);
  const PW_KEY = 'wishtree-teacher-pw:' + API.key;

  document.title = '교사용 대시보드 · ' + TITLE;
  $('#tTitle').textContent = TITLE;
  $('#note').textContent = API.demo
    ? '데모 모드입니다. 서버(Netlify)에 연결되지 않아 지금 보이는 소원은 이 브라우저에만 저장되어 있어요. Netlify에 배포하면 모두의 소원이 한곳에 모여요.'
    : '소원은 Netlify 사이트 저장소(Blobs)에 저장됩니다. 백업이 필요하면 CSV로 내려받아 두세요.';

  let password = '';
  let data = { wishes: [], locked: false };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }
  const fmt = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function call(action, extra) {
    try {
      const r = await API.admin(password, action, extra);
      if (!r || !r.ok) { toast((r && r.error) || '요청이 처리되지 않았어요.'); return null; }
      return r;
    } catch (e) {
      toast('연결이 불안정해요. 잠시 후 다시 시도해 주세요.');
      return null;
    }
  }

  async function login(pw, silent) {
    password = pw;
    $('#loginError').textContent = '';
    $('#btnLogin').disabled = true;
    try {
      const r = await API.admin(pw, 'list');
      if (!r || !r.ok) {
        sessionStorage.removeItem(PW_KEY);
        if (!silent) $('#loginError').textContent = (r && r.error) || '비밀번호가 맞지 않아요.';
        return;
      }
      sessionStorage.setItem(PW_KEY, pw);
      data = r;
      $('#login').hidden = true;
      $('#dash').hidden = false;
      render();
    } catch (e) {
      $('#loginError').textContent = '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
    } finally {
      $('#btnLogin').disabled = false;
    }
  }

  async function reload() {
    const r = await call('list');
    if (r) { data = r; render(); }
  }

  function sorted() {
    return [...(data.wishes || [])].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  function render() {
    const all = sorted();
    const q = $('#q').value.trim().toLowerCase();
    const list = q ? all.filter((w) => (w.nickname + ' ' + w.message).toLowerCase().includes(q)) : all;
    const hidden = all.filter((w) => w.hidden).length;
    $('#sTotal').textContent = all.length;
    $('#sShown').textContent = all.length - hidden;
    $('#sHidden').textContent = hidden;
    $('#sLock').textContent = data.locked ? '잠김' : '열림';
    $('#btnLock').textContent = data.locked ? '소원 달기 열기' : '소원 달기 잠그기';
    $('#empty').hidden = all.length > 0;
    $('#rows').innerHTML = list.map((w) => {
      const n = all.indexOf(w) + 1;
      return '<tr class="' + (w.hidden ? 'hidden-row' : '') + '">' +
        '<td class="nowrap">' + n + '</td>' +
        '<td class="nowrap">' + esc(fmt(w.createdAt)) + '</td>' +
        '<td class="nowrap">' + esc(w.nickname) + '</td>' +
        '<td class="nowrap">' + esc(ORN_NAME[w.ornament] || w.ornament) + '</td>' +
        '<td class="msg">' + esc(w.message) + '</td>' +
        '<td class="nowrap">' + (w.hidden ? '<span class="badge off">숨김</span>' : '<span class="badge">보임</span>') + '</td>' +
        '<td><div class="acts">' +
          '<button class="t-btn small" data-act="hide" data-id="' + esc(w.id) + '">' + (w.hidden ? '보이기' : '숨기기') + '</button>' +
          '<button class="t-btn small danger" data-act="delete" data-id="' + esc(w.id) + '">삭제</button>' +
        '</div></td></tr>';
    }).join('');
  }

  $('#rows').addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const w = (data.wishes || []).find((x) => x.id === b.dataset.id);
    if (!w) return;
    b.disabled = true;
    if (b.dataset.act === 'hide') {
      if (await call('hide', { id: w.id, hidden: !w.hidden })) toast(w.hidden ? '다시 트리에 보여요.' : '트리에서 숨겼어요.');
    } else if (confirm('“' + w.nickname + '”의 소원을 완전히 삭제할까요? 되돌릴 수 없어요.')) {
      if (await call('delete', { id: w.id })) toast('삭제했어요.');
    }
    b.disabled = false;
    reload();
  });

  $('#btnLock').onclick = async () => {
    if (await call('lock', { locked: !data.locked })) { toast(data.locked ? '소원 달기를 열었어요.' : '소원 달기를 잠갔어요.'); reload(); }
  };
  $('#btnRefresh').onclick = () => reload().then(() => toast('새로 불러왔어요.'));
  $('#q').addEventListener('input', render);
  $('#btnLogout').onclick = () => {
    sessionStorage.removeItem(PW_KEY);
    password = '';
    $('#dash').hidden = true;
    $('#login').hidden = false;
    $('#pw').value = '';
  };

  // CSV: 엑셀에서 한글이 깨지지 않도록 BOM을 붙이고, 수식으로 해석될 수 있는 값은 앞에 '를 붙입니다.
  function csvCell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  $('#btnCsv').onclick = () => {
    const rows = [['번호', '작성 시각', '닉네임', '오너먼트', '소원', '상태']];
    sorted().forEach((w, i) => rows.push([i + 1, fmt(w.createdAt), w.nickname, ORN_NAME[w.ornament] || w.ornament, w.message, w.hidden ? '숨김' : '보임']));
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const safe = (owner || 'my').replace(/[^\w가-힣-]+/g, '_');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = safe + '-wish-tree-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  $('#btnLogin').onclick = () => login($('#pw').value.trim());
  $('#pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') login($('#pw').value.trim()); });

  const saved = sessionStorage.getItem(PW_KEY);
  if (saved) login(saved, true);
  else setTimeout(() => $('#pw').focus(), 100);
});
