'use strict';
/* ========== 元素 ========== */
const ELEM = {
  fire: { n: '火', c: '#ff6a3d', e: '🔥' }, water: { n: '水', c: '#3da5ff', e: '💧' },
  wood: { n: '木', c: '#5fd068', e: '🌿' }, thunder: { n: '雷', c: '#ffd23d', e: '⚡' },
  dark: { n: '暗', c: '#a06bff', e: '🌑' }, light: { n: '光', c: '#fff0a0', e: '✨' }
};
// 克制关系：key 克制 value (水>火>木>雷>水，光<->暗互相克制)
const BEATS = { water: 'fire', fire: 'wood', wood: 'thunder', thunder: 'water', dark: 'light', light: 'dark' };
function elemMult(att, def) {
  if (!att || !def) return 1;
  if (BEATS[att] === def) return 1.5;
  if (BEATS[def] === att) return 0.75;
  return 1;
}

/* ========== 状态名称 ========== */
const STN = {
  burn: ['灼烧', '🔥', '回合开始受到等同层数的伤害，每回合-1层'], poison: ['中毒', '☠️', '回合开始受到等同层数的伤害，层数-1'],
  weak: ['虚弱', '💫', '造成的伤害-25%'], vuln: ['易伤', '💔', '受到的伤害+50%'], stun: ['眩晕', '💤', '无法行动'],
  taunt: ['嘲讽', '😤', '敌人优先攻击此单位'], str: ['力量', '💪', '伤害增加'], thorns: ['荆棘', '🌵', '被近战攻击时反弹伤害'],
  focus: ['专注', '🎯', '下一张攻击牌伤害翻倍'], regen: ['再生', '💚', '回合开始恢复生命']
};
const DEBUFFS = ['burn', 'poison', 'weak', 'vuln', 'stun'];

/* ========== 角色定位基础数值（1阶、普通稀有度） ========== */
const ROLES = {
  fighter: { n: '战士', hp: 20, atk: 5, mov: 3, rng: 1 },
  brute: { n: '猛兽', hp: 27, atk: 6, mov: 2, rng: 1 },
  tank: { n: '坦克', hp: 30, atk: 3, mov: 2, rng: 1 },
  archer: { n: '射手', hp: 15, atk: 5, mov: 3, rng: 3 },
  mage: { n: '法师', hp: 14, atk: 5, mov: 2, rng: 3 },
  assassin: { n: '刺客', hp: 14, atk: 6, mov: 4, rng: 1 },
  healer: { n: '治疗', hp: 16, atk: 3, mov: 3, rng: 2 },
  support: { n: '辅助', hp: 17, atk: 3, mov: 3, rng: 2 }
};
const RAR = { C: ['普通', 1, '#aab'], U: ['优秀', 1.08, '#5fd0ff'], R: ['稀有', 1.2, '#c18cff'], E: ['史诗', 1.35, '#ffb347'], L: ['传说', 1.6, '#ff6a8a'] };
const STAGE_HP = [1, 1.6, 2.4], STAGE_ATK = [1, 1.5, 2.1], STAGE_LV = [1, 4, 8], MAX_LV = 12;

/* ========== 被动 ========== */
const PS = {
  fly: ['飞行', '无视障碍与地形伤害'], thorns: ['荆棘', '被近战攻击时反弹2点伤害'], swift: ['迅捷', '移动力+1'],
  tough: ['坚韧', '每回合开始获得3点护甲'], regen: ['再生', '每回合开始恢复2点生命'], rage: ['激怒', '受伤时获得1点力量'],
  vamp: ['吸血', '造成伤害时恢复30%']
};

/* ========== 技能库 (m = 攻击力倍率) ========== */
const SK = {
  slash: { n: '强斩', cd: 2, rng: 1, tg: 'e', fx: [{ t: 'dmg', m: 1.7 }] },
  cleave: { n: '横扫', cd: 2, rng: 0, tg: 's', fx: [{ t: 'dmg', m: 1.0, ctr: 'self', r: 1 }] },
  charge: { n: '冲锋', cd: 3, rng: 4, tg: 'e', fx: [{ t: 'dash' }, { t: 'dmg', m: 1.5 }] },
  pierce: { n: '穿透箭', cd: 2, rng: 4, tg: 'e', fx: [{ t: 'dmg', m: 1.3, line: 1 }] },
  volley: { n: '箭雨', cd: 3, rng: 4, tg: 't', fx: [{ t: 'dmg', m: 0.9, r: 1 }] },
  fireball: { n: '火球', cd: 3, rng: 3, tg: 'e', fx: [{ t: 'dmg', m: 1.0, r: 1 }, { t: 'st', s: 'burn', v: 2, r: 1 }] },
  frost: { n: '冰锥', cd: 3, rng: 3, tg: 'e', fx: [{ t: 'dmg', m: 1.2 }, { t: 'st', s: 'weak', v: 2 }] },
  freeze: { n: '冰封', cd: 4, rng: 3, tg: 'e', fx: [{ t: 'dmg', m: 1.0 }, { t: 'st', s: 'stun', v: 1 }] },
  thunder: { n: '连锁闪电', cd: 3, rng: 3, tg: 'e', fx: [{ t: 'chain', m: 1.1, n: 2, r: 2 }] },
  venom: { n: '毒牙', cd: 2, rng: 1, tg: 'e', fx: [{ t: 'dmg', m: 0.8 }, { t: 'st', s: 'poison', v: 3 }] },
  spit: { n: '毒液喷射', cd: 2, rng: 3, tg: 'e', fx: [{ t: 'dmg', m: 0.6 }, { t: 'st', s: 'poison', v: 3 }] },
  sting: { n: '毒刺', cd: 2, rng: 1, tg: 'e', fx: [{ t: 'dmg', m: 1.0 }, { t: 'st', s: 'poison', v: 2 }] },
  drain: { n: '吸血', cd: 2, rng: 1, tg: 'e', fx: [{ t: 'dmg', m: 1.1, drain: 1 }] },
  heal: { n: '治愈', cd: 2, rng: 3, tg: 'a', fx: [{ t: 'heal', m: 2.5, on: 'target' }] },
  mend: { n: '群体治疗', cd: 4, rng: 0, tg: 'z', fx: [{ t: 'heal', m: 1.4, on: 'allies' }] },
  guard: { n: '守护', cd: 2, rng: 3, tg: 'a', fx: [{ t: 'blk', m: 2.5, on: 'target' }] },
  rally: { n: '激励', cd: 4, rng: 0, tg: 'z', fx: [{ t: 'str', v: 2, on: 'allies' }] },
  taunt: { n: '嘲讽', cd: 3, rng: 0, tg: 's', fx: [{ t: 'blk', m: 3, on: 'self' }, { t: 'st', s: 'taunt', v: 2, on: 'self' }] },
  wall: { n: '壁垒', cd: 3, rng: 0, tg: 's', fx: [{ t: 'blk', m: 4, on: 'self' }, { t: 'st', s: 'thorns', v: 2, on: 'self' }] },
  stab: { n: '背刺', cd: 3, rng: 4, tg: 'e', fx: [{ t: 'dash' }, { t: 'dmg', m: 2.0 }, { t: 'st', s: 'vuln', v: 1 }] },
  curse: { n: '诅咒', cd: 3, rng: 3, tg: 'e', fx: [{ t: 'st', s: 'vuln', v: 2 }, { t: 'st', s: 'weak', v: 2 }] },
  summon_wisp: { n: '召唤鬼火', cd: 4, rng: 0, tg: 's', fx: [{ t: 'sum', id: 'wisp', n: 1 }] },
  summon_skel: { n: '唤骨', cd: 4, rng: 0, tg: 's', fx: [{ t: 'sum', id: 'skeleton', n: 1 }] },
  summon_sap: { n: '催生树苗', cd: 3, rng: 0, tg: 's', fx: [{ t: 'sum', id: 'sapling', n: 1 }] },
  explode: { n: '自爆', cd: 5, rng: 1, tg: 'e', fx: [{ t: 'dmg', m: 3, r: 1 }, { t: 'die' }] },
  bomb: { n: '炸弹', cd: 3, rng: 3, tg: 't', fx: [{ t: 'dmg', m: 1.5, r: 1 }] },
  hook: { n: '钩锁', cd: 3, rng: 4, tg: 'e', fx: [{ t: 'dmg', m: 0.8 }, { t: 'pull', v: 3 }] },
  slam: { n: '冲击', cd: 3, rng: 1, tg: 'e', fx: [{ t: 'dmg', m: 1.2 }, { t: 'push', v: 2 }] },
  howl: { n: '咆哮', cd: 4, rng: 0, tg: 's', fx: [{ t: 'st', s: 'weak', v: 2, ctr: 'self', r: 2 }] },
  regen: { n: '再生', cd: 3, rng: 0, tg: 's', fx: [{ t: 'heal', m: 2, on: 'self' }, { t: 'blk', m: 1, on: 'self' }] },
  soulrip: { n: '灵魂撕裂', cd: 3, rng: 3, tg: 'e', fx: [{ t: 'dmg', m: 1.5 }, { t: 'mark', v: 30 }] },
  inferno: { n: '业火', cd: 5, rng: 0, tg: 'z', fx: [{ t: 'dmg', m: 0.6, all: 1 }, { t: 'st', s: 'burn', v: 2, all: 1 }] },
  blizzard: { n: '暴风雪', cd: 4, rng: 3, tg: 't', fx: [{ t: 'dmg', m: 0.8, r: 2 }, { t: 'st', s: 'weak', v: 1, r: 2 }] },
  lullaby: { n: '催眠', cd: 4, rng: 3, tg: 'e', fx: [{ t: 'st', s: 'stun', v: 1 }] },
  smite: { n: '圣光', cd: 2, rng: 3, tg: 'e', fx: [{ t: 'dmg', m: 1.3 }, { t: 'heal', m: 0.8, on: 'allies' }] },
  quake: { n: '地裂', cd: 4, rng: 0, tg: 's', fx: [{ t: 'dmg', m: 1.1, ctr: 'self', r: 2 }, { t: 'st', s: 'weak', v: 1, ctr: 'self', r: 2 }] }
};

/* ========== 魔物家族：[id, 三阶名称, 图标, 元素, 定位, 出没区域(F森林R遗迹C城堡), 稀有度, 技能, 被动] ========== */
const FAM = [
  ['slime', '史莱姆|凝胶史莱姆|史莱姆王', '🟢', 'wood', 'tank', 'FR', 'C', 'regen', ''],
  ['wolf', '森林狼|獠牙狼|月夜狼王', '🐺', 'wood', 'fighter', 'FR', 'C', 'charge', 'swift'],
  ['shroom', '毒伞菇|孢子菇|瘴气菇王', '🍄', 'wood', 'mage', 'F', 'C', 'spit', ''],
  ['bee', '工蜂|刺蜂|蜂后', '🐝', 'thunder', 'assassin', 'F', 'C', 'sting', 'fly'],
  ['treant', '小树精|橡木卫士|远古树人', '🌳', 'wood', 'tank', 'F', 'U', 'wall', 'thorns'],
  ['elf', '林间精灵|游侠精灵|月光射手', '🧝', 'light', 'archer', 'FC', 'U', 'pierce', ''],
  ['boar', '野猪|獠牙猪|战猪领主', '🐗', 'fire', 'brute', 'F', 'C', 'slam', ''],
  ['frog', '小蛙|毒箭蛙|沼泽蛙王', '🐸', 'water', 'assassin', 'FR', 'C', 'venom', 'swift'],
  ['fox', '火狐|灵狐|九尾天狐', '🦊', 'fire', 'mage', 'F', 'U', 'fireball', ''],
  ['spider', '小蜘蛛|织网蛛|幽冥蛛后', '🕷️', 'dark', 'assassin', 'FR', 'U', 'hook', ''],
  ['deer', '小鹿|林鹿|月光神鹿', '🦌', 'light', 'healer', 'F', 'U', 'heal', 'regen'],
  ['eagle', '雏鹰|猎鹰|雷鸟', '🦅', 'thunder', 'archer', 'FR', 'C', 'volley', 'fly'],
  ['skeleton', '骷髅兵|骷髅战士|骸骨将军', '💀', 'dark', 'fighter', 'RC', 'C', 'slash', ''],
  ['ghost', '游魂|怨灵|无面幽魂', '👻', 'dark', 'mage', 'RC', 'U', 'summon_wisp', 'fly'],
  ['bat', '洞穴蝙蝠|吸血蝠|暗夜蝠王', '🦇', 'dark', 'assassin', 'RC', 'C', 'drain', 'fly'],
  ['zombie', '腐尸|僵尸|尸巫', '🧟', 'dark', 'brute', 'R', 'C', 'slam', 'regen'],
  ['scorpion', '沙蝎|毒尾蝎|帝王蝎', '🦂', 'fire', 'assassin', 'R', 'C', 'sting', ''],
  ['gargoyle', '石像|石像鬼|岩石巨像', '🗿', 'thunder', 'tank', 'RC', 'U', 'quake', 'tough'],
  ['snake', '小蛇|眼镜蛇|冥河蛇神', '🐍', 'water', 'assassin', 'R', 'U', 'venom', ''],
  ['tome', '活页书|咒语书|禁忌魔典', '📖', 'light', 'mage', 'RC', 'R', 'thunder', 'fly'],
  ['worm', '蠕虫|沙虫|沙漠巨虫', '🐛', 'fire', 'brute', 'R', 'C', 'cleave', 'rage'],
  ['mimic', '宝箱怪|拟态怪|贪婪魔箱', '📦', 'dark', 'brute', 'R', 'U', 'drain', 'vamp'],
  ['golem', '机关兵|机关傀儡|黄金魔像', '🤖', 'thunder', 'tank', 'RC', 'U', 'slam', 'tough'],
  ['crystal', '水晶灵|占卜球|先知之眼', '🔮', 'light', 'support', 'R', 'R', 'rally', 'fly'],
  ['imp', '小恶魔|炎魔|深渊魔王', '😈', 'fire', 'mage', 'C', 'U', 'bomb', 'fly'],
  ['dragon', '幼龙|火龙|炎皇龙', '🐉', 'fire', 'brute', 'C', 'R', 'inferno', ''],
  ['knight', '战马|黑骑士|死亡骑士', '🐴', 'dark', 'fighter', 'C', 'U', 'charge', 'tough'],
  ['vampire', '血仆|吸血鬼|血族公爵', '🧛', 'dark', 'assassin', 'C', 'R', 'stab', 'vamp'],
  ['witch', '学徒|女巫|大巫妖', '🧙', 'dark', 'mage', 'RC', 'U', 'curse', ''],
  ['angel', '小天使|守护天使|炽天使', '😇', 'light', 'healer', 'C', 'R', 'mend', 'fly'],
  ['hound', '地狱幼犬|地狱犬|三头犬', '🐕', 'fire', 'fighter', 'C', 'C', 'cleave', 'swift'],
  ['yeti', '雪人|冰霜傀儡|冰霜巨人', '☃️', 'water', 'mage', 'C', 'U', 'blizzard', ''],
  ['unicorn', '小独角兽|独角兽|圣兽', '🦄', 'light', 'support', 'FC', 'R', 'guard', 'regen'],
  ['kraken', '小章鱼|触手怪|深渊克拉肯', '🐙', 'water', 'support', 'RC', 'U', 'freeze', ''],
  ['ogre', '小鬼|食人魔|魔王军官', '👹', 'dark', 'brute', 'C', 'C', 'howl', 'rage'],
  ['trex', '迅猛龙|暴龙|霸王龙', '🦖', 'wood', 'fighter', 'C', 'U', 'slash', 'rage']
];

/* ========== 特殊魔物：首领与传说 ========== */
const SPECIAL = [
  // [id, 名称, 图标, 元素, 定位, 稀有度, 技能, 被动, hp, atk, mov, rng, 区域, 首领额外技能]
  ['boss_forest', '腐化古树·艾尔德', '🌲', 'wood', 'brute', 'E', 'slam', 'thorns', 150, 8, 2, 1, 0, ['howl', 'summon_sap']],
  ['boss_ruins', '沙漠法老·阿蒙', '🏺', 'fire', 'mage', 'E', 'curse', 'tough', 190, 9, 2, 2, 1, ['summon_skel', 'inferno']],
  ['boss_castle', '魔王·莫尔甘', '👿', 'dark', 'brute', 'L', 'drain', 'vamp', 250, 11, 3, 1, 2, ['fireball', 'summon_wisp', 'charge']],
  ['leg_fire', '烈焰之主·炎帝', '🌋', 'fire', 'mage', 'L', 'inferno', 'rage', 52, 12, 3, 3, -1, null],
  ['leg_water', '沧海之灵·渊', '🌊', 'water', 'healer', 'L', 'mend', 'regen', 58, 8, 3, 3, -1, null],
  ['leg_wood', '万木之灵·青帝', '🍀', 'wood', 'tank', 'L', 'wall', 'thorns', 80, 9, 3, 1, -1, null],
  ['leg_thunder', '雷霆之灵·霆', '⛈️', 'thunder', 'archer', 'L', 'thunder', 'swift', 46, 14, 4, 4, -1, null],
  ['leg_light', '星辉之灵·辰', '🌟', 'light', 'support', 'L', 'rally', 'fly', 50, 10, 3, 3, -1, null],
  ['leg_dark', '永夜之灵·魇', '🌌', 'dark', 'assassin', 'L', 'stab', 'vamp', 44, 15, 5, 1, -1, null]
];

/* ========== 召唤物 / 衍生物 ========== */
const TOKENS = {
  wisp: { n: '鬼火', emoji: '🔥', elem: 'fire', hp: 7, atk: 4, mov: 3, rng: 2, role: 'mage', ps: 'fly' },
  skeleton: { n: '骷髅', emoji: '💀', elem: 'dark', hp: 12, atk: 5, mov: 3, rng: 1, role: 'fighter' },
  boneguard: { n: '骸骨守卫', emoji: '🛡️', elem: 'dark', hp: 26, atk: 3, mov: 2, rng: 1, role: 'tank', sk: 'taunt' },
  wolf: { n: '野狼', emoji: '🐺', elem: 'wood', hp: 14, atk: 6, mov: 4, rng: 1, role: 'fighter' },
  clone: { n: '影分身', emoji: '👤', elem: 'dark', hp: 8, atk: 7, mov: 4, rng: 1, role: 'assassin' },
  sapling: { n: '树苗', emoji: '🌱', elem: 'wood', hp: 10, atk: 3, mov: 2, rng: 1, role: 'tank' },
  turret: { n: '炮塔', emoji: '🗼', elem: 'thunder', hp: 14, atk: 5, mov: 0, rng: 4, role: 'archer' },
  mech: { n: '机械兵', emoji: '🤖', elem: 'thunder', hp: 18, atk: 6, mov: 3, rng: 2, role: 'fighter' },
  bird: { n: '无人机', emoji: '🛸', elem: 'thunder', hp: 8, atk: 4, mov: 5, rng: 2, role: 'archer', ps: 'fly' },
  bear: { n: '熊灵', emoji: '🐻', elem: 'wood', hp: 22, atk: 7, mov: 3, rng: 1, role: 'brute' },
  treant: { n: '树人', emoji: '🌳', elem: 'wood', hp: 24, atk: 4, mov: 2, rng: 1, role: 'tank', sk: 'taunt' }
};
const RANDOM_TOKENS = ['wisp', 'skeleton', 'wolf', 'bear', 'treant', 'mech', 'bird', 'clone'];
// 战场尺寸：区域越深战场越大
const BOARD = [[6, 7], [7, 8], [8, 9]];
// 战斗目标
const OBJ_NAME = { rout: '歼灭敌人', leader: '击杀指挥官', survive: '坚持到援军撤退', seize: '占领据点', boss: '击败首领' };

/* ========== 构建物种表 ========== */
const SPECIES = {};
const FAMILIES = {};   // famId -> [sp1, sp2, sp3]
function buildSpecies() {
  for (const f of FAM) {
    const [fid, names, emoji, elem, role, reg, rar, sk, ps] = f;
    const nm = names.split('|'), list = [];
    for (let s = 1; s <= 3; s++) {
      const b = ROLES[role], rm = RAR[rar][1];
      const sp = {
        id: fid + s, fam: fid, stage: s, name: nm[s - 1], emoji, elem, role, rar, reg, sk, ps,
        hp: Math.round(b.hp * STAGE_HP[s - 1] * rm), atk: Math.round(b.atk * STAGE_ATK[s - 1] * rm * 10) / 10,
        mov: b.mov + (ps === 'swift' ? 1 : 0) + (s === 3 && b.mov < 4 ? 1 : 0), rng: b.rng,
        evo: s < 3 ? fid + (s + 1) : null, evoLv: s < 3 ? STAGE_LV[s] : null
      };
      sp.atk = Math.round(sp.atk);
      SPECIES[sp.id] = sp; list.push(sp);
    }
    FAMILIES[fid] = list;
  }
  for (const s of SPECIAL) {
    const [id, name, emoji, elem, role, rar, sk, ps, hp, atk, mov, rng, region, bossSk] = s;
    SPECIES[id] = {
      id, fam: id, stage: 3, name, emoji, elem, role, rar, reg: '', sk, ps, hp, atk, mov, rng,
      boss: region >= 0, legend: region < 0, bossRegion: region, bossSk: bossSk || [], evo: null
    };
    FAMILIES[id] = [SPECIES[id]];
  }
}
buildSpecies();
const SPECIES_LIST = Object.values(SPECIES);

/* ========== 魂等级属性 ========== */
function statMult(sp, lv, star) {
  const base = STAGE_LV[sp.stage - 1];
  const lvl = sp.boss || sp.legend ? 1 + 0.045 * (lv - 8) : 1 + 0.06 * (lv - base);
  return Math.max(0.7, lvl) * (1 + 0.1 * ((star || 1) - 1));
}
function expNeed(lv) { return 5 + lv * 2; }
function skillOf(key) { return SK[key]; }
function spCost(sp) { return sp.legend || sp.boss ? 3 : sp.stage; }

/* ========== 区域 ========== */
const REGIONS = [
  { id: 'F', n: '迷雾森林', emoji: '🌲', wall: '🌲', hazard: null, bg: ['#173b2a', '#0d1f19'], boss: 'boss_forest', desc: '雾气弥漫的古老森林，野兽与精灵出没。' },
  { id: 'R', n: '沙海遗迹', emoji: '🏛️', wall: '🗿', hazard: '🔻', bg: ['#4a3a1d', '#1f1809'], boss: 'boss_ruins', desc: '埋藏着不死者与机关的古代遗迹。' },
  { id: 'C', n: '深渊魔城', emoji: '🏰', wall: '🧱', hazard: '🌋', bg: ['#3d1530', '#150812'], boss: 'boss_castle', desc: '魔王盘踞的黑暗城堡，恶魔与巨龙守卫。' }
];
