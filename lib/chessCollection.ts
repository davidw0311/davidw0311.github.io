// A compact bitmap fits the entire immutable puzzle bank in account metadata.
export const COLLECTION_KEY = 'chess_collection_v1';
const MAX_PUZZLES = 20000;
export type CollectionChange = { index: number; saved: boolean };

export function readCollection(value: unknown): string {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_PUZZLES / 8 / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return '';
  try { return atob(value).length <= MAX_PUZZLES / 8 ? value : ''; } catch { return ''; }
}
export function collectionIndexes(value: string): number[] {
  const bytes = atob(readCollection(value));
  return Array.from({ length: bytes.length * 8 }, (_, i) => i).filter(i => (bytes.charCodeAt(i >> 3) & (1 << (i % 8))) !== 0);
}
export function changeCollection(value: string, change: CollectionChange): string {
  if (!Number.isInteger(change.index) || change.index < 0 || change.index >= MAX_PUZZLES || typeof change.saved !== 'boolean') return value;
  const old = atob(readCollection(value));
  const bytes = new Uint8Array(Math.max(old.length, (change.index >> 3) + 1));
  for (let i = 0; i < old.length; i++) bytes[i] = old.charCodeAt(i);
  if (change.saved) bytes[change.index >> 3] |= 1 << (change.index % 8);
  else bytes[change.index >> 3] &= ~(1 << (change.index % 8));
  let length = bytes.length;
  while (length && bytes[length - 1] === 0) length--;
  return btoa(String.fromCharCode(...bytes.slice(0, length)));
}
