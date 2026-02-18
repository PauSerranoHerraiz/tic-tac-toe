# Tic Tac Toe (The Odin Project)

A **Tic Tac Toe** game built with **HTML, CSS, and JavaScript**, playable in 2-player mode or against a CPU.

## ✨ Features

- Classic 3x3 board.
- **Player vs Player** mode.
- **Player vs CPU** mode.
- AI difficulty levels:
  - `easy` (random)
  - `medium` (mixed strategy)
  - `hard` (minimax + alpha-beta pruning)
- Round-based scoreboard.
- Action buttons:
  - **New Round**
  - **New Game**
- Sound effects using `Web Audio API`.
- Visual themes:
  - modern mode
  - **retro mode** (saved in `localStorage`).

## 🧠 CPU AI

The CPU behavior depends on selected difficulty:

- **Easy**: picks random available moves.
- **Medium**: combines optimal and random moves.
- **Hard**: uses **Minimax** with **alpha-beta pruning** (very hard to beat).

## 🖥️ Tech Stack

- HTML5
- CSS3
- JavaScript
- Web Audio API

## 📁 Project Structure

- `index.html` → UI structure.
- `style.css` → styling (modern + retro).
- `main.js` → game logic, AI, UI controller, theme, and audio.



## 🎮 How to Play

1. Enter player names for X and O (optional).
2. Enable **Play against CPU** to play vs AI.
3. Select AI difficulty in **AI Difficulty**.
4. Click **START**.
5. First to align 3 marks (row, column, or diagonal) wins.

## 🔊 Audio

The game plays sounds on moves and round results.  
Audio is unlocked after user interaction (click/tap), as required by browsers.

## 📌 Current Status

Fully playable and functional.  
Good practice project for:

- DOM manipulation
- modular JavaScript architecture
- game logic + beginner/advanced AI concepts

---

Built as part of **The Odin Project**.