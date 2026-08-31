import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { TripLanguageToggle } from "./TripLanguage";
import { TripText } from "./TripText";
import styles from "./trips.module.css";

export function TripNav({
  backHref,
  backLabel,
  backLabelZh,
}: {
  backHref: string;
  backLabel: string;
  backLabelZh: string;
}) {
  return (
    <nav className={styles.tripNav} aria-label="Trip navigation">
      <Link href={backHref}>
        <ArrowLeft size={18} weight="bold" />
        <TripText en={backLabel} zh={backLabelZh} />
      </Link>
      <Link className={styles.tripNavMark} href="/projects/trips/" aria-label="Trips home">
        <TripText en="Trips" zh="旅行" />
      </Link>
      <div className={styles.tripNavActions}>
        <TripLanguageToggle />
        <Link href="/#about">DYW</Link>
      </div>
    </nav>
  );
}
