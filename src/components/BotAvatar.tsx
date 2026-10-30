"use client";

import { useMemo } from "react";
import type { ExpressionId } from "@/lib/bloub/expressions";
import type { ShapeId } from "@/lib/bloub/skins";
import { botSvgObjectUrl } from "@/lib/bot-svg";

type BotAvatarProps = {
  shapeId: ShapeId;
  feelingId: ExpressionId;
  characterHex: string;
  alt?: string;
  className?: string;
};

export function BotAvatar({
  shapeId,
  feelingId,
  characterHex,
  alt = "",
  className,
}: BotAvatarProps) {
  const url = useMemo(
    () =>
      botSvgObjectUrl({
        shapeId,
        expressionId: feelingId,
        characterHex,
      }),
    [shapeId, feelingId, characterHex],
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={className} />
  );
}
