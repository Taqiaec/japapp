import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

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
  const { user, signIn, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-slate-700 rounded-lg shadow-xl py-1 min-w-40">
                    <span className="block px-4 py-2 text-sm text-slate-300 truncate">{user.displayName || user.email}</span>
                    <hr className="border-slate-600" />
                    <button
                      onClick={() => { setShowUserMenu(false); signOut(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={signIn}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
