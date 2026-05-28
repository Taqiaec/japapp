import { useState } from "react";
import { Link } from "react-router-dom";

// Safelist for Tailwind JIT: bg-red-500 bg-orange-500 bg-green-500 bg-blue-500

const GRADE_CONFIG = [
  { grade: 0, label: "Again", bg: "bg-red-500", hover: "hover:bg-red-600", border: "border-red-500" },
  { grade: 1, label: "Hard", bg: "bg-orange-500", hover: "hover:bg-orange-600", border: "border-orange-500" },
  { grade: 2, label: "Good", bg: "bg-green-500", hover: "hover:bg-green-600", border: "border-green-500" },
  { grade: 3, label: "Easy", bg: "bg-blue-500", hover: "hover:bg-blue-600", border: "border-blue-500" },
];

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

export default function SessionRecap({ gradeHistory, totalCards }) {
  const [showDetails, setShowDetails] = useState(false);
  const [openGradeDeck, setOpenGradeDeck] = useState(null);
  const [openWordDeck, setOpenWordDeck] = useState(null);

  const groups = GRADE_CONFIG.map((cfg) => ({
    ...cfg,
    words: gradeHistory.filter((h) => h.grade === cfg.grade),
  }));

  function handleAddGradeToDeck(deckId, wordIds) {
    const decks = loadDecks();
    const updated = decks.map((d) => {
      if (d.id !== deckId) return d;
      const combined = [...d.wordIds];
      wordIds.forEach((id) => {
        if (!combined.includes(id)) combined.push(id);
      });
      return { ...d, wordIds: combined };
    });
    saveDecks(updated);
    setOpenGradeDeck(null);
  }

  function handleToggleWordInDeck(deckId, wordId) {
    const decks = loadDecks();
    const updated = decks.map((d) => {
      if (d.id !== deckId) return d;
      if (d.wordIds.includes(wordId)) {
        return { ...d, wordIds: d.wordIds.filter((id) => id !== wordId) };
      }
      return { ...d, wordIds: [...d.wordIds, wordId] };
    });
    saveDecks(updated);
    setOpenWordDeck(null);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-white text-center mb-1">Session Complete</h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            {totalCards} card{totalCards !== 1 ? "s" : ""} reviewed
          </p>

          {/* Grade summary columns */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {groups.map((g) => (
              <div
                key={g.grade}
                className={`bg-slate-700/50 rounded-xl p-4 text-center border-t-2 ${g.border}`}
              >
                <p className="text-2xl font-bold text-white">{g.words.length}</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">{g.label}</p>

                {g.words.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenGradeDeck(openGradeDeck === g.grade ? null : g.grade)}
                      className="w-full text-xs py-1.5 rounded-lg font-medium bg-slate-600 text-slate-300 hover:bg-slate-500 hover:text-white transition-colors"
                    >
                      + Deck
                    </button>
                    {openGradeDeck === g.grade && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenGradeDeck(null)} />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-20 bg-slate-700 rounded-lg shadow-xl py-1 min-w-36 max-h-40 overflow-y-auto">
                          {loadDecks().length === 0 ? (
                            <span className="block px-3 py-1.5 text-xs text-slate-400 text-center">No decks yet</span>
                          ) : (
                            loadDecks().map((deck) => (
                              <button
                                key={deck.id}
                                onClick={() => handleAddGradeToDeck(deck.id, g.words.map((w) => w.wordId))}
                                className="block w-full text-left px-3 py-1.5 text-xs text-white hover:bg-slate-600 transition-colors"
                              >
                                {deck.name}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Collapsible detail toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
            {showDetails ? "Hide Details" : "Show Details"}
          </button>

          {/* Collapsible detail section */}
          {showDetails && (
            <div className="mt-4 space-y-1.5">
              {groups.map(
                (g) =>
                  g.words.length > 0 && (
                    <div key={g.grade}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        {g.label} ({g.words.length})
                      </p>
                      {g.words.map((h) => (
                        <div
                          key={h.wordId}
                          className="flex items-center gap-3 bg-slate-700/30 rounded-xl px-4 py-3 mb-1"
                        >
                          {/* Grade badge dot */}
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${g.bg}`} />

                          {/* Word info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{h.kanji}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {h.reading} — {h.meaning}
                            </p>
                          </div>

                          {/* Individual Add to Deck */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() =>
                                setOpenWordDeck(openWordDeck === h.wordId ? null : h.wordId)
                              }
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                              title="Save to Deck"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v14l-7-3-7 3V4z" />
                              </svg>
                            </button>
                            {openWordDeck === h.wordId && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenWordDeck(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 bg-slate-700 rounded-lg shadow-xl py-1 min-w-36 max-h-40 overflow-y-auto">
                                  {loadDecks().length === 0 ? (
                                    <span className="block px-3 py-1.5 text-xs text-slate-400 text-center">
                                      No decks yet
                                    </span>
                                  ) : (
                                    loadDecks().map((deck) => (
                                      <button
                                        key={deck.id}
                                        onClick={() => handleToggleWordInDeck(deck.id, h.wordId)}
                                        className="flex items-center justify-between w-full text-left px-3 py-1.5 text-xs text-white hover:bg-slate-600 transition-colors"
                                      >
                                        <span>{deck.name}</span>
                                        {deck.wordIds.includes(h.wordId) && (
                                          <span className="text-green-400 ml-2">&#10003;</span>
                                        )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
              )}
            </div>
          )}

          {/* Back to Dashboard */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
