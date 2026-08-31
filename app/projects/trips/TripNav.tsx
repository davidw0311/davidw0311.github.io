import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import styles from "./trips.module.css";

export function TripNav({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <nav className={styles.tripNav} aria-label="Trip navigation">
      <Link href={backHref}>
        <ArrowLeft size={18} weight="bold" /> {backLabel}
      </Link>
      <Link className={styles.tripNavMark} href="/projects/trips/" aria-label="Trips home">
        Trips
      </Link>
      <Link href="/#about">DYW</Link>
    </nav>
  );
}
