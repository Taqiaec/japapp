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
  let { interval, easeFactor, reps, lapses, status } = card;
  const today = getTodayString();

  const oldInterval = interval;
  const oldReps = reps;

  if (grade === 0) {
    interval = 1;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    status = "learning";
  } else if (grade === 1) {
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    status = "learning";
  } else if (grade === 2) {
    interval = Math.ceil(interval * easeFactor);
    easeFactor = Math.min(2.5, easeFactor);
  } else if (grade === 3) {
    interval = Math.ceil(interval * easeFactor * 1.3);
    easeFactor = Math.min(2.5, easeFactor);
  }

  if (grade >= 2) {
    reps += 1;
    if (interval >= 21) {
      status = "mastered";
    } else if (interval >= 7) {
      status = "review";
    } else {
      status = "learning";
    }
  }

  easeFactor = Math.max(1.3, Math.min(2.5, easeFactor));

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
