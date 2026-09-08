import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { brandName, href, themes, versions } from '@/data/firestar/content';
import styles from './preview.module.css';

export function FirestarProjectPreview() {
  return <div className={styles.project}>
    <div className={styles.intro}><span>Website design / Three directions</span><h3>{brandName}</h3><p>Custom quartz and stone surfaces. Three completely different ways to experience them.</p></div>
    <div className={styles.versions}>{versions.map(version => <Link key={version} className={`${styles.card} ${styles[version]}`} href={href(version)} aria-label={`${brandName} ${version.toUpperCase()} - ${themes[version].short}`}>
      {version === 'v1' ? <div className={styles.visual}><span>{brandName}</span><strong>Quartz, made<br /><em>personal.</em></strong><Image src="/assets/firestar/photo-005.webp" alt="Architectural design with original kitchen photography" width={800} height={530} /></div> : version === 'v2' ? <div className={styles.catalogueVisual}><div className={styles.miniRail}><b>Firestar</b><span>Home</span><span>Services</span><span>Products</span><span>Showroom</span><span>Gallery</span><span>Contact</span></div><div className={styles.miniExhibit}><span>Custom quartz surfaces</span><Image src="/assets/firestar/photo-000.webp" alt="Material catalogue with fixed side navigation and an immersive stone photograph" width={800} height={530} /><strong>QUARTZ.</strong></div></div> : <div className={styles.homesteadVisual}><span>{brandName}</span><strong>Make yourself<br /><em>at home.</em></strong><div className={styles.miniRooms}><span>The kitchen</span><span>The bathroom</span></div><Image src="/assets/firestar/photo-005.webp" alt="Neighbourhood studio with a room picker and rounded photography" width={800} height={530} /></div>}
      <div className={styles.caption}><div><span>{version.toUpperCase()}</span><h4>{themes[version].short}</h4></div><ArrowUpRight size={22} /></div>
    </Link>)}</div>
  </div>;
}
