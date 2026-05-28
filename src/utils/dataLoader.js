import { DEFAULT_SRS } from './srs';
import { saveWords, loadWords } from './storage';

export async function loadVocabulary() {
  const cached = loadWords();
  if (cached) return cached;

  const resp = await fetch('/jlpt-vocab.json');
  if (!resp.ok) {
    throw new Error(`Failed to load vocabulary: HTTP ${resp.status}`);
  }
  const words = await resp.json();

  const wordsWithSrs = words.map(w => ({
    ...w,
    ...DEFAULT_SRS,
  }));

  saveWords(wordsWithSrs);
  return wordsWithSrs;
}
