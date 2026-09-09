import { ArrowUpRight, Star } from '@phosphor-icons/react/dist/ssr';
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
    <div className={s.cards}>{googleReviews.excerpts.map(review => <figure key={review.author}>
      <div className={s.stars} role="img" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }, (_, i) => <Star key={i} size={18} weight="fill" aria-hidden="true" />)}</div>
      <blockquote><p>“{review.quote}”</p></blockquote>
      <figcaption><strong>{review.author}</strong><a href={review.authorUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${review.author}'s reviews on Google`}>Reviewer on Google <ArrowUpRight size={16} aria-hidden="true" /></a></figcaption>
    </figure>)}</div>
    <div className={s.footer}><p>Short excerpts from three recent reviews, newest first. Rating and reviews checked <time dateTime={googleReviews.checkedAt}>{googleReviews.checkedLabel}</time>.</p><a className={s.allReviews} href={googleReviews.url} target="_blank" rel="noopener noreferrer">Read all reviews on Google <ArrowUpRight size={20} aria-hidden="true" /></a></div>
  </section>;
}
