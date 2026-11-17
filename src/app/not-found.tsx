import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0B0D] px-6 text-center text-white">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#999999]">404</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
        Left on the cutting-room floor.
      </h1>
      <Link
        href="/"
        className="mt-8 rounded-full bg-[#E9FF57] px-8 py-3.5 text-sm font-semibold text-[#0B0B0D] transition-all hover:brightness-95 active:scale-[0.98]"
      >
        Back to ENE
      </Link>
    </div>
  );
}
