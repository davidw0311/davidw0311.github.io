import Link from "next/link";
import { ArrowLeft, PianoKeys } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import shell from "../piano-party.module.css";
import styles from "./account.module.css";
export default function AccountShell({ children, title, intro }: { children: ReactNode; title: string; intro: string }) {
  return <main className={shell.page}>
    <nav className={shell.nav} aria-label="Piano Party navigation"><Link href="/projects/piano-party/"><ArrowLeft size={18} /> Piano Party</Link><Link href="/projects/piano-party/practice/">Keep practicing</Link></nav>
    <div className={styles.layout}><header className={styles.intro}><PianoKeys size={44} weight="thin" /><p>YOUR PIANO PARTY</p><h1>{title}</h1><p>{intro}</p><div className={styles.keys} aria-hidden="true">{Array.from({length: 14}, (_, i) => <span key={i} data-black={[0,1,3,4,5].includes(i % 7)} />)}</div><small>One note at a time. At your own pace.</small></header><section className={styles.card}>{children}</section></div>
  </main>;
}
