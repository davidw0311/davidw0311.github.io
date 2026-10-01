/** The leading card is the selected surface, including either seamless buffer copy. */
export function activeSlideIndex(left: number, cycle: number, step: number, count: number) {
  if (step <= 0 || count <= 0) return 0;
  const index = Math.round((left - cycle) / step);
  return ((index % count) + count) % count;
}
