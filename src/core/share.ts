/* ------------------------------------------------------------------ */
/* Sharing — Web Share API (with image file), WhatsApp fallback, copy. */
/* Never auto-sends anything. User always initiates and confirms.      */
/* ------------------------------------------------------------------ */

export function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  return new Promise((resolve) => {
    const [head, body] = dataUrl.split(",");
    const mime = head.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    resolve(new File([blob], name, { type: mime }));
  });
}

export type ShareMode = "native" | "copied" | "cancelled";

export async function shareNative(text: string, imgDataUrl?: string): Promise<ShareMode> {
  if (typeof navigator === "undefined" || !navigator.share) return "copied";
  try {
    if (imgDataUrl) {
      const file = await dataUrlToFile(imgDataUrl, "ene-scorecard.jpg");
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "ENE",
          text,
          files: [file],
        });
        return "native";
      }
    }
    await navigator.share({
      title: "ENE",
      text,
      url: location.href,
    });
    return "native";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    return "copied";
  }
}

export function whatsappLink(text: string): string {
  const url = typeof window !== "undefined" ? `\n${window.location.href}` : "";
  return `https://wa.me/?text=${encodeURIComponent(`${text}${url}`)}`;
}

export async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function buildShareText(opts: {
  game: string;
  title: string;
  score: number;
  max: number;
  name?: string;
  win: boolean;
}): string {
  const who = opts.name?.trim() ? `${opts.name.trim()} scored` : "I scored";
  return `${who} ${opts.score.toLocaleString()} in ${opts.game} — "${opts.title}". Beat this if you can.\n\nENE · Minimal look. Maximum madness.`;
}
