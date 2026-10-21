# Пепельный Тракт '98 (www.ashroad98.ru)

Браузерная MMO внутри IE: застава «Старый Брод», 12 секторов тракта до Старой Колокольни, Круг Поединков, кузница и чат. Октябрь 1998 года.

## Pillars

1. **Read the foe.** Every round is a guess with partial information, not a solved puzzle.
2. **Carry or bank.** The road is a run: the bag grows faster the longer you carry it, and a death costs half of it.
3. **The outpost remembers.** Chat, Chronicle, ladder and commission row react to what the player did.

Target aesthetics: challenge (reading), discovery (fogged map, shortcuts), fellowship (fake server crowd).

## Verbs

- In a fight: pick a strike zone, a guard zone and a stance (Выпад, Размах, Финт, Передышка).
- On the road: move, fight, open a shortcut, camp, send the courier, go home.
- At the outpost: take and claim contracts, repair, temper, smelt, buy, list a lot, challenge a rival, talk.

## Loops

- **Round (seconds).** Observation shows the tell. With a successful read (Глазомер) you see the true stance, the target zone and the guard. Without it you see two possible zones, and a feint looks like the stance it imitates. Rivals in the Ring hide their stance entirely until read. No torch on the road means no tell at all.
- **Fight (minutes).** Breath is the shared resource. Foes also spend breath and rest when they run out, so torso hits (-12 breath) and leg hits (dearer cleave) matter. A head hit stuns: the stunned foe is read for sure, a stunned player reads nothing.
- **Expedition (session).** Leaving the gate starts an expedition. A sector with a foe blocks the way forward until cleared, and cleared sectors stay quiet until you return. Each road win raises the heat (+15% loot, up to x1.75). Campfires heal once per expedition. Bank at the gate for free or by courier at a campfire for 15%. Death halves the bag and ends the expedition.
- **Meta.** Levels and stat points, tempering (+1..+5, cost x1.35 each), two permanent shortcuts that shorten every later expedition, Ring rating by expectation (K=32), seven contracts, order influence, the boss.

## Combat rules

| Stance | Breath | Damage | Beats |
|---|---|---|---|
| Выпад | -10 (dragoon -7) | x1.0 | Размах: +30% and the cleave lands at x0.6 |
| Размах | -25 (+4 in narrow sectors, +10 after a leg wound) | x1.45 | goes through a guard at x0.75 |
| Финт | -15 | x0.9 | a guarded zone: bypass and steal 8 breath (scribe 12) |
| Передышка | +30 | x0.4 | guards the chosen zone and the torso, smothers a thrust (x0.2) |

A plain guard lets 35% through (25% in sheltered sectors, dragoon thrust 48%). Armor subtracts 0.65 per point. Crit chance comes from Focus and items: x1.5, ignores armor. Both sides regain 4 breath per round. On the belfry every third round the bell hits an unguarded head for 9.

Rivals: `reads: 1` guards the zone you hit twice in a row; `reads: 2` also answers your last stance (thrust after your cleave, rest after two thrusts).

## Economy

- Faucets: road wins (enemy groshi x heat, guard +15%), contracts (one-time), Ring wins (the rival's stake), smelting, commission sales.
- Sinks: Ring stakes, repairs, tempering, shop, courier fee, death on the road, order change (1 token).
- Tokens only come from contracts, the first boss kill and Ring wins over an equal or stronger rival.
- Commission lots sell when the player returns from an expedition. NPC lots restock from `COMMISSION_POOL`.

## Balance check

Simulated 200 fights per cell (reader = follows only what the observation shows; mindless = always thrust torso, guard torso), gear one tier below level:

- Road: reader wins 97-100% and loses 30-60% HP per fight; mindless wins 0-35% from the looter on.
- Boss at level 4: reader 81-100%, mindless about 10%.
- Ring without salves: reader 68-96%, mindless 0-53% (Вован is the beginner).

The test `balance: reading the foe beats a mindless routine` keeps this from regressing.

## Pages

Each page has its own form: iron pass and ledger (`/gate`), clickable outpost plan, notice board of paper slips and a three-pane chat (`/square`), fogged ink map with verst post and signboard exits (`/road`), duel with clickable body diagrams (`/fight`), challenge listing (`/arena`), anvil, chalk price board and classifieds (`/smith`), personal file with a bag grid (`/hero`), newspaper (`/chronicle`). Only 216 web-safe colours.

## Out of scope

Real multiplayer, PvP against other players' saves, crafting recipes, more regions beyond the belfry, timers based on real time.

## Files

`js/apps/ashroad-data.js` (content), `js/apps/ashroad-game.js` (rules and state, `window.ashroadGame`), `js/apps/ashroad-site.js` (pages and events), `css/apps/ashroad-site.css` (`ar-*`), `tests/ashroad-site.test.js`. Save key `win98_ashroad98_state_v2`; a v1 save migrates once.
