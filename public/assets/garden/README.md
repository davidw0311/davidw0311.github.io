# My Carnivorous Garden photos

Each genus and plant has a stable upload folder. The website data lives in
`data/carnivorousGarden.ts`, so a corrected display name does not need to
change the folder or break an existing link.

## Folder convention

```text
<genus>/
  thumbnail/
    thumbnail.webp
  <species-slug>/
    thumbnail/
      thumbnail.webp
    gallery/
      01-whole-plant.webp
      02-trap-close-up.webp
```

- Upload one genus image to each genus-level `thumbnail/` folder.
- Upload one species image to each species-level `thumbnail/` folder.
- Name thumbnail images `thumbnail.webp` where possible and use a landscape crop
  near 1600 x 1067 pixels.
- Put additional, web-sized photos in `gallery/` with lowercase descriptive names.
- Preserve full-resolution originals somewhere outside this web folder.
- Leave the existing generated `thumbnail.webp` files beside the upload folders in
  place for now. They keep the live site working until the new photos are connected.
- After uploading, update the matching paths and descriptive alternative text in
  `data/carnivorousGarden.ts`, then remove the placeholder flag.

The initial thumbnails are generated reference images. They are intentionally
replaceable and do not claim to show the exact specimen or clone in the collection.
