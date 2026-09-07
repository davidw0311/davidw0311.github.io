'use client';
import { useId, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Check, MagnifyingGlass, X } from '@phosphor-icons/react';
import { MATERIALS, MATERIAL_COMPANIES, filterMaterials, materialLabel, type CountertopMaterial } from './materials';
import styles from './studio.module.css';

export function MaterialSample({ material, selected = false }: { material: CountertopMaterial; selected?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.materialSample} data-material={material.textureUrl?'supplier':material.id} style={{'--stone':material.color,'--vein':material.vein} as CSSProperties}>
    {material.textureUrl&&!failed&&<Image src={material.thumbnailUrl??material.textureUrl} alt={`${material.company} ${material.code} ${material.name} surface`} width={360} height={180} onError={()=>setFailed(true)} />}
    {failed&&<span className={styles.imageUnavailable}>Swatch unavailable</span>}
    {selected&&<span className={styles.materialCheck}><Check size={15} weight="bold"/></span>}
  </span>;
}
export default function MaterialPicker({ value, onChange, label='Countertop material' }: { value:string; onChange:(id:string)=>void; label?:string }) {
  const [query,setQuery]=useState(''),[company,setCompany]=useState(''),[expanded,setExpanded]=useState<string[]>([]);
  const inputId=useId();
  const matches=filterMaterials(query,company);
  const current=MATERIALS.find(m=>m.id===value);
  return <div className={styles.catalogue}>
    <div className={styles.catalogueSearch}><MagnifyingGlass size={18}/><label className={styles.srOnly} htmlFor={inputId}>Search {label.toLowerCase()} by code or name</label><input id={inputId} type="search" placeholder="Search code or colour…" value={query} onChange={e=>setQuery(e.target.value)} />{query&&<button aria-label="Clear material search" onClick={()=>setQuery('')}><X size={16}/></button>}</div>
    <label className={styles.supplierFilter}>Company<select value={company} onChange={e=>setCompany(e.target.value)}><option value="">All companies</option>{MATERIAL_COMPANIES.map(name=><option key={name}>{name}</option>)}</select></label>
    {query&&<p className={styles.catalogueCount} aria-live="polite">{matches.length} {matches.length===1?'finish':'finishes'}{query&&` matching “${query}”`}</p>}
    {current&&<details className={styles.selectedMaterial}><summary>Selected: <strong>{current.code}</strong> · {current.name}</summary><p>{current.company} · {current.family}</p>{current.textureKind==='detail'&&<p className={styles.supplierNote}>Detail photograph · pattern scale is approximate.</p>}{current.sourceUrl&&<a href={current.sourceUrl} target="_blank" rel="noreferrer">View supplier details ↗</a>}</details>}
    {MATERIAL_COMPANIES.map(name=>{
      const entries=matches.filter(m=>m.company===name);if(!entries.length)return null;
      const all=!!query||!!company||expanded.includes(name);const visible=all?entries:entries.slice(0,6);
      return <section key={name} className={styles.supplierGroup} aria-label={`${name} countertop catalogue`}><div className={styles.supplierHeading}><h4>{name}</h4><span>{entries.length}</span></div>
        {name==='TCE Stone'&&<p className={styles.supplierNote}>Quartz · photographs by TCE Stone. Ordered by product code.</p>}
        <div className={styles.materialGrid} role="group" aria-label={label}>{visible.map(m=><button type="button" key={m.id} className={styles.materialCard} aria-label={materialLabel(m)} aria-pressed={m.id===value} onClick={()=>onChange(m.id)}><MaterialSample material={m} selected={m.id===value}/><strong className={styles.materialCode}>{m.code}</strong><span className={styles.materialName}>{m.name}</span><small>{m.family}{m.availability&&` · ${m.availability}`}</small></button>)}</div>
        {!all&&entries.length>6&&<button className={styles.showCatalogue} onClick={()=>setExpanded(items=>[...items,name])}>Show all {entries.length} {name} finishes</button>}
      </section>;
    })}
    {matches.length===0&&<div className={styles.catalogueEmpty}><p>No matching product code or colour.</p><button onClick={()=>{setQuery('');setCompany('');}}>Clear filters</button></div>}
  </div>;
}
