export function virtualBackgroundFilename(
  options: { mirror?: boolean } = {},
): string {
  const suffix = options.mirror ? "-mirror" : "";
  return `grok-bot-virtual-background${suffix}.png`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
