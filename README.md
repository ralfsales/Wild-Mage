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

Tamed allies do not damage the player. Allies are also immune to damage from enemies of the same element type.

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
