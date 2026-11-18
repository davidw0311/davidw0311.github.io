"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type SetStateAction } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, List, MagnifyingGlass, Martini, X } from "@phosphor-icons/react";
import { cocktails, cocktailSource, mamaDiamSource, cocktailPhoto, cocktailAlcoholType, cocktailHash, parseCocktailHash, findCocktails, swipeAction, type CocktailSort } from "@/data/cocktails";
import s from "./cocktails.module.css";

const panels = ["The cocktail", "Ingredients", "Method"];

function subscribeToCocktailUrl(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener("cocktail-url-change", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("cocktail-url-change", onChange);
  };
}

function currentCocktailHash() { return window.location.hash; }
function initialCocktailHash() { return ""; }

function updateCocktailUrl(index: number, panel: number) {
  const hash = cocktailHash(index, panel);
  if (window.location.hash === hash) return;
  // Replacing keeps a browsing session from adding a history entry per swipe.
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  window.dispatchEvent(new Event("cocktail-url-change"));
}

export default function CocktailCards() {
  const hash = useSyncExternalStore(subscribeToCocktailUrl, currentCocktailHash, initialCocktailHash);
  const { index, panel } = parseCocktailHash(hash);
  const [library, setLibrary] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CocktailSort>("name");
  const [direction, setDirection] = useState(0);
  const reducedMotion = useReducedMotion();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const listButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const drink = cocktails[index];
  const matches = findCocktails(query, sort);
  const setPanel = useCallback((update: SetStateAction<number>) => {
    const current = parseCocktailHash(window.location.hash);
    const next = typeof update === "function" ? update(current.panel) : update;
    updateCocktailUrl(current.index, Math.max(0, Math.min(2, next)));
  }, []);
  const move = useCallback((delta: number) => {
    setDirection(delta > 0 ? 1 : -1);
    const current = parseCocktailHash(window.location.hash);
    updateCocktailUrl((current.index + delta + cocktails.length) % cocktails.length, 0);
  }, []);
  const closeLibrary = () => { setLibrary(false); requestAnimationFrame(() => listButton.current?.focus()); };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setLibrary(v => !v); return; }
      if (library || event.target instanceof HTMLInputElement || event.altKey || event.metaKey || event.ctrlKey) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowDown") move(1);
      if (event.key === "ArrowUp") move(-1);
      if (event.key === "ArrowRight") setPanel(p => Math.min(2, p + 1));
      if (event.key === "ArrowLeft") setPanel(p => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [library, move, setPanel]);

  return <main className={s.app}>
    <div className={s.shell}>
      <header className={s.header}>
        <Link href="/#space" className={s.brand} aria-label="Back to Space"><Martini size={23} weight="thin" /><span>AFTER HOURS<small>A POCKET COCKTAIL BOOK</small></span></Link>
        <button ref={listButton} className={s.iconButton} onClick={() => setLibrary(v => !v)} aria-label={library ? "Return to cocktail" : "Open cocktail list"}>{library ? <X size={23} /> : <List size={23} />}</button>
      </header>

      {library ? <section className={s.library} aria-label="Cocktail library">
        <div className={s.libraryTitle}><h1>Full menu</h1><span className={s.eyebrow}>SIGNATURES + CLASSICS</span></div>
        <label className={s.search}><MagnifyingGlass size={20} /><input ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="A cocktail, spirit or ingredient…" aria-label="Search cocktails" />{query && <button onClick={() => { setQuery(""); searchInput.current?.focus(); }} aria-label="Clear search"><X size={18} /></button>}</label>
        <div className={s.sort}><span aria-live="polite">{matches.length} cocktails</span><label>Sort by <select aria-label="Sort cocktails" value={sort} onChange={e => setSort(e.target.value as CocktailSort)}><option value="name">Name A–Z</option><option value="spirit">Alcohol type</option><option value="menu">Menu order</option></select></label></div>
        <div className={s.results}>{matches.map(d => <button key={d.id} className={s.result} onClick={() => { updateCocktailUrl(cocktails.findIndex(c => c.id === d.id), 0); closeLibrary(); }}><Image src={cocktailPhoto(d)} alt="" fill sizes="(max-width: 520px) 45vw, 235px" /><span><strong>{d.name}</strong><small>{sort === "spirit" ? cocktailAlcoholType(d) : d.spirit}</small></span></button>)}{!matches.length && <p className={s.empty}>No matching pours. Try “gin”, “citrus” or “mango”.</p>}</div>
        <footer className={s.libraryFooter}>Menus &amp; images: <a href={cocktailSource} target="_blank" rel="noreferrer">Jigger &amp; Pony ↗</a> · <a href={mamaDiamSource} target="_blank" rel="noreferrer">Mama Diam ↗</a> · <a href="https://iba-world.com/cocktails/" target="_blank" rel="noreferrer">IBA ↗</a><br />Bar signatures are home adaptations. Classics cite their IBA reference.</footer>
      </section> : <>
        <div className={s.collection}><span>{drink.source?.adaptation ? "MAMA DIAM / SIGNATURES" : drink.source ? "WORLD CLASSICS / IBA" : "JIGGER & PONY / BLOOM"}</span><span>{String(index + 1).padStart(2, "0")} <b>/ {String(cocktails.length).padStart(2, "0")}</b></span></div>
        <div className={s.cardViewport}>
        <AnimatePresence initial={false} custom={direction}>
        <motion.article key={drink.id} custom={direction}
          variants={{ enter: (d: number) => ({ y: reducedMotion ? 0 : `${d * 100}%` }), center: { y: 0 }, leave: (d: number) => ({ y: reducedMotion ? 0 : `${-d * 100}%` }) }}
          initial="enter" animate="center" exit="leave"
          transition={{ duration: reducedMotion || direction === 0 ? 0 : 0.36, ease: [0.22, 0.68, 0.2, 1] }}
          className={`${s.card} ${panel === 0 ? s.photoCard : s.recipeCard}`} aria-label={`${drink.name}: ${panels[panel]}`}
          onTouchStart={e => { touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }}
          onTouchCancel={() => { touch.current = null; }}
          onTouchEnd={e => { if (!touch.current) return; const action = swipeAction(e.changedTouches[0].clientX - touch.current.x, e.changedTouches[0].clientY - touch.current.y); touch.current = null; if (action === "next") move(1); if (action === "previous") move(-1); if (action === "forward") setPanel(p => Math.min(2, p + 1)); if (action === "back") setPanel(p => Math.max(0, p - 1)); }}>
          {panel === 0 ? <>
            <Image key={drink.id} className={s.photo} src={cocktailPhoto(drink)} alt={`${drink.name}, ${drink.source?.adaptation ? "menu illustration" : "photograph"} from ${drink.source?.name ?? "Jigger & Pony’s BLOOM menu"}`} fill sizes="(max-width: 600px) 100vw, 480px" priority />
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
            <p className={s.adaptation}>{drink.source ? <>{drink.source.adaptation ? "Home adaptation · menu & illustration: " : "Recipe & photo: "}<a href={drink.source.url} target="_blank" rel="noreferrer">{drink.source.name} ↗</a></> : "Inspired by BLOOM. Home adaptation, not an official recipe."}</p>
          </div>}
        </motion.article>
        </AnimatePresence>
        </div>
        <nav className={s.panels} aria-label="Cocktail pages"><button className={s.iconButton} onClick={() => setPanel(p => Math.max(0, p - 1))} disabled={panel === 0} aria-label="Previous recipe page"><ArrowLeft size={20} /></button><div>{panels.map((label, i) => <button key={label} onClick={() => setPanel(i)} aria-current={panel === i ? "step" : undefined}><span />{label.replace("The cocktail", "Cocktail")}</button>)}</div><button className={s.iconButton} onClick={() => setPanel(p => Math.min(2, p + 1))} disabled={panel === 2} aria-label="Next recipe page"><ArrowRight size={20} /></button></nav>
        <footer className={s.deckFooter}><button onClick={() => move(-1)} aria-label="Previous cocktail"><ArrowUp size={16} /> Prev</button><span>Swipe ↑ drinks · ← recipe</span><button onClick={() => move(1)} aria-label="Next cocktail">Next <ArrowDown size={16} /></button></footer>
        <div className={s.srOnly} aria-live="polite">{drink.name}. {panels[panel]}. Cocktail {index + 1} of {cocktails.length}.</div>
      </>}
    </div>
  </main>;
}
