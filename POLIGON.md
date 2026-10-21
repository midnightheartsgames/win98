# ПОЛИГОН (www.poligon3d.ru)

A Win98-era website in Internet Explorer that plays music videos rebuilt as real-time low-poly WebGL scenes. The audio comes from the mp3 files in `content/clip/`. The picture is rendered at 512×384 and synced to the audio clock.

- Open: IE → Favorites → **ПОЛИГОН (Клипы в 3D)**, or search for «клип».
- Test: `npm run test:poligon`.
- Files: `js/apps/poligon-site.js` (page and player), `css/apps/poligon-site.css`, `js/apps/poligon/` (renderer, rig, clips).

## Clips

| № | Clip | Length | Shots | Module |
|---|------|--------|-------|--------|
| 1 | Rick Astley — Never Gonna Give You Up | 3:33 | 98 | `clip-never-gonna.js` |
| 2 | HEARTSTEEL — PARANOIA | 3:44 | 118 | `clip-paranoia.js` |
| 3 | Владик в депрессии — Paranoia FunCover | 3:38 | 82 | `clip-vladik.js` |
| 4 | Таракан и червячок — visual-kei version | 4:17 | 123 | `clip-tarakan.js` |
| 5 | DJ Melon — Neck Hurts | 3:05 | 57 | `clip-neck-hurts.js` |
| 6 | Sam & Max — War Song | 2:44 | 43 | `clip-war-song.js` |
| 7 | Cosplay Convention Crisis — You Gotta Choose | 3:01 | 75 | `clip-ccc.js`, `ccc-cast.js` |

Clips 3 and 4 are hidden for now: their objects carry `hidden: true`, so `PoligonSite.clips()` leaves them out of the page, the clip URLs and Clippy's menus. The modules still load (other clips use `P3DVladikKit`). Remove the flag to bring a clip back. The site numbers its list by position, so hidden clips leave no gaps.

Clips 1–5 use original low-poly figures. The videos follow the rhythm and locations of their sources but do not copy their characters, logos or lyrics. Clip 2 uses an original six-piece band instead of the HEARTSTEEL members. Clip 5 uses an original melon DJ instead of the game character from the source video. Clip 6 is the exception: it restages the musical number of the project's own Sam & Max episode 104, so Sam, Max and Agent Superball appear as they look in that game. Clip 7 is the song of the author's own visual novel Cosplay Convention Crisis, so Amanda, Makoto, Talleah and the gynoids follow their character sheets in `content/CCC/`.

## Clip 3 scenario: «Владик в депрессии»

**Kernel.** Vladik wakes up at 07:00 under his own personal rain cloud. He is sad, hungry and has lost control of his farts. The song walks him through a day of gags staged in the sets of the PARANOIA video. It ends with Vladik and his friends on a row of toilets, reading newspapers, when the cloud finally dissolves in the sunrise.

**Rules.**
- The yordles from the lyrics are played by original big-eared critters in hoodies.
- The yakuza line is played by an original thug in a white suit.
- Shops, brands, games and the friends' nicknames appear only as generic stand-ins; no logos and no names on screen.
- On-screen text is limited to short comic words: «ПУК!», «БЗДЫНЬ!», «ナニ?!», «МЕГА НАСРАЛ», «НЕ ВЛАД», «ШОК!», price tags and the 07:00 clock.

**Timing.** 85 BPM, first beat at 0.404 s, one bar = 2.82 s. Most lyric lines fit into one bar, so most cuts land on bar lines (`bar(k)` in the code).

| Time | Section | Cue | Place | What happens |
|------|---------|-----|-------|--------------|
| 0–11.7 | Intro | (пук, пук) | Flat | Night bedroom and a 07:00 clock. Two comic «ПУК!» bursts, gas escaping from under the blanket. Vladik sits up under his rain cloud. Felix snaps the clapperboard «ВЛАДИК В ДЕПРЕССИИ, ДУБЛЬ 1» on the beat drop. |
| 11.7–34.3 | Verse 1 | «Владик в депрессии…» | Flat, pool, ring, bathroom, corridor | Slumped on the sofa. An empty fridge, then a look at the WC door. Close-up under the cloud. A swim in a yellow-graded pool. A fart that blows six critters out of the ring. Head in hands on the toilet. The laser corridor turns into a gas walk with a flashing red alarm. Vladik by the rainy window. |
| 34.3–37.1 | Break | silence | Flat | Vladik stares into the camera. |
| 37.1–48.4 | Pre-chorus 1 | «по чесноку» | Street, stage, bridge, store | Gangsta Vladik by a bouncing lowrider. Felix in the police lineup with his cat and a «НЕ ВЛАД» slate. Grandma on the bridge with a «ШОК!» phone. Bread priced at 999 €. |
| 48.4–51.2 | Break | — | Flat | Vladik runs to the WC. |
| 51.2–73.8 | Chorus 1 | «Я напердел…» | Street, stage | «БЗДЫНЬ!» burst. A toilet-kart with a green exhaust races the van through the neon street, and the van swerves in the cloud. Friends dance. «МЕГА НАСРАЛ» in voxel letters. Vladik as the Thinker on a toilet under a spotlight. |
| 76.6–110.5 | Verse 2 | «Камя на связи…» | Desert, store, flat, street, roofs, corridor, stage | Friend on a headset and friend on a deck chair. The bald friend buys candy. The gamer's monitor rolls a 1. Gangsta Vladik again, then over the city from a roof. Doctors in a white corridor and a «ナニ?!» burst. Critters dance in a circle. Shopping cart, thumbs up, raining coins. Vladik runs from the thug and jumps off the roof. |
| 110.5–121.8 | Pre-chorus 2 | «Мистер Макс…» | Bridge, desert, flat, corridor | A friend writhes on the red bridge. A hunter with binoculars stalks critters at dusk. A green cloud rolls into the living room. Vladik tiptoes to the glowing WC at the end of the vault. |
| 121.8–124.6 | Break | — | Bathroom | The stall door slams. |
| 124.6–147.2 | Chorus 2 | «Я напердел…» | Ring, stage | Vladik enters the ring in a toilet-paper robe. He fights the junk robot and friends cheer from ringside. A fart blast, a «ПУК!!!» burst, the robot flies out of the ring, and Vladik wins. «МЕГА НАСРАЛ», then the Thinker again. |
| 150.1–175.5 | Bridge | «Озон геймс…» | Flat, street, stage, pool | A gamer turns into a paunchy guy with a beer. A friend sleeps on a street bench. A friend in a tuxedo eats oysters by candlelight. A girl waves on stage and a crate of beer comes down from above. Vladik flexes. Everyone gives a thumbs up. A happy swim, then rising to the surface. |
| 175.5–178.3 | Break | — | Comic | «МЕГА!» burst. |
| 178.3–200.9 | Chorus 3 | «Я напердел…» | Desert, stage | A jeep carries Vladik on a toilet with green gas behind it. Critters on motorbikes choke in the cloud. The whole crew dances in front of the red diamond wall. Vladik flies on a fart jet over the desert, and the jeep drives into the sunset. The Thinker in the dark. |
| 200.9–212.2 | Outro | «Пердеть на туалете…» | Bathroom, flat | Six friends on a row of toilets read newspapers and laugh. Vladik's cloud dissolves in sun rays. At 07:00 he stretches in a sunlit bedroom. |
| 212.2–218.4 | End | — | Ident | The ПОЛИГОН triangle, then fade out. |

## Clip 4 scenario: «Таракан и червячок»

**Kernel.** A lonely visual-kei singer comes home, finds a cockroach by the flower on his windowsill and kills it with a slipper. Later he finds a drunk worm there, and the worm dies before the slipper even lands. Grief, guilt and loneliness turn into love: by the end the roaches and worms live with him, eat at his table and come to his door in top hats as guests.

**Style.** The look follows the late-90s visual-kei music video: fast cuts, film grain, vignette, flicker and strobe. The palette is split by place:
- Hangar (band performance): cold, desaturated silver-blue.
- Apartment (story): warm sepia, with a dusty violet tint for the evening of verse 2.
- Rock garden (surreal chorus sequences): saturated white sand with ripples, black stones and a giant red flower.
- Comic flashes: black, red and white with katakana (ゴキブリ, ミミズ, 死, バカ).

**Rules.**
- The band and the singer are original characters: spiky hair, black eye makeup, black lips. There is no likeness of any real musician.
- The reference videos set only the aesthetic. No shots, gore or nudity are copied.
- The worm's crude line is covered by a «ЦЕНЗУРА» bar and a censor flash.
- No profanity from the lyrics appears on screen.

**Timing.** 70 BPM, first beat at 0.504 s, one bar = 3.43 s. Story beats follow the vocal phrases. Performance cuts sit on bars, with strobe on the loud hits.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–9 | Acoustic intro | Apartment, hangar | Empty sepia room, a macro shot of the red flower, the singer's back under a bare bulb. |
| 9–33 | Verse 1 | Apartment, hangar | The band kicks in with a strobe. He comes home and walks to the window, and a macro shot reveals the cockroach by the pot. A fisheye close-up of the singer, his stare, a «ゴキブリ» flash. |
| 33–65 | Bridge 1 | Apartment, hangar | Slipper raised, slam, a «死» flash, the squashed roach and green splat. He smears the guts across the floor, then mops it with bucket and mop, intercut with drums, guitars and screams. |
| 65–86 | Chorus 1 | Rock garden, hangar | A giant dead roach lies on its back on the sand, legs twitching. The singer screams on his knees under the giant flower. Strobe band hits. |
| 86–122 | Verse 2 | Apartment (evening), bathroom | A drunk worm with a bottle by the flower, then the «ЦЕНЗУРА» bar and flash. The slipper swing, and the worm dies with X eyes. It is flushed into a swirling toilet, and he talks to the bowl. |
| 122–156 | Chorus 2 | Rock garden, hangar | A giant worm dances, goes limp, grows goat horns and «talks». Flashes: ミミズ, 死, バカ. |
| 156–200 | Verse 3 | Apartment, street, bathroom, hangar | Bugs live on the sill, the bed and the desk. He walks to «ШКОЛА №13» with a giant roach and worm. They share a row of toilets. Guitar solo with strobe. Dinner with giant upright bugs, then a hug. |
| 200–230 | Bridge 2 | Apartment, rock garden | He invites guests at the door. Roaches and worms in top hats bow, then parade across the sand. |
| 230–257 | Outro | Hangar, rock garden, apartment | Screaming chaos with strobe and a swarm circling the singer. The last shot is the flower, with a roach and a worm sitting peacefully beside it. |

## Clip 5: «Neck Hurts»

**Kernel.** A night of one DJ set, shot on a cheap camcorder. The DJ plays in a dark tatami room, walks through a corridor of torii gates to a house with paper lanterns, and ends up on a club stage in front of an audience of giant melons that bounce on every beat. Between the sets she eats noodles in a four-panel comic, a melon is scanned and sliced in a targeting display, and the city sleeps under a glass dome shaped like a melon.

**Rules.**
- The DJ is an original character, **DJ Мелон**: a green bob with two rind-textured buns, big amber eyes, white headphones with orange cushions, an orange hoodie with green trim, dark green shorts and white socks. Her companion is **Дынька**, a small melon drone with a propeller leaf. Neither of them resembles the game characters of the source video.
- The source HUD texts (weapon data sheets, game and character names) are replaced with melon-scan data. The club sign reads NIGHT CLUB, the LED wall reads MELON, and the posters show a melon slice, the DJ and the word メロン.
- The only lyric-free words on screen are the title «Neck Hurts» and the camcorder read-outs (28 MIN, REC, AUTO DATE, F5.2, CH 5, COUNT, ISO AUTO and timecodes).

**Style.** The whole clip is framed as camcorder footage in 16:9 inside the 4:3 player. Four HUD skins follow the source: the night camcorder (battery, «A», 28 MIN, T45, REC, focus crosses), the targeting display (pink striped bars, F5.2, data columns), VHS (CH 5, COUNT, running timecode, a noise band) and the photo mode (1/180 F5.2, focus brackets, ISO AUTO). Every scene has bloom. Transitions are white flashes with cyan blobs, pixelation, horizontal glitch bands, RGB splits, a negative flash and a dissolve.

**Timing.** 126 BPM, first beat at 0.41 s, one beat = 0.476 s. The vertical strips appear one per beat, and the stage lights, the melon audience and the house lights change color on the beat.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–2.8 | Intro | Club sign | A pink flash opens on the NIGHT CLUB sign with the DJ and a melon on it, next to a lit window. |
| 2.8–7.2 | Intro | Targeting display | A melon turns in the scanner, then splits in half over a pink burst and the halves fly at the camera. |
| 7.2–15.4 | Hook | Lunch comic | Four panels (cyan, purple, coral, lime) fill a 2×2 grid; in each the DJ eats noodles, and finished panels fade to grey. A glitch tears the grid apart. |
| 15.4–28.6 | Verse | Tatami room, torii, house | The DJ plays in the dark room under a light shaft. The camera glides through the torii corridor to the house, where she waits at the door in beat-colored light. |
| 28.6–45.8 | Build | DJ close-ups | Four vertical strips, one per beat, then a 2×2 grid of zooms, then a solo shot whose colors cycle until a white-out glitch. |
| 45.8–57.1 | Drop | Stage | The rainbow title flash, then the stage: LED wall with MELON, disco ball, truss bulbs, moving beams and the bouncing melon audience. |
| 57.1–76.8 | Drop | VHS, strips, stage | VHS close-ups with a V-sign (green, then red with glitches) cut against strips and the stage; a red scribble frame closes the section. |
| 76.8–89.6 | Break | Night street | Looking up at the melon dome, which flickers in and out with the glitches; glass towers; the DJ in a purple alley beside a stone lantern. |
| 89.6–114 | Verse 2 | Strips, sign, torii, scanner | The intro images return in a new order. |
| 114–122.2 | Hook 2 | Lunch comic | The second lunch, ending in a cyan glitch. |
| 122.2–137.6 | Bridge | Room, torii, house | The torii gates sway and then break apart and fly off; the house shakes with jitter glitches; color bars and the fire title. |
| 137.6–168.2 | Drop 2 | Stage, VHS, grids | The stage returns with more cuts to VHS and a psychedelic hue flash. |
| 168.2–170.2 | Photo shoot | Diagonal backdrops | The DJ with a microphone and Дынька on blue; a raised glowstick on a pink-and-red grid. |
| 170.2–180.8 | Outro | Japanese hall | A party in a hall with shoji and posters: the DJ under a disco ball, melons dancing in front. |
| 180.8–185.8 | End | Scanner, title | The last panels over the scanner, then the neon title recedes and fades. |

## Clip 6: «War Song»

**Source.** The musical number from *Sam & Max: Abe Lincoln Must Die!* (episode 104), 164.0 s, analysed from `content/clip/War Song.mp4`. The soundtrack is `content/clip/War Song.mp3`, which matches the video sample for sample. The clip ends with the two closing lines after the song: Sam says "Well…" (162.05–162.55 s) and Max says "Let's not do that again." (162.9–164.0 s).

**Kernel.** A red alarm goes off in the Oval Office. Agent Superball pops up behind President Max's desk and sings that it can mean only one thing: war. The Secret Service agents turn the office into a revue: a stage with giant WAR letters, a campaign poster, a globe that opens into a pool, a giant flag. When the last agent walks out and the door closes, Sam and Max are left alone at the desk.

**Rules.**
- Sam, Max and Superball follow the look of the original (Sam: brown dog, grey suit, blue striped tie, grey fedora; Max: white rabbit with a zigzag grin; Superball: pale long face, brown pompadour, sunglasses, earpiece, dark suit, red striped tie). The backing agents are Superball's identical colleagues.
- No lyrics appear on screen. The only words are props from the episode: the WAR sign, APRIL on the calendar, MR. PRESIDENT, UNITED STATES OF AMERICA on the globe, the seal motto, GAS, and the two posters (I CAN SEE YOU / VOTE FOR PEEPERS, GIVE ME ALL YOU GOT!).
- The two closing lines are spoken lines, not lyrics, and get Russian subtitles: «Ну…» and «Давай больше так не будем.»

**Timing.** 120 BPM. From about 39 s to the end the beats sit on `0.19 + 0.5k` s; the intro before 36 s has no steady drum and is staged on the vocal phrases instead. Lip sync uses a 20 Hz envelope of the Demucs vocal stem (`VOICE`, `voiceAt`) gated by who sings: Superball sings the solo lines, the agents join only in the choruses (`SOLO`, `CHORUS`, `SCAT`), and Sam and Max move their mouths only during their own `LINES`.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–11.1 | Intro | Desk | Max grins at the desk. Superball rises behind it at 4.9 s and starts singing. Close-ups of Sam and Max. |
| 11.1–28.4 | Verse | Office | Superball sings by the calendar while the camera drops low; the red ceiling light comes on at 13.6 s. Two-shot of Sam and Max. Superball by the bookshelf points up, the camera tilts to the door and the WAR sign lights up at 24.8 s with Superball lying on the pediment. |
| 28.4–39.97 | Verse | Office, desk | Low close-up for the long "war" note. A nutcracker figure in a powdered wig screams with its hands on its cheeks. Sam and Max again. |
| 39.97–51.6 | Chorus | Office, desk, fireplace | Superball on the striped sofa while two agents lean into the frame; the camera rushes in to his hand on his chest. Sam and Max. Superball by the fireplace. |
| 51.6–62.2 | Verse | Seal rug, desk, eagle | Agents slide in on their backs around the presidential seal. An agent lies across the desk next to Sam and Max, and Superball slides into close-up. Superball leans in next to the bronze eagle. |
| 62.2–72.6 | Chorus | Office | Superball dances with four agents in a Cossack squat; the room goes dark and a star-shaped spotlight frames him. Two agents open the door and the camera flies through it into darkness. |
| 72.6–79.3 | Dance break | WAR stage | Four agents dance in front of giant WAR letters on a gable backdrop; the letters light up red at 74.4 s and the light turns blue at 76 s. |
| 79.3–95.4 | Dance break | Poster, globe | The Peepers campaign poster. Agents march around a giant globe dome, the dome opens into a pool, they walk the rim, float in a star formation, and Superball rises on a platform. |
| 95.4–116.7 | Dance break | Poster, flag | Agents pose on the GIVE ME ALL YOU GOT! poster. Superball pops out of a star of the giant flag, the camera pulls back and pans, agents march, shout and dance in front of the flag and kick past a low camera. |
| 116.7–135.0 | Chorus | Desk (iris), office, desk | A doorway iris shows Max at the desk; the sofa slides in and the camera dives to Superball's sideways face. Superball lies on the sofa with agents behind it under a coloured star light. Agents with folded arms circle Max at the desk and Superball pops up in front. |
| 135.0–151.6 | Bridge | Spotlights | Agents march through the dark office under roving spotlights. Fast cuts of Superball in a circular spotlight: by the Washington portrait, above the desk, with the cymbal monkey, by the Liberty Bell. |
| 151.6–160.8 | Finale | Door | Three agents dance under the red ceiling, the door opens, they walk out one by one, the last one gives a thumbs-up and the door closes. |
| 160.8–164.0 | Ending | Desk | Wide shot of the quiet office: Sam turns to Max and says "Well…" Close-up of Max: "Let's not do that again." Subtitles are drawn by the clip. |

## Clip 7: «Cosplay Convention Crisis»

**Source.** The game's title song, `content/clip/Cosplay Convention Crisis.mp3` (180.77 s, a copy of the file in `content/music/`). The character sheets and the script of the first day are in `content/CCC/`. The full plan, the shot table and the author's decisions are in `POLIGON-CCC.md`.

**Kernel.** Thursday at Con-Ton seen through Jacob's eyes. A spotlight on an empty dark stage picks the three heroines one by one. The bus, room 302, the arrest, the corridor duel, Amanda's transformation, Makoto's theft and disco, Talleah in the healing tube, the evening quarrel and a concert where all three stand on stage in their true forms. At the end the three squeeze into one spotlight, Jacob takes their photo, and the gorilla portrait in room 302 looks at the snapshot and blinks.

**Rules.**
- The clip is for all ages: no nudity, no blood, closed necklines on the magical dress and the catsuit. Jacob's death from the game's prologue is not shown.
- Jacob never shows his face: the camera is his eyes (POV arms from `Cast.drawPov`), or he appears in the Magnitude helmet or from behind.
- Costumes of real heroes are replaced by own designs (Lantern, Magnitude, Captain Europe's shield, the crowd's knight, witch and space ranger).
- The only words on screen are CON-TON × CAPE CITY, 302, Magia on Amanda's T-shirt and the closing title.

**Timing.** 130 BPM, first beat at 0.026 s, one bar = 1.846 s; every section of the song is eight bars long. `SHOT_LIST` stores beat numbers, so every cut sits on a beat.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–14.8 | Intro | Dark stage | Spotlight click, three shadows, the light picks each girl in her colour, a strip of eyes, the line-up with a gesture each |
| 14.8–44.3 | Theme, chorus 1 | Bus, outside, room 302, corridors, lawn | Amanda and Makoto take the seats beside Jacob; the bus arrives; the costumes, the gorilla, the call; Talleah over Jacob lying in the grass |
| 44.3–59.1 | Names | Character sheet studio | Each girl's second form on a turntable with colour chips; three panels flip back to everyday clothes |
| 59.1–73.9 | Chorus 2 | Lawn, corridors | Arrest and cuffs, escort, Makoto's red flash, the gynoids fall, the duel, a shot into the ceiling |
| 73.9–88.6 | Amanda's verse | Old convention, corridors, bench | Memory in sepia, the heart cocoon, the pink dress, the blush, Amanda asleep on Jacob's shoulder |
| 88.6–103.4 | Makoto's verse | Corridors, Avia vault, disco | The shootout, the theft and the portal, the dance, Makoto alone |
| 103.4–118.2 | Chorus 3 | Room 302, ship | Letter and phone, the gynoid in the TV, the hologram, the phase teleport, the hangar |
| 118.2–133.0 | Talleah's verse | Ship, corridors | The tube, the hug, the door handle, the costume scan, the cardboard villain, the salute |
| 133.0–147.7 | Theme | Room 302, corridors | Evening standoff, both lower their weapons, Jacob runs to the main hall |
| 147.7–162.5 | Chorus 4 | Concert | Three beams become fireworks, the girls walk through the crowd, three hands, the crane |
| 162.5–180.8 | Outro | Room 302, dark stage | Night, the spotlight race, the photo, the gorilla blinks, the title |

## Authoring notes

- The renderer supports film grain and vignette through `camera.fx = { grain, vignette, time }`. Clip 4 sets them on every shot.
- `clip-vladik.js` exports `window.P3DVladikKit` (`toilet`, `buildBath`) for other clips.
- Bugs in clip 4 are not humanoid figures. The world returns `bugs`, and an overlay hook draws them.
- `clip-paranoia.js` exports `window.P3DParanoiaKit`: moves, camera helpers, textures, geometry, vehicles, props, the eleven set builders and `makeCreate(spec)`. It must load before `clip-vladik.js`.
- `makeCreate(spec)` takes `builders`, `looks`, `vehicles`, `prop(id, renderer)`, `stage`, `shotAt`, `fadeAt`. Optional: `sceneOpts[sceneId]`, passed to the builder (for example the stage word, the burst table, scroll speeds, dusk times), and `overlay(renderer)` returning `opaque`/`blend` hooks for clip-specific objects inside shared sets.
- Shared set builders check a few camera names (`sparks`, `chase`, `smoke`, `buggy`, `garage`, `splash`, `wheel`, `gate`, `duskSky`, `scream`, `sneak`, `climb`, `debris`). A new clip reusing a set should pick other names unless it wants that effect.
- Culling is off: a camera placed inside a wall or shelf sees only the back of that wall or shelf and renders a blank or black frame.
- `Renderer.begin(env, camera, rect, keep)` can render into a viewport rectangle (the clear is scissored to it); `keep` keeps the color buffer, which is how overlays are drawn on top of a finished frame. `camera.proj` and `camera.view` replace the perspective and look-at matrices, and `camera.colorM` / `camera.colorAdd` apply a 3×3 color matrix after the grade (hue rotation, negative, bloom threshold).
- `renderer.frameTexture()` and `renderer.grab(texture, x, y, w, h)` copy the framebuffer into a texture for post effects.
- `clip-neck-hurts.js` does not use `makeCreate`. Its `create()` draws one or more panels per shot (`panelsFor`: strips, 2×2 grids, the final mix), then bloom, the camcorder HUD and the timed post effects from the `FX` table.
- `clip-war-song.js` also has its own `create()`. Each shot cam has a world function (`WORLDS`) that returns the scene, the cast, the camera, light options and props (door angle, sofa, globe or calendar position, globe lid, pool platform, star hole). Five sets are built lazily: the oval office, the WAR stage, the posters, the globe with the pool, and the flag wall.
- Its characters are custom meshes posed with `Figure.prototype.solve` and three DIM tables (`agent`, `sam`, `max`). The arm table `ARM` holds `[forward, twist, abduction, elbow]`; the poses that touch the body (hand on chest, cupped hands, praying hands, folded arms) were solved offline with a small IK search and pasted as numbers.
- Unless a world fixes the sun, the key light follows the camera (from the upper left behind it), so faces are lit in every shot. Spotlights are `env.cookie` gobos (`spot`, `star`, `spots3`); the cookie strength also blends the sun direction and colour, so a spotlight can fade in without a flash. The flag and stage sets cast planar shadows on their back walls (`planarWallZ`).
- `clip.lines` holds the closing lines, `clip.lineAt(t)` returns the subtitle for a moment and `clip.mouthFor(role, t)` the mouth opening for `superball`, `agent`, `sam` or `max`.
- Clip 7 is split in two modules. `ccc-cast.js` (`window.P3DCccCast`) builds the heroines, the gynoid, Jacob, the kids and thirteen crowd costumes on its own rig (`HER`, `HIM`, `GYN` dims, `solve`, `drawActor`), with canvas face textures per expression and person (`FACES`), hair shells with jagged edges, props and POV arms. `clip-ccc.js` has one world function per camera in `WORLDS`; a world returns the cast and optional effects (`bolts`, `smoke`, `moths`, `fire`, `portal`, `fireworks`, `panels`, `pov`, `fx`).
- Arm poses that touch the body are solved by `node tools/ccc-arm-ik.cjs [job…]` and pasted into `ARM`.
- `tools/poligon-shots.cjs` renders any clip in headless Edge: `duration`, `frames t…`, `shots`, `range t0 t1 fps`, and for clip 7 `turn <form> <face>`, `faces <form>`, `lineup <forms…>`, `pov`.
- Crowds that only need silhouettes (disco, concert) use the base `Figure` from `figure.js`, about a quarter of the polygons of a `ccc-cast.js` costume. The heaviest shot of clip 7 is about 40 000 triangles.
- `r.texture` repeats by default, and WebGL1 samples a non-power-of-two canvas with repeat as black: pass `clamp: true` for such sizes.
