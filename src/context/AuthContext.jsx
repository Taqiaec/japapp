import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { syncToFirestore, loadFromFirestore, mergeWords } from "../utils/sync";
import { saveWords, loadWords, getDirtyWordIds, clearDirtyWords } from "../utils/storage";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const wordsRef = useRef(null);
  const onWordsUpdateRef = useRef(null);

  const setWordsGetter = useCallback((getter) => {
    wordsRef.current = getter;
  }, []);

  const setWordsUpdateCallback = useCallback((cb) => {
    onWordsUpdateRef.current = cb;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load progress from Firestore and merge
        try {
          const { remoteWords, decks, settings } = await loadFromFirestore(firebaseUser.uid);

          // Apply remote settings to localStorage
          if (settings) {
            if (settings.dailyLimit != null) localStorage.setItem("goichou_daily_limit", String(settings.dailyLimit));
            if (settings.furigana) localStorage.setItem("goichou_furigana", settings.furigana);
            if (settings.autoAdvance != null) localStorage.setItem("goichou_autoadvance", String(settings.autoAdvance));
            if (settings.streak != null) localStorage.setItem("goichou_streak", String(settings.streak));
            if (settings.lastStudyDate) localStorage.setItem("goichou_last_study", settings.lastStudyDate);
            if (settings.lang) localStorage.setItem("goichou_lang", settings.lang);
          }

          // Apply remote decks
          if (decks.length > 0) {
            localStorage.setItem("goichou_decks", JSON.stringify(decks));
          }

          // Merge remote words into local
          const localWords = wordsRef.current?.() || loadWords();
          if (localWords && Object.keys(remoteWords).length > 0) {
            const merged = mergeWords(localWords, remoteWords);
            saveWords(merged);
            if (onWordsUpdateRef.current) onWordsUpdateRef.current(merged);
          }
        } catch (err) {
          console.error("[Auth] Failed to load from Firestore:", err);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("[Auth] Sign-in failed:", err);
    }
  }, []);

  const signOut = useCallback(async () => {
    // Sync before signing out
    if (user) {
      try {
        const words = wordsRef.current?.() || loadWords();
        const dirtyIds = getDirtyWordIds();
        if (dirtyIds.length > 0 || words) {
          const decks = JSON.parse(localStorage.getItem("goichou_decks") || "[]");
          const settings = {
            dailyLimit: parseInt(localStorage.getItem("goichou_daily_limit") || "15", 10),
            furigana: localStorage.getItem("goichou_furigana") || "flip",
            autoAdvance: localStorage.getItem("goichou_autoadvance") === "true",
            streak: parseInt(localStorage.getItem("goichou_streak") || "0", 10),
            lastStudyDate: localStorage.getItem("goichou_last_study") || null,
            lang: localStorage.getItem("goichou_lang") || "en",
          };
          await syncToFirestore(user.uid, dirtyIds, words || [], decks, settings);
          clearDirtyWords();
        }
      } catch (err) {
        console.error("[Auth] Sync before sign-out failed:", err);
      }
    }
    await firebaseSignOut(auth);
  }, [user]);

  const syncNow = useCallback(async () => {
    if (!user) return;
    try {
      const words = wordsRef.current?.() || loadWords();
      const dirtyIds = getDirtyWordIds();
      const decks = JSON.parse(localStorage.getItem("goichou_decks") || "[]");
      const settings = {
        dailyLimit: parseInt(localStorage.getItem("goichou_daily_limit") || "15", 10),
        furigana: localStorage.getItem("goichou_furigana") || "flip",
        autoAdvance: localStorage.getItem("goichou_autoadvance") === "true",
        streak: parseInt(localStorage.getItem("goichou_streak") || "0", 10),
        lastStudyDate: localStorage.getItem("goichou_last_study") || null,
        lang: localStorage.getItem("goichou_lang") || "en",
      };
      await syncToFirestore(user.uid, dirtyIds, words || [], decks, settings);
      clearDirtyWords();
    } catch (err) {
      console.error("[Auth] Sync failed:", err);
    }
  }, [user]);

  const value = {
    user,
    authLoading,
    signIn,
    signOut,
    syncNow,
    setWordsGetter,
    setWordsUpdateCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
