import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, House, Palette, MapPin, ChatCircleText } from '@phosphor-icons/react/dist/ssr';
import { brandName, href, routes, pages, photos, services, locations, guideKeys, testimonials, quoteItems, quoteEmail, type PageKey } from '@/data/firestar/content';
import { ProductText, LocationDetails } from '../SourceContent';
import { HomesteadNavigation } from './Navigation';
import { RoomPicker } from './RoomPicker';
import { Mosaic } from './Mosaic';
import s from './homestead.module.css';

function Button({ page, children }: { page: PageKey; children: React.ReactNode }) {
  return <Link className={s.button} href={href('v3', page)}>{children}<ArrowRight size={19} /></Link>;
}
function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <div className={`${s.photo} ${className}`}><Image src={src.replace(/\.jpe?g$/i, '.webp')} alt={alt} fill sizes="(max-width: 767px) 100vw, 50vw" /></div>;
}
function Title({ current, children }: { current: PageKey; children?: React.ReactNode }) {
  return <div className={s.pageTitle}><p>{routes[current].title}</p><h1>{children || routes[current].title}</h1></div>;
}
function StartTiles() {
  return <section className={s.start}><h2>Where would you like to start?</h2><div className={s.startTiles}>
    <Link href={href('v3', 'p1')}><Palette size={34} weight="light" /><h3>Meet quartz.</h3><p>Find colors and designs that feel like you.</p><ArrowUpRight size={24} /></Link>
    <Link href={href('v3', 'gallery')}><House size={34} weight="light" /><h3>Get inspired.</h3><p>A little inspiration from the homes we’ve worked on.</p><ArrowUpRight size={24} /></Link>
    <Link href={href('v3', 'showroom')}><MapPin size={34} weight="light" /><h3>Come on over.</h3><p>Explore full slabs and samples in Nanaimo.</p><ArrowUpRight size={24} /></Link>
    <Link href={href('v3', 'contact')}><ChatCircleText size={34} weight="light" /><h3>Tell us your idea.</h3><p>We’ll help you take the next step.</p><ArrowUpRight size={24} /></Link>
  </div></section>;
}
function ServiceQuestions({ full = false }: { full?: boolean }) {
  return <section className={s.serviceQuestions}><div className={s.serviceIntro}><span>Let’s make something yours.</span><h2>A home has<br />so many possibilities.</h2><p>{pages.services[0]}</p></div><div className={s.questionBox}>{services.map((service, i) => <details key={service}><summary>{service}<span>+</span></summary><p>{pages.services[9]}</p><Link href={href('v3', i === 0 ? 'kitchen' : i === 3 ? 'bathroom' : 'other')}>See our work <ArrowRight size={18} /></Link></details>)}<p>{pages.services[8]}</p>{full && <Button page="contact">Let’s talk about it</Button>}</div></section>;
}
function Story() {
  return <section className={s.story}><div className={s.storyPhotos}><Photo src={photos['SDC10182-s.JPG']} alt="The Firestar stone workshop in Nanaimo" /><Photo src={photos['showroom_pic.jpg']} alt="Stone samples in the Firestar showroom" /></div><div className={s.storyText}><p className={s.eyebrow}>Hello, neighbour.</p><h2>Local people.<br />Personal touches.</h2><p>{pages.home[0]}</p><details><summary>A little more about us</summary>{pages.home.slice(1, 5).map(p => <p key={p}>{p}</p>)}<small>{pages.home[5]}</small></details><Button page="showroom">Meet your stone in person</Button></div></section>;
}
function CustomerNote() {
  return <section className={s.customerNote}><span>Kind words, from real homes.</span><blockquote><p>“Our Sincere thanks for the excellent service and beautiful countertops. Working with you has been a great experience!”</p><cite>Tina & Greg Valliere</cite></blockquote><Link href={href('v3', 'testimonials')}>More from our customers <ArrowRight size={19} /></Link></section>;
}
function Visits() {
  return <section className={s.visits}><h2>Two places.<br />So many possibilities.</h2><div className={s.visitCards}>{locations.map((place, i) => <article key={place.name}><span>{i === 0 ? 'Come see the workshop' : 'Explore at your own pace'}</span><h3>{place.name}</h3><LocationDetails index={i} /></article>)}</div></section>;
}
function Home() {
  return <><section className={s.hero}><p className={s.eyebrow}>Custom quartz. Made for your kind of home.</p><h1>Make yourself<br /><em>at home.</em></h1><p>Quartz countertops for everyday living, made right here in Nanaimo.</p><Button page="p1">Find your quartz</Button><RoomPicker /></section><StartTiles /><Story /><CustomerNote /><ServiceQuestions /><Visits /></>;
}
function Products() {
  return <><Title current="products">Let’s find<br />your kind of quartz.</Title><section className={s.productBoard}><div className={s.quartzCard}><Palette size={36} weight="light" /><h2>So many ways<br />to make it yours.</h2><p>Custom quartz countertops for kitchens and bathrooms, with colors and designs to suit your space.</p><Button page="p1">Get to know quartz</Button></div><Photo src={photos['images/dsc07624.jpg']} alt="Detail of a stone surface from the original gallery" /><div className={s.otherMaterials}><h3>There’s more to explore.</h3><p>Granite, marble, and onyx are also available. Visit our showroom to see full slabs and samples.</p><Button page="p2">Explore granite</Button></div></section><section className={s.careShelf}><h2>A little knowledge goes a long way.</h2><div>{guideKeys.map(key => <Link href={href('v3', key)} key={key}>{routes[key].title}<ArrowUpRight size={23} /></Link>)}</div></section></>;
}
function Showroom() {
  return <><Title current="showroom">A good place<br />to get inspired.</Title><div className={s.showroomWelcome}><Photo src={photos['SDC10182-s.JPG']} alt="Stone slabs outside the Nanaimo showroom and shop" /><div><h2>Our Showroom & Shop</h2>{pages.showroom.slice(1, 5).map(p => <p key={p}>{p}</p>)}</div></div><Visits /></>;
}
function Contact() {
  return <><Title current="contact">Tell us what<br />you’re dreaming of.</Title><section className={s.contactBoard}><div className={s.helloCard}><ChatCircleText size={44} weight="light" /><h2>We’d love<br />to hear it.</h2><p>Office / Showroom</p><a href="tel:+12506199968">250-619-9968</a><a className={s.contactEmail} href="mailto:sales@infinitegranite.ca">sales@infinitegranite.ca</a><small>Fax: 250-740-1046</small></div><div className={s.quoteCard}><h2>A few details<br />to get us started.</h2><p>To receive an accurate quote please supply:</p><ol>{quoteItems.map(item => <li key={item}>{item}</li>)}</ol><a className={s.button} href={quoteEmail}>Prepare quote email <ArrowRight size={20} /></a><small>Opens your email app with a checklist. Attach your plans before sending.</small></div></section><Visits /></>;
}
function Guide({ current }: { current: PageKey }) {
  return <><Title current={current} /><nav className={s.guidePills} aria-label="Product guides">{guideKeys.map(key => <Link key={key} href={href('v3', key)} aria-current={key === current ? 'page' : undefined}>{routes[key].title}</Link>)}</nav><article className={s.guidePaper}><ProductText current={current} /></article><div className={s.helpBox}><ChatCircleText size={32} /><div><h2>A question of your own?</h2><p>We’re here to help you get to know your stone.</p></div><Button page="contact">Just ask us</Button></div></>;
}
function Testimonials() {
  return <><Title current="testimonials">Good words.<br />Happy homes.</Title><section className={s.noteWall}>{testimonials.map(t => <figure key={t.author}><span aria-hidden="true">“</span><blockquote>{t.quote}</blockquote><figcaption>{t.author}</figcaption></figure>)}</section></>;
}
function Footer() {
  return <footer className={s.footer}><div className={s.footerInvite}><h2>Let’s make<br />your home, yours.</h2><Button page="contact">Start a conversation</Button></div><div className={s.footerBottom}><Link href={href('v3')} className={s.brand} aria-label={brandName}>Firestar<span>（infinite） granite</span></Link><div><a href="tel:+12506199968">250-619-9968</a><a href="mailto:sales@infinitegranite.ca">sales@infinitegranite.ca</a><span>Fax: 250-740-1046</span></div><address>2156 Akenhead Road<br />Nanaimo, BC V9X 1T9</address><Link href="/#projects">Back to projects ↗</Link></div><small>Copyright 2023 Infinitegranite.ca</small></footer>;
}
export function HomesteadSite({ current }: { current: PageKey }) {
  return <div className={s.site}><a className={s.skip} href="#homestead-content">Skip to content</a><HomesteadNavigation current={current} /><main id="homestead-content">
    {current === 'home' && <Home />}{current === 'services' && <><Title current="services">Big ideas.<br />Personal touches.</Title><ServiceQuestions full /><CustomerNote /></>}{current === 'products' && <Products />}{current === 'showroom' && <Showroom />}{current === 'contact' && <Contact />}{current === 'testimonials' && <Testimonials />}{guideKeys.includes(current) && <Guide current={current} />}
    {['gallery', 'kitchen', 'bathroom', 'other'].includes(current) && <><Title current={current}>{current === 'gallery' ? <>A little inspiration<br />for your place.</> : routes[current].title}</Title><section className={s.galleryPage}><Mosaic key={current} initial={current === 'gallery' ? 'all' : current as 'kitchen' | 'bathroom' | 'other'} /></section></>}
  </main><Footer /></div>;
}
