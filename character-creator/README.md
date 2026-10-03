# Wild Mage Character Creator

Standalone prototype for designing the player's mage before it is integrated into the main game.

## Run
Open `character-creator/index.html` from a local web server or GitHub Pages.

## Current customization model

- Skin: Fair, Medium/Brown, Dark
- Hair shapes: Bald, Moicano, Curly (short), Coil, Militar, Side Part, Chanel, Straight (long), Curly (long), Ponytail, Dreads, BlackPower/Afro
- Hair colours: Dark Brown, Brown, Blond, Ruivo, Purple, White, Green, Pink
- Eyes: Round, Mid, Narrow
- Eye colours: Black, Brown, Blue, Green, Yellow, Pink
- Mouth: Thin/Thick × Smile/Straight/Surprised
- Lip colours: None, Soft Pink, Red, Plum
- Features: Freckles and Short/Trimmed Beard; beard inherits hair colour
- Hat: Hood, Witch Hat, Cap, None
- Hat colours: Blue, Black, White, Green, Yellow, Red, Pink, Purple, Gray
- Clothing: Cloak, Coat
- Clothing colours: Blue, Black, White, Green, Yellow, Red, Pink, Purple, Gray
- Hold: Magic Glove, Wand, Staff, Floating Crystal

## Architecture

`index.html` contains only the standalone creator UI.

`styles.css` contains the Wildwood creator styling.

`sprites.js` is the shared layered character renderer. Skin, eyes, mouth, features, clothing, hats and held items are still vector placeholders and can be upgraded category by category.

`hair-sprites.js` is the first production sprite-backed layer. It loads aligned transparent SVG assets from `assets/hair/`, applies the currently selected hair colour, and plugs directly into the same character renderer used by the live preview and thumbnails.

`app.js` owns UI state, randomize/reset/save controls and localStorage persistence.

Saved state key: `wildMageCharacterDraftV1`.

## Hair sprite assets

All hair assets share a `320 × 400` viewBox and are aligned to the same head position. `bald` intentionally has no sprite.

- `assets/hair/moicano.svg`
- `assets/hair/curly-short.svg`
- `assets/hair/coil.svg`
- `assets/hair/militar.svg`
- `assets/hair/side-part.svg`
- `assets/hair/chanel.svg`
- `assets/hair/straight-long.svg`
- `assets/hair/curly-long.svg`
- `assets/hair/ponytail.svg`
- `assets/hair/dreads.svg`
- `assets/hair/black-power.svg`

One neutral sprite is reused for all eight hair colours, so adding or adjusting a colour does not require duplicate image files.

## Integration later

The game should import the same character state and renderer rather than rebuilding customization logic. The intended draw order is:

1. shadow/body/legs
2. clothing
3. skin/head
4. eyes
5. mouth
6. freckles/beard
7. hair
8. hat
9. held magic item

The creator remains isolated from the current game. Once all categories have production sprites, the renderer and saved character object can be connected to the main game without changing the customization model.
