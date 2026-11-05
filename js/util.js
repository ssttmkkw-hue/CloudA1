'use strict';
/* ========== 通用工具 ========== */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
let SPEED = 1; // 动画速度系数（测试时设为 0）
const sleep = ms => new Promise(r => setTimeout(r, ms * SPEED));
const rnd = n => Math.floor(Math.random() * n);
const rr = (a, b) => a + rnd(b - a + 1);
const pick = a => a[rnd(a.length)];
const chance = p => Math.random() < p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
function wpick(items, wf) {
  let tot = 0; const ws = items.map(i => { const w = Math.max(0, wf(i)); tot += w; return w; });
  if (tot <= 0) return pick(items);
  let r = Math.random() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let _uid = 0; const uid = (p = 'u') => p + (++_uid) + '_' + rnd(1e4);

/* ========== 本地存储 ========== */
const Store = {
  get(k, d) { try { const v = localStorage.getItem('hq_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('hq_' + k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem('hq_' + k); } catch (e) { } }
};

/* ========== 简易音效 (WebAudio) ========== */
const Snd = {
  ctx: null, on: true,
  init() { if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } },
  tone(f, d, type = 'square', vol = 0.05, slide = 0) {
    if (!this.on || !this.ctx) return;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = f;
      if (slide) o.frequency.linearRampToValueAtTime(f + slide, this.ctx.currentTime + d);
      g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + d);
      o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + d);
    } catch (e) { }
  },
  play(n) {
    if (SPEED === 0) return;
    ({
      hit: () => this.tone(180, .12, 'sawtooth', .06, -90),
      crit: () => { this.tone(260, .1, 'sawtooth', .07, -150); this.tone(120, .18, 'square', .05); },
      heal: () => { this.tone(520, .12, 'sine', .05, 200); },
      card: () => this.tone(330, .07, 'triangle', .05, 120),
      block: () => this.tone(240, .09, 'square', .04),
      summon: () => { this.tone(300, .25, 'sine', .06, 400); },
      win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .2, 'triangle', .06), i * 110)); },
      lose: () => { [300, 240, 180, 120].forEach((f, i) => setTimeout(() => this.tone(f, .3, 'sawtooth', .05), i * 160)); },
      catch: () => { [440, 660, 880, 1320].forEach((f, i) => setTimeout(() => this.tone(f, .16, 'sine', .06), i * 90)); },
      fail: () => this.tone(200, .25, 'square', .05, -100),
      click: () => this.tone(500, .04, 'sine', .03),
      evo: () => { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .2, 'triangle', .06), i * 100)); },
    }[n] || (() => { }))();
  }
};
