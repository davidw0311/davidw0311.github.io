import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { gardenGenera, getGenusCover } from "../data/carnivorousGarden.ts";

const projectRoot = process.cwd();

test("garden contains the current five genera and ten plants", () => {
  assert.deepEqual(
    gardenGenera.map((genus) => genus.slug),
    ["dionaea", "drosera", "sarracenia", "pinguicula", "nepenthes"],
  );
  assert.equal(gardenGenera.flatMap((genus) => genus.species).length, 10);
});

test("garden IDs and slugs remain unique and every genus has a valid cover", () => {
  const species = gardenGenera.flatMap((genus) => genus.species);
  assert.equal(new Set(gardenGenera.map((genus) => genus.id)).size, gardenGenera.length);
  assert.equal(new Set(gardenGenera.map((genus) => genus.slug)).size, gardenGenera.length);
  assert.equal(new Set(species.map((plant) => plant.id)).size, species.length);
  assert.equal(new Set(species.map((plant) => plant.slug)).size, species.length);

  gardenGenera.forEach((genus) => {
    assert.ok(genus.species.some((plant) => plant.id === genus.coverSpeciesId));
    assert.equal(getGenusCover(genus).src, genus.species.find((plant) => plant.id === genus.coverSpeciesId)?.thumbnail.src);
  });
});

test("plant cards have names, care guidance, sources, and existing local images", () => {
  gardenGenera.flatMap((genus) => genus.species).forEach((plant) => {
    assert.ok(plant.taxon.map((part) => part.text).join("").trim().length > 0);
    assert.ok(plant.commonName.trim().length > 0);
    assert.ok(plant.fact.trim().length > 0);
    assert.ok(plant.care.length >= 5);
    assert.ok(plant.sources.length >= 2);
    plant.sources.forEach((source) => assert.match(source.href, /^https:\/\//));

    [plant.thumbnail, ...plant.photos].forEach((photo) => {
      assert.match(photo.src, /^\/assets\/garden\//);
      assert.ok(photo.alt.trim().length > 0);
      assert.ok(existsSync(join(projectRoot, "public", photo.src)));
    });
  });
});

test("taxonomic corrections keep their intended display form", () => {
  const species = gardenGenera.flatMap((genus) => genus.species);
  const displayName = (id: string) =>
    species.find((plant) => plant.id === id)?.taxon.map((part) => part.text).join("");

  assert.equal(displayName("sarracenia-catesbaei"), "Sarracenia × catesbaei");
  assert.equal(displayName("nepenthes-miranda"), "Nepenthes ‘Miranda’");
  assert.equal(displayName("pinguicula-ehlersiae-moranensis"), "Pinguicula ehlersiae × P. moranensis");
});
