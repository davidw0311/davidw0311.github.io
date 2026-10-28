'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import styles from './chess.module.css';
export default function PracticeDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="settings-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button className={styles.close} aria-label="Close practice settings" onClick={onClose}><X size={22} /></button>
    <p className={styles.eyebrow}>Make it your practice</p><h2 id="settings-title">Practice settings</h2>{children}
  </dialog>;
}
