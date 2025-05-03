// Word Match Game Logic, grid: 4 cols (2 English, 2 Chinese), 12 pairs per set, accuracy tracking, level progression

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const controlsSection = document.getElementById("controls");
const gameSection = document.getElementById("game");
const levelTitle = document.getElementById("level-title");
const progressBar = document.getElementById("progress-bar");
const matchBoard = document.getElementById("match-board");
const resultPopup = document.getElementById("result-popup");
const accuracySpan = document.getElementById("accuracy");
const scoreSpan = document.getElementById("score");
const setProgressSpan = document.getElementById("set-progress");

let currentLevelIdx = 0;
let currentSetIdx = 0;
let currentPairs = [];
let correct = 0, attempts = 0, score = 0;
let matchedPairs = 0;
let selectedEn = null, selectedZh = null;
let enCards = [], zhCards = [];
let busy = false;

async function startGame() {
  await loadAllWordSets();
  currentLevelIdx = 0;
  currentSetIdx = 0;
  score = 0;
  showGameUI();
  loadCurrentSet();
}

function showGameUI() {
  controlsSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  resultPopup.classList.add("hidden");
}

function loadCurrentSet() {
  correct = 0;
  attempts = 0;
  matchedPairs = 0;
  selectedEn = null;
  selectedZh = null;
  enCards = [];
  zhCards = [];
  busy = false;

  const level = WORD_LEVELS[currentLevelIdx];
  const set = getWordSet(level, currentSetIdx);
  // 生成英文和中文两个独立乱序数组（但配对通过index对应）
  let enArr = set.map(pair => pair.english);
  let zhArr = set.map(pair => pair.chinese);
  enArr = shuffle(enArr);
  zhArr = shuffle(zhArr);

  // 记录当前所有pair
  currentPairs = [];
  for (let i = 0; i < set.length; i++) {
    currentPairs.push({ english: set[i].english, chinese: set[i].chinese });
  }

  renderGrid(enArr, zhArr);
  updateStats();
  updateLevelTitle();
  updateProgressBar();
}

function renderGrid(enArr, zhArr) {
  matchBoard.innerHTML = "";
  enCards = [];
  zhCards = [];
  // 2列英文, 2列中文，共4列，12行（每列6个）
  let grid = [];
  for (let i = 0; i < 6; i++) {
    grid.push([
      { type: "en", text: enArr[i], idx: i },
      { type: "en", text: enArr[i + 6], idx: i + 6 },
      { type: "zh", text: zhArr[i], idx: i },
      { type: "zh", text: zhArr[i + 6], idx: i + 6 }
    ]);
  }
  // 组装到matchBoard
  // 先flatten为24格
  let flat = [];
  for (let i = 0; i < grid.length; i++) {
    flat.push(grid[i][0], grid[i][1], grid[i][2], grid[i][3]);
  }
  flat.forEach((cell, idx) => {
    const div = document.createElement("div");
    div.className = "word-card";
    div.textContent = cell.text;
    div.dataset.type = cell.type;
    div.dataset.index = cell.idx;
    div.tabIndex = 0;
    div.addEventListener("click", () => onCardClick(cell.type, cell.idx, div));
    if (cell.type === "en") enCards[cell.idx] = div;
    else zhCards[cell.idx] = div;
    matchBoard.appendChild(div);
  });
}

function onCardClick(type, idx, div) {
  if (busy) return;
  if (div.classList.contains("matched")) return;
  if (type === "en") {
    if (selectedEn && selectedEn !== div) selectedEn.classList.remove("selected");
    selectedEn = div;
    div.classList.add("selected");
  } else {
    if (selectedZh && selectedZh !== div) selectedZh.classList.remove("selected");
    selectedZh = div;
    div.classList.add("selected");
  }
  if (selectedEn && selectedZh) {
    checkMatch();
  }
}

function checkMatch() {
  busy = true;
  const enWord = selectedEn.textContent;
  const zhWord = selectedZh.textContent;
  attempts++;
  // 检查是否为一对
  let isMatch = false;
  for (const pair of currentPairs) {
    if (pair.english === enWord && pair.chinese === zhWord) {
      isMatch = true;
      break;
    }
  }
  if (isMatch) {
    selectedEn.classList.add("matched");
    selectedZh.classList.add("matched");
    selectedEn.classList.remove("selected");
    selectedZh.classList.remove("selected");
    matchedPairs++;
    correct++;
    score += 2;
    selectedEn = null;
    selectedZh = null;
    updateStats();
    busy = false;
    if (matchedPairs === 12) {
      setTimeout(() => {
        nextSetOrLevel();
      }, 700);
    }
  } else {
    selectedEn.classList.add("wrong");
    selectedZh.classList.add("wrong");
    score -= 1;
    updateStats();
    setTimeout(() => {
      selectedEn.classList.remove("selected", "wrong");
      selectedZh.classList.remove("selected", "wrong");
      selectedEn = null;
      selectedZh = null;
      busy = false;
    }, 650);
  }
}

function updateStats() {
  let acc = attempts === 0 ? 100 : Math.round((correct / attempts) * 100);
  accuracySpan.textContent = `Accuracy: ${acc}%`;
  scoreSpan.textContent = `Score: ${score}`;
  const level = WORD_LEVELS[currentLevelIdx];
  setProgressSpan.textContent = `Set: ${currentSetIdx + 1}/${getLevelCount(level)} (${level.charAt(0).toUpperCase() + level.slice(1)})`;
}

function updateLevelTitle() {
  const level = WORD_LEVELS[currentLevelIdx];
  let cn = level === "easy" ? "简单" : level === "medium" ? "中等" : "困难";
  levelTitle.textContent = `Level: ${level.charAt(0).toUpperCase() + level.slice(1)} (${cn})`;
}

function updateProgressBar() {
  const level = WORD_LEVELS[currentLevelIdx];
  const total = getLevelCount(level);
  const percent = ((currentSetIdx + 1) / total) * 100;
  progressBar.innerHTML = `<div class="bar" style="width:${percent}%;"></div>`;
}

function nextSetOrLevel() {
  currentSetIdx++;
  const level = WORD_LEVELS[currentLevelIdx];
  if (currentSetIdx < getLevelCount(level)) {
    loadCurrentSet();
  } else {
    // 进入下一个难度
    if (currentLevelIdx < WORD_LEVELS.length - 1) {
      currentLevelIdx++;
      currentSetIdx = 0;
      loadCurrentSet();
    } else {
      // 游戏全部完成
      showFinalResult();
    }
  }
}

function showFinalResult() {
  gameSection.classList.add("hidden");
  resultPopup.innerHTML =
    `<b>🎉 Congratulations!</b><br>
    You have completed all levels.<br>
    <b>Final Score:</b> ${score}<br>
    <b>Keep practicing to improve your vocabulary!<br><br></b>
    <button id="play-again-btn">Play Again</button>`;
  resultPopup.classList.remove("hidden");
  document.getElementById("play-again-btn").onclick = restartGame;
}

function restartGame() {
  resultPopup.classList.add("hidden");
  controlsSection.classList.remove("hidden");
  gameSection.classList.add("hidden");
  score = 0;
}

// Fisher-Yates
function shuffle(arr) {
  let a = arr.slice();
  for(let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Event Listeners ---
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
// Optional: allow pressing Enter to start game
document.addEventListener("keydown", (e) => {
  if (controlsSection && !controlsSection.classList.contains("hidden")) {
    if (e.key === "Enter") startGame();
  }
});

