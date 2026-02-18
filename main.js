const Gameboard = (() => {
  let board = Array(9).fill(null);

  const getBoard = () => [...board];
  const getCell  = (i) => board[i];
  const setCell  = (i, mark) => {
    if (!board[i]) { board[i] = mark; return true; }
    return false;
  };
  const reset = () => { board = Array(9).fill(null); };

  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8], 
    [0,3,6],[1,4,7],[2,5,8], 
    [0,4,8],[2,4,6]          
  ];

  const checkWinner = () => {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    if (board.every(cell => cell !== null)) {
      return { winner: null, line: null, draw: true };
    }
    return null;
  };

  return { getBoard, getCell, setCell, reset, checkWinner };
})();


const createPlayer = (name, mark) => {
  let wins = 0;
  const getWins   = () => wins;
  const addWin    = () => wins++;
  const resetWins = () => { wins = 0; };
  return { name, mark, getWins, addWin, resetWins };
};


const GameController = (() => {
  let players = [];
  let currentIndex = 0;
  let gameOver = false;
  let vsAI = false;
  let aiLevel = 'hard'; 

  let onTurnResolved = null;
  let aiTimer = null;

  const setOnTurnResolved = (cb) => { onTurnResolved = cb; };
  const setAILevel = (level) => { aiLevel = level || 'hard'; };
  const isAITurn = () => vsAI && !gameOver && currentIndex === 1;

  const init = (p1Name, p2Name, aiMode = false) => {
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
    vsAI = aiMode;

    players = [
      createPlayer(p1Name || 'Jugador X', 'X'),
      createPlayer(p2Name || (vsAI ? 'CPU' : 'Jugador O'), 'O')
    ];
    currentIndex = 0;
    gameOver = false;
    Gameboard.reset();
  };

  const resetRound = () => {
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
    currentIndex = 0;
    gameOver = false;
    Gameboard.reset();
  };

  const getCurrentPlayer = () => players[currentIndex];
  const getPlayers       = () => players;
  const isGameOver       = () => gameOver;

  const getAvailableMoves = () =>
    Gameboard.getBoard()
      .map((v, i) => v === null ? i : null)
      .filter(v => v !== null);

  const findWinningMove = (mark) => {
    const board = Gameboard.getBoard();
    const combos = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (const [a,b,c] of combos) {
      const line = [board[a], board[b], board[c]];
      if (line.filter(v => v === mark).length === 2 && line.includes(null)) {
        return [a,b,c][line.indexOf(null)];
      }
    }
    return null;
  };

  const checkWinnerOnBoard = (b) => {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const [a,b1,c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    return b.every(cell => cell !== null) ? 'draw' : null;
  };

  const availableMovesOnBoard = (b) =>
    b.map((v, i) => (v === null ? i : null)).filter(v => v !== null);

  const minimax = (b, isMax, aiMark, humanMark, depth, alpha, beta) => {
    const result = checkWinnerOnBoard(b);
    if (result === aiMark) return 10 - depth;
    if (result === humanMark) return depth - 10;
    if (result === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (const move of availableMovesOnBoard(b)) {
        b[move] = aiMark;
        best = Math.max(best, minimax(b, false, aiMark, humanMark, depth + 1, alpha, beta));
        b[move] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const move of availableMovesOnBoard(b)) {
        b[move] = humanMark;
        best = Math.min(best, minimax(b, true, aiMark, humanMark, depth + 1, alpha, beta));
        b[move] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  };

  const bestMoveMinimax = (aiMark, humanMark) => {
    const b = Gameboard.getBoard();
    let bestScore = -Infinity;
    let bestMove = null;

    for (const move of availableMovesOnBoard(b)) {
      b[move] = aiMark;
      const score = minimax(b, false, aiMark, humanMark, 0, -Infinity, Infinity);
      b[move] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  };

  const aiMove = () => {
    aiTimer = null;
    if (gameOver || !vsAI || currentIndex !== 1) return;

    const ai = players[1].mark;
    const human = players[0].mark;
    const board = Gameboard.getBoard();
    let move = null;

    if (aiLevel === 'easy') {
      const moves = getAvailableMoves();
      move = moves[Math.floor(Math.random() * moves.length)];
    } else if (aiLevel === 'medium') {
      if (Math.random() < 0.7) move = bestMoveMinimax(ai, human);
      else {
        const moves = getAvailableMoves();
        move = moves[Math.floor(Math.random() * moves.length)];
      }
    } else {
      move = bestMoveMinimax(ai, human);
    }

    playTurn(move);
  };

  const playTurn = (index) => {
    if (gameOver) return null;
    const player = getCurrentPlayer();

    if (!Gameboard.setCell(index, player.mark)) return null;

    let payload;
    const result = Gameboard.checkWinner();

    if (result) {
      gameOver = true;
      if (result.winner) player.addWin();
      payload = { ...result, player };
    } else {
      currentIndex = 1 - currentIndex;
      payload = { player, next: getCurrentPlayer() };

      if (vsAI && currentIndex === 1) {
        aiTimer = setTimeout(aiMove, 350);
      }
    }

    if (onTurnResolved) onTurnResolved(payload);
    return payload;
  };

  return {
    init,
    resetRound,
    getCurrentPlayer,
    getPlayers,
    isGameOver,
    isAITurn,
    setOnTurnResolved,
    setAILevel,
    playTurn
  };
})();



const DisplayController = (() => {
  const setupScreen = document.getElementById('setup-screen');
  const gameScreen  = document.getElementById('game-screen');
  const cells       = document.querySelectorAll('.cell');
  const statusEl    = document.getElementById('status');
  const scoreX      = document.getElementById('score-x');
  const scoreO      = document.getElementById('score-o');
  const labelX      = document.getElementById('label-x');
  const labelO      = document.getElementById('label-o');
  const cardX       = document.getElementById('card-x');
  const cardO       = document.getElementById('card-o');
  const startBtn    = document.getElementById('start-btn');
  const newRoundBtn = document.getElementById('new-round-btn');
  const newGameBtn  = document.getElementById('new-game-btn');
  const aiToggle = document.getElementById('ai-toggle');

  const renderBoard = () => {
    const board = Gameboard.getBoard();
    cells.forEach((cell, i) => {
      const mark = board[i];
      if (mark) {
        cell.innerHTML = `<span class="mark">${mark === 'X' ? '✕' : '○'}</span>`;
        cell.classList.add('taken', mark.toLowerCase());
      } else {
        cell.innerHTML = '';
        cell.className = 'cell';
      }
    });
  };

  const setStatus = (msg, cls = '') => {
    statusEl.textContent = msg;
    statusEl.className = cls;
  };

  const updateScores = () => {
    const [p1, p2] = GameController.getPlayers();
    scoreX.textContent = p1.getWins();
    scoreO.textContent = p2.getWins();
  };

  const highlightWinLine = (line, mark) => {
    line.forEach(i => cells[i].classList.add('winning', mark.toLowerCase()));
  };

  const setActivePlayer = (mark) => {
    if (mark === 'X') {
      cardX.classList.add('active-player');
      cardO.classList.remove('active-player');
    } else {
      cardO.classList.add('active-player');
      cardX.classList.remove('active-player');
    }
  };

  startBtn.addEventListener('click', async () => {
    await unlockAudio();

    const n1 = document.getElementById('name-x').value.trim();
    const n2 = document.getElementById('name-o').value.trim();

    const level = document.getElementById('ai-level')?.value || 'hard';
    GameController.setAILevel(level);

    GameController.init(n1, n2, aiToggle?.checked);

    const [p1, p2] = GameController.getPlayers();
    labelX.textContent = p1.name;
    labelO.textContent = p2.name;
    updateScores();
    renderBoard();
    setStatus(`Turno de ${p1.name} (✕)`);
    setActivePlayer('X');

    setupScreen.style.display = 'none';
    gameScreen.style.display  = 'flex';
  });

  const handleTurnResult = (result) => {
    if (!result) return;

    renderBoard();
    updateScores();

    if (result.winner) {
      highlightWinLine(result.line, result.winner);
      setStatus(`¡${result.player.name} win the round!`, `win-${result.winner.toLowerCase()}`);
      cardX.classList.remove('active-player');
      cardO.classList.remove('active-player');

      beep(880, 0.08);
      setTimeout(() => beep(660, 0.12), 90);
      setTimeout(() => beep(990, 0.14), 200);
    } else if (result.draw) {
      setStatus('Draw! Try again...', 'draw');
      cardX.classList.remove('active-player');
      cardO.classList.remove('active-player');

      beep(300, 0.15);
    } else {
      const next = result.next;
      const sym  = next.mark === 'X' ? '✕' : '○';
      setStatus(`Turno de ${next.name} (${sym})`);
      setActivePlayer(next.mark);

      beep(result.player.mark === 'X' ? 540 : 420, 0.05);
    }
  };

  GameController.setOnTurnResolved(handleTurnResult);

  cells.forEach(cell => {
    cell.addEventListener('click', async () => {
      await unlockAudio();

      if (GameController.isGameOver()) return;
      if (GameController.isAITurn()) return;

      const index = Number(cell.dataset.index);
      GameController.playTurn(index);
    });
  });

  newRoundBtn.addEventListener('click', () => {
    GameController.resetRound();
    renderBoard();
    const cur = GameController.getCurrentPlayer();
    setStatus(`Turno de ${cur.name} (${cur.mark === 'X' ? '✕' : '○'})`);
    setActivePlayer(cur.mark);
  });

  newGameBtn.addEventListener('click', () => {
    GameController.resetRound(); 
    gameScreen.style.display  = 'none';
    setupScreen.style.display = 'flex';
    document.getElementById('name-x').value = '';
    document.getElementById('name-o').value = '';
  });
})();

const ThemeController = (() => {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const STORAGE = "ttt-theme";
  const body = document.body;

  const applySaved = () => {
    const saved = localStorage.getItem(STORAGE);
    if (saved === "retro") {
      body.classList.add("retro-mode");
      btn.textContent = "Modern mode";
    }
  };

  const toggle = () => {
    body.classList.toggle("retro-mode");
    const retro = body.classList.contains("retro-mode");

    btn.textContent = retro ? "Modern mode" : "Retro Mode";
    localStorage.setItem(STORAGE, retro ? "retro" : "modern");
  };

  btn.addEventListener("click", toggle);
  applySaved();
})();

let soundEnabled = true;
let audioCtx = null;

const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

async function unlockAudio() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch (_) {}
  }
}

function beep(freq = 440, duration = 0.1) {
  if (!soundEnabled) return;

  const ctx = getAudioCtx();
  if (ctx.state !== "running") return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}
