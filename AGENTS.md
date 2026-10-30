<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Virtual Meetup backgrounds keep Grok Bot icon/wordmark branding in a corner so the user’s face stays clear in the center.
- Ship both a standard PNG download and a mirrored PNG (for Zoom self-view readability).
- Do not include Event type / City / Date fields; keep controls to sticker, wordmark, colors, and corner placement.
- Default corner placement is top-left.
- Background and character colors should offer brand palette swatches plus a freeform color picker.
- Expose Shape and Feeling as separate pickers; changing Feeling must keep the current Shape (Feeling options are those available for that Shape).
- Prefer bright / positive feelings only; labels should match the visual expression, and negative-reading bots/feelings stay out of the catalog.
- Prefer a bloub-style dynamic Shape × Feeling bot (https://bloub.vercel.app/) over fixed one-off sticker images when evolving the icon system.

## Learned Workspace Facts

- This repo is a Next.js (App Router, TypeScript, Tailwind) studio that composes 1920×1080 Zoom/Meet virtual backgrounds.
- Bot icons are generated at runtime (bloub-style Shape × Feeling SVG in `src/lib/bloub/` + `src/lib/bot-svg.ts`), not from static sticker files.
- Picker and canvas should preserve bot aspect ratio (contain) when drawing into square slots.
- Public GitHub repo: `brandonlee-lomtech/grok-bot-virtual-background`; production deploy: `https://grok-bot-virtual-background.vercel.app`.
- Reference/inspiration UI: `https://grok-bot-thumbnail-tool.vercel.app`.
