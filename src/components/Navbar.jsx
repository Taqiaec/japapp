import { useState, useEffect } from "react";
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

// Safelist for Tailwind JIT: text-slate-400 hover:text-white hover:bg-slate-700/50

export default function Navbar() {
  const { pathname } = useLocation();
  const { lang, toggleLang } = useLang();
  const { user, signIn, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setShowMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white tracking-wide">
          語彙帳
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
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
        </div>

        {/* Right side: lang + user */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            {lang === "en" ? "JP" : "EN"}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center px-1 py-1 rounded-lg hover:bg-slate-700/50 transition-colors"
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Sign in
            </button>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-slate-700/50 transition-colors"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-300">
              {showMenu ? (
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {showMenu && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 pb-3 pt-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === to || pathname.startsWith(to + "/")
                  ? "text-white bg-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
