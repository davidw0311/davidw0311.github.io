import Link from 'next/link';
import styles from './views.module.css';
export default function ViewNavigation({ current, hidden = false }: { current: 'planner' | 'showcase'; hidden?: boolean }) {
  return <nav className={styles.views} aria-label="InfiniteGranite views" inert={hidden}>
    <Link href="/projects/infinite-granite/" aria-current={current === 'planner' ? 'page' : undefined}>Room Planner</Link>
    <Link href="/projects/infinite-granite/showcase/" aria-current={current === 'showcase' ? 'page' : undefined}>Slab Studio</Link>
    <Link href="/projects/infinite-granite/flyover/">Kitchen Flyover</Link>
  </nav>;
}
