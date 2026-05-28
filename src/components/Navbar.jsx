import { Link, useLocation } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

const links = [
  { to: "/study", label: "Study" },
  { to: "/browse", label: "Browse" },
  { to: "/my-words", label: "My Words" },
  { to: "/decks", label: "Decks" },
  { to: "/settings", label: "Settings" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { lang, toggleLang } = useLang();

  return (
    <nav className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white tracking-wide">
          語彙帳
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === to || pathname.startsWith(to + "/")
                  ? "text-white bg-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={toggleLang}
            className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            {lang === "en" ? "JP" : "EN"}
          </button>
        </div>
      </div>
    </nav>
  );
}
