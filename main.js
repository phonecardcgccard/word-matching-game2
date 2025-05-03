// Word Match Game Logic

const englishList = document.getElementById("english-list");
const chineseList = document.getElementById("chinese-list");
const scoreSpan = document.getElementById("score");
const timerSpan = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const difficultySelect = document.getElementById("difficulty");
const gameSection = document.getElementById("game");
const controlsSection = document.getElementById("controls");
const resultPopup = document.getElementById("result-popup");

let gameWords = [];
let pairs = [];
let matchedPairs = 0;
let score = 0;
let timer = 0;
let timerId = null;

let selectedEnIdx = null;
let selectedZhIdx = null;

// --- Utility functions ---
function shuffle(arr) {
  // Fisher-Yates shuffle
  let a = arr.slice();
  for(let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  arr = shuffle(arr);
  return arr.slice(0, n);
}

// --- Game logic ---
function startGame() {
  // Reset state
  matchedPairs = 0;
  score = 0;
  timer = 0;
  selectedEnIdx = null;
  selectedZhIdx = null;
  clearInterval(timerId);
  updateScore();
  updateTimer();

  // Select word pairs by difficulty
  const level = difficultySelect.value;
  const wordPool = WORDS.filter(w => w.level === level);

  // Set how many pairs per difficulty
  let pairCount = 6;
  if (level === "easy") pairCount = 6;
  if (level === "medium") pairCount = 8;
  if (level === "hard") pairCount = 10;
  pairs = pickRandom(wordPool, Math.min(pairCount, wordPool.length));
  gameWords = pairs.map(w => ({ ...w }));

  // Shuffle English and Chinese separately
  const enArr = shuffle(gameWords.map(w => w.en));
  const zhArr = shuffle(gameWords.map(w => w.zh));

  // Render lists
  renderList(englishList, enArr, "en");
  renderList(chineseList, zhArr, "zh");

  // Show game, hide controls
  controlsSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  resultPopup.classList.add("hidden");

  // Start timer
  timerId = setInterval(() => {
    timer += 1;
    updateTimer();
  }, 1000);
}

function renderList(elem, arr, type) {
  elem.innerHTML = "";
  arr.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.dataset.index = idx;
    li.addEventListener("click", () => onWordClick(type, idx, li));
    elem.appendChild(li);
  });
}

function onWordClick(type, idx, liElem) {
  if (liElem.classList.contains("matched")) return; // Already matched
  if (type === "en") {
    // 取消上次选择
    clearSelections("en");
    selectedEnIdx = idx;
    liElem.classList.add("selected");
  } else if (type === "zh") {
    clearSelections("zh");
    selectedZhIdx = idx;
    liElem.classList.add("selected");
  }

  // 检查是否都已选择
  if (selectedEnIdx !== null && selectedZhIdx !== null) {
    checkMatch();
  }
}

function clearSelections(type) {
  if (type === "en") {
    Array.from(englishList.children).forEach(li => li.classList.remove("selected", "wrong"));
  } else {
    Array.from(chineseList.children).forEach(li => li.classList.remove("selected", "wrong"));
  }
}

function checkMatch() {
  // 找到英文和中文对应的词
  const enWord = englishList.children[selectedEnIdx].textContent;
  const zhWord = chineseList.children[selectedZhIdx].textContent;
  // 用pairs查找正确关系
  const pair = pairs.find(p => p.en === enWord && p.zh === zhWord);

  if (pair) {
    // 匹配正确
    englishList.children[selectedEnIdx].classList.add("matched");
    chineseList.children[selectedZhIdx].classList.add("matched");
    matchedPairs++;
    score += 2;
    updateScore();
    // 清除选择
    selectedEnIdx = null;
    selectedZhIdx = null;
    // 检查是否全部完成
    if (matchedPairs === pairs.length) {
      endGame();
    }
  } else {
    // 匹配错误
    englishList.children[selectedEnIdx].classList.add("wrong");
    chineseList.children[selectedZhIdx].classList.add("wrong");
    score -= 1;
    updateScore();
    setTimeout(() => {
      clearSelections("en");
      clearSelections("zh");
      selectedEnIdx = null;
      selectedZhIdx = null;
    }, 600);
  }
}

function updateScore() {
  scoreSpan.textContent = `Score: ${score}`;
}

function updateTimer() {
  timerSpan.textContent = `Time: ${timer}s`;
}

function endGame() {
  clearInterval(timerId);
  let msg = `<b>🎉 Congratulations!</b><br>
  You matched all pairs.<br>
  <b>Final Score:</b> ${score}<br>
  <b>Time:</b> ${timer}s<br><br>
  <button id="play-again-btn">Play Again</button>`;
  resultPopup.innerHTML = msg;
  resultPopup.classList.remove("hidden");
  document.getElementById("play-again-btn").onclick = restartGame;
}

// --- Event Listeners ---

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);

function restartGame() {
  // Reset and show controls
  gameSection.classList.add("hidden");
  controlsSection.classList.remove("hidden");
  resultPopup.classList.add("hidden");
  clearInterval(timerId);
  score = 0;
  timer = 0;
  updateScore();
  updateTimer();
}

// Optional: allow pressing Enter to start game
document.addEventListener("keydown", (e) => {
  if (controlsSection && !controlsSection.classList.contains("hidden")) {
    if (e.key === "Enter") startGame();
  }
});

// --- Mobile: scroll to game after starting ---
startBtn.addEventListener("click", () => {
  setTimeout(() => {
    gameSection.scrollIntoView({ behavior: "smooth" });
  }, 200);
});
