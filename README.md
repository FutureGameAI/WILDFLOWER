# 🌸 WILDFLOWER

> *The sky-garden sleeps. The Rain Engine is silent. Only one gardener remains.*

**WILDFLOWER** is a hand-crafted **2D platformer** about **Iris**, the last gardener of a floating world above the clouds. Journey through **15 levels**, collect **Heart Petals**, master **four mystical powers**, face the **Blight**, and bring back the rain.

<p align="center">
  <a href="https://futuregameai.github.io/WILDFLOWER/"><strong>▶ Play Now — Free in Browser</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/levels-15-ffb7d5?style=for-the-badge" alt="15 levels" />
  <img src="https://img.shields.io/badge/playtime-~15--20_min-88ccaa?style=for-the-badge" alt="playtime" />
  <img src="https://img.shields.io/badge/platform-Web_+_Mobile-667788?style=for-the-badge" alt="platform" />
  <img src="https://img.shields.io/badge/build-none-ffd700?style=for-the-badge" alt="no build" />
</p>

---

## ✨ Why play?

| | |
|---|---|
| 🎮 **Pure platforming** | Tight controls, checkpoints, combo scoring, and a fair **5-heart run** across the whole adventure |
| 🗺️ **15 unique levels** | From sunlit atriums to dark root caves, storm spires, and a final boss |
| 🎵 **Original soundtrack** | Procedural chiptune — a unique track per level, built with Web Audio |
| 🌧️ **A story worth finishing** | Dialogue, level map, unlock moments, and a rain ending cinematic |
| 📱 **Play anywhere** | Desktop keyboard + **mobile touch controls** — no install, no app store |

---

## 🕹️ Controls

### Desktop

| Action | Keys |
|--------|------|
| Move | `A` / `D` or `←` / `→` |
| Jump | `W` or `↑` |
| Float | Hold `Space` in air *(after unlock)* |
| Ability | `F` or left click |
| Pause | `Escape` · toggle SFX `N` · toggle Music `M` |
| Help | Click **?** on the HUD |

### Mobile & tablet

On phones and tablets, **on-screen buttons** appear automatically:

| Button | Action |
|--------|--------|
| ◀ ▶ | Move left / right |
| ↑ | Jump |
| **FLOAT** | Hold to float *(after unlock)* |
| ✦ | Use ability |
| ⏸ | Pause |

> **Tip:** Rotate to landscape for the best view. Tap the top of the screen to interact with dialogs and the **?** help button.

---

## 🌺 Powers & collectibles

Unlock abilities as you explore:

1. **Petal Float** — rise across gaps  
2. **Blossom Dash** — burst forward in mid-air  
3. **Glow Spore** — light dark caves and burn vines  
4. **Seed Burst** — shatter crystal walls  

Collect glowing orbs for points:

| Orb | Points |
|-----|--------|
| * Pollen | +30 |
| $ Dew Gem | +80 |
| G Sun Seed | +200 |

Chain pickups for **combo bonuses**. Golden **SAVE** flags are checkpoints — lose a heart and respawn there. Lose all **5 hearts** and the run restarts from Level 1.

---

## 🗺️ The journey (15 levels)

| # | Level | Region |
|---|-------|--------|
| 1 | Awakening | Atrium |
| 2 | Sunlit Bridge | Atrium |
| 3 | Hanging Gardens | Atrium |
| 4 | Glass Greenhouse | Greenhouse |
| 5 | Wind Corridor | Greenhouse |
| 6 | Mushroom Undergarden | Undergarden |
| 7 | Root Depths | Undergarden *(dark)* |
| 8 | Storm Spire | Storm |
| 9 | Blight Gate | Engine |
| 10 | Cloud Ruins | Atrium |
| 11 | Jade Canopy | Greenhouse |
| 12 | Spore Catacombs | Undergarden *(dark)* |
| 13 | Thunder Walk | Storm |
| 14 | Corruption Maze | Engine |
| 15 | **The Blight** | Engine *(boss)* |

Each level has its own music, enemies, and story beat. A **journey map** appears when you enter a new stage.

---

## 🚀 Play online

**Live demo:** [https://futuregameai.github.io/WILDFLOWER/](https://futuregameai.github.io/WILDFLOWER/)

Works in Chrome, Firefox, Safari, and mobile browsers. **Tap once** to enable sound.

---

## 💻 Run locally

No build step. Pure HTML + JavaScript modules.

```bash
git clone https://github.com/FutureGameAI/WILDFLOWER.git
cd WILDFLOWER
python3 -m http.server 8080
```

Open **http://localhost:8080** — use **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows) for a hard refresh.

---

## 📦 Deploy to GitHub Pages

This repo includes `.github/workflows/pages.yml`.

1. Push to `main`
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Wait ~1 minute — your game is live

---

## 🏆 Leaderboard (optional)

Scores save locally by default. For a **global leaderboard**, create a free [Supabase](https://supabase.com) project and add your credentials to `js/config.js`:

```js
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key';
```

---

## 🛠️ Project structure

```
index.html              Entry point + mobile touch UI
css/style.css           Layout, responsive scaling, touch buttons
js/
  main.js               Bootstrap, resize, touch init
  game.js               Game loop, states, scoring
  levels.js             15 hand-crafted level maps
  player.js             Iris — movement, combat, camera
  world.js              Tiles, enemies, collision
  render.js             Sky, HUD, level map, effects
  touch.js              Mobile on-screen controls
  audio.js              SFX + 15 level music tracks
  input.js              Keyboard + touch input
  save.js               localStorage progress
  leaderboard.js        Local / Supabase scores
.github/workflows/      GitHub Pages deploy
```

**Stack:** Vanilla JavaScript · Canvas 2D · Web Audio API · localStorage  
**License:** Open source — play, fork, and share freely.

---

## 🌧️ About

*WILDFLOWER* was built as a love letter to classic platformers — glowing skies, gentle difficulty curves, and a hopeful ending. Whether you have fifteen minutes on a lunch break or a quiet evening on your phone, the garden is waiting.

<p align="center"><strong>Bring back the rain. 🌸</strong></p>

<p align="center">
  Made with care by <a href="https://github.com/FutureGameAI">FutureGameAI</a>
</p>
