import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMasteryProgress } from "../utils/srs";
import { toRomaji } from "../utils/romaji";

const jlptColors = {
  5: "bg-green-500 text-white",
  4: "bg-teal-500 text-white",
  3: "bg-yellow-500 text-black",
  2: "bg-orange-500 text-white",
  1: "bg-red-500 text-white",
};

const jlptLabels = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };

const statusColors = {
  learning: "bg-blue-500 text-white",
  review: "bg-yellow-500 text-black",
  mastered: "bg-green-500 text-white",
};

const STATUSES = ["", "learning", "review", "mastered"];
const LEVELS = [0, 5, 4, 3, 2, 1];
const PAGE_SIZE = 50;

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

export default function MyWords({ words: initialWords }) {
  const [words] = useState(initialWords);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);

  const myWords = useMemo(
    () => words.filter((w) => w.status !== "new"),
    [words]
  );

  const filtered = useMemo(() => {
    let result = myWords;
    if (level) result = result.filter((w) => w.jlptLevel === level);
    if (status) result = result.filter((w) => w.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.kanji.includes(q) ||
          w.reading.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          toRomaji(w.reading).includes(q)
      );
    }
    return result;
  }, [myWords, level, status, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const decks = useMemo(loadDecks, [openDropdown]);

  function handleAddToDeck(wordId, deckId) {
    const updated = decks.map((d) => {
      if (d.id !== deckId) return d;
      if (d.wordIds.includes(wordId)) return d;
      return { ...d, wordIds: [...d.wordIds, wordId] };
    });
    saveDecks(updated);
    setOpenDropdown(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">My Words</h1>
        <Link
          to="/browse"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Browse all words →
        </Link>
      </div>

      <div className="flex gap-2 text-sm text-slate-400 mb-4">
        <span>{myWords.length} words studied</span>
        <span>·</span>
        <span>{words.filter((w) => w.status === "mastered").length} mastered</span>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-40 bg-slate-900 pt-2 pb-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => { setLevel(l); setPage(0); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                level === l
                  ? l === 0
                    ? "bg-indigo-600 text-white"
                    : jlptColors[l]
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {l === 0 ? "All" : jlptLabels[l]}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search kanji, reading, meaning, or romaji..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "All status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {paginated.length === 0 ? (
        <p className="text-center text-slate-500 py-16">
          {myWords.length === 0
            ? "No words studied yet. Add words from Browse to get started!"
            : "No words match your filters"}
        </p>
      ) : (
        <>
          <div className="space-y-1">
            {paginated.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{w.kanji}</div>
                  <div className="text-slate-400 text-sm truncate">{w.reading}</div>
                </div>

                <div className="flex-[2] min-w-0 hidden sm:block">
                  <div className="text-slate-300 text-sm truncate">{w.meaning}</div>
                </div>

                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${jlptColors[w.jlptLevel] || "bg-slate-600 text-white"}`}
                >
                  {jlptLabels[w.jlptLevel] || `N${w.jlptLevel}`}
                </span>

                <div className="shrink-0 w-16 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${getMasteryProgress(w)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right tabular-nums">
                    {getMasteryProgress(w)}%
                  </span>
                </div>

                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${statusColors[w.status] || "bg-slate-600 text-slate-200"}`}
                >
                  {w.status}
                </span>

                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === w.id ? null : w.id)}
                    className="shrink-0 px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                  >
                    + Deck
                  </button>
                  {openDropdown === w.id && decks.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-slate-700 rounded-lg shadow-xl py-1 min-w-40">
                        {decks.map((deck) => (
                          <button
                            key={deck.id}
                            onClick={() => handleAddToDeck(w.id, deck.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                          >
                            {deck.name}
                            {deck.wordIds.includes(w.id) && (
                              <span className="ml-2 text-green-400">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white disabled:opacity-40 hover:bg-slate-600 transition-colors"
              >
                Prev
              </button>
              <span className="text-slate-400 text-sm">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white disabled:opacity-40 hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
