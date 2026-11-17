"use client";
import dynamic from "next/dynamic";
import type { GameId } from "@/core/save";

function LoadingStage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B0B0D]">
      <span className="text-xs uppercase tracking-[0.22em] text-[#999999]">Loading</span>
    </div>
  );
}

const Directors = dynamic(() => import("@/games/directors"), {
  ssr: false,
  loading: LoadingStage,
});
const Buddies = dynamic(() => import("@/games/buddies"), {
  ssr: false,
  loading: LoadingStage,
});
const Runner = dynamic(() => import("@/games/runner"), {
  ssr: false,
  loading: LoadingStage,
});
const Pelli = dynamic(() => import("@/games/pelli"), {
  ssr: false,
  loading: LoadingStage,
});
const Final = dynamic(() => import("@/games/final"), {
  ssr: false,
  loading: LoadingStage,
});

export function GameRouter({ slug }: { slug: string }) {
  switch (slug as GameId) {
    case "directors":
      return <Directors />;
    case "buddies":
      return <Buddies />;
    case "runner":
      return <Runner />;
    case "pelli":
      return <Pelli />;
    case "final":
      return <Final />;
    default:
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B0B0D] text-white">
          <p className="text-sm text-[#999999]">Scene not found.</p>
        </div>
      );
  }
}
