# Grand Theft Auto: Екатеринбург '90

A from-scratch top-down remake of the first Grand Theft Auto, set in Sverdlovsk in 1990–1991. The map is the real Central residential district of the city at 1:1 scale, built from OpenStreetMap and corrected to how the centre looked around 1990. The story ends on 23 September 1991, the day the city got back its old name, Yekaterinburg. The game uses a Canvas 2D renderer with perspective-extruded buildings, a living city with traffic, trams, pedestrians and police, and 25 story missions in three chapters.

- The game is sold and downloaded through the in-system Steam client (catalog id `gta90`). It is never preinstalled.
- Installed: desktop icon **GTA: Екатеринбург '90**, Start menu → **GTA: Екатеринбург '90**, `C:\Games\GTA90\GTA90.EXE`, Run: `gta`, `gta90`, `gta1`, `гта`, `екатеринбург`, `екб`, `свердловск`, `grand theft auto`.
- Standalone page: `gta90.html` (`window.g90ui` is the UI instance).
- Test: `npm run test:gta90` (about 690 checks in about 6 seconds). Bots drive along the lanes, enter every garage and play all 25 missions to the ending.
- Screenshots: `node tools/gta90-shots.cjs <outDir> "<scenes>"` (see "Tools" below). Steam screenshots: `node tools/steam-shots.cjs gta90`.

## Controls

| Input | Action |
| --- | --- |
| Arrows / W A S D | Drive; on foot walk and turn (a setting switches on-foot control to screen directions) |
| Space | Handbrake in a car, fire on foot |
| Ctrl | Fire; in a car: shoot forward, start a fitted bomb, fire the tank gun |
| Enter / F | Get into the nearest car (the driver is thrown out) or get out |
| Q / E / Tab, 1–6 | Weapons: fists, PM pistol, sawn-off, AKM, RPG-7, Molotov cocktail |
| Shift | Walk slowly |
| H / R / T | Horn / radio station / taxi job («бомбить») |
| M | City map with phones, garages, hospitals, police stations and the export list |
| − / = | Camera zoom |
| Esc / P | Pause: map, save, load, statistics, settings, controls |

Cheats are typed during play: `NOCOPS`, `ARSENAL`, `VOLGA`, `TANK`, `BESSMERTIE`, `DENGI`.

## The city

The play area is the Central residential district inside Московская, Челюскинцев, Восточная, Ткачей and Фурманова streets, about 3.6 × 5.1 km. One metre is 9.3 px. The map frame is turned by 11.3° so that the street grid of the centre runs along the screen axes. A 190 m margin around the play area is drawn darker and is not reachable.

- **Landmarks.** Плотинка and the Исторический сквер on the Iset, the City Pond, проспект Ленина with the tram boulevard, Площадь 1905 года with the Lenin monument, Октябрьская площадь with the Дом Советов, the Opera and Drama theatres, the circus with its dome, the unfinished TV tower inside a fenced construction site, the Central Market with rows of covered counters, the Dynamo stadium, Вознесенская горка, the railway station, Зелёная роща and the Дворец спорта.
- **1990 corrections.** Buildings started after 1991, modern towers and business centres are removed. Post-Soviet street names are changed back (улица 9 Января, улица Толмачёва). The Passage is the old low department store. Metro stations Площадь 1905 года and Динамо are construction sites. Removed modern buildings are replaced by what stood there before: wooden houses with plank fences, sheds, vegetable gardens and apple trees along the streets, two-storey brick houses on the main streets, wooden barracks and rows of garages inside blocks.
- **Courtyards.** Hockey boxes with solid boards, playgrounds, rubbish container pads, carpet-beating frames, laundry lines, benches at the entrances, lawn patches and many trees.
- **Buildings** are drawn by era from their OSM data: wooden houses, pre-revolution merchant houses with cornices and shop signs, constructivism, Stalin-era blocks with hipped roofs, khrushchyovkas, panel blocks, public buildings with ribbon windows, industrial halls with skylights. Flat roofs have parapets, roofing seams, patches, vent shafts, lift machine rooms and TV aerials that all point to the same transmitter.
- **Traffic.** Lanes come from the real number of lanes and one-way rules. Junctions have traffic lights where OSM has signals. Trams run on the real tram network, stop at the real stops, brake for cars on the tracks and ring their bells. Buildings and fences never block a traffic lane: a building over a lane becomes an arch that cars drive through.

## Gameplay systems

- **Scoring.** Roubles are both points and money. Every reward is multiplied by the multiplier. The multiplier grows by one with each finished mission and falls when the player is busted or killed.
- **Chapters.** Each chapter has three payphones with their own contacts. A ringing phone is answered on foot. When the chapter target is reached, the boss calls with the final mission. Targets: 60 000, 120 000 and 200 000 roubles earned inside the chapter.
- **Police.** There are four wanted levels (militia caps). Police officers on foot arrest a slow or stopped player. At level 3 the police shoot and build roadblocks. At level 4 KGB Volgas and OMON join. Wanted levels fade while no officer sees the player. A respray (1000 roubles) or a bribe crate clears them at once.
- **Garages.** Three spray shops, two bomb workshops (3000 roubles, Ctrl in the car starts a four-second fuse), the Утильсырьё crusher, the container yard that buys cars from a list for each chapter, and three mission garages that open only when a mission needs them. Every garage has a straight, fence-free approach.
- **Side content.** The taxi job, six kill frenzies, 20 hidden badges (all 20 give a bonus and armour in every safehouse), extra lives and multiplier crates, boats on the City Pond (Kazanka and the «Прогулка» pleasure boat), a tank near the station, and kiosks and market stalls that a fast car smashes.
- **Death and arrest.** Wasted costs one life, the weapons and one multiplier step. The player wakes up at the nearest hospital. Busted costs the weapons and half of the multiplier; the player is released from the nearest police station. With no lives left the chapter can be restarted.
- **Radio.** Three synthesized stations: «Урал-Диско» (disco), «Рок-клуб» (Sverdlovsk rock) and «Маяк» with a news ticker that follows the story.

## Story

| Chapter | Contacts | Missions |
| --- | --- | --- |
| 1. Плотинка (3 September 1990) | Valera Plotinka, aunt Zina from the market, Gosha Tsirk | The first car, stonewashed jeans, the runaway cashier, the Moscow train, the meeting at Dynamo, vodka for coupons, taxi fares, finale at the Central Market |
| 2. Цирк (15 April 1991) | Gosha Tsirk, mechanic Mikhalych, Shura the racer | Spare parts, the new Volga, captain Mokhov, the crusher, the night race, the cash van, a bomb for Ded, finale at the TV tower |
| 3. Дом Советов (19 August 1991) | The Director, secretary Larisa, Valera Plotinka | The obkom Volga, currency, a pond cruise, the film, Вознесенская горка, the Dynamo match, the metro parcel, the betrayal, finale on 23 September: stop the Director's Volga before it reaches the Siberian highway |

## How the map is built

The map is generated once from OpenStreetMap by `tools/g90-import.cjs`, driven by a district config:

```sh
node tools/g90-import.cjs tools/g90-center.json <osm.json> js/apps/gta90/g90-ekb-center.js [--report]
```

- `<osm.json>` is an Overpass export (`out body; >; out skel qt;`) of the district bounding box with highways, railways, buildings, building parts, landuse, natural, leisure, amenity, barriers and trees.
- `tools/g90-center.json` holds the frame (`lat`, `lon`, `rot`), the scale, the play polygon in frame metres, `pad` and `margin`, the cut-off `year`, street renames, dropped streets, `modernNames`, manual `dropBuildings` / `keepBuildings`, per-building `override` (levels, name, style, kind), `addBuildings`, `addAreas`, `addBarriers` and `infill`.
- `--report` writes `<id>-review.json` with removed, kept and suspicious buildings and their coordinates, for checking against old maps (retromap.ru plans and 1975 satellite images were used for the centre).
- The output pushes one record into `Gta90.DISTRICTS`: roads (`name,cls,lanesF,lanesB,width,sidewalk,flags:points`), service roads, buildings (`levels,style,roof,name,wall,roof colour,kind:rings`), areas (`kind[,name]:rings`), rails, barriers, trees and POIs. Points are base-36 deltas in pixels.
- Building styles: `w` wood, `o` old house, `c` constructivism, `s` Stalin era, `k` khrushchyovka, `p` panel, `q` public, `i` industrial, `g` garage or shed, `r` church. Roofs: `f` flat, `h` hipped, `g` gabled, `p` pyramidal, `d` dome. Area kinds: `w` water, `p` park, `g` grass, `v` vegetable garden, `f` wood, `q` square, `k` parking, `c` construction, `r` railway, `s` pitch, `b` sand. Barrier kinds: `w` wall, `f` fence, `r` retaining wall, `p` plank fence, `h` hockey boards.

At game start `City` builds everything else from the district data:

1. `Net` (`g90-net.js`) turns the roads into segments, junction polygons, lanes with Bézier connectors, traffic light groups, a pruned strongly connected traffic graph and a sidewalk and crossing graph.
2. `City.rasterize` fills 16 px surface and building rasters and the play mask; `buildingAt` is exact (spatial hash plus polygon test).
3. `Sites.place` (`g90-sites.js`) resolves named places, garages, construction sites and zones.
4. `City.trimBarriers` cuts fences out of roadways and traffic lanes.
5. `Yards.place` (`g90-yards.js`) builds a distance field of free yard space and places hockey boxes, playgrounds, rubbish pads, laundry lines, carpet frames, benches, lawns and yard trees.
6. `City.collisionIndex` builds the segment hash for buildings, fences, water and the play edge, with arches where a building covers a traffic lane.
7. Props (trees, lamps, signals, stops, kiosks, market rows, monuments), parking spots and render indexes.

Another district is added with its own config and data file. `City` accepts several entries in `Gta90.DISTRICTS`; the first one sets the frame.

## Module layout (`js/apps/gta90/`)

| File | Owns |
| --- | --- |
| `g90-core.js` | RNG, heap, spatial hash, polyline and polygon math, money and time format, `{m\|f}` gender templates |
| `g90-data.js` | Vehicles (with the ZiU trolleybus), weapons, pedestrian types, gangs, pickups, characters, radio stations, news |
| `g90-ekb-center.js` | Generated data of the Central district (do not edit by hand) |
| `g90-net.js` | Road network: junctions, lanes, connectors, traffic lights, routing fields, sidewalk graph |
| `g90-city.js` | District loading, geo frame, rasters, exact building lookup, fence trimming, collision segments with arches, props, zones, render indexes |
| `g90-sites.js` | Zones, named places and their snapping, garages, monuments, kiosks, market rows, construction sites, badges, parking |
| `g90-yards.js` | Courtyard generator and courtyard drawing |
| `g90-phys.js` | Car physics, car–world, car–car, car–pedestrian, car–prop and car–stall collisions |
| `g90-world.js` | Entities, player control, weapons, damage, wanted level and police, roadblocks, pickups, garages, population |
| `g90-tram.js` | Tram network from the rails, tram spawning, stops, braking, bells and hits |
| `g90-ai.js` | Lane-following traffic with lights and yielding, police, hunters, routes, races; pedestrians |
| `g90-ground.js` | Ground chunks: areas, lawns, gardens, roads, markings, crossings, rails, barriers, courtyards, baked shadows |
| `g90-bldg.js` | Buildings: facades by style, shopfronts and signs, flat and pitched roof textures, domes, TV tower, flags |
| `g90-render.js` | Camera projection, draw order, cars, pedestrians, trams, props, effects, markers, minimap |
| `g90-audio.js` | Synthesized engine, siren, weapons, tram bell, jingles and the radio stations |
| `g90-story.js` | Chapters, missions, frenzies and the ending text |
| `g90-missions.js` | Mission step runner and data validation |
| `g90-game.js` | Progress, scoring, phones, garages, taxi job, frenzies, badges, death, arrest, saves |
| `g90-ui.js` | Screens («Вечерний Свердловск» menu, police files, chapter intro, pause, map, saves, settings, statistics, endings), HUD, input, camera, game loop |

## Authoring notes

- **Places** are defined in `PLACES` in `g90-sites.js` as `[name, ref, snap, offset]`. `ref` is `[lat, lon]`, `'Street A×Street B'` (a junction of two named streets), `'#Building name'` or `'@Area name'`. `offset` is `[dx, dy]` in frame metres. `snap` is `road` (nearest lane), `walk`, `plaza`, `yard` (room for a car) or `water`. Snapped points keep 1.6 m (3 m for `yard`) from any wall. Missions refer to places by id.
- **Garages** need a building-free, fence-free straight approach of 14 m; `garageSpot` searches around the given coordinates for one.
- **Missions** are lists of steps: `spawnCar`, `spawnPed`, `wanted`, `clearWanted`, `hostile`, `say`, `setDate` run at once. `enter`, `deliver`, `goto`, `kill`, `wreck`, `damage`, `unseat`, `pickup`, `board`, `drop`, `lose`, `follow`, `race`, `crush`, `fares`, `bombfit`, `countdown` and `wait` block until done. `time` on a step is a fail timer. `validateMission` checks places, models, pedestrian types and references.
- **Timing.** Distances are real: crossing the centre takes a car 2–4 minutes along the lanes. Measure routes before setting mission timers.
- **Re-importing** changes building ids, so code refers to buildings by name and never by id.
- **Line endings.** The files use LF. Python on Win writes CRLF in text mode, so edit scripts must open files with `newline=''`.

## Tools

`node tools/gta90-shots.cjs <outDir> "<scene>,<scene>,..." [script.js]` starts the local server and headless Edge, opens `gta90.html` and saves PNG files. Scenes: `title`, `place:<id>[:zoom]`, `geo:<lat>:<lon>[:zoom]`, `drive:<placeId>[:frames]`, `map`, `script:<name>` (evaluates `script.js`; a returned data URL is saved). Frames are pumped by hand (`requestAnimationFrame` is stubbed), so the shots do not depend on timing.
