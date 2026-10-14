# Walkthrough: Interactive Win 98 Web Clone + Wolfenstein 3D + LucasQuest 98

We have built an authentic, interactive, visual web clone of **Microslop Win 98** using vanilla HTML, CSS, and JavaScript.

The project runs locally via a lightweight zero-dependency Node HTTP server on `http://localhost:8080` and requires no external framework dependencies.

---

## Project Location & Structure

Project directory:
`C:\Users\MYPC\.gemini\antigravity\scratch\win98-clone`

```
win98-clone/
├── index.html                  # Desktop shell, boot screen, and application mounts
├── package.json                # npm start script
├── server.js                   # Zero-dependency Node.js HTTP server (port 8080)
├── README.md                   # Complete overview and instructions
├── WALKTHROUGH.md              # Detailed technical walkthrough
├── css/
│   ├── win98-base.css          # Classic bevels, 3D borders, palette, typography, scrollbars
│   ├── desktop.css             # Desktop icons, marquee selection, CRT overlay, boot/shutdown screens
│   ├── taskbar.css             # Taskbar, Start button, flyout submenus, clock, notification tray
│   ├── window.css              # Window frame, active/inactive title bars, controls, resizing, dialogs
│   └── apps/
│       ├── explorer.css        # My Computer / File Explorer styles
│       ├── notepad.css         # Text editor layout and monospace typography
│       ├── paint.css           # Paint toolbox, canvas viewport, 16-color palette
│       ├── calculator.css      # Calculator layout and LCD display
│       ├── minesweeper.css     # Minesweeper 9x9 grid, 7-seg LED counters, smiley face
│       ├── ie.css              # Internet Explorer browser chrome and 90s web pages
│       ├── wolf3d.css          # Wolfenstein 3D viewport, HUD status bar, and overlay
│       └── scumm-quest.css     # LucasArts SCUMM adventure UI, verbs grid & subtitles
└── js/
    ├── icons.js                # Self-contained SVG pixel/vector icons registry
    ├── audio.js                # Procedural Web Audio API sound synthesizer & adventure music
    ├── filesystem.js           # Virtual filesystem (C:, D:, folders, localStorage)
    ├── window-manager.js       # Window drag, resize, z-index, minimize, maximize, restore, close
    ├── desktop.js              # Desktop icons, marquee box, right-click context menu
    ├── taskbar.js              # Taskbar synchronization, Start menu state, digital clock
    ├── main.js                 # Boot screen sequence, audio unlock, global keyboard shortcuts
    └── apps/
        ├── explorer.js         # My Computer / drive navigation / folder browser
        ├── notepad.js          # Notepad with File (New, Save, Open) & Edit menus
        ├── paint.js            # Canvas paint with pencil, brush, eraser, shapes, bucket, colors
        ├── calculator.js       # Win98 calculator with math operations & keyboard support
        ├── minesweeper.js      # Complete 9x9 Minesweeper with timer, flags, smiley
        ├── wolf3d/             # Wolfenstein 3D modules (data, gfx, maps, core, render, audio, ui)
        ├── scumm-quest.js      # LucasArts SCUMM graphic adventure engine & dialogue trees
        ├── ie.js               # Fake IE with navigation, 90s pages & working guestbook
        ├── recycle-bin.js      # Trash bin with funny files and "Empty" action
        ├── shutdown.js         # Shutdown dialog, "Safe to turn off" screen, MS-DOS mode
        └── dialogs.js          # About Win, Run..., Display Properties (colors & CRT)
```

---

## Key Features & Visual Details

### 1. Retro Win 98 Look & Feel
- **Pixel-perfect Bevels**: Authentic multi-layer 3D inset/outset borders (`#fff`, `#000`, `#dfdfdf`, `#808080`).
- **Classic Color Scheme**: `#008080` (Classic Teal desktop), `#c0c0c0` (Surface Gray), active navy gradient title bars (`#000080` to `#1084d0`) with bold white text, inactive gray title bars (`#808080` to `#b5b5b5`).
- **Typography & Scrollbars**: MS Sans Serif style font rendering, textured checkered scrollbars with 3D bevel buttons.
- **CRT Monitor Overlay**: Toggleable scanlines and subtle vignette curvature via Display Properties or notification tray icon.
- **Boot Sequence**: Retro 2-second boot screen with animated progress bar that fades into the desktop.
- **Synthesized Audio (Web Audio API)**: Procedurally generated startup chord, mechanical clicks, error alert chords, information dings, minesweeper explosion, shutdown chime, and trash emptying crinkle.

### 2. Window Manager & Desktop
- **Window Controls**: Minimize (`_`), Maximize (`□`) / Restore (`❐`), and Close (`✕`).
- **Window Management**: Smooth title-bar dragging clamped to screen bounds, edge/corner resizing, z-index layering on click, active/inactive state switching.
- **Taskbar Integration**: Window buttons dynamically show on the taskbar with icons; clicking a taskbar item minimizes or restores the window.
- **Desktop Marquee & Context Menu**: Drag selection box across desktop icons; right-click context menu with Arrange Icons, Refresh, New Text Document, and Properties.
- **Start Menu**: Classic vertical blue banner (`Win 98`), nested flyout submenus (Programs -> Accessories -> Notepad, Paint, Calculator; Games -> Minesweeper, Wolfenstein 3D, LucasQuest 98), Documents, Settings, Find, Help, Run..., Shut Down...

### 3. Fully Functional Retro Applications
- **My Computer & File Explorer**:
  - Virtual drives: `(C:)` and `(D:)`, `Control Panel`.
  - Folders: `WINDOWS`, `Program Files`, `My Documents`, `Games`.
  - Address bar, Back, Forward, Up buttons.
  - Double-clicking text files opens Notepad; double-clicking programs launches them.
- **Notepad**:
  - Menubar with File (New, Open, Save, Save As, Exit), Edit (Undo, Cut, Copy, Paste, Select All, Time/Date `F5`), and Help.
  - Full textarea with monospace font and line/column status bar.
  - Saves files directly into `localStorage` and the virtual filesystem.
- **Paint**:
  - Tools: Pencil, Brush, Eraser, Fill Bucket (flood fill), Line, Rectangle, Ellipse, Clear Canvas.
  - 16 classic Win 98 color swatches (left-click for primary, right-click for secondary color).
  - Line thickness options (1px, 2px, 4px, 8px).
- **Calculator**:
  - Authentic layout with LCD display, memory indicators (`MC`, `MR`, `MS`, `M+`), backspace, CE, C, arithmetic, sqrt, percent, 1/x, negation.
  - Full keyboard support (numpad digits and operators).
- **Minesweeper**:
  - Classic 9x9 beginner grid with 10 mines.
  - Red digital 7-segment LED counters for remaining mines and elapsed time.
  - Interactive smiley face: normal 🙂, scared 😮 when holding click, dead 😵 on explosion, sunglasses 😎 on victory.
  - Left click to reveal (with flood fill for blanks), right click to cycle flag 🚩 / question mark ❓.
- **Wolfenstein 3D (Retro Raycaster FPS)**:
  - Full clone with six episodes of ten floors each (60 maps), nine bosses, secret floors and a Pac-Man maze; see WOLF3D.md.
  - 320x200 raycaster at 70 tics per second: mid-tile sliding doors with jambs, pushwalls, gold and silver locks, elevator switches.
  - Enemies follow the original rules: sight in front, hearing gunfire through open doors, ambushes, dodging, distance-based hit chance.
  - Knife, pistol, machine gun and chain gun; food, first aid, treasure, one-ups, keys; extra life every 40,000 points.
  - Menus, episode and skill choice, intermission tallies, ten save slots, high scores, the M+L+I cheat and an attract demo.
- **LucasQuest 98 (LucasArts SCUMM Graphic Adventure)**:
  - Classic 9-verb SCUMM console interface: `Give`, `Open`, `Close`, `Pick up`, `Look at`, `Talk to`, `Use`, `Push`, `Pull`.
  - Dynamic sentence line: dynamically composes player intent (e.g. *"Use Mug of Hot Java with Sleeping Sysadmin"*).
  - Animated protagonist: **Guybrush Bytepwood** with walking cycles, leather boots, white pirate shirt, and ponytail.
  - Interactive multi-room exploration:
    1. **1998 Mainframe Lab**: Locked IBM server rack, commercial espresso machine, coffee mug, sleeping Senior Sysadmin pirate (Captain Bob).
    2. **Sub-Level Archive**: Backup magnetic tape drives, blown high-voltage fusebox with sparking wires, heavy copper wire spool, roof ladder.
    3. **Rooftop Satellite Station**: Giant 56.6k parabolic dish, Cyber-Pigeon guarding the mythical Win 98 Boot CD, glowing sunset city skyline.
  - Classic branching dialogue trees with witty pirate banter and signature yellow/cyan subtitles floating over characters' heads.
  - Multi-step inventory puzzles: Rubber Chicken with a pulley, Win 98 Coffee Mug, Mug of Hot Java, Copper Jumper Wire, Admin Floppy Disk, Win98 Boot CD.
  - Synthesized iMUSE-style Caribbean/pirate adventure soundtrack and dialogue voice blips.
- **Internet Explorer 5**:
  - Browser chrome with navigation buttons (Back, Forward, Stop, Refresh, Home, Address bar, Go).
  - Authentic 90s vintage pages: Home portal with scrolling marquee, "Under Construction" badge, visitor counter, Games directory, About the 1998 Web, and an interactive **Guestbook** where user comments are stored in `localStorage`.
- **Recycle Bin**:
  - Humorously populated with `homework.txt`, `totally_not_a_virus.exe`, `old_memes.bmp`, `budget_1998.xls`.
  - "Empty Recycle Bin" button with confirmation dialog and paper crinkling audio.
- **Shutdown & MS-DOS Mode**:
  - Classic "Shut Down Win" dialog (Shut down, Restart, Restart in MS-DOS mode).
  - Shut down: plays shutdown chime, screen turns black with classic orange text: *"It is now safe to turn off your computer."* with Restart button.
  - Restart: re-triggers the boot screen and desktop startup.
  - MS-DOS mode: full-screen command prompt supporting `dir`, `ver`, `cls`, `echo`, `help`, and `win` / `exit` to return to Win!
- **System Dialogs**:
  - **About Win**: system specs and retro license information.
  - **Run...**: launches apps by name (`notepad`, `calc`, `paint`, `mine`, `cmd`, `explorer`, `iexplore`, `wolf3d`, `quest`).
  - **Display Properties**: change desktop background colors (Teal, Navy, Spruce, Tan, Black, Plum) and toggle CRT scanline overlay.

---

## How to Run & Verify

1. The development server is currently running at:
   **`http://localhost:8080`**
2. To launch it again at any time from terminal:
   ```powershell
   cd C:\Users\MYPC\.gemini\antigravity\scratch\win98-clone
   npm start
   # or
   node server.js
   ```
3. Open `http://localhost:8080` in your web browser.
