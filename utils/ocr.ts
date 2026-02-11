/**
 * OCR Utility
 *
 * Usa OCR.space (API gratuita) per estrarre TUTTI i dati
 * identificativi di una carta Pokémon:
 *
 *   - Nome (es. "Bulbasaur")
 *   - Codice carta (es. "001/165")
 *   - HP (es. "70")
 *   - Codice set (es. "MEW", "SVI", "OBF")
 *   - Regulation mark (es. "G", "H")
 *   - Lingua (es. "it", "en")
 *
 * Flusso: immagine base64 → OCR.space API → parse completo
 */

// ── OCR.space free API ───────────────────────────────────────────
const OCR_API_URL = 'https://api.ocr.space/parse/image';
const OCR_API_KEY = 'helloworld'; // Free test key (25k req/mese)

// ── Tipi ─────────────────────────────────────────────────────────

export interface OcrResult {
  /** Testo completo estratto dall'OCR */
  fullText: string;
  /** Nome Pokémon (es. "Bulbasaur") */
  cardName: string | null;
  /** Numero carta nel set, padded (es. "001") */
  cardNumber: string | null;
  /** Totale carte nel set (es. "165") */
  setTotal: string | null;
  /** Codice set stampato (es. "MEW", "SVI", "OBF") */
  setCode: string | null;
  /** Regulation mark (es. "G", "H", "F") */
  regulationMark: string | null;
  /** Lingua della carta (es. "it", "en", "fr") */
  language: string | null;
  /** HP / Punti Salute */
  hp: string | null;
}

// ── Cloud OCR ────────────────────────────────────────────────────

export async function cloudOcr(
  base64Image: string
): Promise<OcrResult | null> {
  try {
    console.log('[OCR] Invio immagine a OCR.space...');

    const body = new FormData();
    body.append(
      'base64Image',
      `data:image/jpeg;base64,${base64Image}`
    );
    body.append('language', 'ita');
    body.append('OCREngine', '2');
    body.append('isTable', 'false');
    body.append('scale', 'true');
    body.append('isOverlayRequired', 'false');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: { apikey: OCR_API_KEY },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[OCR] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    const parsedText: string | undefined =
      data?.ParsedResults?.[0]?.ParsedText;

    if (!parsedText || parsedText.trim().length === 0) {
      console.warn('[OCR] Nessun testo trovato');
      return null;
    }

    // Log testo COMPLETO (non troncato) per debug
    console.log('[OCR] === TESTO COMPLETO ===');
    console.log(parsedText.replace(/\n/g, ' | '));
    console.log('[OCR] === FINE TESTO ===');

    const parsed = parseCardInfo(parsedText);
    return { fullText: parsedText, ...parsed };
  } catch (error) {
    console.warn('[OCR] Cloud OCR fallito:', error);
    return null;
  }
}

// ── Codici set noti (Pokémon TCG) ────────────────────────────────
// Usati per riconoscere il codice set nel testo OCR
const KNOWN_SET_CODES = new Set([
  // Scarlet & Violet
  'SVI', 'PAL', 'OBF', 'MEW', 'PAR', 'TEF', 'TWM', 'SFA', 'SCR',
  'SSP', 'PRE', 'JTG',
  // Sword & Shield
  'SSH', 'RCL', 'DAA', 'VIV', 'BST', 'CRE', 'EVS', 'FST', 'BRS',
  'ASR', 'LOR', 'SIT', 'CRZ',
  // Sun & Moon
  'SUM', 'GRI', 'BUS', 'SHL', 'CIN', 'UPR', 'FLI', 'CES', 'LOT',
  'TEU', 'UNB', 'UNM', 'CEC',
  // XY & older
  'XY', 'PHF', 'PRC', 'ROS', 'AOR', 'BKT', 'BKP', 'FCO', 'STS',
  'EVO',
  // Promo & special
  'SVP', 'SMP', 'SSP',
]);

// ── Regulation marks noti ────────────────────────────────────────
const REGULATION_MARKS = new Set(['D', 'E', 'F', 'G', 'H', 'I']);

// ── Lingue carte Pokémon ─────────────────────────────────────────
const CARD_LANGUAGES = new Set([
  'it', 'en', 'fr', 'de', 'es', 'pt', 'ja', 'ko', 'zh',
]);

// ── Parsing testo OCR ────────────────────────────────────────────

function parseCardInfo(text: string): {
  cardName: string | null;
  cardNumber: string | null;
  setTotal: string | null;
  setCode: string | null;
  regulationMark: string | null;
  language: string | null;
  hp: string | null;
} {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let cardName: string | null = null;
  let cardNumber: string | null = null;
  let setTotal: string | null = null;
  let setCode: string | null = null;
  let regulationMark: string | null = null;
  let language: string | null = null;
  let hp: string | null = null;

  // ══════════════════════════════════════════════════
  // 1. CODICE CARTA (es. "001/165") — priorità massima
  // ══════════════════════════════════════════════════
  let cardNumberIndex = -1;

  // 1a. Pattern esatto: "NNN/NNN"
  const allNumberMatches = text.matchAll(/(\d{1,3})\s*\/\s*(\d{1,3})/g);
  for (const m of allNumberMatches) {
    const num = m[1];
    const tot = m[2];
    const numVal = parseInt(num, 10);
    const totVal = parseInt(tot, 10);
    if (totVal >= 30 && numVal <= totVal + 50) {
      cardNumber = num.padStart(3, '0');
      setTotal = tot;
      cardNumberIndex = m.index ?? -1;
      console.log('[OCR] Codice carta trovato (esatto):', num + '/' + tot);
      break;
    }
  }

  // 1b. Pattern fuzzy: OCR a volte garble "001/165" come "0017165" o "001 165"
  //     Cerca sequenze di 6-7 cifre nelle ultime righe (zona codice)
  if (!cardNumber) {
    const lastThird = text.substring(Math.floor(text.length * 0.5));
    const fuzzyMatches = lastThird.matchAll(/(\d{3,4})[\s.,;:]*(\d{2,3})\b/g);
    for (const m of fuzzyMatches) {
      const part1 = m[1];
      const part2 = m[2];
      // Prova a interpretare: "0017165" → "001" + "7165" no...
      // "001 165" → "001" + "165" sì!
      // Consideriamo part1 come card number e part2 come set total
      const numVal = parseInt(part1, 10);
      const totVal = parseInt(part2, 10);
      if (numVal >= 1 && numVal <= 300 && totVal >= 30 && totVal <= 400) {
        cardNumber = String(numVal).padStart(3, '0');
        setTotal = String(totVal);
        cardNumberIndex = (m.index ?? 0) + Math.floor(text.length * 0.5);
        console.log('[OCR] Codice carta trovato (fuzzy):', cardNumber + '/' + setTotal);
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════
  // 2. SET CODE, REGULATION MARK, LINGUA
  //    Cercati nel testo VICINO al codice carta (±80 chars)
  //    e anche nell'intero testo come fallback
  // ══════════════════════════════════════════════════

  // Estrai la zona intorno al codice carta (dove ci sono set code, reg mark, lingua)
  const bottomZone = cardNumberIndex >= 0
    ? text.substring(Math.max(0, cardNumberIndex - 30), cardNumberIndex + 80)
    : text.substring(Math.max(0, text.length - 200)); // ultime 200 chars

  console.log('[OCR] Zona bottom:', bottomZone.replace(/\n/g, ' | '));

  // 2a. Set code — cerca codici noti (es. "MEW", "SVI", "OBF")
  //     Prima nella zona bottom, poi nel testo completo
  const allWords = bottomZone.match(/\b[A-Z]{2,4}\b/g) ?? [];
  for (const w of allWords) {
    if (KNOWN_SET_CODES.has(w)) {
      setCode = w;
      console.log('[OCR] Set code trovato (zona bottom):', w);
      break;
    }
  }
  // Fallback: cerca nel testo completo
  if (!setCode) {
    const allWordsFullUpper = text.toUpperCase().match(/\b[A-Z]{2,4}\b/g) ?? [];
    for (const w of allWordsFullUpper) {
      if (KNOWN_SET_CODES.has(w)) {
        setCode = w;
        console.log('[OCR] Set code trovato (testo completo):', w);
        break;
      }
    }
  }

  // 2b. Regulation mark — lettera singola maiuscola (D, E, F, G, H, I)
  //     Cerca nella zona bottom
  const regMarkMatches = bottomZone.match(/\b([A-Z])\b/g) ?? [];
  for (const letter of regMarkMatches) {
    if (REGULATION_MARKS.has(letter)) {
      regulationMark = letter;
      console.log('[OCR] Regulation mark trovato:', letter);
      break;
    }
  }

  // 2c. Lingua — "it", "en", "fr", etc.
  //     Cerca nella zona bottom (case-insensitive)
  const langMatches = bottomZone.toLowerCase().match(/\b([a-z]{2})\b/g) ?? [];
  for (const lang of langMatches) {
    if (CARD_LANGUAGES.has(lang)) {
      language = lang;
      console.log('[OCR] Lingua trovata:', lang);
      break;
    }
  }

  // ══════════════════════════════════════════════════
  // 3. HP (Punti Salute)
  //    Pattern: "70 HP", "HP 70", "PS 70", ",70", ".70"
  // ══════════════════════════════════════════════════
  // Pattern standard
  const hpMatch = text.match(/(\d{2,3})\s*HP|HP\s*(\d{2,3})/i);
  if (hpMatch) {
    hp = hpMatch[1] || hpMatch[2];
  }
  // Pattern italiano (PS = Punti Salute)
  if (!hp) {
    const psMatch = text.match(/(\d{2,3})\s*PS|PS\s*(\d{2,3})/i);
    if (psMatch) {
      hp = psMatch[1] || psMatch[2];
    }
  }
  // Pattern OCR garbled: ".70" o ",70" nelle prime righe (vicino al nome)
  if (!hp) {
    for (const line of lines.slice(0, 4)) {
      const garbledHp = line.match(/[.,](\d{2,3})\b/);
      if (garbledHp) {
        const val = parseInt(garbledHp[1], 10);
        // HP validi per Pokémon: 30-340
        if (val >= 30 && val <= 340) {
          hp = String(val);
          console.log('[OCR] HP trovato (garbled):', hp);
          break;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════
  // 4. NOME (prima riga significativa in alto)
  // ══════════════════════════════════════════════════
  const SKIP_WORDS = new Set([
    'basic', 'base', 'stage', 'trainer', 'supporter',
    'item', 'energy', 'stadium', 'tool', 'pokemon',
    'the', 'and', 'for', 'you', 'your', 'this',
    'weakness', 'resistance', 'retreat', 'rule',
    'debolezza', 'resistenza', 'ritirata', 'regola',
  ]);

  for (const line of lines.slice(0, 6)) {
    const cleaned = line
      .replace(/^(BASIC|BAS[1I]C|BASE|Stage\s*\d|STAGE\s*\d)\s*/i, '')
      .replace(/\s*\d{2,3}\s*HP.*$/i, '')
      .replace(/\s*\d{2,3}\s*PS.*$/i, '')
      .replace(/[^a-zA-ZéÉàèìòùÀÈÌÒÙêûôîâ\s\-'.]/g, '')
      .trim();

    if (
      cleaned.length >= 3 &&
      !/^\d+$/.test(cleaned) &&
      !SKIP_WORDS.has(cleaned.toLowerCase())
    ) {
      cardName = cleaned;
      break;
    }
  }

  return { cardName, cardNumber, setTotal, setCode, regulationMark, language, hp };
}
