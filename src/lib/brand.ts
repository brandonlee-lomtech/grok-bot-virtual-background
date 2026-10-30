export const VIRTUAL_BACKGROUND_SIZE = {
  width: 1920,
  height: 1080,
} as const;

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const CORNERS: { id: Corner; label: string }[] = [
  { id: "top-left", label: "Top left" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-right", label: "Bottom right" },
];

export type BrandColor = {
  id: string;
  hex: string;
  label: string;
};

/** Background palette derived from Grok Bot sticker / guideline colors. */
export const BRAND_COLORS: BrandColor[] = [
  { id: "blue", hex: "#457bbe", label: "Blue" },
  { id: "teal", hex: "#18b9a4", label: "Teal" },
  { id: "green", hex: "#42b870", label: "Green" },
  { id: "amber", hex: "#f8981d", label: "Amber" },
  { id: "orange", hex: "#f26722", label: "Orange" },
  { id: "red", hex: "#ee3342", label: "Red" },
  { id: "pink", hex: "#ed3a95", label: "Pink" },
  { id: "purple", hex: "#7761aa", label: "Purple" },
  { id: "brown", hex: "#98693d", label: "Brown" },
  { id: "gray", hex: "#787878", label: "Gray" },
  { id: "near-black", hex: "#1f1f1f", label: "Near black" },
  { id: "white", hex: "#f5f5f5", label: "Light" },
];

/** Colors available for the Grok Bot character fill (same brand palette). */
export const CHARACTER_COLORS: BrandColor[] = BRAND_COLORS.filter(
  (c) => c.id !== "white",
);

export type Sticker = {
  id: string;
  src: string;
  label: string;
};

/** B&W masters — character fill is applied at runtime. */
export const STICKERS: Sticker[] = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `sticker-${n}`,
    src: `/stickers/bw/GrokBot_StickerSet_GrokBot-${n}.svg`,
    label: `Sticker ${n}`,
  };
});

export const DEFAULT_BACKGROUND_HEX = "#457bbe";
export const DEFAULT_CHARACTER_HEX = "#18b9a4";
export const DEFAULT_STICKER_ID = "sticker-01";
export const DEFAULT_CORNER: Corner = "top-left";

export const WORDMARK_TEXT = "Grok Bot";

export const DISPLAY_FONT_FAMILY = '"Universal Sans Grok", system-ui, sans-serif';

/** Normalize `#RGB` / `#RRGGBB` (with or without `#`) to lowercase `#rrggbb`. */
export function normalizeHex(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const [a, b, c] = cleaned.split("");
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return null;
}

/** Relative luminance 0–1; used to pick light vs dark ink. */
export function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex) ?? "#000000";
  const full = normalized.slice(1);
  const r = Number.parseInt(full.slice(0, 2), 16) / 255;
  const g = Number.parseInt(full.slice(2, 4), 16) / 255;
  const b = Number.parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function inkOnBackground(backgroundHex: string): {
  primary: string;
  secondary: string;
} {
  const light = relativeLuminance(backgroundHex) > 0.55;
  if (light) {
    return { primary: "#010101", secondary: "rgba(1, 1, 1, 0.72)" };
  }
  return { primary: "#ffffff", secondary: "rgba(255, 255, 255, 0.82)" };
}

export function getSticker(id: string): Sticker {
  return STICKERS.find((s) => s.id === id) ?? STICKERS[0];
}
