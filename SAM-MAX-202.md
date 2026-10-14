# Sam & Max: Moai Better Blues

Episode 202 of the Freelance Police and the second case of the second season, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the custom engine (`js/apps/sammax/`) and adds its own rooms, characters and procedural artwork in `js/apps/sammax202/`. Everything is drawn in code at 320x200 with a 256-colour palette. The dialogue is original writing in Russian adhering strictly to project guidelines. The plot follows the beats and the puzzle chain of episode 202: a glowing Bermuda portal outside the office, the crying and mocking Moai heads on Easter Island, Lincoln and Sybil dating on the beach, Baby Jimmy and Mary at the Fountain of Youth, Pedro Mariachi inside the Bermuda Triangle, and High Priest Mr. Spatula commanding the Bellavista volcano.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $30.49). The game is never preinstalled.
- After installation: desktop icon **Sam & Max 202**, Start menu -> **Sam & Max: Moai Better Blues**, `C:\Games\SamMax202\SAMMAX22.EXE`, Run dialog: `sammax202`, `sammax22`, `sam & max 202`, `moai better blues`, `сэм и макс 202`, `блюз истуканов`.
- Standalone page: `sammax202.html` (`window.smx22` is the UI, `smx22.g` the game instance).
- Test: `npm run test:sammax202` (checks metadata, room boundaries, all dialogue trees, inventory combinations, full playthrough from intro to epilogue, save/load persistence, zero comments, zero dashes, and system shell integrations).
- Steam screenshots: `node tools/steam-shots.cjs sammax202` (recipe in `tools/steam-shots-recipes.cjs`).

## Controls

The classic Freelance Police interface: left click walks or applies active cursor, right click cycles walk -> look -> use -> talk, Sam's inventory icon opens the evidence bag, `.` skips a line of dialogue, Esc opens the menu or skips cutscenes, F5 opens quick save. Both Sam and Max are clickable actors.

New in this episode:

- **Bermuda Portals.** Walking into or applying the use cursor on a portal opens destination choices: Street, Easter Island Beach, Bermuda Triangle, and the Volcano Caldera.
- **Office Evidence Closet.** Contains relics from every past case (101 to 201), including Mr. Bear, Lincoln's puppet head, the cap gun, boxing glove, Hugh Bliss jar, Reality 2.0 key, Leonard's gear, and after victory, Mr. Spatula himself.
- **Tectonic Inverter.** Bosco's anti-triangle gadget used to divert molten lava flows at the caldera rim into the Pacific Ocean.

## Structure and Puzzles

1. **Act I: The Anomaly.** An energy rift opens outside the office. Sam and Max investigate the street, warp through the portal, and arrive at Easter Island beach.
2. **Act II: Appeasing the Moai.**
   - Mortimer provides the prophecy stone and explains the volcano danger.
   - Sybil and Lincoln need romantic inspiration. A tropical hibiscus from the beach sparks their date.
   - Bernie the Crying Moai dries his tears upon witnessing true love under the palm trees.
   - Granite sandwich from Stinky is traded to paranoid Bosco for the seismic inverter.
   - Fountain of Youth: 40-year sun tea calms baby Jimmy, yielding the golden rattle. Youth water collected.
   - Cavern: tickling giant stone toes makes mocking Billy stop laughing and turn serious.
   - Rejuvenating Grandpa Stinky reveals the secret volcano path.
3. **Act III: Bermuda Triangle and Portal Harmony.**
   - Pedro Mariachi tunes the triangle portals using the golden rattle frequency, unsealing the volcano entrance.
4. **Act IV: The Caldera and Epilogue.**
   - Confrontation with High Priest Mr. Spatula.
   - Seismic inverter redirects lava away from the Moai heads.
   - Mr. Spatula is safely captured in a glass jar.
   - Easter Island is saved, and the Freelance Police return to their office to shelve the evidence.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Сэм | Freelance Police dog detective | Dry, bookish, observant; never narrates his own actions directly |
| Макс | Hyperactive lagomorph partner | Chaotic, enthusiastic, loves violence and decrees |
| Берни | Weeping Moai head | Mournful, poetically terrified of molten lava |
| Билли | Mocking Moai head | Boisterous, laughs at mortals until his feet are tickled |
| Мортимер | Ancient wise Moai head | Solemn keeper of island prophecies |
| Педро | Mariachi musician | Cheerful trumpeter celebrating birthdays in the triangle |
| Сибил Пандемик | Matchmaker consultant | Analytical about compatibility and tropical dates |
| Авраам Линкольн | Stone suitor | Oratorical, poetic, yearning for romantic gesture |
| Боско | Store owner in radiation suit | Paranoid about triangular frequencies and rays |
| Юная Вонючка | Diner owner | Haughty, serves indestructible granite sandwiches |
| Дедушка Вонючка | Old sailor | Reminisces about storms and desires his youth back |
| Малыш Джимми | Rat boss reduced to infant | Demands cheese porridge and rattles |
| Мэри Два Зуба | Rat mother | Exhausted, trying to feed her infant husband |
| Мистер Лопатка | Former office goldfish | Megalomaniacal high priest of the magma cult |
