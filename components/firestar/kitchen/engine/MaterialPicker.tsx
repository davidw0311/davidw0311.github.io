'use client';
import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Check } from '@phosphor-icons/react';
import { materialLabel, type CountertopMaterial } from './materials';
import styles from './samples.module.css';

export function MaterialSample({ material, selected = false }: { material: CountertopMaterial; selected?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.materialSample} data-material={material.textureUrl?'supplier':material.id} style={{'--stone':material.color,'--vein':material.vein} as CSSProperties}>
    {material.textureUrl&&!failed&&<Image src={material.thumbnailUrl??material.textureUrl} alt={`${materialLabel(material)} surface`} width={360} height={180} onError={()=>setFailed(true)} />}
    {failed&&<span className={styles.imageUnavailable}>Swatch unavailable</span>}
    {selected&&<span className={styles.materialCheck}><Check size={15} weight="bold"/></span>}
  </span>;
}
