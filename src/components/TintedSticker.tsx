"use client";

import { useEffect, useState } from "react";
import { tintedStickerUrl } from "@/lib/tint-sticker";

type TintedStickerProps = {
  src: string;
  characterHex: string;
  alt?: string;
  className?: string;
};

export function TintedSticker({
  src,
  characterHex,
  alt = "",
  className,
}: TintedStickerProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void tintedStickerUrl(src, characterHex).then((next) => {
      if (!cancelled) setUrl(next);
    });
    return () => {
      cancelled = true;
    };
  }, [src, characterHex]);

  if (!url) {
    return <span className={className} aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={className} />
  );
}
