# Minecraft 98

What *Minecraft* could have looked like if Mojang had shipped an Alpha in 1999: a block-world survival sandbox rendered at 320x240–800x600 through a first-generation 3D accelerator (WebGL), with 16x16 procedural textures, per-block flood-fill lighting, 16-bit ordered dithering and a 64-block-high world. Written from scratch for the Win 98 desktop; it shares no code with the other games.

- Launch from the desktop, the Start menu, the Run command (`minecraft`, `mc98`, `майнкрафт`), the Steam client (after downloading it there) or `C:\Games\MC98\MINECRAFT.EXE`.
- Run it standalone at `mc98.html`; the page exposes `window.mcui`.
- Run the tests with `npm run test:mc98`, which is `node tests/mc98.test.js` (about 5 s, ~980 checks).

## Technology

| Layer | Approach |
|---|---|
| World | Infinite, chunked 16x64x16. Perlin terrain with continents, ridged mountains, six biomes (plains, forest, desert, tundra, mountains, swamp), worm and cavern caves, ore veins by depth, lava lakes, dungeons with spawners and loot chests, bedrock. Two-phase generation: terrain per chunk, then decoration (trees, cactus, flowers, tall grass, mushrooms, snow layers) written by the 3x3 neighbourhood so features cross chunk borders deterministically. |
| Lighting | Minecraft-style sky light (15 straight down, flood-fill sideways) and block light (torches 14, lava and glowstone 15, lit furnaces 13) with BFS propagation and removal on every block change. Night subtracts up to 11 levels for spawning and burning; the shader darkens sky light by the day factor so no remesh is needed at dusk. |
| Fluids | Scheduled ticks (water 5, lava 30): sources, falling columns, spread levels 1–7 (lava 1–3), infinite water from two sources, obsidian/cobblestone/stone from lava-water contact. |
| Rendering | WebGL 1. One vertex format (position, uv, sky, block light, face shade); per-chunk opaque+cutout and translucent water buffers rebuilt on demand with a per-frame time budget; entities and the first-person hand are streamed each frame. Sun, moon, stars, moving clouds, distance fog, underwater/lava fog, selection wireframe, crack overlay, hurt tint, optional 16-bit dithering. Internal resolution 240–600 lines upscaled with nearest filtering. |
| Textures | Every tile is generated at start-up into a 512x512 atlas (about 180 tiles): blocks, items, tools, armour, cracks, mob skins, sky. Inventory icons are drawn from the atlas as small isometric cubes. |
| Audio | All sounds synthesised with WebAudio: per-material steps, digging and placing, mobs, bow, explosion, achievement chime, and a generative ambient piano. |
| Saves | `localStorage`: a world list plus one record per world with block edits (diffs per chunk), block entities (chests, furnaces, spawners), player, inventory, armour, mobs, dropped items, achievements and stats. Autosave every 60 s, on pause-quit and on window close. |

## Modules (`js/apps/mc98/`)

`mc-core` (RNG, hashing, Perlin, matrices), `mc-blocks` (48 blocks, 90+ items, tools and armour tables, recipes, smelting, fuels), `mc-tex` (procedural atlas), `mc-gen` (terrain, biomes, ores, decoration, trees, dungeons, spawn point), `mc-world` (chunks, lighting, fluids, random ticks, neighbour updates, colliders, raycast), `mc-mesh` (chunk mesher and box/cross/entity builders), `mc-entity` (physics, mobs and AI, items, arrows, falling sand, primed TNT), `mc-game` (player, inventory and container slot logic, crafting, furnaces, spawners, combat, damage, explosions, sleeping, spawning, save/load), `mc-audio`, `mc-render`, `mc-ui` (menus, world list, options, HUD, inventory/crafting/chest/furnace/creative screens). The desktop wrapper is `js/apps/mc98-app.js`, the styles are in `css/apps/mc98.css`.

## Game design

**Pillars.** Dig anywhere, build anything; the night is a real threat; every tool tier opens a new layer of the world.

**Core verb.** Break and place blocks. Break speed comes from block hardness, tool type, tool tier and material (a wooden pickaxe breaks stone 4x faster than a hand, iron 6x, diamond 8x, gold 12x); the wrong tier gives nothing.

**Loops.**
- Moment to moment: aim, dig, place, with crack stages, per-material sounds and item pickup pops.
- Day: gather → craft → build shelter → survive the night → mine deeper. A day lasts 20 minutes; hostile mobs spawn only in the dark, zombies and skeletons burn at sunrise.
- Meta: wood → stone → iron → diamond tools, armour, a bed that resets spawn and skips the night, TNT, and 15 achievements (first log, workbench, pickaxe, furnace, iron, diamond, first night, creeper kill, obsidian, ...).

**Economy.** Tools and armour have durability, so ore veins are the sink for time and the faucet for progress. Food is the only way to heal outside peaceful difficulty (Alpha rules), so animals matter. Furnaces need fuel (coal, wood, lava buckets).

**Difficulty.** Peaceful (no hostiles, regeneration), easy, normal, hard scale mob damage 0.6 / 1.0 / 1.4. Creative mode gives every item, instant breaking, flight (double-tap Space) and no damage.

**Mobs.** Pig, cow, sheep, chicken (wander, flee when hit, drop food, wool, leather, feathers, eggs). Zombie (melee), skeleton (keeps distance, shoots arrows with lead), creeper (1.5 s fuse, crater), spider (hostile in the dark). Dungeon spawners keep spawning while you are within 16 blocks.

## Controls

WASD move, mouse look (click the view to lock the pointer; arrow keys also turn), LMB dig / attack, RMB place / use / eat / shoot, Space jump or swim, Shift sneak (never falls off edges), Ctrl sprint, E or Tab inventory, Q drop (Shift+Q whole stack), 1–9 or wheel hotbar, middle click pick block, F3 debug, Esc pause. In inventories: click to pick up, right click to split or place one, Shift-click to move quickly.

## Testing and verification

`tests/mc98.test.js` covers: texture coverage for every block, item and mob part; recipe and smelting integrity; world generation invariants, sky and torch lighting with removal, water spread and drain, lava-water reactions, sapling growth, chunk meshing; walking, jumping, digging by hand and with tools, drops and pickup, placing, torches, falling sand; crafting through the slot API (planks, sticks, table, pickaxe), inventory quick-move and armour slots; furnace smelting and chests; zombie chase, daylight burning, sword kills, creeper explosion, skeleton arrows, bow, pig drops, eating; beds, buckets, TNT, fall damage, death and respawn; creative mode; night spawning, peaceful mode, dungeons with loot; save/load round trips; and a zero-comments scan of every module plus the desktop wiring (index.html, game manager, filesystem, Run command, icons, i18n).

For visual checks drive headless Edge over CDP against `mc98.html`: `mcui.createWorld(name, seed, mode, difficulty)`, wait for `mcui.mode === 'play'`, then set `mcui.yaw` / `mcui.pitch`, edit `mcui.game.inventory`, push mobs into `mcui.game.entities`, and screenshot. `mcui.renderer.stats` reports chunks and vertices drawn.
