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

`sprites.js` is the current vector sprite layer library and renderer. Each character part is drawn as an independent layer, which is the same architecture that will later accept polished transparent PNG/SVG sprites without changing the saved character model.

`app.js` owns UI state, randomize/reset/save controls and localStorage persistence.

Saved state key: `wildMageCharacterDraftV1`.

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

The current vector art is a functional placeholder for the polished chibi sprites we approved. We can replace each layer one category at a time while keeping the UI and data model unchanged.
