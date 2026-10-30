'use client';
import { useEffect, useRef, useId, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import styles from './rooms.module.css';
export default function RoomDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={id} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button className={styles.close} aria-label={`Close ${title}`} onClick={onClose}><X size={22} /></button><h2 id={id}>{title}</h2>{children}
  </dialog>;
}
