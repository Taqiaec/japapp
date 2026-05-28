import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { loadVocabulary } from "./utils/dataLoader";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import LoadingScreen from "./components/LoadingScreen";
import Dashboard from "./components/Dashboard";
import StudyMenu from "./components/StudyMenu";
import StudySession from "./components/StudySession";
import VocabBrowser from "./components/VocabBrowser";
import DebugView from "./components/DebugView";
import Settings from "./components/Settings";
import MyWords from "./components/MyWords";
import Decks from "./components/Decks";

function Layout() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <Outlet />
    </div>
  );
}

function App() {
  const [words, setWords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVocabulary().then(setWords).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  function handleWordsUpdate(updated) {
    setWords(updated);
  }

  return (
    <BrowserRouter>
      <LanguageProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard words={words} />} />
          <Route path="study" element={<StudyMenu words={words} />} />
          <Route path="study/review" element={<StudySession words={words} onWordsUpdate={handleWordsUpdate} />} />
          <Route path="browse" element={<VocabBrowser words={words} />} />
          <Route path="settings" element={<Settings words={words} />} />
          <Route path="my-words" element={<MyWords words={words} />} />
          <Route path="decks" element={<Decks words={words} />} />
          <Route path="debug" element={<DebugView words={words} />} />
        </Route>
      </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
