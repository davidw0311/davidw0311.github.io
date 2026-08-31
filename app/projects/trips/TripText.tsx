import styles from "./trips.module.css";

export function TripText({ en, zh }: { en: string; zh: string }) {
  return (
    <>
      <span className={styles.langEnglish}>{en}</span>
      <span className={styles.langChinese} lang="zh-Hans">{zh}</span>
    </>
  );
}
