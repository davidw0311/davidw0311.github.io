# My Carnivorous Garden photos

Each plant has a stable folder under its genus. The website data lives in
`data/carnivorousGarden.ts`, so a corrected display name does not need to
change the folder or break an existing link.

## Folder convention

```text
<genus>/<species-slug>/
  thumbnail.webp
  gallery/
    01-whole-plant.webp
    02-trap-close-up.webp
```

- Replace `thumbnail.webp` with a landscape crop near 1600 x 1067 pixels.
- Put additional, web-sized photos in `gallery/` with lowercase descriptive names.
- Preserve full-resolution originals somewhere outside this web folder.
- Add every new gallery path and its descriptive alternative text to the matching
  `photos` array in `data/carnivorousGarden.ts`.
- Change `placeholder: true` to `placeholder: false`, or remove the property, after
  replacing a generated reference image with a real collection photo.

The initial thumbnails are generated reference images. They are intentionally
replaceable and do not claim to show the exact specimen or clone in the collection.
