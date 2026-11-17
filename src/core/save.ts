import { useSyncExternalStore } from "react";
import { GAMES, GAME_MAP, type GameId, type GameMeta } from "./games-meta";

export { GAMES, GAME_MAP };
export type { GameId, GameMeta };

/* ------------------------------------------------------------------ */
/* Save data                                                           */
/* ------------------------------------------------------------------ */
export interface Best {
  score: number;
  completed: boolean;
  plays: number;
}
export interface Settings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}
export interface GalleryItem {
  game: GameId;
  title: string;
  score: number;
  img: string;
  t: number;
}
export interface SaveData {
  v: 1;
  name: string;
  musicOn: boolean;
  xp: number;
  coins: number;
  best: Record<GameId, Best>;
  settings: Settings;
  ach: string[];
  hidden: Record<GameId, boolean>;
  fails: number;
  daily: { date: string; done: boolean; claimed: boolean };
  gallery: GalleryItem[];
  createdAt: number;
}

const KEY = "ene-gameverse-save-v1";

export function freshSave(): SaveData {
  return {
    v: 1,
    name: "",
    musicOn: true,
    xp: 0,
    coins: 0,
    best: {
      directors: { score: 0, completed: false, plays: 0 },
      buddies: { score: 0, completed: false, plays: 0 },
      runner: { score: 0, completed: false, plays: 0 },
      pelli: { score: 0, completed: false, plays: 0 },
      final: { score: 0, completed: false, plays: 0 },
    },
    settings: { master: 0.9, music: 0.7, sfx: 0.9, muted: false },
    ach: [],
    hidden: { directors: false, buddies: false, runner: false, pelli: false, final: false },
    fails: 0,
    daily: { date: today(), done: false, claimed: false },
    gallery: [],
    createdAt: Date.now(),
  };
}

const num = (v: unknown, d = 0) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : d);

function mergeBest(b: unknown): Best {
  if (typeof b !== "object" || b === null) return { score: 0, completed: false, plays: 0 };
  const x = b as Record<string, unknown>;
  return {
    score: Math.floor(num(x.score)),
    completed: !!x.completed,
    plays: Math.floor(num(x.plays)),
  };
}

function mergeSettings(s: unknown): Settings {
  const d = freshSave().settings;
  if (typeof s !== "object" || s === null) return d;
  const x = s as Record<string, unknown>;
  const clamp = (v: unknown) => Math.min(1, Math.max(0, num(v, 1)));
  return {
    master: clamp(x.master),
    music: clamp(x.music),
    sfx: clamp(x.sfx),
    muted: !!x.muted,
  };
}

function mergeFresh(p: Record<string, unknown>): SaveData {
  const f = freshSave();
  return {
    v: 1,
    name: typeof p.name === "string" ? p.name.slice(0, 24) : "",
    musicOn: typeof p.musicOn === "boolean" ? p.musicOn : true,
    xp: Math.floor(num(p.xp)),
    coins: Math.floor(num(p.coins)),
    best: {
      directors: mergeBest((p.best as Record<string, unknown>)?.directors),
      buddies: mergeBest((p.best as Record<string, unknown>)?.buddies),
      runner: mergeBest((p.best as Record<string, unknown>)?.runner),
      pelli: mergeBest((p.best as Record<string, unknown>)?.pelli),
      final: mergeBest((p.best as Record<string, unknown>)?.final),
    },
    settings: mergeSettings(p.settings),
    ach: Array.isArray(p.ach) ? (p.ach as unknown[]).filter((a) => typeof a === "string").slice(0, 60) : [],
    hidden: {
      directors: !!(p.hidden as Record<string, unknown>)?.directors,
      buddies: !!(p.hidden as Record<string, unknown>)?.buddies,
      runner: !!(p.hidden as Record<string, unknown>)?.runner,
      pelli: !!(p.hidden as Record<string, unknown>)?.pelli,
      final: !!(p.hidden as Record<string, unknown>)?.final,
    },
    fails: Math.floor(num(p.fails)),
    daily:
      p.daily && (p.daily as { date?: string }).date === today()
        ? {
            date: today(),
            done: !!(p.daily as { done?: boolean }).done,
            claimed: !!(p.daily as { claimed?: boolean }).claimed,
          }
        : { date: today(), done: false, claimed: false },
    gallery: Array.isArray(p.gallery)
      ? (p.gallery as GalleryItem[])
          .filter((g) => g && typeof g.img === "string" && typeof g.game === "string")
          .slice(0, 4)
      : [],
    createdAt: Math.floor(num(p.createdAt, Date.now())),
  };
}

let cache: SaveData | null = null;
const listeners = new Set<() => void>();
const serverSnap = typeof window === "undefined" ? freshSave() : null;

export function loadSave(): SaveData {
  if (cache) return cache;
  if (typeof window === "undefined") return serverSnap as SaveData;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) throw new Error("bad");
    cache = mergeFresh(parsed);
  } catch {
    cache = freshSave();
  }
  persist();
  return cache;
}

export function persist() {
  if (!cache || typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full/blocked — keep playing without save */
  }
}

export function update(mut: (s: SaveData) => void) {
  const s = loadSave();
  mut(s);
  persist();
  listeners.forEach((l) => l());
}

export function useSave(): SaveData {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => loadSave(),
    () => serverSnap as SaveData
  );
}

/* ------------------------------------------------------------------ */
/* Levels / XP                                                         */
/* ------------------------------------------------------------------ */
export function levelFor(xp: number) {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 120));
}
export function levelProgress(xp: number) {
  const lvl = levelFor(xp);
  const base = 120 * (lvl - 1) ** 2;
  const next = 120 * lvl ** 2;
  return Math.min(1, Math.max(0, (xp - base) / (next - base)));
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */
export interface Ach {
  id: string;
  name: string;
  desc: string;
  secret?: boolean;
}
export const ACHIEVEMENTS: Ach[] = [
  { id: "first_cut", name: "First Cut", desc: "Complete any game" },
  { id: "dear_cant", name: "Dear Cant Guru", desc: "Finish Director's Disaster" },
  { id: "crew_complete", name: "Full Crew", desc: "Complete all 5 games" },
  { id: "meme_master", name: "Professional Meme Runner", desc: "Score 5000+ in Meme Escape" },
  { id: "slipper_free", name: "Slipper-Free Zone", desc: "Finish Pelli Choopulu with peace 60+" },
  { id: "legendary", name: "Legendary Blockbuster", desc: "Legendary ending in the finale" },
  { id: "daily_hero", name: "Daily Legend", desc: "Complete a daily challenge" },
  { id: "rich", name: "Biryani Budget", desc: "Hold 500 coins" },
  { id: "lvl5", name: "Meme Lord", desc: "Reach level 5" },
  { id: "egg3", name: "Egg Hunter", desc: "Find 3 hidden secrets", secret: true },
  { id: "egg5", name: "Secret Decoder", desc: "Find all 5 hidden secrets", secret: true },
  { id: "ten_fails", name: "Disaster Magnet", desc: "Fail 10 times (certified chaos)", secret: true },
  { id: "perfection", name: "Zero-Problem Hero", desc: "Win any game with 90%+ score", secret: true },
  { id: "secret_ending", name: "Hidden Reel", desc: "Unlock the secret comedy ending", secret: true },
];

export function checkAchievements(
  s: SaveData,
  ctx: ResultInput
): Ach[] {
  const earned = new Set(s.ach);
  const gained: Ach[] = [];
  const add = (id: string) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a && !earned.has(id)) {
      earned.add(id);
      gained.push(a);
    }
  };
  const completedAny = GAMES.some((g) => s.best[g.id].completed);
  if (completedAny) add("first_cut");
  if (s.best.directors.completed) add("dear_cant");
  if (GAMES.every((g) => s.best[g.id].completed)) add("crew_complete");
  if (s.best.runner.score >= 5000) add("meme_master");
  if (ctx.game === "pelli" && ctx.completed && (ctx.peace ?? 0) >= 60) add("slipper_free");
  if (ctx.endingId === "legendary") add("legendary");
  if (s.daily.done && !s.daily.claimed) add("daily_hero");
  if (s.coins >= 500) add("rich");
  if (levelFor(s.xp) >= 5) add("lvl5");
  const eggs = GAMES.filter((g) => s.hidden[g.id]).length;
  if (eggs >= 3) add("egg3");
  if (eggs >= 5) add("egg5");
  if (s.fails >= 10) add("ten_fails");
  if (ctx.won && ctx.score >= ctx.max * 0.9) add("perfection");
  if (ctx.endingId === "secret") add("secret_ending");
  if (gained.length) s.ach = [...earned];
  return gained;
}

/* ------------------------------------------------------------------ */
/* Results + rewards                                                   */
/* ------------------------------------------------------------------ */
export interface ResultInput {
  game: GameId;
  score: number;
  max: number;
  won: boolean;
  completed: boolean;
  hidden?: boolean;
  peace?: number;
  endingId?: string;
}
export interface ResultReward {
  xp: number;
  coins: number;
  level: number;
  leveledUp: boolean;
  newAch: Ach[];
  newBest: boolean;
}

export function recordResult(input: ResultInput): ResultReward {
  const before = loadSave();
  const b = before.best[input.game];
  const newBest = input.score > b.score;
  const levelBefore = levelFor(before.xp);
  const xp =
    Math.round(input.score / 8) +
    (input.completed ? 150 : 0) +
    (input.won ? 100 : 0) +
    (input.hidden ? 120 : 0);
  const coins =
    Math.round(input.score / 40) + (input.completed ? 40 : 0) + (input.hidden ? 30 : 0);

  const d = getDaily();
  update((s) => {
    s.best[input.game] = {
      score: Math.max(b.score, input.score),
      completed: b.completed || input.completed,
      plays: b.plays + 1,
    };
    if (!input.won) s.fails += 1;
    if (input.hidden) s.hidden[input.game] = true;
    s.xp += xp;
    s.coins += coins;
    if (s.daily.date !== today()) s.daily = { date: today(), done: false, claimed: false };
    if (!s.daily.done && d.game === input.game && meetsDaily(d, input)) s.daily.done = true;
  });

  const after = loadSave();
  const newAch = checkAchievements(after, input);
  if (newAch.length) update(() => undefined);
  return {
    xp,
    coins,
    level: levelFor(after.xp),
    leveledUp: levelFor(after.xp) > levelBefore,
    newAch,
    newBest,
  };
}

export function addGalleryItem(item: GalleryItem) {
  update((s) => {
    s.gallery = [item, ...s.gallery].slice(0, 4);
  });
}

/* ------------------------------------------------------------------ */
/* Daily challenge                                                     */
/* ------------------------------------------------------------------ */
export interface Daily {
  game: GameId;
  text: string;
  target: number;
  by: "score" | "completed";
}
const DAILY_POOL: Daily[] = [
  { game: "runner", text: "Score 3000+ in Meme Escape", target: 3000, by: "score" },
  { game: "directors", text: "Score 500+ in Director's Disaster", target: 500, by: "score" },
  { game: "pelli", text: "Score 700+ Meme Rating in Pelli Choopulu", target: 700, by: "score" },
  { game: "buddies", text: "Score 600+ in Beer Buddies", target: 600, by: "score" },
  { game: "final", text: "Score 900+ in The Final Blockbuster", target: 900, by: "score" },
  { game: "runner", text: "Finish the FULL Meme Escape run (all 3 acts)", target: 0, by: "completed" },
  { game: "directors", text: "Shoot the whole film — finish Director's Disaster", target: 0, by: "completed" },
  { game: "pelli", text: "Survive the full family meeting in Pelli Choopulu", target: 0, by: "completed" },
  { game: "buddies", text: "Complete all 5 missions in Beer Buddies", target: 0, by: "completed" },
  { game: "runner", text: "Score 5000+ in Meme Escape (certified meme master)", target: 5000, by: "score" },
  { game: "final", text: "Beat THE PRODUCER — finish the finale", target: 0, by: "completed" },
  { game: "pelli", text: "Score 900+ Meme Rating in Pelli Choopulu", target: 900, by: "score" },
];

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function daySeed() {
  const t = today();
  let h = 7;
  for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
export function getDaily(): Daily {
  return DAILY_POOL[daySeed() % DAILY_POOL.length];
}
export function meetsDaily(d: Daily, r: ResultInput) {
  return d.by === "completed" ? r.completed : r.score >= d.target;
}

export function claimDailyReward(): boolean {
  const s = loadSave();
  const d = getDaily();
  if (s.daily.date !== today() || !s.daily.done || s.daily.claimed) return false;
  const gained: Ach[] = [];
  update((x) => {
    x.daily = { ...x.daily, claimed: true };
    x.xp += 100;
    x.coins += 30;
  });
  const after = loadSave();
  const a = ACHIEVEMENTS.find((z) => z.id === "daily_hero");
  if (a && !after.ach.includes("daily_hero")) {
    update((x) => {
      x.ach = [...x.ach, "daily_hero"];
    });
    gained.push(a);
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Player name                                                         */
/* ------------------------------------------------------------------ */
export function setName(name: string) {
  update((s) => {
    s.name = name.trim().slice(0, 24);
  });
}
