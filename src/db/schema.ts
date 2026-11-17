import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Community score rows for the leaderboard.
 * This is a REAL leaderboard for this deployment (PostgreSQL-backed).
 * For global scale: add accounts, server-side score validation,
 * rate limiting and anti-cheat (see README).
 */
export const scores = pgTable(
  "scores",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    game: text().notNull(),
    score: integer().notNull().default(0),
    player: text().notNull().default("Anon Meme"),
    note: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scores_game_idx").on(t.game), index("scores_created_idx").on(t.createdAt)]
);
