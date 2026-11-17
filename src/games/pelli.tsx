"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, SafeGame, useRestartKey, type GameResult, type HudState } from "@/core/ui";
import { audio } from "@/core/audio";
import { joke } from "@/core/comedy";

/* ---------------- Dialogue Scenarios (22 rounds) ---------------- */
type Who = "uncle" | "aunty" | "thatha" | "nani" | "cousin" | "friend";
type RKind = "safe" | "meme" | "risky" | "secret";

interface Choice {
  t: string;
  s: number;
  p: number;
  r: RKind;
  line: string;
}
interface Scenario {
  who: Who;
  q: string;
  choices: Choice[];
  secret?: Choice;
}

const S = (t: string, s: number, p: number, r: RKind, line: string): Choice => ({
  t,
  s,
  p,
  r,
  line,
});

const SCENARIOS: Scenario[] = [
  {
    who: "uncle",
    q: "Salary entha? Don't be shy — this is family.",
    choices: [
      S("Uncle, first coffee ivvandi, interview start cheddham!", 45, -2, "meme", "Coffee arrived before the follow-up question could."),
      S("Enough to survive, not enough to sponsor this function.", 20, -18, "risky", "The living room went five degrees colder."),
      S("Comfortable, uncle. Try the chutney while it's warm.", 12, 0, "safe", "Topic deflected cleanly. Thirty seconds bought."),
    ],
    secret: S("Confidential, uncle — same tax slab as your secret fixed deposit.", 60, 5, "secret", "Uncle smiled, sipped his coffee, and changed the subject himself."),
  },
  {
    who: "aunty",
    q: "Future plan enti? Tell us clearly — everyone is listening.",
    choices: [
      S("Future ni adigi cheppali aunty, it keeps changing its number.", 48, -2, "meme", "Aunty quietly wrote 'philosophical' in her mental ledger."),
      S("Retire early and stop attending surprise quizzes.", 15, -14, "risky", "Four follow-up questions just queued up."),
      S("Work hard, save steadily, keep everyone happy.", 14, 2, "safe", "Polite nod across the sofa. Safe ground held."),
    ],
  },
  {
    who: "cousin",
    q: "Bro, aunty just asked who sang off-key at the 2019 sangeet.",
    choices: [
      S("That footage is legally classified fiction.", 42, -2, "meme", "Your cousin nearly believed the disclaimer."),
      S("It was a tribute performance. Ahead of its time.", 38, -4, "meme", "Nobody could argue with that level of confidence."),
      S("Bad microphone, great intentions.", 12, 0, "safe", "The sound system takes the blame gracefully."),
    ],
  },
  {
    who: "uncle",
    q: "My colleague's son already bought a flat and an SUV. And you?",
    choices: [
      S("I invested in inner peace, uncle — zero EMI, high mileage.", 50, -2, "meme", "Uncle paused to calculate the ROI on inner peace."),
      S("Happy for him, uncle. Every timeline moves at its own pace.", 15, 0, "safe", "Calm, diplomatic, untouchable."),
      S("My surprise is still buffering on slow Wi-Fi.", 26, -6, "risky", "Aunty raised an eyebrow at the word 'buffering'."),
    ],
  },
  {
    who: "nani",
    q: "Pelli eppudu chesthavu? I have three horoscopes in my handbag.",
    choices: [
      S("Nani, good love is like router signal — waiting for full bars.", 52, -2, "meme", "Nani started wondering which room gets the strongest signal."),
      S("Waiting for wedding hall prices to announce a festive discount.", 30, -10, "risky", "Bold economics, fragile timing."),
      S("Soon, Nani — the moment the right story lines up.", 18, 2, "safe", "Warm smile earned."),
    ],
    secret: S("First let me match your filter coffee standard, Nani — then marriage.", 65, 8, "secret", "Nani beamed. You are temporarily immune to criticism."),
  },
  {
    who: "aunty",
    q: "Your phone stays on silent for two hours every evening. Who is calling?",
    choices: [
      S("My phone and I observe quiet hours for battery longevity.", 46, -2, "meme", "Technical jargon worked like a charm."),
      S("Future me calling with project updates.", 40, -4, "meme", "Mysterious enough to pause the investigation."),
      S("Late evening work calls, aunty.", 12, 0, "safe", "Accepted without cross-examination."),
    ],
  },
  {
    who: "thatha",
    q: "Twelve people in this family became doctors. Why did you pick something else?",
    choices: [
      S("Thatha, with twelve doctors in the house, someone had to play patient.", 48, -2, "meme", "Thatha chuckled behind his newspaper."),
      S("I prescribe laughter — zero side effects, zero clinic rent.", 24, -12, "risky", "Thatha checked over his glasses in mild disbelief."),
      S("Wanted to add one new chapter to the family shelf, Thatha.", 16, 2, "safe", "Quiet nod of respect from the armchair."),
    ],
  },
  {
    who: "aunty",
    q: "Rent entha in that neighborhood? Your landlord is my cousin's friend.",
    choices: [
      S("Then please request a family discount on my behalf, aunty!", 48, -2, "meme", "Uno reverse executed cleanly."),
      S("Confidential — my wallet gets emotional hearing the number.", 34, -6, "risky", "Half laugh, half lecture brewing."),
      S("Standard market rate for the area, aunty.", 14, 0, "safe", "Neutral answer closes the ledger."),
    ],
  },
  {
    who: "cousin",
    q: "The neighbor saw you dancing on the terrace with headphones on.",
    choices: [
      S("Cultural rehearsal — representing our colony at spirit level.", 55, -2, "meme", "Instant crowd favorite across the room."),
      S("Practicing early for your wedding entrance. You're welcome.", 40, -4, "meme", "Spotlight redirected straight onto your cousin."),
      S("Cardio routine recommended by the internet.", 16, 0, "safe", "Health excuse passes inspection."),
    ],
    secret: S("Next rehearsal is right here after tea — Thatha gets front row.", 70, 6, "secret", "The entire living room burst out laughing."),
  },
  {
    who: "nani",
    q: "You look thinner than last month. Are you skipping meals?",
    choices: [
      S("Streamlined edition, Nani — saving storage space for your cooking.", 46, -2, "meme", "Two extra dosas immediately approved."),
      S("Aerodynamic build for catching morning metro trains.", 30, -6, "risky", "Nani remains unconvinced by physics."),
      S("Eating on time every day, promise.", 12, 0, "safe", "Gentle pat on the shoulder."),
    ],
  },
  {
    who: "aunty",
    q: "No big birthday party this year? Nobody saw a single status update.",
    choices: [
      S("Exclusive private screening — attendance was telepathic.", 50, -2, "meme", "Aunty couldn't decide whether to laugh or take notes."),
      S("Celebrated quietly with cake and eight hours of sleep.", 32, -8, "risky", "Honest, though slightly suspicious to the committee."),
      S("Saved the celebration for when the whole family met today.", 18, 2, "safe", "Flawless diplomacy."),
    ],
  },
  {
    who: "uncle",
    q: "Where do you see yourself in five years? Give me a serious roadmap.",
    choices: [
      S("On this exact sofa, uncle, answering the ten-year version.", 50, -2, "meme", "Even uncle couldn't hold a straight face."),
      S("Still reading terms and conditions before clicking agree.", 30, -8, "risky", "Bold detour from corporate language."),
      S("Leading a strong team and building something lasting.", 15, 2, "safe", "Approved with a firm nod."),
    ],
  },
  {
    who: "friend",
    q: "Your best friend accidentally blurts out: 'Remember our short-film trip?'",
    choices: [
      S("Award-nominated educational documentary. Still in post-production.", 52, -2, "meme", "Your friend exhaled in pure relief."),
      S("Research project on urban friendship dynamics.", 40, -4, "meme", "Sounds academic enough to halt questions."),
      S("More samosas for my friend here, his blood sugar is low.", 14, 0, "safe", "Crisis contained with snacks."),
    ],
  },
  {
    who: "thatha",
    q: "My friend's granddaughter is in Hyderabad too. Very disciplined. Shall we talk?",
    choices: [
      S("If she's that disciplined, Thatha, verify she can handle our family group first.", 50, -2, "meme", "Fair point conceded by the entire room."),
      S("Give me a little time to settle my work first, Thatha.", 18, 2, "safe", "Respectful and measured."),
      S("Send my LinkedIn first — let's keep the screening professional.", 26, -8, "risky", "Thatha squinted at the word 'LinkedIn'."),
    ],
    secret: S("You host the dinner and pick the menu, Thatha — I'll bring my best behavior.", 68, 6, "secret", "Thatha is already planning the menu with pride."),
  },
  {
    who: "aunty",
    q: "You say 'all good' to every question. Tell us one real complaint.",
    choices: [
      S("Only one complaint, aunty — this coffee cup is too small.", 55, -2, "meme", "Refill granted with a proud smile."),
      S("Monday mornings arrive way too close to Sunday nights.", 32, -4, "meme", "Universal agreement across generations."),
      S("Can't complain when everyone's healthy and together.", 16, 2, "safe", "Golden grandchild points awarded."),
    ],
  },
  {
    who: "uncle",
    q: "Promotion eppudu? Have you spoken to your manager firmly?",
    choices: [
      S("Job nannu promote chesaka first sweet meekey uncle!", 50, -2, "meme", "Sweet box promise locked the room on your side."),
      S("Current role is the teaser — main picture releases next quarter.", 30, -8, "risky", "Cinema metaphor tested uncle's patience slightly."),
      S("Appraisal cycle is right around the corner, uncle.", 14, 1, "safe", "Clean corporate parry."),
    ],
  },
  {
    who: "cousin",
    q: "Everyone wants you to sing two lines right now. No excuses.",
    choices: [
      S("First two notes are free; full song requires studio acoustics.", 52, -2, "meme", "Laughter saved you from singing the chorus."),
      S("Live vocals are resting on doctor's advice.", 36, -6, "risky", "Transparent excuse, solid delivery."),
      S("Hum a quick classic line and pass the mic to cousin.", 18, 1, "safe", "Graceful handoff."),
    ],
  },
  {
    who: "nani",
    q: "You are the pride of this house — don't stay single forever!",
    choices: [
      S("Classic editions take longer in quality control, Nani.", 54, -2, "meme", "Nani laughed and approved the tagline."),
      S("Waiting for someone who laughs at uncle's jokes too.", 32, -6, "risky", "Uncle looked sideways, then grinned."),
      S("Your blessing is working on schedule, Nani.", 20, 2, "safe", "Peace meter glows warmly."),
    ],
    secret: S("Whoever joins this house has to win your approval first anyway, Nani.", 70, 8, "secret", "Standing ovation energy from the sofa."),
  },
  {
    who: "thatha",
    q: "Be honest — do you attend family gatherings mainly for the biryani?",
    choices: [
      S("Fifty percent blessings, fifty percent biryani — balanced portfolio, Thatha.", 52, -2, "meme", "Honest math wins the room."),
      S("I come for the people; the biryani just happens to sit nearby.", 34, -4, "meme", "Smooth courtroom defense."),
      S("Always for family first, Thatha. Food is the bonus.", 16, 2, "safe", "Impeccable manners."),
    ],
  },
  {
    who: "aunty",
    q: "Why do you wake up at ten on Sundays? Morning air builds character.",
    choices: [
      S("I let the early birds finish the traffic first, aunty — civic duty.", 52, -2, "meme", "Public service framing caught everyone off guard."),
      S("Dreaming in 4K takes extra rendering time on weekends.", 30, -8, "risky", "Cousin laughed; aunty shook her head."),
      S("Catching up after a long work week — starting earlier next Sunday.", 14, 1, "safe", "Classic promise accepted."),
    ],
  },
  {
    who: "uncle",
    q: "Where are you investing — mutual funds, gold, or land?",
    choices: [
      S("Diversified across SIPs, savings, and avoiding friends who ask for 500.", 55, -2, "meme", "Your friend coughed loudly in the corner."),
      S("The 'sleep peacefully at night' index fund, uncle.", 34, -6, "risky", "Uncle briefly wondered which bank offers that."),
      S("Steady long-term mutual funds and fixed savings, sir.", 18, 2, "safe", "Textbook answer."),
    ],
  },
  {
    who: "friend",
    q: "Final round — everyone's standing at the doorway for one parting line.",
    choices: [
      S("Same living room, same coffee, upgraded answers next season — bye everyone!", 58, 0, "meme", "Clean cinematic exit with smiles all around."),
      S("Please forward the minutes of this meeting on WhatsApp.", 32, -10, "risky", "Risky final joke, narrow escape."),
      S("Touch elders' feet, thank everyone for dinner, and glide out.", 22, 4, "safe", "Flawless traditional finale."),
    ],
    secret: S("Review five stars for the coffee, five stars for the roasting — see you all soon!", 75, 10, "secret", "Legendary farewell. Even uncle clapped at the gate."),
  },
];

const SPEAKERS: Record<Who, { name: string; role: string; initials: string }> = {
  uncle: { name: "Uncle Ravi", role: "Chief Interrogator", initials: "UR" },
  aunty: { name: "Aunty Lakshmi", role: "Neighborhood Intelligence", initials: "AL" },
  thatha: { name: "Thatha Ganapathi", role: "Family Patriarch", initials: "TG" },
  nani: { name: "Nani Vasundhara", role: "Matchmaking Chair", initials: "NV" },
  cousin: { name: "Cousin Chirag", role: "Chaos Witness", initials: "CC" },
  friend: { name: "Best Friend", role: "Nervous Bystander", initials: "BF" },
};

const SCENE_TIME = 14;
type Mood = "neutral" | "amused" | "pleased" | "unimpressed";

function PelliInner({
  paused,
  onFinish,
  onEgg,
  setHud,
}: {
  paused: boolean;
  onFinish: (r: GameResult) => void;
  onEgg: () => void;
  setHud: (h: HudState) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [time, setTime] = useState(SCENE_TIME);
  const [score, setScore] = useState(0);
  const [peace, setPeace] = useState(100);
  const [memeCt, setMemeCt] = useState(0);
  const [secretCt, setSecretCt] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mood, setMood] = useState<Mood>("neutral");
  const [reactInfo, setReactInfo] = useState<{ line: string; delta: number } | null>(null);
  const [locked, setLocked] = useState(false);

  const doneRef = useRef(false);
  const sc = SCENARIOS[idx];
  const speaker = SPEAKERS[sc.who];
  const showSecret = streak >= 3 && !!sc.secret;

  // Minimal HUD sync
  useEffect(() => {
    setHud({
      objective: `Question ${idx + 1}/${SCENARIOS.length} · Family peace ${peace}%`,
      score,
      timer: locked ? null : time,
    });
  }, [idx, peace, score, time, locked, setHud]);

  const apply = useCallback(
    (c: Choice | null, isTimeout: boolean) => {
      if (locked || doneRef.current) return;
      setLocked(true);

      let s: number;
      let p: number;
      let line: string;
      let m: Mood;

      if (isTimeout || !c) {
        s = 5;
        p = -8;
        line = "Silence filled the room. Everyone drew their own conclusion.";
        m = "unimpressed";
        audio.bad();
      } else {
        s = c.s;
        p = c.p;
        line = c.line;
        if (c.r === "meme" || c.r === "secret") {
          m = "amused";
          audio.laugh();
        } else if (c.r === "risky") {
          m = "unimpressed";
          audio.bad();
        } else {
          m = "pleased";
          audio.good();
        }
      }

      const newScore = score + s;
      const newPeace = Math.max(0, Math.min(100, peace + p));
      const newMemeCt = memeCt + (s >= 40 ? 1 : 0);
      const newSecretCt = secretCt + (c?.r === "secret" ? 1 : 0);

      if (c?.r === "secret" && secretCt === 0) {
        onEgg();
      }

      setMood(m);
      setReactInfo({ line, delta: s });
      setScore(newScore);
      setPeace(newPeace);
      setMemeCt(newMemeCt);
      setSecretCt(newSecretCt);
      setStreak(s >= 40 ? streak + 1 : 0);

      window.setTimeout(() => {
        if (newPeace <= 0) {
          if (!doneRef.current) {
            doneRef.current = true;
            onFinish({
              score: newScore,
              won: false,
              completed: false,
              hidden: newSecretCt > 0,
              peace: 0,
              stats: [
                ["Questions", `${idx + 1}/${SCENARIOS.length}`],
                ["Witty Replies", String(newMemeCt)],
                ["Secret Lines", String(newSecretCt)],
                ["Outcome", "Escorted to the Gate"],
              ],
              endingId: "slipper",
              winJoke: joke("p_lose"),
            });
          }
          return;
        }

        if (idx + 1 >= SCENARIOS.length) {
          if (!doneRef.current) {
            doneRef.current = true;
            const win = newScore >= 500;
            const ending =
              newScore >= 900 && newPeace >= 60
                ? "Living Room Legend"
                : win
                  ? "Meeting Survived"
                  : "Lecture Scheduled";
            onFinish({
              score: newScore,
              won: win,
              completed: win,
              hidden: newSecretCt > 0,
              peace: newPeace,
              stats: [
                ["Questions", `${SCENARIOS.length}/${SCENARIOS.length}`],
                ["Witty Replies", String(newMemeCt)],
                ["Peace Left", `${newPeace}%`],
                ["Outcome", ending],
              ],
              endingId: newScore >= 900 && newPeace >= 60 ? "legendary" : win ? "survived" : "grounded",
              winJoke: joke(win ? "p_win" : "p_lose"),
            });
          }
        } else {
          setLocked(false);
          setReactInfo(null);
          setMood("neutral");
          setIdx(idx + 1);
          setTime(SCENE_TIME);
        }
      }, 1750);
    },
    [locked, score, peace, memeCt, secretCt, streak, idx, onFinish, onEgg]
  );

  // Timer tick
  useEffect(() => {
    if (paused || locked) return;
    const t = window.setInterval(() => {
      setTime((v) => Math.max(0, Number((v - 0.1).toFixed(2))));
    }, 100);
    return () => window.clearInterval(t);
  }, [paused, locked, idx]);

  useEffect(() => {
    if (time <= 0 && !locked && !paused) apply(null, true);
  }, [time, locked, paused, apply]);

  // Keyboard 1-4 shortcuts
  useEffect(() => {
    if (paused || locked) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key) - 1;
      if (n >= 0 && n < sc.choices.length) {
        e.preventDefault();
        apply(sc.choices[n], false);
      } else if (n === 3 && showSecret && sc.secret) {
        e.preventDefault();
        apply(sc.secret, false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, locked, sc, showSecret, apply]);

  const moodText =
    mood === "amused"
      ? "Laughing"
      : mood === "pleased"
        ? "Approving"
        : mood === "unimpressed"
          ? "Skeptical"
          : streak >= 3
            ? `Streak ×${streak}`
            : speaker.role;

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-[#0B0B0D]">
      {/* Subtle warm Indian living room still */}
      <img
        src="/images/g4.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-22"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(11,11,13,0.55) 0%, rgba(11,11,13,0.95) 85%)",
        }}
      />

      {/* Top hairline timer */}
      <Bar
        value={locked ? SCENE_TIME : time}
        max={SCENE_TIME}
        color={time <= 4 && !locked ? "#E9FF57" : "rgba(255,255,255,0.4)"}
        className="relative z-10 rounded-none bg-white/[0.05]"
      />

      {/* Center Dialogue Stage */}
      <div className="relative z-20 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-6 sm:px-8">
        <div key={idx} className="w-full animate-fade">
          {/* Minimal Speaker Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold tracking-wider transition-colors duration-300 ${
                  mood === "amused"
                    ? "border-[#E9FF57]/60 bg-[#E9FF57]/10 text-[#E9FF57]"
                    : mood === "unimpressed"
                      ? "border-[#A855F7]/60 bg-[#A855F7]/10 text-white"
                      : "border-white/[0.12] bg-[#151519] text-white"
                }`}
              >
                {speaker.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{speaker.name}</p>
                <p className="text-xs text-[#999999]">{moodText}</p>
              </div>
            </div>

            {/* Subtle family peace indicator */}
            <div className="w-24">
              <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.14em] text-[#999999]">
                <span>Peace</span>
                <span className="tabular-nums text-white/80">{peace}%</span>
              </div>
              <Bar
                value={peace}
                max={100}
                color={peace <= 30 ? "#E9FF57" : "rgba(255,255,255,0.65)"}
              />
            </div>
          </div>

          {/* Question */}
          <h2 className="mt-7 font-display text-2xl font-semibold leading-[1.25] tracking-[-0.025em] text-white sm:text-3xl">
            &ldquo;{sc.q}&rdquo;
          </h2>

          {/* Choices or Editorial Reaction */}
          {reactInfo ? (
            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#151519]/90 p-6 backdrop-blur-md animate-fade">
              <p className="text-sm leading-relaxed text-white/90 sm:text-base">{reactInfo.line}</p>
              <p className="mt-3 text-xs font-medium tabular-nums text-[#E9FF57]">
                +{reactInfo.delta} pts
              </p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-2.5">
              {sc.choices.map((c, i) => (
                <button
                  key={c.t}
                  disabled={locked}
                  onClick={() => apply(c, false)}
                  className="group flex items-baseline gap-4 rounded-2xl border border-white/[0.08] bg-[#151519]/88 px-5 py-4 text-left backdrop-blur-md transition-all duration-200 hover:border-white/[0.22] hover:bg-[#1C1C22] active:scale-[0.99]"
                >
                  <span className="shrink-0 text-xs font-medium tabular-nums text-[#999999] transition-colors group-hover:text-[#E9FF57]">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium leading-relaxed text-white sm:text-[15px]">
                    {c.t}
                  </span>
                </button>
              ))}

              {showSecret && sc.secret && (
                <button
                  disabled={locked}
                  onClick={() => apply(sc.secret!, false)}
                  className="flex items-baseline gap-4 rounded-2xl border border-[#E9FF57]/35 bg-[#E9FF57]/[0.06] px-5 py-4 text-left backdrop-blur-md transition-all duration-200 hover:border-[#E9FF57]/60 hover:bg-[#E9FF57]/[0.1] active:scale-[0.99] animate-fade"
                >
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E9FF57]">
                    Secret
                  </span>
                  <span className="text-sm font-medium leading-relaxed text-white sm:text-[15px]">
                    {sc.secret.t}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Pelli() {
  const key = useRestartKey();
  return (
    <SafeGame id="pelli" mood="calm">
      {({ paused, onFinish, onEgg, setHud }) => (
        <PelliInner key={key} paused={paused} onFinish={onFinish} onEgg={onEgg} setHud={setHud} />
      )}
    </SafeGame>
  );
}
