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
    <div className={s.cards}>{googleReviews.reviews.map(review => <article key={review.author}>
      <div className={s.content}>
        <div className={s.stars} role="img" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }, (_, i) => <Star key={i} size={18} weight="fill" aria-hidden="true" />)}</div>
        <h3>{review.title}</h3><p className={s.summaryLabel}>Review summary</p><p className={s.summary}>{review.summary}</p>
        <div className={s.author}><strong>{review.author}</strong><a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${review.author}'s review on Google`}>Read on Google <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
    </article>)}</div>
    <div className={s.footer}><p>Five selected five-star reviews, summarised for length. Rating and reviews checked <time dateTime={googleReviews.checkedAt}>{googleReviews.checkedLabel}</time>.</p><a className={s.allReviews} href={googleReviews.url} target="_blank" rel="noopener noreferrer">Read all reviews on Google <ArrowUpRight size={20} aria-hidden="true" /></a></div>
  </section>;
}
