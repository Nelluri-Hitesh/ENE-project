"use client";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { audio } from "./audio";
import { ratingFor, telgishVerdict } from "./comedy";
import { makeMemeCard } from "./meme";
import { buildShareText, copyText, shareNative, whatsappLink } from "./share";
import {
  GAME_MAP,
  addGalleryItem,
  recordResult,
  setName,
  update,
  useSave,
  type GameId,
  type GameMeta,
  type ResultReward,
} from "./save";

/* ------------------------------------------------------------------ */
/* Restart signal hook                                                 */
/* ------------------------------------------------------------------ */
export function useRestartKey() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const h = () => setK((x) => x + 1);
    window.addEventListener("ene-restart", h);
    return () => window.removeEventListener("ene-restart", h);
  }, []);
  return k;
}

/* ------------------------------------------------------------------ */
/* Minimal hairline progress bar                                       */
/* ------------------------------------------------------------------ */
export function Bar({
  value,
  max,
  color = "#FFFFFF",
  className = "",
}: {
  value: number;
  max: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-white/[0.08] ${className}`}>
      <div
        className="h-full rounded-full transition-[width,background-color] duration-200 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cinematic one-line subtitle toast                                   */
/* ------------------------------------------------------------------ */
function SubtitleToast({ msg, sub }: { msg: string; sub?: string }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-16 z-40 w-[92%] max-w-lg -translate-x-1/2 animate-subtitle">
      <div className="surface-glass rounded-full px-5 py-2 text-center shadow-2xl">
        <p className="truncate text-xs font-medium text-white/95 sm:text-sm">{msg}</p>
        {sub ? <p className="truncate text-[11px] text-[#999999]">{sub}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HUD state exposed to every game                                     */
/* ------------------------------------------------------------------ */
export interface HudState {
  objective: string;
  score: number;
  timer?: number | null; // seconds; null/undefined hides timer
}

export function formatTimer(sec: number): string {
  const clamped = Math.max(0, Math.ceil(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/* ------------------------------------------------------------------ */
/* Sound Mixer Modal                                                   */
/* ------------------------------------------------------------------ */
export function VolumePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const save = useSave();
  if (!open) return null;
  const s = save.settings;
  const setChannel = (k: "master" | "music" | "sfx", v: number) => {
    update((d) => {
      d.settings[k] = v;
    });
    audio.setVols({ [k]: v });
  };
  const toggleMute = () => {
    const next = !s.muted;
    update((d) => {
      d.settings.muted = next;
    });
    audio.setVols({ muted: next });
    if (!next) audio.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0D]/80 p-6 backdrop-blur-xl animate-fade"
      onClick={onClose}
    >
      <div
        className="surface w-full max-w-xs rounded-3xl p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Sound</h3>
          <button
            onClick={onClose}
            className="text-xs font-medium text-[#999999] transition-colors hover:text-white"
          >
            Done
          </button>
        </div>

        <div className="space-y-5">
          {(
            [
              ["Master", "master"],
              ["Music", "music"],
              ["Effects", "sfx"],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="block">
              <div className="mb-2 flex justify-between text-xs text-[#999999]">
                <span>{label}</span>
                <span className="tabular-nums text-white/80">{Math.round(s[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(s[key] * 100)}
                onChange={(e) => setChannel(key, Number(e.target.value) / 100)}
                className="w-full"
              />
            </label>
          ))}
        </div>

        <button
          onClick={toggleMute}
          className={`mt-7 w-full rounded-full py-2.5 text-xs font-medium transition-colors ${
            s.muted
              ? "bg-[#E9FF57] text-[#0B0B0D]"
              : "border border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
          }`}
        >
          {s.muted ? "Unmute Audio" : "Mute All"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error Boundary                                                      */
/* ------------------------------------------------------------------ */
class GameCrash extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-[#0B0B0D] px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#999999]">Scene Interrupted</p>
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Something tripped over a cable.
          </h2>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ crashed: false });
                window.location.reload();
              }}
              className="rounded-full bg-[#E9FF57] px-7 py-3 text-sm font-semibold text-[#0B0B0D] transition-transform active:scale-[0.98]"
            >
              Reload
            </button>
            <Link
              href="/#games"
              className="rounded-full border border-white/[0.08] bg-[#151519] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              Back to Games
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Minimal Editorial Results Screen                                    */
/* ------------------------------------------------------------------ */
export interface GameResult {
  score: number;
  won: boolean;
  completed: boolean;
  stats: [string, string][];
  hidden?: boolean;
  endingId?: string;
  peace?: number;
  winJoke?: string;
  resultTitle?: string;
}

function ResultScreen({
  meta,
  result,
  onReplay,
}: {
  meta: GameMeta;
  result: GameResult;
  onReplay: () => void;
}) {
  const save = useSave();
  const [reward, setReward] = useState<ResultReward | null>(null);
  const [meme, setMeme] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [postedName, setPostedName] = useState(false);
  const [nameInput, setNameInput] = useState(save.name);
  const recorded = useRef(false);

  const rating = useMemo(() => ratingFor(meta.id, result.score, meta.max), [meta, result]);
  const displayTitle = result.resultTitle ?? rating.title;
  const oneJoke = useMemo(
    () => telgishVerdict(meta.id, result.won),
    [meta.id, result.won]
  );

  const shareText = buildShareText({
    game: meta.title,
    title: displayTitle,
    score: result.score,
    max: meta.max,
    name: save.name,
    win: result.won,
  });

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    const r = recordResult({
      game: meta.id,
      score: result.score,
      max: meta.max,
      won: result.won,
      completed: result.completed,
      hidden: result.hidden,
      endingId: result.endingId,
      peace: result.peace,
    });
    setReward(r);

    if (save.name.trim() && result.score > 0) {
      setPostedName(true);
      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: meta.id,
          score: Math.round(result.score),
          player: save.name.trim(),
        }),
      }).catch(() => undefined);
    }

    makeMemeCard({
      gameImage: meta.img,
      gameLabel: meta.title,
      title: displayTitle,
      score: result.score,
      pct: rating.pct,
      name: save.name || undefined,
      tagline: oneJoke,
    })
      .then((m) => {
        if (m) {
          setMeme(m);
          addGalleryItem({
            game: meta.id,
            title: displayTitle,
            score: result.score,
            img: m,
            t: Date.now(),
          });
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    audio.click();
    const mode = await shareNative(shareText, meme ?? undefined);
    if (mode === "copied") {
      setShareOpen((o) => !o);
      await copyText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSaveScore = async () => {
    const clean = nameInput.trim().slice(0, 24);
    if (!clean || postedName) return;
    audio.click();
    setName(clean);
    setPostedName(true);
    if (result.score > 0) {
      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: meta.id,
          score: Math.round(result.score),
          player: clean,
        }),
      }).catch(() => undefined);
    }
    const updatedCard = await makeMemeCard({
      gameImage: meta.img,
      gameLabel: meta.title,
      title: displayTitle,
      score: result.score,
      pct: rating.pct,
      name: clean,
      tagline: oneJoke,
    });
    if (updatedCard) setMeme(updatedCard);
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col items-center justify-center px-6 py-14 animate-fade-up">
      <div className="grid w-full items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
        {/* Left: Editorial Result Copy & Primary Controls */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#999999]">
            {meta.title}
            {reward?.newBest ? (
              <span className="ml-2.5 text-[#A855F7]">· New Best</span>
            ) : null}
          </p>

          <h1 className="mt-3 font-display text-3xl font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl">
            {displayTitle}
          </h1>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-6xl font-extrabold tabular-nums tracking-[-0.04em] text-[#E9FF57] sm:text-7xl">
              {result.score.toLocaleString()}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#999999]">
              Score
            </span>
          </div>

          <p className="mt-6 max-w-md text-base leading-relaxed text-[#999999] sm:text-lg">
            &ldquo;{oneJoke}&rdquo;
          </p>

          {/* Primary Actions: Play Again · Share Result · Back to Games */}
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <button
              onClick={onReplay}
              className="rounded-full bg-[#E9FF57] px-8 py-3.5 text-sm font-semibold text-[#0B0B0D] transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
            >
              Play Again
            </button>
            <button
              onClick={handleShare}
              className="rounded-full border border-white/[0.08] bg-[#151519] px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:border-white/20 hover:bg-[#1C1C22] active:scale-[0.98]"
            >
              {copied ? "Copied to Clipboard" : "Share Result"}
            </button>
            <Link
              href="/#games"
              onClick={() => audio.click()}
              className="rounded-full px-5 py-3.5 text-center text-sm font-medium text-[#999999] transition-colors hover:text-white"
            >
              Back to Games
            </Link>
          </div>

          {/* Contextual share drawer (only shown when toggled or fallback used) */}
          {shareOpen && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 animate-fade md:justify-start">
              <a
                href={whatsappLink(shareText)}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/[0.08] bg-[#151519] px-4 py-2 text-xs font-medium text-white transition-colors hover:border-white/20"
              >
                WhatsApp
              </a>
              {meme && (
                <a
                  href={meme}
                  download={`ene-${meta.id}-scorecard.jpg`}
                  className="rounded-full border border-white/[0.08] bg-[#151519] px-4 py-2 text-xs font-medium text-white transition-colors hover:border-white/20"
                >
                  Save Scorecard
                </a>
              )}
              <button
                onClick={async () => {
                  await copyText(`${shareText}\n${window.location.href}`);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-full border border-white/[0.08] bg-[#151519] px-4 py-2 text-xs font-medium text-[#999999] transition-colors hover:text-white"
              >
                Copy Challenge Link
              </button>
              {!postedName && result.score > 0 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSaveScore();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value.slice(0, 24))}
                    placeholder="Your name for leaderboard"
                    className="h-8 w-44 rounded-full border border-white/[0.08] bg-[#151519] px-3.5 text-xs text-white placeholder:text-[#999999]/60"
                  />
                  <button
                    type="submit"
                    className="h-8 rounded-full bg-white px-3.5 text-xs font-medium text-[#0B0B0D]"
                  >
                    Post
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right: Generated Cinematic Meme Scorecard */}
        <div className="mx-auto w-full max-w-[300px] sm:max-w-[330px]">
          {meme ? (
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151519] shadow-[0_30px_80px_rgba(0,0,0,0.65)] animate-fade">
              <img
                src={meme}
                alt={`${displayTitle} — ${result.score}`}
                className="block aspect-[4/5] w-full object-cover"
              />
              <a
                href={meme}
                download={`ene-${meta.id}-scorecard.jpg`}
                className="absolute bottom-3 right-3 rounded-full bg-[#0B0B0D]/80 px-3.5 py-1.5 text-[11px] font-medium text-white/90 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100"
              >
                Download
              </a>
            </div>
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-[#151519]">
              <span className="text-xs text-[#999999]">Rendering scorecard…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell Context passed to each Game                                   */
/* ------------------------------------------------------------------ */
export interface GameShellApi {
  paused: boolean;
  onFinish: (r: GameResult) => void;
  onEgg: () => void;
  toast: (msg: string, sub?: string) => void;
  setHud: (h: HudState) => void;
}

/* ------------------------------------------------------------------ */
/* Minimal Cinematic GameShell                                         */
/* ------------------------------------------------------------------ */
export function GameShell({
  id,
  mood = "chaos",
  children,
}: {
  id: GameId;
  mood?: "hero" | "chaos" | "calm" | "boss";
  children: (shell: GameShellApi) => ReactNode;
}) {
  const meta = GAME_MAP[id];
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [paused, setPaused] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; sub?: string } | null>(null);
  const [hud, setHudState] = useState<HudState>({
    objective: meta.premise,
    score: 0,
    timer: null,
  });
  const toastTimer = useRef<number | null>(null);
  const save = useSave();

  const setHud = useCallback((next: HudState) => {
    setHudState((prev) => {
      const prevT = prev.timer == null ? null : Math.ceil(prev.timer);
      const nextT = next.timer == null ? null : Math.ceil(next.timer);
      if (prev.objective === next.objective && prev.score === next.score && prevT === nextT) {
        return prev;
      }
      return { objective: next.objective, score: next.score, timer: nextT };
    });
  }, []);

  const showToast = useCallback((msg: string, sub?: string) => {
    setToast({ msg, sub });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    audio.setVols({
      master: save.settings.master,
      music: save.settings.music,
      sfx: save.settings.sfx,
      muted: save.settings.muted,
    });
  }, [save.settings.master, save.settings.music, save.settings.sfx, save.settings.muted]);

  useEffect(() => {
    if (phase === "play" && !paused && save.musicOn && !save.settings.muted) {
      audio.startMusic(mood);
    } else {
      audio.stopMusic();
    }
    return () => audio.stopMusic();
  }, [phase, paused, mood, save.musicOn, save.settings.muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "p" || e.key === "P" || e.key === "Escape") && phase === "play") {
        e.preventDefault();
        setConfirmExit(false);
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden && phase === "play") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  const start = () => {
    audio.unlock();
    audio.click();
    setToast(null);
    setConfirmExit(false);
    setPhase("play");
    setPaused(false);
  };

  const onFinish = useCallback((r: GameResult) => {
    setToast(null);
    setResult(r);
    setPhase("result");
    audio.stopMusic();
    if (r.won) audio.applause();
    else audio.bad();
  }, []);

  const onEgg = useCallback(() => {
    audio.egg();
    showToast("Secret discovered", "Hidden reel progress saved");
  }, [showToast]);

  const timerUrgent = hud.timer != null && hud.timer <= 5;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0B0B0D] text-white">
      {/* ---------------- MINIMAL CINEMATIC INTRO ---------------- */}
      {phase === "intro" && (
        <div className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden animate-fade">
          <img
            src={meta.img}
            alt={meta.title}
            className="absolute inset-0 h-full w-full object-cover opacity-55 animate-ken-burns"
            style={{ objectPosition: meta.imgPos ?? "center 30%" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #0B0B0D 0%, rgba(11,11,13,0.82) 38%, rgba(11,11,13,0.28) 72%, rgba(11,11,13,0.6) 100%)",
            }}
          />

          {/* Top minimal bar */}
          <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
            <Link
              href="/#games"
              onClick={() => audio.click()}
              className="inline-flex items-center gap-2 text-xs font-medium text-white/75 transition-colors hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Games
            </Link>
            <button
              onClick={() => {
                audio.unlock();
                audio.click();
                setVolOpen(true);
              }}
              aria-label="Sound settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#151519]/75 text-white/80 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
            >
              {save.settings.muted ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>

          {/* Bottom title block */}
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-14 sm:px-10 sm:pb-20 animate-fade-up">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#999999]">
              {meta.duration}
              {save.best[id].score > 0
                ? ` · Best ${save.best[id].score.toLocaleString()}`
                : ""}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
              {meta.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {meta.premise}
            </p>
            <p className="mt-2 max-w-xl text-xs text-[#999999] sm:text-sm">
              {meta.controlHint}
            </p>

            <div className="mt-8">
              <button
                onClick={start}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#E9FF57] px-9 py-4 text-sm font-semibold text-[#0B0B0D] transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
              >
                <svg width="12" height="12" viewBox="0 0 12 14" fill="currentColor">
                  <path d="M1 1.2L11 7L1 12.8V1.2Z" />
                </svg>
                Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- FULL-SCREEN GAMEPLAY (92% STAGE) ---------------- */}
      {phase === "play" && (
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
          {/* Minimal 56px HUD: Objective · Timer · Score · Pause */}
          <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0B0B0D]/90 px-4 backdrop-blur-md sm:px-6">
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-[#999999] sm:text-sm">
              {hud.objective}
            </p>

            <div className="flex shrink-0 items-center gap-5 sm:gap-7">
              {hud.timer != null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="hidden text-[10px] uppercase tracking-[0.14em] text-[#999999] sm:inline">
                    Time
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums transition-colors ${
                      timerUrgent ? "text-[#E9FF57]" : "text-white"
                    }`}
                  >
                    {formatTimer(hud.timer)}
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-1.5">
                <span className="hidden text-[10px] uppercase tracking-[0.14em] text-[#999999] sm:inline">
                  Score
                </span>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {hud.score.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => {
                  audio.click();
                  setConfirmExit(false);
                  setPaused(true);
                }}
                aria-label="Pause"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#151519] text-white/80 transition-colors hover:border-white/20 hover:text-white active:scale-95"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="1.5" width="2.6" height="9" rx="0.8" />
                  <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" />
                </svg>
              </button>
            </div>
          </header>

          {toast && <SubtitleToast msg={toast.msg} sub={toast.sub} />}

          {/* Gameplay stage occupies remaining ~92% of viewport */}
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {children({
              paused,
              onFinish,
              onEgg,
              toast: showToast,
              setHud,
            })}
          </main>
        </div>
      )}

      {/* ---------------- RESULTS ---------------- */}
      {phase === "result" && result && (
        <ResultScreen
          meta={meta}
          result={result}
          onReplay={() => {
            audio.click();
            setResult(null);
            setToast(null);
            setPhase("play");
            setPaused(false);
            window.dispatchEvent(new CustomEvent("ene-restart"));
          }}
        />
      )}

      {/* ---------------- MINIMAL PAUSE OVERLAY ---------------- */}
      {paused && phase === "play" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0D]/82 p-6 backdrop-blur-xl animate-fade">
          <div className="surface w-full max-w-xs rounded-3xl p-7 text-center shadow-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#999999]">{meta.title}</p>
            <h3 className="mt-1.5 font-display text-2xl font-semibold text-white">Paused</h3>

            {!confirmExit ? (
              <div className="mt-7 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    audio.click();
                    setPaused(false);
                  }}
                  className="w-full rounded-full bg-[#E9FF57] py-3 text-sm font-semibold text-[#0B0B0D] transition-all hover:brightness-95 active:scale-[0.98]"
                >
                  Resume
                </button>
                <button
                  onClick={() => {
                    audio.click();
                    setPaused(false);
                    setToast(null);
                    window.dispatchEvent(new CustomEvent("ene-restart"));
                  }}
                  className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  Restart
                </button>
                <button
                  onClick={() => {
                    audio.click();
                    setVolOpen(true);
                  }}
                  className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  Sound
                </button>
                <button
                  onClick={() => {
                    audio.click();
                    setConfirmExit(true);
                  }}
                  className="mt-1 w-full rounded-full py-2.5 text-xs font-medium text-[#999999] transition-colors hover:text-white"
                >
                  Exit to Games
                </button>
              </div>
            ) : (
              <div className="mt-6 animate-fade">
                <p className="text-sm text-[#999999]">Leave this session? Current run progress won&apos;t be saved.</p>
                <div className="mt-6 flex gap-2.5">
                  <button
                    onClick={() => {
                      audio.click();
                      setConfirmExit(false);
                    }}
                    className="flex-1 rounded-full border border-white/[0.08] py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    Stay
                  </button>
                  <Link
                    href="/#games"
                    onClick={() => audio.click()}
                    className="flex-1 rounded-full bg-white py-2.5 text-center text-xs font-semibold text-[#0B0B0D] transition-opacity hover:opacity-90"
                  >
                    Exit
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <VolumePanel
        open={volOpen}
        onClose={() => {
          audio.click();
          setVolOpen(false);
        }}
      />
    </div>
  );
}

export function SafeGame({
  id,
  mood,
  children,
}: {
  id: GameId;
  mood?: "hero" | "chaos" | "calm" | "boss";
  children: (shell: GameShellApi) => ReactNode;
}) {
  return (
    <GameCrash>
      <GameShell id={id} mood={mood}>
        {children}
      </GameShell>
    </GameCrash>
  );
}
