import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { scores } from "@/db/schema";

export const dynamic = "force-dynamic";

const GAMES = ["directors", "buddies", "runner", "pelli", "final"];
const BOT_NAMES = [
  "Masti Raja",
  "Sofa Carier",
  "Biryani Boy",
  "Auto King",
  "Slipper Survivor",
  "Coffee First",
  "Noodle Cameraman",
  "Group Mute",
  "Cousin Chiru",
  "Tiffin Thief",
  "Pickle Master",
  "Rooftop Ravi",
  "Deadline Durga",
  "EMI Warrior",
  "WiFi Priest",
  "Chutney Boss",
  "Clapperboard Kid",
  "Pigeon Dodger",
  "Budget Zero",
  "Tear Track Hero",
  "Meme Escapee",
  "Uncle Avenger",
  "Pizza Tower Pro",
  "3D Popcorn",
];

async function seedIfEmpty() {
  try {
    const rows = await db.select({ c: sql<number>`count(*)` }).from(scores);
    if ((rows[0]?.c ?? 0) >= BOT_NAMES.length) return;
    const values = BOT_NAMES.map((n) => ({
      game: GAMES[Math.floor(Math.random() * GAMES.length)],
      score: 300 + Math.floor(Math.random() * 8500),
      player: n,
      createdAt: new Date(Date.now() - Math.random() * 5 * 86400000),
    }));
    await db.insert(scores).values(values);
  } catch {
    /* DB not ready yet — leaderboard returns empty */
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const game = sp.get("game") ?? "all";
  const period = sp.get("period") ?? "all";
  try {
    await seedIfEmpty();
    const since =
      period === "day" ? Date.now() - 86400000 : period === "week" ? Date.now() - 7 * 86400000 : 0;
    const rows = await db
      .select()
      .from(scores)
      .orderBy(desc(scores.score), desc(scores.id))
      .limit(60);
    let out = rows;
    if (game !== "all" && GAMES.includes(game)) out = out.filter((r) => r.game === game);
    out = out.filter((r) => r.createdAt.getTime() >= since).slice(0, 15);
    return Response.json({
      game,
      period,
      scores: out,
      note: "Live community leaderboard — real PostgreSQL rows for this deployment. Seeded with demo players until the community grows.",
    });
  } catch {
    return Response.json({ game, period, scores: [], note: "Leaderboard warming up. Try again in a moment." });
  }
}
