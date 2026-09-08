import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Phone, MapPin, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr';
import { href, routes, pages, photos, services, guideKeys, locations, quoteItems, quoteEmail, testimonials, type PageKey, type Version } from '@/data/firestar/content';
import { Header } from './Header';
import { Gallery } from './Gallery';
import styles from './firestar.module.css';

function Photo({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return <div className={`${styles.photo} ${className}`}><Image src={src.replace(/\.(jpe?g)$/i, '.webp')} alt={alt} fill priority={priority} sizes="(max-width: 767px) 100vw, 65vw" /></div>;
}
function Action({ version, page, children, quiet = false }: { version: Version; page: PageKey; children: React.ReactNode; quiet?: boolean }) {
  return <Link className={quiet ? styles.textLink : styles.button} href={href(version, page)}>{children}<ArrowUpRight size={19} /></Link>;
}
function Locations() {
  return <div className={styles.locations}>{locations.map(location => <article key={location.name}>
    <MapPin size={25} weight="light" /><h3>{location.name}</h3><p className={styles.locationType}>{location.type}</p>
    <address>{location.address}<br />{location.city}</address>
    <dl>{location.hours.map(([day, time]) => <div key={day}><dt>{day}</dt><dd>{time}</dd></div>)}</dl>
    <a className={styles.textLink} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address + ', ' + location.city)}`} target="_blank" rel="noopener noreferrer">Get directions <ArrowUpRight size={18} /></a>
  </article>)}</div>;
}
function Hero({ version }: { version: Version }) {
  const title = version === 'v1' ? <>Stone, made<br /><em>personal.</em></> : version === 'v2' ? <>Extraordinary<br />by nature.</> : <>BIG IDEAS.<br /><span>SOLID STONE.</span></>;
  const picture = version === 'v2' ? photos['110823064452_mercier1.jpg'] : version === 'v3' ? photos['1.jpg'] : photos['5.jpg'];
  return <section className={styles.hero}>
    <div className={styles.heroCopy}>
      <p className={styles.eyebrow}>Custom stone. Vancouver Island.</p>
      <h1>{title}</h1>
      <p className={styles.heroDescription}>Quartz, granite, marble, and onyx. Crafted in Nanaimo, for the way you live.</p>
      <div className={styles.heroActions}><Action version={version} page="gallery">Explore our work</Action><Action version={version} page="showroom" quiet>Visit our showroom</Action></div>
    </div>
    <Photo src={picture} alt="Custom stone kitchen countertops from the Firestar Granite project gallery" className={styles.heroPhoto} priority />
    {version === 'v1' && <div className={styles.heroNote}><span>Natural character.</span><span>Individual craftsmanship.</span></div>}
    {version === 'v2' && <div className={styles.heroFoot}><span>Quartz / Granite / Marble / Onyx</span><span>Made in Nanaimo, BC</span></div>}
    {version === 'v3' && <div className={styles.studioNote}><p>YOUR HOME.<br />YOUR STONE.<br />YOUR POSSIBILITIES.</p><span>Custom fabrication<br />& installation</span></div>}
  </section>;
}
function About({ version }: { version: Version }) {
  return <section className={`${styles.section} ${styles.about}`}>
    <div className={styles.aboutTitle}><p className={styles.eyebrow}>The Firestar approach</p><h2>A natural choice<br />for your home.</h2><Action version={version} page="services" quiet>Discover our services</Action></div>
    <div className={styles.aboutCopy}><p className={styles.lead}>{pages.home[0]}</p>{pages.home.slice(1, 5).map(p => <p key={p}>{p}</p>)}<small>{pages.home[5]}</small></div>
  </section>;
}
const materialCards = [
  { key: 'p1' as const, title: 'Quartz', sub: 'Versatile surfaces for everyday living', src: photos['images/o.jpg'] },
  { key: 'p2' as const, title: 'Granite', sub: 'Natural stone with individual character', src: photos['images/10.jpg'] },
  { key: 'p6' as const, title: 'Marble & onyx', sub: 'Distinctive materials. Considered care.', src: photos['images/dsc07624.jpg'] },
];
function Materials({ version, full = false }: { version: Version; full?: boolean }) {
  return <section className={`${styles.section} ${styles.materials}`}>
    {!full && <div className={styles.sectionTitle}><p className={styles.eyebrow}>Products</p><h2>Find your stone.</h2><p>Hundreds of possibilities. A choice that is entirely yours.</p></div>}
    <div className={styles.materialGrid}>{materialCards.map((material, index) => <Link className={styles.materialCard} href={href(version, material.key)} key={material.title}>
      <Photo src={material.src} alt="Stone surface from the original Firestar Granite project gallery" />
      <div><span className={styles.materialNumber}>0{index + 1}</span><h3>{material.title}</h3><ArrowUpRight size={25} /><p>{material.sub}</p></div>
    </Link>)}</div>
    {full && <div className={styles.productResources}><h2>Know your surface.</h2><p>Find out information about our products, finishes, and care.</p><div className={styles.resourceGrid}>{guideKeys.map(key => <Link key={key} href={href(version, key)}>{routes[key].title}<ArrowUpRight size={22} /></Link>)}</div></div>}
  </section>;
}
function ServiceContent({ version, full = false }: { version: Version; full?: boolean }) {
  return <section className={`${styles.section} ${styles.services}`}>
    <div className={styles.serviceHeading}><p className={styles.eyebrow}>Made for your space</p><h2>Limited only by<br />your imagination.</h2><p>{pages.services[0]}</p>{!full && <Action version={version} page="services" quiet>Discover our services</Action>}</div>
    <div className={styles.serviceList}>{services.map((service, i) => <div key={service}><span>0{i + 1}</span><h3>{service}</h3></div>)}<p>{pages.services[8]}</p><p>{pages.services[9]}</p>{full && <Action version={version} page="testimonials" quiet>Read testimonials</Action>}</div>
  </section>;
}
function GalleryPreview({ version }: { version: Version }) {
  return <section className={`${styles.section} ${styles.galleryPreview}`}>
    <div className={styles.sectionTitle}><h2>Stone in its element.</h2><p>Kitchens, bathrooms, and possibilities beyond the everyday.</p></div>
    <div className={styles.previewGrid}>
      <Link href={href(version, 'kitchen')}><Photo src={photos['1.jpg']} alt="Black stone island and countertops in a Firestar kitchen" /><h3>Kitchen <ArrowUpRight size={24} /></h3></Link>
      <Link href={href(version, 'bathroom')}><Photo src={photos['images/u.jpg']} alt="White vessel sinks on a custom bathroom countertop" /><h3>Bathroom <ArrowUpRight size={24} /></h3></Link>
      <Link href={href(version, 'other')}><Photo src={photos['images/fireplace.jpg']} alt="Custom stone fireplace surround and mantel" /><h3>Others <ArrowUpRight size={24} /></h3></Link>
    </div>
    <Action version={version} page="gallery" quiet>Explore our work</Action>
  </section>;
}
function Showroom({ version, full = false }: { version: Version; full?: boolean }) {
  return <section className={`${styles.section} ${styles.showroom}`}>
    <div className={styles.showroomIntro}><Photo src={photos['SDC10182-s.JPG']} alt="Slabs of natural stone outside Firestar Granite's Nanaimo workshop" /><div><p className={styles.eyebrow}>Come visit our showroom</p><h2>See it. Feel it.<br />Make it yours.</h2><p>{pages.showroom[3]}</p>{!full && <Action version={version} page="showroom" quiet>Visit our showroom</Action>}{full && <p>{pages.showroom[4]}</p>}</div></div>
    {full && <div className={styles.shopStory}><div><h3>Our Showroom & Shop</h3><p>{pages.showroom[1]}</p></div><div><h3>Crafted in-house.</h3><p>{pages.showroom[2]}</p></div></div>}
    <Locations />
  </section>;
}
function Quote({ version }: { version: Version }) {
  return <section className={`${styles.section} ${styles.quote}`}><div className={styles.quoteMark} aria-hidden="true">“</div><blockquote><p>Our Sincere thanks for the excellent service and beautiful countertops. Working with you has been a great experience!</p><cite>Tina & Greg Valliere</cite></blockquote><Action version={version} page="testimonials" quiet>Read testimonials</Action></section>;
}
function Contact() {
  return <section className={`${styles.section} ${styles.contact}`}>
    <div className={styles.contactDetails}><h2>Let’s talk stone.</h2><p>Office/Showroom</p><a className={styles.phone} href="tel:+12507291447">250-729-1447 <Phone size={26} /></a><a className={styles.phone} href="tel:+12506199968">250-619-9968 <Phone size={26} /></a><a className={styles.email} href="mailto:sales@infinitegranite.ca">sales@infinitegranite.ca <EnvelopeSimple size={22} /></a><p>Fax: 250-740-1046</p></div>
    <div className={styles.quoteChecklist}><h2>Start with a quote.</h2><p>To receive an accurate quote please supply:</p><ul>{quoteItems.map(item => <li key={item}>{item}</li>)}</ul><a className={styles.button} href={quoteEmail}>Prepare quote email <ArrowUpRight size={20} /></a><p className={styles.emailHelp}>Opens your email app with a project checklist. Attach your plans before sending.</p></div>
    <Locations />
  </section>;
}
function Guide({ current, version }: { current: PageKey; version: Version }) {
  const paragraphs = pages[current as keyof typeof pages];
  let content;
  if (current === 'p3') content = <Image className={styles.profileChart} src={photos['all_profiles_granite_background_colour.jpg']} alt="Firestar Granite edge profiles: original illustrated profile selection chart" width={650} height={1100} />;
  else if (current === 'p1' || current === 'p2') {
    const introEnd = paragraphs.findIndex(p => p.startsWith('Below are'));
    const faqs: { question: string; answer: string[] }[] = [];
    const tail: string[] = [];
    for (const p of paragraphs.slice(introEnd + 1)) {
      if (p.endsWith('?')) faqs.push({ question: p, answer: [] });
      else if (p.startsWith('Check out') || p.startsWith('Granite Myths')) tail.push(p);
      else faqs.at(-1)?.answer.push(p);
    }
    content = <>{paragraphs.slice(1, introEnd).map(p => <p key={p}>{p}</p>)}<div className={styles.faqs}>{faqs.map(faq => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary>{faq.answer.map(p => <p key={p}>{p}</p>)}</details>)}</div>{tail.map(p => <p key={p}>{p}</p>)}</>;
  } else content = paragraphs.slice(current === 'p6' ? 0 : 1).map(p => <p key={p}>{p.startsWith('250-734') ? <a href="tel:+12507342681">{p}</a> : p.startsWith('www.sealtech') ? <a href="http://www.sealtechspecialties.com" target="_blank" rel="noopener noreferrer">{p}</a> : p}</p>);
  return <section className={`${styles.section} ${styles.guide}`}><aside><p>Product library</p>{guideKeys.map(key => <Link key={key} href={href(version, key)} aria-current={key === current ? 'page' : undefined}>{routes[key].title}<ArrowUpRight size={17} /></Link>)}</aside><article>{content}</article></section>;
}
function Testimonials() {
  return <section className={`${styles.section} ${styles.testimonials}`}>{testimonials.map((item, index) => <article key={item.author}><span className={styles.quoteMark} aria-hidden="true">“</span><blockquote><p>{item.quote}</p><cite>{item.author}</cite></blockquote><span className={styles.testimonialIndex}>{String(index + 1).padStart(2, '0')}</span></article>)}</section>;
}
function PageHeading({ current, version }: { current: PageKey; version: Version }) {
  const titles: Partial<Record<PageKey, string>> = { services: 'Made for the way you live.', products: 'A world of possibilities.', showroom: 'Get closer to your stone.', gallery: 'The work speaks for itself.', contact: 'Your next project starts here.', testimonials: 'In our customers’ words.' };
  return <section className={styles.pageHeading}><Link href={href(version)}>Home</Link><span>/ {routes[current].title}</span><h1>{titles[current] || routes[current].title}</h1></section>;
}
function Footer({ version }: { version: Version }) {
  return <footer className={styles.footer}><div className={styles.footerTop}><Link className={styles.wordmark} href={href(version)}>Firestar<span>Granite</span></Link><p>Individual service.<br />Superior craftsmanship.<br />Attention to detail.</p><div><a href="tel:+12507291447">250-729-1447</a><a href="tel:+12506199968">250-619-9968</a><a href="mailto:sales@infinitegranite.ca">sales@infinitegranite.ca</a></div><address>2156 Akenhead Road<br />Nanaimo, BC V9X 1T9<br /><span>Fax: 250-740-1046</span></address></div><div className={styles.footerBottom}><span>Copyright 2023 Infinitegranite.ca</span><span>Firestar Enterprises Ltd., formerly Infinite Granite Ltd.</span><Link href="/#projects">Back to projects <ArrowUpRight size={15} /></Link></div></footer>;
}
export function FirestarSite({ version, current }: { version: Version; current: PageKey }) {
  const isGallery = ['gallery', 'kitchen', 'bathroom', 'other'].includes(current);
  return <div className={`${styles.site} ${styles[version]}`}>
    <a href="#firestar-content" className={styles.skip}>Skip to content</a><Header key={`${version}-${current}`} version={version} current={current} />
    <main id="firestar-content">
      {current === 'home' ? <><Hero version={version} />{version === 'v2' ? <><GalleryPreview version={version} /><About version={version} /><Materials version={version} /><ServiceContent version={version} /></> : version === 'v3' ? <><ServiceContent version={version} /><GalleryPreview version={version} /><About version={version} /><Materials version={version} /></> : <><About version={version} /><Materials version={version} /><GalleryPreview version={version} /><ServiceContent version={version} /></>}<Quote version={version} /><Showroom version={version} /></> : <><PageHeading version={version} current={current} />
        {current === 'services' && <><ServiceContent version={version} full /><Photo src={photos['1.jpg']} alt="A completed Firestar Granite kitchen" className={styles.serviceBanner} /><Quote version={version} /></>}
        {current === 'products' && <Materials version={version} full />}
        {current === 'showroom' && <Showroom version={version} full />}
        {current === 'contact' && <Contact />}
        {isGallery && <section className={styles.section}><Gallery key={current} initial={current === 'gallery' ? 'all' : current as 'kitchen' | 'bathroom' | 'other'} /></section>}
        {current === 'testimonials' && <Testimonials />}
        {guideKeys.includes(current) && <Guide current={current} version={version} />}
      </>}
    </main><Footer version={version} />
  </div>;
}
