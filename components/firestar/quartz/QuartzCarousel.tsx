'use client';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from '@phosphor-icons/react';
import s from './quartz.module.css';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export function QuartzCarousel({ children, count, paused }: { children: (duplicate: boolean) => ReactNode; count: number; paused: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const metrics = useRef({ cycle: 0, step: 0 });
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia(reducedMotionQuery).matches, () => true);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element || count < 2) return;
    const slides = Array.from(element.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
    let timer = 0;
    let pointerDown = false;
    let touching = false;
    const modulo = (value: number, length: number) => ((value % length) + length) % length;

    const recenter = () => {
      const { cycle } = metrics.current;
      if (!cycle || pointerDown || touching) return;
      if (element.scrollLeft >= cycle - 0.5 && element.scrollLeft < cycle * 2 - 0.5) return;
      // Equivalent images occupy the same viewport after moving to the middle copy.
      const offset = modulo(element.scrollLeft - cycle, cycle);
      // Some browsers round scrollLeft even when the card widths are fractional.
      const left = cycle + (cycle - offset < 0.5 ? 0 : offset);
      const active = document.activeElement;
      const index = slides.findIndex(slide => slide.contains(active));
      if (index >= 0 && (index < count || index >= count * 2)) {
        const controls = Array.from(slides[index].querySelectorAll<HTMLElement>('button, a'));
        const controlIndex = controls.findIndex(control => control === active);
        slides[count + index % count].querySelectorAll<HTMLElement>('button, a')[controlIndex]?.focus({ preventScroll: true });
      }
      element.scrollTo({ left, behavior: 'instant' });
    };
    const scheduleRecenter = () => {
      window.clearTimeout(timer);
      // Fallback for browsers without scrollend; wait for native swipe momentum.
      timer = window.setTimeout(recenter, 180);
    };
    const measure = () => {
      if (!slides[count]) return;
      const cycle = slides[count].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
      if (cycle <= 0) return;
      const old = metrics.current;
      const position = old.step ? modulo((element.scrollLeft - old.cycle) / old.step, count) : 0;
      metrics.current = { cycle, step: cycle / count };
      if (Math.abs(old.cycle - cycle) > 0.1) element.scrollTo({ left: cycle + position * metrics.current.step, behavior: 'instant' });
    };
    const startPointer = () => { pointerDown = true; };
    const endPointer = () => { pointerDown = false; scheduleRecenter(); };
    const startTouch = () => { touching = true; };
    const endTouch = () => { touching = false; scheduleRecenter(); };
    measure();
    const observer = new ResizeObserver(() => { measure(); setScrollable(element.scrollWidth > element.clientWidth + 2); });
    observer.observe(element);
    element.addEventListener('scroll', scheduleRecenter, { passive: true });
    element.addEventListener('scrollend', recenter);
    element.addEventListener('pointerdown', startPointer, { passive: true });
    element.addEventListener('touchstart', startTouch, { passive: true });
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      element.removeEventListener('scroll', scheduleRecenter);
      element.removeEventListener('scrollend', recenter);
      element.removeEventListener('pointerdown', startPointer);
      element.removeEventListener('touchstart', startTouch);
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);
      window.removeEventListener('touchend', endTouch);
      window.removeEventListener('touchcancel', endTouch);
    };
  }, [count]);

  const advance = (direction: number) => {
    const element = track.current;
    const { cycle, step } = metrics.current;
    if (!element || !step) return;
    const position = (element.scrollLeft - cycle) / step;
    const next = direction > 0 ? Math.floor(position + 0.05) + 1 : Math.ceil(position - 0.05) - 1;
    element.scrollTo({ left: cycle + next * step, behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  useEffect(() => {
    if (!playing || reducedMotion || paused || hovered || focused || !scrollable) return;
    const timer = window.setInterval(() => {
      const element = track.current;
      const { step } = metrics.current;
      if (!element || !step || document.hidden) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) element.scrollBy({ left: step, behavior: 'smooth' });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, paused, hovered, focused, scrollable]);

  const navigate = (direction: number) => { setPlaying(false); advance(direction); };

  return <div className={s.carousel}>
    <div ref={track} id="quartz-carousel" className={s.track} role="region" aria-roledescription="carousel" aria-label="Material selections. Swipe or use the arrow buttons to explore." tabIndex={0}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onPointerDown={() => setPlaying(false)} onWheel={() => setPlaying(false)}
      onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1); } }}>
      {(count > 1 ? [0, 1, 2] : [1]).map(copy => <div key={copy} className={s.slideSet} aria-hidden={copy !== 1 ? true : undefined}>{children(copy !== 1)}</div>)}
    </div>
    <div className={s.carouselControls}>
      {!reducedMotion && scrollable && <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause automatic rotation' : 'Start automatic rotation'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>}
      <button onClick={() => navigate(-1)} disabled={!scrollable} aria-label="Previous surface" aria-controls="quartz-carousel"><ArrowLeft size={22} /></button>
      <button onClick={() => navigate(1)} disabled={!scrollable} aria-label="Next surface" aria-controls="quartz-carousel"><ArrowRight size={22} /></button>
    </div>
  </div>;
}
