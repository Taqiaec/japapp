import { writeFileSync, readFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { gunzipSync } from 'zlib';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');

const JLPT_ALL_URL =
  'https://raw.githubusercontent.com/Bluskyo/JLPT_Vocabulary/main/data/vocab/results/JLPT_vocab_ALL.json';

const JMDICT_TGZ_URL =
  'https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260525143653/jmdict-eng-common-3.6.2%2B20260525143653.json.tgz';

const TATOEBA_JPN_URL =
  'https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences.tsv.bz2';

async function fetchJson(url) {
  console.log(`  Fetching: ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

async function fetchBuffer(url) {
  console.log(`  Fetching: ${url}`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return Buffer.from(await resp.arrayBuffer());
}

function untarJson(gzBuffer) {
  const buf = gunzipSync(gzBuffer);
  let offset = 0;

  while (offset < buf.length - 512) {
    const header = buf.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeStr = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '');
    const size = parseInt(sizeStr, 8) || 0;
    const typeFlag = String.fromCharCode(header[156]);

    const data = buf.subarray(offset + 512, offset + 512 + size);

    if (typeFlag === '0' && name.endsWith('.json')) {
      return JSON.parse(data.toString('utf8'));
    }

    offset += 512 + Math.ceil(size / 512) * 512;
  }

  throw new Error('No JSON file found in tar archive');
}

function buildJlptLookup(jlptAll) {
  const lookup = new Map();

  for (const [word, entries] of Object.entries(jlptAll)) {
    const readings = [];
    let level = null;

    for (const entry of entries) {
      readings.push(entry.reading);
      if (level === null || entry.level < level) {
        level = entry.level;
      }
    }

    lookup.set(word, { readings, level });
  }

  return lookup;
}

function normalizeEntry(jmdictEntry, jlptLookup) {
  const { id, kanji = [], kana = [], sense = [] } = jmdictEntry;

  const kanjiForms = kanji.map(k => k.text);
  const kanaForms = kana.map(k => k.text);

  let match = null;

  for (const kForm of kanjiForms) {
    const jlpt = jlptLookup.get(kForm);
    if (jlpt) {
      for (const kanaForm of kanaForms) {
        if (jlpt.readings.includes(kanaForm)) {
          match = { word: kForm, reading: kanaForm, level: jlpt.level };
          break;
        }
      }
      if (match) break;
      match = { word: kForm, reading: kanaForms[0] || kForm, level: jlpt.level };
      break;
    }
  }

  if (!match) {
    for (const kanaForm of kanaForms) {
      const jlpt = jlptLookup.get(kanaForm);
      if (jlpt && jlpt.readings.includes(kanaForm)) {
        match = { word: kanaForm, reading: kanaForm, level: jlpt.level };
        break;
      }
    }
  }

  if (!match) return null;

  const glossText = sense[0]?.gloss?.[0]?.text || '';
  const pos = sense[0]?.partOfSpeech?.[0] || '';

  return {
    id: String(id),
    kanji: match.word,
    reading: match.reading,
    meaning: glossText,
    jlptLevel: match.level,
    pos,
  };
}

function bz2ToLines(buffer) {
  const tmpBz2 = join(PROJECT_ROOT, '.tmp_jpn.bz2');
  const tmpTsv = join(PROJECT_ROOT, '.tmp_jpn.tsv');
  try {
    writeFileSync(tmpBz2, buffer);
    execSync(`bzip2 -d -c "${tmpBz2}" > "${tmpTsv}"`, { stdio: 'pipe' });
    const data = readFileSync(tmpTsv, 'utf8');
    return data.split('\n').filter(l => l.length > 0);
  } finally {
    try { execSync(`rm -f "${tmpBz2}" "${tmpTsv}"`); } catch {}
  }
}

async function attachExamples(vocab) {
  console.log('[4/4] Fetching example sentences from Tatoeba...');

  // Build search terms from vocabulary (kanji and reading, >= 2 chars)
  const termMap = new Map();
  for (const w of vocab) {
    const terms = [...new Set([w.kanji, w.reading].filter(Boolean))];
    for (const t of terms) {
      if (t.length >= 2) {
        if (!termMap.has(t)) termMap.set(t, []);
        termMap.get(t).push(w);
      }
    }
  }

  const allTerms = [...termMap.keys()].sort((a, b) => b.length - a.length);
  const escaped = allTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(escaped.join('|'), 'g');

  // Download Japanese sentences
  const jpnBuf = await fetchBuffer(TATOEBA_JPN_URL);
  console.log('  Decompressing...');
  const jpnLines = bz2ToLines(jpnBuf);
  console.log(`  Loaded ${jpnLines.length} Japanese sentences`);

  // Match sentences to vocabulary (up to 2 examples per word)
  const targetCount = 2;
  const examplesPerWord = new Map();

  for (const line of jpnLines) {
    const tabIdx = line.indexOf('\t');
    if (tabIdx === -1) continue;
    const secondTab = line.indexOf('\t', tabIdx + 1);
    if (secondTab === -1) continue;
    const text = line.slice(secondTab + 1);

    const matches = text.match(regex);
    if (!matches) continue;

    const seen = new Set();
    for (const match of matches) {
      if (seen.has(match)) continue;
      seen.add(match);
      const words = termMap.get(match);
      if (!words) continue;
      for (const w of words) {
        if (!examplesPerWord.has(w.id)) examplesPerWord.set(w.id, []);
        const arr = examplesPerWord.get(w.id);
        if (arr.length < targetCount) {
          arr.push({ japanese: text });
        }
      }
    }
  }

  // Attach examples to vocab
  for (const w of vocab) {
    w.examples = examplesPerWord.get(w.id) || [];
  }

  const withExamples = vocab.filter(w => w.examples.length > 0).length;
  console.log(`  ${withExamples}/${vocab.length} words have example sentences`);
}

async function main() {
  console.log('=== Goi-chou Data Preprocessing ===\n');

  console.log('[1/3] Loading JLPT vocabulary...');
  const jlptAll = await fetchJson(JLPT_ALL_URL);
  console.log(`  Loaded ${Object.keys(jlptAll).length} JLPT entries`);

  console.log('[2/3] Loading JMdict (eng-common)...');
  const tgzBuffer = await fetchBuffer(JMDICT_TGZ_URL);
  console.log('  Extracting...');
  const jmdictData = untarJson(tgzBuffer);
  const jmdictEntries = jmdictData.words || jmdictData;
  console.log(`  Loaded ${jmdictEntries.length} JMdict entries`);

  console.log('[3/3] Matching JMdict to JLPT...');
  const jlptLookup = buildJlptLookup(jlptAll);

  const vocab = [];
  for (const entry of jmdictEntries) {
    const result = normalizeEntry(entry, jlptLookup);
    if (result) {
      vocab.push(result);
    }
  }

  console.log(`  Matched ${vocab.length} words`);

  const perLevel = {};
  for (const v of vocab) {
    perLevel[v.jlptLevel] = (perLevel[v.jlptLevel] || 0) + 1;
  }
  console.log('  Per level:', perLevel);

  // Fetch example sentences
  try {
    await attachExamples(vocab);
  } catch (err) {
    console.log(`  Warning: Could not fetch examples (${err.message}), continuing without`);
  }

  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const outputPath = join(PUBLIC_DIR, 'jlpt-vocab.json');
  writeFileSync(outputPath, JSON.stringify(vocab));
  const fileSize = statSync(outputPath).size;
  console.log(`\nOutput: ${outputPath}`);
  console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
