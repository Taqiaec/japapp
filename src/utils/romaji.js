const HIRAGANA = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
};

const YOON = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};

function buildKataToHira() {
  const map = {};
  for (let code = 0x30a1; code <= 0x30f6; code++) {
    const kata = String.fromCharCode(code);
    const hira = String.fromCharCode(code - 0x60);
    map[kata] = hira;
  }
  return map;
}
const KATA_TO_HIRA = buildKataToHira();

function normalizeKana(s) {
  let out = "";
  for (const ch of s) {
    out += KATA_TO_HIRA[ch] || ch;
  }
  return out;
}

export function toRomaji(str) {
  const kana = normalizeKana(str);
  let result = "";
  let i = 0;
  while (i < kana.length) {
    // Skip long vowel mark
    if (kana[i] === "ー") { i++; continue; }
    if (kana[i] === "っ") {
      const next = kana[i + 1];
      if (next && HIRAGANA[next]) result += HIRAGANA[next][0];
      i++;
      continue;
    }
    if (i + 1 < kana.length) {
      const pair = kana[i] + kana[i + 1];
      if (YOON[pair]) {
        result += YOON[pair];
        i += 2;
        continue;
      }
    }
    if (HIRAGANA[kana[i]]) {
      result += HIRAGANA[kana[i]];
    } else {
      result += kana[i];
    }
    i++;
  }
  return result;
}
