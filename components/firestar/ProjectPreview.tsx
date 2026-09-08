import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { brandName, href, themes, versions } from '@/data/firestar/content';
import styles from './preview.module.css';

export function FirestarProjectPreview() {
  return <div className={styles.project}>
    <div className={styles.intro}><span>Website design / Three directions</span><h3>{brandName}</h3><p>Custom quartz and stone surfaces. Three completely different ways to experience them.</p></div>
    <div className={styles.versions}>{versions.map((version, index) => <Link key={version} className={`${styles.card} ${styles[version]}`} href={href(version)} aria-label={`${brandName} ${version.toUpperCase()} - ${themes[version].short}`}>
      <div className={styles.visual}><span>{brandName}</span><strong>{index === 0 ? <>Quartz, made<br /><em>personal.</em></> : index === 1 ? <>Quartz for<br />everyday.</> : <>BIG IDEAS.<br />IN QUARTZ.</>}</strong><Image src={`/assets/firestar/photo-${index === 0 ? '005' : index === 1 ? '001' : '000'}.webp`} alt={`${themes[version].short} design with Firestar Granite's original kitchen photography`} width={800} height={530} /></div>
      <div className={styles.caption}><div><span>{version.toUpperCase()}</span><h4>{themes[version].short}</h4></div><ArrowUpRight size={22} /></div>
    </Link>)}</div>
  </div>;
}
