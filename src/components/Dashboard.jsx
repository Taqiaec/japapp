import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { getDueCards, getTodayString } from "../utils/srs";
import { getStreak } from "../utils/storage";

export default function Dashboard({ words }) {
  const { t } = useLang();
  const today = getTodayString();
  const cardsLearned = words.filter((w) => w.lastReviewed === today).length;
  const dueCount = getDueCards(words).length;
  const streak = getStreak();
  const learningCount = words.filter((w) => w.status === "learning").length;
  const masteredCount = words.filter((w) => w.status === "mastered").length;

  const stats = [
    { label: t("Cards Learned Today", "今日学習したカード"), value: cardsLearned, icon: "📝" },
    { label: t("Streak", "ストリーク"), value: streak, icon: "🔥" },
    { label: t("Learning", "学習中"), value: learningCount, icon: "📖" },
    { label: t("Mastered", "マスター済"), value: masteredCount, icon: "✅" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">
        {t("Dashboard", "ダッシュボード")}
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-slate-800 rounded-xl p-6 text-center"
          >
            <div className="text-3xl mb-1">{icon}</div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {dueCount > 0 ? (
        <Link
          to="/study"
          className="block w-full py-4 rounded-xl text-center text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          {t("Start Studying", "学習を始める")}
        </Link>
      ) : (
        <p className="text-center text-slate-400 text-lg">
          {t("All done for today!", "今日は終わり！")}
        </p>
      )}
    </div>
  );
}
