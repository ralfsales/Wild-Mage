Wild Mage Character Creator — Final Placement Build v55

Open preview.html.

UPDATED FINAL PLACEMENTS

Eyes:
- Mid: x=0 | y=-120 | scale=35%
- Round: x=0 | y=-120 | scale=32%
- Narrow: x=0 | y=-122 | scale=36%

Mouth:
- Thin Smile: x=0 | y=-65 | scale=37%
- Thin Straight: x=0 | y=-63 | scale=45%
- Thick Smile: x=0 | y=-54 | scale=15%
- Thick Straight: x=0 | y=-59 | scale=15%

Face Details:
- Freckles: x=0 | y=-88 | scale=29%
- Beard removed

Hair:
- Bald removed
- Moicano: x=-15 | y=-6 | scale=123%
- Curly Short: x=0 | y=7 | scale=133%
- Coil: x=-4 | y=0 | scale=135%
- Militar: x=-4 | y=56 | scale=168%
- Side Part: x=-3 | y=24 | scale=127%
- Chanel: x=-1 | y=60 | scale=143%
- Bob: x=0 | y=-152 | scale=62%
- Straight Long: x=-1 | y=-83 | scale=77%
- Curly Long: x=2 | y=-97 | scale=80%
- Ponytail: x=19 | y=-159 | scale=73%
- Dreads: x=-1 | y=-133 | scale=74%
- BlackPower: x=-4 | y=-199 | scale=67%

Layer order:
1. fixed head
2. long/back hair
3. eyes
4. freckles
5. mouth
6. front hair
7. clothing — highest / top layer

Clothing:
- Original
- Dark Navy
- Military Green
- Woody Brown
- Salmon Pink
- Fixed position: x=-1px | y=209px | scale=115%


Masculine eye test added in this build:
- New eye option: Masculine
- Uses asset: assets/eyes/variants/masculine-brown.png
- Positioning uses the same final placement as Mid eye:
  x=0 | y=-120 | scale=35%

Note:
- This test build is for checking positioning and scale.
- The masculine eye currently uses the same single brown-eye sprite regardless of the iris-colour selector.


v58 masculine eye adjustment:
- Select Eyes > Masculine
- X, Y, and Scale controls appear
- Starting values:
  x=0
  y=-120
  scale=35%
- Range:
  X: -300..300
  Y: -300..300
  Scale: 5..250%
- Current coordinates are displayed live under the controls.


v59 masculine mouth adjustment:
- New mouth option: Masculine Straight
- Built using thin-straight as the base for starting size and positioning
- Starting values:
  x=0
  y=-63
  scale=45%
- Select Mouth > Masculine Straight to test it
- When selected, X / Y / Scale controls appear for this mouth only
- This build is for testing placement and scale


v63 masculine eye placement test:
- The masculine eye asset was replaced with the newly generated no-eyelash masculine eye.
- The build opens with Eyes = Masculine by default.
- Masculine eye adjustment controls remain unlocked so you can test X, Y, and Scale.
- Base build remains otherwise unchanged.


v64 masculine eye final placement:
- Masculine eye fixed to: x=0 | y=-118 | scale=30%


v69 update:
- Masculine eyebrow colour changed to a visibly brown tone.


v72 update:
- Added assets/eyes/frawn.png as the new default masculine-style eye base.
- frawn.png uses a light gray iris.
- Generated strict iris-only variants in assets/eyes/variants:
  frawn-black.png, frawn-brown.png, frawn-blue.png, frawn-green.png, frawn-yellow.png, frawn-pink.png
- The masculine eye option in preview now uses the frawn variants.
- Only the iris colour should change.


v73 preview fix:
- Frawn is now visible as its own eye option in preview.html.
- Preview opens with Frawn selected by default.
- Iris colour selector loads frawn-black/brown/blue/green/yellow/pink variants.
- Frawn adjustment controls remain available.
- Frawn placement: x=0 | y=-118 | scale=30%.


v74 update:
- Rebuilt Frawn iris variants with a stricter geometric iris-only mask.
- The default assets/eyes/frawn.png now has a light gray iris.
- frawn-black/brown/blue/green/yellow/pink now recolor only the iris area.


v75 update:
- Rebuilt assets/eyes/frawn.png with a lighter, more neutral iris.
- Regenerated frawn-black/brown/blue/green/yellow/pink from the new neutral Frawn base.
- Preview still uses the Frawn eye option and its Frawn colour variants.


v76 update:
- Rebuilt assets/eyes/frawn.png from the default Frawn sprite.
- Iris changed to a very light neutral near-white tone.
- Regenerated frawn-black/brown/blue/green/yellow/pink from that new base.
- Recolor now targets only the iris circle area.


v78 update:
- Cleaned the default Frawn eye.
- The iris was rebuilt to a neutral near-white tone.
- Deleted all current frawn-* eye variants.
- Preview now uses assets/eyes/frawn.png for Frawn regardless of Eye Colour until new variants are created.


v79 fix:
- Restored Frawn eye visibility in preview.
- Frawn now points to assets/eyes/frawn.png for all eye-color selections until new variants are recreated.
- Kept the same established Frawn placement and layering used before.


v81 update:
- Replaced assets/eyes/frawn.png with the approved monochrome Frawn eye art.
- Normalized it to the project eye canvas (1536x1024).
- Preview uses Frawn by default so placement and scale can be tested.
- Eye colours currently all point to the same base Frawn sprite until new variants are created.


v82 update:
- Created strict Frawn eye colour variants from the approved default Frawn eye.
- Kept exactly the same size, shape, proportions, coordinates, and overall design.
- Only the iris color changes in each frawn-* variant.
- Restored preview mapping so Frawn eye colour selection loads the new variants.


v89 final naming/placement update:
- Thin Smile final: x=0 | y=-65 | scale=32%
- Masculine Straight renamed to Narrow; final: x=0 | y=-62 | scale=30%
- Frawn renamed to Frown; final: x=0 | y=-122 | scale=31%
- Corresponding Frown eye and Narrow mouth asset aliases added.


v91 final update:
- Thin Smile final placement set to x=0 | y=-62 | scale=32%.
- Frown eyes final at x=0 | y=-122 | scale=31%.
- Narrow mouth final at x=0 | y=-62 | scale=30%.
- Remaining adjustment bars hidden so all features are final.
