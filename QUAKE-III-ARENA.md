# Quake III Arena (Win 98 Edition)

A deathmatch game in the spirit of id Software's *Quake III Arena* (1999), written from scratch for the Win 98 desktop. It covers the first two tiers of the single player ladder (eight arenas), all nine weapons, the Quake III movement physics, bots with personalities and the menus and HUD from the original game. It shares no code with the other shooters in this project.

- Buy and download it in the Steam client (`quake3`, $44.99). It is never preinstalled.
- After installing: desktop icon, Start menu, Run (`quake3`, `quake3.exe`, `q3`, `q3a`, `quake 3`, `квейк`), `C:\Games\Quake3\QUAKE3.EXE` with `baseq3\` (config, demos and screenshots folders).
- Standalone page: `quake3.html` (exposes `window.q3ui`).
- Tests: `npm run test:quake3` (`node tests/quake3.test.js`, about 15 s, 24 tests).

## Design

**Hook.** The Vadrigar pull the best fighters of every age into the Arena Eternal. You climb the tiers, beat each tier's Arena Lord in a duel and move on.

**Pillars.**
1. *Movement is skill.* The Quake III air control is reproduced exactly (ground acceleration 10, air acceleration 1, friction 6, jump velocity 270, gravity 800, 18 unit steps), so strafe jumping, rocket jumping and jump pads work the way players remember.
2. *Item control.* Armour, Mega Health and powerups respawn on fixed timers (25, 35, 120 s). Holding them wins matches; good bots time them.
3. *Readable opponents.* Every bot has a silhouette, colours, a favourite weapon, chat lines and one of five skill levels.

**Verbs.** Run, jump, crouch, strafe jump, rocket jump, ride jump pads, teleport, shoot nine weapons, zoom, use holdable items (medkit, personal teleporter), gesture.

**Loops.**
- Moment to moment: movement plus aim, with instant feedback (hit sound, pain grunts, gibs, obituaries, medals).
- Match: spawn with machinegun and gauntlet, take the map's weapons and armour, race to the fraglimit. Ties at the timelimit go to sudden death.
- Meta: tiers unlock in order, each arena remembers the best skill it was won on, career medals (Excellent, Impressive, Humiliation, Accuracy, Perfect, Frags) are counted in the profile.

**Economy.** Health counts down from above 100 at 1 point per second, armour from above 100 the same way; armour absorbs two thirds of damage. Weapons respawn every 5 s, ammo every 40 s. A killed player drops the weapon in hand and any powerup with its remaining time. Self damage is halved, which makes rocket jumps cost about 50 health.

**Difficulty.** Skill 1 to 5 changes bot reaction time (0.7 to 0.14 s), aim error, turn speed, strafing, jumping, projectile leading and item timing. Nightmare bots also time powerups.

## Arenas

| Tier | Map | Opponents | Features |
|---|---|---|---|
| 1 Trainee | Q3DM1 Arena Gate | Ranger | Courtyard under a red sky, gate facade with twin spires and a rose window, rocket launcher on the floor emblem, two pillar platforms with stairs (health and armour), hall with the shotgun by the gate, corridors to the back room with the plasma gun and the Red Armor inside a colossal demon mouth |
| 1 | Q3DM2 House of Pain | Phobos | Small two-level map: entrance hall with the plasma gun and a jump pad, cathedral nave with galleries and the rocket launcher on the altar, the crossing where both levels meet (Red Armor), Haste in the loft |
| 1 | Q3DM3 Arena of Death | Mynx, Orbb | Round arena: sunken pit with a lava moat around a dais where the rocket launcher and plasma gun alternate, four towers (Red Armor, grenade launcher, health), jump pads from the pit to the towers, alcoves in the outer wall |
| 1 | Q3TOURNEY1 Power Station 0218 | Sarge (tournament) | Tech map: round generator room with the shotgun behind the giant pillar, dead-end rocket room with a pillar, hallway with a small gate and the Yellow Armor, big hall with catwalks where Quad Damage and Regeneration alternate |
| 2 Skilled | Q3DM4 The Place of Many Deaths | Grunt, Bitterman | Open hall with two crossing high bridges (rocket launcher on the crossing), Quad Damage below between four lava pits, rooms with Red and Yellow Armor, upper rooms with the plasma gun and lightning gun |
| 2 | Q3DM5 The Forgotten Place | Hossman, Daemia | Sunken courtyard surrounded by arcades, bounce pad up to the roof walk with the Red Armor and the lightning gun, chapel, library with the shotgun, crypt with the rocket launcher |
| 2 | Q3DM6 The Camping Grounds | Orbb, Bitterman, Grunt, Daemia | Big atrium: long jump pad to the rocket launcher on a high bridge, Yellow Armor on a dais between narrow stairs, railgun on a concave catwalk with a bounce pad and five small health below, hall of tightly spaced pillars, room with Mega Health and Red Armor and a personal teleporter on top of a tall pillar |
| 2 | Q3TOURNEY2 The Proving Grounds | Hunter (tournament) | Main hall with the Yellow Armor, lightning gun on a narrow bridge, teleporter from the balcony down to the shotgun side and back, rocket room off a tight catwalk |

Tier 1's tournament unlocks after its three arenas are won; Tier 2 unlocks after Tier 1. Winning a tier unlocks its cinematic.

## Weapons

Gauntlet (50, only when it touches), Machinegun (7 per bullet, 10/s), Shotgun (11 pellets of 10), Grenade Launcher (100 + splash 150 u, bounce, 2.5 s fuse), Rocket Launcher (100 + splash 120 u, 900 u/s), Lightning Gun (8 per 50 ms, 768 u), Railgun (100, goes through players, Impressive for two hits in a row), Plasma Gun (20 + small splash, 2000 u/s), BFG10K (100 + splash 120 u). Quad Damage triples all damage and knockback.

## Menus

Main menu with the burning QUAKE III logo, the spinning emblem and the red item list: SINGLE PLAYER (tiers, levelshots rendered from the maps, opponents, skill), MULTIPLAYER (an Internet server list of bot matches with modem pings, plus START SERVER for custom games: FFA, Tournament, Team Deathmatch, bot slots), SETUP (player name and model with a 3D preview, controls, system with brightness, gamma and contrast, game options, sound, defaults), DEMOS (two built-in bot demos and the last matches you played, recorded automatically), CINEMATICS (intro and tier endings as in-engine flythroughs), TEAM ARENA (the mission pack is not installed), MODS (Quake III Arena, InstaGib, Rocket Arena) and EXIT. In game: `Esc` menu (resume, add or remove bots, setup, restart, leave, exit) and the `~` console (`map`, `god`, `noclip`, `give all`, `kill`, `addbot`, `fraglimit`, `timelimit`, `name`, `sensitivity`, `cg_fov`, `cg_drawfps`, `disconnect`, `quit`).

## Architecture

Files live in `js/apps/quake3/` and extend `globalThis.Quake3`:

- `q3-core.js` math, seeded random numbers, matrices; `q3-data.js` weapons, items, bots, arenas, obituaries.
- `q3-world.js` convex brush world: map builder (boxes, prisms, ramps, stairs with invisible clip ramps, rings, arches, pyramids, room carving by layers), face generation, BVH and Quake-style box traces.
- `q3-map-*.js` the eight arenas.
- `q3-pmove.js` player movement (port of the Quake III rules); `q3-game.js` match simulation at 60 Hz: weapons, projectiles, damage, items, triggers, scoring, awards, rules; `q3-nav.js` automatic bot navigation graph (sampled floor nodes, walk, stair, drop, jump, jump pad and teleporter links); `q3-ai.js` bots.
- `q3-light.js` lightmap and light grid baker (point lights, sun, sky light with shadows); `q3-tex.js` procedural textures and decals; `q3-models.js` characters, weapons, items, gibs and the emblem; `q3-render.js` WebGL renderer (every pass applies brightness, gamma and contrast from SETUP > SYSTEM); `q3-fx.js` particles, marks, trails, dynamic lights; `q3-scene.js` frame assembly, first person weapon, podium, 3D HUD icons.
- `q3-audio.js` synthesized sounds, music and the speech announcer; `q3-hud.js` HUD and scoreboard; `q3-menu.js` menus, fire logo, levelshots, cinematics; `q3-ui.js` the application (input, sessions, demos, console).

The simulation is deterministic for a seed: a demo stores the seed, the settings and the player's commands, and replays the whole match.
