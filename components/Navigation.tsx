"use client";

import { List, X } from "@phosphor-icons/react";
import { useState } from "react";

const items = [
  ["About", "#about"],
  ["Projects", "#projects"],
  ["Publication", "#publications"],
  ["Experience", "#experiences"],
  ["Education", "#education"],
  ["Interests", "#interests"],
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav">
      <a className="site-nav__mark" href="#about" aria-label="David Yuchen Wang, home">
        DYW
      </a>
      <nav className={open ? "site-nav__links site-nav__links--open" : "site-nav__links"} aria-label="Primary navigation">
        {items.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>
      <button
        className="site-nav__toggle"
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
      </button>
    </header>
  );
}
