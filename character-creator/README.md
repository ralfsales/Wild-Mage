# Wild Mage Character Creator

Standalone prototype for designing the player's mage before integration into the main game.

## Status

The body, eyes, mouth, freckles, beard, and hair positioning pass is now **approved/final**. Placement sliders are no longer part of the intended final UI for these categories; users should only select feature/style/colour options.

The exact approved values are stored in [`final-config.json`](./final-config.json).

## Approved customization

- Skin: Fair, Medium/Brown, Dark
- Hair: Bald, Moicano, Curly Short, Coil, Militar, Side Part, Chanel, Bob, Straight Long, Curly Long, Ponytail, Dreads, BlackPower/Afro
- Hair colours: Dark Brown, Brown, Blond, Ruivo, Purple, White, Green, Pink
- Eyes: Round, Mid, Narrow
- Iris colours: Black, Brown, Blue, Green, Yellow, Pink
- Mouth: Thin Smile, Thin Straight, Thick Smile, Thick Straight
- Lips: None / skin colour, Red Lipstick, Plum Lipstick
- Face features: Freckles, Trimmed Beard
- Beard colour always follows the selected hair colour

## Final layering

Current approved layer order for this stage:

1. Body
2. Eyes
3. Freckles
4. Mouth
5. Beard
6. Hair

Hair is the higher layer over the beard. The body is kept below the hair for now.

## Final positioning

### Eyes

- Round: `x=0px`, `y=-103px`, `scale=31%`
- Mid: `x=0px`, `y=-103px`, `scale=35%`
- Narrow: `x=0px`, `y=-103px`, `scale=34%`

Eye colour must change the **iris inside the selected eye sprite**, not add a separate iris overlay layer.

### Mouth

- Thin Straight: `x=0px`, `y=-56px`, `scale=45%`
- Thin Smile: `x=0px`, `y=-55px`, `scale=40%`
- Thick Straight: `x=0px`, `y=-51px`, `scale=15%`
- Thick Smile: `x=0px`, `y=-52px`, `scale=15%`

### Face features

- Beard: `x=0px`, `y=-70px`, `scale=47%`
- Freckles: `x=0px`, `y=-73px`, `scale=34%`

### Hair

- Bald: no visible hair layer
- Moicano: `x=-13px`, `y=-6px`, `scale=122%`
- Curly Short: `x=0px`, `y=7px`, `scale=133%`
- Coil: `x=-4px`, `y=-8px`, `scale=128%`
- Militar: `x=-4px`, `y=50px`, `scale=169%`
- Side Part: `x=-3px`, `y=24px`, `scale=127%`
- Chanel: `x=1px`, `y=47px`, `scale=140%`
- Bob: `x=0px`, `y=-131px`, `scale=61%`
- Straight Long: `x=-1px`, `y=-74px`, `scale=71%`
- Curly Long: `x=-1px`, `y=-96px`, `scale=69%`
- Ponytail: `x=11px`, `y=-142px`, `scale=69%`
- Dreads: `x=-4px`, `y=-120px`, `scale=63%`
- BlackPower/Afro: `x=-6px`, `y=-151px`, `scale=63%`

## Body notes

The nose belongs to the base body. It needs enough definition/contrast to remain visible on Fair, Medium/Brown, and Dark/Black skin tones.

## Next stage

The next character-creator categories can be developed on top of this locked base without changing these approved placements.
