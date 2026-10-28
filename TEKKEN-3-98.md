# Tekken 3 98

A from-scratch 3D fighting game built on the rules of Tekken 3: four limb buttons, sidesteps, frame data, launchers and juggles, throws with breaks, a ground game and ten-hit strings. The roster, stages, music, story and endings are original: sixteen new fighters whose styles follow the Tekken 3 archetypes, with a tournament run by the Kurogane corporation and an ancient bronze Colossus under the arena.

- Distribution: Igromania CD demo Tekken 98 Demo (`tekken98_demo`, `cdDemo: true` in `js/game-manager.js`, `D:\demo\tekken98demo.exe`). Not sold in Steam, not preinstalled.
- After installation: desktop icon **Tekken 3 98**, Start menu → **Tekken 3 98**, `C:\Games\Tekken3\TEKKEN3.EXE`, Run: `tekken`, `tekken3`, `tekken 3`, `теккен`, `tk3`.
- Standalone page: `tekken3.html` (`window.tkui` is the UI instance).
- Test: `npm run test:tekken3` (about 2200 checks in about 1 second).

## Controls

| Input | Player 1 | Player 2 |
| --- | --- | --- |
| Move | W A S D | Arrows |
| Left punch (1) | U | Num 4 |
| Right punch (2) | I | Num 5 |
| Left kick (3) | J | Num 1 |
| Right kick (4) | K | Num 2 |
| Start / pause | Enter | Num Enter |

In single-player modes both key sets control player 1, and Z / X also work as 3 / 4. Gamepads: X/□ = 1, Y/△ = 2, A/✕ = 3, B/○ = 4, LB = 1+2, RB = 3+4, LT = 1+3, RT = 2+4, Start = pause. Keys can be rebound in Options → Controls. Esc opens the pause menu with the move list; in Practice, Backspace resets positions.

## Fighting system

- **Directions are relative to the opponent.** Holding back or standing still blocks high and mid attacks. Holding down or down-back blocks lows. Mids hit crouching opponents, highs whiff over them, special mids are blocked both ways.
- **Movement.** Double tap forward to dash and keep holding to run (running into the opponent rams them). Double tap back for a backdash. A quick tap of up or down sidesteps into or out of the screen; holding up jumps. Linear moves whiff against sidesteps, wide moves track them.
- **Frame data.** Every move has startup, active and recovery frames and on-block / on-hit advantage. A move that is −10 on block is punished by a 10-frame jab; −9 is safe. Hitting an opponent during their own move is a counter hit (more damage, sometimes a launch or a knockdown). Inputs pressed during the last 8 frames of recovery or stun are buffered.
- **Strings.** Many moves chain into the next press inside a window (`1,2`, `1,2,4`, chain punches, kick strings). Every starting fighter has a ten-hit string shown at the bottom of the move list.
- **Juggles.** Launchers pop the opponent into the air. Air hits add lift that decays with every hit, and damage scales down along the juggle.
- **Throws.** 1+3 is broken with 1, 2+4 with 2, command throws with 1+2. Throws from behind cannot be broken, and high throws whiff on crouching opponents. Volkov has a three-part chain throw, and each part has its own break button.
- **Ground game.** Press a button as you land to tech roll. While lying: up stands up, back rolls back, forward rolls forward, 1 rolls sideways, 3 and 4 are rising kicks. Lows and stomps hit lying opponents; after two ground hits the fighter is forced up with a short invulnerability.
- **Special mechanics.** Parries and reversals (Kenta, Irina, Tony, Kagemaru, Genzo), stances with their own moves (Yalan's Lotus and Dragon's Back, Rafael's Negativa and handstand, Min-jun's Crane, Kagemaru's healing meditation, Potapych's rest, Liu Sheng's drunken sleep), a just-frame uppercut for Kenta and Genzo, teleport, power-up taunts, fire breath, and Churban, who fights with another fighter's style every round.

## Fighters

| Fighter | Style | Unlock |
| --- | --- | --- |
| Кэнта Арамаки | Kyokushin karate, crouch dash and just-frame uppercut | start |
| Рэй Мэддокс | Street fighting and judo, the Maddox Hammer | start |
| Сун Ялань | Baguazhang, Lotus and back-turned stances | start |
| Рафаэл Соуза | Capoeira Angola, ginga, Negativa and handstand | start |
| Григорий Волков | Combat sambo, chain throws | start |
| Кан Мин-Джун | Taekwondo, Crane stance and kick strings | start |
| Ирина Соколова | Aikido and krav maga, punch and kick reversals | start |
| Кагэмару | Ninjutsu with a sword, teleport and meditation | start |
| Тони Вон | Wing chun, chain punches and a parry | start |
| Сомсак Чайчана | Muay Thai, knees, elbows and the clinch | start |
| Потапыч | Circus bear | 1st arcade clear |
| Лю Шэн | Drunken fist | 2nd clear or Force mode clear |
| Страж-7 | Soviet guard robot | 3rd clear |
| Чурбан | Wooden dummy that copies a style each round | 4th clear |
| Гэндзо Курогане | Kurogane kenpo, sub-boss | 5th clear |
| Колосс | Bronze guardian, boss | 6th clear |
| Пылающий Колосс | Burning second form with fire breath | 7th clear (after clearing with Colossus or 9 clears) |

Each fighter has 2 costumes from the start and all 4 after clearing Arcade with them. Endings of cleared fighters appear in the Theater.

## Modes

- **Arcade**: 8 tournament fighters, Genzo Kurogane, the Colossus and its burning form, with continues. The AI level rises along the ladder. A clear shows the fighter's ending and the credits and unlocks the next hidden fighter, new modes and costumes.
- **VS**: two players, stage select, running score, rematch.
- **Team Battle**: teams of 1–8 against another player or the CPU. The winner stays in with the health left.
- **Time Attack**: Arcade against the clock; the top 5 times go to Records.
- **Survival**: single rounds until the first loss, with 12% health back after each win.
- **Practice**: dummy modes (stand, crouch, jump, block all, random block, CPU with level, player 2), input log, damage, combo and frame advantage display, automatic health refill and a move drill that walks through the move list.
- **Kurogane Assault** (unlocked by the first Arcade clear): a side-scrolling brawler through four floors of the Kurogane tower with waves of guards, masked fighters and brutes, floor bosses, first aid kits, score and a time bonus. A clear unlocks Liu Sheng.
- **Beach Ball** (after two clears): hit the ball over the net with moves. Stronger moves charge the ball, and a ball that lands on your side or hits you deals damage.
- **Theater**: intro reel, endings and a music box.
- **Records** and **Options**: difficulty, rounds, round time, volumes, announcer, counter-hit text, camera shake, FPS counter, key binding and a progress reset.

Progress, records and options are saved in `localStorage` under `tekken3-98-save`.

## Module layout (`js/apps/tekken3/`)

| File | Owns |
| --- | --- |
| `tk-core.js` | Math, 3×3 rotations, easing, RNG, input bits, colors |
| `tk-skel.js` | Body proportions, pose model, two-bone IK solver, whole-body rotation |
| `tk-mesh.js` | Mesh builder and the low-poly fighter model (heads, hair, faces, clothing, attached parts) |
| `tk-gl.js` | WebGL program, buffers, textures, camera matrices |
| `tk-anim.js` | Stances and animation archetypes (punches, kicks, body moves, sword) that turn frame data into keyframes |
| `tk-cmd.js` | Command notation parser, input history, motion and just-frame matching |
| `tk-moves.js` | Universal move kit, throw scripts, move compiler |
| `tk-fight.js` | Fighter state machine, hit and block resolution, counter hits, juggles, throws, ground game, rounds |
| `tk-animator.js` | Maps fighter state to poses: blending, foot planting, hit reactions, lying, throws, win poses |
| `tk-ai.js` | CPU brain with reaction delay, low blocking, punishment, juggles, throw breaks, wake-up and difficulty levels |
| `tk-roster*.js` | The sixteen fighters (plus the Colossus second form) and their chain throws |
| `tk-render.js` | Scene: camera, fighters, shadows, hit sparks and particles |
| `tk-stages.js` | Seventeen stages with procedural floor, panorama and decal textures, props and weather |
| `tk-audio.js` | Synthesized effects, formant kiai voices, speech announcer and a procedural music sequencer |
| `tk-modes.js` | Save data, unlocks, Arcade/Time Attack/Survival ladders, team battle |
| `tk-ui.js` | Canvases, loop, keyboard and gamepad input, portraits, shared drawing |
| `tk-fightscr.js` | Fight screen: HUD, events, cameras, pause, move list, practice |
| `tk-screens.js` | Title, menus, character and stage select, VS, continue, results, options, keys, records, theater |
| `tk-cine.js` | Endings, intro reel and credits |
| `tk-force.js` | Kurogane Assault |
| `tk-ball.js` | Beach Ball |
| `tk-flow.js` | Mode flows that connect the screens |

## Authoring notes

- **Moves** are written with `mv(command, name, level, damage, startup, active, recovery, onBlock, onHit, options)`. The level is `h`, `m`, `sm`, `l`, `t` (throw), `u` (unblockable) or `x` (no hitbox). The hit effect is a frame advantage or `L` launch, `K` knockdown, `KF` face-down knockdown, `T` trip, `B` blowback, `C` crumple, `S` stagger, `D` double over or `SP` spin. Useful options: `a` (animation archetype such as `jab`, `upper:r`, `round:l`, `sweep:r`, `slash`), `r` reach, `w` width, `trk` tracking, `mv` step distance, `nx` chains, `ch` counter-hit effect, `fc`, `crouch`, `lc`/`hc` crush frames, `gr` ground hit, `jumpy`, `stance`, `parry`, `rev`, `tele`, `inv`, `heal`, `buff`, `fx`.
- **Commands** use Tekken notation: `df+2`, `f,f+2`, `d,df,f+1`, `f,n,d,df+2`, `~` for a just frame, and prefixes `ws`, `ss`, `run`, `air`, `down`, `bt` and `st:<stance>`.
- **Animations** are generated from the frame data, so the strike pose always lands on the first active frame. Hands are in chest space and feet in fighter space, and the IK solves elbows and knees.
- **Throws** are scripts with attacker poses, victim offsets and rotations, damage frames and camera shakes. The victim must end lying (body pitch ±π/2); the test checks this. Chain throws add `chain` entries with an input window and a break button.
- **Balance** was tuned with AI round robins. The test also checks that the hardest AI beats the easiest one.
