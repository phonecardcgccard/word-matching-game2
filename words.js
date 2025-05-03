// Loads and provides word sets for each level
const WORD_LEVELS = ['easy', 'medium', 'hard'];
let ALL_WORD_SETS = {}; // {easy: [set1, set2, ...], ...}

async function loadAllWordSets() {
  for (const level of WORD_LEVELS) {
    const resp = await fetch(`${level}.json`);
    const arr = await resp.json();
    // 修正格式和异常（如某些中文不是字符串）
    ALL_WORD_SETS[level] = arr.map(set =>
      set.map(pair => ({
        english: String(pair.english).trim(),
        chinese: (typeof pair.chinese === "string" ? pair.chinese : String(pair.chinese)).trim()
      }))
    );
  }
}

function getLevelCount(level) {
  return ALL_WORD_SETS[level] ? ALL_WORD_SETS[level].length : 0;
}
function getWordSet(level, idx) {
  return ALL_WORD_SETS[level][idx];
}
