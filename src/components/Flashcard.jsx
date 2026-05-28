import { useState } from "react";

// Safelist for Tailwind JIT: bg-red-500 bg-orange-500 bg-green-500 bg-blue-500 bg-indigo-500/20

const jlptColors = {
  5: "bg-green-500 text-white",
  4: "bg-teal-500 text-white",
  3: "bg-yellow-500 text-black",
  2: "bg-orange-500 text-white",
  1: "bg-red-500 text-white",
};

const jlptLabels = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };

const POS_LABELS = {
  n: "Noun",
  v5r: "Godan verb",
  v1: "Ichidan verb",
  vs: "Suru verb",
  vs_s: "Suru verb",
  vs_i: "Suru verb",
  vk: "Kuru verb",
  v1_s: "Ichidan verb",
  vz: "Zuru verb",
  v5aru: "Godan verb",
  v5b: "Godan verb",
  v5g: "Godan verb",
  v5k: "Godan verb",
  v5k_s: "Godan verb",
  v5m: "Godan verb",
  v5n: "Godan verb",
  v5r_i: "Godan verb",
  v5s: "Godan verb",
  v5t: "Godan verb",
  v5u: "Godan verb",
  v5u_s: "Godan verb",
  v2a_s: "Nidan verb",
  adj_i: "I-adjective",
  adj_na: "Na-adjective",
  adj_no: "No-adjective",
  adj_f: "Pre-noun adj.",
  adj_t: "Taru adjective",
  adv: "Adverb",
  adv_to: "Adverb",
  exp: "Expression",
  int: "Interjection",
  conj: "Conjunction",
  pref: "Prefix",
  suf: "Suffix",
  pn: "Pronoun",
  num: "Numeral",
  aux: "Auxiliary",
  aux_v: "Auxiliary verb",
  ctr: "Counter",
  prt: "Particle",
  n_pref: "Noun (prefix)",
  n_suf: "Noun (suffix)",
};

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

  function handleJishoClick(e) {
    e.stopPropagation();
  }

  const posKey = word.pos ? word.pos.replace(/-/g, "_") : null;

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
          className={`relative w-full min-h-[380px] transition-transform duration-500 ${
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
            className="absolute inset-0 bg-slate-800 rounded-2xl shadow-lg flex flex-col items-center p-6 [transform:rotateY(180deg)]"
            style={{ backfaceVisibility: "hidden" }}
          >
            {furigana !== "never" && (
              <span className="text-2xl mb-1 text-white">{word.reading}</span>
            )}
            <span className="text-xl text-gray-300 mb-3 text-center">{word.meaning}</span>

            {/* POS badge */}
            {word.pos && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 mb-3">
                {POS_LABELS[posKey] || word.pos}
              </span>
            )}

            {/* Jisho link */}
            <a
              href={`https://jisho.org/search/${encodeURIComponent(word.kanji || word.reading)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleJishoClick}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors mb-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
              </svg>
              View on Jisho
            </a>

            {/* Example sentences — embedded from data */}
            {word.examples && word.examples.length > 0 && (
              <div className="w-full max-w-sm mb-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Example</p>
                {word.examples.map((ex, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-relaxed">
                    {ex.japanese}
                  </p>
                ))}
              </div>
            )}

            {answered ? (
              <span className="text-slate-500 text-sm mt-auto">Tap to continue</span>
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

                <div className="relative w-full max-w-sm mt-2">
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
                                <span className="ml-2 text-green-400">&#10003;</span>
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
