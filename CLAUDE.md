# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

語彙帳 (Goi-chou) — Japanese vocabulary SRS web app. React 19 + Vite 8 + Tailwind v4. Dark theme (slate-900/800). 7,409 JLPT vocabulary words with SM-2 spaced repetition. Electron wrapper in `electron/`.

## Commands

```bash
npm run dev                  # Start Vite dev server
npm run build                # Production build
npm run lint                 # ESLint
npm run preview              # Preview production build
node scripts/processData.mjs # Re-generate public/jlpt-vocab.json from JMdict + JLPT + Tatoeba
```

Pipeline must run via Bash (Git Bash / MSYS2) — requires `bzip2` for Tatoeba decompression. Run if `public/jlpt-vocab.json` missing or outdated.

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | Dashboard | 4 stat cards (Cards Learned Today, Streak, Learning, Mastered), CTA to `/study` |
| `/study` | StudyMenu | Study option selection: JLPT level tiles, difficulty (hard/easy/new), custom decks |
| `/study/review` | StudySession | Flashcard review. Params: `?level=`, `?difficulty=hard\|easy\|new`, `?deck=` |
| `/my-words` | MyWords | Browse studied words (`status !== "new"`) with mastery progress bars, JLPT tabs, search, pagination 50/page |
| `/browse` | VocabBrowser | Search/filter/paginate all 7,409 words, add to study queue or decks |
| `/settings` | Settings | Daily limit, furigana display, auto-advance, reset progress, data info |
| `/decks` | Decks | Create/manage/delete named word collections, study button links to `/study/review?deck=` |
| `/debug` | DebugView | Raw word data display |

## Architecture

**Data pipeline** (one-shot Node.js): `scripts/processData.mjs` — 4 steps:
1. Fetch JLPT vocab (Bluskyo JLPT_vocab_ALL.json)
2. Fetch JMdict-eng-common (jmdict-simplified JSON .tgz, not XML)
3. Match entries by word+reading, output normalized array with `pos` from JMdict
4. Fetch Tatoeba Japanese sentences, match to vocab, attach as `examples[{japanese}]`

Output: `public/jlpt-vocab.json` (~2MB). Word shape includes `pos` field and `examples` array.

**App shell**: `App.jsx` → `BrowserRouter` → `LanguageProvider` → `Layout` (Navbar + Outlet) → Routes. Words loaded once via `loadVocabulary()`, passed as prop to all routes. `StudySession` calls `onWordsUpdate(loadWords())` only at session end.

**Data layer** (`src/utils/`):
- `dataLoader.js` — `loadVocabulary()`: returns localStorage cache (`goichou_words`) if present, else fetches `/jlpt-vocab.json`, merges `DEFAULT_SRS`, saves to localStorage
- `storage.js` — localStorage CRUD: `saveWords()`, `loadWords()`, `updateWord(id, updates)`. Streak: `getStreak()`, `updateStreak()`, `getLastStudyDate()`
- `srs.js` — `DEFAULT_SRS`, `calculateNextReview(card, grade)` (SM-2), `getDueCards(allWords, limit?)`, `getMasteryProgress(word)`
- `romaji.js` — `toRomaji(kana)`: Hepburn conversion for search

**SRS algorithm** (`srs.js`):
- Grade 0 (Again): interval=1, lapses++, easeFactor-=0.2 (min 1.3), status="learning"
- Grade 1 (Hard): interval unchanged, easeFactor-=0.15 (min 1.3), status="learning"
- Grade 2 (Good): interval = ceil(interval * easeFactor), status transitions: learning/review/mastered based on interval
- Grade 3 (Easy): interval = ceil(interval * easeFactor * 1.3), same status transition
- Due cards sorted: learning → new → review, capped by daily limit (default 15)

**Word shape** (in `goichou_words`):
```js
{ id: "uuid", kanji: "言葉", reading: "ことば", meaning: "word", jlptLevel: 3,
  pos: "n", examples: [{ japanese: "..." }],
  interval: 1, easeFactor: 2.5, dueDate: null, reps: 0, lapses: 0,
  status: "new", lastReviewed: null }
```

POS codes from JMdict (e.g. `n`, `v1`, `adj-na`, `adv`). `pos` can be empty string for unmatched words.

## Components

- `Navbar.jsx` — Sticky top nav (Study, Browse, Decks, Settings) + JP/EN toggle via `useLang()`
- `Dashboard.jsx` — Counts cards learned today, streak, learning/mastered counts. CTA to `/study`
- `Flashcard.jsx` — Flip card (CSS 3D). Front: kanji + JLPT badge. Back: reading, meaning, POS badge, Jisho link (`https://jisho.org/search/{word}`), inline example sentences from data, 4 grade buttons, "Save to Deck" dropdown. `onAnswer(0-3)` callback. Furigana setting controls reading visibility.
- `StudyMenu.jsx` — JLPT level tiles, difficulty options, custom decks. Links to `/study/review?params`
- `StudySession.jsx` — Drives flashcard flow. Filters by `?level=`, `?difficulty=`, `?deck=`. Auto-advance (1000ms). After grading: "Tap to continue" until Space/Enter. `onWordsUpdate` called at session end only. Tracks `gradeHistory`.
- `SessionRecap.jsx` — Post-study recap. Props: `gradeHistory`, `totalCards`. Grade counts in 4 columns, add-to-deck per grade and per word, collapsible detail view.
- `MyWords.jsx` — Studied words browser with mastery bars, JLPT tabs, search, pagination 50/page
- `VocabBrowser.jsx` — Full vocabulary browser with search (kanji/reading/meaning/romaji), JLPT tabs, status filter, pagination 50/page
- `Settings.jsx` — Daily limit (5-50), furigana (always/flip/never), auto-advance toggle, reset progress. NOTE: `Section` component defined inside render.
- `Decks.jsx` — Create/list/delete named decks with detail modal (word list, JLPT filter, search, sort, pagination, progress bars). Per-word: remove from deck, move/copy to another deck.
- `LoadingScreen.jsx` — Shown during vocabulary load

## Styling

Tailwind v4 via `@import "tailwindcss"`, `@tailwindcss/vite` plugin (no config file). Dark theme: `bg-slate-900` page, `bg-slate-800` card surfaces, `text-slate-400/500` muted, `indigo-600` CTAs. Card flip CSS in `index.css`.

**Tailwind JIT limitation**: Dynamic class strings NOT detected by JIT scanner. Add comment safelist at top of file listing all dynamic classes.

**No `lucide-react`**: Not installed. All icons must be inline SVG elements.

## LocalStorage Keys

| Key | Purpose |
|---|---|
| `goichou_words` | All vocabulary with SRS data (~7,400 entries) |
| `goichou_decks` | Custom word decks `[{ id, name, createdAt, wordIds }]` |
| `goichou_streak` | Consecutive study days count |
| `goichou_last_study` | Last study date (YYYY-MM-DD) |
| `goichou_lang` | "en" or "jp" |
| `goichou_daily_limit` | New cards per day (default 15) |
| `goichou_furigana` | "always", "flip" (default), or "never" |
| `goichou_autoadvance` | "true" or "false" |

## Data format details

- JMdict simplified entry: `{ id, kanji: [{text}], kana: [{text}], sense: [{ partOfSpeech: [], gloss: [{text}] }] }`. Field is `gloss`, not `glosses`.
- JLPT source: `{ "word": [{ reading: "kana", level: 1-5 }] }` keyed by orthographic form.
- Tatoeba Japanese sentences: TSV `id\tjpn\ttext`, ~248K sentences, downloaded per-language.
- `jlptLevel` 1-5 (N1=advanced, N5=beginner). Badge colors: N5=green, N4=teal, N3=yellow/black, N2=orange, N1=red.

## Add-to-Deck Pattern

Deck CRUD (`loadDecks`/`saveDecks`) duplicated inline across `Flashcard.jsx`, `SessionRecap.jsx`, `Decks.jsx`, `MyWords.jsx`, and `VocabBrowser.jsx`. Each reads/writes `goichou_decks` directly. Replicate pattern — consistency over DRY.

## Known ESLint Issues

Do NOT fix unless touching affected code:
- `Settings.jsx`: `Section` component defined inside render (react-hooks/static-components)
- `StudySession.jsx`: `advanceRef.current = advance` during render (react-hooks/refs)
- `MyWords.jsx`, `VocabBrowser.jsx`: `useMemo(loadDecks, ...)` function ref, not inline arrow (react-hooks/use-memo)
- `LanguageContext.jsx`: exports `useLang` alongside components (react-refresh/only-export-components)
- `StudyMenu.jsx`: empty block statement for `// empty catch`
- `electron/main.js`: `process` not defined (no-undef — Electron context)
