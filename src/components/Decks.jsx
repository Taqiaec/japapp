// Safelist for Tailwind JIT: bg-green-500 text-white bg-teal-500 text-white bg-yellow-500 text-black bg-orange-500 text-white bg-red-500 text-white
// Safelist for Tailwind JIT: bg-blue-500 text-white bg-yellow-500 text-black bg-green-500 text-white
// Safelist for Tailwind JIT: bg-slate-600 text-white bg-slate-600 text-slate-200
// Safelist for Tailwind JIT: text-red-400 hover:text-red-300 hover:bg-red-500/10

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { getMasteryProgress } from "../utils/srs";
import { toRomaji } from "../utils/romaji";

const DECKS_KEY = "goichou_decks";

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

const MODAL_LEVELS = [0, 5, 4, 3, 2, 1];
const MODAL_PAGE_SIZE = 50;

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "kanji", label: "Kanji A-Z" },
  { value: "reading", label: "Reading A-Z" },
  { value: "jlpt", label: "JLPT (high→low)" },
  { value: "progress", label: "Mastery (low→high)" },
  { value: "status", label: "Status" },
];

const STATUS_ORDER = { learning: 0, review: 1, mastered: 2, new: 3 };

function loadDecks() {
  const oldData = localStorage.getItem("goichou_lists");
  if (oldData && !localStorage.getItem(DECKS_KEY)) {
    localStorage.setItem(DECKS_KEY, oldData);
    localStorage.removeItem("goichou_lists");
  }
  try {
    return JSON.parse(localStorage.getItem(DECKS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDecks(decks) {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export default function Decks({ words }) {
  const { t } = useLang();
  const [decks, setDecks] = useState(loadDecks);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalLevel, setModalLevel] = useState(0);
  const [modalPage, setModalPage] = useState(0);
  const [modalSort, setModalSort] = useState("default");
  const [openWordMenu, setOpenWordMenu] = useState(null);
  const [menuAction, setMenuAction] = useState(null);

  function handleCreate() {
    const name = window.prompt(t("Deck name:", "デッキ名："));
    if (!name || !name.trim()) return;

    const newDeck = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      wordIds: [],
    };

    const updated = [...decks, newDeck];
    saveDecks(updated);
    setDecks(updated);
  }

  function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm(t("Delete this deck?", "このデッキを削除しますか？"))) return;
    const updated = decks.filter((d) => d.id !== id);
    saveDecks(updated);
    setDecks(updated);
  }

  function openDeckDetail(deck) {
    setSelectedDeck(deck);
    setModalSearch("");
    setModalLevel(0);
    setModalPage(0);
    setModalSort("default");
    setOpenWordMenu(null);
    setMenuAction(null);
  }

  // Modal word filtering
  const deckWordIds = useMemo(() => {
    if (!selectedDeck) return new Set();
    return new Set(selectedDeck.wordIds);
  }, [selectedDeck]);

  const deckWords = useMemo(() => {
    if (!selectedDeck || !words) return [];
    return words.filter((w) => deckWordIds.has(w.id));
  }, [words, selectedDeck, deckWordIds]);

  const modalFiltered = useMemo(() => {
    let result = deckWords;
    if (modalLevel) result = result.filter((w) => w.jlptLevel === modalLevel);
    if (modalSearch) {
      const q = modalSearch.toLowerCase();
      result = result.filter(
        (w) =>
          w.kanji.includes(q) ||
          w.reading.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          toRomaji(w.reading).includes(q)
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (modalSort) {
        case "kanji":
          return a.kanji.localeCompare(b.kanji);
        case "reading":
          return a.reading.localeCompare(b.reading);
        case "jlpt":
          return b.jlptLevel - a.jlptLevel;
        case "progress":
          return getMasteryProgress(a) - getMasteryProgress(b);
        case "status":
          return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        default:
          return selectedDeck
            ? selectedDeck.wordIds.indexOf(a.id) - selectedDeck.wordIds.indexOf(b.id)
            : 0;
      }
    });
    return result;
  }, [deckWords, modalLevel, modalSearch, modalSort, selectedDeck]);

  const modalTotalPages = Math.ceil(modalFiltered.length / MODAL_PAGE_SIZE);
  const modalPaginated = modalFiltered.slice(
    modalPage * MODAL_PAGE_SIZE,
    (modalPage + 1) * MODAL_PAGE_SIZE
  );

  function handleRemoveFromDeck(wordId) {
    const updated = decks.map((d) =>
      d.id === selectedDeck.id
        ? { ...d, wordIds: d.wordIds.filter((id) => id !== wordId) }
        : d
    );
    saveDecks(updated);
    setDecks(updated);
    setSelectedDeck(updated.find((d) => d.id === selectedDeck.id));
    setOpenWordMenu(null);
    setMenuAction(null);
  }

  function handleMoveToDeck(wordId, targetDeckId) {
    const updated = decks.map((d) => {
      if (d.id === selectedDeck.id)
        return { ...d, wordIds: d.wordIds.filter((id) => id !== wordId) };
      if (d.id === targetDeckId && !d.wordIds.includes(wordId))
        return { ...d, wordIds: [...d.wordIds, wordId] };
      return d;
    });
    saveDecks(updated);
    setDecks(updated);
    setSelectedDeck(updated.find((d) => d.id === selectedDeck.id));
    setOpenWordMenu(null);
    setMenuAction(null);
  }

  function handleCopyToDeck(wordId, targetDeckId) {
    const updated = decks.map((d) => {
      if (d.id === targetDeckId && !d.wordIds.includes(wordId))
        return { ...d, wordIds: [...d.wordIds, wordId] };
      return d;
    });
    saveDecks(updated);
    setDecks(updated);
    setOpenWordMenu(null);
    setMenuAction(null);
  }

  function closeMenu() {
    setOpenWordMenu(null);
    setMenuAction(null);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {t("My Decks", "マイデッキ")}
        </h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          + {t("New Deck", "新規デッキ")}
        </button>
      </div>

      {decks.length === 0 ? (
        <p className="text-center text-slate-500 py-16">
          {t("No decks yet. Create one!", "デッキがまだありません。作成しましょう！")}
        </p>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-slate-800 rounded-xl p-5 flex items-center justify-between"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => openDeckDetail(deck)}
              >
                <h3 className="text-white font-medium">{deck.name}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {deck.wordIds.length}{" "}
                  {deck.wordIds.length === 1
                    ? t("word", "単語")
                    : t("words", "単語")}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/study/review?deck=${deck.id}`}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  {t("Study", "学習")}
                </Link>
                <button
                  onClick={(e) => handleDelete(deck.id, e)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  {t("Delete", "削除")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deck Detail Modal */}
      {selectedDeck && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 bg-black/60"
          onClick={closeMenu}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedDeck.name}</h2>
                <p className="text-slate-400 text-sm">
                  {selectedDeck.wordIds.length}{" "}
                  {selectedDeck.wordIds.length === 1
                    ? t("word", "単語")
                    : t("words", "単語")}
                </p>
              </div>
              <button
                onClick={() => setSelectedDeck(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-700 space-y-3 shrink-0">
              <div className="flex gap-2 overflow-x-auto">
                {MODAL_LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setModalLevel(l); setModalPage(0); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                      modalLevel === l
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
                  placeholder="Search words..."
                  value={modalSearch}
                  onChange={(e) => { setModalSearch(e.target.value); setModalPage(0); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={modalSort}
                  onChange={(e) => { setModalSort(e.target.value); setModalPage(0); }}
                  className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Word list */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalPaginated.length === 0 ? (
                <p className="text-center text-slate-500 py-12">
                  {modalFiltered.length === 0 && deckWords.length === 0
                    ? "This deck is empty."
                    : "No words match your filters"}
                </p>
              ) : (
                <div className="space-y-1">
                  {modalPaginated.map((w) => (
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

                      {/* Triple-dot menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenWordMenu(openWordMenu === w.id ? null : w.id);
                            setMenuAction(null);
                          }}
                          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                          </svg>
                        </button>
                        {openWordMenu === w.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={closeMenu} />
                            <div className="absolute right-0 top-full mt-1 z-30 bg-slate-700 rounded-lg shadow-xl py-1 min-w-44">
                              <button
                                onClick={() => handleRemoveFromDeck(w.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                              >
                                Remove from Deck
                              </button>
                              <button
                                onClick={() => setMenuAction(menuAction === "move" ? null : "move")}
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                              >
                                Move to Deck
                                <span className="float-right text-slate-400">→</span>
                              </button>
                              <button
                                onClick={() => setMenuAction(menuAction === "copy" ? null : "copy")}
                                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                              >
                                Copy to Deck
                                <span className="float-right text-slate-400">→</span>
                              </button>

                              {menuAction && (
                                <div className="border-t border-slate-600 mt-1 pt-1">
                                  {decks.filter((d) => d.id !== selectedDeck.id).length === 0 ? (
                                    <span className="block px-4 py-2 text-xs text-slate-400">
                                      No other decks
                                    </span>
                                  ) : (
                                    decks
                                      .filter((d) => d.id !== selectedDeck.id)
                                      .map((target) => (
                                        <button
                                          key={target.id}
                                          onClick={() =>
                                            menuAction === "move"
                                              ? handleMoveToDeck(w.id, target.id)
                                              : handleCopyToDeck(w.id, target.id)
                                          }
                                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                                        >
                                          {target.name}
                                        </button>
                                      ))
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {modalTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t border-slate-700 shrink-0">
                <button
                  onClick={() => setModalPage(Math.max(0, modalPage - 1))}
                  disabled={modalPage === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white disabled:opacity-40 hover:bg-slate-600 transition-colors"
                >
                  Prev
                </button>
                <span className="text-slate-400 text-sm">
                  {modalPage + 1} / {modalTotalPages}
                </span>
                <button
                  onClick={() => setModalPage(Math.min(modalTotalPages - 1, modalPage + 1))}
                  disabled={modalPage >= modalTotalPages - 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white disabled:opacity-40 hover:bg-slate-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
