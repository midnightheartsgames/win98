Project Rules
Project-First Architecture

When designing, implementing, refactoring, or reviewing game architecture or UI, do NOT use other games, previous projects, genre conventions, tutorials, or remembered implementations as templates.

Do not justify decisions with:

"Like in game X."
"This is standard for JRPGs."
"We used this in another project."
"This is how games usually do it."
"Let's reuse the same UI structure."

Every decision must come from the requirements of THIS project.

Before creating a system or interface:

Inspect the existing project.
Understand what the feature actually needs.
Reuse existing systems where appropriate.
Implement the smallest structure that solves the task.
Avoid adding abstractions or patterns without a concrete reason.

Do not automatically introduce:

managers;
service layers;
event buses;
ECS/MVC/MVVM;
generic frameworks;
unnecessary base classes;
speculative systems for future features.

Architecture must follow the game, not a preferred template.

UI

Do not build every screen from the same layout pattern.

Determine the purpose of each screen, required information, player actions, hierarchy, and navigation independently.

Do not automatically reuse the same:

sidebars;
cards;
grids;
panels;
menus;
HUD layouts;
button arrangements.

Win 98 is the visual language of the project, not a mandatory layout template for every screen.

Do not reference other games when explaining or designing architecture or UI unless the user explicitly asks for comparisons or references.

Game Distribution (Steam)

Games are never preinstalled. Every game made for this project is bought and downloaded through the in-system Steam client (js/apps/steam.js), and Steam itself is downloaded from http://www.steampowered.com in Internet Explorer.

When adding a new game:

add its entry to the catalog in js/game-manager.js with steam: true (Steam, steampowered.com and the tests pick it up from there);
give the entry genre, tags (3 to 5) and shots (captions of at least two screenshots), and capture content/steam/<id>-1.jpg and <id>-2.jpg (640x480) from the real game with a recipe in tools/steam-shots-recipes.cjs (node tools/steam-shots.cjs <id>); the Steam details window shows them;
do not add it to the default purchased, downloaded or installed lists in GameManager.loadState;
do not add "<id>Granted" flags or any other code that grants or installs the game automatically;
show desktop icons, Start menu items and C:\Games files only when gameManager.isInstalled(id) is true;
when the game is not installed, point the player to Steam (gameManager.showInSteam(id)), never to a setup wizard or another web store;
do not create new web stores for games; the old RetroGame Store (www.buygames98.com) was removed on purpose.

Exception: demos shipped on the Igromania CD (D:) keep their CD installers. The CD shell (js/apps/igroman.js) lists only demos that really install: Burnout, NHL 98, World Cup 98 and the project games moved there from Steam. Their catalog entries have cdDemo: true and no steam flag, the moved ones have ids ending in `_demo` and titles ending in Demo, installers sit in D:\demo (getIgromaniaCdTree in js/filesystem.js), screenshots live in content/igromania/demos/<id>-<n>.jpg (node tools/steam-shots.cjs <id> writes `_demo` ids there), and not-installed paths call gameManager.showOnCd(id) instead of showInSteam.

Exception: Безмятежность (Bliss, js/apps/bliss, BLISS-98.md) is a standard system game like Minesweeper, FreeCell and 3D Pinball, by the user's decision: always present as a shortcut in the desktop folder Развлечение, in Start > Games and as C:\WINDOWS\BLISS.EXE, with no catalog entry in js/game-manager.js and no Steam page.

Exception: Honkai: Star Rail 98 is free and can also be downloaded from its official site http://hsr.hoyoverse.com (js/apps/hsr-site.js). The site saves StarRail98_Setup.exe to Downloads, and its own setup wizard installs the game and adds it to the Steam library. Steam sells it for free as well. No other game gets a download outside Steam.

Exception: the Android launcher Пароход 98 (ANDROID-LAUNCHER.md) is a real phone app outside Win 98. It downloads Serious Sam 98, Forza Horizon: Рига and Grand Theft Auto: Нижний Сити for free, with touch controls, from update/parohod98/ on the mini PC. Packages come from tools/parohod98-game.cjs, npm run release -- parohod98 games publishes changed games to test (player notes in releases/parohod98/<game>/next.md), and promote parohod98 <game> <version> moves one to stable only with the user's go-ahead. The launcher shows no prices and no purchase. A new game goes there only when the user asks for it. Inside Win 98 these games stay on Steam as usual.

Running Tests

The full test suite loads the user's PC to 100%. Run only the tests of what the current task changes:

working on HSR 98: node tests/hsr98.test.js (plus hsr-site or kovcheg-site when their texts or data change); same for any other game or app: its own tests/<name>.test.js;
changing shared code (js/apps/ie.js, js/apps/clippy*.js, js/game-manager.js, js/filesystem.js and similar): only the test files of the callers the change really touches, found with a search, one file at a time;
never run npm test, a loop over tests/*, or several test files in parallel, and never repeat runs to hunt flaky tests, unless the user asks for it in that task;
a subagent gets the same limit: name the exact test files in its prompt.

When a change may reach further than the tests that were run, say which tests were not run; do not run them.

Bug Reports

Players and the developer send bug reports with F10 (Ctrl+F10 in every program) in the system and F9 in Honkai: Star Rail 98. BUGREPORT.md describes the whole system. Every report ends up in bugreports/<id>/ (report.json, report.md, shot*.png or .jpg, save.json.gz, status.json); this folder is never committed.

When the user asks to look at a report ("разбери BR-261027-7K3Q", "разбери последний баг", "разбери новые баги"):

run node tools/bugs.cjs pull first (it needs the token in %USERPROFILE%\.win98-bugs.json);
read bugreports/<id>/report.md and look at shot.png, shot-marked.png (the player's red frames) and shot-window.png when present;
check the HEAD line in report.md: if files changed after the build, first check whether the bug is already fixed;
reproduce with node tools/bugs.cjs repro <id> --headless and read repro.png and repro.log; it loads the report's save (and the live HSR state) on port 8091 without touching the user's own saves;
fix the bug by the usual project rules and add a test for it when one is possible;
then run node tools/bugs.cjs status <id> fixed --in next --note "<what was fixed, one short sentence for the player>"; the release that ships the fix replaces next with its version number. Use duplicate --dup <id>, notabug or wontfix when they fit. Reports marked «F7/F8» come from saves that used the debug keys.

Keep the keys free: F10 and Ctrl+F10 belong to the report in the system, F9 to the report in HSR 98. A new game that really needs F10 goes into F10_OWNERS in js/apps/bugreport.js; nothing may use Ctrl+F10, and HSR may not use F9.

When a new app or game stores data, its storage keys go into js/apps/backup-catalog.js; the report window then offers to attach that save by itself. Add a "Где" adapter in js/apps/bugreport-where.js only when a real report needed more detail than the window title.

The receiver runs on the mini PC (tools/bugs/receiver.cjs, /opt/bug-receiver, service bug-receiver, secrets in /etc/bug-receiver.env). To update it, the user copies the file with scp to /tmp and runs sudo cp to /opt/bug-receiver/ and sudo systemctl restart bug-receiver; tests/bug-receiver.test.js covers it.

Releases and Launchers

LAUNCHER.md describes the whole system. Win98.exe opens a Win 98 launcher (electron/launcher/), StarRail98.exe (tools/sr98-pc/) opens a launcher in the style of the sr98 site, and the APK has the title item «Обновления» (js/apps/hsr98/hsr-ui-update.js). All three update from signed static files on the mini PC (https://pennygachi.men/web98/update/); electron/updater.js is the shared update core, electron/launcher-host.js the shared launcher process code.

When the user asks for a release ("выпусти обновление", "сделай выпуск Win 98", "выпусти SR98"):

write releases/win98/next.md or releases/sr98/next.md for players from the commits since the last release (the pointer keeps its commit): "# Title", "Кратко: ...", "## Новое" and "## Исправлено" with "- " items, grouped by game or program, Microslop and Win naming; show it to the user before releasing;
npm run release -- win98 or npm run release -- sr98 builds, checks the launch, uploads over ssh (Host mini-pc) and verifies through Cloudflare; the default channel is test;
the test channel is checked by the user (five clicks on the version number in the launcher settings, five taps on the version in the APK screen); only after that npm run release -- promote <win98|sr98> <version> moves it to stable. Stable releases need a committed tree and the user's go-ahead, never publish to stable on your own;
--full also uploads the full archive for new players (Win98.zip or StarRail98-PC-<version>.zip);
npm run release -- status shows what is published, verify checks a channel from outside, gc deletes unused files (only with --yes).

The signing key is %USERPROFILE%\.win98-release.key and the APK key is %USERPROFILE%\.android\hsr98.keystore; neither goes into git, and losing them means existing installs stop getting updates. Never reuse a published file name: Cloudflare keeps old copies. SR98 news for the launcher come from web98-site/sr98/news.js (the site loads the same file); Win 98 news are releases/news/*.md.

Android Launcher (Пароход 98)

ANDROID-LAUNCHER.md describes the whole system. The APK (tools/parohod98/android, its page in tools/parohod98/launcher) downloads game packages into the app from https://pennygachi.men/web98/update/parohod98/; a game never becomes its own APK. Players get the APK from the web98 landing or the sr98 site, and both read the link and size from update/parohod98/stable.json.

To add a game, only when the user asks for it:

touch module js/apps/<game>/<prefix>-touch.js on js/touch-controls.js with the tables TUNE, ACTIONS and LAYOUT, created only under Parohod98 or ?touch, so the game inside Win 98 stays the same;
presets «Телефон» and «Слабый телефон», one of them set on first start, plus a frame-rate setting;
an entry in GAMES in tools/parohod98-game.cjs; title, genre, tags and description come from js/game-manager.js at release;
its save keys in js/apps/backup-catalog.js, in SAVES in tools/parohod98/launcher/launcher-state.js and in GAMES and PREFIXES in js/parohod98-report.js;
player notes in releases/parohod98/<game>/next.md;
a touch section in the game's test file, then npm run test:parohod98.

Releases: npm run release -- parohod98 games [ids] --channel test publishes changed games, npm run release -- parohod98 --channel test publishes the launcher (notes in releases/parohod98/next.md, never reuse a published APK name). --dirty works only for test. The user checks the test channel on the phones; only with the user's go-ahead promote parohod98 apk <version> and promote parohod98 <game> <version> move them to stable. Commit the files that go into the packages first: promote records HEAD. The APK key ~/.android/parohod98.keystore never goes into git.

Multiplayer (Эфирная связь)

HSR-NET.md describes the whole system: UID, Friends, visits to the Express and co-op of «Рубеж Экспресса» in HSR 98, and in Win 98 the modem provider and Network Neighborhood (js/net98-shell.js). Clients simulate the arena; the server tools/net/server.cjs on the mini-PC numbers and relays commands and keeps accounts, friends and guest books.

No network before consent (Net98.hasConsent). The secret in net98.account never reaches saves, reports or the backup of a game, which is why the key stays outside hsr98.*.
«Нет связи» texts stay neutral and never advise how to get around a block.
The simulation modules (SIM_FILES in tools/hsr-net-simver.cjs) use HD.N instead of native maths and never use Math.random, Date.now, new Date or performance; heroes come from A.heroes[], never A.hero. tests/hsr-net.test.js lists what is banned.
After any edit of those modules or the tables they read, run node tools/hsr-net-simver.cjs. tests/hsr-net.test.js fails and tools/release.cjs refuses win98 and sr98 while HD.SIM is stale. Only players with the same HD.SIM sit at one table, so a changed HD.SIM means everyone has to update.
Names and texts of other players are cleaned and drawn only on the canvas, or escaped in the shell. UIDs of others never go into saves or the stored VFS. A visit runs in a temporary game (H.visitGame, ui.homeGame) and never writes the save.

To update the server, copy it with scp tools/net/server.cjs mini-pc:/tmp/server.cjs; the user runs sudo cp /tmp/server.cjs /opt/net98/ && sudo systemctl restart net98. The server has no dependencies and must run on Node 20.19. Data lives in /var/lib/net98. Admin: node tools/net.cjs stats, desync, ban, unban, rename, unrename, book-clear.

Tests: tests/net-server.test.js, tests/hsr-net.test.js, tests/hsr-net-ui.test.js, tests/hsr-visit.test.js, tests/net98-shell.test.js. Real windows in headless Edge with a local server: node tools/net/e2e.cjs, e2e-table.cjs, e2e-friends.cjs, e2e-visit.cjs, e2e-shell.cjs, with --shots=<folder>. A report made at a table carries the journal of the game: node tools/bugs.cjs repro <id> --headless replays it and says whether the hash matches.

Naming: Microslop and Win

In all text written for this project (UI strings, i18n, fake sites, dialogs, Clippy lines, game texts, tests, docs), never write "Microsoft" or "Windows" as names.

Use:

Microslop instead of Microsoft (Microslop Corp., Microslop Plus! 98, Microslop Agent);
MICROSLOP instead of MICROSOFT;
Win instead of Windows (Win 98, Win 98 SE, Win Task Manager, Microslop Win 98);
WIN instead of WINDOWS in display text (WIN 98).

Keep the real names only where the code depends on them:

VFS paths and folder keys, such as C:\WINDOWS and ['My Computer', 'C:', 'WINDOWS'];
real host paths (C:/Program Files/Microsoft/Edge/...), User-Agent strings (Windows NT 10.0), font names ('Microsoft Sans Serif') and speech-voice name matching;
code identifiers (openAboutWindows, tileWindows, S.Windows, WINDOWS tables, MAT.WINDOWS);
the English word "windows" meaning windows on the screen or in buildings (Cascade Windows, Minimize All Windows).

Zero Comments Policy

When writing, modifying, refactoring, generating, or reviewing source code, NEVER use comments.

Absolute Rule

The resulting source code must contain ZERO comments.

This includes:

inline comments;
block comments;
documentation comments;
TODO or FIXME comments;
explanatory comments;
commented-out code;
comments above or inside functions, classes, structs, methods, fields, variables, or modules.

Do not preserve existing comments in code you modify unless the user explicitly requires it.

Do not replace deleted code with commented-out versions.

Documentation

Do not use comments to explain unclear code.

Instead:

use self-explanatory names;
extract complex logic into clearly named functions;
use types and explicit structures;
simplify the code;
use external documentation when necessary.
Final Verification

Before finishing any coding task, inspect the resulting diff.

Verify that:

no unnecessary architecture or UI templates were copied from other projects;
the solution fits this project specifically;
generated or modified source code contains ZERO comments.

If a comment is present in code you generated or modified, remove it before completing the task.