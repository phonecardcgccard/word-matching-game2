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
  return arr.map(v => [Math.random(), v]).sort().map(a => a[1]);
}

async function loadWordList(difficulty) {
  // static/ 目录下
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

// 4列（2列英文，2列中文）网格布局
function renderCards(words) {
  cardContainer.innerHTML = '';
  if (!words || words.length === 0) {
    remainingElem.textContent = '0';
    return;
  }
  cardContainer.className = "grid grid-cols-4 gap-4 w-full"; // 设置4列

  // 将英文和中文卡片分组
  let enCards = shuffle(words.map(w => ({...w, type: 'english'})));
  let zhCards = shuffle(words.map(w => ({...w, type: 'chinese'})));

  // 2列英文，2列中文，纵向交错排列
  // 假定每组为N个单词（如12），则前两列为英文，后两列为中文
  // 先拼出顺序数组：enCards[0]、enCards[1]、...、zhCards[0]、zhCards[1]、...
  // 然后每行插入2个英文+2个中文

  let rows = Math.ceil(words.length / 2); // 每行2英2中
  for (let i = 0; i < rows; i++) {
    // 英文卡
    for (let j = 0; j < 2; j++) {
      let enIndex = i * 2 + j;
      if (enIndex < enCards.length) {
        const item = enCards[enIndex];
        const div = document.createElement('div');
        div.className = `card cursor-pointer rounded-lg shadow-md p-1 flex items-center justify-center bg-blue-100 text-blue-800`;
        div.dataset.pair = item.english;
        div.dataset.type = item.type;
        div.textContent = item.english;
        div.onclick = () => onCardClick(div);
        cardContainer.appendChild(div);
      }
    }
    // 中文卡
    for (let j = 0; j < 2; j++) {
      let zhIndex = i * 2 + j;
      if (zhIndex < zhCards.length) {
        const item = zhCards[zhIndex];
        const div = document.createElement('div');
        div.className = `card cursor-pointer rounded-lg shadow-md p-1 flex items-center justify-center bg-red-100 text-red-800`;
        div.dataset.pair = item.english;
        div.dataset.type = item.type;
        div.textContent = item.chinese;
        div.onclick = () => onCardClick(div);
        cardContainer.appendChild(div);
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
    // 当前组配对数量达到单词数，结束本组
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
  messageTitle.textContent = 'Congratulations!';
  messageText.innerHTML = `Time: ${formatTime(timer)}<br>Score: ${score}<br>Correct matches: ${matched}`;
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
  // 当前难度词库缓存
  if (!window[`_${currentDifficulty}Words`]) {
    wordList = await loadWordList(currentDifficulty);
    window[`_${currentDifficulty}Words`] = wordList;
  } else {
    wordList = window[`_${currentDifficulty}Words`];
  }
  // 组数溢出保护
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
