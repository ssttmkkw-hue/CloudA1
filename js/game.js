'use strict';
/* ==========================================================
   游戏流程 & 数据：存档、地图、遭遇、奖励、灵魂
   ========================================================== */
const G = { meta: null, run: null };
const META_UP = {
  hp: { n: '坚韧体魄', d: '初始最大生命 +5', e: '❤️', max: 5, cost: l => 30 + l * 20 },
  gold: { n: '富裕出身', d: '初始金币 +30', e: '💰', max: 5, cost: l => 30 + l * 15 },
  cap: { n: '灵魂亲和', d: '灵魂收服率 +5%', e: '🔮', max: 5, cost: l => 40 + l * 25 },
  crystal: { n: '水晶储备', d: '初始灵魂水晶 +1', e: '💎', max: 3, cost: l => 40 + l * 40 },
  party: { n: '军团扩编', d: '出战灵魂上限 +1', e: '👥', max: 2, cost: l => 120 + l * 120 },
  twin: { n: '双魂出发', d: '开局可选择 2 个初始灵魂', e: '✨', max: 1, cost: () => 150 }
};
function loadMeta() {
  const d = { essence: 0, unlocked: { knight: 1, mage: 1, summoner: 1 }, up: {}, codex: {}, runs: 0, wins: 0, best: 0, sound: true };
  G.meta = Object.assign(d, Store.get('meta', {}));
  G.meta.unlocked = Object.assign(d.unlocked, G.meta.unlocked); G.meta.up = G.meta.up || {}; G.meta.codex = G.meta.codex || {};
  Snd.on = G.meta.sound !== false;
}
const saveMeta = () => Store.set('meta', G.meta);
const saveRun = () => { if (G.run) Store.set('run', G.run); };
const dexSeen = id => { const c = G.meta.codex[id] || (G.meta.codex[id] = { seen: 0, caught: 0 }); c.seen = 1; };
function dexCatch(id) { const c = G.meta.codex[id] || (G.meta.codex[id] = { seen: 1, caught: 0 }); const fresh = !c.caught; c.seen = 1; c.caught++; return fresh; }
const codexCount = () => Object.values(G.meta.codex).filter(c => c.caught).length;

/* ---------- 新的远征 ---------- */
const START_GEAR = { knight: 'sword1', mage: 'staff1', summoner: 'sg_claw', ranger: 'bow1', priest: 'amulet', assassin: 'dagger', paladin: 'leather', druid: 'cloth', berserker: 'axe1', monk: 'boots', bard: 'coin', alchemist: 'amulet', engineer: 'chain' };
function newRun(cls) {
  const c = CLASSES[cls];
  const run = {
    cls, hpBonus: (G.meta.up.hp || 0) * 5, gold: 50 + (G.meta.up.gold || 0) * 30, crystals: 2 + (G.meta.up.crystal || 0),
    deck: c.deck.map(id => ({ id, up: false })), gear: { weapon: null, armor: null, charm: null }, bag: [], souls: [], party: [],
    region: 0, map: null, pos: null, stats: { battles: 0, kills: 0, caught: 0, bosses: 0, floors: 0 }, newDex: [], hp: 1, shopBought: {}
  };
  run.hp = c.hp + run.hpBonus;
  const sg = START_GEAR[cls];
  if (sg && GEAR[sg].slot !== 'soul') run.gear[GEAR[sg].slot] = sg; else if (sg) run.bag.push(sg);
  G.run = run;
  const o = run.hp; run.hp = heroMaxHp(run); run.hp = Math.max(run.hp, o);
  return run;
}
function startRegion(run, ri) {
  run.region = ri; run.pos = null; run.map = genMap(ri);
  saveRun();
}

/* ---------- 地图生成 ---------- */
const NODE_ICON = { battle: '⚔️', elite: '💀', event: '❓', shop: '🛒', rest: '🔥', treasure: '🎁', shrine: '🔮', boss: '👑' };
const NODE_NAME = { battle: '战斗', elite: '精英', event: '事件', shop: '商店', rest: '营地', treasure: '宝藏', shrine: '灵魂祭坛', boss: '首领' };
function genMap(ri) {
  const R = 7, rows = [];
  for (let r = 0; r < R; r++) {
    const cnt = r === 0 ? 3 : (chance(.5) ? 4 : 3);
    const cols = shuf([0, 1, 2, 3]).slice(0, cnt).sort();
    rows.push(cols.map((c, i) => ({ r, i, col: c, type: null, next: [], done: false })));
  }
  rows.push([{ r: R, i: 0, col: 1.5, type: 'boss', next: [], done: false }]);
  for (let r = 0; r < R; r++) {
    const nxt = rows[r + 1];
    for (const n of rows[r]) {
      if (r === R - 1) { n.next = [0]; continue; }
      const sorted = nxt.slice().sort((a, b) => Math.abs(a.col - n.col) - Math.abs(b.col - n.col));
      n.next.push(sorted[0].i);
      if (sorted[1] && Math.abs(sorted[1].col - n.col) <= 1 && chance(.5)) n.next.push(sorted[1].i);
    }
    for (const m of nxt) {
      if (!rows[r].some(n => n.next.includes(m.i))) {
        const near = rows[r].slice().sort((a, b) => Math.abs(a.col - m.col) - Math.abs(b.col - m.col))[0]; near.next.push(m.i);
      }
    }
  }
  const W = { battle: 44, event: 24, shop: 8, rest: 9, elite: 11, shrine: 6, treasure: 4 };
  for (let r = 0; r < R; r++) {
    for (const n of rows[r]) {
      if (r === 0) n.type = 'battle';
      else if (r === R - 1) n.type = 'rest';
      else if (r === 3 && n.i === 0) n.type = 'treasure';
      else {
        const pool = Object.keys(W).filter(t => !(t === 'elite' && r < 2) && !(t === 'shrine' && r < 1) && !(t === 'rest' && r === 1) && !(t === 'treasure'));
        n.type = wpick(pool, t => W[t]);
      }
    }
  }
  const all = rows.flat();
  if (!all.some(n => n.type === 'shop')) pick(rows[rr(2, 4)]).type = 'shop';
  if (!all.some(n => n.type === 'elite')) pick(rows[rr(3, 5)]).type = 'elite';
  return rows;
}
function nodeAvail(run) {
  const m = run.map; if (!m) return [];
  if (!run.pos) return m[0];
  const cur = m[run.pos.r][run.pos.i];
  return cur.next.map(i => m[run.pos.r + 1][i]);
}

/* ---------- 遭遇生成 ---------- */
function regionPool(ri) {
  const id = REGIONS[ri].id;
  return Object.values(FAMILIES).filter(f => f[0].reg && f[0].reg.includes(id));
}
function pickStage(ri, fl, elite) {
  let opts;
  if (ri === 0) opts = fl < 3 ? [1] : [1, 1, 1, 2];
  else if (ri === 1) opts = fl < 3 ? [1, 2, 2] : [1, 2, 2, 2, 3];
  else opts = fl < 3 ? [2, 2, 3] : [2, 3, 3, 3];
  let s = pick(opts); if (elite) s = Math.min(3, s + 1);
  return s;
}
function genEncounter(run, kind) {
  const ri = run.region, fl = run.pos ? run.pos.r : 0, n = run.stats.battles;
  const scale = 1 + 0.03 * n + ri * 0.04;
  const pool = regionPool(ri);
  const mk = elite => {
    const fam = wpick(pool, f => ({ C: 10, U: 6, R: 3, E: 1.5 }[f[0].rar] || 5));
    const st = pickStage(ri, fl, elite);
    return { sp: fam[st - 1].id, scale, elite: !!elite };
  };
  let obj = { kind: 'rout' }, reinf = null;
  if (kind === 'boss') obj = { kind: 'boss' };
  else if (kind === 'elite') obj = chance(.5) ? { kind: 'leader' } : { kind: 'rout' };
  else obj = wpick([{ kind: 'rout' }, { kind: 'leader' }, { kind: 'survive', limit: 5 + ri }, { kind: 'seize' }], o => ({ rout: 50, leader: 18, survive: 16, seize: 16 })[o.kind]);
  const enemies = [];
  if (kind === 'boss') {
    enemies.push({ sp: REGIONS[ri].boss, scale: 1 + ri * 0.03, boss: true });
    for (let i = 0; i < 2 + (ri >= 2 ? 1 : 0); i++) { const e = mk(false); e.sp = pick(pool)[Math.min(2, ri)].id; enemies.push(e); }
  } else if (kind === 'elite') {
    enemies.push(mk(true));
    for (let i = 0, c = 1 + (ri >= 1 ? 1 : 0) + (ri >= 2 ? 1 : 0); i < c; i++) enemies.push(mk(false));
  } else {
    let cnt = 2 + (fl >= 2 ? 1 : 0) + (fl >= 5 ? 1 : 0) + (ri >= 1 ? 1 : 0) + (ri >= 2 ? 1 : 0) - (chance(.3) ? 1 : 0);
    if (obj.kind === 'survive') cnt -= 1;
    cnt = clamp(cnt, 2, 6);
    for (let i = 0; i < cnt; i++) enemies.push(mk(false));
    if (obj.kind === 'survive') reinf = { every: 2, count: 1 + (ri >= 2 ? 1 : 0), specs: [mk(false), mk(false), mk(false)] };
    else if (chance(.3)) reinf = { every: 3, count: 1, specs: [mk(false), mk(false)] };
  }
  enemies.forEach(e => dexSeen(e.sp)); if (reinf) reinf.specs.forEach(e => dexSeen(e.sp));
  return { region: ri, kind, enemies, obj, reinf };
}

/* ---------- 灵魂 ---------- */
function newSoul(spId, lv) {
  const sp = SPECIES[spId];
  return { uid: uid('s'), sp: spId, lv: lv || (sp.boss || sp.legend ? 8 : STAGE_LV[sp.stage - 1]), xp: 0, star: 1, gear: null, rest: 0 };
}
// 加入军团；返回 {soul, merged}
function addSoul(run, spId, lv) {
  const dup = run.souls.find(s => s.sp === spId);
  const fresh = dexCatch(spId);
  if (fresh && !run.newDex.includes(spId)) run.newDex.push(spId);
  if (dup) { if (dup.star < 5) dup.star++; dup.xp += 4; return { soul: dup, merged: true, fresh }; }
  const s = newSoul(spId, lv); run.souls.push(s);
  if (run.party.length < partyMax(run)) run.party.push(s.uid);
  return { soul: s, merged: false, fresh };
}
// 返回事件列表
function gainXp(soul, amt) {
  const ev = []; if (soul.lv >= MAX_LV) return ev;
  soul.xp += amt;
  while (soul.lv < MAX_LV && soul.xp >= expNeed(soul.lv)) {
    soul.xp -= expNeed(soul.lv); soul.lv++;
    const sp = SPECIES[soul.sp];
    if (sp.evo && soul.lv >= sp.evoLv) {
      const from = sp; soul.sp = sp.evo; dexCatch(sp.evo); if (!G.run.newDex.includes(sp.evo)) G.run.newDex.push(sp.evo);
      ev.push({ t: 'evo', from, to: SPECIES[soul.sp] });
    } else ev.push({ t: 'lv', lv: soul.lv });
  }
  return ev;
}
function soulStats(soul) {
  const sp = SPECIES[soul.sp], m = statMult(sp, soul.lv, soul.star), gm = sumMods([soul.gear]);
  return { hp: Math.round(sp.hp * m + (gm.hp || 0)), atk: Math.round(sp.atk * m + (gm.atk || 0)), mov: sp.mov + (gm.mov || 0), rng: sp.rng + (gm.rng || 0) };
}
function captureChance(k, run) {
  const sp = SPECIES[k.sp];
  if (sp.boss) return 1;
  let p = ({ C: .55, U: .42, R: .3, E: .2, L: .12 })[sp.rar] - 0.06 * (sp.stage - 1) - (k.elite ? 0.03 : 0);
  p += (k.mark || 0) / 100 + (run.cls === 'summoner' ? .15 : 0) + (heroMods(run).cap || 0) / 100 + (G.meta.up.cap || 0) * .05;
  return clamp(p, .05, .97);
}
function releaseValue(soul) { return 10 + SPECIES[soul.sp].stage * 8 + soul.lv * 2 + (soul.star - 1) * 10; }

/* ---------- 奖励生成 ---------- */
const maxCopies = c => c.rar === 'S' ? 99 : c.rar === 'R' ? 1 : 2;           // 构筑限制：普通/优秀最多2张，稀有1张
const copiesOf = (run, id) => run.deck.filter(x => x.id === id).length;
const canAddCard = (run, id) => copiesOf(run, id) < maxCopies(CARDS[id]);
const DECK_SOFT_MAX = 30;
function cardRewardOptions(run, kind) {
  const pool = Object.values(CARDS).filter(c => (c.cls === run.cls || c.cls === 'all') && 'CUR'.includes(c.rar) && canAddCard(run, c.id));
  const w = kind === 'boss' ? { C: 0, U: 45, R: 55 } : kind === 'elite' ? { C: 38, U: 47, R: 15 } : { C: 60, U: 34, R: 6 };
  const out = [];
  while (out.length < Math.min(3, pool.length)) { const c = wpick(pool, c => w[c.rar] + (c.cls === run.cls ? 6 : 0)); if (!out.includes(c)) out.push(c); }
  return out.map(c => c.id);
}
function randSoulOffer(run, minRar, n) {
  const order = 'CURE';
  const pool = SPECIES_LIST.filter(s => !s.boss && !s.legend && s.stage <= 2 && order.indexOf(s.rar) >= order.indexOf(minRar || 'C'));
  const out = []; while (out.length < n) { const s = wpick(pool, s => ({ C: 8, U: 6, R: 4, E: 2 })[s.rar] * (s.stage === 1 ? 1.5 : .7)); if (!out.includes(s)) out.push(s); }
  return out.map(s => s.id);
}
function legendOffer() { return shuf(SPECIES_LIST.filter(s => s.legend)).slice(0, 3).map(s => s.id); }
const CARD_PRICE = { C: 50, U: 78, R: 125 }, GEAR_PRICE = { C: 60, U: 95, R: 150, E: 220 }, SOUL_PRICE = { C: 60, U: 90, R: 140, E: 200 };
function genShop(run) {
  const cards = [], pool = Object.values(CARDS).filter(c => (c.cls === run.cls) && 'CUR'.includes(c.rar) && canAddCard(run, c.id));
  const neu = Object.values(CARDS).filter(c => c.cls === 'all' && 'CUR'.includes(c.rar) && canAddCard(run, c.id));
  while (cards.length < 3) { const c = wpick(pool, c => ({ C: 60, U: 33, R: 9 })[c.rar]); if (!cards.includes(c)) cards.push(c); }
  while (cards.length < 5) { const c = wpick(neu, c => ({ C: 60, U: 33, R: 9 })[c.rar]); if (!cards.includes(c)) cards.push(c); }
  const gear = [randGear(['weapon', 'armor', 'charm'], 'C', 'R'), randGear(null, 'C', 'R')];
  const souls = randSoulOffer(run, 'C', 2);
  return {
    cards: cards.map(c => ({ id: c.id, price: Math.round(CARD_PRICE[c.rar] * (.85 + Math.random() * .3)) })),
    gear: gear.map(g => ({ id: g, price: Math.round(GEAR_PRICE[GEAR[g].rar] * (.85 + Math.random() * .3)) })),
    souls: souls.map(s => ({ id: s, price: Math.round(SOUL_PRICE[SPECIES[s].rar] * (.85 + Math.random() * .3)) })),
    removeCost: 70 + (run.removed || 0) * 25, healCost: 45, crystalCost: 35, crystalLeft: 2
  };
}
function randCardId(run, rarity) {
  let pool = Object.values(CARDS).filter(c => (c.cls === run.cls || c.cls === 'all') && (rarity === 'rare' ? c.rar === 'R' : 'CUR'.includes(c.rar)) && canAddCard(run, c.id));
  if (!pool.length) pool = [CARDS.defend];
  return wpick(pool, c => ({ C: 60, U: 33, R: 9 })[c.rar] || 1).id;
}
function addCardToDeck(run, id) { run.deck.push({ id, up: false }); }
function applyRelicGold(run, g) { return Math.round(g * (1 + (heroMods(run).gold || 0) / 100)); }
