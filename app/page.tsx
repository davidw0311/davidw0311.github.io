import {
  ArrowUpRight,
  Binoculars,
  CardsThree,
  EnvelopeSimple,
  FacebookLogo,
  FileText,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  PianoKeys,
  Translate,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import { InitialLanding } from "@/components/InitialLanding";
import { Navigation } from "@/components/Navigation";
import { Reveal } from "@/components/Reveal";
import { ViewportPositionKeeper } from "@/components/ViewportPositionKeeper";
import { education, experiences, photos, socialLinks } from "@/data/portfolio";
import { projects } from "@/data/projects";
import styles from "./page.module.css";

const featuredProjects = projects.filter((project) => project.featured);

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <InitialLanding />
      <ViewportPositionKeeper />
      <Atmosphere />
      <Navigation />

      <main id="main-content" className={styles.page}>
        <section id="space" className={styles.space} aria-labelledby="space-title" data-viewport-anchor>
          <div className={styles.starField} aria-hidden="true" />
          <div className={styles.spaceOrbit} aria-hidden="true" />
          <Reveal className={styles.spaceContent}>
            <p className={styles.eyebrow}>Beyond the horizon</p>
            <h2 id="space-title">Future missions begin here.</h2>
            <p>A reserved launch deck for experiments and project worlds still taking shape.</p>
            <div className={styles.missionIcons} aria-label="Interactive projects and future project placeholders">
              <Link href="/projects/blackjack-trainer/">
                <CardsThree size={34} weight="thin" />
                <span>Back to Blackjack</span>
              </Link>
              <Link href="/projects/language-lab/">
                <Translate size={34} weight="thin" />
                <span>Language lab</span>
              </Link>
              <Link href="/projects/piano-party/">
                <PianoKeys size={34} weight="thin" />
                <span>Piano Party</span>
              </Link>
              <div><Binoculars size={34} weight="thin" /><span>Deep observation</span></div>
            </div>
            <a className={styles.secondaryButton} href="#about">Return to the lake</a>
          </Reveal>
        </section>

        <section id="about" className={styles.hero} aria-labelledby="hero-title" data-viewport-anchor>
          <Image
            className={styles.heroMountain}
            src="/assets/mountain2/foggy_mountain.svg"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroMist} aria-hidden="true" />
          <div className={styles.heroLake} aria-hidden="true" />
          <div className={styles.heroInner}>
            <Reveal className={styles.heroCopy}>
              <p className={styles.eyebrow}>David Yuchen Wang</p>
              <h1 id="hero-title">Engineering ideas into intelligent systems.</h1>
              <p>
                I studied Engineering Physics at UBC and completed a Master of Computing in Artificial Intelligence at NUS. I build real-world machine-learning systems that can improve people&apos;s lives.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href="#projects">View projects</a>
                <a className={styles.secondaryButton} href={socialLinks.resume} target="_blank" rel="noopener noreferrer">
                  <FileText size={18} weight="bold" /> Resume
                </a>
              </div>
            </Reveal>
            <Reveal className={styles.portraitWrap} delay={0.14}>
              <Image
                className={styles.portrait}
                src="/assets/img/profile_photo/profile3.png"
                alt="Portrait of David Yuchen Wang"
                width={722}
                height={716}
                priority
                sizes="(max-width: 767px) 108px, (max-width: 1023px) 22vw, 24vw"
              />
              <span className={styles.portraitRing} aria-hidden="true" />
            </Reveal>
          </div>
        </section>

        <div className={styles.surface} aria-hidden="true" data-viewport-anchor>
          <div className={styles.surfaceImage} aria-hidden="true">
            <Image src="/assets/generated/ocean-descent.png" alt="" fill sizes="100vw" />
          </div>
        </div>

        <section id="projects" className={`${styles.section} ${styles.projects}`} aria-labelledby="projects-title" data-viewport-anchor>
          <Reveal className={styles.sectionHeading}>
            <h2 id="projects-title">Selected projects</h2>
            <p>Research, machines, and software built to leave the diagram and work in the real world.</p>
          </Reveal>

          <div className={styles.featuredGrid}>
            {featuredProjects.map((project, index) => (
              <Reveal key={project.slug} className={styles.projectReveal} delay={Math.min(index * 0.04, 0.16)} viewportAnchor>
                <Link className={styles.projectCard} href={`/projects/${project.slug}/`}>
                  <div className={styles.projectImage}>
                    <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 767px) 100vw, 50vw" />
                  </div>
                  <div className={styles.projectText}>
                    <span>{project.category}</span>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <span className={styles.projectLink}>Explore project <ArrowUpRight size={18} weight="bold" /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal className={styles.projectIndex} viewportAnchor>
            <h3>Project archive</h3>
            <div className={styles.projectIndexGrid}>
              {projects.filter((project) => !project.featured).map((project) => (
                <Link key={project.slug} href={`/projects/${project.slug}/`}>
                  <span>{project.category}</span>
                  <strong>{project.title}</strong>
                  <ArrowUpRight size={17} weight="bold" />
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="publications" className={`${styles.section} ${styles.publication}`} aria-labelledby="publication-title" data-viewport-anchor>
          <Reveal className={styles.publicationVisual} viewportAnchor>
            <Link
              className={styles.publicationVisualLink}
              href="/publications/accelerator-tuning-poster/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the full accelerator tuning poster in a new page"
            >
              <span className={styles.publicationPosterFrame}>
                <Image
                  src="/assets/img/triumf_acot_poster.jpg"
                  alt="Poster presentation for accelerator tuning with deep reinforcement learning"
                  fill
                  sizes="(max-width: 767px) calc(100vw - 32px), 45vw"
                />
              </span>
              <span className={styles.publicationVisualCaption}>
                Open full poster <ArrowUpRight size={17} weight="bold" />
              </span>
            </Link>
          </Reveal>
          <Reveal className={styles.publicationCopy} delay={0.1} viewportAnchor>
            <p className={styles.eyebrow}>NeurIPS 2021</p>
            <h2 id="publication-title">Accelerator Tuning With Deep Reinforcement Learning</h2>
            <p>
              During my time as a junior machine-learning engineer at TRIUMF, I wrote and published this paper at the NeurIPS Workshop on Machine Learning and the Physical Sciences. I also presented the work at the Advisory Committee on TRIUMF in 2021.
            </p>
            <div className={styles.linkCluster}>
              <a href="https://ml4physicalsciences.github.io/2021/files/NeurIPS_ML4PS_2021_125.pdf" target="_blank" rel="noopener noreferrer">Read paper <ArrowUpRight size={17} /></a>
              <a href="https://slideslive.com/38971739" target="_blank" rel="noopener noreferrer">Watch talk <ArrowUpRight size={17} /></a>
              <Link href="/publications/accelerator-tuning-poster/" target="_blank" rel="noopener noreferrer">View poster <ArrowUpRight size={17} /></Link>
            </div>
          </Reveal>
        </section>

        <section id="experiences" className={`${styles.section} ${styles.experience}`} aria-labelledby="experience-title" data-viewport-anchor>
          <Reveal className={styles.sectionHeading}>
            <h2 id="experience-title">Experience under pressure</h2>
            <p>From accelerator control rooms to crop fields, I work where software meets complex physical systems.</p>
          </Reveal>
          <div className={styles.experienceGroups}>
            <div>
              <h3>Industry and research</h3>
              {experiences.slice(0, 6).map((experience, index) => (
                <ExperienceItem key={`${experience.organization}-${experience.period}`} experience={experience} open={index === 0} />
              ))}
            </div>
            <div>
              <h3>Teaching and teams</h3>
              {experiences.slice(6).map((experience) => (
                <ExperienceItem key={`${experience.organization}-${experience.period}`} experience={experience} />
              ))}
            </div>
          </div>
        </section>

        <section id="education" className={`${styles.section} ${styles.education}`} aria-labelledby="education-title" data-viewport-anchor>
          <Reveal className={styles.sectionHeading}>
            <h2 id="education-title">Built from first principles</h2>
            <p>A foundation spanning artificial intelligence, computation, physics, electronics, mechanics, and commerce.</p>
          </Reveal>
          <div className={styles.educationGrid}>
            {education.map((school, index) => (
              <Reveal key={school.school} className={styles.school} delay={index * 0.08} viewportAnchor>
                <div className={styles.schoolHeader}>
                  <Image src={school.logo} alt={school.logoAlt} width={160} height={100} />
                  <div>
                    <p>{school.period}</p>
                    <h3>{school.school}</h3>
                    <strong>{school.degree}</strong>
                    <span>{school.focus}</span>
                  </div>
                </div>
                <details className={styles.courseDisclosure}>
                  <summary>Explore coursework</summary>
                  <div className={styles.courseTerms}>
                    {school.courses.map((group) => (
                      <section key={group.term}>
                        <h4>{group.term}</h4>
                        <ul>
                          {group.courses.map((course) => <li key={course}>{course}</li>)}
                        </ul>
                      </section>
                    ))}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="interests" className={`${styles.section} ${styles.interests}`} aria-labelledby="interests-title" data-viewport-anchor>
          <Reveal className={styles.sectionHeading}>
            <h2 id="interests-title">Looking beyond the work</h2>
            <p>Photography keeps me attentive to light, scale, weather, and the quiet geometry of the natural world.</p>
          </Reveal>
          <div className={styles.photoGrid}>
            {photos.map((photo, index) => (
              <Reveal key={photo.src} className={styles.photoReveal} delay={Math.min(index * 0.025, 0.15)} viewportAnchor>
                <a className={styles.photo} href={photo.src} target="_blank" rel="noopener noreferrer">
                  <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 100vw, 33vw" />
                  <span>{photo.title}</span>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal className={styles.musicLink}>
            <YoutubeLogo size={28} weight="thin" />
            <div><h3>Music</h3><p>Recordings and experiments live on my YouTube channel.</p></div>
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">Visit channel <ArrowUpRight size={17} /></a>
          </Reveal>
        </section>

        <footer className={styles.footer} data-viewport-anchor>
          <Reveal className={styles.footerInner} viewportAnchor>
            <h2>Let&apos;s build something that matters.</h2>
            <a className={styles.primaryButton} href={socialLinks.email}><EnvelopeSimple size={19} weight="bold" /> Get in touch</a>
            <div className={styles.socials} aria-label="Social links">
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GithubLogo size={24} /></a>
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedinLogo size={24} /></a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramLogo size={24} /></a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookLogo size={24} /></a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><YoutubeLogo size={24} /></a>
            </div>
            <details className={styles.wechat}>
              <summary>Connect on WeChat</summary>
              <Image src="/assets/img/wechatcode.jpg" alt="David Wang's WeChat QR code" width={240} height={240} />
            </details>
            <small>Designed and built by David Yuchen Wang.</small>
          </Reveal>
        </footer>
      </main>
    </>
  );
}

function ExperienceItem({ experience, open = false }: { experience: (typeof experiences)[number]; open?: boolean }) {
  return (
    <details className={styles.experienceItem} open={open} data-viewport-anchor>
      <summary>
        <span>{experience.period}</span>
        <strong>{experience.role}</strong>
        <em>{experience.organization}</em>
      </summary>
      <div className={styles.experienceBody}>
        {experience.image && experience.imageAlt && (
          <Image src={experience.image} alt={experience.imageAlt} width={560} height={360} />
        )}
        <div>
          {experience.summary && <p>{experience.summary}</p>}
          <ul>{experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
          <div className={styles.tags}>{experience.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          {experience.href && <a href={experience.href} target="_blank" rel="noopener noreferrer">Course details <ArrowUpRight size={16} /></a>}
        </div>
      </div>
    </details>
  );
}
