import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProject } from "@/data/projects";
import styles from "./project.module.css";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [{ url: project.image, alt: project.imageAlt }],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const currentIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Project navigation">
        <Link href="/#projects"><ArrowLeft size={18} weight="bold" /> All projects</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>{project.category}</p>
          <h1>{project.title}</h1>
          <strong>{project.summary}</strong>
          <div className={styles.tags}>{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
        <div className={styles.heroImage}>
          <Image src={project.image} alt={project.imageAlt} fill priority sizes="(max-width: 767px) 100vw, 50vw" />
        </div>
      </header>

      <article className={styles.article}>
        <div className={styles.story}>
          <h2>Project story</h2>
          {project.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {project.links && (
            <div className={styles.links}>
              {project.links.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label} <ArrowUpRight size={17} weight="bold" />
                </a>
              ))}
            </div>
          )}
        </div>

        {project.media && project.media.length > 0 && (
          <section className={styles.gallery} aria-labelledby="gallery-title">
            <h2 id="gallery-title">Inside the work</h2>
            <div className={styles.galleryGrid}>
              {project.media.map((media) => (
                <figure key={media.src}>
                  {media.kind === "video" ? (
                    <video controls muted loop playsInline aria-label={media.alt}>
                      <source src={media.src} type="video/mp4" />
                    </video>
                  ) : (
                    <Image src={media.src} alt={media.alt} width={1400} height={1000} sizes="(max-width: 767px) 100vw, 50vw" />
                  )}
                  {media.caption && <figcaption>{media.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}
      </article>

      <footer className={styles.nextProject}>
        <p>Continue exploring</p>
        <Link href={`/projects/${nextProject.slug}/`}>
          <span>{nextProject.category}</span>
          <strong>{nextProject.title}</strong>
          <ArrowUpRight size={28} weight="thin" />
        </Link>
      </footer>
    </main>
  );
}
