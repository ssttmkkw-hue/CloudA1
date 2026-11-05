'use strict';
/* ==========================================================
   界面与流程：标题、选职业、地图、奖励、商店、事件、军团、图鉴
   ========================================================== */
const app = $('#app');
const A = {};            // data-a 动作表
const UI = { cls: null, army: 'souls', codexFilter: 'all' };
const ROSTER_MAX = 20;
function scr(html, cls) { closeModal(); app.innerHTML = `<div class="scr ${cls || ''}">${html}</div>`; app.scrollTop = 0; }
function showModal(html, cls) { $('#modal-root').innerHTML = `<div class="modal-bg"><div class="modal ${cls || ''}">${html}</div></div>`; }
function closeModal() { $('#modal-root').innerHTML = ''; }
A['modal-close'] = () => closeModal();
const waitClick = id => new Promise(res => { UI._w = UI._w || {}; UI._w[id] = res; });
const fire = (id, v) => { if (UI._w && UI._w[id]) { const r = UI._w[id]; delete UI._w[id]; r(v); } };

/* ---------- 通用 HTML 片段 ---------- */
const elChip = e => e ? `<em class="chip el-${e}">${ELEM[e].e}${ELEM[e].n}</em>` : '';
const stars = n => '★'.repeat(n || 1);
function cardHTML(d, o) {
  o = o || {};
  const tc = d.soul ? 'soul' : d.ty;
  return `<div class="card t-${tc}${d.up ? ' up' : ''} ${o.cls || ''}" ${o.attrs || ''}>
    <div class="c-cost">${d.cost >= 99 ? '✖' : d.cost}</div><div class="c-name">${esc(d.n)}</div>
    <div class="c-art">${cardArt(d)}</div>
    <div class="c-type">${TYPE_N[d.ty]}${d.rar && 'CUR'.includes(d.rar) ? ' · ' + ({ C: '普通', U: '优秀', R: '稀有' })[d.rar] : ''}</div>
    <div class="c-desc${cardDesc(d).length > 34 ? ' long' : ''}">${esc(cardDesc(d))}</div>${o.extra || ''}</div>`;
}
function spBrief(sp) {
  return `${elChip(sp.elem)}<em class="chip">${ROLES[sp.role].n}</em><em class="chip rar-${sp.rar}">${RAR[sp.rar][0]}</em>`;
}
function soulRow(s, o) {
  o = o || {};
  const sp = SPECIES[s.sp], st = soulStats(s), inP = G.run.party.includes(s.uid);
  const gear = s.gear ? GEAR[s.gear] : null;
  return `<div class="soul-card rar-${sp.rar}${inP ? ' inparty' : ''}${s.rest ? ' resting' : ''}" ${o.attrs || ''}>
    <div class="sc-emoji stage-${sp.stage}">${sp.emoji}</div>
    <div class="sc-main"><div class="sc-name">${esc(sp.name)} <small>Lv${s.lv} ${stars(s.star)}</small></div>
      <div class="sc-meta">${spBrief(sp)}</div>
      <div class="sc-stat">❤${st.hp} ⚔${st.atk} 👣${st.mov} 🎯${st.rng}${gear ? ` · ${gear.emoji}` : ''}${s.rest ? ' · 💤疲惫' : ''}</div>
      <div class="sc-sk">✨${SK[sp.sk].n}${sp.ps ? ' · ' + PS[sp.ps][0] : ''}</div></div>
    <div class="sc-side">${o.side != null ? o.side : (inP ? '<b class="tag-p">出战</b>' : '')}</div></div>`;
}

/* ==========================================================
   标题
   ========================================================== */
function showTitle() {
  const hasRun = !!Store.get('run');
  const floaters = ['🐺', '🧙', '💀', '🐉', '🦊', '👻', '🧝', '🐙', '🦄', '😈', '🔮', '🦇'].map((e, i) => `<span style="left:${(i * 8.7 + 3) % 96}%;animation-delay:${-i * 1.7}s;font-size:${22 + (i * 7) % 18}px">${e}</span>`).join('');
  scr(`<div class="float-bg">${floaters}</div>
    <div class="title"><div class="logo">魂契远征</div><div class="logo-sub">SOUL PACT · 战棋冒险 × 灵魂收集</div>
    <div class="title-art">⚔️ 🔮 🏰</div>
    <div class="t-btns">
      ${hasRun ? '<button class="btn pri big" data-a="continue">▶ 继续远征</button>' : ''}
      <button class="btn ${hasRun ? '' : 'pri'} big" data-a="newgame">⚔ 开始新的远征</button>
      <button class="btn big" data-a="codex">📖 灵魂图鉴 <small>${codexCount()}/${SPECIES_LIST.length}</small></button>
      <button class="btn big" data-a="hall">💠 魂之殿堂 <small>${G.meta.essence} 魂晶</small></button>
      <div class="row2"><button class="btn" data-a="howto">玩法说明</button><button class="btn" data-a="sound">${Snd.on ? '🔊 音效开' : '🔇 音效关'}</button></div>
    </div><div class="ver dim">已通关 ${G.meta.wins} 次 · 远征 ${G.meta.runs} 次</div></div>`, 'title-scr');
}
A.sound = () => { Snd.on = !Snd.on; G.meta.sound = Snd.on; saveMeta(); showTitle(); };
A.howto = () => showModal(`<h3>📜 玩法说明</h3><div class="howto">
  <p><b>🗺 远征</b>：穿越 3 个区域（森林→遗迹→魔城），沿路线选择战斗、事件、商店、营地、宝藏、祭坛，击败区域首领。越深的区域，战场越大。</p>
  <p><b>⚔ 战棋战斗</b>：英雄与灵魂都能<b>移动 + 普通攻击/技能</b>。近战打近战会被<b>反击</b>；远程单位站在敌人射程之外最安全。林地🌿受伤-25%，军旗🚩占领者每回合+1能量，泉水⛲回血，火药桶🛢️会爆炸。</p>
  <p><b>🎯 战斗目标</b>：除了歼灭，还可能是<b>击杀指挥官</b>、<b>占领据点🏁</b>、<b>坚持数回合</b>（敌方不断有援军）。</p>
  <p><b>🎁 宝箱</b>：派单位<b>走上宝箱</b>（占领）或<b>把它打碎</b>，都能获得奖励。</p>
  <p><b>🃏 卡牌（炉石式）</b>：能量逐回合增长（第1回合3点，每回合+1，最高7）；每回合抽2张，<b>手牌不会弃掉</b>，上限10张。牌有攻击/技能/能力/召唤，以及<b>装备牌</b>（给单位永久强化）和<b>战术牌</b>（改造地形、调度单位），还有大量<b>随机牌</b>。</p>
  <p><b>🔮 收服灵魂</b>：击败的魔物有机会收服，重复收服升星。灵魂会升级并进化，并以<b>召唤牌</b>的形式进入牌组。</p>
  <p><b>🌿 属性克制</b>：水>火>木>雷>水，光⇄暗互相克制（×1.5 / ×0.75）。</p>
  <p><b>📚 构筑</b>：普通/优秀同名牌最多 2 张，稀有牌 1 张；卡组过厚会稀释关键牌，营地可以精简卡组。</p>
  <p><b>💠 魂晶</b>：每次远征结束获得魂晶，用来永久强化、解锁 13 个职业。</p>
  </div><div class="btnrow"><button class="btn pri" data-a="modal-close">明白了</button></div>`);

/* ==========================================================
   选择职业
   ========================================================== */
A.newgame = () => {
  if (Store.get('run')) { showModal('<h3>开始新的远征？</h3><p class="dim">当前存档的远征进度将被覆盖。</p><div class="btnrow"><button class="btn" data-a="modal-close">取消</button><button class="btn pri" data-a="newgame-ok">确定</button></div>'); return; }
  showClassSelect();
};
A['newgame-ok'] = () => { closeModal(); showClassSelect(); };
function showClassSelect(sel) {
  UI.cls = sel || UI.cls || 'summoner';
  const cards = Object.entries(CLASSES).map(([id, c]) => {
    const unlocked = G.meta.unlocked[id];
    return `<div class="cls-card${UI.cls === id ? ' sel' : ''}${unlocked ? '' : ' locked'}" data-a="cls-pick" data-id="${id}">
      <div class="cls-emoji">${unlocked ? c.emoji : '🔒'}</div>
      <div class="cls-main"><div class="cls-name">${c.n} <small>❤${c.hp} ⚔${c.atk} 👣${c.mov} 🎯${c.rng}</small></div>
      <div class="cls-desc">${c.d}</div><div class="cls-pas">被动：${c.pas}</div></div></div>`;
  }).join('');
  const c = CLASSES[UI.cls], un = G.meta.unlocked[UI.cls];
  const deck = {}; c.deck.forEach(id => { const n = CARDS[id].n; deck[n] = (deck[n] || 0) + 1; });
  scr(`<div class="hdr"><button class="icon-btn" data-a="title">‹</button><h2>选择职业</h2><span class="dim">💠${G.meta.essence}</span></div>
    <div class="list-scroll">${cards}</div>
    <div class="foot"><div class="dim small">起始卡组：${Object.entries(deck).map(([n, k]) => n + '×' + k).join('、')}</div>
    ${un ? '<button class="btn pri big" data-a="cls-go">选择并出发</button>' : `<button class="btn big" data-a="cls-unlock" ${G.meta.essence >= c.cost ? '' : 'disabled'}>解锁 · ${c.cost} 魂晶</button>`}</div>`);
}
A['cls-pick'] = d => showClassSelect(d.id);
A['cls-unlock'] = () => { const c = CLASSES[UI.cls]; if (G.meta.essence >= c.cost) { G.meta.essence -= c.cost; G.meta.unlocked[UI.cls] = 1; saveMeta(); toast('职业已解锁！'); showClassSelect(); } };
A.title = () => showTitle();
A['cls-go'] = () => {
  newRun(UI.cls); Store.del('run');
  const offers = randSoulOffer(G.run, 'C', 4).filter(id => SPECIES[id].rar !== 'E').slice(0, 3);
  UI.starter = { offers, need: G.meta.up.twin ? 2 : 1, picked: [] };
  showStarterPick();
};
function showStarterPick() {
  const st = UI.starter;
  const rows = st.offers.map(id => {
    const sp = SPECIES[id], taken = st.picked.includes(id);
    return `<div class="soul-card rar-${sp.rar}${taken ? ' inparty' : ''}" ${taken ? '' : `data-a="starter-pick" data-id="${id}"`}>
      <div class="sc-emoji stage-1">${sp.emoji}</div><div class="sc-main"><div class="sc-name">${sp.name}</div><div class="sc-meta">${spBrief(sp)}</div>
      <div class="sc-stat">❤${sp.hp} ⚔${sp.atk} 👣${sp.mov} 🎯${sp.rng}</div><div class="sc-sk">✨${SK[sp.sk].n}：${skillDesc(sp.sk, sp.atk)}</div></div>
      <div class="sc-side">${taken ? '<b class="tag-p">已选</b>' : ''}</div></div>`;
  }).join('');
  scr(`<div class="hdr"><button class="icon-btn" data-a="cls-back">‹</button><h2>选择初始灵魂</h2><span></span></div>
    <p class="center dim">选择 ${st.need} 个灵魂作为你的第一批伙伴（${st.picked.length}/${st.need}）</p><div class="list-scroll">${rows}</div>`);
}
A['cls-back'] = () => showClassSelect();
A['starter-pick'] = d => {
  const st = UI.starter; st.picked.push(d.id);
  if (st.picked.length >= st.need) {
    st.picked.forEach(id => addSoul(G.run, id)); startRegion(G.run, 0);
    G.run.stats.floors = 0; saveRun(); showMap();
    showModal(`<h3>🎒 远征开始</h3><p>${CLASSES[G.run.cls].emoji} <b>${CLASSES[G.run.cls].n}</b>带着新伙伴踏上了旅途。</p><p class="dim">提示：在地图上点击发光的节点前进。点击底部"军团"可管理出战灵魂与装备。</p><div class="btnrow"><button class="btn pri" data-a="modal-close">出发！</button></div>`);
  } else showStarterPick();
};

/* ==========================================================
   地图
   ========================================================== */
function showMap() {
  const run = G.run, ri = run.region, reg = REGIONS[ri], m = run.map;
  const avail = nodeAvail(run), RH = 88, R = m.length - 1;
  const H = (R + 1) * RH + 40;
  const px = n => (12.5 + n.col * 25).toFixed(1);
  const py = n => H - 40 - n.r * RH - 28;
  let lines = '';
  m.forEach((row, r) => row.forEach(n => n.next.forEach(i => {
    const t = m[r + 1][i], on = n.done || (run.pos && run.pos.r === r && run.pos.i === n.i);
    lines += `<line x1="${px(n)}%" y1="${py(n)}" x2="${px(t)}%" y2="${py(t)}" class="${on ? 'on' : ''}"/>`;
  })));
  let nodes = '';
  m.forEach(row => row.forEach(n => {
    const isA = avail.includes(n), isCur = run.pos && run.pos.r === n.r && run.pos.i === n.i;
    nodes += `<button class="node t-${n.type}${n.done ? ' done' : ''}${isA ? ' avail' : ''}${isCur ? ' cur' : ''}" style="left:${px(n)}%;top:${py(n)}px" ${isA ? `data-a="node" data-r="${n.r}" data-i="${n.i}"` : 'disabled'}><span>${NODE_ICON[n.type]}</span><small>${NODE_NAME[n.type]}</small></button>`;
  }));
  const h = heroMaxHp(run), c = CLASSES[run.cls];
  scr(`<div class="m-top"><div class="m-hero"><span class="m-emoji">${c.emoji}</span><div class="m-hpwrap"><div class="b-hpbar"><i style="width:${run.hp / h * 100}%"></i><span>❤ ${run.hp}/${h}</span></div>
      <div class="m-res">💰${run.gold} · 💎${run.crystals} · ${reg.emoji} ${reg.n} ${ri + 1}/3</div></div></div>
      <button class="icon-btn" data-a="mmenu">☰</button></div>
    <div class="map-scroll" id="mapscroll" style="background:linear-gradient(180deg,${reg.bg[0]},${reg.bg[1]})"><div class="map" style="height:${H}px">
      <svg class="map-lines" viewBox="0 0 400 ${H}" preserveAspectRatio="none"><g>${lines.replace(/(x[12])="([\d.]+)%"/g, (s, a, v) => `${a}="${(v * 4).toFixed(1)}"`)}</g></svg>${nodes}
      <div class="map-title">${reg.emoji} ${reg.n}<small>${reg.desc}</small></div></div></div>
    <div class="m-foot"><button class="btn" data-a="army" data-t="souls">👥 军团<small>${run.party.length}/${partyMax(run)}</small></button><button class="btn" data-a="army" data-t="hero">🎽 装备</button><button class="btn" data-a="army" data-t="deck">🃏 卡组<small>${run.deck.length}</small></button></div>`, 'map-scr');
  const ms = $('#mapscroll'); const cur = $('.node.avail') || $('.node.cur'); if (ms) { ms.scrollTop = Math.max(0, (cur ? cur.offsetTop : H) - ms.clientHeight * .6); }
}
A.mmenu = () => showModal(`<h3>菜单</h3><div class="btnrow col"><button class="btn" data-a="sound2">${Snd.on ? '🔊 音效：开' : '🔇 音效：关'}</button><button class="btn" data-a="howto">📜 玩法说明</button><button class="btn" data-a="codex">📖 灵魂图鉴</button><button class="btn" data-a="save-exit">💾 保存并返回标题</button><button class="btn danger" data-a="giveup">🏳 放弃本次远征</button><button class="btn pri" data-a="modal-close">继续游戏</button></div>`);
A.sound2 = () => { Snd.on = !Snd.on; G.meta.sound = Snd.on; saveMeta(); A.mmenu(); };
A['save-exit'] = () => { if (G.run && G.run.map) saveRun(); closeModal(); showTitle(); };
A.giveup = () => showModal('<h3>放弃远征？</h3><p class="dim">本次远征将结算，已获得的魂晶会保留。</p><div class="btnrow"><button class="btn" data-a="modal-close">取消</button><button class="btn danger" data-a="giveup-ok">放弃</button></div>');
A['giveup-ok'] = () => { closeModal(); endRun(false); };
A.node = async d => { const node = G.run.map[+d.r][+d.i]; await enterNode(node); };

async function enterNode(node) {
  G.run.cur = { r: node.r, i: node.i };
  const t = node.type;
  if (t === 'battle' || t === 'elite' || t === 'boss') return doBattle(node);
  if (t === 'event') return doEvent(node);
  if (t === 'shop') return doShop(node);
  if (t === 'rest') return doRest(node);
  if (t === 'treasure') return doTreasure(node);
  if (t === 'shrine') return doShrine(node);
}
function completeNode(node) {
  node.done = true; G.run.pos = { r: node.r, i: node.i }; G.run.stats.floors++;
  if (node.type === 'boss') return afterBoss();
  saveRun(); showMap();
}
async function afterBoss() {
  const run = G.run; run.stats.bosses++;
  if (run.region >= 2) return endRun(true);
  const heal = Math.round(heroMaxHp(run) * .4); run.hp = Math.min(heroMaxHp(run), run.hp + heal);
  run.souls.forEach(s => s.rest = 0);
  startRegion(run, run.region + 1);
  const r = REGIONS[run.region];
  scr(`<div class="center-box"><div class="big-emoji">${r.emoji}</div><h2>进入 ${r.n}</h2><p class="dim">${r.desc}</p><p>区域首领已被击败！你在营火旁休整，恢复了 ${heal} 点生命，所有灵魂恢复精神。</p><button class="btn pri big" data-a="goto-map">继续前进</button></div>`);
  saveRun();
}
A['goto-map'] = () => showMap();

/* ==========================================================
   战斗流程
   ========================================================== */
async function doBattle(node) {
  const run = G.run;
  const enc = genEncounter(run, node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'normal');
  scr(battleShell(), 'battle-scr');
  S.units = new Map(); S.tileEls = [];
  maybeTutorial();
  const res = await startBattle(run, enc);
  run.hp = Math.max(0, res.hp);
  if (!res.win) return endRun(false);
  await afterBattle(res, node, enc);
  completeNode(node);
}
function maybeTutorial() {
  if (G.meta.tut) return; G.meta.tut = 1; saveMeta();
  showModal(`<h3>⚔ 战斗指南</h3><div class="howto">
    <p>🃏 <b>点击手牌</b>选中，再点击<b>高亮的目标</b>释放；无需目标的牌再点一次即可使用。手牌不会弃掉，能量逐回合增长。</p>
    <p>👻 <b>紫色召唤牌</b>把灵魂伙伴召到身旁，召唤后可以立刻行动。</p>
    <p>👣 点击己方单位 → 点<b>蓝色格</b>移动 → 点<b>红色敌人</b>攻击。近战攻击会被<b>反击</b>！</p>
    <p>🎁 把单位<b>走到宝箱上</b>或<b>打碎它</b>即可开箱；留意顶部的<b>战斗目标</b>。</p>
    <p>⚠ 底部<b>危险区</b>按钮可查看敌人下一回合的攻击范围。</p></div>
    <div class="btnrow"><button class="btn pri" data-a="modal-close">开始战斗</button></div>`);
}
async function afterBattle(res, node, enc) {
  const run = G.run, kind = enc.kind;
  run.stats.battles++; run.stats.kills += res.kills.length;
  // 金币 / 治疗
  let gold = 10 + rr(0, 8) + (kind === 'elite' ? 28 : 0) + (kind === 'boss' ? 70 : 0) + Math.min(10, res.kills.length * 2);
  gold = applyRelicGold(run, gold); run.gold += gold;
  const gm = heroMods(run), healed = gm.heal || 0;
  if (healed) run.hp = Math.min(heroMaxHp(run), run.hp + healed);
  // 经验
  const xpTotal = res.kills.reduce((a, k) => a + 2 + SPECIES[k.sp].stage, 0) + (kind === 'boss' ? 10 : 0);
  const logs = [], evos = [];
  const deployed = new Set(res.deployed);
  for (const s of run.souls) {
    const inParty = run.party.includes(s.uid);
    const amt = deployed.has(s.uid) ? xpTotal : inParty ? Math.floor(xpTotal * .4) : Math.floor(xpTotal * .2);
    const before = s.lv, bsp = SPECIES[s.sp];
    const ev = gainXp(s, amt);
    if (ev.length) logs.push({ s, amt, ev, before, bsp });
    ev.filter(e => e.t === 'evo').forEach(e => evos.push(e));
    if (res.fallen.includes(s.uid)) s.rest = 1; else if (s.rest > 0 && !deployed.has(s.uid)) s.rest--;
  }
  Snd.play('win');
  const fell = res.fallen.map(u => run.souls.find(s => s.uid === u)).filter(Boolean);
  scr(`<div class="center-box"><div class="big-emoji">🏆</div><h2>胜利！</h2>
    <div class="sum-rows"><div class="row"><span>💰 金币</span><b>+${gold}</b></div>${healed ? `<div class="row"><span>💚 战后恢复</span><b>+${healed}</b></div>` : ''}
    <div class="row"><span>🎯 目标</span><b>${OBJ_NAME[res.obj] || '歼灭'}</b></div><div class="row"><span>⚔ 击败敌人</span><b>${res.kills.length}</b></div><div class="row"><span>⏱ 回合数</span><b>${res.turns}</b></div>
    ${(res.loot || []).map(t => `<div class="row"><span>🎁 宝箱</span><b>${t}</b></div>`).join('')}
    ${logs.map(l => `<div class="row"><span>${l.s ? SPECIES[l.s.sp].emoji : ''} ${esc(SPECIES[l.s.sp].name)}</span><b>${l.ev.some(e => e.t === 'evo') ? '进化！' : '升级 Lv' + l.s.lv}</b></div>`).join('')}
    ${fell.map(s => `<div class="row warn"><span>💤 ${esc(SPECIES[s.sp].name)}</span><b>下场战斗将休息</b></div>`).join('')}</div>
    <button class="btn pri big" data-a="v-next">继续</button></div>`);
  await waitClick('v-next');
  for (const e of evos) { await showEvolution(e); }
  // 灵魂收服
  const caps = res.kills;
  if (caps.length) await captureFlow(caps);
  // 卡牌奖励
  await cardRewardFlow(kind);
  // 装备奖励
  if (kind === 'elite' || kind === 'boss') await gearRewardFlow(kind);
  else if (chance(.12)) await gearRewardFlow('drop');
  saveRun();
}
A['v-next'] = () => fire('v-next');
A['disc-pick'] = d => { closeModal(); fire('disc', d.id); };
function showEvolution(e) {
  Snd.play('evo');
  showModal(`<div class="evo"><h3>✨ 进化！</h3><div class="evo-row"><div class="evo-a">${e.from.emoji}<small>${e.from.name}</small></div><div class="evo-arrow">➜</div><div class="evo-b">${e.to.emoji}<small>${e.to.name}</small></div></div>
    <p class="dim">${e.to.name} 的属性大幅提升！</p><div class="btnrow"><button class="btn pri" data-a="evo-ok">太棒了</button></div></div>`, 'evo-modal');
  return waitClick('evo-ok');
}
A['evo-ok'] = () => { closeModal(); fire('evo-ok'); };

/* ---------- 灵魂收服 ---------- */
function captureFlow(kills) {
  UI.cap = kills.map(k => ({ k, p: captureChance(k, G.run), bonus: 0, state: 'new', tries: 0 }));
  renderCapture();
  return waitClick('cap-done');
}
function renderCapture() {
  const run = G.run;
  const rows = UI.cap.map((c, i) => {
    const sp = SPECIES[c.k.sp], p = Math.round(clamp(c.p + c.bonus, 0, 1) * 100);
    let act = '';
    if (c.state === 'new') act = `<button class="btn pri" data-a="cap-try" data-i="${i}">收服 ${p}%</button>`;
    else if (c.state === 'fail') act = run.crystals > 0 ? `<button class="btn" data-a="cap-try" data-i="${i}">💎再试 ${p}%</button>` : '<span class="dim">失败</span>';
    else if (c.state === 'roll') act = '<span class="rolling">🔮</span>';
    else if (c.state === 'ok') act = `<b class="ok">${c.merged ? '★升星' : '✔收服'}</b>`;
    return `<div class="soul-card rar-${sp.rar} cap-${c.state}"><div class="sc-emoji stage-${sp.stage} ${c.state === 'roll' ? 'shake' : ''}">${sp.emoji}</div>
      <div class="sc-main"><div class="sc-name">${esc(sp.name)} <small>Lv${c.k.lv || STAGE_LV[sp.stage - 1]}</small></div><div class="sc-meta">${spBrief(sp)}${c.k.mark ? '<em class="chip">🔖标记</em>' : ''}</div>
      <div class="sc-stat">❤${sp.hp} ⚔${sp.atk}</div>${c.msg ? `<div class="sc-sk">${c.msg}</div>` : ''}</div><div class="sc-side">${act}</div></div>`;
  }).join('');
  scr(`<div class="hdr"><span></span><h2>🔮 灵魂收服</h2><span class="dim">💎${run.crystals}</span></div>
    <p class="center dim small">被击败的魔物灵魂正在消散，尝试收服它们！失败后可消耗💎灵魂水晶重试（+20%）。</p>
    <div class="list-scroll">${rows}</div><div class="foot"><button class="btn pri big" data-a="cap-done">完成</button></div>`);
}
A['cap-try'] = async d => {
  const c = UI.cap[+d.i]; if (!c || c.state === 'roll') return;
  if (c.state === 'fail') { if (G.run.crystals <= 0) return; G.run.crystals--; c.bonus += .2; }
  c.state = 'roll'; c.msg = ''; renderCapture(); await sleep(900);
  const ok = Math.random() < clamp(c.p + c.bonus, 0, 1);
  if (ok) {
    const sp = SPECIES[c.k.sp];
    if (G.run.souls.length >= ROSTER_MAX && !G.run.souls.some(s => s.sp === c.k.sp)) {
      const rel = await rosterFullPrompt(sp);
      if (!rel) { c.state = 'fail'; c.msg = '你放弃了收服'; c.bonus = -1; renderCapture(); return; }
    }
    const r = addSoul(G.run, c.k.sp, c.k.lv); G.run.stats.caught++;
    c.state = 'ok'; c.merged = r.merged; Snd.play('catch');
    c.msg = r.merged ? `灵魂共鸣！${SPECIES[r.soul.sp].name} 升至 ${stars(r.soul.star)}` : (r.fresh ? '✨ 图鉴新发现！' : '加入了军团');
  } else { c.state = 'fail'; c.msg = '灵魂挣脱了束缚……'; Snd.play('fail'); }
  renderCapture();
};
A['cap-done'] = () => {
  const left = UI.cap.filter(c => c.state === 'new' || c.state === 'fail').length;
  if (left && !UI._capWarn) { UI._capWarn = 1; toast('未收服的灵魂将会消散，再点一次确认离开'); return; }
  UI._capWarn = 0; fire('cap-done');
};
function rosterFullPrompt(sp) {
  const rows = G.run.souls.map(s => soulRow(s, { attrs: `data-a="rel-pick" data-u="${s.uid}"`, side: `<small>${releaseValue(s)}💰</small>` })).join('');
  showModal(`<h3>军团已满（${ROSTER_MAX}）</h3><p class="dim">释放一个灵魂来迎接 ${sp.emoji}${sp.name}，或放弃收服。</p><div class="list modal-list">${rows}</div><div class="btnrow"><button class="btn" data-a="rel-cancel">放弃收服</button></div>`);
  return waitClick('rel');
}
A['rel-pick'] = d => {
  const run = G.run, i = run.souls.findIndex(s => s.uid === d.u); const s = run.souls[i];
  run.gold += releaseValue(s); if (s.gear) run.bag.push(s.gear);
  run.souls.splice(i, 1); run.party = run.party.filter(u => u !== s.uid); closeModal(); fire('rel', true);
};
A['rel-cancel'] = () => { closeModal(); fire('rel', false); };

/* ---------- 卡牌 / 装备奖励 ---------- */
function cardRewardFlow(kind) {
  const ids = cardRewardOptions(G.run, kind); UI.cr = ids;
  scr(`<div class="hdr"><span></span><h2>🃏 选择一张卡牌</h2><span></span></div><p class="center dim small">加入你的卡组，或跳过获得 10 金币</p>
    <div class="reward-cards">${ids.map((id, i) => cardHTML(CARDS[id], { cls: 'big', attrs: `data-a="cr-pick" data-i="${i}"`, extra: `<div class="c-own">已有 ${copiesOf(G.run, id)}/${maxCopies(CARDS[id]) > 9 ? '∞' : maxCopies(CARDS[id])}</div>` })).join('')}</div>
    <div class="foot"><button class="btn big" data-a="cr-skip">跳过 (+10💰)</button></div>`);
  return waitClick('cr');
}
A['cr-pick'] = d => { addCardToDeck(G.run, UI.cr[+d.i]); fire('cr'); };
A['cr-skip'] = () => { G.run.gold += 10; fire('cr'); };
function gearRewardFlow(kind) {
  let ids;
  if (kind === 'boss') ids = [randGear(null, 'R', 'E'), randGear(null, 'R', 'E'), randGear(null, 'U', 'E')];
  else if (kind === 'elite') ids = [randGear(null, 'U', 'R'), randGear(null, 'U', 'R')];
  else ids = [randGear(null, 'C', 'U')];
  ids = [...new Set(ids)]; UI.gr = ids;
  scr(`<div class="hdr"><span></span><h2>🎁 ${kind === 'drop' ? '战利品' : '装备奖励'}</h2><span></span></div><p class="center dim small">${ids.length > 1 ? '选择一件装备' : '获得一件装备'}</p>
    <div class="list-scroll">${ids.map((id, i) => gearRow(GEAR[id], `data-a="gr-pick" data-i="${i}"`)).join('')}</div>
    <div class="foot"><button class="btn big" data-a="gr-skip">放弃</button></div>`);
  return waitClick('gr');
}
function gearRow(g, attrs, side) {
  return `<div class="soul-card rar-${g.rar}" ${attrs || ''}><div class="sc-emoji">${g.emoji}</div><div class="sc-main"><div class="sc-name">${esc(g.n)} <small>${SLOT_N[g.slot]}</small></div><div class="sc-meta"><em class="chip rar-${g.rar}">${RAR[g.rar][0]}</em></div><div class="sc-stat">${gearDesc(g)}</div></div><div class="sc-side">${side || ''}</div></div>`;
}
A['gr-pick'] = d => { G.run.bag.push(UI.gr[+d.i]); toast('装备已放入背包'); fire('gr'); };
A['gr-skip'] = () => fire('gr');

/* ==========================================================
   商店
   ========================================================== */
function doShop(node) {
  UI.shop = genShop(G.run); UI.shopNode = node; renderShop(); 
}
function renderShop() {
  const sh = UI.shop, run = G.run;
  const c = (price, sold) => sold ? '<b class="sold">已售</b>' : `<span class="price ${run.gold >= price ? '' : 'lack'}">💰${price}</span>`;
  scr(`<div class="hdr"><span></span><h2>🛒 神秘商店</h2><span class="gold">💰${run.gold}</span></div>
    <div class="list-scroll shop">
      <h4>卡牌</h4><div class="shop-cards">${sh.cards.map((x, i) => `<div class="shop-item" ${x.sold ? '' : `data-a="shop-buy" data-k="card" data-i="${i}"`}>${cardHTML(CARDS[x.id], { cls: x.sold ? 'off' : '' })}${c(x.price, x.sold)}</div>`).join('')}</div>
      <h4>装备</h4>${sh.gear.map((x, i) => gearRow(GEAR[x.id], x.sold ? '' : `data-a="shop-buy" data-k="gear" data-i="${i}"`, c(x.price, x.sold))).join('')}
      <h4>灵魂</h4>${sh.souls.map((x, i) => { const sp = SPECIES[x.id]; return `<div class="soul-card rar-${sp.rar}" ${x.sold ? '' : `data-a="shop-buy" data-k="soul" data-i="${i}"`}><div class="sc-emoji">${sp.emoji}</div><div class="sc-main"><div class="sc-name">${sp.name}</div><div class="sc-meta">${spBrief(sp)}</div><div class="sc-stat">❤${sp.hp} ⚔${sp.atk} 👣${sp.mov} 🎯${sp.rng}</div><div class="sc-sk">✨${SK[sp.sk].n}</div></div><div class="sc-side">${c(x.price, x.sold)}</div></div>`; }).join('')}
      <h4>服务</h4>
      <div class="soul-card" data-a="shop-svc" data-k="heal"><div class="sc-emoji">🧪</div><div class="sc-main"><div class="sc-name">治疗药水</div><div class="sc-stat">恢复 30% 最大生命</div></div><div class="sc-side"><span class="price ${run.gold >= sh.healCost ? '' : 'lack'}">💰${sh.healCost}</span></div></div>
      <div class="soul-card" data-a="shop-svc" data-k="crystal"><div class="sc-emoji">💎</div><div class="sc-main"><div class="sc-name">灵魂水晶</div><div class="sc-stat">提高收服成功率（剩 ${sh.crystalLeft}）</div></div><div class="sc-side"><span class="price ${run.gold >= sh.crystalCost ? '' : 'lack'}">💰${sh.crystalCost}</span></div></div>
      <div class="soul-card" data-a="shop-svc" data-k="remove"><div class="sc-emoji">🔥</div><div class="sc-main"><div class="sc-name">净化卡牌</div><div class="sc-stat">永久移除卡组中的一张牌</div></div><div class="sc-side"><span class="price ${run.gold >= sh.removeCost ? '' : 'lack'}">💰${sh.removeCost}</span></div></div>
    </div><div class="foot"><button class="btn pri big" data-a="shop-leave">离开商店</button></div>`);
}
A['shop-buy'] = d => {
  const sh = UI.shop, run = G.run, i = +d.i, k = d.k;
  const list = k === 'card' ? sh.cards : k === 'gear' ? sh.gear : sh.souls, it = list[i];
  if (!it || it.sold) return;
  if (run.gold < it.price) { toast('金币不足'); return; }
  if (k === 'soul' && run.souls.length >= ROSTER_MAX && !run.souls.some(s => s.sp === it.id)) { toast('军团已满，请先释放灵魂'); return; }
  run.gold -= it.price; it.sold = 1;
  if (k === 'card') addCardToDeck(run, it.id); else if (k === 'gear') run.bag.push(it.id);
  else { const r = addSoul(run, it.id); toast(r.merged ? '灵魂共鸣！星级提升' : '灵魂加入了军团'); }
  Snd.play('catch'); renderShop();
};
A['shop-svc'] = async d => {
  const sh = UI.shop, run = G.run;
  if (d.k === 'heal') { if (run.gold < sh.healCost) return toast('金币不足'); run.gold -= sh.healCost; run.hp = Math.min(heroMaxHp(run), run.hp + Math.round(heroMaxHp(run) * .3)); toast('生命恢复了'); }
  else if (d.k === 'crystal') { if (sh.crystalLeft <= 0) return toast('已售罄'); if (run.gold < sh.crystalCost) return toast('金币不足'); run.gold -= sh.crystalCost; run.crystals++; sh.crystalLeft--; }
  else if (d.k === 'remove') {
    if (run.gold < sh.removeCost) return toast('金币不足');
    const i = await pickDeckCard('选择要移除的卡牌'); if (i == null) return renderShop();
    run.gold -= sh.removeCost; run.removed = (run.removed || 0) + 1; sh.removeCost += 25; run.deck.splice(i, 1); toast('卡牌已移除');
  }
  renderShop();
};
A['shop-leave'] = () => completeNode(UI.shopNode);

/* ---------- 选择卡组中的卡牌 ---------- */
function pickDeckCard(title, filter) {
  const run = G.run;
  const rows = run.deck.map((c, i) => ({ c, i })).filter(x => !filter || filter(x.c)).map(x => cardHTML(cdef(x.c), { cls: 'mini', attrs: `data-a="deck-pick" data-i="${x.i}"` })).join('');
  showModal(`<h3>${title}</h3><div class="deck-grid">${rows || '<p class="dim">没有可选的卡牌</p>'}</div><div class="btnrow"><button class="btn" data-a="deck-cancel">取消</button></div>`, 'wide');
  return waitClick('deck');
}
A['deck-pick'] = d => { closeModal(); fire('deck', +d.i); };
A['deck-cancel'] = () => { closeModal(); fire('deck', null); };

/* ==========================================================
   营地 / 宝藏 / 祭坛
   ========================================================== */
function doRest(node) {
  const run = G.run, mx = heroMaxHp(run);
  UI.restNode = node;
  scr(`<div class="center-box"><div class="big-emoji">🔥</div><h2>营地篝火</h2><p class="dim">温暖的火光让人安心。选择一项休整：</p>
    <div class="btnrow col">
    <button class="btn big" data-a="rest-heal">😴 休息 <small>恢复 ${Math.round(mx * .3)} 点生命（现有 ${run.hp}/${mx}）</small></button>
    <button class="btn big" data-a="rest-smith">🔨 锻造 <small>升级一张卡牌</small></button>
    <button class="btn big" data-a="rest-soul">🔮 灵魂共鸣 <small>出战灵魂各 +8 经验，并消除疲惫</small></button>
    <button class="btn big" data-a="rest-prune">✂ 精简卡组 <small>移除一张卡牌（当前 ${run.deck.length} 张）</small></button></div></div>`);
}
A['rest-heal'] = () => { const run = G.run; run.hp = Math.min(heroMaxHp(run), run.hp + Math.round(heroMaxHp(run) * .3)); finishRest('你睡了个好觉，生命恢复了。'); };
A['rest-smith'] = async () => {
  const i = await pickDeckCard('选择要升级的卡牌', c => !c.up && !CARDS[c.id].unplay && CARDS[c.id].cls !== 'curse');
  if (i == null) return; G.run.deck[i].up = true; finishRest(`「${CARDS[G.run.deck[i].id].n}」被强化了！`);
};
A['rest-prune'] = async () => {
  const i = await pickDeckCard('选择要移除的卡牌'); if (i == null) return;
  const nm = cdef(G.run.deck[i]).n; G.run.deck.splice(i, 1); finishRest(`「${nm}」被移出了卡组，牌库更精炼了。`);
};
A['rest-soul'] = async () => {
  const run = G.run, evos = [];
  for (const s of run.souls) { s.rest = 0; if (run.party.includes(s.uid)) gainXp(s, 8).filter(e => e.t === 'evo').forEach(e => evos.push(e)); }
  for (const e of evos) await showEvolution(e);
  finishRest('灵魂们与你产生了共鸣，变得更强了。');
};
function finishRest(msg) {
  scr(`<div class="center-box"><div class="big-emoji">✨</div><p>${msg}</p><button class="btn pri big" data-a="rest-done">继续</button></div>`);
}
A['rest-done'] = () => completeNode(UI.restNode);
function doTreasure(node) {
  UI.trNode = node;
  const opts = [randGear(null, 'U', 'R'), randGear(null, 'C', 'R')]; UI.tr = [...new Set(opts)];
  const gold = applyRelicGold(G.run, rr(30, 50)); G.run.gold += gold;
  scr(`<div class="hdr"><span></span><h2>🎁 宝藏</h2><span></span></div><p class="center">你发现了一个宝箱，里面有 <b>${gold} 金币</b>！还有以下装备，选一件带走：</p>
    <div class="list-scroll">${UI.tr.map((id, i) => gearRow(GEAR[id], `data-a="tr-pick" data-i="${i}"`)).join('')}</div>`);
}
A['tr-pick'] = d => { G.run.bag.push(UI.tr[+d.i]); toast('装备已放入背包'); completeNode(UI.trNode); };
function doShrine(node) {
  UI.shNode = node;
  const legend = chance(.18);
  UI.sh = legend ? { legend: true, offers: legendOffer() } : { legend: false, offers: randSoulOffer(G.run, 'R', 3) };
  renderShrine();
}
function renderShrine() {
  const sh = UI.sh, run = G.run;
  scr(`<div class="hdr"><span></span><h2>${sh.legend ? '🌟 传说祭坛' : '🔮 灵魂祭坛'}</h2><span class="dim">💎${run.crystals}</span></div>
    <p class="center">${sh.legend ? '祭坛中沉睡着传说级的元素之灵！献上 <b>2 枚灵魂水晶💎</b> 即可缔结契约。' : '古老的祭坛回应了你的召唤，三个强大的灵魂愿意追随你。选择其一：'}</p>
    <div class="list-scroll">${sh.offers.map(id => { const sp = SPECIES[id]; return `<div class="soul-card rar-${sp.rar}" data-a="sh-pick" data-id="${id}"><div class="sc-emoji">${sp.emoji}</div><div class="sc-main"><div class="sc-name">${sp.name}</div><div class="sc-meta">${spBrief(sp)}</div><div class="sc-stat">❤${sp.hp} ⚔${sp.atk} 👣${sp.mov} 🎯${sp.rng}</div><div class="sc-sk">✨${SK[sp.sk].n}：${skillDesc(sp.sk, sp.atk)}</div></div><div class="sc-side">${sh.legend ? '💎2' : ''}</div></div>`; }).join('')}</div>
    <div class="foot"><button class="btn big" data-a="sh-leave">离开</button></div>`);
}
A['sh-pick'] = async d => {
  const run = G.run, sh = UI.sh;
  if (sh.legend && run.crystals < 2) return toast('灵魂水晶不足');
  if (run.souls.length >= ROSTER_MAX && !run.souls.some(s => s.sp === d.id)) return toast('军团已满，请先释放灵魂');
  if (sh.legend) run.crystals -= 2;
  const r = addSoul(run, d.id); Snd.play('catch');
  showModal(`<h3>🔮 契约成立</h3><div class="big-emoji">${SPECIES[d.id].emoji}</div><p>${SPECIES[d.id].name} ${r.merged ? '与你共鸣，星级提升！' : '加入了你的军团！'}</p><div class="btnrow"><button class="btn pri" data-a="sh-done">好的</button></div>`);
};
A['sh-done'] = () => { closeModal(); completeNode(UI.shNode); };
A['sh-leave'] = () => completeNode(UI.shNode);

/* ==========================================================
   随机事件
   ========================================================== */
function doEvent(node) {
  UI.evNode = node; UI.ev = pick(EVENTS); renderEvent();
}
function renderEvent(resultHTML) {
  const ev = UI.ev, run = G.run;
  const opts = ev.opts.map((o, i) => {
    let lack = '';
    if (o.req) { if (o.req.gold && run.gold < o.req.gold) lack = '金币不足'; if (o.req.crystal && run.crystals < o.req.crystal) lack = '水晶不足'; }
    return `<button class="btn big opt" data-a="ev-opt" data-i="${i}" ${lack ? 'disabled' : ''}>${esc(o.t)}${o.d ? `<small>${esc(o.d)}${lack ? ' · ' + lack : ''}</small>` : ''}</button>`;
  }).join('');
  scr(`<div class="center-box"><div class="big-emoji">${ev.e}</div><h2>${ev.t}</h2><p class="ev-text">${ev.text}</p>
    ${resultHTML ? `<div class="ev-result">${resultHTML}</div><button class="btn pri big" data-a="ev-done">继续</button>` : `<div class="btnrow col">${opts}</div>`}
    <div class="dim small">💰${run.gold} · 💎${run.crystals} · ❤${run.hp}/${heroMaxHp(run)}</div></div>`);
}
A['ev-opt'] = async d => {
  const o = UI.ev.opts[+d.i], lines = []; UI.evFight = null;
  await applyRes(o.r, lines);
  if (UI.evFight) {
    UI.evFightRes = lines;
    const kind = UI.evFight; UI.evFight = null;
    return eventFight(kind, lines);
  }
  if (G.run.hp <= 0) return endRun(false);
  renderEvent(lines.map(l => `<div>${l}</div>`).join('') || '<div>……</div>');
};
A['ev-done'] = () => completeNode(UI.evNode);
async function applyRes(list, lines) {
  const run = G.run;
  for (const r of list) {
    if (r.text) lines.push(r.text);
    if (r.gold) { const g = r.gold > 0 ? applyRelicGold(run, r.gold) : r.gold; run.gold = Math.max(0, run.gold + g); lines.push(`💰 金币 ${g > 0 ? '+' : ''}${g}`); }
    if (r.hp != null) {
      const mx = heroMaxHp(run); let v = typeof r.hp === 'string' ? Math.round(mx * parseInt(r.hp) / 100) : r.hp;
      run.hp = clamp(run.hp + v, v < 0 ? 0 : 1, mx); lines.push(`❤ 生命 ${v >= 0 ? '+' : ''}${v}`);
    }
    if (r.maxhp) { const old = heroMaxHp(run); run.hpBonus += r.maxhp; recalcHero(run, old); lines.push(`❤ 最大生命 ${r.maxhp > 0 ? '+' : ''}${r.maxhp}`); }
    if (r.crystal) { run.crystals = Math.max(0, run.crystals + r.crystal); lines.push(`💎 灵魂水晶 ${r.crystal > 0 ? '+' : ''}${r.crystal}`); }
    if (r.card) { const id = r.card === 'rand' ? randCardId(run) : r.card === 'rare' ? randCardId(run, 'rare') : r.card; addCardToDeck(run, id); lines.push(`🃏 获得卡牌「${CARDS[id].n}」`); }
    if (r.curse) { addCardToDeck(run, r.curse); lines.push(`☠️ 卡组加入「${CARDS[r.curse].n}」`); }
    if (r.gear) { const id = r.gear === 'rare' ? randGear(null, 'R', 'E') : randGear(null, 'C', 'R'); run.bag.push(id); lines.push(`${GEAR[id].emoji} 获得装备「${GEAR[id].n}」`); }
    if (r.soul) {
      if (run.souls.length >= ROSTER_MAX) lines.push('军团已满，灵魂离去了……');
      else { const id = r.soul === 'rare' ? randSoulOffer(run, 'R', 1)[0] : randSoulOffer(run, 'C', 1)[0]; const res = addSoul(run, id); lines.push(`${SPECIES[id].emoji} ${res.merged ? '灵魂共鸣' : '获得灵魂'}「${SPECIES[id].name}」`); }
    }
    if (r.fight) { UI.evFight = r.fight; }
    if (r.chance) { const [p, a, b] = r.chance; await applyRes(Math.random() < p ? a : b, lines); }
    if (r.removeCard) { const i = await pickDeckCard('选择要移除的卡牌'); if (i != null) { lines.push(`🔥 移除了「${cdef(run.deck[i]).n}」`); run.deck.splice(i, 1); } }
    if (r.upgradeCard) { const i = await pickDeckCard('选择要升级的卡牌', c => !c.up && !CARDS[c.id].unplay); if (i != null) { run.deck[i].up = true; lines.push(`🔨 「${CARDS[run.deck[i].id].n}」被强化`); } }
    if (r.dupCard) { const i = await pickDeckCard('选择要复制的卡牌', c => !CARDS[c.id].unplay && canAddCard(run, c.id)); if (i != null) { run.deck.push(Object.assign({}, run.deck[i])); lines.push(`🪞 复制了「${cdef(run.deck[i]).n}」`); } }
  }
}
async function eventFight(kind, lines) {
  const run = G.run; const node = UI.evNode;
  const enc = genEncounter(run, kind);
  scr(battleShell(), 'battle-scr'); S.units = new Map(); S.tileEls = [];
  maybeTutorial();
  const res = await startBattle(run, enc);
  run.hp = Math.max(0, res.hp);
  if (!res.win) return endRun(false);
  await afterBattle(res, node, enc);
  completeNode(node);
}

/* ==========================================================
   军团 / 装备 / 卡组
   ========================================================== */
A.army = d => { UI.army = d.t || UI.army; renderArmy(); };
function renderArmy() {
  const run = G.run, tab = UI.army;
  const tabs = [['souls', '灵魂'], ['hero', '装备'], ['deck', '卡组']].map(([k, n]) => `<button class="tab${tab === k ? ' on' : ''}" data-a="army" data-t="${k}">${n}</button>`).join('');
  let body = '';
  if (tab === 'souls') {
    const rows = run.souls.slice().sort((a, b) => (run.party.includes(b.uid) - run.party.includes(a.uid)) || SPECIES[b.sp].stage - SPECIES[a.sp].stage).map(s => soulRow(s, { attrs: `data-a="soul-open" data-u="${s.uid}"` })).join('');
    body = `<p class="dim small center">出战 ${run.party.length}/${partyMax(run)} · 军团 ${run.souls.length}/${ROSTER_MAX} · 点击灵魂查看详情</p><div class="list-scroll in-modal">${rows || '<p class="center dim">还没有灵魂</p>'}</div>`;
  } else if (tab === 'hero') {
    const c = CLASSES[run.cls], gm = heroMods(run);
    const slots = ['weapon', 'armor', 'charm'].map(sl => { const g = run.gear[sl] ? GEAR[run.gear[sl]] : null; return g ? gearRow(g, `data-a="unequip" data-s="${sl}"`, '<small>卸下</small>') : `<div class="soul-card empty"><div class="sc-emoji">＋</div><div class="sc-main"><div class="sc-name">${SLOT_N[sl]}</div><div class="sc-stat">未装备</div></div></div>`; }).join('');
    const bag = run.bag.map((id, i) => gearRow(GEAR[id], `data-a="equip" data-i="${i}"`, GEAR[id].slot === 'soul' ? '<small>给灵魂</small>' : '<small>装备</small>')).join('') || '<p class="dim center small">背包空空如也</p>';
    body = `<div class="list-scroll in-modal"><div class="hero-card"><span class="big-emoji">${c.emoji}</span><div><b>${c.n}</b><div class="dim small">❤${heroMaxHp(run)} ⚔${c.atk + (gm.atk || 0)} 👣${c.mov + (gm.mov || 0)} 🎯${c.rng + (gm.rng || 0)} ⚡${c.en + (gm.energy || 0)}</div></div></div>
      <h4>已装备</h4>${slots}<h4>背包</h4>${bag}</div>`;
  } else {
    const cnt = {}; run.deck.forEach(c => { const d = cdef(c); const k = d.id + (c.up ? '+' : ''); (cnt[k] = cnt[k] || { d, n: 0 }).n++; });
    const sz = run.deck.length, types = {}; run.deck.forEach(c => { const t = cdef(c).ty; types[t] = (types[t] || 0) + 1; });
    body = `<p class="dim small center">卡组 ${sz} 张${sz > DECK_SOFT_MAX ? ' · <b class="warn">过厚，关键牌更难抽到</b>' : sz < 12 ? ' · 偏薄，容易重复抽到' : ' · 大小合适'} ｜ ${Object.entries(types).map(([t, n]) => TYPE_N[t] + n).join(' ')}<br>构筑限制：普通/优秀同名最多2张，稀有最多1张</p><div class="list-scroll in-modal"><div class="deck-grid">${Object.values(cnt).map(x => cardHTML(x.d, { cls: 'mini', extra: x.n > 1 ? `<div class="c-cnt">×${x.n}</div>` : '' })).join('')}</div></div>`;
  }
  showModal(`<div class="army-hdr"><div class="tabs">${tabs}</div><button class="icon-btn" data-a="army-close">✕</button></div>${body}`, 'full');
}
A['army-close'] = () => closeModal();
A['soul-open'] = d => {
  const run = G.run, s = run.souls.find(x => x.uid === d.u); if (!s) return;
  const sp = SPECIES[s.sp], st = soulStats(s), inP = run.party.includes(s.uid);
  const evo = sp.evo ? `Lv${sp.evoLv} 进化为 ${SPECIES[sp.evo].emoji}${SPECIES[sp.evo].name}` : (sp.legend || sp.boss ? '传说之魂' : '已是最终形态');
  const gearOpts = run.bag.map((id, i) => ({ id, i })).filter(x => GEAR[x.id].slot === 'soul');
  const fam = FAMILIES[sp.fam];
  showModal(`<div class="sd-head"><div class="sd-emoji stage-${sp.stage}">${sp.emoji}</div><div><h3>${esc(sp.name)} <small>${stars(s.star)}</small></h3><div>${spBrief(sp)}</div></div></div>
    <div class="sd-stats"><div><small>等级</small><b>${s.lv}</b></div><div><small>生命</small><b>${st.hp}</b></div><div><small>攻击</small><b>${st.atk}</b></div><div><small>移动</small><b>${st.mov}</b></div><div><small>射程</small><b>${st.rng}</b></div></div>
    <div class="dim small">经验 ${s.xp}/${expNeed(s.lv)} · 召唤费用 ${spCost(sp)}⚡ · 进化：${evo}</div>
    <div class="sd-sk"><b>✨${SK[sp.sk].n}</b>（冷却${SK[sp.sk].cd}）：${skillDesc(sp.sk, st.atk)}</div>
    ${sp.ps ? `<div class="sd-sk"><b>被动·${PS[sp.ps][0]}</b>：${PS[sp.ps][1]}</div>` : ''}
    <div class="sd-sk"><b>属性</b>：${ELEM[sp.elem].n} — 克制 ${ELEM[BEATS[sp.elem]].n}，被 ${ELEM[Object.keys(BEATS).find(k => BEATS[k] === sp.elem)].n} 克制</div>
    <div class="sd-gear"><b>装备</b>：${s.gear ? `${GEAR[s.gear].emoji}${GEAR[s.gear].n} <small>${gearDesc(GEAR[s.gear])}</small> <button class="btn sm" data-a="soul-unequip" data-u="${s.uid}">卸下</button>` : '<span class="dim">无</span>'}</div>
    ${gearOpts.length ? `<div class="sd-bag">${gearOpts.map(x => `<button class="btn sm" data-a="soul-equip" data-u="${s.uid}" data-i="${x.i}">${GEAR[x.id].emoji}${GEAR[x.id].n} ${gearDesc(GEAR[x.id])}</button>`).join('')}</div>` : ''}
    ${s.rest ? '<div class="warn small">💤 该灵魂处于疲惫状态，下场战斗无法出战</div>' : ''}
    <div class="btnrow"><button class="btn ${inP ? '' : 'pri'}" data-a="soul-party" data-u="${s.uid}">${inP ? '移出出战' : '设为出战'}</button><button class="btn danger" data-a="soul-release" data-u="${s.uid}">释放 (+${releaseValue(s)}💰)</button><button class="btn" data-a="army" data-t="souls">返回</button></div>`, 'wide');
};
A['soul-party'] = d => {
  const run = G.run, s = run.souls.find(x => x.uid === d.u);
  if (run.party.includes(s.uid)) run.party = run.party.filter(u => u !== s.uid);
  else if (run.party.length >= partyMax(run)) { toast('出战名额已满'); return; } else run.party.push(s.uid);
  saveRun(); renderArmy();
};
A['soul-release'] = d => {
  const run = G.run, i = run.souls.findIndex(x => x.uid === d.u), s = run.souls[i];
  if (run.souls.length <= 1) return toast('至少保留一个灵魂');
  run.gold += releaseValue(s); if (s.gear) run.bag.push(s.gear);
  run.souls.splice(i, 1); run.party = run.party.filter(u => u !== s.uid); saveRun(); renderArmy();
};
A['soul-equip'] = d => { const run = G.run, s = run.souls.find(x => x.uid === d.u); const id = run.bag.splice(+d.i, 1)[0]; if (s.gear) run.bag.push(s.gear); s.gear = id; saveRun(); A['soul-open']({ u: s.uid }); };
A['soul-unequip'] = d => { const run = G.run, s = run.souls.find(x => x.uid === d.u); if (s.gear) { run.bag.push(s.gear); s.gear = null; } saveRun(); A['soul-open']({ u: s.uid }); };
A.equip = d => {
  const run = G.run, id = run.bag[+d.i], g = GEAR[id];
  if (g.slot === 'soul') { UI.army = 'souls'; toast('在灵魂详情中装备'); renderArmy(); return; }
  const old = heroMaxHp(run); run.bag.splice(+d.i, 1);
  if (run.gear[g.slot]) run.bag.push(run.gear[g.slot]);
  run.gear[g.slot] = id; recalcHero(run, old); saveRun(); renderArmy();
};
A.unequip = d => { const run = G.run, old = heroMaxHp(run); run.bag.push(run.gear[d.s]); run.gear[d.s] = null; recalcHero(run, old); saveRun(); renderArmy(); };

/* ==========================================================
   图鉴
   ========================================================== */
function showCodex(filter) {
  UI.codexFilter = filter || UI.codexFilter;
  const f = UI.codexFilter, cx = G.meta.codex;
  const list = SPECIES_LIST.filter(sp => f === 'all' || (f === 'F' && sp.reg.includes('F') && !sp.boss) || (f === 'R' && sp.reg.includes('R')) || (f === 'C' && sp.reg.includes('C')) || (f === 'S' && (sp.boss || sp.legend)));
  const tiles = list.map(sp => {
    const c = cx[sp.id], caught = c && c.caught, seen = c && c.seen;
    return `<div class="dex-tile rar-${sp.rar}${caught ? ' caught' : seen ? ' seen' : ''}" data-a="dex-open" data-id="${sp.id}"><div class="dex-emoji">${seen || caught ? sp.emoji : '❓'}</div><small>${caught || seen ? sp.name : '？？？'}</small>${caught ? '<i>●</i>' : ''}</div>`;
  }).join('');
  const chips = [['all', '全部'], ['F', '森林'], ['R', '遗迹'], ['C', '魔城'], ['S', '首领/传说']].map(([k, n]) => `<button class="tab${f === k ? ' on' : ''}" data-a="dex-filter" data-f="${k}">${n}</button>`).join('');
  scr(`<div class="hdr"><button class="icon-btn" data-a="${G.run && UI.fromRun ? 'dex-back' : 'title'}">‹</button><h2>灵魂图鉴</h2><span class="dim">${codexCount()}/${SPECIES_LIST.length}</span></div>
    <div class="tabs scroll">${chips}</div><div class="list-scroll"><div class="dex-grid">${tiles}</div></div>`);
}
A.codex = () => { UI.fromRun = !!(G.run && G.run.map && app.querySelector('.map-scr')); closeModal(); showCodex(); };
A['dex-back'] = () => showMap();
A['dex-filter'] = d => showCodex(d.f);
A['dex-open'] = d => {
  const sp = SPECIES[d.id], c = G.meta.codex[d.id], seen = c && (c.seen || c.caught), caught = c && c.caught;
  if (!seen) { showModal(`<h3>？？？</h3><p class="dim">尚未遇见这只魔物。<br>分布：${sp.boss ? '区域首领' : sp.legend ? '传说祭坛' : sp.reg.split('').map(r => REGIONS.find(x => x.id === r).n).join('、')}</p><div class="btnrow"><button class="btn" data-a="modal-close">关闭</button></div>`); return; }
  const chain = FAMILIES[sp.fam].length > 1 ? FAMILIES[sp.fam].map(x => { const cc = G.meta.codex[x.id]; return `<span class="evo-step${x.id === sp.id ? ' now' : ''}">${cc && (cc.seen || cc.caught) ? x.emoji + x.name : '❓'}</span>`; }).join(' ➜ ') : '';
  showModal(`<div class="sd-head"><div class="sd-emoji stage-${sp.stage}">${sp.emoji}</div><div><h3>${sp.name}</h3><div>${spBrief(sp)}</div></div></div>
    <div class="sd-stats"><div><small>生命</small><b>${sp.hp}</b></div><div><small>攻击</small><b>${sp.atk}</b></div><div><small>移动</small><b>${sp.mov}</b></div><div><small>射程</small><b>${sp.rng}</b></div><div><small>阶段</small><b>${sp.legend ? '传说' : sp.boss ? '首领' : sp.stage}</b></div></div>
    <div class="sd-sk"><b>✨${SK[sp.sk].n}</b>：${skillDesc(sp.sk, sp.atk)}</div>${sp.ps ? `<div class="sd-sk"><b>被动·${PS[sp.ps][0]}</b>：${PS[sp.ps][1]}</div>` : ''}
    ${(sp.bossSk || []).length ? `<div class="sd-sk"><b>首领技能</b>：${sp.bossSk.map(k => SK[k].n).join('、')}</div>` : ''}
    <div class="dim small">分布：${sp.boss ? '区域首领（必定可收服）' : sp.legend ? '传说祭坛（需灵魂水晶）' : sp.reg.split('').map(r => REGIONS.find(x => x.id === r).n).join('、')} · 收服 ${c.caught || 0} 次</div>
    ${chain ? `<div class="evo-chain">${chain}</div>` : ''}<div class="btnrow"><button class="btn" data-a="modal-close">关闭</button></div>`, 'wide');
};

/* ==========================================================
   魂之殿堂（永久强化）
   ========================================================== */
function showHall() {
  const rows = Object.entries(META_UP).map(([k, u]) => {
    const lv = G.meta.up[k] || 0, maxed = lv >= u.max, cost = u.cost(lv);
    return `<div class="soul-card"><div class="sc-emoji">${u.e}</div><div class="sc-main"><div class="sc-name">${u.n} <small>Lv${lv}/${u.max}</small></div><div class="sc-stat">${u.d}</div></div><div class="sc-side">${maxed ? '<b class="ok">已满</b>' : `<button class="btn ${G.meta.essence >= cost ? 'pri' : ''}" data-a="hall-buy" data-k="${k}" ${G.meta.essence >= cost ? '' : 'disabled'}>💠${cost}</button>`}</div></div>`;
  }).join('');
  const cls = Object.entries(CLASSES).filter(([id]) => !G.meta.unlocked[id]).map(([id, c]) => `<div class="soul-card"><div class="sc-emoji">${c.emoji}</div><div class="sc-main"><div class="sc-name">解锁职业：${c.n}</div><div class="sc-stat">${c.d}</div></div><div class="sc-side"><button class="btn ${G.meta.essence >= c.cost ? 'pri' : ''}" data-a="hall-cls" data-id="${id}" ${G.meta.essence >= c.cost ? '' : 'disabled'}>💠${c.cost}</button></div></div>`).join('');
  scr(`<div class="hdr"><button class="icon-btn" data-a="title">‹</button><h2>魂之殿堂</h2><span class="gold">💠${G.meta.essence}</span></div>
    <p class="center dim small">每次远征结束都会获得魂晶，用来永久强化后续的冒险。</p><div class="list-scroll">${rows}${cls}</div>`);
}
A.hall = () => showHall();
A['hall-buy'] = d => { const u = META_UP[d.k], lv = G.meta.up[d.k] || 0, c = u.cost(lv); if (G.meta.essence < c || lv >= u.max) return; G.meta.essence -= c; G.meta.up[d.k] = lv + 1; saveMeta(); showHall(); };
A['hall-cls'] = d => { const c = CLASSES[d.id]; if (G.meta.essence < c.cost) return; G.meta.essence -= c.cost; G.meta.unlocked[d.id] = 1; saveMeta(); toast(c.n + ' 已解锁！'); showHall(); };

/* ==========================================================
   结算
   ========================================================== */
function endRun(win) {
  const run = G.run, st = run.stats;
  const gain = st.floors * 2 + run.newDex.length * 5 + st.bosses * 20 + (win ? 60 : 0) + Math.floor(st.kills / 3);
  G.meta.essence += gain; G.meta.runs++; if (win) G.meta.wins++; G.meta.best = Math.max(G.meta.best, st.floors + (run.region) * 100);
  let legend = null;
  if (win) { const pool = SPECIES_LIST.filter(s => s.legend && !(G.meta.codex[s.id] && G.meta.codex[s.id].caught)); if (pool.length) { legend = pick(pool); dexCatch(legend.id); } }
  saveMeta(); Store.del('run');
  Snd.play(win ? 'win' : 'lose');
  const dex = run.newDex.map(id => `<span title="${SPECIES[id].name}">${SPECIES[id].emoji}</span>`).join('');
  scr(`<div class="center-box"><div class="big-emoji">${win ? '👑' : '💀'}</div><h2>${win ? '远征成功！' : '远征失败'}</h2>
    <p class="dim">${win ? '魔王已被击败，大陆重归和平。' : (run.hp <= 0 ? `${CLASSES[run.cls].emoji} 英雄倒下了……` : '你选择了撤退。')}</p>
    <div class="sum-rows"><div class="row"><span>🗺 到达</span><b>${REGIONS[run.region].n} · ${st.floors} 层</b></div><div class="row"><span>⚔ 战斗/击败</span><b>${st.battles} / ${st.kills}</b></div>
    <div class="row"><span>🔮 收服灵魂</span><b>${st.caught}</b></div><div class="row"><span>👑 击败首领</span><b>${st.bosses}</b></div>
    <div class="row"><span>📖 图鉴新发现</span><b>${run.newDex.length} ${dex}</b></div>${legend ? `<div class="row"><span>🌟 通关奖励</span><b>${legend.emoji}${legend.name} 载入图鉴</b></div>` : ''}
    <div class="row hl"><span>💠 获得魂晶</span><b>+${gain}</b></div></div>
    <button class="btn pri big" data-a="title">返回标题</button></div>`);
  G.run = null;
}

/* ==========================================================
   继续存档
   ========================================================== */
A.continue = () => {
  const r = Store.get('run'); if (!r) return showTitle();
  G.run = r; showMap();
};
A.bmenu = () => showModal(`<h3>战斗菜单</h3><div class="btnrow col"><button class="btn" data-a="sound3">${Snd.on ? '🔊 音效：开' : '🔇 音效：关'}</button><button class="btn" data-a="howto">📜 玩法说明</button><button class="btn danger" data-a="giveup">🏳 放弃本次远征</button><button class="btn pri" data-a="modal-close">继续战斗</button></div>`);
A.sound3 = () => { Snd.on = !Snd.on; G.meta.sound = Snd.on; saveMeta(); A.bmenu(); };

/* ---------- 战斗内按钮 ---------- */
A.endturn = () => { if (S.mode === 'card') clearSel(); endPlayerTurn(); };
A.danger = () => { S.danger = !S.danger; V.sync(); };
A['pile-draw'] = () => B && showPile('draw');
A['pile-disc'] = () => B && showPile('disc');
A['card-use'] = () => useCardNow();
A['card-cancel'] = () => { clearSel(); V.sync(); };
A['ub-wait'] = () => { const u = S.sel; if (u) { u.moved = u.acted = true; } clearSel(); V.sync(); };
A['ub-skill'] = async () => {
  const u = S.sel; if (!u || B.busy) return; const sk = u.sks[0]; if (!sk || sk.cd > 0 || u.acted) return;
  if (S.mode === 'skill') { S.mode = 'unit'; S.sk = null; V.sync(); return; }
  const s = SK[sk.k];
  if (s.tg === 's' || s.tg === 'z') { clearSel(); await unitSkill(u, sk, null); if (u.hp > 0 && B.units.includes(u)) { S.sel = u; S.mode = 'unit'; } V.sync(); return; }
  S.mode = 'skill'; S.sk = sk; V.sync();
  if (!S.hl.size) toast('射程内没有合适目标');
};
document.addEventListener('click', e => {
  const board = e.target.closest('#board');
  if (board && B) {
    const un = e.target.closest('.unit'), tl = e.target.closest('.tile');
    if (un) { const u = B.units.find(x => x.uid === un.dataset.uid); if (u) return onTile(u.x, u.y); }
    if (tl) return onTile(+tl.dataset.x, +tl.dataset.y);
    return;
  }
  const card = e.target.closest('#bhand .card');
  if (card) { Snd.init(); return onCard(+card.dataset.i); }
  const t = e.target.closest('[data-a]');
  if (!t || t.disabled) return;
  const f = A[t.dataset.a];
  if (f) { Snd.init(); Snd.play('click'); f(t.dataset, t, e); }
});
