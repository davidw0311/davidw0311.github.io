import { Lightbulb, Info } from "@phosphor-icons/react";
import type { GameView, Language } from "../../lib/werewolfClient";
import { getWerewolfGuidance } from "../../lib/werewolfGuidance";
import styles from "./role-guidance.module.css";

/** Render only on the owner's private card or action panel. */
export function RoleGuidance({ view, lang, context, roleId }: {
  view: GameView;
  lang: Language;
  context: "card" | "turn";
  roleId?: string;
}) {
  const guidance = getWerewolfGuidance(view, roleId);
  const lines = context === "turn" ? guidance.turn : guidance.rules;
  if (!lines.length && (context === "turn" || !guidance.tips.length)) return null;
  const title = context === "turn"
    ? (lang === "zh" ? "行动提示" : "For this turn")
    : (lang === "zh" ? "怎么玩" : "How to play");
  return <aside className={`${styles.guide} ${context === "turn" ? styles.turn : ""}`} aria-label={title}>
    <h3 className={styles.heading}><Info size={18} aria-hidden="true" />{title}</h3>
    {lines.length > 0 && <ul className={styles.lines}>{lines.map((line) => <li key={line.en}>{line[lang]}</li>)}</ul>}
    {context === "card" && guidance.tips.length > 0 && <details className={styles.tips}>
      <summary><Lightbulb size={17} aria-hidden="true" />{lang === "zh" ? "新手建议" : "Beginner tips"}</summary>
      <ul className={styles.lines}>{guidance.tips.map((tip) => <li key={tip.en}>{tip[lang]}</li>)}</ul>
    </details>}
  </aside>;
}
