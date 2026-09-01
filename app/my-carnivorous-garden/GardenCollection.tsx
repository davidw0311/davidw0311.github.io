"use client";

import { ArrowLeft, ArrowRight, Camera } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gardenGenera, type GardenGenus, type GardenSpecies, type TaxonNamePart } from "@/data/carnivorousGarden";
import styles from "./garden.module.css";

function TaxonName({ parts }: { parts: TaxonNamePart[] }) {
  return parts.map((part, index) =>
    part.italic ? <i key={`${part.text}-${index}`}>{part.text}</i> : <span key={`${part.text}-${index}`}>{part.text}</span>,
  );
}

function firstSpecies(genus: GardenGenus): GardenSpecies {
  const species = genus.species[0];
  if (!species) throw new Error(`No plants configured for ${genus.id}`);
  return species;
}

export function GardenCollection() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedGenusSlug, setSelectedGenusSlug] = useState(gardenGenera[0].slug);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(firstSpecies(gardenGenera[0]).id);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const selectedGenus = useMemo(
    () => gardenGenera.find((genus) => genus.slug === selectedGenusSlug) ?? gardenGenera[0],
    [selectedGenusSlug],
  );
  const selectedSpecies = useMemo(
    () => selectedGenus.species.find((species) => species.id === selectedSpeciesId) ?? firstSpecies(selectedGenus),
    [selectedGenus, selectedSpeciesId],
  );
  const selectedGenusIndex = gardenGenera.findIndex((genus) => genus.slug === selectedGenus.slug);
  const selectedPhoto = selectedSpecies.photos[selectedPhotoIndex] ?? selectedSpecies.thumbnail;

  const centerGenus = useCallback((slug: string, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    const target = track?.querySelector<HTMLElement>(`[data-genus="${slug}"]`);
    if (!track || !target) return;
    const left = target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2;
    track.scrollTo({
      left,
      behavior: reduceMotion ? "auto" : behavior,
    });
  }, [reduceMotion]);

  const applyGenus = (genus: GardenGenus, updateAddress = true, behavior: ScrollBehavior = "smooth") => {
    setSelectedGenusSlug(genus.slug);
    setSelectedSpeciesId(firstSpecies(genus).id);
    setSelectedPhotoIndex(0);
    if (updateAddress) window.history.replaceState(null, "", `#${genus.slug}`);
    window.requestAnimationFrame(() => centerGenus(genus.slug, behavior));
  };

  useEffect(() => {
    const selectFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1)).toLowerCase();
      const genus = gardenGenera.find((candidate) => candidate.slug === hash) ?? gardenGenera[0];
      setSelectedGenusSlug(genus.slug);
      setSelectedSpeciesId(firstSpecies(genus).id);
      setSelectedPhotoIndex(0);
      window.requestAnimationFrame(() => centerGenus(genus.slug, "auto"));
    };

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [centerGenus]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => centerGenus(selectedGenus.slug, "auto"));
    });
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [centerGenus, selectedGenus.slug]);

  const selectGenusAt = (index: number, moveFocus = false) => {
    const boundedIndex = Math.max(0, Math.min(gardenGenera.length - 1, index));
    applyGenus(gardenGenera[boundedIndex]);
    if (moveFocus) window.requestAnimationFrame(() => tabRefs.current[boundedIndex]?.focus());
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % gardenGenera.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + gardenGenera.length) % gardenGenera.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = gardenGenera.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectGenusAt(nextIndex, true);
  };

  const selectSpecies = (species: GardenSpecies) => {
    setSelectedSpeciesId(species.id);
    setSelectedPhotoIndex(0);
  };

  return (
    <section id="collection" className={styles.collection} aria-labelledby="collection-title">
      <div className={styles.collectionHeading}>
        <h2 id="collection-title">Choose a genus</h2>
        <p>The selected card stays centered while its neighbors remain visible. Swipe, scroll, or use the arrow keys.</p>
      </div>

      <div className={styles.genusControls}>
        <button
          type="button"
          aria-label="Select previous genus"
          aria-controls="selected-genus-panel"
          disabled={selectedGenusIndex === 0}
          onClick={() => selectGenusAt(selectedGenusIndex - 1, true)}
        >
          <ArrowLeft size={21} weight="bold" />
        </button>
        <p aria-live="polite"><i>{selectedGenus.scientificName}</i> selected, {selectedGenus.species.length} {selectedGenus.species.length === 1 ? "plant" : "plants"}</p>
        <button
          type="button"
          aria-label="Select next genus"
          aria-controls="selected-genus-panel"
          disabled={selectedGenusIndex === gardenGenera.length - 1}
          onClick={() => selectGenusAt(selectedGenusIndex + 1, true)}
        >
          <ArrowRight size={21} weight="bold" />
        </button>
      </div>

      <div ref={trackRef} className={styles.genusTrack} role="tablist" aria-label="Plant genera">
        {gardenGenera.map((genus, index) => {
          const cover = genus.species.find((species) => species.id === genus.coverSpeciesId)?.thumbnail ?? firstSpecies(genus).thumbnail;
          const selected = genus.slug === selectedGenus.slug;
          return (
            <button
              key={genus.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={genus.slug}
              className={selected ? `${styles.genusCard} ${styles.genusCardSelected}` : styles.genusCard}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="selected-genus-panel"
              tabIndex={selected ? 0 : -1}
              data-genus={genus.slug}
              onClick={() => applyGenus(genus)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span className={styles.genusImage}>
                <Image src={cover.src} alt="" fill sizes="(max-width: 767px) 78vw, 430px" />
              </span>
              <span className={styles.genusCardCopy}>
                <strong><i>{genus.scientificName}</i></strong>
                <span>{genus.commonName}</span>
                <small>{genus.species.length} {genus.species.length === 1 ? "plant" : "plants"}</small>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedGenus.id}
          id="selected-genus-panel"
          className={styles.genusPanel}
          role="tabpanel"
          aria-labelledby={selectedGenus.slug}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: reduceMotion ? 0 : 0.36, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className={styles.genusPanelHeader}>
            <h2><i>{selectedGenus.scientificName}</i><span>{selectedGenus.commonName}</span></h2>
            <p>{selectedGenus.description}</p>
          </header>

          <div className={styles.speciesSection}>
            <h3>Plants in this genus</h3>
            <div className={styles.speciesTrack} aria-label={`${selectedGenus.scientificName} plants`}>
              {selectedGenus.species.map((species) => {
                const selected = species.id === selectedSpecies.id;
                return (
                  <button
                    key={species.id}
                    className={selected ? `${styles.speciesCard} ${styles.speciesCardSelected}` : styles.speciesCard}
                    type="button"
                    aria-pressed={selected}
                    aria-controls="species-detail"
                    onClick={() => selectSpecies(species)}
                  >
                    <span className={styles.speciesThumb}>
                      <Image src={species.thumbnail.src} alt="" fill sizes="250px" />
                    </span>
                    <span className={styles.speciesName}>
                      <strong><TaxonName parts={species.taxon} /></strong>
                      <small>{species.commonName}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={selectedSpecies.id}
              id="species-detail"
              className={styles.speciesDetail}
              aria-labelledby={`${selectedSpecies.id}-title`}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.photoColumn}>
                {selectedSpecies.photos.length > 0 ? (
                  <>
                    <figure className={styles.featuredPhoto}>
                      <span>
                        <Image src={selectedPhoto.src} alt={selectedPhoto.alt} fill sizes="(max-width: 767px) calc(100vw - 64px), 45vw" />
                      </span>
                      <figcaption>
                        {selectedPhoto.placeholder ? "Collection photos coming soon. This temporary genus image keeps the gallery ready." : selectedPhoto.alt}
                      </figcaption>
                    </figure>
                    {selectedSpecies.photos.length > 1 && (
                      <div className={styles.photoThumbnails} aria-label="Choose a plant photo">
                        {selectedSpecies.photos.map((photo, index) => (
                          <button
                            key={photo.src}
                            type="button"
                            aria-label={`Show photo ${index + 1} of ${selectedSpecies.photos.length}: ${photo.alt}`}
                            aria-pressed={index === selectedPhotoIndex}
                            onClick={() => setSelectedPhotoIndex(index)}
                          >
                            <Image src={photo.src} alt="" fill sizes="84px" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyPhotos}>
                    <Camera size={30} weight="thin" />
                    <p>Photos will be added as this plant grows.</p>
                  </div>
                )}
              </div>

              <div className={styles.speciesCopy}>
                <header>
                  <h3 id={`${selectedSpecies.id}-title`}><TaxonName parts={selectedSpecies.taxon} /></h3>
                  <p className={styles.commonName}>{selectedSpecies.commonName}</p>
                </header>
                <p className={styles.fact}>{selectedSpecies.fact}</p>
                {selectedSpecies.identificationNote && <p className={styles.identificationNote}>{selectedSpecies.identificationNote}</p>}

                <section className={styles.care} aria-labelledby={`${selectedSpecies.id}-care`}>
                  <h4 id={`${selectedSpecies.id}-care`}>Care notes</h4>
                  <dl>
                    {selectedSpecies.care.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className={styles.sources} aria-labelledby={`${selectedSpecies.id}-sources`}>
                  <h4 id={`${selectedSpecies.id}-sources`}>References</h4>
                  <div>
                    {selectedSpecies.sources.map((source) => (
                      <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer">
                        {source.label} <ArrowRight size={15} weight="bold" />
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </motion.article>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
