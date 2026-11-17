/* ------------------------------------------------------------------ */
/* Editorial Meme Scorecard Generator — 1080 x 1350 (4:5 portrait).    */
/* Uses #0B0B0D, #151519, #FFFFFF, #999999, #A855F7, #E9FF57.          */
/* ------------------------------------------------------------------ */

export interface MemeOpts {
  gameImage?: string;
  gameLabel: string;
  title: string;
  score: number;
  scoreLabel?: string;
  pct: number;
  name?: string;
  tagline: string;
  extra?: string[];
}

const imgCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  const existing = imgCache.get(src);
  if (existing) return existing;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    if (typeof Image === "undefined") return resolve(null);
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
  imgCache.set(src, p);
  return p;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function makeMemeCard(o: MemeOpts): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const W = 1080;
  const H = 1350;
  const PAD = 84;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;

  // Base deep black canvas
  ctx.fillStyle = "#0B0B0D";
  ctx.fillRect(0, 0, W, H);

  // Top cinematic still (upper 52% bleeding smoothly into #0B0B0D)
  const artSrc = o.gameImage || "/images/meme-bg.jpg";
  const bg = (await loadImage(artSrc)) ?? (await loadImage("/images/meme-bg.jpg"));
  const imgH = 720;
  if (bg) {
    const scale = Math.max(W / bg.width, imgH / bg.height);
    const dw = bg.width * scale;
    const dh = bg.height * scale;
    const dx = (W - dw) / 2;
    const dy = (imgH - dh) * 0.3;
    ctx.save();
    ctx.globalAlpha = 0.78;
    ctx.drawImage(bg, dx, dy, dw, dh);
    ctx.restore();
  }

  // Smooth cinematic vignette into #0B0B0D
  const topFade = ctx.createLinearGradient(0, 0, 0, 220);
  topFade.addColorStop(0, "rgba(11,11,13,0.75)");
  topFade.addColorStop(1, "rgba(11,11,13,0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, W, 220);

  const botFade = ctx.createLinearGradient(0, 260, 0, imgH + 40);
  botFade.addColorStop(0, "rgba(11,11,13,0)");
  botFade.addColorStop(0.62, "rgba(11,11,13,0.82)");
  botFade.addColorStop(1, "#0B0B0D");
  ctx.fillStyle = botFade;
  ctx.fillRect(0, 260, W, imgH);

  // Subtle ambient purple glow near bottom corner
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.82, 20, W * 0.85, H * 0.82, 420);
  glow.addColorStop(0, "rgba(168,85,247,0.12)");
  glow.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle hairline outer frame
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Header row: ENE wordmark left, Game title right
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 34px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
  ctx.fillText("ENE", PAD, 118);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 22px 'Inter', system-ui, sans-serif";
  ctx.fillText(o.gameLabel.toUpperCase(), W - PAD, 116);

  // Editorial result block
  ctx.textAlign = "left";

  // Small eyebrow accent line + label
  ctx.fillStyle = "#A855F7";
  ctx.fillRect(PAD, 610, 44, 4);
  ctx.fillStyle = "#999999";
  ctx.font = "600 21px 'Inter', system-ui, sans-serif";
  ctx.fillText("OFFICIAL VERDICT", PAD + 62, 619);

  // Big crisp result title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 72px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
  const titleLines = wrapText(ctx, o.title.toUpperCase(), W - PAD * 2).slice(0, 2);
  let y = 710;
  for (const ln of titleLines) {
    ctx.fillText(ln, PAD, y);
    y += 82;
  }

  // Score highlight
  const scoreY = y + 92;
  ctx.fillStyle = "#E9FF57";
  ctx.font = "800 128px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
  const scoreStr = o.score.toLocaleString();
  ctx.fillText(scoreStr, PAD, scoreY);

  const scoreWidth = ctx.measureText(scoreStr).width;
  ctx.fillStyle = "#999999";
  ctx.font = "500 24px 'Inter', system-ui, sans-serif";
  ctx.fillText((o.scoreLabel ?? "PTS").toUpperCase(), PAD + scoreWidth + 22, scoreY - 12);

  // Hairline divider
  const divY = scoreY + 54;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(PAD, divY, W - PAD * 2, 2);

  // One original Telgish joke
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "400 32px 'Inter', system-ui, sans-serif";
  const quoteText = `"${o.tagline.replace(/^"|"$/g, "")}"`;
  const quoteLines = wrapText(ctx, quoteText, W - PAD * 2).slice(0, 3);
  let qy = divY + 62;
  for (const ln of quoteLines) {
    ctx.fillText(ln, PAD, qy);
    qy += 46;
  }

  // Footer
  ctx.fillStyle = "#999999";
  ctx.font = "500 22px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  const who = o.name?.trim() ? o.name.trim() : "ENE Comedy Gameverse";
  ctx.fillText(who, PAD, H - 86);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 20px 'Inter', system-ui, sans-serif";
  ctx.fillText("MINIMAL LOOK. MAXIMUM MADNESS.", W - PAD, H - 86);

  return cv.toDataURL("image/jpeg", 0.88);
}
