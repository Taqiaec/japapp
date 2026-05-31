export const DEFAULT_SRS = {
  interval: 1,
  easeFactor: 2.5,
  dueDate: null,
  reps: 0,
  lapses: 0,
  status: "new",
};

export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function calculateNextReview(card, grade) {
  let { interval, easeFactor, reps, lapses } = card;
  const today = getTodayString();

  const oldInterval = interval;
  const oldReps = reps;

  if (grade === 0) {
    interval = 1;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (grade === 1) {
    interval = Math.max(1, interval);
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (grade === 2) {
    interval = Math.ceil(interval * easeFactor);
    reps += 1;
  } else if (grade === 3) {
    interval = Math.ceil(interval * easeFactor * 1.3);
    reps += 1;
  }

  // SM-2 ease factor update: EF increases on Easy, stays on Good, decreases on Hard/Again
  const q = grade === 0 ? 0 : grade === 1 ? 2 : grade === 2 ? 3 : 5;
  easeFactor = easeFactor + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02));

  // Status based on interval (always, not just grade >= 2)
  let status;
  if (interval >= 21) {
    status = "mastered";
  } else if (interval >= 7) {
    status = "review";
  } else {
    status = "learning";
  }

  easeFactor = Math.max(1.3, Math.min(3.0, easeFactor));

  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + interval);

  const result = {
    interval,
    easeFactor,
    reps,
    lapses,
    status,
    dueDate: dueDate.toISOString().slice(0, 10),
    lastReviewed: today,
  };

  console.log(`[SRS] card=${card.id?.slice(0,6)} kanji="${card.kanji}" grade=${grade} reps:${oldReps}->${reps} oldInterval=${oldInterval} newInterval=${interval} oldStatus="${card.status}" newStatus="${result.status}" E="${easeFactor.toFixed(2)}" due="${result.dueDate}"`);

  return result;
}

export function getMasteryProgress(word) {
  if (word.status === "new") return 0;
  if (word.status === "mastered") return 100;
  return Math.min(99, Math.round((word.interval / 21) * 100));
}

export function getDueCards(allWords, limit) {
  const today = getTodayString();
  const statusOrder = { learning: 0, new: 1, review: 2 };

  if (limit === undefined) {
    const raw = localStorage.getItem("goichou_daily_limit");
    limit = raw ? parseInt(raw, 10) : 15;
    if (isNaN(limit) || limit < 1) limit = 15;
  }

  return allWords
    .filter(w => w.dueDate === null || w.dueDate <= today || w.status === "new")
    .sort((a, b) => {
      const sa = statusOrder[a.status] ?? 99;
      const sb = statusOrder[b.status] ?? 99;
      return sa - sb;
    })
    .slice(0, limit);
}
