'use strict';
/* ========== 卡牌库 ========== */
const CARDS = {};
// C(id, 名称, 费用, 类型(A攻击 S技能 P能力 U召唤 X诅咒), 目标(e敌 a友 s自身 t格子 z全体/无), 射程, 效果[], 稀有度(S起始 C U R), 职业, 选项)
function C(id, n, cost, ty, tg, rng, fx, rar, cls, o) { CARDS[id] = Object.assign({ id, n, cost, ty, tg, rng, fx, rar, cls }, o || {}); }
const X = { exhaust: 1 };

/* ----- 通用 ----- */
C('defend', '防御', 1, 'S', 's', 0, [{ t: 'blk', v: 5 }], 'S', 'all');
C('intuition', '战斗直觉', 0, 'S', 's', 0, [{ t: 'draw', v: 2 }], 'C', 'all', X);
C('potion', '治疗药剂', 1, 'S', 's', 0, [{ t: 'heal', v: 8 }], 'C', 'all', X);
C('ironclad', '铁壁', 1, 'S', 's', 0, [{ t: 'blk', v: 9 }], 'C', 'all');
C('regroup', '重整', 0, 'S', 's', 0, [{ t: 'blk', v: 3 }, { t: 'draw', v: 1 }], 'C', 'all');
C('fury', '狂怒', 1, 'A', 'e', 2, [{ t: 'dmg', v: 11 }, { t: 'hurt', v: 3 }], 'U', 'all');
C('flamecharm', '火焰符', 1, 'A', 'e', 3, [{ t: 'dmg', v: 5, el: 'fire' }, { t: 'st', s: 'burn', v: 2 }], 'C', 'all');
C('watercharm', '水弹符', 1, 'A', 'e', 3, [{ t: 'dmg', v: 7, el: 'water' }], 'C', 'all');
C('thundercharm', '雷击符', 1, 'A', 'e', 3, [{ t: 'dmg', v: 7, el: 'thunder' }], 'C', 'all');
C('woodcharm', '木刺符', 1, 'A', 'e', 3, [{ t: 'dmg', v: 5, el: 'wood' }, { t: 'st', s: 'poison', v: 2 }], 'C', 'all');
C('lightcharm', '圣光符', 1, 'A', 'e', 3, [{ t: 'dmg', v: 7, el: 'light' }], 'C', 'all');
C('darkcharm', '暗影符', 1, 'A', 'e', 3, [{ t: 'dmg', v: 7, el: 'dark' }], 'C', 'all');
C('retreat', '战术撤退', 1, 'S', 't', 3, [{ t: 'tp' }, { t: 'blk', v: 4 }], 'C', 'all');
C('energycrystal', '能量结晶', 0, 'S', 's', 0, [{ t: 'nrg', v: 1 }], 'U', 'all', X);
C('supply', '补给', 1, 'S', 's', 0, [{ t: 'draw', v: 3 }], 'U', 'all', X);
C('soulcrystal', '灵魂水晶', 1, 'S', 's', 0, [{ t: 'crystal', v: 1 }], 'U', 'all', X);
C('lucky', '幸运硬币', 0, 'S', 's', 0, [{ t: 'gold', v: 20 }], 'C', 'all', X);
C('soulsnare', '灵魂陷阱', 1, 'S', 'e', 4, [{ t: 'mark', v: 60 }], 'U', 'all');
C('adrenaline', '肾上腺素', 0, 'S', 's', 0, [{ t: 'nrg', v: 1 }, { t: 'draw', v: 1 }], 'R', 'all', X);
C('sweep', '横扫', 1, 'A', 's', 0, [{ t: 'dmg', v: 6, ctr: 'self', r: 1 }], 'C', 'all');
C('shockwave', '冲击波', 2, 'A', 'e', 3, [{ t: 'dmg', v: 8 }, { t: 'push', v: 2 }], 'U', 'all');
C('pullhook', '钩索', 1, 'A', 'e', 4, [{ t: 'dmg', v: 4 }, { t: 'pull', v: 3 }], 'C', 'all');
C('ultimate', '终极爆发', 3, 'A', 'z', 0, [{ t: 'dmg', v: 15, all: 1 }], 'R', 'all', X);
C('recall', '灵魂回响', 2, 'S', 'z', 0, [{ t: 'refresh', on: 'souls' }], 'R', 'all', X);

/* ----- 骑士 ----- */
C('strike_k', '重击', 1, 'A', 'e', 1, [{ t: 'dmg', v: 8 }], 'S', 'knight');
C('bash', '盾击', 1, 'A', 'e', 1, [{ t: 'dmg', v: 4, pb: 1 }], 'C', 'knight');
C('whirl', '旋风斩', 2, 'A', 's', 0, [{ t: 'dmg', v: 7, ctr: 'self', r: 1, n: 2 }], 'U', 'knight');
C('charge_k', '冲锋', 1, 'A', 'e', 3, [{ t: 'dash' }, { t: 'dmg', v: 7 }], 'C', 'knight');
C('ironwill', '钢铁意志', 1, 'S', 's', 0, [{ t: 'blk', v: 9 }], 'C', 'knight');
C('warcry', '战吼', 1, 'S', 'z', 0, [{ t: 'str', v: 2, on: 'souls' }, { t: 'blk', v: 4, on: 'souls' }], 'U', 'knight');
C('provoke', '挑衅', 1, 'S', 's', 0, [{ t: 'blk', v: 8 }, { t: 'st', s: 'taunt', v: 2, on: 'self' }], 'C', 'knight');
C('guardian', '守护', 1, 'S', 'a', 3, [{ t: 'blk', v: 12, on: 'target' }], 'C', 'knight');
C('breaker', '破阵', 2, 'A', 'e', 1, [{ t: 'dmg', v: 13 }, { t: 'st', s: 'vuln', v: 2 }], 'U', 'knight');
C('thornmail', '荆棘甲', 1, 'P', 's', 0, [{ t: 'pw', k: 'thorns', v: 3 }], 'U', 'knight');
C('fortify', '不屈', 2, 'P', 's', 0, [{ t: 'pw', k: 'fort', v: 4 }], 'R', 'knight');
C('oath', '圣骑誓约', 1, 'S', 's', 0, [{ t: 'heal', v: 7 }, { t: 'blk', v: 5 }], 'C', 'knight');
C('shieldwall', '盾墙', 2, 'S', 'z', 0, [{ t: 'blk', v: 14 }, { t: 'blk', v: 6, on: 'souls' }], 'U', 'knight');
C('finisher', '终结一击', 3, 'A', 'e', 1, [{ t: 'dmg', v: 26 }], 'R', 'knight', X);
C('banner', '军旗', 2, 'P', 's', 0, [{ t: 'pw', k: 'sbond', v: 4 }], 'R', 'knight');
C('crush', '碎甲重锤', 1, 'A', 'e', 1, [{ t: 'dmg', v: 5 }, { t: 'st', s: 'vuln', v: 2 }], 'C', 'knight');

/* ----- 法师 ----- */
C('strike_m', '魔弹', 1, 'A', 'e', 3, [{ t: 'dmg', v: 6 }], 'S', 'mage');
C('fireball_c', '火球术', 2, 'A', 'e', 4, [{ t: 'dmg', v: 10, r: 1, el: 'fire' }, { t: 'st', s: 'burn', v: 2, r: 1 }], 'C', 'mage');
C('icelance', '冰锥术', 1, 'A', 'e', 3, [{ t: 'dmg', v: 6, el: 'water' }, { t: 'st', s: 'weak', v: 2 }], 'C', 'mage');
C('lightning', '闪电链', 1, 'A', 'e', 4, [{ t: 'chain', v: 7, n: 2, r: 2, el: 'thunder' }], 'C', 'mage');
C('meteor', '陨石术', 3, 'A', 't', 5, [{ t: 'dmg', v: 20, r: 1, el: 'fire' }], 'R', 'mage');
C('firestorm', '烈焰风暴', 3, 'A', 'z', 0, [{ t: 'dmg', v: 8, all: 1, el: 'fire' }, { t: 'st', s: 'burn', v: 2, all: 1 }], 'R', 'mage', X);
C('blink', '闪现', 1, 'S', 't', 4, [{ t: 'tp' }], 'C', 'mage');
C('arcshield', '魔法盾', 1, 'S', 's', 0, [{ t: 'blk', v: 8 }], 'C', 'mage');
C('surge', '魔力涌动', 3, 'P', 's', 0, [{ t: 'pw', k: 'nrg', v: 1 }], 'R', 'mage');
C('meditate', '冥想', 0, 'S', 's', 0, [{ t: 'draw', v: 2 }], 'C', 'mage', X);
C('ignite', '点燃', 1, 'S', 'e', 4, [{ t: 'st', s: 'burn', v: 5 }], 'C', 'mage');
C('detonate', '引爆', 1, 'A', 'e', 4, [{ t: 'det', v: 3 }], 'U', 'mage');
C('thunderstorm', '雷暴', 2, 'A', 't', 5, [{ t: 'dmg', v: 8, r: 2, el: 'thunder' }, { t: 'st', s: 'weak', v: 1, r: 2 }], 'U', 'mage');
C('timewarp', '时间扭曲', 2, 'S', 'z', 0, [{ t: 'nrg', v: 2 }, { t: 'draw', v: 1 }], 'U', 'mage', X);
C('frostnova', '冰霜新星', 1, 'A', 's', 0, [{ t: 'dmg', v: 5, ctr: 'self', r: 2, el: 'water' }, { t: 'st', s: 'weak', v: 2, ctr: 'self', r: 2 }], 'U', 'mage');
C('deepfreeze', '冰封', 2, 'A', 'e', 3, [{ t: 'dmg', v: 8, el: 'water' }, { t: 'st', s: 'stun', v: 1 }], 'U', 'mage');

/* ----- 游侠 ----- */
C('strike_r', '速射', 1, 'A', 'e', 4, [{ t: 'dmg', v: 6 }], 'S', 'ranger');
C('piercing', '穿云箭', 1, 'A', 'e', 5, [{ t: 'dmg', v: 7, line: 1 }], 'C', 'ranger');
C('arrowrain', '箭雨', 2, 'A', 't', 5, [{ t: 'dmg', v: 7, r: 1 }], 'C', 'ranger');
C('poisonarrow', '毒箭', 1, 'A', 'e', 4, [{ t: 'dmg', v: 4 }, { t: 'st', s: 'poison', v: 4 }], 'C', 'ranger');
C('trap', '陷阱', 1, 'S', 't', 3, [{ t: 'trap', v: 10 }], 'C', 'ranger');
C('backstep', '撤步', 0, 'S', 't', 2, [{ t: 'tp' }, { t: 'blk', v: 3 }], 'C', 'ranger');
C('aim', '瞄准', 1, 'S', 's', 0, [{ t: 'st', s: 'focus', v: 1, on: 'self' }], 'C', 'ranger');
C('snipe', '狙击', 2, 'A', 'e', 7, [{ t: 'dmg', v: 18 }], 'U', 'ranger');
C('rapid', '连射', 1, 'A', 'e', 4, [{ t: 'dmg', v: 3, n: 3 }], 'C', 'ranger');
C('wolfcall', '野性召唤', 1, 'U', 't', 2, [{ t: 'sum', id: 'wolf' }], 'U', 'ranger');
C('huntmark', '猎人印记', 0, 'S', 'e', 5, [{ t: 'mark', v: 40 }, { t: 'st', s: 'vuln', v: 2 }], 'C', 'ranger');
C('firearrow', '燃烧箭', 1, 'A', 'e', 4, [{ t: 'dmg', v: 5, el: 'fire' }, { t: 'st', s: 'burn', v: 3 }], 'C', 'ranger');
C('thicket', '荆棘陷阱', 2, 'S', 't', 3, [{ t: 'trap', v: 18 }], 'U', 'ranger');
C('naturalheal', '自然恢复', 1, 'S', 's', 0, [{ t: 'heal', v: 6 }, { t: 'draw', v: 1 }], 'C', 'ranger');
C('instinct', '猎手本能', 1, 'P', 's', 0, [{ t: 'pw', k: 'focus', v: 1 }], 'R', 'ranger');
C('arrowstorm', '万箭齐发', 3, 'A', 'z', 0, [{ t: 'dmg', v: 9, all: 1 }], 'R', 'ranger', X);

/* ----- 牧师 ----- */
C('strike_p', '圣光弹', 1, 'A', 'e', 3, [{ t: 'dmg', v: 5, el: 'light' }], 'S', 'priest');
C('heal_c', '治愈术', 1, 'S', 'a', 4, [{ t: 'heal', v: 10, on: 'target' }], 'C', 'priest');
C('bless', '祝福', 1, 'S', 'a', 4, [{ t: 'blk', v: 8, on: 'target' }, { t: 'str', v: 1, on: 'target' }], 'C', 'priest');
C('massheal', '群体治愈', 2, 'S', 'z', 0, [{ t: 'heal', v: 7, on: 'allies' }], 'U', 'priest');
C('holystrike', '神圣打击', 2, 'A', 'e', 3, [{ t: 'dmg', v: 12, el: 'light' }], 'C', 'priest');
C('purify', '净化', 1, 'S', 'a', 4, [{ t: 'cleanse', on: 'target' }, { t: 'heal', v: 4, on: 'target' }, { t: 'draw', v: 1 }], 'C', 'priest');
C('sanctuary', '圣盾', 1, 'S', 'a', 4, [{ t: 'blk', v: 12, on: 'target' }], 'C', 'priest');
C('radiance', '圣愈之光', 3, 'S', 'z', 0, [{ t: 'heal', v: 16, on: 'allies' }], 'R', 'priest', X);
C('chastise', '惩戒', 1, 'A', 'e', 3, [{ t: 'dmg', v: 4, el: 'light' }, { t: 'st', s: 'weak', v: 2 }], 'C', 'priest');
C('judgment', '光之审判', 3, 'A', 'z', 0, [{ t: 'dmg', v: 11, all: 1, el: 'light' }], 'R', 'priest', X);
C('fountain', '生命之泉', 2, 'P', 's', 0, [{ t: 'pw', k: 'aura', v: 2 }], 'R', 'priest');
C('prayer', '圣言', 0, 'S', 's', 0, [{ t: 'blk', v: 4 }, { t: 'draw', v: 1 }], 'C', 'priest');
C('angelward', '守护天使', 1, 'S', 'z', 0, [{ t: 'blk', v: 6, on: 'allies' }], 'U', 'priest');
C('soothe', '灵魂安抚', 1, 'S', 'z', 0, [{ t: 'str', v: 2, on: 'souls' }, { t: 'heal', v: 4, on: 'souls' }], 'U', 'priest');
C('penance', '苦修', 0, 'S', 's', 0, [{ t: 'hurt', v: 4 }, { t: 'nrg', v: 1 }], 'C', 'priest');
C('hymn', '光明祈祷', 1, 'P', 's', 0, [{ t: 'pw', k: 'regen', v: 3 }], 'U', 'priest');

/* ----- 唤灵师 ----- */
C('strike_s', '灵魂箭', 1, 'A', 'e', 3, [{ t: 'dmg', v: 5, el: 'dark' }], 'S', 'summoner');
C('skeleton_c', '召唤骷髅', 1, 'U', 't', 2, [{ t: 'sum', id: 'skeleton' }], 'C', 'summoner');
C('wisp_c', '鬼火召唤', 1, 'U', 't', 2, [{ t: 'sum', id: 'wisp', n: 2 }], 'C', 'summoner');
C('mark_c', '灵魂标记', 0, 'S', 'e', 4, [{ t: 'mark', v: 50 }], 'C', 'summoner');
C('command', '战术号令', 1, 'S', 'a', 5, [{ t: 'refresh', on: 'target' }], 'U', 'summoner');
C('bloodrite', '血肉祭祀', 0, 'S', 's', 0, [{ t: 'hurt', v: 4 }, { t: 'nrg', v: 1 }, { t: 'draw', v: 1 }], 'C', 'summoner');
C('empower', '魂力灌注', 1, 'S', 'z', 0, [{ t: 'str', v: 2, on: 'souls' }, { t: 'blk', v: 4, on: 'souls' }], 'C', 'summoner');
C('legion', '亡灵军势', 2, 'U', 't', 2, [{ t: 'sum', id: 'skeleton', n: 3 }], 'U', 'summoner', X);
C('harvest', '灵魂收割', 2, 'A', 'e', 3, [{ t: 'dmg', v: 10, el: 'dark' }, { t: 'mark', v: 30 }], 'C', 'summoner');
C('symbiosis', '共生', 1, 'S', 'z', 0, [{ t: 'heal', v: 8, on: 'souls' }], 'C', 'summoner');
C('deathburst', '死灵爆发', 2, 'A', 'z', 0, [{ t: 'dmg', v: 5, all: 1, pa: 1 }], 'U', 'summoner');
C('soulbond', '灵魂纽带', 2, 'P', 's', 0, [{ t: 'pw', k: 'sbond', v: 4 }], 'R', 'summoner');
C('resonance', '魂之共鸣', 2, 'P', 's', 0, [{ t: 'pw', k: 'sboost', v: 1 }], 'R', 'summoner');
C('sacrifice', '献祭', 0, 'S', 'a', 5, [{ t: 'sac', on: 'target' }, { t: 'nrg', v: 2 }, { t: 'draw', v: 2 }], 'U', 'summoner');
C('devour', '噬魂', 1, 'A', 'e', 3, [{ t: 'dmg', v: 6, el: 'dark', drain: 1 }], 'C', 'summoner');
C('boneguard_c', '骸骨守卫', 2, 'U', 't', 2, [{ t: 'sum', id: 'boneguard' }], 'U', 'summoner');

/* ----- 刺客 ----- */
C('strike_a', '匕首', 1, 'A', 'e', 1, [{ t: 'dmg', v: 7 }], 'S', 'assassin');
C('backstab', '背刺', 1, 'A', 'e', 4, [{ t: 'dash' }, { t: 'dmg', v: 9 }], 'C', 'assassin');
C('venomblade', '毒刃', 1, 'A', 'e', 1, [{ t: 'dmg', v: 4 }, { t: 'st', s: 'poison', v: 4 }], 'C', 'assassin');
C('shadowstep', '暗影步', 1, 'S', 't', 4, [{ t: 'tp' }, { t: 'draw', v: 1 }], 'C', 'assassin');
C('smoke', '烟幕', 1, 'S', 's', 0, [{ t: 'blk', v: 8 }, { t: 'st', s: 'weak', v: 2, ctr: 'self', r: 2 }], 'C', 'assassin');
C('slit', '割喉', 2, 'A', 'e', 1, [{ t: 'dmg', v: 15 }, { t: 'st', s: 'vuln', v: 2 }], 'U', 'assassin');
C('flurry', '连环刺', 1, 'A', 'e', 1, [{ t: 'dmg', v: 3, n: 4 }], 'C', 'assassin');
C('assassinate', '暗杀', 3, 'A', 'e', 5, [{ t: 'dash' }, { t: 'dmg', v: 26 }], 'R', 'assassin', X);
C('coat', '淬毒', 2, 'P', 's', 0, [{ t: 'pw', k: 'venom', v: 2 }], 'R', 'assassin');
C('vanish', '影遁', 1, 'S', 's', 0, [{ t: 'blk', v: 6 }, { t: 'draw', v: 1 }], 'C', 'assassin');
C('knife', '飞刀', 0, 'A', 'e', 3, [{ t: 'dmg', v: 4 }], 'C', 'assassin');
C('weakspot', '破绽', 1, 'S', 'e', 3, [{ t: 'st', s: 'vuln', v: 3 }, { t: 'mark', v: 25 }], 'C', 'assassin');
C('swiftness', '迅捷', 1, 'P', 's', 0, [{ t: 'pw', k: 'swift', v: 1 }], 'U', 'assassin');
C('clone_c', '暗影分身', 1, 'U', 't', 2, [{ t: 'sum', id: 'clone' }], 'U', 'assassin');
C('plunder', '劫掠', 1, 'A', 'e', 1, [{ t: 'dmg', v: 6 }, { t: 'gold', v: 8 }], 'C', 'assassin');
C('deathmark', '死亡标记', 1, 'S', 'e', 4, [{ t: 'dblp' }], 'U', 'assassin');

/* ----- 诅咒 / 废牌 ----- */
C('wound', '伤口', 99, 'X', 's', 0, [], 'X', 'curse', { unplay: 1, d: '无法打出。' });
C('dread', '恐惧', 99, 'X', 's', 0, [], 'X', 'curse', { unplay: 1, endHurt: 2, d: '无法打出。回合结束时若在手牌中，失去2点生命。' });
C('regret', '悔恨', 99, 'X', 's', 0, [], 'X', 'curse', { unplay: 1, d: '无法打出。占据手牌空间。' });

/* ========== 职业 ========== */
const CLASSES = {
  knight: {
    n: '骑士', emoji: '🤺', hp: 85, atk: 6, rng: 1, mov: 3, en: 3, free: 1,
    d: '坚固的前线守卫，以护甲与反击庇护灵魂军团。', pas: '战斗开始获得6点护甲',
    deck: ['strike_k', 'strike_k', 'strike_k', 'strike_k', 'defend', 'defend', 'defend', 'defend', 'bash', 'guardian']
  },
  mage: {
    n: '法师', emoji: '🧙', hp: 62, atk: 4, rng: 3, mov: 3, en: 3, free: 1,
    d: '操纵元素的施法者，用属性克制压制敌人。', pas: '带有元素属性的攻击牌伤害+2',
    deck: ['strike_m', 'strike_m', 'strike_m', 'strike_m', 'defend', 'defend', 'defend', 'defend', 'fireball_c', 'icelance']
  },
  summoner: {
    n: '唤灵师', emoji: '🔮', hp: 64, atk: 4, rng: 3, mov: 3, en: 3, free: 1,
    d: '灵魂收集专家，召唤并强化庞大的魂之军团。', pas: '灵魂收服率+15%，出战灵魂上限+1',
    deck: ['strike_s', 'strike_s', 'strike_s', 'strike_s', 'defend', 'defend', 'defend', 'defend', 'mark_c', 'skeleton_c']
  },
  ranger: {
    n: '游侠', emoji: '🏹', hp: 68, atk: 5, rng: 4, mov: 4, en: 3, cost: 60,
    d: '远程狙击与陷阱专家，从安全距离削减敌人。', pas: '战斗开始获得1层专注',
    deck: ['strike_r', 'strike_r', 'strike_r', 'strike_r', 'defend', 'defend', 'defend', 'defend', 'piercing', 'trap']
  },
  priest: {
    n: '牧师', emoji: '🙏', hp: 72, atk: 3, rng: 3, mov: 3, en: 3, cost: 80,
    d: '圣光的使徒，治疗并强化灵魂伙伴。', pas: '每回合开始治疗所有友军1点生命',
    deck: ['strike_p', 'strike_p', 'strike_p', 'strike_p', 'defend', 'defend', 'defend', 'defend', 'heal_c', 'bless']
  },
  assassin: {
    n: '刺客', emoji: '🥷', hp: 64, atk: 6, rng: 1, mov: 5, en: 3, cost: 100,
    d: '高机动的猎杀者，毒与背刺是最爱。', pas: '移动力+1；攻击中毒的敌人额外+2伤害',
    deck: ['strike_a', 'strike_a', 'strike_a', 'strike_a', 'defend', 'defend', 'defend', 'defend', 'backstab', 'venomblade']
  }
};

/* ========== 卡牌升级 & 描述 ========== */
const _upCache = {};
function upgradedDef(base) {
  if (_upCache[base.id]) return _upCache[base.id];
  const c = JSON.parse(JSON.stringify(base)); c.n = base.n + '+'; c.up = true;
  let changed = false;
  for (const f of c.fx) {
    if (f.v == null) continue;
    const ok = (['dmg', 'blk', 'heal', 'str', 'chain', 'trap', 'mark', 'det', 'draw'].includes(f.t)) ||
      (f.t === 'st' && f.s !== 'stun') || (f.t === 'pw' && ['thorns', 'fort', 'sbond', 'aura', 'regen', 'venom'].includes(f.k));
    if (ok) { f.v += f.t === 'draw' ? 1 : Math.max(1, Math.round(f.v * 0.4)); changed = true; }
  }
  if (!changed && c.cost > 0) c.cost -= 1;
  else if (!changed) { c.exhaust = 0; }
  return _upCache[base.id] = c;
}
function cdef(inst) {
  if (typeof inst === 'string') return CARDS[inst];
  if (inst.soul) return inst;     // 召唤魂卡直接是定义
  const b = CARDS[inst.id]; return inst.up ? upgradedDef(b) : b;
}
const ONT = { self: '', target: '目标', allies: '所有友军', souls: '所有灵魂', enemies: '所有敌人' };
const PWT = {
  thorns: v => `获得${v}层荆棘`, fort: v => `每回合开始获得${v}点护甲`, nrg: v => `每回合额外获得${v}点能量`,
  focus: v => `每回合开始获得${v}层专注`, aura: v => `每回合开始治疗所有友军${v}点`, regen: v => `每回合开始恢复${v}点生命`,
  sbond: v => `每回合开始灵魂获得${v}点护甲`, sboost: v => `之后召唤的灵魂属性+25%`, venom: v => `攻击牌额外施加${v}层中毒`, swift: v => `移动力+${v}`
};
function fxText(f, atk) {
  const val = f.v != null ? f.v : (f.m != null ? (atk != null ? Math.round(f.m * atk) : '×' + f.m + '攻击') : '');
  const on = ONT[f.on] || '';
  const area = f.all ? '对所有敌人' : f.line ? '贯穿路径上的敌人' : f.ctr === 'self' && f.r ? `对周围${f.r}格内敌人` : f.r ? `对范围${f.r}格内的敌人` : '';
  switch (f.t) {
    case 'dmg': return `${area}造成${f.el ? ELEM[f.el].n + '属性' : ''}${val}点伤害${f.n > 1 ? '×' + f.n : ''}${f.pb ? '(+护甲值)' : ''}${f.pa ? '(每个友军)' : ''}${f.drain ? '，并吸取生命' : ''}`;
    case 'chain': return `${f.el ? ELEM[f.el].n + '属性' : ''}闪电造成${val}点伤害，连锁${f.n}个敌人(递减)`;
    case 'blk': return `${on}获得${val}点护甲`;
    case 'heal': return `${on || '自身'}恢复${val}点生命`;
    case 'st': { const nm = STN[f.s][0]; const tgt = f.on === 'self' ? '自身' : (area || (DEBUFFS.includes(f.s) ? '目标' : '')); return f.s === 'stun' ? `${tgt}眩晕${val}回合` : `${tgt}${f.on === 'self' || f.s === 'taunt' ? '获得' : '施加'}${val}层${nm}`; }
    case 'str': return `${on || '自身'}获得${val}点力量`;
    case 'draw': return `抽${val}张牌`;
    case 'nrg': return `获得${val}点能量`;
    case 'push': return `击退${val}格`;
    case 'pull': return `拉近${val}格`;
    case 'tp': return '传送到目标位置';
    case 'dash': return '冲到目标身旁';
    case 'sum': return `召唤${TOKENS[f.id].n}${f.n > 1 ? '×' + f.n : ''}`;
    case 'hurt': return `失去${val}点生命`;
    case 'mark': return `灵魂标记(击杀后收服率+${val}%)`;
    case 'trap': return `布设陷阱(敌人踩中受${val}点伤害)`;
    case 'det': return `引爆灼烧：每层造成${val}点伤害`;
    case 'dblp': return '使目标的中毒层数翻倍';
    case 'refresh': return `使${f.on === 'souls' ? '所有灵魂' : '目标灵魂'}可再次行动`;
    case 'sac': return '献祭目标灵魂';
    case 'gold': return `获得${val}金币`;
    case 'crystal': return `获得${val}枚灵魂水晶`;
    case 'cleanse': return '净化负面状态';
    case 'die': return '自我牺牲';
    case 'pw': return (PWT[f.k] || (() => ''))(val);
    default: return '';
  }
}
function cardDesc(c) {
  if (c.d) return c.d;
  if (c.soul) return c.desc;
  let s = c.fx.map(f => fxText(f)).filter(Boolean).join('。');
  if (c.exhaust) s += '。消耗';
  return s + (s ? '。' : '');
}
const TYPE_N = { A: '攻击', S: '技能', P: '能力', U: '召唤', X: '诅咒' };
function skillDesc(key, atk) {
  const s = SK[key]; return s.fx.map(f => fxText(f, atk)).filter(Boolean).join('，');
}
// 名称缩短显示用的物种召唤牌
function soulCardDef(soul, cost) {
  const sp = SPECIES[soul.sp];
  return {
    id: 'soul_' + soul.uid, n: sp.name, cost, ty: 'U', tg: 't', rng: 2, fx: [], soul: soul.uid, rar: 'U', cls: 'soul', exhaust: 1,
    emoji: sp.emoji, elem: sp.elem, desc: `召唤 Lv${soul.lv} ${sp.name}`
  };
}

/* 卡面图标 */
function cardArt(d) {
  if (d.soul) return d.emoji;
  if (d.ty === 'X') return '☠️';
  const f = d.fx[0] || {};
  const elIc = { fire: '🔥', water: '💧', wood: '🍃', thunder: '⚡', dark: '🌑', light: '✨' };
  if (d.ty === 'U') return '👻';
  if (d.ty === 'P') return '🌟';
  for (const x of d.fx) if (x.el) return elIc[x.el];
  const map = { dmg: f.all ? '💥' : f.line ? '🏹' : '⚔️', chain: '⚡', blk: '🛡️', heal: '💚', draw: '📜', nrg: '🔋', tp: '🌀', trap: '🪤', mark: '🔖', refresh: '🔄', sac: '🩸', gold: '🪙', crystal: '💎', hurt: '🩸', det: '💥', dblp: '☠️', str: '💪', push: '💨', pull: '🪝', dash: '🗡️', cleanse: '🫧' };
  if (f.t === 'st') return ({ burn: '🔥', poison: '☠️', weak: '💫', vuln: '💔', stun: '💤', taunt: '😤', focus: '🎯' })[f.s] || '✦';
  return map[f.t] || '✦';
}
