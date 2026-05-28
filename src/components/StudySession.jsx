import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDueCards, calculateNextReview } from "../utils/srs";
import { updateWord, updateStreak, loadWords } from "../utils/storage";
import Flashcard from "./Flashcard";
import SessionRecap from "./SessionRecap";

export default function StudySession({ words, onWordsUpdate }) {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deck");
  const timerRef = useRef(null);
  const advanceRef = useRef(null);

  const levelParam = searchParams.get("level");
  const difficultyParam = searchParams.get("difficulty");

  const { filteredWords, deckName } = useMemo(() => {
    let result = words;

    if (levelParam) {
      const lvl = parseInt(levelParam, 10);
      result = result.filter((w) => w.jlptLevel === lvl);
    }

    if (difficultyParam === "hard") {
      result = result.filter(
        (w) => w.status !== "new" && (w.easeFactor <= 1.5 || w.lapses >= 3)
      );
    } else if (difficultyParam === "easy") {
      result = result.filter(
        (w) => w.status !== "new" && (w.easeFactor >= 2.3 || w.interval >= 14)
      );
    } else if (difficultyParam === "new") {
      result = result.filter((w) => w.status === "new");
    }

    if (!deckId) return { filteredWords: result, deckName: null };
    try {
      const oldData = localStorage.getItem("goichou_lists");
      if (oldData && !localStorage.getItem("goichou_decks")) {
        localStorage.setItem("goichou_decks", oldData);
        localStorage.removeItem("goichou_lists");
      }
      const decks = JSON.parse(localStorage.getItem("goichou_decks")) || [];
      const deck = decks.find((d) => d.id === deckId);
      if (!deck) return { filteredWords: result, deckName: null };
      const ids = new Set(deck.wordIds);
      return {
        filteredWords: result.filter((w) => ids.has(w.id)),
        deckName: deck.name,
      };
    } catch {
      return { filteredWords: result, deckName: null };
    }
  }, [words, deckId, levelParam, difficultyParam]);

  const dueCards = useMemo(() => {
    if (deckId || difficultyParam) return filteredWords;
    return getDueCards(filteredWords);
  }, [filteredWords, deckId, difficultyParam]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [gradeHistory, setGradeHistory] = useState([]);

  const autoAdvance = localStorage.getItem("goichou_autoadvance") === "true";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!waitingForNext) return;
    function handleKeyDown(e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advanceRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [waitingForNext]);

  function advance() {
    setWaitingForNext(false);
    if (currentIndex + 1 < dueCards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      updateStreak();
      onWordsUpdate?.(loadWords());
      setFinished(true);
    }
  }

  advanceRef.current = advance;

  function handleAnswer(grade) {
    const card = dueCards[currentIndex];
    const updated = calculateNextReview(card, grade);
    updateWord(card.id, updated);

    setGradeHistory(prev => [...prev, {
      wordId: card.id,
      grade,
      kanji: card.kanji,
      reading: card.reading,
      meaning: card.meaning,
      status: updated.status,
      interval: updated.interval,
      easeFactor: updated.easeFactor,
    }]);

    setWaitingForNext(true);
    if (autoAdvance) {
      timerRef.current = setTimeout(() => advanceRef.current(), 1000);
    }
  }

  if (dueCards.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-slate-900 p-8">
        <h1 className="text-3xl font-bold mb-4 text-white">All caught up!</h1>
        <p className="text-slate-400 text-lg mb-8">
          No cards due for review. Come back later.
        </p>
        <Link
          to="/"
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <SessionRecap
        gradeHistory={gradeHistory}
        totalCards={dueCards.length}
      />
    );
  }

  const card = dueCards[currentIndex];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-900 flex flex-col items-center p-8">
      {deckName && (
        <p className="text-slate-500 text-sm mb-2">{deckName}</p>
      )}
      <p className="text-slate-400 mb-6">
        Card {currentIndex + 1} of {dueCards.length}
        {waitingForNext && autoAdvance && <span className="ml-2 text-slate-500">(next...)</span>}
      </p>
      <Flashcard key={card.id} word={card} onAnswer={handleAnswer} answered={waitingForNext} onContinue={advance} />
    </div>
  );
}
