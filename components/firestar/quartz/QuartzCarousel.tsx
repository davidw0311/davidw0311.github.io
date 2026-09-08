'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from '@phosphor-icons/react';
import s from './quartz.module.css';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function advance(track: HTMLDivElement, direction: number, reducedMotion: boolean) {
  const first = track.children[0] as HTMLElement | undefined;
  const second = track.children[1] as HTMLElement | undefined;
  if (!first || !second) return;
  const step = second.offsetLeft - first.offsetLeft;
  const end = track.scrollWidth - track.clientWidth;
  const wrap = direction > 0 ? track.scrollLeft >= end - 2 : track.scrollLeft <= 2;
  const next = direction > 0 ? Math.floor(track.scrollLeft / step + 0.05) + 1 : Math.ceil(track.scrollLeft / step - 0.05) - 1;
  track.scrollTo({ left: wrap ? (direction > 0 ? 0 : end) : Math.max(0, Math.min(end, next * step)), behavior: reducedMotion || wrap ? 'instant' : 'smooth' });
}

export function QuartzCarousel({ children, paused }: { children: ReactNode; paused: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia(reducedMotionQuery).matches, () => true);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScrollable(element.scrollWidth > element.clientWidth + 2));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion || paused || hovered || focused || !scrollable) return;
    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element || document.hidden) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) advance(element, 1, false);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, paused, hovered, focused, scrollable]);

  const navigate = (direction: number) => {
    setPlaying(false);
    if (track.current) advance(track.current, direction, reducedMotion);
  };

  return <div className={s.carousel}>
    <div ref={track} id="quartz-carousel" className={s.track} role="region" aria-roledescription="carousel" aria-label="Material selections. Swipe or use the arrow buttons to explore." tabIndex={0}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onPointerDown={() => setPlaying(false)} onWheel={() => setPlaying(false)}
      onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1); } }}>
      {children}
    </div>
    <div className={s.carouselControls}>
        {!reducedMotion && scrollable && <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause automatic rotation' : 'Start automatic rotation'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>}
        <button onClick={() => navigate(-1)} disabled={!scrollable} aria-label="Previous surface" aria-controls="quartz-carousel"><ArrowLeft size={22} /></button>
        <button onClick={() => navigate(1)} disabled={!scrollable} aria-label="Next surface" aria-controls="quartz-carousel"><ArrowRight size={22} /></button>
    </div>
  </div>;
}
