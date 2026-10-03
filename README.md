# Wild Mage

Wild Mage is a browser-based pixel-style 2D RPG built with HTML, CSS, JavaScript, and HTML Canvas.

Play as a mage, explore a top-down grass map, defeat elemental monsters, collect coins, find treasure, and tame monsters so they can fight beside you.

## Play Online

https://ralfsales.github.io/Wild-Mage/

## Features

- Pixel-art inspired 2D canvas gameplay
- Top-down grass map with bushes, rocks, paths, treasure, and monster spawns
- Mage player with health, coins, spells, and tamed allies
- Fire, Water, and Grass elemental monsters
- Monsters chase and attack the player
- Defeated monsters drop coins
- Hidden treasure chests give bonus coins
- Tamed monsters become allies and attack hostile monsters
- Tame slot system with unlockable slots
- Game over screen with final coin score and restart support

## Controls

| Action | Key |
| --- | --- |
| Move | Arrow Keys |
| Fire Spell | F |
| Water Spell | D |
| Grass Spell | S |
| Tame Spell | A |
| Aim | Face a direction or click the map |
| Restart after Game Over | R |

## Element System

- Water is strong against Fire
- Fire is strong against Grass
- Grass is strong against Water

Strong attacks deal extra damage.

## Taming

Taming has a 75% chance of success.

The player starts with 1 tame slot. Glowing charm items can randomly appear on the map, and each charm unlocks 1 extra tame slot. The maximum number of tame slots is 5.

Tamed allies do not damage the player. Allies are also immune to the element they are strong against: Fire allies ignore Grass attacks, Water allies ignore Fire attacks, and Grass allies ignore Water attacks.

## Project Files

```text
Wild-Mage/
  index.html
  style.css
  game.js
  README.md
```

## Built With

- HTML
- CSS
- JavaScript
- HTML Canvas

## Future Ideas

- More monster types
- Boss enemies
- More maps
- Music and sound effects
- Player upgrades
- Save and load support

## Interface and accessibility

- A woodland-themed welcome screen and responsive spellbook show each element's strength.
- Click a spell card to select it, then click the field to aim and cast. Keyboard spell shortcuts still select and cast immediately.
- Press Escape or use Pause to pause/resume. Switching tabs or leaving the window pauses the adventure automatically; resume when ready.
- Sound starts muted and has an explicitly labeled toggle.
- Visible focus indicators and focus return to the game field support keyboard navigation.
- Movement requires a keyboard; touch movement is not implemented.

## Creature visuals and grass ambush

The mage wears a violet cloak and pointed hat and carries a staff whose crystal matches the selected spell. Fire spirits have animated flames, water creatures have a droplet silhouette, and grass monsters are walking bushes with root feet and leafy faces. Tamed allies retain their element's appearance.

Wild grass monsters periodically dig down and pursue their target underground, leaving moving earth, cracks, and a fading dirt trail. Only Grass attacks can hit them underground; Fire, Water, and Tame spells pass over them. Grass allies can also damage burrowers. Taming becomes available again after they emerge.

A gold circle warns of the eruption for 0.75 seconds. The bush stops moving during this warning, then deals 14 Grass damage within the marked area and rests above ground for 1.1 seconds. Move out of the circle or defeat it with Grass before it erupts. Tamed bushes stay above ground.

Run combat checks with `node --test tests/combat.test.cjs`. Open `tests/visual-preview.html` through a local web server to inspect the character artwork and burrowing states.

## Fire bird dash

Fire monsters are flame birds with beating wings, a crest, beak, and talons. A 0.7-second dashed-line warning locks the charge direction. The bird then becomes a fireball traveling at 420 pixels/second for up to 0.65 seconds, stopping at the map edge. Step sideways to dodge: the dash does not track you after the warning starts.

During the dash only Water attacks connect. Water deals its normal elemental bonus damage and quenches the dash immediately, leaving the bird exposed for 1.4 seconds. Fire, Grass, and Tame spells pass through it. A dash deals 20 Fire damage at most once per target, then has 0.9 seconds of recovery. Tamed fire birds keep their appearance but use normal ally attacks.

## Character creator prototype

Character creation is being developed separately in `character-creator/`. It is not integrated into gameplay yet. The game starts directly with its fixed mage appearance.

Run the gameplay checks with `node --test tests/combat.test.cjs`.

## Charged attacks and energy

Tap and release F, D, S, or A for the normal attack. Hold the key for 0.5 seconds to use its charged move once; release before charging again. A growing ring shows the hold progress. No modifier key is needed.

| Hold | Charged move |
| --- | --- |
| D | Water wave expanding around the mage |
| S | Grass earthquake expanding around the mage |
| F | Fire pulse expanding around the mage |
| A | Command ready tamed allies to use their specials |

A charged action consumes one full energy segment. The meter stores up to three charges. Each defeated enemy has a 20% chance to drop a violet energy orb; collect three orbs to fill one segment. Energy starts empty, never regenerates over time, and is not granted by taming. Orbs remain on the ground when storage is full.

Player area attacks have a 170-pixel radius and deal 42 base damage once per enemy. Elemental bonuses and monster immunities still apply. Water waves stop firebird dashes; Grass earthquakes hit underground bushes. Fire allies dash, Grass allies burrow and erupt, and Water allies release a wave. Ally specials target enemies only. An ally command with no ready allies or eligible targets does not spend energy. Pausing or leaving the window cancels pending held inputs.
