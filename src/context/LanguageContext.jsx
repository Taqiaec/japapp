import { createContext, useContext, useState, useEffect } from "react";

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("goichou_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("goichou_lang", lang);
  }, [lang]);

  function toggleLang() {
    setLang((prev) => (prev === "en" ? "jp" : "en"));
  }

  function t(en, jp) {
    return lang === "en" ? en : jp;
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
