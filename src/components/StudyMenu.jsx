import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { getDueCards } from "../utils/srs";

const jlptColors = {
  5: "bg-green-500 text-white",
  4: "bg-teal-500 text-white",
  3: "bg-yellow-500 text-black",
  2: "bg-orange-500 text-white",
  1: "bg-red-500 text-white",
};

const jlptLabels = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };

export default function StudyMenu({ words }) {
  const { t } = useLang();

  const allDue = getDueCards(words);
  const hardCards = words.filter(
    (w) => w.status !== "new" && (w.easeFactor <= 1.5 || w.lapses >= 3)
  );
  const easyCards = words.filter(
    (w) => w.status !== "new" && (w.easeFactor >= 2.3 || w.interval >= 14)
  );
  const newCards = words.filter((w) => w.status === "new");

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">
        {t("Study", "勉強")}
      </h1>

      {/* By JLPT Level */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {t("By JLPT Level", "JLPTレベル別")}
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          to="/study/review"
          className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors"
        >
          <div className="text-2xl font-bold text-white mb-1">{allDue.length}</div>
          <div className="text-sm text-slate-400">
            {t("All Due", "すべて")}
          </div>
        </Link>
        {[5, 4, 3, 2, 1].map((level) => {
          const due = getDueCards(words.filter((w) => w.jlptLevel === level));
          return (
            <Link
              key={level}
              to={`/study/review?level=${level}`}
              className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors"
            >
              <div className="text-2xl font-bold text-white mb-1">
                {due.length}
              </div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${jlptColors[level]}`}
              >
                {jlptLabels[level]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* By Difficulty */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {t("By Type", "タイプ別")}
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          to="/study/review?difficulty=hard"
          className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors"
        >
          <div className="text-2xl font-bold text-red-400 mb-1">
            {hardCards.length}
          </div>
          <div className="text-sm text-slate-400">
            {t("Hard Cards", "難しい")}
          </div>
        </Link>
        <Link
          to="/study/review?difficulty=easy"
          className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors"
        >
          <div className="text-2xl font-bold text-green-400 mb-1">
            {easyCards.length}
          </div>
          <div className="text-sm text-slate-400">
            {t("Easy Cards", "簡単な")}
          </div>
        </Link>
        <Link
          to="/study/review?difficulty=new"
          className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors"
        >
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {newCards.length}
          </div>
          <div className="text-sm text-slate-400">
            {t("New Cards", "新しい")}
          </div>
        </Link>
      </div>

      {/* My Words */}
      <Link
        to="/my-words"
        className="block w-full py-4 rounded-xl text-center text-lg font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors mb-8"
      >
        <span className="mr-2">{t("My Words", "マイ単語")}</span>
        <span className="text-slate-400 text-sm">
          ({words.filter((w) => w.status !== "new").length} {t("words", "語")})
        </span>
      </Link>

      {/* By Decks */}
      {(() => {
        let decks = [];
        try {
          const oldData = localStorage.getItem("goichou_lists");
          if (oldData && !localStorage.getItem("goichou_decks")) {
            localStorage.setItem("goichou_decks", oldData);
            localStorage.removeItem("goichou_lists");
          }
          decks = JSON.parse(localStorage.getItem("goichou_decks")) || [];
        } catch {}
        if (decks.length === 0) return null;
        return (
          <>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {t("By Deck", "デッキ別")}
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {decks.map((deck) => {
                const ids = new Set(deck.wordIds);
                const deckWords = words.filter((w) => ids.has(w.id));
                const due = getDueCards(deckWords);
                return (
                  <Link
                    key={deck.id}
                    to={`/study/review?deck=${deck.id}`}
                    className="bg-slate-800 rounded-xl p-4 text-center hover:bg-slate-700 transition-colors"
                  >
                    <div className="text-2xl font-bold text-white mb-1">
                      {due.length}
                    </div>
                    <div className="text-sm text-slate-400 truncate">
                      {deck.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        );
      })()}

      <Link
        to="/decks"
        className="block w-full py-4 rounded-xl text-center text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
      >
        {t("Manage Decks", "デッキ管理")}
      </Link>
    </div>
  );
}
