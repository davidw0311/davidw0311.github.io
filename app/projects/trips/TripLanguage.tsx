"use client";

import { Translate } from "@phosphor-icons/react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import styles from "./trips.module.css";

type TripLanguage = "en" | "zh";

type TripLanguageContextValue = {
  language: TripLanguage;
  setLanguage: (language: TripLanguage) => void;
};

const TripLanguageContext = createContext<TripLanguageContextValue | null>(null);

export function TripLanguageShell({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const [language, setLanguageState] = useState<TripLanguage>("en");

  useEffect(() => {
    const previousDocumentLanguage = document.documentElement.lang;
    const params = new URLSearchParams(window.location.search);
    const requestedLanguage = params.get("lang");
    const savedLanguage = window.localStorage.getItem("trip-language");
    const initialLanguage = requestedLanguage === "zh" || (requestedLanguage !== "en" && savedLanguage === "zh")
      ? "zh"
      : "en";

    const stateTimer = window.setTimeout(() => setLanguageState(initialLanguage), 0);
    document.documentElement.lang = initialLanguage === "zh" ? "zh-Hans" : "en";

    return () => {
      window.clearTimeout(stateTimer);
      document.documentElement.lang = previousDocumentLanguage;
    };
  }, []);

  function setLanguage(nextLanguage: TripLanguage) {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage === "zh" ? "zh-Hans" : "en";
    window.localStorage.setItem("trip-language", nextLanguage);

    const url = new URL(window.location.href);
    if (nextLanguage === "zh") {
      url.searchParams.set("lang", "zh");
    } else {
      url.searchParams.delete("lang");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <TripLanguageContext.Provider value={{ language, setLanguage }}>
      <main className={className} data-trip-language={language}>
        {children}
      </main>
    </TripLanguageContext.Provider>
  );
}

export function TripLanguageToggle() {
  const context = useContext(TripLanguageContext);

  if (!context) {
    return null;
  }

  const nextLanguage = context.language === "en" ? "zh" : "en";
  const nextLabel = nextLanguage === "zh" ? "中文" : "EN";
  const accessibleLabel = nextLanguage === "zh" ? "切换到中文" : "Switch to English";

  return (
    <button
      type="button"
      className={styles.languageToggle}
      onClick={() => context.setLanguage(nextLanguage)}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <Translate size={18} weight="bold" aria-hidden="true" />
      <span>{nextLabel}</span>
    </button>
  );
}
