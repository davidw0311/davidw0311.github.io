/** Accept a typed code, a copied invitation URL, or a labelled invitation. */
export function normalizeRoomCode(value: string): string {
  const text = value.trim();
  try { const code = new URL(text).searchParams.get("room"); if (code) return code.trim().toUpperCase(); } catch { /* A plain room code. */ }
  const labelled = text.match(/(?:room\s*code|code|房间码)\s*[:：]\s*([a-z]{4}|[a-f0-9]{8})\b/i);
  return (labelled?.[1] || text).replace(/\s/g, "").toUpperCase();
}
