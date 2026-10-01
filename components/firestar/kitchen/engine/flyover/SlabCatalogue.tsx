'use client';

import { useRef, useState } from 'react';
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';
import { MATERIAL_COMPANIES, filterMaterials, materialLabel } from '../materials';
import { MaterialSample } from '../MaterialPicker';
import styles from './flyover.module.css';

export default function SlabCatalogue({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState(''), [company, setCompany] = useState('');
  const [closed, setClosed] = useState<string[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const matches = filterMaterials(query, company);
  const resetScroll = () => list.current?.scrollTo({ top: 0 });
  return <div className={styles.catalogue}>
    <div className={styles.filters}>
      <div className={styles.search}><MagnifyingGlass size={17} /><input aria-label="Search company, code or name" type="search" placeholder="Company, code or name" value={query} onChange={e => { setQuery(e.target.value); resetScroll(); }} />{query && <button aria-label="Clear search" onClick={() => { setQuery(''); resetScroll(); }}><X size={16} /></button>}</div>
      <select aria-label="Filter companies" value={company} onChange={e => { setCompany(e.target.value); resetScroll(); }}><option value="">All companies</option>{MATERIAL_COMPANIES.map(name => <option key={name}>{name}</option>)}</select>
    </div>
    <div className={styles.slabList} ref={list} tabIndex={0} aria-label="Countertop catalogue">
      {MATERIAL_COMPANIES.map(name => {
        const entries = matches.filter(m => m.company === name);
        if (!entries.length) return null;
        // A search opens matching sections, while their headers remain independently collapsible.
        const key = `${query}|${company}|${name}`, open = !closed.includes(key);
        return <section key={name} className={styles.company} aria-label={`${name} slabs`}>
          <button className={styles.companyHeading} aria-expanded={open} aria-controls={`slabs-${name.replace(/\W/g, '')}`} onClick={e => {
            const section = e.currentTarget.parentElement!;
            const top = section.offsetTop;
            setClosed(items => open ? [...items, key] : items.filter(item => item !== key));
            // Collapsing a pinned heading returns to that boundary, revealing the next supplier.
            if (list.current && list.current.scrollTop > top) list.current.scrollTop = top;
          }}><strong>{name}</strong><span>{entries.length}</span><CaretDown size={15} /></button>
          {open && <div id={`slabs-${name.replace(/\W/g, '')}`} className={styles.slabGrid}>{entries.map(m => <button key={m.id} className={styles.slab} aria-label={materialLabel(m)} aria-pressed={value === m.id} onClick={() => onChange(m.id)} title={`${m.code} · ${m.name}`}><MaterialSample material={m} selected={value === m.id} /><strong>{m.code}</strong>{m.code !== m.name && <span>{m.name}</span>}{m.availability && <small>{m.availability}</small>}</button>)}</div>}
        </section>;
      })}
      {!matches.length && <p className={styles.empty} role="status">No matching slabs. Try another code or company.</p>}
    </div>
  </div>;
}
