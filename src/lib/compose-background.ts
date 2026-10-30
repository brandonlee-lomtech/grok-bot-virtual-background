import {
  DISPLAY_FONT_FAMILY,
  VIRTUAL_BACKGROUND_SIZE,
  WORDMARK_TEXT,
  inkOnBackground,
  type Corner,
} from "@/lib/brand";
import { tintedStickerUrl } from "@/lib/tint-sticker";

export type ComposeBackgroundInput = {
  backgroundHex: string;
  characterHex: string;
  stickerSrc: string;
  corner: Corner;
  /** Horizontally flip output for Zoom's mirrored self-view. */
  mirror?: boolean;
  /** Draw a face safe-zone guide (preview only; never include in downloads). */
  showSafeZone?: boolean;
};

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function ensureDisplayFontLoaded(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  try {
    await document.fonts.load(`600 48px ${DISPLAY_FONT_FAMILY}`);
  } catch {
    // Fall back to system fonts if the trial face fails to load.
  }
}

function mirrorCanvasHorizontally(
  source: HTMLCanvasElement,
): HTMLCanvasElement {
  const mirrored = document.createElement("canvas");
  mirrored.width = source.width;
  mirrored.height = source.height;
  const ctx = mirrored.getContext("2d");
  if (!ctx) return source;
  ctx.translate(mirrored.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  return mirrored;
}

function isLeft(corner: Corner): boolean {
  return corner === "top-left" || corner === "bottom-left";
}

function isTop(corner: Corner): boolean {
  return corner === "top-left" || corner === "top-right";
}

function drawSafeZone(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const insetX = w * 0.275;
  const insetY = h * 0.22;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 2;
  ctx.strokeRect(insetX, insetY, w - insetX * 2, h - insetY * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(insetX, insetY, w - insetX * 2, h - insetY * 2);
  ctx.restore();
}

/**
 * Composes a 1920×1080 virtual background. Branding sits in the chosen corner
 * so the center stays clear for the speaker's face.
 */
export async function composeVirtualBackground(
  input: ComposeBackgroundInput,
): Promise<HTMLCanvasElement> {
  await ensureDisplayFontLoaded();
  const tintedSrc = await tintedStickerUrl(input.stickerSrc, input.characterHex);
  const sticker = await loadImage(tintedSrc);

  const { width: w, height: h } = VIRTUAL_BACKGROUND_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.fillStyle = input.backgroundHex;
  ctx.fillRect(0, 0, w, h);

  if (input.showSafeZone) {
    drawSafeZone(ctx, w, h);
  }

  const marginX = Math.round(w * 0.065);
  const marginY = Math.round(h * 0.075);
  const iconSize = Math.round(h * 0.16);
  const gap = Math.round(h * 0.028);
  const ink = inkOnBackground(input.backgroundHex);
  const wordmarkSize = Math.round(h * 0.055);

  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${wordmarkSize}px ${DISPLAY_FONT_FAMILY}`;
  const wordmarkWidth = ctx.measureText(WORDMARK_TEXT).width;
  const textBlockHeight = wordmarkSize;

  const clusterWidth = iconSize + gap + wordmarkWidth;
  const clusterHeight = Math.max(iconSize, textBlockHeight);

  const clusterLeft = isLeft(input.corner)
    ? marginX
    : w - marginX - clusterWidth;
  const clusterTop = isTop(input.corner)
    ? marginY
    : h - marginY - clusterHeight;

  const iconX = isLeft(input.corner)
    ? clusterLeft
    : clusterLeft + wordmarkWidth + gap;
  const iconY = clusterTop + (clusterHeight - iconSize) / 2;

  ctx.drawImage(sticker, iconX, iconY, iconSize, iconSize);

  const textX = isLeft(input.corner)
    ? clusterLeft + iconSize + gap
    : clusterLeft;
  const textAlign: CanvasTextAlign = isLeft(input.corner) ? "left" : "right";
  const textAnchorX = isLeft(input.corner) ? textX : textX + wordmarkWidth;
  const textY = clusterTop + (clusterHeight + wordmarkSize * 0.35) / 2;

  ctx.textAlign = textAlign;
  ctx.fillStyle = ink.primary;
  ctx.font = `600 ${wordmarkSize}px ${DISPLAY_FONT_FAMILY}`;
  ctx.fillText(WORDMARK_TEXT, textAnchorX, textY);

  return input.mirror ? mirrorCanvasHorizontally(canvas) : canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode PNG"));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1,
    );
  });
}
