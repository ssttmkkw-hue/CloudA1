'use strict';
/* ==========================================================
   战斗界面：棋盘渲染、手牌、交互
   ========================================================== */
const S = { mode: 'idle', sel: null, card: null, sk: null, hl: new Map(), danger: false, inspect: null, units: new Map(), tileEls: [] };
const stHTML = u => Object.entries(u.st).filter(([k, v]) => v > 0 && STN[k]).map(([k, v]) => `<i title="${STN[k][0]}">${STN[k][1]}${v > 1 || ['burn', 'poison', 'str', 'thorns'].includes(k) ? v : ''}</i>`).join('');
const tileGlyph = (t, ri) => t.trap ? '🪤' : t.t === 'wall' ? REGIONS[ri].wall : t.t === 'hazard' ? REGIONS[ri].hazard : t.t === 'spring' ? '⛲' : '';

function clearSel() { S.mode = 'idle'; S.sel = null; S.card = null; S.sk = null; S.inspect = null; }

V.start = function () {
  S.units.forEach(e => e.remove()); S.units.clear(); clearSel(); S.danger = false;
  const b = $('#board'); if (!b) return;
  b.innerHTML = '<div id="tlayer"></div><div id="ulayer"></div><div id="flayer"></div>';
  const tl = $('#tlayer'); S.tileEls = [];
  for (let y = 0; y < BH; y++) {
    S.tileEls[y] = [];
    for (let x = 0; x < BW; x++) {
      const d = document.createElement('div'); d.dataset.x = x; d.dataset.y = y; d.style.setProperty('--x', x); d.style.setProperty('--y', y);
      tl.appendChild(d); S.tileEls[y][x] = d;
    }
  }
};
function computeHL() {
  const hl = new Map(); S.hl = hl;
  if (!B || B.over || B.phase !== 'player') return;
  const set = (x, y, t) => { const k = kxy(x, y); if (!hl.has(k) || t === 'at') hl.set(k, t); };
  if (S.mode === 'unit' && S.sel) {
    const u = S.sel;
    if (!u.moved && !u.acted) for (const t of reach(u).values()) set(t.x, t.y, 'mv');
    if (!u.acted) for (const f of foesOf(u)) { const at = approachTile(u, f); if (at) set(f.x, f.y, at.x === u.x && at.y === u.y ? 'at' : 'at2'); }
  } else if (S.mode === 'skill' && S.sel && S.sk) {
    for (const t of skillTargets(S.sel, S.sk)) set(t.x, t.y, 'sk');
  } else if (S.mode === 'card' && S.card) {
    for (const t of cardTargets(S.card)) set(t.x, t.y, 'cd');
  }
}
V.sync = function () {
  const board = $('#board'); if (!board || !B || !S.tileEls.length) return;
  if (S.sel && (!B.units.includes(S.sel) || S.sel.hp <= 0)) clearSel();
  if (S.inspect && (!B.units.includes(S.inspect) || S.inspect.hp <= 0)) S.inspect = null;
  computeHL();
  const dz = S.danger ? dangerSet() : null;
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    const el = S.tileEls[y][x], t = B.tiles[y][x], k = kxy(x, y), h = S.hl.get(k);
    el.className = 'tile ' + t.t + ((x + y) % 2 ? ' alt' : '') + (t.trap ? ' trap' : '') + (h ? ' hl-' + h : '') + (dz && dz.has(k) ? ' danger' : '');
    const g = tileGlyph(t, B.region); if (el.textContent !== g) el.textContent = g;
  }
  const seen = new Set();
  for (const u of B.units) {
    if (u.dead && u !== B.hero) continue;
    seen.add(u.uid);
    let el = S.units.get(u.uid);
    if (!el) {
      el = document.createElement('div'); el.dataset.uid = u.uid;
      el.innerHTML = '<div class="u-emoji"></div><div class="u-hp"><i></i><span></span></div><div class="u-blk"></div><div class="u-st"></div><b class="u-atk"></b><em class="u-el"></em>';
      el.querySelector('.u-emoji').textContent = u.emoji;
      $('#ulayer').appendChild(el); S.units.set(u.uid, el);
      el.classList.add('spawn');
    }
    el.style.setProperty('--x', u.x); el.style.setProperty('--y', u.y);
    el.className = 'unit ' + (u.side === 'p' ? 'ally' : 'foe') + ' k-' + u.kind + (u.boss ? ' boss' : '') + (u.elite ? ' elite' : '') +
      (S.sel === u ? ' sel' : '') + (S.inspect === u ? ' insp' : '') + (u.side === 'p' && B.phase === 'player' && u.acted && u.moved ? ' done' : '') +
      (u.hp <= 0 ? ' dead' : '') + (el.classList.contains('spawn') ? ' spawn' : '') + (el.classList.contains('dying') ? ' dying' : '');
    if (u.elem) el.dataset.el = u.elem; else delete el.dataset.el;
    el.querySelector('.u-hp i').style.width = Math.max(0, u.hp / u.maxhp * 100) + '%';
    el.querySelector('.u-hp span').textContent = Math.max(0, u.hp);
    el.querySelector('.u-blk').textContent = u.block > 0 ? '🛡' + u.block : '';
    el.querySelector('.u-st').innerHTML = stHTML(u);
    el.querySelector('.u-atk').textContent = u.atk + (u.st.str || 0);
    el.querySelector('.u-el').textContent = u.elem ? ELEM[u.elem].e : '';
    setTimeout(() => el.classList.remove('spawn'), 400 * (SPEED || 0.01));
  }
  for (const [id, el] of S.units) if (!seen.has(id) && !el.classList.contains('dying')) { el.remove(); S.units.delete(id); }
  renderTop(); renderPanel(); renderHand(); renderBottom();
};

function renderTop() {
  const h = B.hero, run = G.run, r = REGIONS[B.region];
  $('#b-region').textContent = `${r.emoji} ${r.n} · 回合${B.turn}`;
  $('#b-hpfill').style.width = Math.max(0, h.hp / h.maxhp * 100) + '%';
  $('#b-hptxt').textContent = `❤ ${Math.max(0, h.hp)}/${h.maxhp}` + (h.block ? `  🛡${h.block}` : '');
  $('#b-gold').textContent = '💰' + run.gold + '  💎' + run.crystals;
}
function renderBottom() {
  $('#b-energy').textContent = B.energy; $('#b-emax').textContent = '/' + (B.maxEnergy + (B.pw.nrg || 0));
  $('#b-draw').textContent = B.draw.length; $('#b-disc').textContent = B.disc.length;
  const et = $('#b-end'); et.disabled = !(B.phase === 'player' && !B.busy && !B.over);
  et.classList.toggle('glow', B.phase === 'player' && !B.busy && !B.hand.some(c => canPlay(c)));
  $('#b-danger').classList.toggle('on', S.danger);
}
function unitSummary(u) {
  const stat = `<span>❤${u.hp}/${u.maxhp}</span><span>⚔${u.atk + (u.st.str || 0)}</span><span>👣${u.mov}</span><span>🎯${u.rng}</span>`;
  const el = u.elem ? `<em class="chip el-${u.elem}">${ELEM[u.elem].e}${ELEM[u.elem].n}</em>` : '';
  return `<div class="pn-head"><div class="pn-emoji">${u.emoji}</div><div class="pn-main"><div class="pn-name">${esc(u.name)}${u.lv ? ' Lv' + u.lv : ''} ${el}${u.boss ? '<em class="chip boss">首领</em>' : ''}${u.elite ? '<em class="chip elite">精英</em>' : ''}</div><div class="pn-stats">${stat}</div><div class="pn-st">${stHTML(u)}</div></div></div>`;
}
function renderPanel() {
  const p = $('#bpanel'); if (!p) return;
  if (S.mode === 'card' && S.card) {
    const d = cdef(S.card), noTarget = d.tg === 's' || d.tg === 'z';
    const hint = noTarget ? '' : (S.hl.size ? '<b class="warn">选择高亮的目标</b>' : '<b class="warn">范围内没有合适目标</b>');
    p.innerHTML = `<div class="pn-scroll pn-card"><div class="pn-cname"><span class="cost">${d.cost}</span>${esc(d.n)} <em class="chip">${TYPE_N[d.ty]}</em></div><div class="pn-cdesc">${esc(cardDesc(d))} ${hint}</div></div>
      <div class="pn-btns">${noTarget ? '<button class="btn pri" data-a="card-use">使用</button>' : ''}<button class="btn" data-a="card-cancel">取消</button></div>`;
    return;
  }
  const u = S.sel || S.inspect;
  if (u) {
    let html = unitSummary(u), btns = '', more = '';
    if (u.side === 'p' && S.sel === u) {
      const sk = u.sks[0];
      if (u.acted && u.moved) more += '<div class="pn-note">已行动</div>';
      else more += `<div class="pn-note">${u.moved ? '' : '点击蓝色格移动；'}点击敌人即可攻击</div>`;
      if (sk) {
        const s = SK[sk.k], disabled = u.acted || sk.cd > 0;
        btns += `<button class="btn skill${S.mode === 'skill' ? ' on' : ''}" data-a="ub-skill" ${disabled ? 'disabled' : ''}>✨${s.n}${sk.cd > 0 ? ` (${sk.cd})` : ''}</button>`;
        more += `<div class="pn-sk">✨${s.n}：${skillDesc(sk.k, u.atk)}（冷却${s.cd}）</div>`;
      }
      if (u.kind === 'hero') more += `<div class="pn-sk">被动：${CLASSES[G.run.cls].pas}</div>`;
      btns += `<button class="btn" data-a="ub-wait" ${u.acted && u.moved ? 'disabled' : ''}>待机</button>`;
    } else {
      const caps = u.side === 'e' && !u.minion ? `<div class="pn-sk">🔮击败后收服率：${Math.round(captureChance({ sp: u.sp, elite: u.elite, mark: u.markBonus }, G.run) * 100)}%</div>` : '';
      more += caps;
      more += u.sks.map(sk => `<div class="pn-sk">✨${SK[sk.k].n}：${skillDesc(sk.k, u.atk)}${sk.cd > 0 ? `（冷却${sk.cd}）` : ''}</div>`).join('');
      if (u.ps && PS[u.ps]) more += `<div class="pn-sk">被动·${PS[u.ps][0]}：${PS[u.ps][1]}</div>`;
    }
    p.innerHTML = `<div class="pn-scroll">${html}${more}</div>` + (btns ? `<div class="pn-btns">${btns}</div>` : '');
    return;
  }
  const idle = side('p').filter(x => !(x.acted && x.moved)).length;
  p.innerHTML = `<div class="pn-hint">${B.phase === 'player' ? `点击己方单位行动 · 点击手牌使用卡牌<br><span class="dim">${idle ? idle + ' 个单位尚未行动' : '所有单位已行动'} · 点击敌人查看详情</span>` : '敌方行动中……'}</div>`;
}
function renderHand() {
  const h = $('#bhand'); if (!h) return;
  const n = B.hand.length, cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || (window.innerHeight <= 700 ? 76 : 84);
  const avail = (h.clientWidth || 380) - 16, need = n * cw + (n - 1) * 5;
  const ov = n > 1 && need > avail ? Math.min(44, (need - avail) / (n - 1)) : 0;
  h.innerHTML = '<div class="hand-in" style="--ov:' + ov.toFixed(1) + 'px">' + B.hand.map((c, i) => {
    const d = cdef(c), ok = canPlay(c), sel = S.card === c;
    const tc = d.soul ? 'soul' : d.ty;
    return `<div class="card t-${tc}${ok ? '' : ' off'}${sel ? ' sel' : ''}${d.up ? ' up' : ''}" data-i="${i}">
      <div class="c-cost">${d.cost >= 99 ? '✖' : d.cost}</div>
      <div class="c-name">${esc(d.n)}</div>
      <div class="c-art">${cardArt(d)}</div>
      <div class="c-type">${d.soul ? ELEM[d.elem].n + '·召唤' : TYPE_N[d.ty]}</div>
      <div class="c-desc">${esc(cardDesc(d))}</div></div>`;
  }).join('') + '</div>' || '';
  if (!n) h.innerHTML = '<div class="dim empty-hand">手牌已空</div>';
}

/* ---------- 交互 ---------- */
function toast(msg, ms = 1400) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
async function onTile(x, y) {
  if (!B || B.busy || B.phase !== 'player' || B.over) return;
  const u = unitAt(x, y), k = kxy(x, y), h = S.hl.get(k);
  if (S.mode === 'card') {
    if (h === 'cd') { const c = S.card; clearSel(); await playCard(c, { x, y }); return; }
    clearSel(); V.sync(); return;
  }
  if (S.mode === 'skill') {
    const un = S.sel, sk = S.sk;
    if (h === 'sk') { clearSel(); await unitSkill(un, sk, { x, y }); if (un.hp > 0 && B.units.includes(un)) { S.sel = un; S.mode = 'unit'; } V.sync(); return; }
    S.mode = 'unit'; S.sk = null; V.sync(); return;
  }
  if (S.mode === 'unit') {
    const s = S.sel;
    if (u === s) { clearSel(); V.sync(); return; }
    if (u && u.side === 'p') { clearSel(); S.sel = u; S.mode = 'unit'; V.sync(); return; }
    if (u && u.side === 'e') {
      if (!s.acted && approachTile(s, u)) { await playerAttackAuto(s, u); if (s.hp > 0 && B.units.includes(s)) { S.sel = s; S.mode = 'unit'; } V.sync(); return; }
      clearSel(); S.inspect = u; V.sync(); return;
    }
    if (h === 'mv') { await playerMove(s, x, y); V.sync(); return; }
    clearSel(); V.sync(); return;
  }
  // idle
  if (u && u.side === 'p') { clearSel(); S.sel = u; S.mode = 'unit'; }
  else if (u) { clearSel(); S.inspect = u; }
  else clearSel();
  V.sync();
}
async function useCardNow() {
  const c = S.card; if (!c) return; clearSel(); await playCard(c, null);
}
function onCard(i) {
  if (!B || B.busy || B.phase !== 'player' || B.over) return;
  const c = B.hand[i]; if (!c) return;
  const d = cdef(c);
  if (S.card === c) { if (d.tg === 's' || d.tg === 'z') { useCardNow(); } else { clearSel(); V.sync(); } return; }
  if (d.unplay) { toast('这张牌无法打出'); return; }
  if (B.energy < d.cost) { toast('能量不足！'); return; }
  clearSel(); S.mode = 'card'; S.card = c; V.sync();
  if ((d.tg === 'e' || d.tg === 'a' || d.tg === 't') && !S.hl.size) toast('范围内没有合适目标');
}
function showPile(which) {
  const list = (which === 'draw' ? B.draw : B.disc).map(c => cdef(c));
  const cnt = {}; list.forEach(d => { cnt[d.n] = (cnt[d.n] || 0) + 1; });
  const rows = Object.entries(cnt).sort().map(([n, c]) => `<div class="row"><span>${esc(n)}</span><b>×${c}</b></div>`).join('') || '<div class="dim">空</div>';
  showModal(`<h3>${which === 'draw' ? '抽牌堆（顺序随机）' : '弃牌堆'} · ${list.length}</h3><div class="list">${rows}</div><div class="btnrow"><button class="btn" data-a="modal-close">关闭</button></div>`);
}

/* ---------- 视觉特效 ---------- */
const posOf = t => ({ x: t.x, y: t.y });
V.float = function (t, text, cls) {
  const f = $('#flayer'); if (!f || !t) return;
  const e = document.createElement('div'); e.className = 'float ' + (cls || '');
  e.textContent = text; e.style.setProperty('--x', t.x); e.style.setProperty('--y', t.y); e.style.setProperty('--dx', (rnd(21) - 10) + 'px');
  f.appendChild(e); setTimeout(() => e.remove(), 1100 * SPEED + 5);
};
V.flash = function (u) { const e = S.units.get(u.uid); if (e) { e.classList.add('hit'); setTimeout(() => e.classList.remove('hit'), 300 * SPEED + 5); } };
V.hit = function (u, d, taken, em) {
  const e = S.units.get(u.uid);
  if (taken > 0) V.float(u, '-' + taken, em > 1 ? 'crit' : em < 1 ? 'weak' : 'dmg');
  else V.float(u, '格挡', 'block');
  if (em > 1) setTimeout(() => V.float(u, '克制!', 'crit'), 60 * SPEED);
  else if (em < 1) setTimeout(() => V.float(u, '抵抗', 'dim'), 60 * SPEED);
  if (e) { e.classList.add('hit'); setTimeout(() => e.classList.remove('hit'), 320 * SPEED + 5); }
  V.sync();
};
V.die = function (u) {
  const e = S.units.get(u.uid); if (!e) return;
  e.classList.add('dying'); setTimeout(() => { e.remove(); S.units.delete(u.uid); }, 480 * SPEED + 5);
};
V.pulse = async function (u) { const e = S.units.get(u.uid); if (e) { e.classList.add('pulse'); await sleep(260); e.classList.remove('pulse'); } };
V.lunge = async function (a, b) {
  const e = S.units.get(a.uid); if (!e) return;
  const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
  e.style.setProperty('--lx', dx * 14 + 'px'); e.style.setProperty('--ly', dy * 14 + 'px');
  e.classList.add('lunge'); await sleep(170); e.classList.remove('lunge');
};
V.proj = async function (a, b, emoji) {
  const l = $('#flayer'); if (!l) return;
  const e = document.createElement('div'); e.className = 'proj'; e.textContent = emoji;
  e.style.setProperty('--x', a.x); e.style.setProperty('--y', a.y); l.appendChild(e);
  void e.offsetWidth; e.style.setProperty('--x', b.x); e.style.setProperty('--y', b.y);
  await sleep(230); e.remove();
};
V.aoe = function (c, r, el) {
  const l = $('#flayer'); if (!l) return;
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    if (dist({ x, y }, c) <= r && T(x, y).t !== 'wall') {
      const e = document.createElement('div'); e.className = 'aoe' + (el ? ' el-' + el : ''); e.style.setProperty('--x', x); e.style.setProperty('--y', y);
      l.appendChild(e); setTimeout(() => e.remove(), 520 * SPEED + 5);
    }
  }
};
V.banner = async function (text) {
  const b = $('#banner'); if (!b) return;
  b.textContent = text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  await sleep(750); b.classList.remove('show');
};

/* ---------- 棋盘外壳 ---------- */
function battleShell() {
  return `<div class="b-top">
      <div class="b-hero"><div class="b-hpbar"><i id="b-hpfill"></i><span id="b-hptxt"></span></div><div class="b-sub"><span id="b-region"></span><span id="b-gold"></span></div></div>
      <button class="icon-btn" data-a="bmenu">☰</button>
    </div>
    <div class="b-boardwrap"><div class="board" id="board"></div><div id="banner" class="banner"></div></div>
    <div class="b-panel" id="bpanel"></div>
    <div class="b-hand" id="bhand"></div>
    <div class="b-bottom">
      <div class="energy"><b id="b-energy">3</b><span id="b-emax">/3</span><small>能量</small></div>
      <button class="pile" data-a="pile-draw">🂠<b id="b-draw">0</b><small>抽牌</small></button>
      <button class="pile" data-a="pile-disc">🗑<b id="b-disc">0</b><small>弃牌</small></button>
      <button class="pile" id="b-danger" data-a="danger">⚠<small>危险区</small></button>
      <button class="btn pri end" id="b-end" data-a="endturn">结束回合</button>
    </div>`;
}
