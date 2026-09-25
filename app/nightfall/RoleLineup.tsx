"use client";

import type { ReactNode } from "react";
import { CaretDown, CardsThree } from "@phosphor-icons/react";
import styles from "./role-lineup.module.css";

type LineupRole = {
  id: string;
  name: { en: string; zh: string };
  description: { en: string; zh: string };
};

/** Public starting-deck information only. Never accepts seats or dealt cards. */
export function RoleLineup({ deck, roles, lang, renderIcon, variant, extraCards = [] }: {
  deck: string[];
  roles: LineupRole[];
  lang: "en" | "zh";
  renderIcon: (id: string) => ReactNode;
  variant: "werewolf" | "one-night";
  extraCards?: string[];
}) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const counts = new Map<string, number>();
  for (const id of deck) counts.set(id, (counts.get(id) || 0) + 1);
  const catalogue = new Map(roles.map(role => [role.id, role]));

  if (!deck.length) return <div className={styles.empty}><CardsThree size={36} aria-hidden="true" /><p>{variant === "werewolf"
    ? t("Automatic deck. A balanced deck will be chosen for the final player count when cards are dealt. The host can also choose roles in settings.", "自动配置。发牌时将按最终人数选择平衡配置。房主也可在设置中自定义角色。")
    : t("No deck selected yet. The host can choose a preset or build a deck before dealing.", "尚未选择牌组。房主可在发牌前选择预设或自定义牌组。")}</p></div>;

  return <div className={styles.lineup}>
    <div className={styles.summary}><CardsThree size={24} aria-hidden="true" /><strong>{t("Starting deck", "初始牌组")}</strong><span>{t(`${deck.length} cards`, `${deck.length} 张牌`)}</span></div>
    <p className={styles.note}>{variant === "one-night"
      ? t("Includes the three center cards. Swaps do not change this list; it does not show who currently holds each role.", "包含三张中央牌。交换身份不会改变此列表；这里不会显示各角色当前由谁持有。")
      : t("The roles dealt at the start. This list stays the same after deaths or role changes and does not reveal anyone’s identity.", "本局开始时发放的角色。出局或身份变化不会改变此列表，也不会公开任何玩家的身份。")}</p>
    <p className={styles.hint}>{t("Tap a role to see what it does.", "点击角色查看技能说明。")}</p>
    <div className={styles.rows}>{[...counts].map(([id, count]) => {
      const role = catalogue.get(id);
      return <details className={styles.role} key={id}>
        <summary><span className={styles.icon} aria-hidden="true">{renderIcon(id)}</span><span className={styles.name}>{role?.name[lang] || id}</span><span className={styles.count} aria-label={t(`${count} ${count === 1 ? "card" : "cards"}`, `${count} 张牌`)}>×{count}</span><CaretDown size={16} className={styles.chevron} aria-hidden="true" /></summary>
        <p>{role?.description[lang] || t("Role details are unavailable.", "暂无角色说明。")}</p>
      </details>;
    })}</div>
    {!!extraCards.length && <div className={styles.extra}><strong>{t("Extra center card", "额外中央牌")}</strong><p>{extraCards.map(id => catalogue.get(id)?.name[lang] || id).join(" · ")}{t(" — the extra center card starts as this role, in addition to the deck above. The Alpha Wolf may swap it.", " — 额外中央牌的初始身份，不计入上方牌组。狼王可交换此牌。")}</p></div>}
    {variant === "one-night" && deck.includes("temptress") && <div className={styles.extra}><strong>{t("Extra reserve card", "额外备用牌")}</strong><p>{t("Temptress adds a separate reserve card that starts as Henchman #7. It is not one of the three center cards or part of the starting deck above.", "魅惑女郎另有一张初始为七号爪牙的备用牌。它不属于三张中央牌，也不计入上方初始牌组。")}</p></div>}
  </div>;
}
