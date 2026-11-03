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
| 8 | Харухи Судзумия — God knows... | 4:02 | 62 | `clip-god-knows.js`, `gk-cast.js` |
| 9 | Bloodhound Gang — Uhn Tiss Uhn Tiss Uhn Tiss | 4:24 | 151 | `clip-uhn-tiss.js`, `uts-cast.js` |
| 10 | Мио Хонда — Step! | 2:13 | 61 | `clip-step.js`, `step-cast.js` |
| 11 | The Buggles — Video Killed The Radio Star | 3:21 | 60 | `clip-radio-star.js`, `radio-cast.js` |
| 12 | Хацунэ Мику — Romeo and Cinderella | 4:40 | 118 | `clip-romeo.js`, `rc-cast.js` |
| 13 | Kalifarniya — Hello | 2:54 | 61 | `clip-hello.js`, `hello-cast.js` |

Clips 3 and 4 are hidden for now: their objects carry `hidden: true`, so `PoligonSite.clips()` leaves them out of the page, the clip URLs and Clippy's menus. The modules still load (other clips use `P3DVladikKit`). Remove the flag to bring a clip back. The site numbers its list by position, so hidden clips leave no gaps.

Clip 11 heads the list by the user's request: it registers with `window.poligonClips.unshift`, so the site shows it as №1 and opens it on the home page, while `number` keeps the order in which the clips were made. Clippy's «Другой клип» menu and «Дальше» follow the order of the site list (`poligonClipsInOrder`).

Clips 1–5 use original low-poly figures. The videos follow the rhythm and locations of their sources but do not copy their characters, logos or lyrics. Clip 2 uses an original six-piece band instead of the HEARTSTEEL members. Clip 5 uses an original melon DJ instead of the game character from the source video. Clip 6 is the exception: it restages the musical number of the project's own Sam & Max episode 104, so Sam, Max and Agent Superball appear as they look in that game. Clip 7 is the song of the author's own visual novel Cosplay Convention Crisis, so Amanda, Makoto, Talleah and the gynoids follow their character sheets in `content/CCC/`. Clip 8 restages the concert from *The Melancholy of Haruhi Suzumiya* with the anime's own characters, by the user's decision; they are drawn after the episode's frames. Clip 9 follows the Bloodhound Gang video shot by shot with an original singer, band, girl next door and restroom regulars, and stages its hole gag for all ages. Clip 10 restages the live video of the song with Mio Honda herself, drawn after the frames of that video. Clip 11 follows the 1979 Buggles video shot by shot with original characters in the costumes of its roles. Clip 12 restages the Project DIVA video of the song with Hatsune Miku herself, in the eleven outfits of the source edit, by the user's decision. Clip 13 follows the Kalifarniya video shot by shot with an original singer, an original girl in a grey suit and ten original dancers in pink, in the costume roles of the video.

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

## Clip 8: «God knows...»

**Source.** The concert from *The Melancholy of Haruhi Suzumiya*, episode «Live Alive» (2006), in the 241.9 s edit `content/video/Haruhi Suzumiya God knows.mp4`. The soundtrack is `content/clip/Haruhi Suzumiya - God knows.mp3`, a copy of the mp3 next to the video; both files have the same length. In this edit the song keeps playing after the concert, over the school in the rain.

**Kernel.** The school festival of North High. The singer and the guitarist of the girls' band ENOZ are hurt, so Haruhi and Yuki take their places just before the show, still in their festival costumes. Haruhi starts with her back to the hall, counts in with the drummer and turns around. By the first chorus the whole gym is on its feet, and by the end even Kyon, arms folded at the back, taps the beat with one finger. Then the camera leaves the gym: it is raining over the festival.

**Characters.** By the user's decision the clip uses the anime's own characters, drawn after the reference frames of the episode:
- Haruhi Suzumiya: dark brown shoulder-length hair with bangs, amber eyes, a yellow hairband with a yellow ribbon on each side, black bunny ears, a black strapless bunny suit with a white collar, a black bow tie and white cuffs, dark tights, black heels, a white tail. She sings and plays a sunburst single-cut guitar with a cream pickguard.
- Yuki Nagato: short lilac-grey hair, amber eyes, no expression. A wide-brimmed witch hat with a bent tip and a long dark cloak with a high collar and a bow over the North High sailor uniform. She plays a white single-cut guitar with a black pickguard.
- The bassist and the drummer of ENOZ: the North High sailor uniform (white top, light blue collar with a maroon stripe, red ribbon, blue skirt, navy knee socks, white indoor shoes). The bassist has short dark brown hair and a teal bass with a white pickguard; the drummer has a short auburn bob and smiles while she plays.
- Kyon: brown messy hair, the dark blazer of North High with a red tie. A classmate in a grey cloak costume stands next to him.
- The audience: boys in blazers, girls in sailor uniforms.

**Rules.**
- No lyrics on screen. The only words are the banner 北高祭 THE LIVE over the stage, the 北高祭 sign on the school gate and ドリンク on a stall board.
- The bunny suit is shown the way the episode shows it: the cameras copy the source framing and do not linger on the body.

**Style.** The picture is 16:9 inside the 4:3 player, like clip 6. The stage is warm: yellow floorboards, a glowing white back wall, red curtains, rows of bulbs over the stage and on the light towers. The hall is dim teal and is lit only by the stage. Close-ups use a key light that follows the camera; the climax close profile is backlit against the white wall. The rain coda is grey-teal with fog and slanted streaks drawn over the picture.

**Timing.** 149.91 BPM, first beat at 0.296 s, one eighth = 0.2 s. The 61 cuts are copied from the source (ffmpeg scene detection at 0.25; the bursts of detections in the shout close-up and around 107–117 s were merged into single shots, and the dissolve to the folded arms at 192.1 s was found by eye). The drummer plays the real hits: kick, snare and crash onsets of the Demucs drum stem are quantised to eighths in `DRUMS` (digit bits: 1 kick, 2 snare, 4 crash). Haruhi's lips follow the 20 Hz envelope of the Demucs vocal stem (`VOICE`, `voiceAt`) and move only inside `SINGING`; the envelope picks the face (`say`, `sing`, `belt`, or `shout` in the climax).

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–3.6 | Count-in | Stage, gear | Haruhi stands with her back to the hall, facing the drummer. The drummer's crash at 1.9 s cuts to the view over her shoulder into the full hall. |
| 3.6–16.1 | Intro | Stage, gear, hall | The four on the stage under the THE LIVE banner, seen over the heads of the crowd. Yuki from below with the bulbs over her hat. Her hands on the white guitar. The hall from the stage. Haruhi smiles and blinks before her first line. |
| 16.1–48 | Verse 1 | Stage, hall | A 12 s three-quarter profile of Haruhi at the mic with the bassist behind her. The crowd listens and claps. The profile again, then the bassist from above against the curtain. |
| 48–62.8 | Pre-chorus | Stage | A dutch angle with the banner, the drummer behind her kit, Yuki's hat in the foreground with the band behind, Haruhi in warm light. |
| 62.8–83.3 | Chorus 1 | Hall, stage | Kyon in the crowd with his mouth open while everyone around raises hands. Haruhi under the banner, Yuki in profile under her hat, fists from behind the crowd, Haruhi again. |
| 83.3–99.9 | Verse 2 | Hall, gear | A low wide shot along the stage front with its cabinets. Hands on the guitar, the bass, the crash cymbal. |
| 99.9–117 | Climax | Stage, gear, hall | A backlit close profile. Haruhi shouts with her eyes shut while her hair flies and the camera shakes. Fast cuts to sticks, strings, the bass and the toms. She opens her eyes and grits her teeth. Fists in the hall. |
| 117–140.9 | Chorus 2 | Stage | Over her shoulder into the hall, Yuki's guitar in the foreground, Haruhi's face, the stage from the wing, then the band one by one. |
| 140.9–160.3 | Solo | Stage, hall | Yuki's solo from below: her fretting hand runs along the neck in sixteenths. Bassist, drummer, Haruhi at the music stand, the wide shot with waving hands. |
| 160.3–173.5 | Break | Stage, gear | Quiet: Haruhi plays calmly and smiles, close-ups of the bass and the guitar, Haruhi with the whole kit behind her, the kick drum. |
| 173.5–183.1 | Last chorus | Stage | Haruhi in close-up, singing happily, with a wink at 176.4 s. |
| 183.1–202.1 | Coda in the hall | Hall | Kyon with folded arms and a smirk next to the classmate in the grey cloak while the hall cheers. His folded arms in close-up: one finger taps the beat. |
| 202.1–241.9 | Rain | Rain | The song goes on over the school in the rain: the 北高祭 gate from below, the stalls under a tent from a tilted high angle, the gym entrance, the school buildings and the football pitch, then a fade to black. |

## Clip 9: «Uhn Tiss Uhn Tiss Uhn Tiss»

**Source.** The 2005 video of the Bloodhound Gang song, `content/video/Bloodhound Gang - Uhn Tiss Uhn Tiss Uhn Tiss.mp4` (263.7 s). The soundtrack is `content/clip/Bloodhound Gang - Uhn Tiss Uhn Tiss Uhn Tiss.mp3`, a copy of the mp3 next to the video; both files have the same length.

**Kernel.** A night at the club FLUSH. The singer gets past the queue and the doorman, crosses the dance floor and hides from the house music in a restroom stall. Through a small round hole in the partition he sees the girl in the next stall. For the whole song they flirt through the hole: she paints her lips, waves, dances, blows a kiss and beckons, and he answers with a whole show inside his stall. The restroom has its own regulars. A busker serenades a toilet, a man in a white suit eats cream puffs, a clerk tears his shirt open to show a superhero emblem, an inventor steers a robot with a radio remote, a milkmaid is lost and a blindfolded man waits with paper hearts. While the singer sings with his eyes shut, the girl leaves and a dog trots into her stall. The singer puckers up and kisses the hole, and the dog licks him back. At the end a man walks the dog out over the red carpet.

**Characters.** All of them are original. Neither the band members nor the actors of the video are copied.
- The singer: messy copper hair with a side-swept fringe, green eyes, freckles, a wine-red blazer over an open mustard shirt, dark jeans and white sneakers.
- The girl next door: long straight black hair with a blunt fringe, a fuchsia sequin dress to the knee, gold hoops and a gold bracelet, black heels and red lips.
- The band. The guitarist has long dark hair, a black T-shirt with a yellow lightning bolt and an original white arrow-shaped guitar. The bassist is bald, with a ginger handlebar mustache, aviators and a teal Hawaiian shirt. The keyboard player wears a red tracksuit, a backwards cap and headphones round his neck. The drummer is stocky, with a green mohawk and a denim vest.
- The regulars: the doorman with a clipboard, the busker in a leather jacket with a winged heart on the back, a roller skater, the cream puff man in a white suit, a hippie with a punch bowl and two friends with straws, the clerk in a grey suit and red tie (his emblem is a plunger on a shield), a milkmaid in a bonnet with a pail, a silver robot and a bald inventor with a radio remote, a blindfolded man with a chain of paper hearts, a dozing man with dreadlocks and the club crowd.
- The dog: a black-and-white shaggy dog and its owner in a dark coat.

**Rules.**
- The clip is for all ages. Through the hole the camera shows only the girl's face, hands and dress from the waist up. The singer kisses the hole instead of the crude gags of the source, and the dog licks him back. There is no nudity and there are no drugs: the white powder of the source becomes the cream of cream puffs, and nobody is shirtless.
- No lyrics on screen. The only word is the club sign FLUSH; the jacket print, the emblem and the restroom signs are pictures.
- The club name, the jacket text and the superhero emblem of the source are replaced by own designs.

**Style.** The picture is 16:9 inside the 4:3 player, like clips 6 and 8. There are four looks:
- The night street: dark blue, with the violet neon sign and the warm light of the door.
- The dance floor: dark, with magenta and green lights that pulse on the beat, speaker stacks, and a bar with backlit bottles.
- The restroom: teal stalls, white light tubes on the pilasters, brushed-metal back walls and framed black-and-white abstract prints.
- The view through the hole: a round porthole with a metal rim on black. The close-ups of the lips get a soft blue rim instead, and the intro lips are blown out to white.

Cuts at 2.3, 42.9, 59.2 and 115.5 s start with a white flash, and the intro shots dip to black between each other.

**Timing.** 135 BPM, first beat at 0.255 s, fitted on the Demucs drum stem. The grid holds from 24 s to the end; the intro and the break at 204–228 s play the kick off the beat. The 150 cuts are copied from the source: ffmpeg scene detection at 0.2, with double detections and flash frames merged. The dissolves of the intro and the long continuous shots at 115.5, 124.6, 198.0 and 241.8 s were found by eye. The singer's lips follow the 20 Hz envelope of the Demucs vocal stem (`VOICE`, `voiceAt`) and move only inside `SINGING` (45.4–102.2 and 116.5–258.2 s). From 171 s the lips at the hole mouth the same chant, and the intro lips speak the opening phrase.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–2.3 | Intro | Hole | A white-out close-up of red lips speaking the opening phrase. |
| 2.3–12.1 | Intro | Street | The FLUSH sign flickers on after a white flash. The queue waits in the dark between palms and velvet ropes, the striped curtain glows in the door, the rope is seen from above. The singer, the guitarist and the bassist arrive, and the doorman checks his clipboard. |
| 12.1–39.6 | Intro | Dance floor, restroom | The singer crosses the dance floor to the restroom door with the man and woman signs. Dancers under magenta and green lights cut against the restroom: people chat by the stalls, the singer walks along the stalls and scratches his nose with the band around him, two girls slip into a stall, the busker plays an acoustic guitar to a toilet. |
| 39.6–45.1 | Intro | Stall | The singer turns to the camera in his stall; a white flash; the stall from the door. |
| 45.1–84.6 | Verse | Stall, band, bar | He sings in close-ups, sits on the toilet, points, waves and spins on the floor while the camera rolls. The band poses in the restroom. The roller skater stretches next to the drummer, who plays in a stall, and the guitarist shreds in front of him. The band at the bar, then a close-up of each member. |
| 84.6–101.9 | Verse | Stall, hole, neighbor | He leans to the hole and sees the girl painting her lips. His eye at the hole. She poses in her stall. |
| 101.9–116.6 | Break | Restroom, hole, stall | The cream puff man. The dance floor. The singer bends to the hole, the girl twirls, then peeks back through the hole and winks. A white flash, and his door swings open on him with folded arms. |
| 116.6–170 | Verse 2 | Stall, restroom, hole | The hippie with the punch bowl while the clerk walks into the next stall. The clerk tears his shirt open to the plunger emblem and straightens his tie. Through the hole she waves, dances and blows a kiss, and the singer answers every move. The lost milkmaid. |
| 170–198 | Chant | Hole, restroom, dance floor | Her lips at the hole mouth the chant. The man in the tank top, the blindfolded man with paper hearts, the speaker wall, a party in the restroom, the dozing man, the robot and the inventor. She beckons, and the singer puckers up and kisses the hole. |
| 198–204.8 | Chant | Restroom | One long shot: the girl leaves her stall and walks off, the dog trots in from the right into her stall, the door swings shut and the latch turns. |
| 204.8–241.8 | Chant | Stall, hole, neighbor, dance floor | The guitarist leans over the partition to whisper; the singer waves him off and keeps kissing the hole. Through the hole: a dog's eye, then a pink tongue. The girl smiles in the corridor light. The dog licks the singer's nose and he melts. |
| 241.8–257.8 | Outro | Restroom, dance floor, neighbor | The singer walks out of his stall in bliss, goes to her door and knocks. The girl smiles and flips her hair. |
| 257.8–263.7 | End | Street | A man walks the dog away down the red carpet; fade to black. |

## Clip 10: «Step!»

**Source.** The live video of Mio Honda's solo song «Step!» (2016) from the idol rhythm game, `content/video/Mio Honda - Step!.mp4` (133.0 s, 1080p60). The soundtrack is `content/clip/Mio Honda - Step!.mp3`, a copy of the mp3 next to the video; it matches the audio of the video sample for sample.

**Kernel.** One idol on a whole candy-coloured arena stage. The arena waits in the dark with its glowsticks, the lights come on, and Mio dances the song from the first count to the last wave. The LED wall behind her changes with the song: stars for the verses, a blue sky with the title for the first chorus, her own live close-up when she comes to the front, and an orange sunset for the night bridge, when the candy lights go out and only warm beams and a golden mirror ball remain. A white flash brings the colours back for the last chorus, and the clip ends on a close-up wave that fades to white.

**Character.** Mio Honda, drawn after the frames of the video:
- Short layered chestnut hair with pointed locks, amber eyes, two crossed hairpins (red and gold) and a short gold bar on the right of her fringe, gold drop earrings.
- A small red crown with gold arches, a green gem, a white frill and pearl strands on the left side of her head.
- A short navy jacket with red sequin lapels and gold piping over a purple bustier, a red pointed collar with a white jabot and a green brooch, a red-and-gold sash, a green medal with a gold star, puff sleeves with red cuffs.
- White gloves with gold-and-red bracelets and white frills.
- A skirt of three red ruffle tiers with gold edges over a black-and-white striped front panel, a long black train edged in gold, a green-and-red bow on the right hip.
- A black stocking on the right leg and a black-and-white striped stocking on the left, black heels with gold anklets.

**Rules.**
- No lyrics on screen. The source writes a lyric word across the LED wall in the first chorus; here the wall shows the title STEP! instead.
- All ages: the bustier rises to the collar, and the cameras keep to the framing of the video.
- The audience is a dark mass with orange glowsticks. No logos, no other idols.

**Style.** The picture is 16:9 inside the 4:3 player, like clips 6, 8 and 9. There are three looks:
- The candy stage: a diamond floor in yellow, green, peach and mint with teal light lanes and a striped runway, twisted candy columns, polka-dot side walls, yellow curtains, balloons, star discs, moving heads, bleachers of white light panels, a checker wall and the LED wall in a pink-and-gold frame, all under warm haze and a bloom pass.
- The night stage: the candy lights off, warm sweeping beams, the orange LED wall, a golden mirror ball and a spotlight pool around her.
- The arena from behind her: grey haze, the crowd with glowsticks and five star lights over the far balcony.

White flashes cut to the wide stage at 41.85 s and bring the lights back at 105 s. The stage lights also dim for two short shots at 63.3 and 65.3 s, as in the video.

**Timing.** The song runs at 212 BPM; the clip uses every second beat, 106 BPM, with the first beat at 0.364 s, fitted on the Demucs drum stem. The 60 cuts are copied from the video: ffmpeg scene detection at 0.15, a second pass at 0.06 for the low-contrast cuts at 20.95, 31.43 and 68.28 s, merged double detections, and the cuts hidden in the white flashes at 41.85 and 105.0 s, found by eye. Many shots are long camera moves of the video (crane-outs at 55.3, 75.3 and 118.8 s, the rise over the floor at 83.5 s, the push into the LED wall at 100.5 s), and the cameras repeat them. Mio's lips follow the 20 Hz envelope of the Demucs vocal stem (`VOICE`, `voiceAt`) inside `SINGING` (12.7–124.9 s, silent in the instrumental break at 80.4–87.2 s).

The dance is copied from the video shot by shot. `MOVES` holds 46 moves as keys in beats; a key names an arm pose for each side from `ARMS` (angles, or a hand target in the torso frame solved by `GK.ik`), a leg preset from `LEGS`, the lean, tilt and side shift, and the eyes and mood of the face. `CHOREO` lists the moves in time, and every change crosses over 0.4 s. A beat bounce, a slow sway and the hair and skirt swing run on top. `PATH` moves her root for the two walks down the floor, the walk along the light lanes and the spin under the sky screen; position jumps happen only on cuts.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–3.5 | Intro | Stage (dark) | The arena waits in the dark with glowsticks; the stage lights come on at 2.6 s and show her alone in front of the LED wall. |
| 3.5–12.4 | Intro | Stage, hall | She points at the camera, waves and opens her arms while the camera pulls back to the whole stage; arms out low with a sway; the stage from behind the audience. |
| 12.4–21.5 | Verse 1 | Close-ups, hall | Fists by her cheeks, index fingers up beside her head with a wink, a clap to the side, the step-touch, palms up by her shoulders, arms spread. |
| 21.5–30.4 | Verse 1 | Stage, close-ups | A hand on the hip and a point down, waves by her face and a giggle behind her hand, a walk down the diamond floor, a point up, «binoculars» round her eyes. |
| 30.4–39.7 | Chorus 1 | Sky screen | The LED wall turns into a blue sky and the title flies in; she waves by her face, spreads her arms under the sky, spins once and raises her arms while the camera cranes up. |
| 39.7–44.1 | Post-chorus | Close-up, hall | Fingers up with a wink, a white flash, the whole stage over the audience. |
| 44.1–60.0 | Verse 2 | Stage | The step, waving with both hands while the LED wall shows her live close-up, hands at her chest, a walk forward with hands on her head, a crane from a waving close-up out to the whole stage. |
| 60.0–80.3 | Chorus 2 | Hall, stage | From behind her over the arena and its five star lights, pink stars, a hand over one eye and a salute, the lights dim for two shots, hands at her heart, the crowd waves, back to the arena, a long crane out. |
| 80.3–87.0 | Break | Stage | Arms open on the beat; the camera rises over the floor while she walks along the light lanes, and the stage goes dark around her spotlight. |
| 87.0–105.0 | Bridge | Night stage | Arms spread in front of the glowing wall, a point to the side and up by the golden mirror ball, a salute against the sunset screen, hands at her chest before the orange wall, the push into the LED wall where her live face sings, then a white flash. |
| 105.0–124.8 | Last chorus | Stage, hall | The candy lights come back, a wave under her live face, the arena under a pink beam, a point at the audience, a blown kiss, hands on her cheeks, a crane out to the whole hall. |
| 124.8–133.0 | Outro | Stage, close-up | Arms up in a V, then a close-up wave with a wink that fades to white. |

## Clip 11: «Video Killed The Radio Star»

**Source.** The 1979 video of the Buggles song, `content/video/The Buggles - Video Killed The Radio Star.mp4` (201.2 s, 4:3, 25 fps). The soundtrack is `content/clip/The Buggles - Video Killed The Radio Star.mp3`, a copy of the mp3 next to the video; both have the same length.

**Kernel.** A girl kneels in the dark by an old valve radio under a white moon. The voice from the radio is the singer: a black-and-white poster picture that sings to her from the edge of the frame. The radio glows orange, the singer doubles into two posters that face each other, and the radio explodes into smoke and glitter. The girl turns into a woman from the future, and the song moves to a laboratory with cartoon radios painted behind the cracked plaster. Tape reels spin, the singer sings into the lens in a white coat, the silver woman sinks into a glass tube and rises out of it, the girl presses her hands to the glass, and a TV shows two backing singers. The girl climbs a mountain of cut-out radios, which shatters against a blue sky and explodes. Old TV sets in the sand show the band. The silver woman flies out of the tube, the camera breaks through the lab wall into a white TV studio where the band plays in silver jackets, and everything fades to white.

**Characters.** All of them are original. Neither the band, the guest keyboard player nor the actors of the video are copied; the costumes follow the roles of the video.
- The singer: lanky, with a black quiff and sideburns, and big white glasses with frames shaped like two small TV screens. On the night posters he wears a black suit and a thin black tie, in the lab a white jacket with a stand-up collar, and in the studio a silver lamé jacket, black leather trousers and a natural-wood bass.
- The keyboardist: ginger feathered hair with a side fringe and freckles, a silver lamé suit with a red tie, and a white lab coat in the lab.
- The synth player: dark slicked-back hair and stubble, a black leather jacket over a white shirt. He plays in front of the modular synth wall.
- The girl: about nine, dark brown hair in two pigtails with red bobbles, red dungarees over a white T-shirt.
- The woman from the future: a silver glitter bodysuit, sheer silver tights and boots, a pink and a blue metallic shoulder pad, a rainbow chevron on the belly and a headdress of pink, violet and blue tinsel.
- The twins: two backing singers with a pale pink bob and a blunt fringe, white cat-eye sunglasses, magenta tunics with a red V yoke and red tights.

**Rules.**
- No lyrics on screen. The only word is the lab sign RECORDING. Radios, dials and TV pictures carry no logos or brand names.
- The clip is for all ages: the explosions are smoke, a white flash and the gold ring of the speaker.

**Style.** The picture fills the whole 4:3 player, as the source does. There are eight looks:
- Night: a black void, a white moon with a halo, glittering streaks of light on the floor, smoke puffs and falling glitter. The radio has a dark red cabinet, an amber dial and an olive speaker grille, and turns orange when it glows.
- Poster: the singer is rendered through a hard black-and-white threshold (`camera.colorM` and `colorAdd`). The close-ups show it full frame; the night shots add it on top of the scene as a superimposition at the left, mirrored at the right, or twice facing each other. The poster version of the singer has dark lenses and white streaks in the hair, so the glasses and the hair read in black and white.
- White studio: the silver keyboardist on a white cyclorama, filmed at tilted angles.
- Lab: white plaster walls with torn holes that show a painted wall of cartoon radios, reel-to-reel cabinets, a black upright piano under the RECORDING sign, the glass tube with smoke inside, a TV on a desk, rubble on the floor, a green and a blue lamp.
- Radio mountain: cut-out radios painted with black outlines on a dark green backdrop, then a flat blue sky for the shatter.
- Pink room: a magenta cyclorama and pink light for the twins.
- TV graveyard: old TV sets in the sand among red bricks, in front of a wall of cut-out radios; every screen shows a live picture of the band.
- Studio: a white floor with black plank lines, keyboards on X stands, the modular synth wall with patch cables and green screens, a TV camera on a tripod and clear acrylic screens. It stands behind the lab's back wall: in the breach shot the studio is drawn first in pink light, then the lab with the broken wall on top.

TV screens show live pictures rendered into a corner of the canvas and grabbed (`renderFeed`), tinted blue with a darker rim. Shots with `mix` dissolve from the previous shot, and the reels shot opens with an iris.

**Timing.** 130.86 BPM, first beat at 0.338 s, fitted on the kick band of the Demucs drum stem. The 59 cuts are copied from the video: ffmpeg scene detection at 0.2 with merged double detections. The dissolves at 37.3, 59.5, 63.3 and 165.9 s and the iris at 66.3 s were found by eye. Lip sync uses the 20 Hz envelope of the Demucs vocal stem (`VOICE`). Pitch tracking on that stem separates the singer's lines (about 270–340 Hz, `SOLO`) from the female backing and choruses (about 400–470 Hz, `CHOIR`), so the singer moves his lips only on his lines, and the twins and the silver woman only on theirs.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–18.4 | Intro | Night | A white moon fades in over the dark. Streaks of light ripple on the floor, a puff of smoke bursts across the moon, and the camera pulls back to the girl and the radio. |
| 18.4–33.4 | Verse 1 | Night, white studio | The girl turns a knob of the radio while the poster singer sings at the left, and the camera rises to the moon. The radio glows orange. The keyboardist plays on the white set. |
| 33.4–51.8 | Verse 1 | Poster, night | The poster face sings in close-up, then from the right of the moon. The radio glows and goes dark, the poster face sings again, and two posters sing to each other while the girl stands up. |
| 51.8–66.3 | Chorus 1 | Night | Glitter falls around the girl. The radio explodes in a white flash and leaves a smoking gold ring. A blue burst, the posters come back and fade, and the girl turns into the woman from the future. |
| 66.3–91.6 | Verse 2 | Lab, white studio | An iris opens on the spinning reels, and the camera pans to the singer leaning on the cabinet. The keyboardist plays the piano under RECORDING. The singer walks forward while the silver woman sinks into the tube. Close-ups of her in the smoke, the twins on the TV, the silver keyboardist's hands. |
| 91.6–117.4 | Chorus 2 | Lab, white studio | The singer sings into the wide lens, the girl watches the tube and the woman rises out of it. The twins on the TV, the girl's hands on the glass, her face looking up, a look up through the purple tube, the keyboardist among his synths. |
| 117.4–126.8 | Instrumental | Radio mountain | The girl climbs the mountain of radios and sits on top. The sky turns blue, the mountain shatters, and an explosion leaves the gold ring. |
| 126.8–160 | Bridge | Pink room, TV graveyard, white studio | The twins sing in pink light and pose. The wall of radios and the TV sets in the sand show the band. The singer on a TV reaches to the camera, the poster face flashes over him, and the screen dissolves into the keyboardist's hands. |
| 160–201.2 | Last chorus, outro | Lab, studio | The silver woman flies out of the tube. The camera breaks through the lab wall into the white studio where the band plays, whips to the synth wall, and shows the band and the dancing woman. Everything fades to white. |

## Clip 12: «Romeo and Cinderella»

**Source.** The video of doriko's song «ロミオとシンデレラ» sung by Hatsune Miku, from *Project DIVA Dreamy Theater 2nd* (2011), in a 280.4 s edit `content/video/Hatsune Miku - Romeo and Cinderella.mp4`. The edit cuts between eleven outfits («modules») of the same dance: most changes are dissolves inside a shot, a few happen on hard cuts. The soundtrack is `content/clip/Hatsune Miku - Romeo and Cinderella.mp3`, a copy of the mp3 next to the video; both have the same length. The burned-in subtitles of the source are lyrics and are not copied.

**Kernel.** Night on top of a clock tower above a sleeping town of gables and lit windows. Miku sings alone on a round stone platform in front of a giant clock whose dial is a rose window of stained glass. Like Cinderella's dress at the ball, her outfit never lasts: every few lines it dissolves into the next, from a scarlet gown with a tilted crown to a bridal veil, a black dress, Santa's coat, a gothic doll and a punk cap. She dances with a long white microphone stand topped with a glowing pink rose. Searchlights sweep the clouds, the camera drifts over the roofs in the instrumental, she kneels on the stones in the quiet bridge and spins in the last chorus. All through the clip the clock hands creep from 11:52 to midnight; they meet at twelve when she turns and walks back to the clock, and the picture fades to black.

**Character.** Hatsune Miku, drawn after the frames of the video: teal hair in very long twin tails that reach her calves, a pointed fringe with long side locks, teal eyes, a slim build. Three outfits change her colours: dark blue hair for the suit, violet-to-sky-blue hair with pale skin and red eyes for the gothic doll, pink eyes for the mint dress. The bride wears her hair up in a bun under the veil.

| Outfit | Form | Look |
|--------|------|------|
| Scarlet gown | `mikuScarlet` | Wine-red halter dress with black lacing and a choker, three ruffled tiers, frilled bell cuffs, red ribbons laced up bare legs, red heels, a small gold crown tilted on the left, dark red roses on the hair ties |
| White sundress | `mikuSundress` | Long white slip dress on thin straps, red headphones, a white lily, a green bangle, barefoot |
| Bride | `mikuBride` | White corset gown, short in front and long at the back, a hot-pink sash with a bow at the hip, white opera gloves with yellow flower corsages, white stockings, bun and veil, silver headphones |
| Black dress | `mikuBlack` | Sleeveless black dress with a white collar and a black ribbon tie, a white frill at the hem, black arm warmers and thigh-highs, the grey headset with teal lights |
| Black bodysuit | `mikuSleek` | Glossy black bodysuit with silver piping and a high collar, white gloves, black boots, cyan crystal fins at the ears |
| Append | `mikuAppend` | Silver high-neck top, black gloves to the shoulder, black shorts with glowing cyan-green leaf panels, a red glowing ring on the hip, dark thigh-highs, a red-lit headset |
| Suit | `mikuSuit` | Dark blue hair, black blazer with a red flower, white shirt, black tie, black pleated skirt, black socks |
| Santa | `mikuSanta` | Red dress with white fur at the collar and hem, a gold star, long red gloves, Santa hat with a pompom and holly, white earmuffs, white stockings with green garters, red boots |
| Gothic doll | `mikuGothic` | Black lolita dress with white lace layers, lace collar and bell cuffs, black thigh-highs and platform boots, black bows on the ties, violet headset |
| Punk | `mikuPunk` | Black peaked cap with a red band and a star, black bandeau, bare midriff, studded belt with a small star, black shorts, fishnets, knee pads, boots, fingerless gloves |
| Mint dress | `mikuMint` | White off-shoulder dress with mint ribbons and petticoat, long white bell sleeves, a wreath of teal roses, white stockings with mint garters, pink headphones |

**Rules.**
- No lyrics on screen. The only words are the title card ロミオとシンデレラ with a rose and the composer's name «doriko».
- The outfits keep the coverage of the source; the cameras copy its framing.

**Style.** The picture is 16:9 inside the 4:3 player, like clips 6 and 8–10. Lilac-grey stone under cold moonlight, a dark clock dial whose stained glass glows magenta and violet in the wide shots, purple windows, warm windows in the town, white searchlight shafts, stars and olive bunting; a bloom pass on top. Costume dissolves are real cross-dissolves with a little glitter around her. The rose on the stand glows pink.

**Timing.** 170 BPM, first beat at 0.241 s: the onset grid holds over the whole song, and the Demucs drum stem puts kicks on beats 1 and 3 and snares on 2 and 4. The dance uses half time (85 BPM, `STEP`). The 118 shots are copied from the video: ffmpeg scene detection at 0.15 (and 0.05 for low-contrast cuts) with merged double detections, plus hidden cuts found by eye at 71.75, 98.15, 105.25, 157.95, 184.95, 222.6 and 222.75 s (dissolves into and out of the town pan and the spire flashes). The outfit changes copy the edit: dissolves at 51.1, 70.6, 80.3, 91.6, 137.15, 155.9, 167.0, 178.1, 190.9, 234.75 and 246.2 s, hard cuts at 11.344, 12.479, 18.618, 109.709 and 222.922 s. Miku's lips follow the 20 Hz envelope of the Demucs vocal stem (`VOICE`) inside `SINGING`.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–12.5 | Sung intro | Rose window, clock | The stained glass lights up. In the scarlet gown she stands with her back to us and reaches toward the clock, turns with her arms open and sings with a hand raised by her head; a low close-up in the white sundress gives a first glimpse of the changes. |
| 12.5–18.6 | Title | Town | The tower over the town at night with the title card. |
| 18.6–51.1 | Verse 1 | Platform, clock, close-ups | The bride walks onto the platform, holds the stand across her body, three quick cuts (the pink bow, the corsage, the rose at her face), sings in front of the dial, the light shaft from the town at the left, a skirt twirl, a finger at her lips, an arm out to the side, the rose window wide. |
| 51.1–80.3 | Pre-chorus, chorus 1 | Clock, close-ups, platform | The black dress dissolves in while her arm is raised: a profile with the headset, eyes shut, a turn, a high wide shot, steps and a reach. The black bodysuit with cyan fins: an arm up, a tilt from her legs, eyes shut, the stand across her body. |
| 80.3–109.7 | Chorus 1, instrumental | Clock, close-ups, rose window, town | Append, seen from behind with the glowing panels; the blue-haired suit with the stand held out like a sword. The camera pulls back to the rose window and drifts over the roofs, searchlights and bunting, then finds her walking back to the middle. |
| 109.7–137.2 | Verse 2 | Clock, platform, close-ups | Three flash cuts open the Santa coat: a raised palm, a walk through the light shaft, kicks, a finger at her lips, a point, the rose window wide. |
| 137.2–156 | Pre-chorus 2 | Close-ups, platform, clock | The white sundress dissolves in on a raised arm: a profile with the red headphones, a spin with the skirt flaring, eyes shut, a hand on her hip, barefoot steps, a walk with the stand. |
| 156–190.9 | Chorus 2 | Rose window, close-ups, clock, town | The gothic doll behind the railing, lace cuffs, eyes shut; the punk in the cap with a hand behind her head and the stand held out; the doll again. The camera pulls back past the spire to the lit houses. |
| 190.9–222.9 | Interlude, bridge | Platform, clock, close-ups | The doll sinks to her knees and turns into the mint dress; Miku sings kneeling, reaches up, rises on one knee and stands, spreads her arms on the hits at 218.9–219.7; quick flashes of a house and the spire. |
| 222.9–263.1 | Last chorus | Clock, platform, close-ups | Append again, the punk, then the scarlet gown: a wave, a kick with the laced legs, a spin with the tails whipping round, the stand pointed out, and the camera tilts up to the sky and the bunting. |
| 263.1–280.4 | Outro | Clock, platform, rose window | An arm raised, a low close-up, two spins from straight above, a look up at the sky from behind her, and the last wide shot: she turns and walks back to the clock as the hands meet at twelve; fade to black at 277.3–278. |

## Clip 13: «Hello»

**Source.** The official video of the Kalifarniya song «Hello» (2024), `content/video/Kalifarniya - Hello [official MV].mp4` (173.5 s, 1080p25, a 2.39:1 picture letterboxed inside 16:9). The soundtrack is `content/clip/Kalifarniya - Hello.mp3`, a copy of the mp3 next to the video; both have the same length. The video opens with the band's logo and the logo of its production company, and it ends on a tour card with cities and dates; neither is copied.

**Kernel.** One day on the road across the steppe. The singer waits by a white convertible on an empty road, checks his watch and gets in next to the girl in the grey suit. Bouquets lie on the bonnet and fill the back seat, and the car drives through a red canyon. They sing, laugh, stop to dance by the road and film a selfie. In the choruses they meet ten dancers in pink in a flowering field under the mountains, and the line of twelve dances while the sun sinks. By golden hour the two take photos with a blue instant camera, two hands meet over the flowers, and at sunset everyone dances in silhouette while the couple twirls. The convertible drives on and the picture fades to black.

**Characters.** All of them are original; neither the singer, the girl nor the dancers of the video are copied. The costumes follow the roles of the video.
- The singer: short black hair, thin silver glasses, a white crew-neck T-shirt tucked into wide black trousers with a black belt and a silver buckle, a silver watch on the left wrist, a silver bracelet on the right, black sneakers with white soles.
- The girl: long dark brown hair with a middle parting, square tortoiseshell sunglasses, gold hoop earrings, an oversized charcoal blazer over a white shirt with a black tie, wide charcoal trousers, black flats, a gold watch.
- The dancers: ten girls in pink oversized trucker jackets open over long white T-shirts, wide pink trousers and white sneakers, with loose, wavy, braided, ponytail and bun hair.

**Rules.**
- No lyrics on screen. The only words are the artist's name KALIFARNIYA built from shards in the intro, the title card «Hello / KALIFARNIYA» over the first shot and the studio's own ident «ПОЛИГОН» in place of the production logo.
- No logos and no brands: the band logo, the production logo and the tour card are replaced, and the convertible is a generic white car.
- The aerial shots show only the car; at that distance the two people inside are not drawn.

**Style.** The picture is 2.39:1 inside the 4:3 player (512×214), like the source. There are six looks:
- Roadside: a flat khaki steppe, a worn grey road with white edge lines, power poles, low blue mountains and a pale hazy sky.
- Canyon: the car stays at the origin while a 240 m periodic road scrolls past at 13 m/s between steep red rock walls with olive slopes, poplars, red-and-white marker posts and a yellow chevron sign; the cameras are fixed to the car (from the bonnet through the windscreen, from the driver's side past the wheel, from the back seat over the flowers).
- Field: a green meadow full of yellow and white flowers with crossed-quad clumps near the dancers, low mountains and clouds; front-lit for the line shots, backlit with long shadows, white haze and bloom for the shots into the sun.
- Golden hour: a peach and lilac sky, warm key light, a soft bloom.
- Sunset: an orange sky with the sun glow on the horizon, black silhouettes, dark grass stalks in front and a low dark ridge.
- Aerial: rolling green and olive hills with red-brown patches and a winding road with the white car.

Every scene except the ident is drawn in two passes: the sky dome, the mountain ring and the far ground ring with their own near and far planes, then the set and the cast with a cleared depth buffer; the far fog is fitted so that it matches the near fog at 150 m.

**Timing.** 102 BPM, first beat at 0.015 s, fitted on the kick band of the Demucs drum stem; the grid holds from 20 s to the end. The 60 cuts are copied from the video: ffmpeg scene detection at 0.06, with the 0.16 s white flash at 99.56 s merged into the selfie shot (the clip draws its own flash there). The song runs intro 0–18.3 s, verse 18.3–34 s, pre-chorus 34–55.3 s, chorus 55.3–93 s, a one-bar stop, verse 94.2–110.6 s, pre-chorus 111.8–131.8 s, chorus 131.8–169.4 s and a short tail. The singer's lips follow the 20 Hz envelope of the Demucs vocal stem (`VOICE`, `voiceAt`) inside `SINGING` (18.7–93.0 and 94.3–169.75 s). The high «hello» hook of the intro (about 370–470 Hz, against 165–310 Hz in the verses) is not lip-synced, because the singer does not sing it in the video. The girl mouths along in four car shots (`ALONG`).

The dances use the move system of clip 10. `MOVES` holds the moves in beats, and the timelines `GROUP` (dancers), `LEAD` (the singer in the field and at sunset), `PARTNER` (the girl), `CAR_HIM` and `CAR_HER` (seated in the car), `ROAD_HIM` and `ROAD_HER` (the roadside) and `GOLD_HIM` and `GOLD_HER` (golden hour) put them in time. The dancers run the group timeline with small delays and amplitudes of their own.

| Time | Section | Place | What happens |
|------|---------|-------|--------------|
| 0–8.84 | Intro | Ident | Purple voxel shards fly in and lock into the name KALIFARNIYA, a white flash, then the ПОЛИГОН triangle spins in where the video shows its production logo. |
| 8.84–18.28 | Intro | Roadside | The singer leans on the white convertible by the empty road while the title fades in, checks his watch, smirks at the camera, walks round the bonnet and opens the driver's door; the girl already sits in the passenger seat. |
| 18.28–34.1 | Verse 1 | Convertible, roadside | The car drives through the red canyon: through the windscreen with the bouquets on the bonnet, from the driver's side past the wheel, from the back seat over the flowers. A stop by the road where the two dance beside the car. |
| 34.1–55.5 | Pre-chorus | Roadside, convertible | He lifts her chin and she laughs; a chevron sign flashes past; they sing and laugh in the car; he films a selfie by the car while she dances behind him; they lean together over the bouquets. |
| 55.5–93.9 | Chorus 1 | Field, convertible, aerial | The dancers walk away into the backlit field, turn and dance back towards the camera, and he comes forward singing. The line of twelve points up, raises hands and lunges; solo shots against the sun; both raise their hands in the car; the winding road from above; she stands up in the moving car with her arms out; the camera pulls back from the couple in front of the line. |
| 93.9–99.6 | Break | Field | A close-up against the sun; two dancers hold up a gilt picture frame and the couple dances far away inside it. |
| 99.6–130.9 | Verse 2 | Golden hour, convertible, aerial, field | A white flash into a sunset selfie with a blue instant camera; she poses with a hand on her head; the canyon road from above; he alone in the field; a finger frame; she photographs the camera; he leans back in the driver's seat with his eyes shut; two hands meet over the flowers. |
| 130.9–169.7 | Chorus 2 | Field, sunset | Low shots of the line against the mountains alternate with silhouettes on the orange sky: running sideways, waving, bouncing, fists up; the dancers whip their hair while he stands with his hands in his pockets; the couple dances and she twirls under his arm; everyone dances in silhouette. |
| 169.7–173.5 | Outro | Aerial | The convertible drives on along the curve and the picture fades to black. |

## Clip stories

Under the player each clip can have a block «История оригинала»: a few paragraphs on how the original song and video were made, and «Знаете ли вы?» with two to five facts. The texts live in `js/apps/poligon/stories.js` as `window.poligonStories[clipId] = { history: [paragraphs], facts: [{ text, at }] }`. A clip without an entry shows no block. A fact may carry `at`, a time in seconds of the 3D clip; the fact then ends with a «► m:ss» button that plays the clip from that moment and scrolls the player into view (`PoligonPlayer.playFrom`). Give `at` only when the 3D version shows what the fact describes.

Layout: stage, title block, story, clip list and «Как это сделано» share the `.pg-main` grid. From 900 px of page width the story stands to the right of the clip list (columns `72ch | 1fr | 232px`, rows `auto auto 1fr`, so a long story never stretches the gap between the list and «Как это сделано»). Below 900 px it spans the page under the player and the title block, and below 620 px everything is one column in that order. Inside the block a container query (`pg-story`, 760 px) puts the facts beside the history; the history flows in 26em text columns when there is room.

Writing rules: Russian, the studio's plain voice, every fact from a source listed below, no invented quotes or numbers, names as Russian Wikipedia spells them. Stories are written one clip at a time, each after the author approves the previous one.

| Clip | Status | Sources |
|------|--------|---------|
| 11 Video Killed The Radio Star | approved 2026-11-02 | English Wikipedia article on the song (video section citing *I Want My MTV*, *People* 2001, *Salon* 2000, *People* 31 Dec 2025); *The Guardian*, «The Buggles: how we made Video Killed the Radio Star», 30 Oct 2018 (Horn on Ballard, the robot Beatles and the Elvis Costello glasses; Downes on the Musicians' Union at *Top of the Pops*); frames of the source video at 92 s (glasses) and 176.8 s (Hans Zimmer at the synth wall, the clip's synth player at 2:56) |
| 1 Never Gonna Give You Up | approved 2026-11-02 | English Wikipedia articles on the song (production, release, charts, the Harrow Club and Freston Road, Rickrolling) and on Zoo (dance troupe) (Clive Clarke as the bartender); *The Guardian*, «Rick Astley: how we made Never Gonna Give You Up», 23 Mar 2020 (Astley on FBI, the tea, the church and his own clothes; Waterman on the Warrington club, the Ferrari, the title joke, the key change and Radio 1); *Film Stories*, «How the director of Con Air accidentally invented Rickrolling» (Simon West in 2013: one day's notice, everything went wrong, the viaduct arches and the former church); frames of the 3D clip at 33.3 s (Astley's coat under the arches) and 102.7 s (the bartender vaults the bar) |
| 2 PARANOIA | approved 2026-11-02 | English Wikipedia articles on League of Legends, Baekhyun, Tobi Lou and the 2023 World Championship; Soompi (teaser, release, who voices whom) and EnVi Media (song structure, in-game abilities, premiere numbers, Yone and Aphelios as producer and songwriter in the credits); Bandwagon (producer Sebastien Najand, the name from the item, Maria Egan on fans' long wish for a male band); shots.net (director Ernest Desumbila, SAUVAGE.TV, 3D animation with 2D sketches); ONE Esports and Soompi on the Worlds 2023 opening ceremony (19 Nov 2023, Gocheok Sky Dome, the shattered LED screen and the AR members); Russian League of Legends wiki for the Russian champion and item names. The source video is not in `content/video`, so no fact has a moment button |
| 3, 4, 5 | skipped for now by the author | «Владик в депрессии» and «Таракан и червячок» are the author's own songs and need the author's answers; DJ Melon was skipped with them |
| 6 War Song | approved 2026-11-02 | Sam & Max fan wiki (pages «Good For You (Good For Me)», «Abe Lincoln Must Die!», «Agent Superball», «Peter Barto»: the official title, the Edwin Starr quote, the autosave and the instrumental end credits, Superball genuinely happy for the first time, Barto as Peepers too); English Wikipedia on *Sam & Max Save the World* (release 22 Feb 2007 on GameTap, the Dakotas' civil war over Mount Rushmore, composer Jared Emerson-Johnson, songs sung by Peter Barto, the Skunkape remaster of 2 Dec 2020); `content/clip/War Song.mp4` and frames of the 3D clip at 40.2 s (first chorus) and 79.6 s (the Peepers poster) |
| 7 Cosplay Convention Crisis | skipped for now by the author | the author's own visual novel, needs the author's answers |
| 8 God knows... | approved 2026-11-02 | Japanese Wikipedia: «涼宮ハルヒの詰合» (release 21 Jun 2006 on Lantis, credits, the players Nishikawa, Taneda and Odawara, Yamamoto's ZONE brief, the rotoscoped performance and Hirano filmed for the close-ups, Nishikawa's Rittor Music interview, the silence before episode 12, Oricon 5th and 133 weeks in the chart) and «涼宮ハルヒの憂鬱 (アニメ)» (broadcast order with «Live Alive» 12th, ENOZ as ZONE reversed with the members' kanji, no name and three members in the novel, no animator who played an instrument, drums matching the sound, everyone moving and about twice the drawings, citing the official guidebook, Kikan S 2006/10 and Animage 2006/08); frames of the 3D clip at 93.8 s (guitar close-up) and 124.2 s (Haruhi's face) |
| 9 Uhn Tiss Uhn Tiss Uhn Tiss | approved 2026-11-02 | English Wikipedia articles on the song (second single from *Hefty Fine*, written and produced by Jimmy Pop, the onomatopoeic title, release 25 Nov 2005, the charts incl. Russia Airplay 14 and year-end 31, the directors Cousin Mike and Kevin Powers, the Wiper Room and its stalls, David Lovering, Jemaine Clement, Electric Eel Shock, Natasha Thorp and Vera Kopp, the DJ Tomcraft and Scooter remixes) and on the band; frames of the 3D clip at 125 s (the prophet's stall) and 191.5 s (the robot and the scientist). The text stays all-ages and leaves out the hole gag, like the clip |
| 10 Step! | approved 2026-11-02 | Japanese Wikipedia: «THE IDOLM@STER CINDERELLA GIRLS STARLIGHT MASTER» (STARLIGHT MASTER 02 with «ステップ！», lyrics Manami, music no_my, arrangement Yūjirō Okano), «原紗友里» (release 18 May 2016), «アイドルマスター シンデレラガールズ» (Bandai Namco and Cygames, Mobage service 28 Nov 2011 – 30 Mar 2023, the 2015 anime, Starlight Stage from September 2015) and «アイドルマスター シンデレラガールズの登場人物» (Mio: 15, Chiba, voice Sayuri Hara, nicknames, middle of three children, 1st in the 8th Cinderella Girl election, the anime arc and the «全然違うじゃん！» meme). No fact points at a moment of the clip, so there are no moment buttons |
| 12 Romeo and Cinderella | written 2026-11-02, awaiting review | Japanese Wikipedia «Doriko» (first Miku song «みっくりすます» and the nickname きりたんP, Miku bought with a new PC in 2007, the first song past a million views on Nico Nico Douga, KarenT single 19 Aug 2009, album 24 Nov 2010 at Oricon 25th, nezuki's illustrations); English Wikipedia «Hatsune Miku: Project Diva 2nd» (Sega and Crypton, PSP, 29 Jul 2010, the song list, Dreamy Theater 2nd on 4 Aug 2011 needing a PSP over USB); VocaDB song 1032 (published 6 Apr 2009); frames of the source video (clock tower, rose stand) and of the 3D clip at 50.4–52.4 s (the first outfit dissolve). doriko's and nezuki's genders are not given in the sources, so the text uses no gendered forms for them |
| 13 Hello | written 2026-11-03, awaiting review | There is no Wikipedia article on the singer, so the text rests on news and credits. Qaz365, «„Отец хотел меня убить“: Kalifarniya рассказал о трудностях на пути к искусству», 13 Sep 2024 (Фархат Калиев, born 2000 in Aktobe, music school, dombra and terme, a cook by training, son of a loader and a dishwasher, the Ninety One hair story, «Hello» among his songs); Tengrinews, 8 Jul 2023 (the name Фархат Калиев, born in Aktobe); Adyrna, «Певец Kalifarniya уезжает в США», 27 Aug 2023 (the style, platinum and gold discs for «Qar» and «Роза», «Puerto-Rico» as the hit of summer 2023 with over 100 000 TikTok posts and 450 million views); Apple Music, the song page (release 4 Apr 2024, songwriter Калиев Фархат, Kalifarniya as executive producer and on background vocals); the YouTube page of the official video, read 3 Nov 2026 (published 29 Apr 2024, credits PRODUCT BY KEREGE PRODUCTION, Director Koishekenov Adilbek, DoP Zhanibekov Nuraibek, 27 705 628 views); the end card of the source video at 165–173 s (KaliZone Tour 2024, fifteen cities from Taldyqorgan on 8 May to Astana on 16 June) and the 3D clip at 165.2 s (the car on the road from above). The Cyrillic forms of the director's and the camera operator's names are transliterated from the Latin credits |

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
- Clip 8 is split in two modules as well. `gk-cast.js` (`window.P3DGodKnowsCast`) adds its people, hair shells, forms and instrument props to the clip 7 rig and holds the arm solver: `GK.play(pose, form, instrument, { strum, fret })` puts the strumming and fretting hands on the guitar, and `GK.ik` solves any hand target in the torso frame at run time and caches the answer. Instruments hang on the torso (`RIGS`), so the solved angles stay valid however the body moves.
- `ccc-cast.js` has six hooks for other clips: a `SHELLS` entry may have `extra(head, back, H)` for locks and ponytails, `gear` accepts functions that build head pieces (bunny ears, hairband, witch hat), `PROPS[id]` registers a prop builder, `PRINTS[kind]` paints a torso decal, a `PEOPLE` entry with `paint(P, kind, mask, skin)` replaces the anime face painter, and the faces `say`, `belt`, `shout`, `grit`, `beam` and `smile` cover singing.
- `clip-god-knows.js` has its own `create()`. One gym set holds the stage, the hall, the drum kit, the amps and the stands; the audience is 18 rows of merged low-poly students that bounce on the beat and raise arms when `energyAt(t)` is high, plus posed cast students in close shots (`students`). A world sets `crowd: { from, to }` to draw only some rows. The drummer's sticks are drawn from the solved hand to the drum (`stickState`), and the crash cymbal wobbles after each crash hit.
- The anime's faces show only within about 0.9 rad of the front, so the profile shots of clip 8 are three-quarter views.
- Crowds that only need silhouettes (disco, concert) use the base `Figure` from `figure.js`, about a quarter of the polygons of a `ccc-cast.js` costume. The heaviest shot of clip 7 is about 40 000 triangles.
- `r.texture` repeats by default, and WebGL1 samples a non-power-of-two canvas with repeat as black: pass `clamp: true` for such sizes.
- Clip 9 is split in two modules as well. `uts-cast.js` (`window.P3DUhnTissCast`) adds its people to the clip 7 rig. They get a face painter of their own (`paintFace`, through the `paint` hook) with smaller eyes, brows, nostrils, lips and mouth shapes for singing and kissing, plus freckles, stubble and blush; every form has a 3D nose (`nose(skin)` in `gear`). The module also holds the hair shells, the costumes, the printed decals, the props (the arrow and acoustic guitars with `GK.RIGS` entries, the clipboard, cream puffs, punch bowl, remote, pail, paper hearts, toilet roll, cup, lipstick and pucker lips) and the dog (`dogSet`, `drawDog`).
- `clip-uhn-tiss.js` has its own `create()` with three sets (street, club, wc) and a macro view for the close-ups of the lips and the dog. The restroom has seven stalls; the singer's stall spans x 0..1, the girl's x 1..2, and the hole sits in the partition at x = 1 (`HOLE`). A world opens doors with `doors: { k: angle }`: a positive angle swings a door out into the corridor, a negative one into the stall. A door swung out hides the next stall from a camera in the corridor.
- `crowdShot` mirrors its numbers to the speaker side of the dance floor unless it gets `mirror: false`.
- The peek and kiss shots turn the singer 0.5 rad toward the camera (`PEEK_RY`). A camera behind his ear sees only hair, because the face patch shows within about 0.9 rad of the front.
- `node tools/poligon-shots.cjs shots uhn-tiss` renders a sheet of every shot. The test «Uhn Tiss moves … smoothly» scans five ranges at 60 fps.
- Clip 10 is split in two modules as well. `step-cast.js` (`window.P3DStepCast`) adds Mio to the clip 7 rig: her own face painter, whose face kinds are «eyes|mouth» pairs (eyes `open`, `happy`, `shut`, `wink`, `winkR`, `half`, `wide`; mouths `smile`, `rest`, `say`, `sing`, `belt`, `beam`, `grin`, `oh`), the hair shell with layers of pointed locks, the crown, hairpins and earrings as gear, and the costume of the form `mioStep`.
- `ccc-cast.js` has two more hooks: `skirt.build(b, spec)` builds a skirt of any shape in the skirt frame, and `legL` gives the left leg its own bands and extras (Mio's striped stocking).
- `clip-step.js` has its own `create()` with one arena set: the stage, the arena shell, 13 rows of merged audience whose glowsticks sway with a shear matrix, and textured far crowd quads that swap two images on the beat. A world sets `light` (`day`, `night`, `arena`), `screen` (`yellow`, `pink`, `sky`, `orange`, `sunset`, `white`, `live`), `title`, `crowd` and `disco`. For `live` the frame starts with a close-up of her face rendered into a 256×128 corner and grabbed into a texture, which the LED wall then shows. After the scene a bloom pass (threshold, two downsampled grabs, additive) gives the warm glow, and `flashAt(t)` draws the white flashes and the white end.
- `node tools/poligon-shots.cjs shots step` renders a sheet of every shot. The test «Step! dances smoothly» scans the whole clip at 60 fps.
- Clip 12 is split in two modules as well. `rc-cast.js` (`window.P3DRomeoCast`) adds Miku to the clip 7 rig with the face painter of clip 10 (`P3DStepCast.paintFace`) in her colours (people `miku`, `mikuDoll`, `mikuMint`), the fringe and side locks, the eleven forms of the outfit table and the rose microphone stand (`micMesh`, 1.42 m long, built along +y). A form names the colours of its twin tails in `tails`; the bride has `tails: null` and wears the bun and veil instead.
- The twin tails are rebuilt every frame into a dynamic vertex buffer (`tailMesh`). Their 14 segments trail the head anchor sampled 0.04 s apart (`tailsOf`, never across a `PATH` jump), fly outward in spins, are pushed out of the torso and the skirt, and rest on the floor when she kneels.
- Miku always holds the stand in her left hand. Each left-arm pose in `ARMS` names a stand mode (`mouth`, `staff`, `low`, `wand`, `cross`); poses carry mode weights, crossfades blend them, and `micOf` turns them into the ends of the rod. A move can set its own crossfade length (`xf`), as the slow kneel does.
- `clip-romeo.js` has its own `create()` with one set: the round platform on a round tower, the clock wall with Roman numerals and the stained-glass dial (`glass` sets its brightness per shot), purple windows, the railing with ivy, sixteen houses with lit windows, bunting, searchlights and a star dome. During an outfit dissolve (`COSTUMES`, `costumeAt`) the frame is rendered twice, once per outfit, and blended, with glitter around her. The title card is a canvas texture drawn over the main view.
- `node tools/poligon-shots.cjs shots romeo-and-cinderella` renders a sheet of every shot, and `lineup mikuScarlet mikuSundress …` shows the outfits front and back. The test «Romeo and Cinderella moves … smoothly» scans the whole clip at 60 fps and the tails in five ranges.
- Clip 13 is split in two modules as well. `hello-cast.js` (`window.P3DHelloCast`) adds its people to the clip 7 rig with the face painter of clip 9 (`P3DUhnTissCast.paintFace`): people `khSinger`, `khGirl` and `khDancer0`–`khDancer4`, hair shells (a short cap for him, middle-parted long hair for her, loose, wavy, ponytail, braid and bun hair for the dancers), clear glasses, tortoiseshell sunglasses and gold hoops as gear, the forms `khSinger`, `khGirl` and `khDancer0`–`khDancer9`, and the props `khPhone` and `khInstant`. It also builds the convertible (`carBody`, `carDoor`, `carGlass`, `carWheel`, `steering`, `carFlowers`), the gilt frame (`goldFrame`) and the arms of the hands shot (`macroArm`). The car faces +z with the driver at +x; `CAR` and `SEATS` hold the axles, the door, the hinge and the seats.
- `clip-hello.js` has its own `create()`. A world returns the scene, the solved cast, the camera, the light (`field`, `back`, `golden`, `sunset`) and optional `car`, `frame`, `hands`, `silhouette`, `sun` and `title`. A move may set `xf` (its crossfade), `spin` (beats for a full turn; turns add up, so `ry` never jumps by a full circle) and `still`; seated moves use the `seat` legs, and `stand` lifts the girl to her feet in the car.
- The steering wheel comes from the driver's reference torso (`wheelSetup`): the rim targets for `GK.ik` are worked out in that torso frame, so his hands stay on the rim as long as his spine lean stays at −0.18.
- `node tools/poligon-shots.cjs shots hello` renders a sheet of every shot. The test «Hello moves …» scans the whole clip at 60 fps.
