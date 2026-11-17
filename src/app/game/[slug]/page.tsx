import { notFound } from "next/navigation";
import { GameRouter } from "./router";
import { GAMES } from "@/core/games-meta";

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = GAMES.find((g) => g.id === slug);
  if (!meta) notFound();
  return <GameRouter slug={slug} />;
}
