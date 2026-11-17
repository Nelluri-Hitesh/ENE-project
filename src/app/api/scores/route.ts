import { db } from "@/db";
import { scores } from "@/db/schema";

export const dynamic = "force-dynamic";

const GAMES = ["directors", "buddies", "runner", "pelli", "final"];

/* Naive in-memory throttle: max 6 submissions / minute / player name.
   Production: IP-based rate limit + server-side score validation. */
const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      game?: unknown;
      score?: unknown;
      player?: unknown;
    } | null;
    const game = String(body?.game ?? "");
    const score = Math.round(Number(body?.score));
    const player = String(body?.player ?? "Anon Meme")
      .replace(/[<>&"']/g, "")
      .trim()
      .slice(0, 24);
    if (!GAMES.includes(game) || !Number.isFinite(score) || score < 0 || score > 200000 || !player) {
      return Response.json({ ok: false, error: "invalid submission" }, { status: 400 });
    }
    const now = Date.now();
    const arr = (recent.get(player) ?? []).filter((t) => now - t < 60000);
    if (arr.length >= 6) {
      return Response.json({ ok: false, error: "slow down, meme" }, { status: 429 });
    }
    arr.push(now);
    recent.set(player, arr);
    await db.insert(scores).values({ game, score, player });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
}
