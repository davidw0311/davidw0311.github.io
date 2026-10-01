'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** Native fullscreen where supported, with a viewport-filling fallback for phone browsers. */
export function usePreviewFullscreen(container: RefObject<HTMLDivElement | null>, galleryExpanded: boolean) {
  const [fullscreen, setFullscreen] = useState(false);
  const native = useRef(false);
  const exit = useCallback(() => {
    setFullscreen(false);
    if (document.fullscreenElement === container.current) void document.exitFullscreen().catch(() => {});
  }, [container]);
  const toggle = async () => {
    if (fullscreen) { exit(); return; }
    setFullscreen(true);
    try { await container.current?.requestFullscreen?.(); } catch { /* The CSS fallback still fills the viewport. */ }
  };
  useEffect(() => {
    const sync = () => {
      if (document.fullscreenElement === container.current) { native.current = true; setFullscreen(true); }
      else if (native.current) { native.current = false; setFullscreen(false); }
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [container]);
  useEffect(() => {
    if (!fullscreen) return;
    const element = container.current, previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.querySelector<HTMLButtonElement>('[aria-label="Exit kitchen fullscreen"]')?.focus({ preventScroll: true });
    const viewport = window.visualViewport;
    const fit = () => {
      element?.style.setProperty('--preview-height', `${viewport?.height ?? window.innerHeight}px`);
      element?.style.setProperty('--preview-top', `${viewport?.offsetTop ?? 0}px`);
    };
    fit(); viewport?.addEventListener('resize', fit); viewport?.addEventListener('scroll', fit); window.addEventListener('resize', fit);
    return () => {
      document.body.style.overflow = overflow;
      viewport?.removeEventListener('resize', fit); viewport?.removeEventListener('scroll', fit); window.removeEventListener('resize', fit);
      element?.style.removeProperty('--preview-height'); element?.style.removeProperty('--preview-top');
      previous?.focus({ preventScroll: true });
    };
  }, [fullscreen, container]);
  useEffect(() => {
    if (!fullscreen) return;
    const keyboard = (event: KeyboardEvent) => {
      // Let the slab gallery and native floor dialog handle their own focus and Escape.
      if (event.defaultPrevented || event.isComposing || galleryExpanded || container.current?.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); exit(); }
      if (event.key === 'Tab') {
        const items = Array.from(container.current?.querySelectorAll<HTMLElement>('button,input,select,[tabindex]') ?? [])
          .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[hidden],[inert]') && el.getClientRects().length > 0);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [fullscreen, galleryExpanded, container, exit]);
  return { fullscreen, toggle };
}
