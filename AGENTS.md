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

Exception: Honkai: Star Rail 98 is free and can also be downloaded from its official site http://hsr.hoyoverse.com (js/apps/hsr-site.js). The site saves StarRail98_Setup.exe to Downloads, and its own setup wizard installs the game and adds it to the Steam library. Steam sells it for free as well. No other game gets a download outside Steam.

Bug Reports

Players and the developer send bug reports with F10 (Ctrl+F10 in every program) in the system and F9 in Honkai: Star Rail 98. BUGREPORT.md describes the whole system. Every report ends up in bugreports/<id>/ (report.json, report.md, shot*.png or .jpg, save.json.gz, status.json); this folder is never committed.

When the user asks to look at a report ("разбери BR-261027-7K3Q", "разбери последний баг", "разбери новые баги"):

run node tools/bugs.cjs pull first (it needs the token in %USERPROFILE%\.win98-bugs.json);
read bugreports/<id>/report.md and look at shot.png, shot-marked.png (the player's red frames) and shot-window.png when present;
check the HEAD line in report.md: if files changed after the build, first check whether the bug is already fixed;
reproduce with node tools/bugs.cjs repro <id> --headless and read repro.png and repro.log; it loads the report's save (and the live HSR state) on port 8091 without touching the user's own saves;
fix the bug by the usual project rules and add a test for it when one is possible;
then run node tools/bugs.cjs status <id> fixed --in <version> --note "<what was fixed, one short sentence for the player>"; use duplicate --dup <id>, notabug or wontfix when they fit. Reports marked «F7/F8» come from saves that used the debug keys.

Keep the keys free: F10 and Ctrl+F10 belong to the report in the system, F9 to the report in HSR 98. A new game that really needs F10 goes into F10_OWNERS in js/apps/bugreport.js; nothing may use Ctrl+F10, and HSR may not use F9.

When a new app or game stores data, its storage keys go into js/apps/backup-catalog.js; the report window then offers to attach that save by itself. Add a "Где" adapter in js/apps/bugreport-where.js only when a real report needed more detail than the window title.

The receiver runs on the mini PC (tools/bugs/receiver.cjs, /opt/bug-receiver, service bug-receiver, secrets in /etc/bug-receiver.env). To update it, the user copies the file with scp to /tmp and runs sudo cp to /opt/bug-receiver/ and sudo systemctl restart bug-receiver; tests/bug-receiver.test.js covers it.

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