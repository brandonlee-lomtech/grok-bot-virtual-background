/**
 * Tints B&W Grok Bot stickers by filling non-white SVG classes with a brand color.
 * White badge/backing classes (`fill: #fff`) are left unchanged.
 */
export function applyCharacterFill(svgText: string, characterHex: string): string {
  const hex = normalizeHex(characterHex);

  const whiteClasses = new Set<string>();
  for (const match of svgText.matchAll(/\.cls-(\d+)\s*\{([^}]*)\}/g)) {
    if (/fill:\s*#fff(fff)?\b/i.test(match[2])) {
      whiteClasses.add(`cls-${match[1]}`);
    }
  }

  const usedClasses = new Set<string>();
  for (const match of svgText.matchAll(/\bclass="([^"]+)"/g)) {
    for (const className of match[1].trim().split(/\s+/)) {
      if (className.startsWith("cls-")) usedClasses.add(className);
    }
  }

  const tintTargets = [...usedClasses].filter((name) => !whiteClasses.has(name));
  if (tintTargets.length === 0) return svgText;

  const rules = tintTargets
    .map((name) => `      .${name} { fill: ${hex}; }`)
    .join("\n");

  if (svgText.includes("</style>")) {
    return svgText.replace("</style>", `${rules}\n    </style>`);
  }

  return svgText.replace(
    /<svg\b([^>]*)>/,
    `<svg$1><defs><style>${rules}</style></defs>`,
  );
}

const tintedUrlCache = new Map<string, Promise<string>>();

export async function tintedStickerUrl(
  stickerSrc: string,
  characterHex: string,
): Promise<string> {
  const key = `${stickerSrc}::${normalizeHex(characterHex)}`;
  const cached = tintedUrlCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const response = await fetch(stickerSrc);
    if (!response.ok) {
      throw new Error(`Failed to load sticker: ${stickerSrc}`);
    }
    const svgText = await response.text();
    const tinted = applyCharacterFill(svgText, characterHex);
    const blob = new Blob([tinted], { type: "image/svg+xml" });
    return URL.createObjectURL(blob);
  })();

  tintedUrlCache.set(key, promise);
  return promise;
}

function normalizeHex(hex: string): string {
  const cleaned = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(cleaned)) {
    const [, a, b, c] = cleaned;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return cleaned;
}
