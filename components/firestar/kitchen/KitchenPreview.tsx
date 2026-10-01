'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { href } from '@/data/firestar/content';
import { MATERIALS } from './engine/materials';
import { DEFAULT_LIGHTING } from './engine/flyover/model';
import type { KitchenScene } from './engine/scene';
import { stationaryPose, surfaceDesign } from './looks';
import s from './kitchenPreview.module.css';

const OPTIONS = { selected: null, walls: true, dimensions: false, showroom: true };

export default function KitchenPreview({ materialId }: { materialId: string }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<KitchenScene | null>(null);
  const current = useRef(materialId);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const material = MATERIALS.find(m => m.id === materialId)!;

  useEffect(() => {
    current.current = materialId;
    scene.current?.update(surfaceDesign(materialId), OPTIONS);
  }, [materialId]);

  useEffect(() => {
    let cancelled = false, instance: KitchenScene | null = null, resize: ResizeObserver | null = null;
    void import('./engine/scene').then(({ createKitchenScene }) => {
      if (cancelled || !host.current) return;
      try {
        instance = createKitchenScene(host.current, () => {}, message => { if (!cancelled) setError(message); }, message => { if (!cancelled) setLoading(message); });
        scene.current = instance;
        instance.update(surfaceDesign(current.current), OPTIONS);
        instance.lighting(DEFAULT_LIGHTING);
        const frame = () => {
          if (!host.current || !instance) return;
          const pose = stationaryPose(host.current.clientWidth / Math.max(1, host.current.clientHeight));
          instance.frame(pose.position, pose.target, pose.fov);
        };
        frame(); resize = new ResizeObserver(frame); resize.observe(host.current);
        const canvas = host.current.querySelector('canvas');
        if (canvas) { canvas.tabIndex = -1; canvas.setAttribute('aria-hidden', 'true'); }
        setReady(true);
      } catch { setError('Open the kitchen viewer to explore this finish.'); }
    }).catch(() => { if (!cancelled) setError('Open the kitchen viewer to explore this finish.'); });
    return () => { cancelled = true; resize?.disconnect(); instance?.dispose(); scene.current = null; };
  }, []);

  return <Link className={s.preview} href={`${href('v1', 'viewer')}?surface=${encodeURIComponent(materialId)}`} prefetch={false} aria-label={`Open kitchen viewer with ${material.company} ${material.code} ${material.name}`}>
    <div className={s.picture} aria-hidden="true"><div ref={host} className={s.stage} />{(!ready || error || loading) && <span className={s.status}>{error ? 'Explore this finish →' : !ready ? 'Preparing preview…' : 'Updating surface…'}</span>}</div>
    <div className={s.caption}><span>See it in a kitchen</span><strong>{material.name}</strong><small>{material.company}{material.code !== material.name && ` · ${material.code}`}</small><span className={s.action}>Explore kitchen <ArrowUpRight size={19} /></span></div>
  </Link>;
}
