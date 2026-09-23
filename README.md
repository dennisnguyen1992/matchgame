# ⚔️ Math Adventure Quest

A multiplayer educational adventure game built for the [AirConsole](https://www.airconsole.com) platform. Children aged 5–11 explore themed worlds and battle monsters by solving math challenges on their smartphones.

---

## 📁 Project Structure

```
MatchGame/
├── screen/                    ← TV / PC screen app
│   ├── index.html             ← Main screen HTML entry point
│   ├── game.js                ← Game state machine & core logic
│   ├── world.js               ← World data + canvas map renderer
│   ├── multiplayer.js         ← AirConsole SDK wrapper
│   ├── ui.js                  ← DOM UI management
│   ├── question-engine.js     ← Math question generator (all 6 worlds)
│   └── assets/css/style.css  ← Full game styles
│
├── controller/                ← Smartphone controller app
│   ├── index.html             ← Controller HTML
│   └── controller.js          ← Controller logic
│
└── README.md
```

---

## 🎮 Gameplay Overview

### Core Loop
1. Players join by scanning the AirConsole QR code on their phones
2. Each player chooses a character and sets a nickname
3. Host selects a world (1–6, themed by math difficulty)
4. Every round, all players see the same math question on their phone
5. **First correct answer** → advance 2 spaces on the map, earn 100 pts + 10 coins
6. **Later correct answers** → advance 1 space, earn 75/50/25 pts
7. **Wrong answer** → lose 10 HP
8. First player to reach position 20 (the Treasure) **wins**!

---

## 🌍 The 6 Worlds

| # | World | Skills | Theme |
|---|-------|--------|-------|
| 1 | Kindergarten Explorer | Counting, Basic Addition | Magical Forest |
| 2 | Pirate Island | Add/Sub up to 20 | Pirate Adventure |
| 3 | Jungle Expedition | Add/Sub up to 100, Multiplication | Jungle Temple |
| 4 | Ancient Temple | Multiply, Divide, Geometry | Indiana Jones |
| 5 | Lost Civilization | Fractions, Area, Perimeter | Ancient Kingdom |
| 6 | Space Academy | Decimals, Ratios, Word Problems | Sci-Fi Galaxy |

---

## 🦸 Characters

| Character | Emoji | Perk |
|-----------|-------|------|
| Explorer Boy | 🧒 | Balanced — great all-rounder |
| Explorer Girl | 👧 | Fast answers earn bonus XP |
| RoboMath | 🤖 | High accuracy bonuses |
| Astro Cat | 🐱 | Lucky bonus coins on treasure squares |

---

## 🏆 Map Layout

The world map has **21 positions** (0 = Start → 20 = Treasure) in a snake pattern:

- **Normal squares** (⭐) — math challenge, regular rewards
- **Chest squares** (varies by world) — bonus coins on correct answer
- **Monster squares** (varies by world) — HP penalty on wrong answer
- **Boss squares** (positions 10 & 18) — harder encounter, bigger reward
- **Treasure** (position 20) — first to reach this wins!

---

## 🤖 Bot System

If fewer than 2 human players connect, the game automatically adds AI bots:
- **Easy**: ~55% accuracy
- **Medium**: ~78% accuracy
- **Hard**: ~95% accuracy

Bots answer within a random delay (2–12 seconds) to feel natural.

---

## 📱 Controller Screens

1. **Loading** — connecting spinner
2. **Lobby** — set nickname, choose character, ready button
3. **Character Select** — 4 character cards
4. **Playing** — live HP, score, coins, position stats
5. **Question** — large A/B/C/D answer buttons (20s timer)
6. **Feedback** — ✅ Correct / ❌ Wrong with explanation
7. **Game Over** — rank, stats, full scoreboard

---

## 📺 Screen Displays

1. **Lobby** — 4 player slots with QR join info
2. **World Select** — 6 world cards to choose from
3. **Game Map** — canvas-rendered adventure map with player tokens
4. **Question** — large question + 4 answer options + timer bar
5. **Round Result** — ranked results with points earned
6. **Game Over** — winner announcement + full scoreboard

---

## 🛠️ Technical Stack

| Technology | Usage |
|-----------|-------|
| HTML5 Canvas | World map rendering (60fps via requestAnimationFrame) |
| CSS3 | Animations, gradients, responsive layouts |
| Vanilla ES6+ JS | All game logic, no frameworks |
| AirConsole SDK 1.8.0 | Multiplayer, QR join, device messaging |

---

## 🚀 Setup & Local Testing

### AirConsole Simulator

1. Open [https://www.airconsole.com/simulator](https://www.airconsole.com/simulator)
2. Load `screen/index.html` as the **Screen URL**
3. Load `controller/index.html` as the **Controller URL**
4. The simulator provides virtual phone controllers for testing

### Local HTTP Server

AirConsole requires files served over HTTP (not `file://`):

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code: Use the "Live Server" extension
```

Then in the AirConsole Simulator, use:
- Screen: `http://localhost:8080/screen/`
- Controller: `http://localhost:8080/controller/`

---

## 🌐 AirConsole Publishing

1. Create a developer account at [developers.airconsole.com](https://developers.airconsole.com)
2. Upload your game files to a public HTTPS host (Netlify, GitHub Pages, etc.)
3. Register your game with:
   - **Screen URL**: `https://yourdomain.com/screen/`
   - **Controller URL**: `https://yourdomain.com/controller/`
4. Set min/max players to 2/4
5. Submit for review

### Netlify (Recommended)

```bash
# Drag & drop the MatchGame/ folder at app.netlify.com/drop
# Or use Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

---

## 🎵 Audio

The game includes built-in Web Audio effects in `sound.js`, plus low-volume looping music for each world. Music uses the free SoundHelix example tracks (`soundhelix.com`) and starts after the first screen interaction to comply with browser autoplay rules. The question timer plays a tick each second and adds a faster warning tick during the final five seconds.

---

## 📬 AirConsole Message Protocol

### Screen → Controller

| Type | Payload | Description |
|------|---------|-------------|
| `player_assigned` | `{ playerId, isHost, player, gameState }` | Initial assignment |
| `lobby_update` | `{ players }` | Player list changed |
| `game_start` | `{ worldId, worldName, players }` | Game launched |
| `question` | `{ data, round }` | New question |
| `answer_feedback` | `{ correct, correctAnswer }` | After player answers |
| `round_result` | `{ correctAnswer, results, players }` | Round ended |
| `player_update` | `{ player }` | Stats changed |
| `level_up` | `{ level }` | Player leveled up |
| `game_over` | `{ winnerId, scoreboard }` | Game complete |
| `reset` | `{ state }` | Return to lobby |

### Controller → Screen

| Type | Payload | Description |
|------|---------|-------------|
| `select_character` | `{ character }` | Character chosen |
| `set_nickname` | `{ nickname }` | Name set |
| `ready` | — | Player is ready |
| `start_game` | — | Host starts (player 1 only) |
| `answer` | `{ value, timestamp }` | Answer submitted |
| `request_sync` | — | Re-sync game state |

---

## 🔮 Future Expansion Ideas

- **6 more worlds** (Dinosaur Era, Medieval Castle, Underwater Kingdom...)
- **Achievement system** with badges and titles
- **Character skins** unlocked via coins
- **Daily Challenge** mode (AirConsole scheduled events)
- **Teacher Mode** — custom question banks for classrooms
- **Co-op mode** — 2v2 team challenges
- **Leaderboard** integration via AirConsole persistent data
- **Sound effects & BGM** (Howler.js integration ready)
- **Animated cutscenes** between worlds (GSAP integration)
- **Accessibility mode** — larger text, high contrast options
