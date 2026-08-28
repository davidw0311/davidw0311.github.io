import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./poster.module.css";

const posterPath = "/assets/img/triumf_acot_poster.jpg";

export const metadata: Metadata = {
  title: "Accelerator Tuning Poster",
  description: "Full poster for Accelerator Tuning With Deep Reinforcement Learning, presented at NeurIPS 2021.",
  alternates: { canonical: "/publications/accelerator-tuning-poster/" },
  openGraph: {
    title: "Accelerator Tuning With Deep Reinforcement Learning",
    description: "Full NeurIPS 2021 poster by David Yuchen Wang.",
    images: [{ url: posterPath, width: 4494, height: 3175, alt: "Accelerator tuning research poster" }],
  },
};

export default function AcceleratorTuningPosterPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Poster navigation">
        <Link href="/#publications">
          <ArrowLeft size={18} weight="bold" /> Back to publication
        </Link>
        <a href={posterPath} target="_blank" rel="noopener noreferrer">
          Open original image <ArrowSquareOut size={18} weight="bold" />
        </a>
      </nav>

      <header className={styles.header}>
        <p>NeurIPS 2021</p>
        <h1>Accelerator Tuning With Deep Reinforcement Learning</h1>
        <span>The complete poster is fitted below. Zoom the page or open the original image to inspect the details.</span>
      </header>

      <figure className={styles.poster}>
        <Image
          src={posterPath}
          alt="Full research poster for accelerator tuning with deep reinforcement learning"
          width={4494}
          height={3175}
          priority
          sizes="(max-width: 767px) calc(100vw - 24px), min(94vw, 1600px)"
        />
        <figcaption>Full poster presented at the NeurIPS 2021 Workshop on Machine Learning and the Physical Sciences.</figcaption>
      </figure>
    </main>
  );
}
