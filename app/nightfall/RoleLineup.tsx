"use client";

import { useState, type ReactNode } from "react";
import { CaretDown, CardsThree, MoonStars } from "@phosphor-icons/react";
import { getNightTimeline } from "@/lib/nightfallTimeline";
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
  const [section, setSection] = useState<"roles" | "timeline">("roles");
  const counts = new Map<string, number>();
  for (const id of deck) counts.set(id, (counts.get(id) || 0) + 1);
  const catalogue = new Map(roles.map(role => [role.id, role]));

  if (!deck.length) return <div className={styles.empty}><CardsThree size={36} aria-hidden="true" /><p>{variant === "werewolf"
    ? t("Automatic deck. A balanced deck will be chosen for the final player count when cards are dealt. The host can also choose roles in settings.", "自动配置。发牌时将按最终人数选择平衡配置。房主也可在设置中自定义角色。")
    : t("No deck selected yet. The host can choose a preset or build a deck before dealing.", "尚未选择牌组。房主可在发牌前选择预设或自定义牌组。")}</p></div>;

  return <div className={styles.lineup}>
    <div className={styles.viewSwitch} aria-label={t("Game reference", "牌局参考")}>
      <button aria-pressed={section === "roles"} onClick={() => setSection("roles")}><CardsThree size={19} aria-hidden="true" />{t("Roles", "角色配置")}</button>
      <button aria-pressed={section === "timeline"} onClick={() => setSection("timeline")}><MoonStars size={19} aria-hidden="true" />{t("Night order", "夜间流程")}</button>
    </div>
    {section === "timeline" ? <>
      <h3 className={styles.timelineHeading}>{t("What happens during the night", "夜间行动顺序")}</h3>
      <p className={styles.note}>{t("For this starting deck. Each role opens their eyes, completes their action, then closes their eyes before the next call.", "以下按本局初始牌组排列。每个角色依次睁眼、完成行动、闭眼，然后轮到下一角色。")}</p>
      <ol className={styles.timeline}>{getNightTimeline({ variant, deck }).map((step, index) => <li key={step.id}>
        <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
        <div><h4>{step.name[lang]}{step.firstNightOnly && <span className={styles.firstNight}>{t("First night only", "仅首夜")}</span>}</h4><p>{step.description[lang]}</p></div>
      </li>)}</ol>
      <p className={styles.timelineFootnote}>{variant === "werewolf"
        ? t("Later nights omit the steps marked “First night only”. Calls stay in this order after deaths; a role with nobody able to act receives a hidden 7–15 second pause.", "之后的夜晚不再进行“仅首夜”步骤。角色出局后仍按此顺序播报；无人能行动时，后台随机等待7–15秒。")
        : t("Follow your starting or copied role even if your card moves. Every scheduled call still happens when its card is in the center; empty turns receive a hidden 7–15 second pause. The order does not reveal who has a role.", "即使身份牌被交换，也按初始或复制身份行动。角色牌在中央时仍会照常播报；无人行动时，后台随机等待7–15秒。此顺序不会透露谁持有某个角色。")}</p>
    </> : <>
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
    </>}
  </div>;
}
