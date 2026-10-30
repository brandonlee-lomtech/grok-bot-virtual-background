import { BotEngine, type BotFrame } from "@/lib/bloub/engine";
import {
  EXPRESSION_BY_ID,
  type ExpressionId,
} from "@/lib/bloub/expressions";
import { DEMI_VIEWBOX, RAYON } from "@/lib/bloub/repere";
import { SHAPES, SHAPE_BY_ID, type ShapeId } from "@/lib/bloub/skins";

/** Export crop margin used by bloub (profile-photo friendly). */
const EXPORT_MARGIN = 1.08;

const RAYON_MAX = Math.max(...SHAPES.map((s) => Math.max(...s.radii)));
/** Half-side of the still export viewBox (bloub `DEMI_CADRE`). */
export const BOT_SVG_HALF = Math.ceil(RAYON * RAYON_MAX * EXPORT_MARGIN);
export const BOT_SVG_SIZE = BOT_SVG_HALF * 2;

const PAPER = "#ffffff";

export type BuildBotSvgInput = {
  shapeId: ShapeId;
  expressionId: ExpressionId;
  characterHex: string;
  /** Pixel size written on the root SVG (helps canvas/Firefox rasterize). */
  size?: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function frameToSvg(
  frame: BotFrame,
  characterHex: string,
  size: number,
): string {
  const half = BOT_SVG_HALF;
  const vb = `${-half} ${-half} ${half * 2} ${half * 2}`;
  const ink = escapeXml(characterHex);
  const maskId = "bot-mask";

  const eyeHoles = frame.eyes
    .map(
      (eye) =>
        `<path d="${escapeXml(eye.d)}" transform="${escapeXml(eye.matrix)}" opacity="${eye.alpha}" fill="#000"/>`,
    )
    .join("");

  // Idle still frame: body + eye holes only (no arcs / particles).
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}" role="img">
  <defs>
    <mask id="${maskId}" maskUnits="userSpaceOnUse" x="${-DEMI_VIEWBOX}" y="${-DEMI_VIEWBOX}" width="${DEMI_VIEWBOX * 2}" height="${DEMI_VIEWBOX * 2}">
      <path d="${escapeXml(frame.bodyPath)}" fill="#fff"/>
      ${eyeHoles}
    </mask>
  </defs>
  <g opacity="${frame.bodyAlpha}">
    <path d="${escapeXml(frame.bodyPath)}" fill="${PAPER}"/>
    <g mask="url(#${maskId})">
      <rect x="${-half}" y="${-half}" width="${half * 2}" height="${half * 2}" fill="${ink}"/>
    </g>
  </g>
</svg>`;
}

/** Pure still SVG markup for shape × expression × fill color. */
export function buildBotSvgMarkup(input: BuildBotSvgInput): string {
  const shape = SHAPE_BY_ID.get(input.shapeId);
  const expression = EXPRESSION_BY_ID.get(input.expressionId);
  if (!shape || !expression) {
    throw new Error(
      `Unknown bot shape/expression: ${input.shapeId}/${input.expressionId}`,
    );
  }

  const engine = new BotEngine(RAYON, "idle", shape.radii, expression);
  // t=0 is before the first scheduled blink — eyes stay fully open.
  const frame = engine.sample(0);
  return frameToSvg(frame, input.characterHex, input.size ?? BOT_SVG_SIZE);
}

const urlCache = new Map<string, string>();

/** Cached blob URL for `<img>` / canvas `Image` loading. */
export function botSvgObjectUrl(input: BuildBotSvgInput): string {
  const size = input.size ?? BOT_SVG_SIZE;
  const key = `${input.shapeId}::${input.expressionId}::${input.characterHex.toLowerCase()}::${size}`;
  const cached = urlCache.get(key);
  if (cached) return cached;

  const markup = buildBotSvgMarkup({ ...input, size });
  const url = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml" }),
  );
  urlCache.set(key, url);
  return url;
}
