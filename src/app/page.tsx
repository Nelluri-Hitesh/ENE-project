"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { audio } from "@/core/audio";
import {
  ACHIEVEMENTS,
  GAMES,
  claimDailyReward,
  getDaily,
  levelFor,
  levelProgress,
  setName,
  update,
  useSave,
  type GameMeta,
} from "@/core/save";

/* ------------------------------------------------------------------ */
/* Horizontal Cinematic Game Card                                      */
/* Contains ONLY: Image · Title · 10 MIN · Short description · Play    */
/* ------------------------------------------------------------------ */
function GameCard({ game, completed }: { game: GameMeta; completed: boolean }) {
  return (
    <Link
      href={`/game/${game.id}`}
      onClick={() => {
        audio.unlock();
        audio.click();
      }}
      className="group relative block h-[380px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151519] transition-[border-color,transform] duration-500 ease-out hover:border-white/[0.16] active:scale-[0.995] md:h-[360px] lg:h-[390px]"
    >
      {/* Cinematic Background Image */}
      <img
        src={game.img}
        alt={game.title}
        loading="lazy"
        style={{ objectPosition: game.imgPos ?? "center 30%" }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
      />

      {/* Directional editorial gradient: rich scene visibility right/top, crisp copy left/bottom */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to top, rgba(11,11,13,0.95) 0%, rgba(11,11,13,0.72) 44%, rgba(11,11,13,0.12) 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(96deg, rgba(11,11,13,0.92) 0%, rgba(11,11,13,0.72) 42%, rgba(11,11,13,0.18) 76%, rgba(11,11,13,0.08) 100%), linear-gradient(to top, rgba(11,11,13,0.65) 0%, rgba(11,11,13,0) 45%)",
        }}
      />

      {/* Card Copy */}
      <div className="relative z-10 flex h-full flex-col justify-end p-7 sm:p-9 md:max-w-xl md:p-11">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#999999]">
            {game.duration}
          </span>
          {completed && (
            <span
              title="Completed"
              className="inline-block h-1.5 w-1.5 rounded-full bg-[#E9FF57]"
            />
          )}
        </div>

        <h3 className="mt-2.5 font-display text-2xl font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">
          {game.title}
        </h3>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#999999] sm:text-[15px]">
          {game.tag}
        </p>

        <div className="mt-6">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-2.5 text-xs font-semibold tracking-wide text-[#0B0B0D] transition-all duration-300 group-hover:bg-[#E9FF57]">
            <svg width="10" height="11" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
              <path d="M1 1.2L11 7L1 12.8V1.2Z" />
            </svg>
            Play
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Quiet Standings & Progress Sheet (on-demand only, keeps home pure)  */
/* ------------------------------------------------------------------ */
interface ScoreRow {
  id?: number;
  player: string;
  score: number;
  game: string;
  createdAt?: string;
}

function StandingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const save = useSave();
  const [tab, setTab] = useState<"leaderboard" | "progress" | "cards">("leaderboard");
  const [period, setPeriod] = useState<"day" | "week" | "all">("all");
  const [gameFilter, setGameFilter] = useState("all");
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameDraft, setNameDraft] = useState(save.name);

  useEffect(() => {
    setNameDraft(save.name);
  }, [save.name]);

  useEffect(() => {
    if (!open || tab !== "leaderboard") return;
    let alive = true;
    setLoading(true);
    fetch(`/api/leaderboard?game=${gameFilter}&period=${period}`)
      .then((r) => r.json())
      .then((d: { scores?: ScoreRow[] }) => {
        if (!alive) return;
        setRows(Array.isArray(d.scores) ? d.scores : []);
      })
      .catch(() => {
        if (alive) setRows([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, tab, period, gameFilter]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const daily = getDaily();
  const level = levelFor(save.xp);
  const completedCount = GAMES.filter((g) => save.best[g.id].completed).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0D]/82 p-4 backdrop-blur-xl animate-fade sm:p-6"
      onClick={onClose}
    >
      <div
        className="surface flex max-h-[84vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-center gap-5">
            {(
              [
                ["leaderboard", "Leaderboard"],
                ["progress", "Progress"],
                ["cards", "Scorecards"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  audio.click();
                  setTab(id);
                }}
                className={`text-xs font-medium transition-colors ${
                  tab === id ? "text-white" : "text-[#999999] hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-xs font-medium text-[#999999] transition-colors hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "leaderboard" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {(
                    [
                      ["day", "Today"],
                      ["week", "Week"],
                      ["all", "All Time"],
                    ] as const
                  ).map(([p, label]) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        period === p
                          ? "bg-white text-[#0B0B0D]"
                          : "text-[#999999] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                  className="rounded-full border border-white/[0.08] bg-[#0B0B0D] px-3.5 py-1.5 text-xs text-white"
                >
                  <option value="all">All Games</option>
                  {GAMES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#0B0B0D]/60">
                {loading ? (
                  <p className="py-10 text-center text-xs text-[#999999]">Loading standings…</p>
                ) : rows.length === 0 ? (
                  <p className="py-10 text-center text-xs text-[#999999]">
                    No scores recorded in this window yet.
                  </p>
                ) : (
                  rows.slice(0, 10).map((r, i) => (
                    <div
                      key={r.id ?? `${r.player}-${i}`}
                      className="flex items-center gap-4 px-4 py-3 text-sm"
                    >
                      <span
                        className={`w-5 text-xs tabular-nums ${
                          i === 0 ? "font-semibold text-[#E9FF57]" : "text-[#999999]"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate font-medium text-white">{r.player}</span>
                      <span className="hidden text-xs text-[#999999] sm:inline">
                        {GAMES.find((g) => g.id === r.game)?.title ?? r.game}
                      </span>
                      <span className="font-medium tabular-nums text-white">
                        {r.score.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="text-xs text-[#999999]" htmlFor="ene-player-name">
                  Display name
                </label>
                <input
                  id="ene-player-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value.slice(0, 24))}
                  onBlur={() => setName(nameDraft)}
                  placeholder="Add name to post scores"
                  className="w-52 rounded-full border border-white/[0.08] bg-[#0B0B0D] px-4 py-1.5 text-xs text-white placeholder:text-[#999999]/60"
                />
              </div>
            </div>
          )}

          {tab === "progress" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0B0D]/60 p-4">
                  <p className="text-[11px] text-[#999999]">Level</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                    {level}
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-[#A855F7]"
                      style={{ width: `${Math.round(levelProgress(save.xp) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0B0D]/60 p-4">
                  <p className="text-[11px] text-[#999999]">Total XP</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                    {save.xp.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-[11px] text-[#999999]">{save.coins.toLocaleString()} coins</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0B0B0D]/60 p-4">
                  <p className="text-[11px] text-[#999999]">Completed</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
                    {completedCount}/5
                  </p>
                  <p className="mt-1.5 text-[11px] text-[#999999]">
                    {GAMES.filter((g) => save.hidden[g.id]).length}/5 secrets
                  </p>
                </div>
              </div>

              {/* Daily Challenge */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0B0B0D]/60 p-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#999999]">
                    Daily Challenge
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{daily.text}</p>
                </div>
                {save.daily.claimed ? (
                  <span className="shrink-0 text-xs font-medium text-[#E9FF57]">Claimed</span>
                ) : save.daily.done ? (
                  <button
                    onClick={() => {
                      audio.levelup();
                      claimDailyReward();
                    }}
                    className="shrink-0 rounded-full bg-[#E9FF57] px-4 py-2 text-xs font-semibold text-[#0B0B0D]"
                  >
                    Claim +100 XP
                  </button>
                ) : (
                  <Link
                    href={`/game/${daily.game}`}
                    onClick={onClose}
                    className="shrink-0 rounded-full border border-white/[0.08] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    Play
                  </Link>
                )}
              </div>

              {/* Personal bests */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#999999]">
                  Personal Bests
                </p>
                <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#0B0B0D]/60">
                  {GAMES.map((g) => (
                    <div key={g.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <span className="text-white">{g.title}</span>
                      <span className="tabular-nums text-[#999999]">
                        {save.best[g.id].score > 0
                          ? save.best[g.id].score.toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#999999]">
                  Milestones ({save.ach.length}/{ACHIEVEMENTS.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ACHIEVEMENTS.map((a) => {
                    const earned = save.ach.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        className={`rounded-xl border border-white/[0.08] px-3.5 py-2.5 ${
                          earned ? "bg-white/[0.05]" : "opacity-45"
                        }`}
                      >
                        <p className="text-xs font-medium text-white">
                          {earned || !a.secret ? a.name : "Hidden Milestone"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#999999]">
                          {earned || !a.secret ? a.desc : "Keep playing to uncover"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "cards" && (
            <div>
              {save.gallery.length === 0 ? (
                <p className="py-12 text-center text-xs text-[#999999]">
                  Complete any game to generate your first shareable meme scorecard.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {save.gallery.map((g, i) => (
                    <a
                      key={`${g.t}-${i}`}
                      href={g.img}
                      download={`ene-${g.game}-scorecard.jpg`}
                      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0B0D]"
                    >
                      <img
                        src={g.img}
                        alt={g.title}
                        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Minimal Premium Cinematic Homepage                                  */
/* ------------------------------------------------------------------ */
export default function Home() {
  const save = useSave();
  const [mounted, setMounted] = useState(false);
  const [standingsOpen, setStandingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => audio.stopMusic();
  }, []);

  useEffect(() => {
    audio.setVols({
      master: save.settings.master,
      music: save.settings.music,
      sfx: save.settings.sfx,
      muted: save.settings.muted,
    });
  }, [save.settings.master, save.settings.music, save.settings.sfx, save.settings.muted]);

  const isMuted = mounted ? save.settings.muted : false;

  const toggleSound = useCallback(() => {
    audio.unlock();
    const nextMuted = !save.settings.muted;
    update((s) => {
      s.settings.muted = nextMuted;
      s.musicOn = !nextMuted;
    });
    audio.setVols({ muted: nextMuted });
    if (nextMuted) {
      audio.stopMusic();
    } else {
      audio.click();
      audio.startMusic("hero");
    }
  }, [save.settings.muted]);

  const handlePlayNow = useCallback(() => {
    audio.unlock();
    audio.click();
    document.getElementById("games")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[#0B0B0D] text-white overflow-x-hidden">
      {/* Ambient Dashboard Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15">
        <img
          src="/images/dashboard-bg.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[center_25%] blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-[#0B0B0D]/80" />
      </div>

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* ---------------- FULL-SCREEN CINEMATIC HERO ---------------- */}
        <header className="relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden">
          {/* Cinematic Photography with subtle slow movement */}
          <img
            src="/images/hero.webp"
            alt="ENE Gang — Four friends smiling"
            className="absolute inset-0 h-full w-full object-cover object-[center_20%] sm:object-[center_25%] animate-ken-burns"
          />

          {/* Refined cinematic grading & bottom transition into #0B0B0D */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #0B0B0D 0%, rgba(11,11,13,0.75) 28%, rgba(11,11,13,0.18) 60%, rgba(11,11,13,0.5) 100%)",
            }}
          />

          {/* Minimal Top Row: ENE Wordmark + Small Sound Toggle */}
          <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7 sm:px-10 sm:pt-9">
            <span className="font-display text-sm font-extrabold tracking-[0.28em] text-white drop-shadow">
              ENE
            </span>

            <button
              onClick={toggleSound}
              aria-label={isMuted ? "Unmute sound" : "Mute sound"}
              title={isMuted ? "Sound off" : "Sound on"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#151519]/65 text-white/85 backdrop-blur-md transition-all duration-200 hover:border-white/25 hover:bg-[#151519] hover:text-white active:scale-95"
            >
              {isMuted ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>

          {/* Bottom Editorial Hero Composition */}
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-14 sm:px-10 sm:pb-20 animate-fade-up">
            <h1 className="font-display text-6xl font-extrabold leading-[0.94] tracking-[-0.05em] text-white sm:text-8xl lg:text-[96px] drop-shadow-md">
              ENE
            </h1>

            <p className="mt-4 max-w-lg text-base font-normal leading-relaxed text-white/90 sm:text-xl drop-shadow">
              Friendship ki limit ledhu. Madness ki brake ledhu.
            </p>

            <div className="mt-8">
              <button
                onClick={handlePlayNow}
                className="inline-flex items-center gap-3 rounded-full bg-[#E9FF57] px-9 py-4 text-sm font-semibold tracking-wide text-[#0B0B0D] shadow-lg shadow-[#E9FF57]/15 transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
              >
                <svg width="11" height="12" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
                  <path d="M1 1.2L11 7L1 12.8V1.2Z" />
                </svg>
                Play Now
              </button>
            </div>
          </div>
        </header>

      {/* ---------------- FIVE CINEMATIC GAME CARDS ---------------- */}
      <main id="games" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <div className="mb-12 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
            Games
          </h2>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#999999]">
            5 Chapters · 50 Min
          </span>
        </div>

        <div className="flex flex-col gap-6 sm:gap-8">
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              completed={mounted ? save.best[game.id].completed : false}
            />
          ))}
        </div>
      </main>

      {/* ---------------- MINIMAL FOOTER ---------------- */}
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs text-[#999999] sm:flex-row sm:px-10">
          <p>
            <span className="font-display font-bold tracking-[0.18em] text-white">ENE</span>
            <span className="mx-3 text-white/20">·</span>
            Minimal look. Maximum madness.
          </p>

          <button
            onClick={() => {
              audio.unlock();
              audio.click();
              setStandingsOpen(true);
            }}
            className="text-xs font-medium text-[#999999] transition-colors hover:text-white"
          >
            Leaderboard &amp; Progress
          </button>
        </div>
      </footer>

        <StandingsModal open={standingsOpen} onClose={() => setStandingsOpen(false)} />
      </div>
    </div>
  );
}
