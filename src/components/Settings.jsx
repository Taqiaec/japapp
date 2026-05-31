import { useState } from "react";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { saveWords, loadWords } from "../utils/storage";

export default function Settings({ words }) {
  const { t } = useLang();
  const { user, signIn, signOut, syncNow } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(() => {
    const raw = localStorage.getItem("goichou_daily_limit");
    return raw ? parseInt(raw, 10) : 15;
  });
  const [furigana, setFurigana] = useState(() => {
    return localStorage.getItem("goichou_furigana") || "flip";
  });
  const [autoAdvance, setAutoAdvance] = useState(() => {
    return localStorage.getItem("goichou_autoadvance") === "true";
  });

  function handleDailyLimit(val) {
    const n = Math.max(5, Math.min(50, parseInt(val, 10) || 15));
    setDailyLimit(n);
    localStorage.setItem("goichou_daily_limit", String(n));
  }

  function handleFurigana(val) {
    setFurigana(val);
    localStorage.setItem("goichou_furigana", val);
  }

  function handleAutoAdvance(val) {
    setAutoAdvance(val);
    localStorage.setItem("goichou_autoadvance", String(val));
  }

  function handleReset() {
    if (!window.confirm(t("Reset all SRS progress? This cannot be undone.", "全てのSRS進捗をリセットしますか？この操作は元に戻せません。"))) return;

    const allWords = loadWords();
    if (!allWords) return;

    for (const w of allWords) {
      w.status = "new";
      w.dueDate = null;
      w.interval = 1;
      w.reps = 0;
      w.lapses = 0;
      w.easeFactor = 2.5;
    }
    saveWords(allWords);

    localStorage.removeItem("goichou_streak");
    localStorage.removeItem("goichou_last_study");

    window.location.reload();
  }

  const Section = ({ title, children }) => (
    <div className="bg-slate-800 rounded-xl p-6 mb-4">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
      <h1 className="text-2xl font-bold text-white mb-6">
        {t("Settings", "設定")}
      </h1>

      <Section title={t("Daily New Card Limit", "1日の新規カード数")}>
        <input
          type="number"
          min={5}
          max={50}
          value={dailyLimit}
          onChange={(e) => handleDailyLimit(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
        />
        <p className="text-slate-400 text-sm mt-2">
          {t("How many new cards to show per day (5-50)", "1日に表示する新規カード数 (5-50)")}
        </p>
      </Section>

      <Section title={t("Furigana Display", "ふりがな表示")}>
        <div className="space-y-3">
          {[
            { value: "always", label: t("Always show", "常に表示") },
            { value: "flip", label: t("Show on flip", "裏返し時に表示") },
            { value: "never", label: t("Never", "表示しない") },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="furigana"
                checked={furigana === value}
                onChange={() => handleFurigana(value)}
                className="accent-indigo-500"
              />
              <span className="text-white">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title={t("Auto-Advance", "自動送り")}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => handleAutoAdvance(e.target.checked)}
            className="w-5 h-5 rounded accent-indigo-500"
          />
          <span className="text-white">
            {t("Auto-advance to next card after grading", "採点後、自動的に次のカードに進む")}
          </span>
        </label>
      </Section>

      <Section title={t("Reset Progress", "進捗リセット")}>
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl text-center font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
        >
          {t("Reset All Progress", "全ての進捗をリセット")}
        </button>
      </Section>

      <Section title={t("Data Info", "データ情報")}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">{t("Total words", "総単語数")}</span>
            <span className="text-white font-medium">{words.length.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t("Last data load", "最終データ読み込み")}</span>
            <span className="text-slate-300">N/A</span>
          </div>
        </div>
      </Section>

      <Section title={t("Account", "アカウント")}>
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL}
                alt=""
                className="w-10 h-10 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-white font-medium">{user.displayName}</p>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await syncNow();
                  } finally {
                    setSyncing(false);
                  }
                }}
                disabled={syncing}
                className="flex-1 py-3 rounded-xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {syncing ? t("Syncing...", "同期中...") : t("Sync Now", "今すぐ同期")}
              </button>
              <button
                onClick={signOut}
                className="flex-1 py-3 rounded-xl text-center font-bold text-white bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                {t("Sign Out", "サインアウト")}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-4">
              {t("Sign in to sync progress across devices", "デバイス間で進捗を同期するにはサインインしてください")}
            </p>
            <button
              onClick={signIn}
              className="w-full py-3 rounded-xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              {t("Sign in with Google", "Googleでサインイン")}
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}
