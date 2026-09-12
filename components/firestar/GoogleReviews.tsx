import { ArrowUpRight, Star } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import { googleReviews } from '@/data/firestar/googleReviews';
import s from './googleReviews.module.css';

export function GoogleReviews() {
  return <section className={s.section} aria-labelledby="google-reviews-heading">
    <div className={s.heading}>
      <div><p className={s.eyebrow}>Google reviews</p><h2 id="google-reviews-heading">From homes like yours.</h2></div>
      <a className={s.rating} href={googleReviews.url} target="_blank" rel="noopener noreferrer" aria-label={`${googleReviews.rating} out of 5 from ${googleReviews.count} Google reviews. Read reviews on Google.`}>
        <span><strong>{googleReviews.rating}</strong><Star size={27} weight="fill" aria-hidden="true" /></span><span>{googleReviews.count} reviews on Google <ArrowUpRight size={18} aria-hidden="true" /></span>
      </a>
    </div>
    <div className={s.cards}>{googleReviews.reviews.map(review => <article key={review.author} className={'photo' in review ? s.withPhoto : undefined}>
      {'photo' in review && <figure className={s.photo}><a href={review.authorUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${review.author}'s customer photo and review on Google`}><Image src={review.photo} alt={review.photoAlt} width={767} height={1024} sizes="(max-width: 767px) 88vw, 44vw" /></a><figcaption>{review.photoCaption}</figcaption></figure>}
      <div className={s.content}>
        <div className={s.stars} role="img" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }, (_, i) => <Star key={i} size={18} weight="fill" aria-hidden="true" />)}</div>
        <h3>{review.title}</h3><p className={s.summaryLabel}>Review summary</p><p className={s.summary}>{review.summary}</p>
        <div className={s.author}><strong>{review.author}</strong><a href={review.authorUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${review.author}'s reviews on Google`}>Read on Google <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
    </article>)}</div>
    <div className={s.footer}><p>Five selected five-star reviews, summarised for length. The featured customer photo belongs to Jim’s review. Rating and reviews checked <time dateTime={googleReviews.checkedAt}>{googleReviews.checkedLabel}</time>.</p><a className={s.allReviews} href={googleReviews.url} target="_blank" rel="noopener noreferrer">Read all reviews on Google <ArrowUpRight size={20} aria-hidden="true" /></a></div>
  </section>;
}
