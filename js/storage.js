const PREFIX = "cippus-study-";

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getProgress() {
  return load("progress", {
    cards: {},
    quizScores: [],
    examAttempts: [],
    streak: 0,
    lastStudyDate: null,
  });
}

export function setProgress(progress) {
  save("progress", progress);
}

export function markCard(cardId, status) {
  const p = getProgress();
  p.cards[cardId] = status;
  updateStreak(p);
  setProgress(p);
}

export function recordQuizScore(score, total, domain) {
  const p = getProgress();
  p.quizScores.push({
    score,
    total,
    domain: domain || "all",
    date: new Date().toISOString(),
    percent: Math.round((score / total) * 100),
  });
  if (p.quizScores.length > 50) p.quizScores = p.quizScores.slice(-50);
  updateStreak(p);
  setProgress(p);
}

export function recordExamAttempt(score, total, durationSeconds) {
  const p = getProgress();
  p.examAttempts.push({
    score,
    total,
    percent: Math.round((score / total) * 100),
    durationSeconds,
    date: new Date().toISOString(),
  });
  if (p.examAttempts.length > 20) p.examAttempts = p.examAttempts.slice(-20);
  updateStreak(p);
  setProgress(p);
}

function updateStreak(p) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.lastStudyDate === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.toISOString().slice(0, 10);
  if (p.lastStudyDate === y) p.streak = (p.streak || 0) + 1;
  else if (p.lastStudyDate !== today) p.streak = 1;
  p.lastStudyDate = today;
}

export function getCustomDecks() {
  return load("customDecks", []);
}

export function saveCustomDecks(decks) {
  save("customDecks", decks);
}

export function exportAllData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: getProgress(),
    customDecks: getCustomDecks(),
  };
}

export function importAllData(data) {
  if (!data || data.version !== 1) return false;
  if (data.progress) setProgress(data.progress);
  if (data.customDecks) saveCustomDecks(data.customDecks);
  return true;
}

export function getStats(flashcards) {
  const p = getProgress();
  const known = Object.values(p.cards).filter((s) => s === "known").length;
  const learning = Object.values(p.cards).filter((s) => s === "learning").length;
  const total = flashcards.length;
  const recentQuiz = p.quizScores[p.quizScores.length - 1];
  const recentExam = p.examAttempts[p.examAttempts.length - 1];
  return { known, learning, total, recentQuiz, recentExam, streak: p.streak || 0 };
}
