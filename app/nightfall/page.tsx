import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CardsThree, Moon, SunHorizon } from "@phosphor-icons/react/dist/ssr";
import styles from "./nightfall.module.css";

export const metadata: Metadata = {
  title: "Nightfall / 天黑请闭眼",
  description: "Choose your night: classic Werewolf or One Night Werewolf. Private games with friends, secret roles, and narration in English and Chinese.",
  alternates: { canonical: "/nightfall/" },
};

export default function NightfallPage() {
  return (
    <div className={styles.page}>
      <a href="#games" className={styles.skipLink}>Skip to games / 跳至游戏</a>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/#space" className={styles.backLink}>
            <ArrowLeft size={18} aria-hidden="true" />
            <span>All projects <span lang="zh-Hans">/ 所有项目</span></span>
          </Link>
          <span className={styles.languages}>English <span>/</span> 中文</span>
        </header>

        <main>
          <div className={styles.introduction}>
            <Moon className={styles.brandIcon} size={38} weight="duotone" aria-hidden="true" />
            <h1>Nightfall <span lang="zh-Hans">天黑请闭眼</span></h1>
            <p>Gather your friends. Choose your game.<span lang="zh-Hans">朋友就位，好戏开场。</span></p>
          </div>

          <section className={styles.games} id="games" aria-label="Choose a game / 选择游戏">
            <Link href="/werewolf/" className={styles.gameCard}>
              <div className={`${styles.cardArt} ${styles.werewolfArt}`} aria-hidden="true">
                <span className={styles.moonDisc} />
                <span className={styles.wolfHead} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <h2>Werewolf <span lang="zh-Hans">狼人杀</span></h2>
                  <ArrowUpRight className={styles.cardArrow} size={27} aria-hidden="true" />
                </div>
                <p>Read the room. Survive the night. Find the wolves before they find you.</p>
                <p lang="zh-Hans" className={styles.chineseCopy}>多轮昼夜，隐藏身份。在推理与伪装中寻找狼人。</p>
                <div className={styles.cardFacts}>
                  <span>Multiple nights <span lang="zh-Hans">/ 多轮对局</span></span>
                  <span>Voice moderator <span lang="zh-Hans">/ 语音法官</span></span>
                </div>
              </div>
            </Link>

            <Link href="/nightfall/one-night/" className={`${styles.gameCard} ${styles.oneNightCard}`}>
              <div className={`${styles.cardArt} ${styles.oneNightArt}`} aria-hidden="true">
                <SunHorizon className={styles.horizon} size={190} weight="thin" />
                <CardsThree className={styles.secretCards} size={114} weight="duotone" />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <h2>One Night Werewolf <span lang="zh-Hans">一夜狼人杀</span></h2>
                  <ArrowUpRight className={styles.cardArrow} size={27} aria-hidden="true" />
                </div>
                <p>One night. One vote. Your card may change, but everyone stays for the reveal.</p>
                <p lang="zh-Hans" className={styles.chineseCopy}>一夜交换身份，一票揭晓真相。没有提前出局，全员参与到底。</p>
                <div className={styles.cardFacts}>
                  <span>One round <span lang="zh-Hans">/ 一局一夜</span></span>
                  <span>Kokoro narration <span lang="zh-Hans">/ 双语播报</span></span>
                </div>
              </div>
            </Link>
          </section>
        </main>

        <footer className={styles.footer}>
          <span>For friends around the same table.<span lang="zh-Hans"> 为同桌的朋友而做。</span></span>
          <span>Wolf artwork: <a href="https://game-icons.net/1x1/lorc/wolf-head.html" target="_blank" rel="noreferrer">Lorc</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></span>
        </footer>
      </div>
    </div>
  );
}
