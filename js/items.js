'use strict';
/* ========== 装备 ========== */
// [id, 名称, 图标, 栏位(weapon/armor/charm/soul), 稀有度, 属性]
// 属性：hp atk rng mov energy draw armor sAtk(%) sHp(%) cap(%) gold(%) heal thorns party str
const GEAR_RAW = [
  ['sword1', '生锈铁剑', '⚔️', 'weapon', 'C', { atk: 2 }],
  ['sword2', '精钢长剑', '🗡️', 'weapon', 'U', { atk: 3, hp: 6 }],
  ['bow1', '猎人短弓', '🏹', 'weapon', 'C', { atk: 2, rng: 1 }],
  ['staff1', '橡木法杖', '🪄', 'weapon', 'C', { atk: 1, sAtk: 10 }],
  ['axe1', '蛮族战斧', '🪓', 'weapon', 'U', { atk: 4, thorns: 1 }],
  ['hammer', '千钧巨锤', '🔨', 'weapon', 'U', { atk: 5, mov: -1 }],
  ['trident', '海神三叉戟', '🔱', 'weapon', 'R', { atk: 3, rng: 1, sAtk: 15 }],
  ['scythe', '灵魂镰刀', '🌙', 'weapon', 'R', { atk: 3, cap: 15, sAtk: 10 }],
  ['wand_fire', '烈焰权杖', '🔥', 'weapon', 'R', { atk: 4, str: 1 }],
  ['dagger', '淬毒匕首', '🔪', 'weapon', 'U', { atk: 3, mov: 1 }],
  ['sword_holy', '圣光之剑', '✨', 'weapon', 'E', { atk: 5, hp: 10, heal: 3 }],
  ['staff_arch', '大法师之杖', '🔮', 'weapon', 'E', { atk: 3, energy: 1 }],

  ['cloth', '旅行斗篷', '🧥', 'armor', 'C', { hp: 8 }],
  ['leather', '硬皮甲', '🦺', 'armor', 'C', { hp: 10, armor: 2 }],
  ['chain', '锁子甲', '⛓️', 'armor', 'U', { hp: 14, armor: 3 }],
  ['plate', '重型板甲', '🛡️', 'armor', 'U', { hp: 20, armor: 4, mov: -1 }],
  ['robe', '符文长袍', '👘', 'armor', 'U', { hp: 6, sHp: 15 }],
  ['thornarmor', '荆棘战甲', '🌵', 'armor', 'R', { hp: 14, thorns: 3, armor: 3 }],
  ['dragonscale', '龙鳞甲', '🐲', 'armor', 'R', { hp: 22, armor: 6 }],
  ['shadowcloak', '暗影披风', '🌑', 'armor', 'R', { hp: 10, mov: 1, armor: 3 }],
  ['angelrobe', '天使之衣', '👼', 'armor', 'E', { hp: 18, heal: 5, armor: 4 }],
  ['spiritmail', '灵魂战铠', '👻', 'armor', 'E', { hp: 16, sHp: 20, sAtk: 10 }],

  ['ring_str', '力量戒指', '💍', 'charm', 'C', { str: 1 }],
  ['amulet', '护身符', '🧿', 'charm', 'C', { hp: 6, armor: 1 }],
  ['coin', '幸运金币', '🪙', 'charm', 'C', { gold: 20 }],
  ['gem', '水晶挂坠', '💎', 'charm', 'U', { cap: 10 }],
  ['boots', '疾风之靴', '👢', 'charm', 'U', { mov: 1 }],
  ['book', '学者之书', '📕', 'charm', 'U', { draw: 1 }],
  ['orb', '魔力宝珠', '🔵', 'charm', 'R', { energy: 1 }],
  ['horn', '军团号角', '📯', 'charm', 'R', { party: 1 }],
  ['heart', '生命之心', '❤️', 'charm', 'U', { hp: 12, heal: 3 }],
  ['eye', '洞察之眼', '👁️', 'charm', 'R', { draw: 1, cap: 8 }],
  ['crown', '灵魂王冠', '👑', 'charm', 'E', { party: 1, sAtk: 15, cap: 10 }],
  ['clover', '四叶草', '🍀', 'charm', 'U', { gold: 15, cap: 8 }],
  ['hourglass', '时之沙漏', '⏳', 'charm', 'E', { energy: 1, draw: 1 }],

  ['sg_claw', '利爪', '🦴', 'soul', 'C', { atk: 2 }],
  ['sg_shell', '硬壳', '🐚', 'soul', 'C', { hp: 8 }],
  ['sg_wing', '风之羽', '🕊️', 'soul', 'U', { mov: 1 }],
  ['sg_scope', '瞄准镜', '🔭', 'soul', 'U', { rng: 1 }],
  ['sg_fang', '毒牙', '🦷', 'soul', 'U', { atk: 2, hp: 4 }],
  ['sg_flame', '火种', '🕯️', 'soul', 'U', { atk: 3 }],
  ['sg_guard', '守护符', '🔰', 'soul', 'C', { hp: 6, atk: 1 }],
  ['sg_heart', '魂之心', '💗', 'soul', 'R', { hp: 14, atk: 2 }],
  ['sg_medal', '王者徽记', '🎖️', 'soul', 'R', { atk: 3, hp: 8, mov: 1 }],
  ['sg_rune', '古代符文', '🔣', 'soul', 'E', { atk: 5, hp: 12, rng: 1 }]
];
const GEAR = {};
for (const [id, n, emoji, slot, rar, mods] of GEAR_RAW) GEAR[id] = { id, n, emoji, slot, rar, mods };
const SLOT_N = { weapon: '武器', armor: '护甲', charm: '饰品', soul: '灵魂装备' };
const MOD_N = {
  hp: ['生命', v => `+${v}`], atk: ['攻击', v => `${v > 0 ? '+' : ''}${v}`], rng: ['射程', v => `+${v}`], mov: ['移动', v => `${v > 0 ? '+' : ''}${v}`],
  energy: ['能量', v => `+${v}`], draw: ['抽牌', v => `+${v}`], armor: ['开局护甲', v => `+${v}`], sAtk: ['灵魂攻击', v => `+${v}%`],
  sHp: ['灵魂生命', v => `+${v}%`], cap: ['收服率', v => `+${v}%`], gold: ['金币获取', v => `+${v}%`], heal: ['战后恢复', v => `+${v}`],
  thorns: ['荆棘', v => `+${v}`], party: ['出战上限', v => `+${v}`], str: ['初始力量', v => `+${v}`]
};
function gearDesc(g) { return Object.entries(g.mods).map(([k, v]) => `${MOD_N[k][0]}${MOD_N[k][1](v)}`).join('  '); }
function sumMods(ids) {
  const m = {}; for (const id of ids) { if (!id || !GEAR[id]) continue; for (const [k, v] of Object.entries(GEAR[id].mods)) m[k] = (m[k] || 0) + v; } return m;
}
function randGear(slotFilter, minRar, maxRar) {
  const order = 'CURE';
  const pool = Object.values(GEAR).filter(g => (!slotFilter || (Array.isArray(slotFilter) ? slotFilter.includes(g.slot) : g.slot === slotFilter)) && order.indexOf(g.rar) >= order.indexOf(minRar || 'C') && order.indexOf(g.rar) <= order.indexOf(maxRar || 'E'));
  return wpick(pool, g => ({ C: 10, U: 6, R: 3, E: 1.2 }[g.rar])).id;
}

/* ========== 随机事件 ========== */
// 结果效果：gold hp maxhp(数值) hp:'25%' card curse gear soul crystal fight removeCard upgradeCard dupCard chance text
const EVENTS = [
  {
    id: 'spring', t: '治愈之泉', e: '⛲', text: '树影深处有一眼清澈的泉水，水面泛着柔和的微光。', opts: [
      { t: '痛饮泉水', d: '恢复30%生命', r: [{ hp: '30%' }] },
      { t: '装一瓶带走', d: '获得「治疗药剂」', r: [{ card: 'potion' }] }]
  },
  {
    id: 'merchant', t: '神秘行商', e: '🧙‍♂️', text: '一位披着斗篷的商人拦住了你，低声说有"好东西"。', opts: [
      { t: '购买神秘包裹', d: '花费60金币，获得一件装备', req: { gold: 60 }, r: [{ gold: -60 }, { gear: 'rand' }] },
      { t: '抢劫他！', d: '战斗！(精英)', r: [{ fight: 'elite' }] },
      { t: '礼貌离开', d: '什么也不会发生', r: [{ text: '你继续赶路。' }] }]
  },
  {
    id: 'beast', t: '受伤的魔物', e: '🐾', text: '一只受了重伤的魔物蜷缩在路边，它用恳求的眼神望着你。', opts: [
      { t: '为它包扎', d: '失去6点生命，获得一个灵魂', r: [{ hp: -6 }, { soul: 'common' }] },
      { t: '补刀取走灵核', d: '获得30金币', r: [{ gold: 30 }] },
      { t: '放它离开', d: '获得1枚灵魂水晶', r: [{ crystal: 1 }] }]
  },
  {
    id: 'altar', t: '远古祭坛', e: '🗿', text: '祭坛上刻着古老的符文，似乎在渴求鲜血。一个灵魂的低语在你耳边回响。', opts: [
      { t: '献祭鲜血', d: '失去12点生命，获得一个稀有灵魂', r: [{ hp: -12 }, { soul: 'rare' }] },
      { t: '虔诚祈祷', d: '恢复10点生命', r: [{ hp: 10 }] },
      { t: '离开', d: '', r: [{ text: '你转身离去。' }] }]
  },
  {
    id: 'camp', t: '废弃营地', e: '⛺', text: '一处冷却的篝火旁散落着行囊，主人早已不知去向。', opts: [
      { t: '休整片刻', d: '恢复15%生命', r: [{ hp: '15%' }] },
      { t: '仔细搜刮', d: '50%获得45金币；50%遭遇战斗', r: [{ chance: [.5, [{ gold: 45 }], [{ fight: 'normal' }]] }] }]
  },
  {
    id: 'riddle', t: '谜题石门', e: '🚪', text: '石门上刻着三个符号：🔥、💧、🌿。门上写着："万物相生相克，择其所克，门自开启。"（提示：火克木）', opts: [
      { t: '选择 🔥', d: '', r: [{ hp: -7 }, { text: '石门喷出火焰！' }] },
      { t: '选择 💧', d: '', r: [{ hp: -7 }, { text: '石门喷出火焰！' }] },
      { t: '选择 🌿', d: '', r: [{ gear: 'rand' }, { text: '石门缓缓开启，里面有一件装备！' }] }]
  },
  {
    id: 'chest', t: '可疑的宝箱', e: '📦', text: '一个孤零零的宝箱，锁上有奇怪的齿痕……', opts: [
      { t: '打开它', d: '60%获得装备；40%是拟态怪！', r: [{ chance: [.6, [{ gear: 'rand' }], [{ hp: -8 }, { curse: 'wound' }, { text: '它咬了你一口！' }]] }] },
      { t: '用火烧', d: '获得20金币', r: [{ gold: 20 }] }]
  },
  {
    id: 'ghost', t: '游魂的请求', e: '👻', text: '一个透明的幽魂飘来，恳求你给它一点金币去"买路"。', opts: [
      { t: '给它30金币', d: '获得一个灵魂', req: { gold: 30 }, r: [{ gold: -30 }, { soul: 'common' }] },
      { t: '驱散它', d: '获得1枚灵魂水晶', r: [{ crystal: 1 }] }]
  },
  {
    id: 'smith', t: '流浪铁匠', e: '🔨', text: '一位铁匠正在路边打铁，他愿意帮你淬炼装备。', opts: [
      { t: '强化卡牌', d: '升级一张卡牌', r: [{ upgradeCard: 1 }] },
      { t: '回炉重造', d: '花费40金币，移除一张卡牌', req: { gold: 40 }, r: [{ gold: -40 }, { removeCard: 1 }] },
      { t: '离开', d: '', r: [{ text: '铁匠耸了耸肩。' }] }]
  },
  {
    id: 'scholar', t: '流浪学者', e: '📚', text: '一位学者愿意传授他的研究成果。', opts: [
      { t: '虚心求教', d: '获得一张随机卡牌', r: [{ card: 'rand' }] },
      { t: '购买情报', d: '花费30金币，获得2枚灵魂水晶', req: { gold: 30 }, r: [{ gold: -30 }, { crystal: 2 }] }]
  },
  {
    id: 'statue', t: '诅咒雕像', e: '🗽', text: '雕像的眼睛闪烁着不祥的红光，手中捧着一件装备。', opts: [
      { t: '取走装备', d: '获得稀有装备，但卡组加入「恐惧」', r: [{ gear: 'rare' }, { curse: 'dread' }] },
      { t: '敬而远之', d: '', r: [{ text: '你决定不去招惹它。' }] }]
  },
  {
    id: 'gambler', t: '地下赌徒', e: '🎲', text: '"来一局吧，朋友！押30金币，赢了翻倍还多！"', opts: [
      { t: '下注30', d: '50%赢得90金币；50%输掉', req: { gold: 30 }, r: [{ chance: [.5, [{ gold: 60 }, { text: '你赢了！' }], [{ gold: -30 }, { text: '你输了……' }]] }] },
      { t: '拒绝', d: '', r: [{ text: '你拒绝了。' }] }]
  },
  {
    id: 'mushroom', t: '发光的蘑菇', e: '🍄', text: '一丛闪着蓝光的蘑菇，看起来……很好吃？', opts: [
      { t: '尝一口', d: '50%最大生命+6；50%失去10生命', r: [{ chance: [.5, [{ maxhp: 6 }], [{ hp: -10 }]] }] },
      { t: '采集带走', d: '获得「治疗药剂」', r: [{ card: 'potion' }] }]
  },
  {
    id: 'bargain', t: '灵魂商贩', e: '👁️', text: '一个没有脸的商贩向你展示一排发光的水晶："用你的生命力来换。"', opts: [
      { t: '交易', d: '最大生命-6，获得3枚灵魂水晶', r: [{ maxhp: -6 }, { crystal: 3 }] },
      { t: '拒绝', d: '', r: [{ text: '商贩消失了。' }] }]
  },
  {
    id: 'fork', t: '分岔小径', e: '🪧', text: '前方的路分成两条：左边平静祥和，右边隐隐传来怒吼。', opts: [
      { t: '走左边', d: '恢复8点生命', r: [{ hp: 8 }] },
      { t: '走右边', d: '战斗！胜利后有额外奖励', r: [{ fight: 'normal' }, { gold: 25 }] }]
  },
  {
    id: 'library', t: '禁忌图书馆', e: '📖', text: '积满灰尘的书架上，一本黑色的书正在低语。', opts: [
      { t: '翻阅禁书', d: '获得一张稀有卡牌，但加入「悔恨」', r: [{ card: 'rare' }, { curse: 'regret' }] },
      { t: '整理书架', d: '移除一张卡牌', r: [{ removeCard: 1 }] }]
  },
  {
    id: 'remains', t: '战场遗骸', e: '🦴', text: '古战场上遍布着残破的兵器与盔甲。', opts: [
      { t: '搜寻装备', d: '获得一件装备', r: [{ gear: 'rand' }] },
      { t: '祭奠亡灵', d: '获得1枚灵魂水晶，恢复5点生命', r: [{ crystal: 1 }, { hp: 5 }] }]
  },
  {
    id: 'temple', t: '荒废神殿', e: '⛪', text: '残破的神像依然散发着圣光。', opts: [
      { t: '捐献50金币', d: '完全恢复生命', req: { gold: 50 }, r: [{ gold: -50 }, { hp: '100%' }] },
      { t: '默默祈祷', d: '恢复10点生命', r: [{ hp: 10 }] }]
  },
  {
    id: 'frozen', t: '冰封的灵魂', e: '🧊', text: '巨大的冰块里封印着一个强大的灵魂，它在向你求助。', opts: [
      { t: '用水晶解封', d: '消耗1枚灵魂水晶，获得稀有灵魂', req: { crystal: 1 }, r: [{ crystal: -1 }, { soul: 'rare' }] },
      { t: '砸碎冰块取宝', d: '获得50金币', r: [{ gold: 50 }] }]
  },
  {
    id: 'dragon', t: '沉睡的巨龙', e: '🐉', text: '一条巨龙趴在宝山上沉睡，鼾声如雷。', opts: [
      { t: '蹑手蹑脚偷宝', d: '50%获得稀有装备；50%惊醒巨龙(精英战)', r: [{ chance: [.5, [{ gear: 'rare' }], [{ fight: 'elite' }]] }] },
      { t: '悄悄离开', d: '', r: [{ text: '你屏住呼吸退了出去。' }] }]
  },
  {
    id: 'mirror', t: '镜之厅', e: '🪞', text: '镜子里的你向你伸出了手："让我们……变得更强。"', opts: [
      { t: '复制一张卡牌', d: '失去8点生命', r: [{ hp: -8 }, { dupCard: 1 }] },
      { t: '打碎镜子', d: '获得25金币', r: [{ gold: 25 }] }]
  },
  {
    id: 'fairy', t: '小精灵的祝福', e: '🧚', text: '一只萤火般的小精灵绕着你飞舞，洒下点点光辉。', opts: [
      { t: '接受祝福', d: '最大生命+4并恢复4点', r: [{ maxhp: 4 }, { hp: 4 }] },
      { t: '捕捉它', d: '获得1枚灵魂水晶和20金币', r: [{ crystal: 1 }, { gold: 20 }] }]
  },
  {
    id: 'crater', t: '陨石坑', e: '☄️', text: '坑底有一块仍在发热的陨铁，散发出奇异的力量。', opts: [
      { t: '触摸陨铁', d: '获得稀有装备，受到9点伤害', r: [{ hp: -9 }, { gear: 'rare' }] },
      { t: '采集碎片', d: '获得35金币', r: [{ gold: 35 }] }]
  },
  {
    id: 'messenger', t: '魔王信使', e: '📜', text: '黑衣信使递来一封血色请柬："魔王陛下有个小小的考验，通过后将有重赏。"', opts: [
      { t: '接受挑战', d: '精英战斗，胜利后额外获得80金币', r: [{ fight: 'elite' }, { gold: 80 }] },
      { t: '撕毁请柬', d: '', r: [{ text: '信使冷笑着消失了。' }] }]
  },
  {
    id: 'wishwell', t: '许愿井', e: '🕳️', text: '井底隐约有金光闪烁。', opts: [
      { t: '投入20金币许愿', d: '随机一个奖励', req: { gold: 20 }, r: [{ gold: -20 }, { chance: [.34, [{ gear: 'rand' }], [{ chance: [.5, [{ card: 'rare' }], [{ soul: 'common' }]] }]] }] },
      { t: '离开', d: '', r: [{ text: '你离开了。' }] }]
  }
];
