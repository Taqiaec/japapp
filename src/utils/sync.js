import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  collection,
} from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_SRS } from "./srs";

const SRS_FIELDS = ["interval", "easeFactor", "dueDate", "reps", "lapses", "status", "lastReviewed"];

function wordSrsData(word) {
  const data = {};
  for (const f of SRS_FIELDS) data[f] = word[f] ?? DEFAULT_SRS[f] ?? null;
  return data;
}

export async function syncToFirestore(uid, dirtyWordIds, allWords, decks, settings) {
  const batch = writeBatch(db);

  // Write dirty words
  for (const id of dirtyWordIds) {
    const word = allWords.find((w) => w.id === id);
    if (!word || word.status === "new") continue;
    const ref = doc(db, "users", uid, "words", id);
    batch.set(ref, wordSrsData(word));
  }

  // Write decks
  if (decks) {
    batch.set(doc(db, "users", uid, "data", "decks"), { decks });
  }

  // Write settings
  if (settings) {
    batch.set(doc(db, "users", uid, "data", "settings"), settings);
  }

  await batch.commit();
}

export async function loadFromFirestore(uid) {
  // Load studied words
  const wordsSnap = await getDocs(collection(db, "users", uid, "words"));
  const remoteWords = {};
  wordsSnap.forEach((d) => {
    remoteWords[d.id] = d.data();
  });

  // Load decks
  const decksSnap = await getDoc(doc(db, "users", uid, "data", "decks"));
  const decks = decksSnap.exists() ? decksSnap.data().decks || [] : [];

  // Load settings
  const settingsSnap = await getDoc(doc(db, "users", uid, "data", "settings"));
  const settings = settingsSnap.exists() ? settingsSnap.data() : null;

  return { remoteWords, decks, settings };
}

export function mergeWords(localWords, remoteWords) {
  if (!localWords) return localWords;
  return localWords.map((w) => {
    const remote = remoteWords[w.id];
    if (!remote) return w;
    return { ...w, ...remote };
  });
}
