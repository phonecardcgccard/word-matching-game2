const DIFFICULTIES = [
  { name: 'easy', label: '简单', color: 'bg-blue-100 text-blue-800' },
  { name: 'medium', label: '中等', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'hard', label: '困难', color: 'bg-red-100 text-red-800' }
];

let currentDifficulty = 'easy';
let wordList = [];
let setIndex = 0;
let matched = 0;
let selected = [];
let score = 0;
let timer = 0;
let timerInterval = null;

const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');
const cardContainer = document.getElementById('cardContainer');
const scoreElem = document.getElementById('score');
const remainingElem = document.getElementById('remaining');
const timerElem = document.getElementById('timer');
const nextSetBtn = document.getElementById('nextSetBtn');
const message = document.getElementById('message');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const messageBtn = document.getElementById('messageBtn');

function setActiveBtn(difficulty) {
  [easyBtn, mediumBtn, hardBtn].forEach(btn => btn.classList.remove('active'));
  if (difficulty === 'easy') easyBtn.classList.add('active');
  if (difficulty === 'medium') mediumBtn.classList.add('active');
  if (difficulty === 'hard') hardBtn.classList.add('active');
}

function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort(() => Math.random() - 0.5).map(a => a[1]);
}

async function loadWordList(difficulty) {
  const res = await fetch(`static/${difficulty}.json`);
  return await res.json();
}

function formatTime(sec) {
  return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
}

function resetGame() {
  matched = 0;
  selected = [];
  score = 0;
  timer = 0;
  setIndex = 0;
  scoreElem.textContent = '0';
  timerElem.textContent = '00:00';
  clearInterval(timerInterval);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    timerElem.textContent = formatTime(timer);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// 实现每行2英文2中文，4列纵向对齐
function renderCards(words) {
  cardContainer.innerHTML = '';
  cardContainer.className = 'grid grid-cols-4 gap-4 w-full';

  if (!words || words.length === 0) {
    remainingElem.textContent = '0';
    return;
  }

  // 英文和中文卡片各自独立洗牌
  let enCards = shuffle(words.map(w => ({...w, type: 'english'})));
  let zhCards = shuffle(words.map(w => ({...w, type: 'chinese'})));

  const total = words.length;
  const rows = Math.ceil(total / 2); // 每行2英文+2中文

  for (let row = 0; row < rows; row++) {
    // 每行2英文
    for (let col = 0; col < 2; col++) {
      const idx = row * 2 + col;
      if (idx < enCards.length) {
        const item = enCards[idx];
        const div = document.createElement('div');
        div.className = `card cursor-pointer rounded-lg shadow-md p-1 flex items-center justify-center bg-blue-100 text-blue-800`;
        div.dataset.pair = item.english;
        div.dataset.type = 'english';
        div.textContent = item.english;
        div.onclick = () => onCardClick(div);
        cardContainer.appendChild(div);
      } else {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'invisible';
        cardContainer.appendChild(emptyDiv);
      }
    }
    // 每行2中文
    for (let col = 0; col < 2; col++) {
      const idx = row * 2 + col;
      if (idx < zhCards.length) {
        const item = zhCards[idx];
        const div = document.createElement('div');
        div.className = `card cursor-pointer rounded-lg shadow-md p-1 flex items-center justify-center bg-red-100 text-red-800`;
        div.dataset.pair = item.english;
        div.dataset.type = 'chinese';
        div.textContent = item.chinese;
        div.onclick = () => onCardClick(div);
        cardContainer.appendChild(div);
      } else {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'invisible';
        cardContainer.appendChild(emptyDiv);
      }
    }
  }
  remainingElem.textContent = words.length;
}

function onCardClick(card) {
  if (selected.length === 2 || card.classList.contains('matched') || card.classList.contains('selected')) return;
  card.classList.add('selected');
  selected.push(card);
  if (selected.length === 2) checkMatch();
}

function checkMatch() {
  const [a, b] = selected;
  if (a.dataset.pair === b.dataset.pair && a.dataset.type !== b.dataset.type) {
    a.classList.add('matched');
    b.classList.add('matched');
    matched++;
    score += 10;
    scoreElem.textContent = score;
    if (matched === (wordList[setIndex] ? wordList[setIndex].length : 0)) endGame();
  } else {
    setTimeout(() => {
      a.classList.remove('selected');
      b.classList.remove('selected');
    }, 500);
    if (score > 0) score -= 2;
    scoreElem.textContent = score;
  }
  selected = [];
}

function endGame() {
  stopTimer();
  messageTitle.textContent = '恭喜通关！';
  messageText.innerHTML = `用时：${formatTime(timer)}<br>得分：${score}<br>正确配对：${matched}`;
  message.classList.remove('hidden');
}

function nextSet() {
  setIndex++;
  if (setIndex >= wordList.length) setIndex = 0;
  startGame();
}

async function startGame() {
  stopTimer();
  matched = 0;
  selected = [];
  score = 0;
  timer = 0;
  scoreElem.textContent = '0';
  timerElem.textContent = '00:00';
  message.classList.add('hidden');
  if (!window[`_${currentDifficulty}Words`]) {
    wordList = await loadWordList(currentDifficulty);
    window[`_${currentDifficulty}Words`] = wordList;
  } else {
    wordList = window[`_${currentDifficulty}Words`];
  }
  if (setIndex >= wordList.length) setIndex = 0;
  renderCards(wordList[setIndex] || []);
  startTimer();
}

easyBtn.onclick = () => { currentDifficulty = 'easy'; setActiveBtn('easy'); setIndex = 0; startGame(); }
mediumBtn.onclick = () => { currentDifficulty = 'medium'; setActiveBtn('medium'); setIndex = 0; startGame(); }
hardBtn.onclick = () => { currentDifficulty = 'hard'; setActiveBtn('hard'); setIndex = 0; startGame(); }
nextSetBtn.onclick = nextSet;
messageBtn.onclick = () => { message.classList.add('hidden'); nextSet(); };

// 初始化
setActiveBtn('easy');
startGame();
