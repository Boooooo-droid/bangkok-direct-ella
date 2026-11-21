# NULLS project research (for fan parkour game)

Source: public files on https://nulls.world (fetched for reference).  
Fan use only · unofficial · not affiliated with nullsxyz.

## Project gist
- Retro / childhood-memory NFT world on **NEAR**
- **NULLS LIST** whitelist via memory-recovery apply flow
- **Player Cards** + colored **Memory Cards**
- Official endless game: **NULLS JUMP** (`/jump`)
- Tone: `press start to remember`, corrupted saves, cartridges, CRT nostalgia

## Usable public assets downloaded → `nulls-official/`

### Brand / signs
- `brand/nulls-wordmark.png` — white italic `nulls` logo (billboard A)
- `brand/bomb-logo.webp` — bomb mark
- `brand/console-red.png` / `console-red-v2.webp` — handheld console hero
- User-provided signs kept in `../assets/` (white banner, cartridge bag art, red neon)

### Gallery / vibe art
- `art/art-01.webp` … `art-03.webp` (bomb-head etc.)
- `art/hero-poster.jpg`, `hero-mobile-poster.jpg`

### Memory cards (obstacles / collectibles)
- `cards/cyan.webp` `orange.webp` `red.webp` `blue.webp` `green.webp` `purple.webp` `pink.webp` `yellow.webp`
- Sticker text: **DO NOT ERASE** + bomb

### Player silhouettes (menu / runner skins)
- `sils/astro.png` `block.png` `crown.png` `demon.png` `gatsby.png`
- `sils/guile.png` `lombax.png` `plant.png` `shadow.png` `spike.png`
- Plus `sils/overlay.png`

### JUMP game pieces (platforms / props)
- `jump/cartridge.webp` — NULLS JUMP cart + runner pose
- `jump/memory-card.webp`, `nulls-jump-logo.png`
- Platforms: `plat-blue/green/red/crumble/spring.webp`
- Powerups: feather, jetpack, safety-net, spring-shoes
- `prize-1of1.webp`

### Player card API samples
- `https://nulls.world/api/card-image?no=NNN` → `cards/player-*.png`

## Planned mapping into Vector-like parkour
| In-game use | Asset |
|---|---|
| Billboard signs | wordmark + user neon/cartridge signs |
| Character select (5+) | sils (pick 5 distinct) |
| Collectibles | colored memory cards / orbs |
| Hazards | DO NOT ERASE bomb, crumble plats, format/static |
| World props | cartridge, console, platforms |
| Chase enemy | STATIC glitch (original) or bomb-head variant |

## Notes
- Do **not** ship login/wallet — instant play link only.
- Keep clear **unofficial fan game** disclaimer + credit `@nullsxyz` / nulls.world.
