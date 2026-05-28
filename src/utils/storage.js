const STORAGE_KEY = "goichou_words";
const STREAK_KEY = "goichou_streak";
const LAST_STUDY_KEY = "goichou_last_study";

export function saveWords(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function loadWords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function updateWord(id, updates) {
  const words = loadWords();
  if (!words) return;
  const idx = words.findIndex((w) => w.id === id);
  if (idx === -1) return;
  words[idx] = { ...words[idx], ...updates };
  saveWords(words);
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.floor((da - db) / (1000 * 60 * 60 * 24));
}

export function getLastStudyDate() {
  return localStorage.getItem(LAST_STUDY_KEY);
}

export function getStreak() {
  const val = parseInt(localStorage.getItem(STREAK_KEY), 10);
  return isNaN(val) ? 0 : val;
}

export function updateStreak() {
  const today = getTodayString();
  const last = getLastStudyDate();

  let streak;
  if (!last) {
    streak = 1;
  } else if (last === today) {
    streak = getStreak();
  } else if (daysBetween(today, last) === 1) {
    streak = getStreak() + 1;
  } else {
    streak = 1;
  }

  localStorage.setItem(LAST_STUDY_KEY, today);
  localStorage.setItem(STREAK_KEY, String(streak));
  return streak;
}
