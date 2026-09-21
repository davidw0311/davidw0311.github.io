import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import voiceData from "@/data/regiusAuditionVoices.json";
import music from "@/data/regiusAuditionMusic.json";
import { AudioAuditions } from "./player";
import styles from "./auditions.module.css";

export const metadata: Metadata = {title:"Völuspá · Listening room (draft)",robots:{index:false,follow:false}};
export default function AudioLabPage() {
 return <main id="book-content" className={styles.page}>
  <Link className={styles.back} href="/projects/codex-regius/voluspa/">← Back to Völuspá</Link>
  <header className={styles.header}>
   <div><p className={styles.eyebrow}>Völuspá · Audio draft</p><h1>The listening room</h1><p>Ten soundtracks. Ten voices. Find the combination that brings the story to life.</p></div>
   <Image src="/assets/codex-regius/voluspa.webp" alt="The seeress beneath visions of the Norse world" width={180} height={225} priority />
  </header>
  <AudioAuditions paragraph={voiceData.paragraph} voices={voiceData.voices} music={music} />
 </main>;
}
