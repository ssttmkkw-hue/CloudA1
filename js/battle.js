'use strict';
/* ==========================================================
   战斗引擎：战棋网格 + 卡牌 + 灵魂召唤
   ========================================================== */
const BW = 6, BH = 7;
let B = null;           // 当前战斗状态
const V = {};           // 视图钩子（由 ui.js 实现）
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inb = (x, y) => x >= 0 && y >= 0 && x < BW && y < BH;
const T = (x, y) => inb(x, y) ? B.tiles[y][x] : null;
const unitAt = (x, y) => B.units.find(u => u.hp > 0 && u.x === x && u.y === y);
const side = s => B.units.filter(u => u.side === s && u.hp > 0);
const foesOf = u => B.units.filter(x => x.side !== u.side && x.hp > 0);
const frOf = u => B.units.filter(x => x.side === u.side && x.hp > 0);
const kxy = (x, y) => x + ',' + y;
const isFly = u => u.ps === 'fly';

/* ---------- 英雄属性 ---------- */
function heroMods(run) { return sumMods([run.gear.weapon, run.gear.armor, run.gear.charm]); }
function heroMaxHp(run) { return CLASSES[run.cls].hp + (run.hpBonus || 0) + (heroMods(run).hp || 0); }
function partyMax(run) { return 3 + (run.cls === 'summoner' ? 1 : 0) + (heroMods(run).party || 0) + (G.meta.up.party || 0); }
function recalcHero(run, oldMax) {
  const nm = heroMaxHp(run);
  if (oldMax != null && nm > oldMax) run.hp += nm - oldMax;
  run.hp = clamp(run.hp, 1, nm);
}

/* ---------- 地图生成 ---------- */
function genTiles(regionIdx) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const tiles = Array.from({ length: BH }, () => Array.from({ length: BW }, () => ({ t: 'floor' })));
    const nW = rr(3, 6);
    for (let i = 0; i < nW; i++) { const x = rnd(BW), y = rr(1, 5); tiles[y][x] = { t: 'wall' }; }
    if (regionIdx > 0) for (let i = 0, n = rr(1, 3); i < n; i++) { const x = rnd(BW), y = rr(2, 4); if (tiles[y][x].t === 'floor') tiles[y][x] = { t: 'hazard' }; }
    if (chance(.45)) { const x = rnd(BW), y = rr(3, 5); if (tiles[y][x].t === 'floor') tiles[y][x] = { t: 'spring' }; }
    // 连通性检查
    const seen = new Set([kxy(2, 6)]), q = [[2, 6]]; let ok = false;
    while (q.length) { const [x, y] = q.shift(); if (y === 0) ok = true; for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (inb(nx, ny) && tiles[ny][nx].t !== 'wall' && !seen.has(kxy(nx, ny))) { seen.add(kxy(nx, ny)); q.push([nx, ny]); } } }
    if (ok && tiles[6][2].t === 'floor') return tiles;
  }
  return Array.from({ length: BH }, () => Array.from({ length: BW }, () => ({ t: 'floor' })));
}

/* ---------- 单位工厂 ---------- */
function mkUnit(o) {
  return Object.assign({ uid: uid('u'), hp: 1, maxhp: 1, atk: 1, mov: 3, rng: 1, block: 0, st: {}, sks: [], ps: '', moved: false, acted: false, x: 0, y: 0, markBonus: 0 }, o);
}
function makeEnemy(spec, x, y) {
  const sp = SPECIES[spec.sp];
  const lv = spec.lv || (sp.boss ? 8 : STAGE_LV[sp.stage - 1]);
  const m = statMult(sp, lv, 1), sc = spec.scale || 1;
  const el = spec.elite ? 1 : 0;
  const hp = Math.round(sp.hp * m * sc * (el ? 1.4 : 1) * (spec.hpMul || 1));
  const atk = Math.max(1, Math.round(sp.atk * m * Math.pow(sc, .8) * (el ? 1.2 : 1) * 0.92));
  const u = mkUnit({
    side: 'e', kind: 'enemy', name: (el ? '精英·' : '') + sp.name, emoji: sp.emoji, elem: sp.elem, sp: sp.id, stage: sp.stage, role: sp.role,
    hp, maxhp: hp, atk, mov: sp.mov, rng: sp.rng, ps: sp.ps || (el ? 'tough' : ''), lv, x, y, elite: !!el, boss: !!sp.boss, minion: !!spec.minion
  });
  const keys = [sp.sk].concat(sp.bossSk || []);
  u.sks = keys.map(k => ({ k, cd: rnd(2) }));
  if (u.ps === 'swift') u.mov += 0; // 已包含在物种中
  return u;
}
function makeToken(id, owner, x, y) {
  const t = TOKENS[id];
  let m = 1;
  if (owner.side === 'p') m = 1 + 0.25 * (B.pw.sboost || 0); else m = (owner.enemyScale || 1);
  const hp = Math.round(t.hp * m * (owner.side === 'p' ? 1 + ((heroMods(G.run).sHp || 0) / 100) : 1));
  const atk = Math.max(1, Math.round(t.atk * m * (owner.side === 'p' ? 1 + ((heroMods(G.run).sAtk || 0) / 100) : 1)));
  return mkUnit({
    side: owner.side, kind: owner.side === 'p' ? 'token' : 'enemy', name: t.n, emoji: t.emoji, elem: t.elem, sp: 'tok_' + id, stage: 1, role: t.role, hp, maxhp: hp, atk,
    mov: t.mov, rng: t.rng, ps: t.ps || '', x, y, minion: true, sks: t.sk ? [{ k: t.sk, cd: 0 }] : [], tokenId: id
  });
}
function makeSoulUnit(soul, x, y) {
  const sp = SPECIES[soul.sp], m = statMult(sp, soul.lv, soul.star);
  const gm = sumMods([soul.gear]), hm = heroMods(G.run);
  const boost = 1 + 0.25 * (B.pw.sboost || 0);
  const hp = Math.round((sp.hp * m + (gm.hp || 0)) * (1 + (hm.sHp || 0) / 100) * boost);
  const atk = Math.max(1, Math.round((sp.atk * m + (gm.atk || 0)) * (1 + (hm.sAtk || 0) / 100) * boost));
  return mkUnit({
    side: 'p', kind: 'soul', name: sp.name, emoji: sp.emoji, elem: sp.elem, sp: sp.id, stage: sp.stage, role: sp.role, hp, maxhp: hp, atk,
    mov: sp.mov + (gm.mov || 0), rng: sp.rng + (gm.rng || 0), ps: sp.ps || '', x, y, soulUid: soul.uid, lv: soul.lv, star: soul.star,
    sks: [{ k: sp.sk, cd: 0 }]
  });
}
function makeHero(run) {
  const c = CLASSES[run.cls], gm = heroMods(run);
  const maxhp = heroMaxHp(run);
  const u = mkUnit({
    side: 'p', kind: 'hero', name: c.n, emoji: c.emoji, elem: null, sp: 'hero', stage: 1, role: 'hero', hp: run.hp, maxhp, atk: c.atk + (gm.atk || 0),
    mov: c.mov + (gm.mov || 0) + (run.cls === 'assassin' ? 1 : 0), rng: c.rng + (gm.rng || 0), x: 2, y: 6
  });
  if (gm.str) u.st.str = gm.str;
  if (gm.thorns) u.st.thorns = gm.thorns;
  return u;
}

/* ==========================================================
   战斗开始
   ========================================================== */
function startBattle(run, enc) {
  return new Promise(resolve => {
    const hero = makeHero(run);
    B = {
      tiles: genTiles(enc.region), units: [hero], hero, turn: 0, phase: 'player', busy: true, over: null, enc, region: enc.region,
      pw: {}, energy: 0, maxEnergy: CLASSES[run.cls].en + (heroMods(run).energy || 0), hand: [], draw: [], disc: [], exh: [],
      kills: [], fallen: [], deployed: new Set(), resolve, log: [], selected: null, stats: { dealt: 0, taken: 0 }
    };
    // 友军起始
    hero.block = (run.cls === 'knight' ? 6 : 0) + (heroMods(run).armor || 0);
    if (run.cls === 'ranger') hero.st.focus = 1;
    // 敌人布阵
    const used = new Set();
    const place = (spec, boss) => {
      let x, y, tries = 0;
      do { x = boss ? 2 + rnd(2) : rnd(BW); y = boss ? 0 : rnd(3); tries++; } while ((used.has(kxy(x, y)) || T(x, y).t === 'wall') && tries < 60);
      used.add(kxy(x, y));
      const e = makeEnemy(spec, x, y); e.enemyScale = spec.scale || 1; B.units.push(e);
    };
    enc.enemies.forEach(sp => place(sp, sp.boss));
    // 牌组
    const cards = run.deck.map(c => Object.assign({}, c, { iid: uid('c') }));
    run.party.forEach(suid => {
      const s = run.souls.find(x => x.uid === suid);
      if (s && !s.rest) { cards.push(Object.assign(soulCardDef(s, spCost(SPECIES[s.sp])), { iid: uid('c') })); }
    });
    B.draw = shuf(cards);
    V.start && V.start();
    startPlayerTurn(true);
  });
}

/* ---------- 回合 ---------- */
function startSide(sd) {
  for (const u of side(sd)) {
    u.block = 0;
    if (u.ps === 'tough') u.block += 3;
    if (u.kind === 'hero' && B.pw.fort) u.block += B.pw.fort;
    if (u.kind === 'soul' || u.kind === 'token') { if (B.pw.sbond) u.block += B.pw.sbond; }
    if (u.st.poison > 0) { directLoss(u, u.st.poison, 'poison'); u.st.poison--; }
    if (u.hp > 0 && u.st.burn > 0) { directLoss(u, u.st.burn, 'burn'); u.st.burn--; }
    if (u.hp <= 0) continue;
    const t = T(u.x, u.y);
    if (u.ps === 'regen') healUnit(u, 2);
    if (t && t.t === 'spring') healUnit(u, 4);
    if (u.kind === 'hero' && B.pw.regen) healUnit(u, B.pw.regen);
    if (sd === 'p' && B.pw.aura) healUnit(u, B.pw.aura);
    if (sd === 'p' && G.run.cls === 'priest') healUnit(u, 1);
    u.sks.forEach(s => { if (s.cd > 0) s.cd--; });
    u.moved = u.acted = false;
    if (u.st.stun > 0) { u.moved = u.acted = true; }
  }
}
function endSide(sd) {
  for (const u of side(sd)) for (const k of ['weak', 'vuln', 'stun', 'taunt']) if (u.st[k] > 0) u.st[k]--;
}
function directLoss(u, n, why) {
  if (u.hp <= 0) return;
  u.hp -= n; V.float && V.float(u, '-' + n, why === 'poison' ? 'poison' : 'burn'); V.flash && V.flash(u);
  if (u.hp <= 0) killUnit(u, null);
}
function healUnit(u, n) {
  if (u.hp <= 0 || n <= 0) return 0;
  const before = u.hp; u.hp = Math.min(u.maxhp, u.hp + n);
  if (u.hp > before) { V.float && V.float(u, '+' + (u.hp - before), 'heal'); Snd.play('heal'); }
  return u.hp - before;
}

async function startPlayerTurn(first) {
  B.turn++; B.phase = 'player'; B.busy = true;
  startSide('p');
  if (B.hero.hp <= 0) return checkEnd();
  B.energy = B.maxEnergy + (B.pw.nrg || 0);
  if (B.pw.focus) B.hero.st.focus = (B.hero.st.focus || 0) + B.pw.focus;
  const gm = heroMods(G.run);
  drawCards(5 + (gm.draw || 0) + (B.pw.draw || 0));
  V.sync && V.sync();
  V.banner && await V.banner(first ? '战斗开始！' : `第 ${B.turn} 回合`);
  B.busy = false;
  if (checkEnd()) return;
  V.sync && V.sync();
}
function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (B.hand.length >= 10) break;
    if (!B.draw.length) { if (!B.disc.length) break; B.draw = shuf(B.disc); B.disc = []; }
    B.hand.push(B.draw.pop());
  }
}
async function endPlayerTurn() {
  if (B.busy || B.phase !== 'player' || B.over) return;
  B.busy = true; B.selected = null;
  // 手牌弃置 & 诅咒
  for (const c of B.hand) { const d = cdef(c); if (d.endHurt) directLoss(B.hero, d.endHurt, 'curse'); }
  if (B.hero.hp <= 0) { checkEnd(); return; }
  B.disc.push(...B.hand.filter(c => !cdef(c).ethereal)); B.hand = [];
  endSide('p');
  V.sync && V.sync();
  await enemyTurn();
}

async function enemyTurn() {
  B.phase = 'enemy';
  startSide('e');
  V.sync && V.sync();
  if (checkEnd()) return;
  V.banner && await V.banner('敌方回合');
  const order = side('e').sort((a, b) => dist(a, B.hero) - dist(b, B.hero));
  for (const u of order) {
    if (u.hp <= 0 || B.over) continue;
    await enemyAct(u);
    if (checkEnd()) return;
  }
  endSide('e');
  if (checkEnd()) return;
  await startPlayerTurn();
}

function checkEnd() {
  if (B.over) { finishSoon(); return true; }
  if (B.hero.hp <= 0) { B.over = 'lose'; finishSoon(); return true; }
  if (!side('e').length) { B.over = 'win'; finishSoon(); return true; }
  return false;
}
let _fin = false;
async function finishSoon() {
  if (_fin) return; _fin = true;
  B.busy = true; V.sync && V.sync();
  await sleep(700);
  _fin = false;
  const r = B.resolve; B.resolve = null;
  if (r) r({ win: B.over === 'win', hp: B.hero.hp, kills: B.kills, fallen: B.fallen, deployed: [...B.deployed], turns: B.turn });
}

/* ==========================================================
   移动 / 可达性
   ========================================================== */
function reach(u, maxMov) {
  maxMov = maxMov == null ? u.mov : maxMov;
  const out = new Map(), seen = new Set([kxy(u.x, u.y)]);
  const q = [{ x: u.x, y: u.y, d: 0 }];
  while (q.length) {
    const c = q.shift();
    if (c.d >= maxMov) continue;
    for (const [dx, dy] of DIRS) {
      const nx = c.x + dx, ny = c.y + dy; if (!inb(nx, ny)) continue;
      const k = kxy(nx, ny); if (seen.has(k)) continue;
      const tl = T(nx, ny); const wall = tl.t === 'wall';
      if (wall && !isFly(u)) continue;
      const oc = unitAt(nx, ny);
      if (oc && oc.side !== u.side) continue;
      seen.add(k);
      const nd = c.d + 1;
      if (!oc && !wall) out.set(k, { x: nx, y: ny, d: nd });
      q.push({ x: nx, y: ny, d: nd });
    }
  }
  return out;
}
function freeAdj(c, ref) {
  const arr = [];
  for (const [dx, dy] of DIRS) { const x = c.x + dx, y = c.y + dy; if (inb(x, y) && T(x, y).t !== 'wall' && !unitAt(x, y)) arr.push({ x, y }); }
  if (ref) arr.sort((a, b) => dist(a, ref) - dist(b, ref));
  return arr;
}
async function moveUnit(u, x, y, quiet) {
  u.x = x; u.y = y;
  V.sync && V.sync();
  await sleep(quiet ? 120 : 220);
  await landOn(u);
}
async function landOn(u) {
  const t = T(u.x, u.y); if (!t || u.hp <= 0) return;
  if (t.trap && t.trap.side !== u.side) {
    const d = t.trap.dmg; t.trap = null;
    V.float && V.float(u, '陷阱!', 'warn');
    await hurt(null, u, d, { noThorn: 1 });
  } else if (t.t === 'hazard' && !isFly(u)) {
    V.float && V.float(u, '灼烧地面', 'warn');
    await hurt(null, u, 4, { noThorn: 1 });
  }
}

/* ==========================================================
   伤害 / 治疗 / 状态
   ========================================================== */
function estDmg(src, tgt, base, el) {
  let d = base + (src ? (src.st.str || 0) : 0);
  if (src && src.st.weak > 0) d *= 0.75;
  if (tgt.st.vuln > 0) d *= 1.5;
  d *= el ? elemMult(el, tgt.elem) : 1;
  return Math.max(1, Math.round(d));
}
async function hurt(src, tgt, base, o) {
  o = o || {};
  if (tgt.hp <= 0) return 0;
  let d = base + (src ? (src.st.str || 0) : 0);
  if (src && src.st.weak > 0) d *= 0.75;
  if (tgt.st.vuln > 0) d *= 1.5;
  const em = o.el ? elemMult(o.el, tgt.elem) : 1; d *= em;
  if (src && src.kind === 'hero') {
    if (G.run.cls === 'mage' && o.el && o.card) d += 2;
    if (G.run.cls === 'assassin' && tgt.st.poison > 0) d += 2;
  }
  d = Math.max(1, Math.round(d));
  let taken = d;
  if (tgt.block > 0) { const ab = Math.min(tgt.block, taken); tgt.block -= ab; taken -= ab; if (ab) Snd.play('block'); }
  tgt.hp -= taken;
  if (src && src.side === 'p') B.stats.dealt += taken; if (tgt.kind === 'hero') B.stats.taken += taken;
  V.hit && V.hit(tgt, d, taken, em);
  Snd.play(em > 1 ? 'crit' : 'hit');
  if (src && src.ps === 'vamp' || (o.drain && src)) { if (src) healUnit(src, Math.max(1, Math.round(taken * (o.drain ? 0.5 : 0.3)))); }
  if (tgt.ps === 'rage' && taken > 0) tgt.st.str = (tgt.st.str || 0) + 1;
  if (src && !o.noThorn && tgt.st.thorns > 0 && dist(src, tgt) <= 1 && src.hp > 0) { await sleep(120); await hurt(tgt, src, tgt.st.thorns, { noThorn: 1 }); }
  if (tgt.ps === 'thorns' && src && !o.noThorn && dist(src, tgt) <= 1 && src.hp > 0) { await sleep(100); await hurt(tgt, src, 2, { noThorn: 1 }); }
  if (tgt.hp <= 0) killUnit(tgt, src, o);
  await sleep(taken > 0 ? 170 : 90);
  return taken;
}
function killUnit(u, killer, o) {
  if (u.dead) return;
  u.dead = true; u.hp = 0;
  V.die && V.die(u);
  if (u.side === 'e' && !u.minion && !(o && o.noCapture)) B.kills.push({ sp: u.sp, elite: u.elite, boss: u.boss, mark: u.markBonus || 0, lv: u.lv });
  if (u.kind === 'soul') B.fallen.push(u.soulUid);
  if (u.boss && u.side === 'e') { for (const e of side('e')) if (e !== u) { e.noCapture = 1; e.hp = 0; e.dead = true; V.die && V.die(e); } }
  B.units = B.units.filter(x => !x.dead || x === B.hero);
  if (u === B.hero) B.over = 'lose';
}
function addStatus(u, s, v) {
  if (u.hp <= 0) return;
  if (s === 'stun' || s === 'taunt') u.st[s] = Math.max(u.st[s] || 0, v);
  else u.st[s] = (u.st[s] || 0) + v;
  V.float && V.float(u, STN[s][1] + STN[s][0] + (['stun', 'taunt'].includes(s) ? '' : ' +' + v), DEBUFFS.includes(s) ? 'debuff' : 'buff');
}

/* ==========================================================
   效果解释器（卡牌 & 技能共用）
   ========================================================== */
function fxVal(f, src) { return f.v != null ? f.v : Math.round((f.m || 0) * src.atk); }
function lineUnits(src, tgt, rngMax, filt) {
  const n = Math.max(Math.abs(tgt.x - src.x), Math.abs(tgt.y - src.y)); if (!n) return [];
  const total = Math.max(n, rngMax || n), out = [];
  for (let k = 1; k <= total; k++) {
    const x = Math.round(src.x + (tgt.x - src.x) * k / n), y = Math.round(src.y + (tgt.y - src.y) * k / n);
    if (!inb(x, y)) break;
    const u = unitAt(x, y); if (u && filt(u) && !out.includes(u)) out.push(u);
  }
  return out;
}
function sel(f, ctx, def) {
  const src = ctx.src, on = f.on || def;
  const foes = foesOf(src), fr = frOf(src);
  switch (on) {
    case 'self': return [src];
    case 'allies': return fr;
    case 'souls': return fr.filter(u => u.kind !== 'hero');
    case 'enemies': return foes;
    case 'target': return ctx.tgt ? [ctx.tgt] : [];
    default: { // foes (区域)
      if (f.all) return foes;
      const c = f.ctr === 'self' ? src : (ctx.tgt || ctx.tile);
      if (f.line && ctx.tgt) return lineUnits(src, ctx.tgt, ctx.rng, u => u.side !== src.side);
      if (f.r != null && c) return foes.filter(u => dist(u, c) <= f.r);
      return ctx.tgt && ctx.tgt.side !== src.side ? [ctx.tgt] : [];
    }
  }
}
async function runFx(list, ctx) {
  for (const f of list) {
    if (B.over && B.over !== 'win') break;
    if (ctx.src.hp <= 0 && f.t !== 'die') break;
    await FX[f.t](f, ctx);
  }
}
const projEmoji = el => el ? ({ fire: '🔥', water: '💧', wood: '🍃', thunder: '⚡', dark: '🌑', light: '✨' }[el]) : '✦';
const FX = {
  async dmg(f, ctx) {
    const src = ctx.src, targets = sel(f, ctx, 'foes');
    if (!targets.length) return;
    const hits = f.n || 1;
    const el = f.el || (src.kind === 'hero' ? null : src.elem);
    const first = ctx.tgt && ctx.tgt.side !== src.side ? ctx.tgt : targets[0];
    if (!f.all && f.ctr !== 'self' && first) { dist(src, first) > 1 ? await (V.proj && V.proj(src, first, projEmoji(el))) : await (V.lunge && V.lunge(src, first)); }
    else if (f.ctr === 'self') await (V.pulse && V.pulse(src));
    if ((f.r || f.all) && V.aoe) V.aoe(ctx.tgt || ctx.tile || src, f.all ? 9 : f.r, el);
    for (let i = 0; i < hits; i++) {
      for (const t of targets.slice()) {
        if (t.hp <= 0) continue;
        let base = fxVal(f, src);
        if (f.pb) base += src.block;
        if (f.pa) base *= Math.max(1, frOf(src).filter(x => x.kind !== 'hero').length);
        if (ctx.focus) base *= 2;
        await hurt(src, t, base, { el, drain: f.drain, card: ctx.card && ctx.card.ty === 'A' });
        if (ctx.card && ctx.card.ty === 'A' && B.pw.venom && t.hp > 0) addStatus(t, 'poison', B.pw.venom);
      }
      if (hits > 1) await sleep(70);
    }
  },
  async chain(f, ctx) {
    const src = ctx.src; let cur = ctx.tgt; if (!cur) return;
    const el = f.el || (src.kind === 'hero' ? null : src.elem);
    const hitSet = [cur]; let base = fxVal(f, src);
    if (V.proj) await V.proj(src, cur, projEmoji(el));
    await hurt(src, cur, ctx.focus ? base * 2 : base, { el, card: ctx.card && ctx.card.ty === 'A' });
    for (let i = 0; i < (f.n || 2); i++) {
      const cands = foesOf(src).filter(u => !hitSet.includes(u) && dist(u, cur) <= (f.r || 2)).sort((a, b) => dist(a, cur) - dist(b, cur));
      if (!cands.length) break;
      base = Math.max(1, Math.round(base * 0.7));
      if (V.proj) await V.proj(cur, cands[0], projEmoji(el));
      cur = cands[0]; hitSet.push(cur);
      await hurt(src, cur, base, { el });
    }
  },
  async blk(f, ctx) {
    for (const t of sel(f, ctx, 'self')) { t.block += fxVal(f, ctx.src); V.float && V.float(t, '🛡️+' + fxVal(f, ctx.src), 'block'); Snd.play('block'); }
    await sleep(80);
  },
  async heal(f, ctx) { for (const t of sel(f, ctx, 'self')) healUnit(t, fxVal(f, ctx.src)); await sleep(100); },
  async st(f, ctx) {
    const isDeb = DEBUFFS.includes(f.s);
    const targets = sel(f, ctx, isDeb ? 'foes' : 'self');
    for (const t of targets) { if (t.hp > 0) addStatus(t, f.s, f.v); }
    await sleep(100);
  },
  async str(f, ctx) { for (const t of sel(f, ctx, 'self')) { t.st.str = (t.st.str || 0) + fxVal(f, ctx.src); V.float && V.float(t, '💪+' + f.v, 'buff'); } await sleep(100); },
  async draw(f) { drawCards(f.v); V.sync && V.sync(); await sleep(80); },
  async nrg(f) { B.energy += f.v; V.float && V.float(B.hero, '⚡+' + f.v, 'buff'); await sleep(80); },
  async hurt(f, ctx) { const u = ctx.src; u.hp = Math.max(1, u.hp - f.v); V.float && V.float(u, '-' + f.v, 'dmg'); V.flash && V.flash(u); await sleep(150); },
  async push(f, ctx) { for (const t of sel(f, ctx, 'foes')) await forceMove(t, ctx.src, f.v, false); },
  async pull(f, ctx) { for (const t of sel(f, ctx, 'foes')) await forceMove(t, ctx.src, f.v, true); },
  async tp(f, ctx) { if (!ctx.tile) return; await V.pulse?.(ctx.src); ctx.src.x = ctx.tile.x; ctx.src.y = ctx.tile.y; V.sync(); await sleep(200); await landOn(ctx.src); },
  async dash(f, ctx) {
    const t = ctx.tgt; if (!t) return;
    if (dist(ctx.src, t) === 1) return;
    const spots = freeAdj(t, ctx.src); if (!spots.length) return;
    await moveUnit(ctx.src, spots[0].x, spots[0].y, true);
  },
  async sum(f, ctx) {
    const src = ctx.src, n = f.n || 1;
    const origin = ctx.tile || src;
    let spots = [];
    const around = (c, r) => { const arr = []; for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { if (T(x, y).t !== 'wall' && !unitAt(x, y) && dist({ x, y }, c) <= r) arr.push({ x, y }); } return arr.sort((a, b) => dist(a, origin) - dist(b, origin)); };
    if (ctx.tile && !unitAt(ctx.tile.x, ctx.tile.y)) spots.push({ x: ctx.tile.x, y: ctx.tile.y });
    for (const p of around(origin, 2)) { if (!spots.some(s => s.x === p.x && s.y === p.y)) spots.push(p); }
    for (let i = 0; i < n && i < spots.length; i++) {
      const tk = makeToken(f.id, src, spots[i].x, spots[i].y);
      if (src.side === 'p') tk.moved = tk.acted = false;
      else tk.moved = tk.acted = true;
      B.units.push(tk); Snd.play('summon'); V.sync(); V.float && V.float(tk, '召唤!', 'buff'); await sleep(200);
    }
  },
  async mark(f, ctx) { for (const t of sel(f, ctx, 'foes')) { t.markBonus = (t.markBonus || 0) + f.v; V.float && V.float(t, '🔖灵魂标记', 'buff'); } await sleep(100); },
  async trap(f, ctx) { if (!ctx.tile) return; T(ctx.tile.x, ctx.tile.y).trap = { dmg: f.v, side: ctx.src.side }; V.sync(); V.float && V.float(ctx.tile, '🪤', 'buff'); await sleep(120); },
  async det(f, ctx) {
    for (const t of sel(f, ctx, 'foes')) { const n = t.st.burn || 0; if (n) { t.st.burn = 0; await hurt(ctx.src, t, f.v * n, { el: 'fire', card: true }); } else V.float && V.float(t, '无灼烧', 'dim'); }
  },
  async dblp(f, ctx) { for (const t of sel(f, ctx, 'foes')) { if (t.st.poison) { t.st.poison *= 2; V.float && V.float(t, '☠️×2', 'debuff'); } } await sleep(100); },
  async refresh(f, ctx) {
    const list = f.on === 'souls' ? frOf(ctx.src).filter(u => u.kind !== 'hero') : sel(f, ctx, 'target').filter(u => u.kind !== 'hero');
    for (const t of list) { t.moved = t.acted = false; V.float && V.float(t, '再行动!', 'buff'); } await sleep(100);
  },
  async sac(f, ctx) { const t = ctx.tgt; if (t && t.kind !== 'hero') { V.float && V.float(t, '献祭', 'warn'); killUnit(t, ctx.src, { noCapture: 1 }); V.sync(); await sleep(250); } },
  async gold(f) { G.run.gold += f.v; V.float && V.float(B.hero, '💰+' + f.v, 'buff'); await sleep(80); },
  async crystal(f) { G.run.crystals += f.v; V.float && V.float(B.hero, '💎+' + f.v, 'buff'); await sleep(80); },
  async cleanse(f, ctx) { for (const t of sel(f, ctx, 'self')) { DEBUFFS.forEach(k => delete t.st[k]); V.float && V.float(t, '净化', 'heal'); } await sleep(100); },
  async die(f, ctx) { const u = ctx.src; V.float && V.float(u, '💥', 'warn'); await sleep(150); killUnit(u, null, { noCapture: 1 }); },
  async pw(f, ctx) {
    const h = B.hero;
    if (f.k === 'thorns') h.st.thorns = (h.st.thorns || 0) + f.v;
    else if (f.k === 'swift') h.mov += f.v;
    else B.pw[f.k] = (B.pw[f.k] || 0) + f.v;
    V.float && V.float(h, '能力!', 'buff'); await sleep(150);
  }
};
async function forceMove(t, src, n, toward) {
  let sx = Math.sign(t.x - src.x), sy = Math.sign(t.y - src.y);
  if (Math.abs(t.x - src.x) >= Math.abs(t.y - src.y)) sy = 0; else sx = 0;
  if (toward) { sx = -sx; sy = -sy; }
  for (let i = 0; i < n; i++) {
    const nx = t.x + sx, ny = t.y + sy;
    if (toward && dist({ x: nx, y: ny }, src) < 1) break;
    if (!inb(nx, ny) || (T(nx, ny).t === 'wall' && !isFly(t)) || unitAt(nx, ny)) { if (!toward) await hurt(null, t, 3, { noThorn: 1 }); break; }
    if (toward && unitAt(nx, ny)) break;
    t.x = nx; t.y = ny; V.sync(); await sleep(130);
  }
  await landOn(t);
}

/* ==========================================================
   卡牌
   ========================================================== */
function cardCost(c) { return cdef(c).cost; }
function canPlay(c) {
  const d = cdef(c);
  return !B.busy && B.phase === 'player' && !B.over && !d.unplay && B.energy >= d.cost;
}
function validTile(x, y, needEmpty) { const t = T(x, y); return t && t.t !== 'wall' && (!needEmpty || !unitAt(x, y)); }
function cardTargets(c) { // 返回 [{x,y}]
  const d = cdef(c), h = B.hero, out = [];
  if (d.tg === 'e') {
    const hasDash = d.fx.some(f => f.t === 'dash');
    for (const u of side('e')) { const k = dist(h, u); if (k >= 1 && k <= d.rng && (!hasDash || k === 1 || freeAdj(u).length)) out.push({ x: u.x, y: u.y }); }
  } else if (d.tg === 'a') {
    for (const u of side('p')) { if (dist(h, u) <= d.rng) { if (d.fx.some(f => f.t === 'refresh' || f.t === 'sac') && u.kind === 'hero') continue; out.push({ x: u.x, y: u.y }); } }
  } else if (d.tg === 't') {
    const dmgy = d.fx.some(f => f.t === 'dmg') || d.fx.some(f => f.t === 'st' && f.r);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const k = dist(h, { x, y }); if (k > d.rng || k < (dmgy ? 1 : 1)) continue;
      if (!validTile(x, y, !dmgy)) continue; out.push({ x, y });
    }
  }
  return out;
}
async function playCard(c, tile) {
  const d = cdef(c); if (!canPlay(c)) return false;
  B.busy = true; B.selected = null;
  B.energy -= d.cost;
  B.hand = B.hand.filter(x => x !== c);
  Snd.play('card');
  const ctx = { src: B.hero, card: d, tile: tile ? { x: tile.x, y: tile.y } : null, tgt: null, rng: d.rng };
  if (tile && (d.tg === 'e' || d.tg === 'a')) ctx.tgt = unitAt(tile.x, tile.y);
  if (d.ty === 'A' && B.hero.st.focus > 0) { ctx.focus = true; }
  V.sync && V.sync();
  if (d.soul) {
    const s = G.run.souls.find(x => x.uid === d.soul);
    const u = makeSoulUnit(s, tile.x, tile.y);
    B.units.push(u); B.deployed.add(s.uid); Snd.play('summon');
    V.sync(); V.float && V.float(u, '召唤!', 'buff'); await sleep(260);
  } else {
    await runFx(d.fx, ctx);
  }
  if (ctx.focus) { B.hero.st.focus = Math.max(0, B.hero.st.focus - 1); }
  // 弃牌堆处理
  if (d.soul || d.exhaust || d.ty === 'P') B.exh.push(c); else B.disc.push(c);
  B.busy = false;
  V.sync && V.sync();
  checkEnd();
  return true;
}

/* ==========================================================
   单位行动：普攻 / 技能
   ========================================================== */
function atkTargets(u, from) {
  from = from || u; return foesOf(u).filter(f => { const d = dist(from, f); return d >= 1 && d <= u.rng; });
}
function skillTargets(u, sk, from) { // 返回 [{x,y}]（'s','z' 返回 [] 表示无需目标）
  from = from || u; const s = SK[sk.k], out = [];
  if (s.tg === 'e') {
    const dash = s.fx.some(f => f.t === 'dash');
    for (const f of foesOf(u)) { const d = dist(from, f); if (d >= 1 && d <= s.rng && (!dash || d === 1 || freeAdj(f).length)) out.push({ x: f.x, y: f.y, unit: f }); }
  } else if (s.tg === 'a') {
    for (const f of frOf(u)) { if (dist(from, f) <= s.rng) out.push({ x: f.x, y: f.y, unit: f }); }
  } else if (s.tg === 't') {
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const d = dist(from, { x, y }); if (d >= 1 && d <= s.rng && validTile(x, y)) out.push({ x, y }); }
  }
  return out;
}
async function unitAttack(u, t) {
  if (B.busy || u.acted) return;
  B.busy = true; u.acted = true; u.moved = true;
  const el = u.kind === 'hero' ? null : u.elem;
  if (dist(u, t) > 1) await (V.proj && V.proj(u, t, projEmoji(el))); else await (V.lunge && V.lunge(u, t));
  await hurt(u, t, u.atk, { el });
  B.busy = false; V.sync && V.sync(); checkEnd();
}
async function unitSkill(u, sk, tile) {
  if (B.busy || u.acted || sk.cd > 0) return;
  const s = SK[sk.k];
  B.busy = true; u.acted = true; u.moved = true;
  sk.cd = Math.max(1, s.cd - (u.stage >= 3 ? 1 : 0)) + 0;
  const ctx = { src: u, tile: tile ? { x: tile.x, y: tile.y } : null, tgt: null, rng: s.rng, skill: sk.k };
  if (tile && (s.tg === 'e' || s.tg === 'a')) ctx.tgt = unitAt(tile.x, tile.y);
  V.float && V.float(u, s.n, 'skill'); await sleep(200);
  await runFx(s.fx, ctx);
  B.busy = false; V.sync && V.sync(); checkEnd();
}
// 点击敌人时：如果能走到射程内，自动移动 + 普攻
function approachTile(u, target) {
  if (dist(u, target) <= u.rng) return { x: u.x, y: u.y };
  if (u.moved) return null;
  let best = null;
  for (const t of reach(u).values()) {
    const d = dist(t, target); if (d < 1 || d > u.rng) continue;
    const sc = t.d * 10 - (u.rng > 1 ? d : 0) + (T(t.x, t.y).t === 'hazard' && !isFly(u) ? 15 : 0);
    if (!best || sc < best.sc) best = { x: t.x, y: t.y, sc };
  }
  return best;
}
async function playerMove(u, x, y) {
  if (B.busy || u.moved || u.acted) return;
  B.busy = true; u.moved = true;
  await moveUnit(u, x, y);
  B.busy = false; V.sync && V.sync(); checkEnd();
}
async function playerAttackAuto(u, target) {
  const at = approachTile(u, target); if (!at) return;
  if (at.x !== u.x || at.y !== u.y) { B.busy = true; u.moved = true; await moveUnit(u, at.x, at.y); B.busy = false; if (u.hp <= 0) { checkEnd(); return; } }
  await unitAttack(u, target);
}

/* ==========================================================
   危险区预览
   ========================================================== */
function dangerSet() {
  const set = new Set();
  for (const e of side('e')) {
    if (e.st.stun > 0) continue;
    const rm = reach(e); rm.set(kxy(e.x, e.y), { x: e.x, y: e.y, d: 0 });
    const reachRng = Math.max(e.rng, ...e.sks.map(s => SK[s.k].tg === 'e' || SK[s.k].tg === 't' ? SK[s.k].rng : 0));
    for (const t of rm.values()) for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const d = dist(t, { x, y }); if (d >= 1 && d <= e.rng) set.add(kxy(x, y)); }
  }
  return set;
}

/* ==========================================================
   敌人 AI
   ========================================================== */
function distField(srcs) {
  const f = new Map(); const q = [];
  for (const s of srcs) { f.set(kxy(s.x, s.y), 0); q.push([s.x, s.y]); }
  while (q.length) { const [x, y] = q.shift(); const d = f.get(kxy(x, y)); for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (inb(nx, ny) && T(nx, ny).t !== 'wall' && !f.has(kxy(nx, ny))) { f.set(kxy(nx, ny), d + 1); q.push([nx, ny]); } } }
  return f;
}
function evalSkill(u, sk, pos, cands) { // 返回 {score, tile?, unit?}
  const s = SK[sk.k]; let best = null;
  const dmgFx = s.fx.find(f => f.t === 'dmg' || f.t === 'chain');
  const base = dmgFx ? Math.round((dmgFx.m || 1) * u.atk) : 0;
  const consider = (score, o) => { if (!best || score > best.score) best = Object.assign({ score }, o); };
  const foes = cands;
  if (s.tg === 'e') {
    const dash = s.fx.some(f => f.t === 'dash');
    for (const f of foes) {
      const d = dist(pos, f); if (d < 1 || d > s.rng) continue;
      if (dash && d > 1 && !freeAdj(f).length) continue;
      let sc = 11;
      if (dmgFx) { const est = estDmg(u, f, base, u.elem); sc += Math.min(est, f.hp + f.block) * 1.1; if (est >= f.hp + f.block) sc += 25;
        if (dmgFx.r) sc += foes.filter(o => o !== f && dist(o, f) <= dmgFx.r).length * 6; }
      else sc += 6;
      if (s.fx.some(x => x.t === 'st' && x.s === 'stun')) sc += 4;
      if (f.kind === 'hero') sc += 5; if (f.st.taunt) sc += 20;
      if (s.fx.some(x => x.t === 'die')) sc = f.kind === 'hero' ? sc + 6 : sc - 20;
      consider(sc, { unit: f });
    }
  } else if (s.tg === 't') {
    for (const f of foes) {
      const d = dist(pos, f); if (d < 1 || d > s.rng) continue;
      const r = dmgFx && dmgFx.r != null ? dmgFx.r : 1;
      const n = foes.filter(o => dist(o, f) <= r).length;
      consider(10 + n * Math.min(base, 14) * 1.1 + (f.kind === 'hero' ? 5 : 0), { tile: { x: f.x, y: f.y } });
    }
  } else if (s.tg === 'a') {
    const isHeal = s.fx.some(f => f.t === 'heal');
    for (const a of frOf(u)) {
      if (dist(pos, a) > s.rng) continue;
      if (isHeal) { const ratio = a.hp / a.maxhp; if (ratio < 0.65) consider(14 + (1 - ratio) * 25, { unit: a }); }
      else if (foes.some(f => dist(f, a) <= 4)) consider(8 + (a.kind === 'hero' ? 2 : 0), { unit: a });
    }
  } else if (s.tg === 's' || s.tg === 'z') {
    const fx0 = s.fx[0];
    if (s.fx.some(f => f.t === 'sum')) { if (frOf(u).filter(x => x.minion).length < 3 && freeAdj(pos).length) consider(12, {}); }
    else if (s.fx.some(f => f.t === 'heal') && s.tg === 'z') { const hurtN = frOf(u).filter(a => a.hp / a.maxhp < .7).length; if (hurtN) consider(8 + hurtN * 6, {}); }
    else if (s.fx.some(f => f.t === 'heal')) { if (u.hp / u.maxhp < .7) consider(13, {}); }
    else if (s.fx.some(f => f.t === 'str')) { if (frOf(u).length > 1 && foes.some(f => dist(f, pos) <= 6)) consider(10, {}); }
    else if (dmgFx) {
      const r = dmgFx.all ? 99 : (dmgFx.r != null ? dmgFx.r : 1);
      const n = foes.filter(f => dist(f, pos) <= r).length; if (n) consider(8 + n * Math.min(base, 14) * 1.1, {});
    } else {
      const stF = s.fx.find(f => f.t === 'st' && f.ctr === 'self');
      if (stF) { const n = foes.filter(f => dist(f, pos) <= (stF.r || 2)).length; if (n) consider(7 + n * 3, {}); }
      else if (foes.some(f => dist(f, pos) <= 3)) consider(7, {});
    }
  }
  return best;
}
async function enemyAct(u) {
  if (u.st.stun > 0) { V.float && V.float(u, '💤眩晕', 'debuff'); await sleep(280); return; }
  let foes = foesOf(u); if (!foes.length) return;
  const taunters = foes.filter(f => f.st.taunt > 0);
  const rm = reach(u); rm.set(kxy(u.x, u.y), { x: u.x, y: u.y, d: 0 });
  let best = null;
  const cands = taunters.length ? taunters : foes;
  const nearestFoe = (pos) => Math.min(...foes.map(f => dist(pos, f)));
  for (const tile of rm.values()) {
    const hz = (T(tile.x, tile.y).t === 'hazard' && !isFly(u)) ? 7 : (T(tile.x, tile.y).trap && T(tile.x, tile.y).trap.side !== u.side ? 5 : 0);
    const pos = { x: tile.x, y: tile.y };
    const kite = u.rng > 1 ? Math.min(nearestFoe(pos), u.rng) * 0.8 : 0;
    for (const f of cands) {
      const d = dist(pos, f);
      if (d >= 1 && d <= u.rng) {
        const est = estDmg(u, f, u.atk, u.elem);
        let sc = 10 + Math.min(est, f.hp + f.block) + (est >= f.hp + f.block ? 25 : 0) + (f.kind === 'hero' ? 5 : 0) + (f.st.taunt ? 20 : 0) - tile.d * 0.15 - hz + kite;
        if (!best || sc > best.score) best = { score: sc, tile, kind: 'atk', target: f };
      }
    }
    for (const sk of u.sks) {
      if (sk.cd > 0) continue;
      const r = evalSkill(u, sk, pos, cands); if (!r) continue;
      const sc = r.score + 6 - tile.d * 0.15 - hz + kite;
      if (!best || sc > best.score) best = { score: sc, tile, kind: 'skill', sk, target: r.unit, tgtTile: r.tile };
    }
  }
  if (best) {
    if (best.tile.x !== u.x || best.tile.y !== u.y) { await moveUnit(u, best.tile.x, best.tile.y); if (u.hp <= 0 || B.over) return; }
    if (best.kind === 'atk') {
      if (best.target.hp <= 0) return;
      u.acted = true;
      if (dist(u, best.target) > 1) await (V.proj && V.proj(u, best.target, projEmoji(u.elem))); else await (V.lunge && V.lunge(u, best.target));
      await hurt(u, best.target, u.atk, { el: u.elem });
    } else {
      const s = SK[best.sk.k];
      best.sk.cd = Math.max(1, s.cd - (u.stage >= 3 ? 1 : 0));
      u.acted = true;
      V.float && V.float(u, s.n, 'skill'); await sleep(260);
      const tgtU = best.target; const tile = best.tgtTile || (tgtU ? { x: tgtU.x, y: tgtU.y } : null);
      await runFx(s.fx, { src: u, tgt: tgtU || null, tile, rng: s.rng, skill: best.sk.k });
    }
    await sleep(120);
    return;
  }
  // 无法攻击：向最近目标靠近
  const field = distField(cands);
  let mv = null;
  for (const tile of rm.values()) {
    const fd = field.get(kxy(tile.x, tile.y)); if (fd == null) continue;
    const hz = (T(tile.x, tile.y).t === 'hazard' && !isFly(u)) ? 3 : 0;
    const want = u.rng > 1 ? Math.abs(fd - u.rng) : fd;
    const sc = -(want * 2) - hz + Math.random() * .5;
    if (!mv || sc > mv.sc) mv = { sc, tile };
  }
  if (mv && (mv.tile.x !== u.x || mv.tile.y !== u.y)) await moveUnit(u, mv.tile.x, mv.tile.y);
  // 若移动后可使用增益/召唤类技能
  for (const sk of u.sks) {
    if (sk.cd > 0 || u.hp <= 0) continue;
    const r = evalSkill(u, sk, u, cands); if (!r || r.score < 9) continue;
    const s = SK[sk.k]; sk.cd = s.cd; V.float && V.float(u, s.n, 'skill'); await sleep(260);
    await runFx(s.fx, { src: u, tgt: r.unit || null, tile: r.tile || null, rng: s.rng }); break;
  }
}
