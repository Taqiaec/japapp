import { useState } from "react";

const jlptColors = {
  5: "bg-green-500 text-white",
  4: "bg-teal-500 text-white",
  3: "bg-yellow-500 text-black",
  2: "bg-orange-500 text-white",
  1: "bg-red-500 text-white",
};

const jlptLabels = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };

function loadDecks() {
  const oldData = localStorage.getItem("goichou_lists");
  if (oldData && !localStorage.getItem("goichou_decks")) {
    localStorage.setItem("goichou_decks", oldData);
    localStorage.removeItem("goichou_lists");
  }
  try {
    return JSON.parse(localStorage.getItem("goichou_decks")) || [];
  } catch {
    return [];
  }
}

function saveDecks(decks) {
  localStorage.setItem("goichou_decks", JSON.stringify(decks));
}

export default function Flashcard({ word, onAnswer, answered, onContinue }) {
  const [flipped, setFlipped] = useState(false);
  const [showDeckDropdown, setShowDeckDropdown] = useState(false);
  const furigana = localStorage.getItem("goichou_furigana") || "flip";

  function handleToggleDeck(deckId) {
    const decks = loadDecks();
    const updated = decks.map((d) => {
      if (d.id !== deckId) return d;
      if (d.wordIds.includes(word.id)) {
        return { ...d, wordIds: d.wordIds.filter((id) => id !== word.id) };
      }
      return { ...d, wordIds: [...d.wordIds, word.id] };
    });
    saveDecks(updated);
    setShowDeckDropdown(false);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className="relative cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => {
          if (answered) { onContinue?.(); return; }
          if (!flipped) setFlipped(true);
        }}
      >
        <div
          className={`relative w-full min-h-[320px] transition-transform duration-500 ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-slate-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span
              className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${jlptColors[word.jlptLevel] || "bg-gray-500 text-white"}`}
            >
              {jlptLabels[word.jlptLevel] || `N${word.jlptLevel}`}
            </span>
            <span className="text-6xl font-bold mb-2 text-white">{word.kanji}</span>
            {furigana === "always" && (
              <span className="text-lg text-slate-400 mb-4">{word.reading}</span>
            )}
            <span className="text-gray-500 text-sm">Tap to reveal</span>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-slate-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 [transform:rotateY(180deg)]"
            style={{ backfaceVisibility: "hidden" }}
          >
            {furigana !== "never" && (
              <span className="text-2xl mb-2 text-white">{word.reading}</span>
            )}
            <span className="text-xl text-gray-300 mb-6">{word.meaning}</span>

            {answered ? (
              <span className="text-slate-500 text-sm">Tap to continue</span>
            ) : (
              <>
                <div className="flex gap-3 w-full max-w-sm">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAnswer(0); }}
                    className="flex-1 px-4 py-3 rounded-xl text-white font-semibold bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors"
                  >
                    Again
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAnswer(1); }}
                    className="flex-1 px-4 py-3 rounded-xl text-white font-semibold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors"
                  >
                    Hard
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAnswer(2); }}
                    className="flex-1 px-4 py-3 rounded-xl text-white font-semibold bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors"
                  >
                    Good
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAnswer(3); }}
                    className="flex-1 px-4 py-3 rounded-xl text-white font-semibold bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors"
                  >
                    Easy
                  </button>
                </div>

                <div className="relative w-full max-w-sm mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeckDropdown((v) => !v); }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v14l-7-3-7 3V4z" />
                    </svg>
                    Save to Deck
                  </button>
                  {showDeckDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowDeckDropdown(false); }} />
                      <div className="absolute left-0 bottom-full mb-1 z-20 bg-slate-700 rounded-lg shadow-xl py-1 min-w-44 max-h-48 overflow-y-auto">
                        {loadDecks().length === 0 ? (
                          <span className="block px-4 py-2 text-xs text-slate-400">No decks yet</span>
                        ) : (
                          loadDecks().map((deck) => (
                            <button
                              key={deck.id}
                              onClick={(e) => { e.stopPropagation(); handleToggleDeck(deck.id); }}
                              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                            >
                              {deck.name}
                              {deck.wordIds.includes(word.id) && (
                                <span className="ml-2 text-green-400">✓</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
