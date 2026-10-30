"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  BOT_FEELINGS,
  BOT_SHAPES,
  BRAND_COLORS,
  CHARACTER_COLORS,
  CORNERS,
  DEFAULT_BACKGROUND_HEX,
  DEFAULT_CHARACTER_HEX,
  DEFAULT_CORNER,
  DEFAULT_FEELING_ID,
  DEFAULT_SHAPE_ID,
  normalizeHex,
  type Corner,
} from "@/lib/brand";
import type { ExpressionId } from "@/lib/bloub/expressions";
import type { ShapeId } from "@/lib/bloub/skins";
import {
  canvasToBlob,
  composeVirtualBackground,
} from "@/lib/compose-background";
import {
  downloadBlob,
  virtualBackgroundFilename,
} from "@/lib/download";
import { BotAvatar } from "@/components/BotAvatar";

type DownloadVariant = "standard" | "mirror";

export function BackgroundStudio() {
  const [backgroundHex, setBackgroundHex] = useState(DEFAULT_BACKGROUND_HEX);
  const [characterHex, setCharacterHex] = useState(DEFAULT_CHARACTER_HEX);
  const [shapeId, setShapeId] = useState<ShapeId>(DEFAULT_SHAPE_ID);
  const [feelingId, setFeelingId] = useState<ExpressionId>(DEFAULT_FEELING_ID);
  const [corner, setCorner] = useState<Corner>(DEFAULT_CORNER);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<DownloadVariant | null>(null);
  const [, startTransition] = useTransition();
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      void (async () => {
        try {
          const canvas = await composeVirtualBackground({
            backgroundHex,
            characterHex,
            shapeId,
            feelingId,
            corner,
            showSafeZone: true,
          });
          if (cancelled) return;
          const blob = await canvasToBlob(canvas);
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = url;
          setPreviewUrl(url);
          setError(null);
        } catch (err) {
          if (cancelled) return;
          setError(
            err instanceof Error ? err.message : "Failed to render preview",
          );
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [backgroundHex, characterHex, shapeId, feelingId, corner]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function onDownload(variant: DownloadVariant) {
    setDownloading(variant);
    setError(null);
    try {
      const canvas = await composeVirtualBackground({
        backgroundHex,
        characterHex,
        shapeId,
        feelingId,
        corner,
        mirror: variant === "mirror",
        showSafeZone: false,
      });
      const blob = await canvasToBlob(canvas);
      downloadBlob(
        blob,
        virtualBackgroundFilename({ mirror: variant === "mirror" }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download background",
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-[var(--muted)]">
          Grok Bot
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          Virtual Meetup backgrounds
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Pick a shape and a bright feeling, background and character colors,
          and a corner. Branding stays out of the center so your face stays
          clear on Zoom or Google Meet.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <div className="relative aspect-video w-full bg-[#111]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Virtual background preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  Rendering preview…
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Dashed region is the face safe zone (preview only — not in the
            download).
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <ColorPicker
            label="Background color"
            colors={BRAND_COLORS}
            value={backgroundHex}
            onChange={setBackgroundHex}
          />

          <ColorPicker
            label="Character color"
            colors={CHARACTER_COLORS}
            value={characterHex}
            onChange={setCharacterHex}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--ink)]">Shape</span>
            <div className="grid grid-cols-4 gap-2">
              {BOT_SHAPES.map((shape) => {
                const selected = shapeId === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    title={shape.label}
                    aria-label={`Shape: ${shape.label}`}
                    aria-pressed={selected}
                    onClick={() => setShapeId(shape.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 bg-[var(--panel)] p-2 transition ${
                      selected
                        ? "border-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="flex aspect-square w-full items-center justify-center p-1">
                      <BotAvatar
                        shapeId={shape.id}
                        feelingId={DEFAULT_FEELING_ID}
                        characterHex={characterHex}
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span
                      className={`text-center text-[11px] font-medium leading-tight ${
                        selected
                          ? "text-[var(--ink)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {shape.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--ink)]">
              Feeling
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BOT_FEELINGS.map((feeling) => {
                const selected = feelingId === feeling.id;
                return (
                  <button
                    key={feeling.id}
                    type="button"
                    title={feeling.label}
                    aria-label={`Feeling: ${feeling.label}`}
                    aria-pressed={selected}
                    onClick={() => setFeelingId(feeling.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 bg-[var(--panel)] p-2 transition ${
                      selected
                        ? "border-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="flex aspect-square w-full max-w-20 items-center justify-center p-1">
                      <BotAvatar
                        shapeId={shapeId}
                        feelingId={feeling.id}
                        characterHex={characterHex}
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        selected
                          ? "text-[var(--ink)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {feeling.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--ink)]">
              Corner placement
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CORNERS.map((c) => {
                const selected = c.id === corner;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCorner(c.id)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={downloading !== null}
              onClick={() => void onDownload("standard")}
              className="rounded-xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--panel)] transition hover:opacity-90 disabled:opacity-60"
            >
              {downloading === "standard"
                ? "Preparing…"
                : "Download PNG (1920×1080)"}
            </button>
            <button
              type="button"
              disabled={downloading !== null}
              onClick={() => void onDownload("mirror")}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--muted)] disabled:opacity-60"
            >
              {downloading === "mirror"
                ? "Preparing…"
                : "Download mirrored PNG (Zoom self-view)"}
            </button>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Use the standard file for Google Meet and for what others see.
              Use the mirrored file if Zoom flips your self-view so logos and
              text stay readable to you.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-[#ee3342]" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: { id: string; hex: string; label: string }[];
  value: string;
  onChange: (hex: string) => void;
}) {
  const normalizedValue = normalizeHex(value) ?? value.toLowerCase();
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const hexFieldValue = hexDraft ?? normalizedValue;

  function commitHexDraft(raw: string) {
    const next = normalizeHex(raw);
    setHexDraft(null);
    if (next) onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((c) => {
          const swatchHex = normalizeHex(c.hex) ?? c.hex;
          const selected = swatchHex === normalizedValue;
          return (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-label={`${label}: ${c.label}`}
              aria-pressed={selected}
              onClick={() => onChange(swatchHex)}
              className={`aspect-square rounded-xl border-2 transition ${
                selected
                  ? "scale-[1.04] border-[var(--ink)]"
                  : "border-transparent hover:border-[var(--border)]"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative flex h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
          <span className="sr-only">{label} custom palette</span>
          <input
            type="color"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer appearance-none border-0 bg-transparent p-0"
            style={{ backgroundColor: normalizedValue }}
          />
        </label>
        <input
          type="text"
          value={hexFieldValue}
          spellCheck={false}
          aria-label={`${label} hex`}
          onFocus={() => setHexDraft(normalizedValue)}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={() => commitHexDraft(hexFieldValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 font-mono text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
      </div>
    </div>
  );
}
