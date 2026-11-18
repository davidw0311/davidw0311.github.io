"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, List, MagnifyingGlass, Martini, X } from "@phosphor-icons/react";
import { cocktails, cocktailSource, findCocktails, swipeAction } from "@/data/cocktails";
import s from "./cocktails.module.css";

const panels = ["The cocktail", "Ingredients", "Method"];

export default function CocktailCards() {
  const [index, setIndex] = useState(0);
  const [panel, setPanel] = useState(0);
  const [library, setLibrary] = useState(false);
  const [query, setQuery] = useState("");
  const [alphabetical, setAlphabetical] = useState(true);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const listButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const drink = cocktails[index];
  const matches = findCocktails(query, alphabetical);
  const move = (delta: number) => { setIndex(i => (i + delta + cocktails.length) % cocktails.length); setPanel(0); };
  const closeLibrary = () => { setLibrary(false); requestAnimationFrame(() => listButton.current?.focus()); };

  useEffect(() => {
    if (library) searchInput.current?.focus({ preventScroll: true });
  }, [library]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setLibrary(v => !v); return; }
      if (library || event.target instanceof HTMLInputElement || event.altKey || event.metaKey || event.ctrlKey) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowDown") { setIndex(i => (i + 1) % cocktails.length); setPanel(0); }
      if (event.key === "ArrowUp") { setIndex(i => (i - 1 + cocktails.length) % cocktails.length); setPanel(0); }
      if (event.key === "ArrowRight") setPanel(p => Math.min(2, p + 1));
      if (event.key === "ArrowLeft") setPanel(p => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [library]);

  return <main className={s.app}>
    <div className={s.shell}>
      <header className={s.header}>
        <Link href="/#space" className={s.brand} aria-label="Back to Space"><Martini size={23} weight="thin" /><span>AFTER HOURS<small>A POCKET COCKTAIL BOOK</small></span></Link>
        <button ref={listButton} className={s.iconButton} onClick={() => setLibrary(v => !v)} aria-label={library ? "Return to cocktail" : "Open cocktail list"}>{library ? <X size={23} /> : <List size={23} />}</button>
      </header>

      {library ? <section className={s.library} aria-label="Cocktail library">
        <div className={s.libraryTitle}><span className={s.eyebrow}>THE COLLECTION / 01</span><h1>Find your<br /><em>next pour.</em></h1><p>{cocktails.length} cocktails from Jigger &amp; Pony’s BLOOM menu. Adapted for your home bar.</p></div>
        <label className={s.search}><MagnifyingGlass size={20} /><input ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="A cocktail, spirit or ingredient…" aria-label="Search cocktails" />{query && <button onClick={() => { setQuery(""); searchInput.current?.focus(); }} aria-label="Clear search"><X size={18} /></button>}</label>
        <div className={s.sort}><span aria-live="polite">{matches.length} cocktails</span><button onClick={() => setAlphabetical(v => !v)}>Order: {alphabetical ? "A–Z" : "Menu"} ⇅</button></div>
        <div className={s.results}>{matches.map(d => <button key={d.id} className={s.result} onClick={() => { setIndex(cocktails.findIndex(c => c.id === d.id)); setPanel(0); closeLibrary(); }}><Image src={`/assets/cocktails/${d.id}.jpg`} alt="" width={66} height={76} /><span><strong>{d.name}</strong><small>{d.spirit} · {d.method}</small></span><ArrowRight size={20} /></button>)}{!matches.length && <p className={s.empty}>No matching pours. Try “gin”, “citrus” or “mango”.</p>}</div>
        <footer className={s.libraryFooter}>Menu &amp; photography: <a href={cocktailSource} target="_blank" rel="noreferrer">Jigger &amp; Pony / BLOOM ↗</a><br />Checked 18 Nov 2026. Independent home adaptations; measurements and methods are ours, not the bar’s official recipes.<br /><Link href="/#space">← Back to Space</Link></footer>
      </section> : <>
        <div className={s.collection}><span>JIGGER &amp; PONY / BLOOM</span><span>{String(index + 1).padStart(2, "0")} <b>/ {String(cocktails.length).padStart(2, "0")}</b></span></div>
        <article className={`${s.card} ${panel === 0 ? s.photoCard : s.recipeCard}`} aria-label={`${drink.name}: ${panels[panel]}`}
          onTouchStart={e => { touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }}
          onTouchCancel={() => { touch.current = null; }}
          onTouchEnd={e => { if (!touch.current) return; const action = swipeAction(e.changedTouches[0].clientX - touch.current.x, e.changedTouches[0].clientY - touch.current.y); touch.current = null; if (action === "next") move(1); if (action === "previous") move(-1); if (action === "forward") setPanel(p => Math.min(2, p + 1)); if (action === "back") setPanel(p => Math.max(0, p - 1)); }}>
          {panel === 0 ? <>
            <Image key={drink.id} className={s.photo} src={`/assets/cocktails/${drink.id}.jpg`} alt={`${drink.name}, photographed for Jigger & Pony’s BLOOM menu`} fill sizes="(max-width: 600px) 100vw, 480px" priority />
            <div className={s.photoShade} />
            <span className={s.photoLabel}>{drink.spirit} / {drink.glass}</span>
            <div className={s.photoCaption}><span className={s.eyebrow}>{drink.mood}</span><h1>{drink.name}</h1><p>{drink.description}</p><button className={s.recipeButton} onClick={() => setPanel(1)}>Make this cocktail <ArrowRight size={18} /></button></div>
          </> : <div className={`${s.recipe} ${drink.ingredients.length >= 7 || drink.name.length > 24 ? s.denseRecipe : ""}`} key={`${drink.id}-${panel}`}>
            <span className={s.eyebrow}>HOME BAR EDITION / {panel === 1 ? "WHAT YOU NEED" : "HOW TO MAKE IT"}</span>
            <h1>{drink.name}</h1>
            <div className={s.specs}><span>{drink.glass}</span><span>{drink.method}</span><span>1 serving</span></div>
            <h2>{panel === 1 ? "Ingredients" : "The ritual"}</h2>
            {panel === 1 ? <ul className={s.ingredients}>{drink.ingredients.map(([amount, item]) => <li key={item}><span>{item}</span><strong>{amount}</strong></li>)}</ul> : <ol className={s.steps}>{drink.steps.map((step, i) => <li key={step}><span>0{i + 1}</span><p>{step}</p></li>)}</ol>}
            <aside className={s.tip}><span>BAR NOTE</span><p>{drink.tip}</p></aside>
            <p className={s.adaptation}>Inspired by BLOOM. Home adaptation, not an official recipe.</p>
          </div>}
        </article>
        <nav className={s.panels} aria-label="Cocktail pages"><button className={s.iconButton} onClick={() => setPanel(p => Math.max(0, p - 1))} disabled={panel === 0} aria-label="Previous recipe page"><ArrowLeft size={20} /></button><div>{panels.map((label, i) => <button key={label} onClick={() => setPanel(i)} aria-current={panel === i ? "step" : undefined}><span />{label.replace("The cocktail", "Cocktail")}</button>)}</div><button className={s.iconButton} onClick={() => setPanel(p => Math.min(2, p + 1))} disabled={panel === 2} aria-label="Next recipe page"><ArrowRight size={20} /></button></nav>
        <footer className={s.deckFooter}><button onClick={() => move(-1)} aria-label="Previous cocktail"><ArrowUp size={16} /> Prev</button><span>Swipe ↑ drinks · ← recipe</span><button onClick={() => move(1)} aria-label="Next cocktail">Next <ArrowDown size={16} /></button></footer>
        <div className={s.srOnly} aria-live="polite">{drink.name}. {panels[panel]}. Cocktail {index + 1} of {cocktails.length}.</div>
      </>}
    </div>
  </main>;
}
