import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { brandName, href, routes, photos, pages, guideKeys, locations, services, testimonials, quoteItems, quoteEmail, type PageKey } from '@/data/firestar/content';
import { ProductText, LocationDetails } from '../SourceContent';
import { CatalogueNavigation } from './Navigation';
import { Exhibition } from './Exhibition';
import s from './catalogue.module.css';

function Photo({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return <div className={`${s.photo} ${className}`}><Image src={src.replace(/\.jpe?g$/i, '.webp')} alt={alt} fill priority={priority} sizes="(max-width: 800px) 100vw, 80vw" /></div>;
}
function LinkButton({ page, children }: { page: PageKey; children: React.ReactNode }) {
  return <Link className={s.linkButton} href={href('v2', page)}>{children}<ArrowUpRight size={20} /></Link>;
}
function PageTitle({ current, title }: { current: PageKey; title?: string }) {
  return <div className={s.pageTitle}><p>{routes[current].title} / Firestar catalogue</p><h1>{title || routes[current].title}</h1></div>;
}
function ProductIndex() {
  return <div className={s.productIndex}>{guideKeys.map((key, i) => <Link href={href('v2', key)} key={key}><span>{String(i + 1).padStart(2, '0')}</span><strong>{routes[key].title}</strong><span>{key === 'p1' ? 'Featured material' : key === 'p2' ? 'Natural stone' : 'The details'}</span><ArrowUpRight size={25} /></Link>)}</div>;
}
function About() {
  return <section className={s.manifesto}><p className={s.kicker}>The people behind the surface</p><h2>INDIVIDUAL SERVICE.<br />EXACTING CRAFT.</h2><div className={s.storyColumns}>{pages.home.slice(0, 5).map(p => <p key={p}>{p}</p>)}</div><p className={s.finePrint}>{pages.home[5]}</p><LinkButton page="showroom">Inside our workshop</LinkButton></section>;
}
function Home() {
  return <>
    <section className={s.hero}><div className={s.heroTop}><span>Custom quartz surfaces</span><span>Nanaimo / Vancouver Island</span></div><div className={s.heroStage}><Photo src={photos['1.jpg']} alt="A custom stone kitchen from the Firestar project archive" priority /><div className={s.heroOverlay}><p>A material. A thousand possibilities.</p><h1>QUARTZ.</h1><Link className={s.roundLink} href={href('v2', 'p1')} aria-label="Explore quartz"><ArrowUpRight size={38} /></Link></div></div><div className={s.heroBottom}><p>Custom quartz countertops for kitchens, bathrooms, and the details that make a space your own.</p><Link href={href('v2', 'p1')}>Explore the material <ArrowRight size={20} /></Link></div></section>
    <section className={s.catalogueIntro}><div><p className={s.kicker}>Material library</p><h2>THE CHOICE.<br />THE FINISH.<br />THE FEEL.</h2><p>Quartz first. Granite, marble, and onyx, too. Get to know the materials before you make them yours.</p></div><ProductIndex /></section>
    <section className={s.workRibbon}><Link href={href('v2', 'kitchen')}><Photo src={photos['5.jpg']} alt="Firestar kitchen project" /><span>Kitchen <ArrowUpRight size={24} /></span></Link><Link href={href('v2', 'bathroom')}><Photo src={photos['images/u.jpg']} alt="Firestar bathroom project" /><span>Bathroom <ArrowUpRight size={24} /></span></Link><Link href={href('v2', 'other')}><Photo src={photos['images/fireplace.jpg']} alt="Firestar fireplace project" /><span>Beyond countertops <ArrowUpRight size={24} /></span></Link></section>
    <About /><section className={s.visitBanner}><div><p className={s.kicker}>Two places to begin</p><h2>SEE THE<br />POSSIBILITIES.</h2></div><div><p>Full slabs. Showroom samples. Your ideas.</p><LinkButton page="showroom">Visit our showrooms</LinkButton><a href="tel:+12507291447">250-729-1447</a></div></section>
  </>;
}
function Services() {
  return <><PageTitle current="services" title="NO ORDINARY SURFACES." /><div className={s.servicesIntro}><p>{pages.services[0]}</p><p>Limited only by your imagination.</p></div><div className={s.serviceChapters}>{services.map((service, i) => <details key={service} open={i === 0}><summary><span>0{i + 1}</span><h2>{service}</h2><span>+</span></summary><div><Photo src={[photos['1.jpg'], photos['images/fireplace.jpg'], photos['images/bbq.jpg'], photos['images/u.jpg'], photos['images/10.jpg'], photos['SDC10182-s.JPG']][i]} alt={service + ' from the original Firestar gallery'} /><div><p>{pages.services[9]}</p><LinkButton page="contact">Discuss your project</LinkButton></div></div></details>)}</div><div className={s.serviceEnd}><p>{pages.services[8]}</p><LinkButton page="testimonials">Customer testimonials</LinkButton></div></>;
}
function Products() {
  return <><PageTitle current="products" title="MATERIAL MATTERS." /><div className={s.featureMaterial}><div className={s.materialType}><span>Featured material</span><h2>Quartz</h2><p>Colors and designs to suit your space. Custom surfaces for the way you live.</p><LinkButton page="p1">The quartz guide</LinkButton></div><Photo src={photos['images/dsc07624.jpg']} alt="Close view of stone from the original project archive" /></div><section className={s.library}><h2>Specifications & care</h2><ProductIndex /></section></>;
}
function Showrooms() {
  return <><PageTitle current="showroom" title="MEET YOUR MATERIAL." /><Photo src={photos['SDC10182-s.JPG']} alt="Full slabs at the Nanaimo workshop" className={s.shopWide} /><section className={s.locationPanels}>{locations.map((place, i) => <article key={place.name}><span>0{i + 1}</span><h2>{place.name}</h2><LocationDetails index={i} /></article>)}</section><section className={s.workshopStory}><h2>Our Showroom & Shop</h2>{pages.showroom.slice(1, 5).map(p => <p key={p}>{p}</p>)}</section></>;
}
function Contact() {
  return <><PageTitle current="contact" title="LET’S MAKE IT." /><section className={s.contactHero}><a href="tel:+12507291447">250-729-1447 <ArrowUpRight size={38} /></a><a href="tel:+12506199968">250-619-9968 <ArrowUpRight size={38} /></a><a className={s.email} href="mailto:sales@infinitegranite.ca">sales@infinitegranite.ca</a><span>Office / Showroom · Fax: 250-740-1046</span></section><section className={s.quoteBrief}><div><p className={s.kicker}>Project brief</p><h2>START WITH<br />THE DETAILS.</h2><p>To receive an accurate quote please supply:</p></div><ol>{quoteItems.map(p => <li key={p}>{p}</li>)}</ol><a href={quoteEmail} className={s.linkButton}>Prepare quote email <ArrowUpRight size={22} /></a><small>Opens your email app. Attach plans and measurements before sending.</small></section><div className={s.locationPanels}>{locations.map((place, i) => <article key={place.name}><h2>{place.name}</h2><LocationDetails index={i} /></article>)}</div></>;
}
function Guide({ current }: { current: PageKey }) {
  return <><PageTitle current={current} /><nav className={s.libraryTabs} aria-label="Product guides">{guideKeys.map(key => <Link key={key} href={href('v2', key)} aria-current={key === current ? 'page' : undefined}>{routes[key].title}</Link>)}</nav><div className={s.readingDesk}><div className={s.readingLabel}><span>Material notes</span><p>{current === 'p1' ? 'Custom quartz, considered in detail.' : 'The details behind your surface.'}</p><LinkButton page="contact">Ask a question</LinkButton></div><article className={s.productText}><ProductText current={current} /></article></div></>;
}
function Testimonials() {
  return <><PageTitle current="testimonials" title="THE WORD ON OUR WORK." /><div className={s.testimony}>{testimonials.map((t, i) => <article key={t.author}><span>{String(i + 1).padStart(2, '0')}</span><blockquote><p>{t.quote}</p><cite>{t.author}</cite></blockquote></article>)}</div></>;
}
function Footer() {
  return <footer className={s.footer}><div><strong>{brandName}</strong><span>Individual service. Superior craftsmanship.</span></div><div><a href="mailto:sales@infinitegranite.ca">sales@infinitegranite.ca</a><a href="tel:+12506199968">250-619-9968</a><span>Fax: 250-740-1046</span></div><p>2156 Akenhead Road, Nanaimo, BC V9X 1T9</p><small>Copyright 2023 Infinitegranite.ca</small><Link href="/#projects">Back to projects ↗</Link></footer>;
}
export function CatalogueSite({ current }: { current: PageKey }) {
  return <div className={s.site}><a className={s.skip} href="#catalogue-content">Skip to content</a><CatalogueNavigation current={current} /><main id="catalogue-content" className={s.canvas}>
    {current === 'home' && <Home />}{current === 'services' && <Services />}{current === 'products' && <Products />}{current === 'showroom' && <Showrooms />}{current === 'contact' && <Contact />}{current === 'testimonials' && <Testimonials />}{guideKeys.includes(current) && <Guide current={current} />}
    {['gallery', 'kitchen', 'bathroom', 'other'].includes(current) && <><PageTitle current={current} title={current === 'gallery' ? 'THE PROJECT ARCHIVE.' : routes[current].title} /><Exhibition key={current} initial={current === 'gallery' ? 'all' : current as 'kitchen' | 'bathroom' | 'other'} /></>}
    <Footer />
  </main></div>;
}
