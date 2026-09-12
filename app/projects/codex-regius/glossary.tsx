"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { GlossaryEntry } from "@/data/codexRegiusGlossary";
import styles from "./regius.module.css";

const GlossaryContext = createContext<(id: string) => void>(() => {});

export function GlossaryScope({ entries, children }: { entries: GlossaryEntry[]; children: ReactNode }) {
  const [active, setActive] = useState<GlossaryEntry | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!active) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [active]);
  function close() { dialog.current?.close(); setActive(null); }
  return <GlossaryContext.Provider value={id => setActive(entries.find(entry => entry.id === id) ?? null)}>
    {children}
    <dialog ref={dialog} className={styles.glossaryDialog} aria-labelledby="glossary-title" aria-describedby="glossary-definition" onCancel={close} onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.glossaryCard}>
        <div className={styles.glossaryTop}><span>{active?.category}</span><button type="button" onClick={close} aria-label="Close explanation">✕</button></div>
        <h2 id="glossary-title">{active?.name}</h2>
        <p id="glossary-definition">{active?.definition}</p>
        {active?.source && <a className={styles.glossarySource} href={active.source} target="_blank" rel="noopener noreferrer">Bellows’s index ↗</a>}
        <button type="button" className={styles.glossaryReturn} onClick={close}>Back to reading</button>
      </div>
    </dialog>
  </GlossaryContext.Provider>;
}

export function GlossaryTerm({ id, children }: { id: string; children: ReactNode }) {
  const explain = useContext(GlossaryContext);
  return <button type="button" className={styles.glossaryTerm} aria-haspopup="dialog" onClick={() => explain(id)}>{children}</button>;
}
