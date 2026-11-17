"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, SafeGame, useRestartKey, type GameResult, type HudState } from "@/core/ui";
import { audio } from "@/core/audio";
import { joke } from "@/core/comedy";
import { loadSave } from "@/core/save";

/* ------------------------------------------------------------------ */
/* THE FINAL BLOCKBUSTER — 5-Act Cinematic Finale + The Producer Boss  */
/* ------------------------------------------------------------------ */
interface ActCtx {
  paused: boolean;
  baseScore: number;
  setHud: (h: HudState) => void;
  toast: (m: string, s?: string) => void;
}

/* ---------------- Act 1: Recover Studio Gear ---------------- */
const SPOTS = [
  "Camera Case",
  "Lighting Truck",
  "Prop Crate A",
  "Prop Crate B",
  "Wardrobe Van",
  "Craft Table",
  "Producer's Sedan",
  "Terrace Rig",
  "Script Binder",
  "Cable Reel",
  "Sound Cart",
  "Monitor Tent",
];

function GearHunt({
  paused,
  baseScore,
  setHud,
  onDone,
}: ActCtx & { onDone: (score: number) => void }) {
  const needed = useRef<number[]>([]);
  if (needed.current.length === 0) {
    needed.current = [...Array(SPOTS.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
  }
  const [found, setFound] = useState<Set<number>>(new Set());
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [time, setTime] = useState(45);
  const over = useRef(false);

  useEffect(() => {
    setHud({
      objective: `Act 1/5 · Recover gear (${found.size} of 8)`,
      score: baseScore + found.size * 35,
      timer: time,
    });
  }, [found.size, baseScore, time, setHud]);

  useEffect(() => {
    if (paused || over.current) return;
    const t = window.setInterval(() => {
      setTime((v) => Math.max(0, Number((v - 0.1).toFixed(2))));
    }, 100);
    return () => window.clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (time <= 0 && !over.current) {
      over.current = true;
      audio.bad();
      onDone(found.size * 35);
    }
  }, [time, found.size, onDone]);

  const tap = (i: number) => {
    if (over.current || paused || opened.has(i)) return;
    setOpened((prev) => new Set(prev).add(i));
    if (needed.current.includes(i)) {
      const nf = new Set(found).add(i);
      setFound(nf);
      audio.good();
      if (nf.size >= 8) {
        over.current = true;
        window.setTimeout(() => onDone(300), 650);
      }
    } else {
      audio.tap();
      setTime((v) => Math.max(0, v - 4));
    }
  };

  return (
    <div className="w-full max-w-2xl animate-fade">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {SPOTS.map((s, i) => {
          const isFound = found.has(i);
          const isOpen = opened.has(i);
          return (
            <button
              key={s}
              onClick={() => tap(i)}
              disabled={isOpen}
              className={`rounded-2xl border px-4 py-5 text-left text-xs font-medium transition-all duration-200 sm:text-sm ${
                isFound
                  ? "border-[#E9FF57]/55 bg-[#E9FF57]/[0.08] text-[#E9FF57]"
                  : isOpen
                    ? "border-white/[0.04] bg-[#151519]/35 text-[#999999]/40"
                    : "border-white/[0.08] bg-[#151519]/88 text-white hover:border-white/[0.22] hover:bg-[#1C1C22] active:scale-[0.98]"
              }`}
            >
              {isFound ? "Secured" : isOpen ? "Empty" : s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Act 2: Gaffer Lighting Sequence ---------------- */
const LIGHTS = [
  { name: "Key Light", key: "1" },
  { name: "Fill Light", key: "2" },
  { name: "Back Light", key: "3" },
  { name: "Rim Light", key: "4" },
];

function LightsPuzzle({
  paused,
  baseScore,
  setHud,
  toast,
  onDone,
}: ActCtx & { onDone: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [inp, setInp] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [watching, setWatching] = useState(true);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const over = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  useEffect(() => {
    setHud({
      objective: watching
        ? `Act 2/5 · Watch lighting cue (${round + 1}/3)`
        : `Act 2/5 · Repeat lighting cue (${inp}/${seq.length})`,
      score: baseScore + score,
      timer: null,
    });
  }, [watching, round, inp, seq.length, baseScore, score, setHud]);

  const playSequence = useCallback((s: number[]) => {
    setInp(0);
    setWatching(true);
    s.forEach((v, idx) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(v);
          audio.tap();
          timers.current.push(window.setTimeout(() => setLit(null), 360));
        }, 600 + idx * 580)
      );
    });
    timers.current.push(
      window.setTimeout(() => setWatching(false), 600 + (s.length - 1) * 580 + 480)
    );
  }, []);

  const startRound = useCallback(
    (r: number) => {
      const len = r + 3;
      const s = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
      setSeq(s);
      playSequence(s);
    },
    [playSequence]
  );

  useEffect(() => {
    startRound(0);
  }, [startRound]);

  const press = useCallback(
    (i: number) => {
      if (watching || over.current || paused) return;
      setLit(i);
      timers.current.push(window.setTimeout(() => setLit(null), 200));

      if (i === seq[inp]) {
        audio.tap();
        const ni = inp + 1;
        setInp(ni);
        if (ni >= seq.length) {
          const ns = score + 100;
          setScore(ns);
          setWatching(true);
          audio.good();
          if (round + 1 >= 3) {
            over.current = true;
            timers.current.push(window.setTimeout(() => onDone(ns), 700));
            return;
          }
          const nr = round + 1;
          setRound(nr);
          timers.current.push(window.setTimeout(() => startRound(nr), 650));
        }
      } else {
        audio.bad();
        const nm = mistakes + 1;
        setMistakes(nm);
        if (nm >= 3) {
          over.current = true;
          toast("Breaker tripped — moving on with backup lights.");
          timers.current.push(window.setTimeout(() => onDone(score), 750));
        } else {
          setWatching(true);
          timers.current.push(window.setTimeout(() => playSequence(seq), 750));
        }
      }
    },
    [watching, paused, seq, inp, score, round, mistakes, onDone, startRound, playSequence, toast]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = LIGHTS.findIndex((l) => l.key === e.key);
      if (i >= 0) {
        e.preventDefault();
        press(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 animate-fade">
      <p className="text-xs uppercase tracking-[0.18em] text-[#999999]">
        {watching ? "Observe Sequence" : "Repeat Sequence"} · Retries {3 - mistakes}
      </p>

      <div className="grid w-full grid-cols-2 gap-3">
        {LIGHTS.map((l, i) => {
          const active = lit === i;
          return (
            <button
              key={l.name}
              onClick={() => press(i)}
              disabled={watching || paused}
              className={`flex h-28 flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-150 sm:h-32 ${
                active
                  ? "border-[#E9FF57] bg-[#E9FF57] text-[#0B0B0D]"
                  : "border-white/[0.08] bg-[#151519]/90 text-white hover:border-white/[0.2]"
              }`}
            >
              <span
                className={`text-[11px] tabular-nums ${
                  active ? "text-[#0B0B0D]/70" : "text-[#999999]"
                }`}
              >
                0{l.key}
              </span>
              <span className="font-display text-base font-semibold">{l.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {seq.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-5 rounded-full transition-colors ${
              i < inp ? "bg-[#E9FF57]" : "bg-white/[0.12]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Act 3: Rooftop Sprint ---------------- */
function RoofDash({
  paused,
  baseScore,
  setHud,
  onDone,
}: ActCtx & { onDone: (score: number) => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const jumpRef = useRef<() => void>(() => {});
  const slideRef = useRef<(o: boolean) => void>(() => {});
  const sRef = useRef({
    d: 0,
    y: 0,
    vy: 0,
    duck: false,
    duckT: 0,
    hits: 0,
    obs: [] as { x: number; t: "low" | "high" }[],
    next: 460,
    over: false,
  });
  const GOAL = 500;

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const S = sRef.current;
    const Wc = 960;
    const Hc = 280;
    const GROUND = 216;
    const PX = 145;

    const jump = () => {
      if (S.over || paused) return;
      if (S.y === 0) {
        S.duck = false;
        S.duckT = 0;
        S.vy = -460;
        audio.jump();
      }
    };
    const slide = (o: boolean) => {
      if (S.over || paused) return;
      if (o) {
        S.duck = true;
        S.duckT = 0.65;
        audio.slideSfx();
      } else {
        S.duck = false;
        S.duckT = 0;
      }
    };
    jumpRef.current = jump;
    slideRef.current = slide;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        jump();
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        slide(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") slide(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.04, (t - last) / 1000);
      last = t;

      if (!paused && !S.over) {
        const sp = 290;
        S.d += sp * dt * 0.58;
        if (S.duckT > 0) {
          S.duckT = Math.max(0, S.duckT - dt);
          if (S.duckT === 0) S.duck = false;
        }
        if (S.y < 0 || S.vy < 0) {
          S.vy += 1450 * dt;
          S.y += S.vy * dt;
          if (S.y >= 0) {
            S.y = 0;
            S.vy = 0;
          }
        }
        S.next -= sp * dt;
        if (S.next <= 0) {
          S.obs.push({ x: Wc + 50, t: Math.random() < 0.52 ? "low" : "high" });
          S.next = 390 + Math.random() * 320;
        }
        for (const o of S.obs) {
          o.x -= sp * dt;
          if (Math.abs(o.x - PX) < 26) {
            const safe = (o.t === "low" && S.y < -32) || (o.t === "high" && S.duck);
            if (!safe) {
              o.x = -999;
              S.hits += 1;
              S.d = Math.max(0, S.d - 32);
              audio.hit();
            }
          }
        }
        S.obs = S.obs.filter((o) => o.x > -70);

        setHud({
          objective: `Act 3/5 · Race rooftops to the set (${Math.min(GOAL, Math.floor(S.d))} / ${GOAL}m)`,
          score: baseScore,
          timer: null,
        });

        if (S.d >= GOAL) {
          S.over = true;
          audio.good();
          const earned = Math.max(120, 300 - S.hits * 30);
          window.setTimeout(() => onDone(earned), 650);
          return;
        }
      }

      // Draw minimal rooftop silhouette
      ctx.fillStyle = "#0F0F13";
      ctx.fillRect(0, 0, Wc, Hc);

      const off = (S.d * 0.3) % 200;
      ctx.fillStyle = "#16161C";
      for (let x = -200; x < Wc + 200; x += 200) {
        const bh = 55 + (((x * 31) % 65) + 65) % 65;
        ctx.fillRect(x - off, GROUND - bh, 118, bh);
      }

      ctx.fillStyle = "#121216";
      ctx.fillRect(0, GROUND, Wc, Hc - GROUND);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(0, GROUND, Wc, 1.5);

      for (const o of S.obs) {
        if (o.t === "low") {
          ctx.fillStyle = "#1C1C22";
          ctx.strokeStyle = "rgba(255,255,255,0.38)";
          ctx.lineWidth = 1.5;
          ctx.fillRect(o.x - 18, GROUND - 38, 36, 38);
          ctx.strokeRect(o.x - 18, GROUND - 38, 36, 38);
        } else {
          ctx.fillStyle = "#1C1C22";
          ctx.strokeStyle = "rgba(168,85,247,0.7)";
          ctx.lineWidth = 1.5;
          ctx.fillRect(o.x - 32, GROUND - 96, 64, 52);
          ctx.strokeRect(o.x - 32, GROUND - 96, 64, 52);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "600 10px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("CABLE", o.x, GROUND - 66);
        }
      }

      // Runner
      const py = GROUND + S.y;
      ctx.save();
      ctx.translate(PX, py);
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      if (S.duck) {
        ctx.fillRect(-16, -24, 34, 13);
        ctx.beginPath();
        ctx.arc(-10, -30, 7.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const leg = S.y === 0 ? Math.sin(S.d * 0.1) * 11 : 6;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(leg, -3);
        ctx.moveTo(0, -30);
        ctx.lineTo(-leg, -3);
        ctx.stroke();
        ctx.fillRect(-8, -60, 16, 32);
        ctx.beginPath();
        ctx.arc(1, -72, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, Hc - 3, Wc, 3);
      ctx.fillStyle = "#E9FF57";
      ctx.fillRect(0, Hc - 3, Wc * Math.min(1, S.d / GOAL), 3);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [paused, baseScore, setHud, onDone]);

  return (
    <div className="w-full max-w-4xl animate-fade">
      <canvas
        ref={cvRef}
        width={960}
        height={280}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if ((e.clientY - r.top) / r.height < 0.55) jumpRef.current();
          else slideRef.current(true);
        }}
        onPointerUp={() => slideRef.current(false)}
        onPointerLeave={() => slideRef.current(false)}
        onPointerCancel={() => slideRef.current(false)}
        className="no-touch w-full rounded-2xl border border-white/[0.08] bg-[#0F0F13]"
      />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          onPointerDown={() => jumpRef.current()}
          className="no-touch rounded-2xl border border-white/[0.08] bg-[#151519] py-3.5 text-xs font-medium text-white transition-colors hover:border-white/20 active:bg-white/[0.08]"
        >
          Jump
        </button>
        <button
          onPointerDown={() => slideRef.current(true)}
          onPointerUp={() => slideRef.current(false)}
          onPointerLeave={() => slideRef.current(false)}
          onPointerCancel={() => slideRef.current(false)}
          className="no-touch rounded-2xl border border-white/[0.08] bg-[#151519] py-3.5 text-xs font-medium text-white transition-colors hover:border-white/20 active:bg-white/[0.08]"
        >
          Hold to Duck
        </button>
      </div>
    </div>
  );
}

/* ---------------- Act 4: Settle Crew Argument ---------------- */
const ARGUE = [
  {
    who: "Goutham",
    q: "The camera was rolling while I was eating biryani — I'm in the background of the climax!",
    options: [
      { t: "Call it cinema verite — realism critics pay extra for.", s: 100, f: 6 },
      { t: "We'll crop the corner tightly in the color suite.", s: 65, f: 0 },
      { t: "Blame Raju for calling action without clearing the frame.", s: 25, f: -14 },
    ],
  },
  {
    who: "Chintu",
    q: "I overslept three call sheets. Just credit me as Executive Nap Consultant.",
    options: [
      { t: "Approved — right after you carry this tripod to mark one.", s: 100, f: 6 },
      { t: "You still get full crew credit. Grab the reflector.", s: 65, f: 0 },
      { t: "Wake up or we cut your cameo completely.", s: 20, f: -16 },
    ],
  },
  {
    who: "Raju",
    q: "My final monologue deserves twice as many lines. Heroes speak last.",
    options: [
      { t: "One silent close-up hits harder than ten speeches — trust the lens.", s: 100, f: 6 },
      { t: "You own the closing frame of the entire movie.", s: 65, f: 0 },
      { t: "Keep arguing and the stray dog gets top billing.", s: 30, f: -12 },
    ],
  },
];

function Argument({
  paused,
  baseScore,
  setHud,
  onDone,
}: ActCtx & { onDone: (score: number, friendship: number) => void }) {
  const [i, setI] = useState(0);
  const [time, setTime] = useState(12);
  const [f, setF] = useState(100);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const over = useRef(false);

  useEffect(() => {
    setHud({
      objective: `Act 4/5 · Keep the crew united (${f}% morale)`,
      score: baseScore + score,
      timer: picked !== null ? null : time,
    });
  }, [f, baseScore, score, time, picked, setHud]);

  const advance = useCallback(
    (s: number, fd: number) => {
      const ns = score + s;
      const nf = Math.max(0, Math.min(100, f + fd));
      setScore(ns);
      setF(nf);
      if (i + 1 >= ARGUE.length) {
        over.current = true;
        window.setTimeout(() => onDone(Math.min(300, ns), nf), 600);
        return;
      }
      setI((x) => x + 1);
      setTime(12);
      setPicked(null);
    },
    [score, f, i, onDone]
  );

  useEffect(() => {
    if (paused || over.current || picked !== null) return;
    const t = window.setInterval(() => {
      setTime((v) => Math.max(0, Number((v - 0.1).toFixed(2))));
    }, 100);
    return () => window.clearInterval(t);
  }, [paused, picked, i]);

  useEffect(() => {
    if (time <= 0 && picked === null && !over.current && !paused) {
      setPicked(-1);
      audio.bad();
      window.setTimeout(() => advance(0, -12), 750);
    }
  }, [time, picked, paused, advance]);

  const pick = (oi: number) => {
    if (picked !== null || over.current || paused) return;
    const o = ARGUE[i].options[oi];
    setPicked(oi);
    if (o.s >= 90) audio.good();
    else audio.tap();
    window.setTimeout(() => advance(o.s, o.f), 750);
  };

  const cur = ARGUE[i];
  return (
    <div key={i} className="w-full max-w-2xl animate-fade">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#999999]">
        {cur.who} · Conflict 0{i + 1} / 0{ARGUE.length}
      </p>
      <h3 className="mt-3 font-display text-2xl font-semibold leading-[1.25] tracking-[-0.025em] text-white sm:text-3xl">
        &ldquo;{cur.q}&rdquo;
      </h3>
      <div className="mt-8 flex flex-col gap-2.5">
        {cur.options.map((o, oi) => (
          <button
            key={o.t}
            disabled={picked !== null}
            onClick={() => pick(oi)}
            className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all duration-200 ${
              picked === oi
                ? "border-[#E9FF57]/60 bg-[#E9FF57]/[0.08] text-white"
                : "border-white/[0.08] bg-[#151519]/90 text-white hover:border-white/[0.22] hover:bg-[#1C1C22] active:scale-[0.99]"
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Act 5: Final Boss — THE PRODUCER ---------------- */
const DEMANDS: { d: string; opts: [string, number][] }[] = [
  {
    d: "Budget ledhu, deadline undhi — give me twelve fresh title options before tea.",
    opts: [
      ["All twelve are already shortlisted on the whiteboard, sir.", 14],
      ["Which genre are we calling this today, sir?", 0],
      ["The title stays exactly as written.", -14],
    ],
  },
  {
    d: "I want a grand palace entrance. Zero extra rupees. Figure it out.",
    opts: [
      ["Silhouette framing at golden hour — looks ten crores for free.", 14],
      ["We can negotiate with the location manager.", 0],
      ["Palaces aren't free, sir.", -14],
    ],
  },
  {
    d: "Make it feel like IMAX 3D on a short-film budget.",
    opts: [
      ["Deep foreground staging and crisp sound design, sir — locked.", 14],
      ["We'll push the contrast in grading.", 0],
      ["That breaks three laws of accounting.", -14],
    ],
  },
  {
    d: "The villain must cry, the hero must laugh, and the audience must do both.",
    opts: [
      ["Bittersweet climax cut — comedy on the surface, heart underneath.", 14],
      ["The audience is already emotional enough, sir.", 0],
      ["Pick one emotion per scene, please.", -14],
    ],
  },
  {
    d: "Cut the final scene, then put it back, only make it feel completely new.",
    opts: [
      ["Trimmed six frames off the opening beat — plays twice as sharp.", 14],
      ["Re-exporting the exact same timeline now, sir.", 0],
      ["You approved this cut twenty minutes ago.", -14],
    ],
  },
  {
    d: "Final condition: premiere screening starts tonight. Is the film ready?",
    opts: [
      ["Final reel rendered, crew in the front row — roll projector.", 16],
      ["Uploading at ninety-nine percent as we speak.", 2],
      ["Ask me again next Friday.", -16],
    ],
  },
];

function Producer({
  paused,
  baseScore,
  setHud,
  onDone,
  onEgg,
}: ActCtx & { onDone: (score: number, budget: number) => void; onEgg: () => void }) {
  const [i, setI] = useState(0);
  const [time, setTime] = useState(65);
  const [budget, setBudget] = useState(55);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [mash, setMash] = useState(false);
  const [mashCt, setMashCt] = useState(0);

  const micTaps = useRef(0);
  const mashTimer = useRef<number | null>(null);
  const over = useRef(false);

  useEffect(() => {
    return () => {
      if (mashTimer.current) clearTimeout(mashTimer.current);
    };
  }, []);

  useEffect(() => {
    setHud({
      objective: `Final Act · Survive The Producer (Budget ${budget}%)`,
      score: baseScore + score,
      timer: time,
    });
  }, [budget, baseScore, score, time, setHud]);

  useEffect(() => {
    if (paused || over.current || picked !== null || mash) return;
    const t = window.setInterval(() => {
      setTime((v) => Math.max(0, Number((v - 0.1).toFixed(2))));
    }, 100);
    return () => window.clearInterval(t);
  }, [paused, picked, mash, i]);

  useEffect(() => {
    if (time <= 0 && !over.current) {
      over.current = true;
      audio.bad();
      onDone(score, budget);
    }
  }, [time, score, budget, onDone]);

  const finishOrNext = useCallback(
    (nextIdx: number, nextScore: number, nextBudget: number) => {
      if (over.current) return;
      if (nextIdx >= DEMANDS.length) {
        over.current = true;
        window.setTimeout(() => onDone(Math.min(300, nextScore), nextBudget), 600);
        return;
      }
      setI(nextIdx);
      setPicked(null);
    },
    [onDone]
  );

  const triggerMash = useCallback(
    (nextIdx: number, curScore: number, curBudget: number) => {
      setMash(true);
      setMashCt(0);
      audio.whoosh();
      if (mashTimer.current) clearTimeout(mashTimer.current);
      mashTimer.current = window.setTimeout(() => {
        mashTimer.current = null;
        setMash(false);
        const nb = Math.max(0, curBudget - 10);
        setBudget(nb);
        audio.bad();
        finishOrNext(nextIdx, curScore, nb);
      }, 3600);
    },
    [finishOrNext]
  );

  const doMash = useCallback(() => {
    if (!mash || paused) return;
    audio.tap();
    setMashCt((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        if (mashTimer.current) {
          clearTimeout(mashTimer.current);
          mashTimer.current = null;
        }
        window.setTimeout(() => {
          setMash(false);
          audio.good();
          setBudget((b) => {
            const nb = Math.min(100, b + 10);
            finishOrNext(3, score, nb);
            return nb;
          });
        }, 0);
      }
      return next;
    });
  }, [mash, paused, score, finishOrNext]);

  useEffect(() => {
    if (!mash || paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        doMash();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mash, paused, doMash]);

  const pick = (oi: number) => {
    if (picked !== null || mash || over.current || paused) return;
    const [, delta] = DEMANDS[i].opts[oi];
    const nb = Math.max(0, Math.min(100, budget + delta));
    const gain = delta > 0 ? 50 : delta === 0 ? 22 : 0;
    const ns = score + gain;

    setPicked(oi);
    setBudget(nb);
    setScore(ns);
    if (delta > 0) audio.good();
    else if (delta === 0) audio.tap();
    else audio.bad();

    window.setTimeout(() => {
      if (i === 2) {
        setPicked(null);
        triggerMash(3, ns, nb);
      } else {
        finishOrNext(i + 1, ns, nb);
      }
    }, 700);
  };

  const tapBadge = () => {
    audio.tap();
    micTaps.current += 1;
    if (micTaps.current === 5) {
      onEgg();
    }
  };

  if (mash) {
    return (
      <div className="flex w-full max-w-md flex-col items-center text-center animate-fade">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#A855F7]">Final Slate Check</p>
        <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-white">
          Lock the Clapperboard
        </h3>
        <button
          onPointerDown={doMash}
          className="no-touch mt-8 rounded-full bg-[#E9FF57] px-12 py-4 text-sm font-semibold text-[#0B0B0D] transition-transform active:scale-95"
        >
          Action ({Math.max(0, 5 - mashCt)})
        </button>
        <div className="mt-5 flex gap-2">
          {[0, 1, 2, 3, 4].map((k) => (
            <span
              key={k}
              className={`h-1.5 w-6 rounded-full ${
                k < mashCt ? "bg-[#E9FF57]" : "bg-white/[0.12]"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const d = DEMANDS[i];
  return (
    <div key={i} className="w-full max-w-2xl animate-fade">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={tapBadge}
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-90"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#A855F7]/50 bg-[#A855F7]/10 text-xs font-semibold text-white">
            TP
          </span>
          <div>
            <p className="text-sm font-semibold text-white">The Producer</p>
            <p className="text-xs text-[#999999]">
              Demand 0{i + 1} / 0{DEMANDS.length}
            </p>
          </div>
        </button>

        <div className="w-28">
          <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.14em] text-[#999999]">
            <span>Budget</span>
            <span className="tabular-nums text-white">{budget}%</span>
          </div>
          <Bar
            value={budget}
            max={100}
            color={budget >= 40 ? "#E9FF57" : "rgba(168,85,247,0.85)"}
          />
        </div>
      </div>

      <h3 className="mt-7 font-display text-2xl font-semibold leading-[1.25] tracking-[-0.025em] text-white sm:text-3xl">
        &ldquo;{d.d}&rdquo;
      </h3>

      <div className="mt-8 flex flex-col gap-2.5">
        {d.opts.map(([label], oi) => (
          <button
            key={label}
            disabled={picked !== null}
            onClick={() => pick(oi)}
            className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all duration-200 ${
              picked === oi
                ? "border-[#E9FF57]/60 bg-[#E9FF57]/[0.08] text-white"
                : "border-white/[0.08] bg-[#151519]/90 text-white hover:border-white/[0.22] hover:bg-[#1C1C22] active:scale-[0.99]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Finale Coordinator ---------------- */
const PARTS = [
  { t: "Missing Equipment", d: "Recover eight essential studio pieces before call time." },
  { t: "Gaffer's Sequence", d: "Memorize and replay three studio lighting cues." },
  { t: "Rooftop Sprint", d: "Carry the hard drive 500 meters across city rooftops." },
  { t: "Green Room Truce", d: "Settle three last-minute arguments without splitting the crew." },
  { t: "The Producer", d: "Survive six live rewrites and finish with at least 40% budget." },
];

function FinalInner({
  paused,
  onFinish,
  onEgg,
  toast,
  setHud,
}: {
  paused: boolean;
  onFinish: (r: GameResult) => void;
  onEgg: () => void;
  toast: (m: string, s?: string) => void;
  setHud: (h: HudState) => void;
}) {
  const [part, setPart] = useState(0);
  const [inter, setInter] = useState(false);
  const [scores, setScores] = useState([0, 0, 0, 0, 0]);
  const [friendship, setFriendship] = useState(100);
  const [budget, setBudget] = useState(55);
  const eggFound = useRef(false);
  const prevEggs = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const s = loadSave();
    prevEggs.current = [
      s.hidden.directors,
      s.hidden.buddies,
      s.hidden.runner,
      s.hidden.pelli,
    ].filter(Boolean).length;
  }, []);

  const totalScore = scores.reduce((a, b) => a + b, 0);

  const trackEgg = useCallback(() => {
    if (!eggFound.current) {
      eggFound.current = true;
      onEgg();
    }
  }, [onEgg]);

  useEffect(() => {
    if (!inter) return;
    setHud({
      objective: `Act ${part + 1}/5 complete · Ready for ${PARTS[part + 1]?.t ?? "Finale"}`,
      score: totalScore,
      timer: null,
    });
  }, [inter, part, totalScore, setHud]);

  const finish = useCallback(
    (total: number, f: number, b: number) => {
      if (doneRef.current) return;
      doneRef.current = true;
      const won = b >= 40 && total >= 750;
      let endingId: string;
      let resultTitle: string;

      if (won && prevEggs.current >= 4) {
        endingId = "secret";
        resultTitle = "SECRET POST-CREDITS LEGEND";
      } else if (!won) {
        endingId = "disaster";
        resultTitle = "UNEXPECTED DISASTER CUT";
      } else if (b >= 70 && f >= 75) {
        endingId = "legendary";
        resultTitle = "LEGENDARY BLOCKBUSTER";
      } else {
        endingId = "friendship";
        resultTitle = "FRIENDSHIP WINS THE PREMIERE";
      }

      onFinish({
        score: total,
        won,
        completed: won,
        hidden: eggFound.current,
        endingId,
        resultTitle,
        stats: [
          ["Acts", "5/5"],
          ["Budget", `${b}%`],
          ["Crew Morale", `${f}%`],
          ["Ending", resultTitle],
        ],
        winJoke: joke(won ? "f_win" : "f_lose"),
      });
    },
    [onFinish]
  );

  const handleAct = useCallback(
    (idx: number, actScore: number, extra?: { f?: number; budget?: number }) => {
      const ns = [...scores];
      ns[idx] = Math.min(300, actScore);
      setScores(ns);
      const nf = extra?.f !== undefined ? extra.f : friendship;
      const nb = extra?.budget !== undefined ? extra.budget : budget;
      setFriendship(nf);
      setBudget(nb);

      if (idx === 4) {
        const sum = Math.min(1500, ns.reduce((a, b) => a + b, 0));
        window.setTimeout(() => finish(sum, nf, nb), 450);
      } else {
        setInter(true);
      }
    },
    [scores, friendship, budget, finish]
  );

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-[#0B0B0D]">
      <img
        src="/images/g5.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_28%] opacity-20"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(11,11,13,0.55) 0%, rgba(11,11,13,0.95) 85%)",
        }}
      />

      {/* Minimal 5-act hairline progress */}
      <div className="relative z-10 flex w-full gap-1 px-4 pt-3 sm:px-6">
        {PARTS.map((p, i) => (
          <div
            key={p.t}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
              i < part
                ? "bg-white/70"
                : i === part
                  ? "bg-[#E9FF57]"
                  : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>

      {/* Main Stage */}
      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-6 sm:px-8">
        {inter ? (
          <div className="flex max-w-md flex-col items-center text-center animate-fade">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#999999]">
              {part === 3 ? "Final Showdown" : `Up Next · Act 0${part + 2}`}
            </p>
            <h2 className="mt-2.5 font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
              {PARTS[part + 1].t}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#999999] sm:text-base">
              {PARTS[part + 1].d}
            </p>
            <button
              onClick={() => {
                audio.click();
                setPart((p) => p + 1);
                setInter(false);
              }}
              className="mt-8 rounded-full bg-[#E9FF57] px-9 py-3.5 text-sm font-semibold text-[#0B0B0D] transition-all hover:brightness-95 active:scale-[0.98]"
            >
              {part === 3 ? "Face The Producer" : "Continue"}
            </button>
          </div>
        ) : (
          <>
            {part === 0 && (
              <GearHunt
                paused={paused}
                baseScore={totalScore}
                setHud={setHud}
                toast={toast}
                onDone={(s) => handleAct(0, s)}
              />
            )}
            {part === 1 && (
              <LightsPuzzle
                paused={paused}
                baseScore={totalScore}
                setHud={setHud}
                toast={toast}
                onDone={(s) => handleAct(1, s)}
              />
            )}
            {part === 2 && (
              <RoofDash
                paused={paused}
                baseScore={totalScore}
                setHud={setHud}
                toast={toast}
                onDone={(s) => handleAct(2, s)}
              />
            )}
            {part === 3 && (
              <Argument
                paused={paused}
                baseScore={totalScore}
                setHud={setHud}
                toast={toast}
                onDone={(s, f) => handleAct(3, s, { f })}
              />
            )}
            {part === 4 && (
              <Producer
                paused={paused}
                baseScore={totalScore}
                setHud={setHud}
                toast={toast}
                onDone={(s, b) => handleAct(4, s, { budget: b })}
                onEgg={trackEgg}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Final() {
  const key = useRestartKey();
  return (
    <SafeGame id="final" mood="boss">
      {({ paused, onFinish, onEgg, toast, setHud }) => (
        <FinalInner
          key={key}
          paused={paused}
          onFinish={onFinish}
          onEgg={onEgg}
          toast={toast}
          setHud={setHud}
        />
      )}
    </SafeGame>
  );
}
