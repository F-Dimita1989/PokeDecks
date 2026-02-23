/**
 * Scanner API Service
 *
 * Pipeline automatica:
 *   1. Scatta foto → crop carta
 *   2. OCR cloud (OCR.space) → estrae nome + codice carta (es. 001/165)
 *   3. TCGdex API → trova la carta ESATTA usando nome + numero + totale set
 *   4. (Fallback) Ricerca manuale per nome
 */

import { cloudOcr, type OcrResult } from './ocr';

// ── TCGdex API (veloce, gratuita, no key) ───────────────────────
const TCGDEX_IT = 'https://api.tcgdex.net/v2/it';
const TCGDEX_EN = 'https://api.tcgdex.net/v2/en';

// ── Tipi ────────────────────────────────────────────────────────

export interface CardPricing {
  /** Prezzo medio in EUR */
  avg: number | null;
  /** Prezzo minimo in EUR */
  low: number | null;
  /** Trend prezzo in EUR */
  trend: number | null;
  /** Media ultimi 30 giorni */
  avg30: number | null;
  /** Prezzo medio holo in EUR */
  avgHolo: number | null;
  /** Ultimo aggiornamento */
  updated: string | null;
}

export interface ScanResult {
  id: string;
  name: string;
  set: string;
  number: string;
  confidence: number;
  imageUrl?: string;
  rarity?: string;
  hp?: string;
  types?: string[];
  ocrText?: string;
  /** Codice set stampato, es. "MEW", "SVI" */
  setCode?: string;
  /** Regulation mark, es. "G" */
  regulationMark?: string;
  /** Lingua carta, es. "it" */
  language?: string;
  /** Prezzi Cardmarket in EUR */
  pricing?: CardPricing;
}

// ── TCGdex helpers ──────────────────────────────────────────────

interface TcgDexItem {
  id: string;
  localId: string;
  name: string;
  image: string;
}

interface TcgDexDetail {
  id: string;
  localId: string;
  name: string;
  hp?: number;
  image?: string;
  rarity?: string;
  types?: string[];
  regulationMark?: string;
  set?: {
    id?: string;
    name?: string;
    cardCount?: { total?: number; official?: number };
  };
  pricing?: {
    cardmarket?: {
      updated?: string;
      avg?: number;
      low?: number;
      trend?: number;
      avg30?: number;
      'avg-holo'?: number;
      'low-holo'?: number;
    };
  };
}

// ── Traduzione IT → EN (MyMemory API, gratuita, no key) ─────────

async function translateToEnglish(text: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|en`;
    console.log('[TRANSLATE] Traduco:', text);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const translated: string | undefined = data?.responseData?.translatedText;
    if (translated && translated.toLowerCase() !== text.toLowerCase()) {
      console.log('[TRANSLATE] Risultato:', translated);
      return translated;
    }
    return null;
  } catch (e) {
    console.warn('[TRANSLATE] Errore:', e);
    return null;
  }
}

/**
 * Cerca una carta su TCGdex con 3 livelli:
 *  1. Endpoint italiano (nome IT → DB IT)
 *  2. Endpoint inglese (nome originale → DB EN)
 *  3. Traduzione IT→EN + endpoint inglese (nome tradotto → DB EN)
 */
async function tcgdexSearch(name: string): Promise<{ items: TcgDexItem[]; lang: 'it' | 'en' }> {
  const encoded = encodeURIComponent(name);

  // 1. Prova in italiano
  console.log('[API] TCGdex search IT:', name);
  const itRes = await fetch(`${TCGDEX_IT}/cards?name=${encoded}`);
  if (itRes.ok) {
    const itData = await itRes.json();
    if (Array.isArray(itData) && itData.length > 0) {
      console.log('[API] Trovati', itData.length, 'risultati su IT');
      return { items: itData, lang: 'it' };
    }
  }

  // 2. Fallback: prova in inglese (stesso nome)
  console.log('[API] TCGdex search EN:', name);
  const enRes = await fetch(`${TCGDEX_EN}/cards?name=${encoded}`);
  if (enRes.ok) {
    const enData = await enRes.json();
    if (Array.isArray(enData) && enData.length > 0) {
      console.log('[API] Trovati', enData.length, 'risultati su EN');
      return { items: enData, lang: 'en' };
    }
  }

  // 3. Fallback: traduci IT → EN e riprova
  const translated = await translateToEnglish(name);
  if (translated) {
    const trEncoded = encodeURIComponent(translated);
    console.log('[API] TCGdex search EN (tradotto):', translated);
    const trRes = await fetch(`${TCGDEX_EN}/cards?name=${trEncoded}`);
    if (trRes.ok) {
      const trData = await trRes.json();
      if (Array.isArray(trData) && trData.length > 0) {
        console.log('[API] Trovati', trData.length, 'risultati su EN (tradotto)');
        return { items: trData, lang: 'en' };
      }
    }
  }

  return { items: [], lang: 'en' };
}

/** Recupera i dettagli di una carta. Usa l'endpoint della lingua in cui è stata trovata. */
async function tcgdexDetail(cardId: string, lang: 'it' | 'en' = 'en'): Promise<TcgDexDetail | null> {
  const base = lang === 'it' ? TCGDEX_IT : TCGDEX_EN;
  const url = `${base}/cards/${cardId}`;
  console.log(`[API] TCGdex detail (${lang}):`, cardId);
  const response = await fetch(url);
  if (!response.ok) return null;
  return await response.json();
}

/**
 * @param ocrSetTotal — il totale stampato sulla carta (es. "165"),
 *   ha priorità sul totale di TCGdex (che include le segrete).
 */
function detailToResult(
  d: TcgDexDetail,
  confidence: number,
  ocrSetTotal?: string | null
): ScanResult {
  const printedTotal =
    ocrSetTotal ??
    d.set?.cardCount?.official ??
    d.set?.cardCount?.total;

  // Estrai prezzi Cardmarket
  const cm = d.pricing?.cardmarket;
  const pricing: CardPricing | undefined = cm
    ? {
        avg: cm.avg ?? null,
        low: cm.low ?? null,
        trend: cm.trend ?? null,
        avg30: cm.avg30 ?? null,
        avgHolo: cm['avg-holo'] ?? null,
        updated: cm.updated ?? null,
      }
    : undefined;

  if (pricing) {
    console.log('[API] Prezzo Cardmarket: avg', pricing.avg, 'EUR, low', pricing.low, 'EUR');
  }

  return {
    id: d.id,
    name: d.name,
    set: d.set?.name ?? 'Unknown',
    number: printedTotal ? `${d.localId}/${printedTotal}` : d.localId,
    confidence,
    rarity: d.rarity ?? 'Unknown',
    hp: d.hp ? String(d.hp) : '',
    types: d.types ?? [],
    imageUrl: d.image ? `${d.image}/high.webp` : '',
    regulationMark: d.regulationMark,
    pricing,
  };
}

/** Normalizza localId togliendo zeri iniziali: "001" → "1" */
function normalizeId(id: string): string {
  return id.replace(/^0+/, '') || '0';
}

// ── Ricerca intelligente ────────────────────────────────────────

/**
 * Cerca una carta su TCGdex usando:
 *  - nome (obbligatorio)
 *  - codice carta, es. "001" (opzionale, aumenta precisione)
 *  - totale set, es. "165" (opzionale, match al 99%)
 *  - hp, es. "70" (opzionale, usato come fallback quando codice manca)
 *  - setCode, es. "MEW" (opzionale, filtra per set stampato sulla carta)
 */
export async function searchCardByName(
  name: string,
  cardNumber?: string | null,
  setTotal?: string | null,
  hp?: string | null,
  setCode?: string | null
): Promise<ScanResult | null> {
  const clean = name.trim();
  if (clean.length < 2) return null;

  try {
    const { items: results, lang } = await tcgdexSearch(clean);
    console.log('[API] Risultati per', clean, ':', results.length, `(${lang})`);
    if (results.length === 0) return null;

    // ── Filtra per numero carta ──────────────────
    let candidates = results;
    if (cardNumber) {
      const targetNum = normalizeId(cardNumber);
      const filtered = results.filter(
        (c) => normalizeId(c.localId ?? '') === targetNum
      );
      if (filtered.length > 0) {
        candidates = filtered;
        console.log('[API] Filtrati per #' + cardNumber + ':', candidates.length);
      }
    }

    // ── Filtra per set code (es. "MEW", "SVI") ──────
    if (setCode && candidates.length > 1) {
      const upperCode = setCode.toUpperCase();
      console.log('[API] Filtro per set code:', upperCode);

      // L'ID TCGdex contiene spesso il codice set (es. "sv03.5-001" per 151/MEW)
      // Controlliamo il set ID nei dettagli dei candidati
      const toCheck = candidates.slice(0, 10);
      const setMatches: { item: TcgDexItem; detail: TcgDexDetail }[] = [];

      for (const c of toCheck) {
        const detail = await tcgdexDetail(c.id, lang);
        if (!detail) continue;

        const setId = (detail.set?.id ?? '').toUpperCase();
        const setName = (detail.set?.name ?? '').toUpperCase();

        // Confronta il codice set OCR con l'ID o il nome del set TCGdex
        if (setId.includes(upperCode) || setName.includes(upperCode)) {
          setMatches.push({ item: c, detail });
          console.log('[API]   Set code match:', c.id, '→', detail.set?.name);
        }
      }

      if (setMatches.length === 1) {
        console.log('[API] MATCH UNICO per set code!', setMatches[0].item.id);
        return detailToResult(setMatches[0].detail, 0.98, setTotal);
      }
      if (setMatches.length > 0) {
        // Restringe i candidati a quelli con set code giusto
        candidates = setMatches.map((m) => m.item);
        console.log('[API] Candidati ridotti a', candidates.length, 'per set code');
      }
    }

    // ── Se abbiamo il totale set, matcha per quello ──
    if (setTotal && candidates.length > 1) {
      const targetTotal = parseInt(setTotal, 10);
      console.log('[API] Cerco set con totale', targetTotal, 'tra', candidates.length, 'candidati...');

      const toCheck = candidates.slice(0, 10);
      for (const c of toCheck) {
        const detail = await tcgdexDetail(c.id, lang);
        if (!detail) continue;

        const total =
          detail.set?.cardCount?.official ??
          detail.set?.cardCount?.total;

        console.log('[API]  ', c.id, '→ set:', detail.set?.name, ', totale:', total);

        if (total && Math.abs(total - targetTotal) <= 5) {
          console.log('[API] MATCH ESATTO per set total! Set:', detail.set?.name);
          return detailToResult(detail, 0.99, setTotal);
        }
      }
    }

    // ── Fallback HP: se non abbiamo codice carta, filtra per HP ──
    if (!cardNumber && hp && candidates.length > 1) {
      const targetHp = parseInt(hp, 10);
      console.log('[API] Filtro per HP', targetHp, 'tra', candidates.length, 'candidati...');

      const toCheck = candidates.slice(0, 12);
      const hpMatches: { detail: TcgDexDetail; id: string }[] = [];

      for (const c of toCheck) {
        const detail = await tcgdexDetail(c.id, lang);
        if (!detail) continue;

        if (detail.hp === targetHp) {
          hpMatches.push({ detail, id: c.id });
          console.log('[API]   HP match:', c.id, '→', detail.set?.name);
        }
      }

      if (hpMatches.length === 1) {
        console.log('[API] MATCH UNICO per HP!', hpMatches[0].id);
        return detailToResult(hpMatches[0].detail, 0.92, setTotal);
      }
      if (hpMatches.length > 1) {
        const best = hpMatches[hpMatches.length - 1];
        console.log('[API] Match HP multipli, prendo ultimo:', best.id);
        return detailToResult(best.detail, 0.80, setTotal);
      }
    }

    // ── Fallback finale: primo risultato ──────────
    const exact = candidates.find(
      (c) => c.name.toLowerCase() === clean.toLowerCase()
    );
    const best = exact ?? candidates[0];
    console.log('[API] Fallback finale:', best.name, best.id);

    const detail = await tcgdexDetail(best.id, lang);
    if (!detail) return null;

    const conf = cardNumber ? 0.85 : exact ? 0.80 : 0.70;
    return detailToResult(detail, conf, setTotal);
  } catch (error) {
    console.warn('[API] Ricerca fallita:', error);
    return null;
  }
}

// ── Pipeline automatica: OCR → parse → search ──────────────────

export async function autoRecognizeCard(
  base64Image: string,
  onStatus?: (msg: string) => void
): Promise<ScanResult | null> {
  onStatus?.('Lettura testo dalla carta...');
  const ocrResult = await cloudOcr(base64Image);
  if (!ocrResult) {
    console.log('[AUTO] OCR non ha restituito risultati');
    return null;
  }

  logOcrResult(ocrResult);

  if (ocrResult.cardName) {
    const hasCode = ocrResult.cardNumber && ocrResult.setTotal;
    const label = hasCode
      ? `Cerco "${ocrResult.cardName}" #${ocrResult.cardNumber}/${ocrResult.setTotal}...`
      : `Cerco "${ocrResult.cardName}"...`;
    onStatus?.(label);

    const card = await searchCardByName(
      ocrResult.cardName,
      ocrResult.cardNumber,
      ocrResult.setTotal,
      ocrResult.hp,
      ocrResult.setCode
    );

    if (card) {
      card.ocrText = ocrResult.fullText;
      // Aggiungi dati identificativi dall'OCR
      if (ocrResult.setCode) card.setCode = ocrResult.setCode;
      if (ocrResult.regulationMark) card.regulationMark = ocrResult.regulationMark;
      if (ocrResult.language) card.language = ocrResult.language;
      // Bonus confidenza se HP corrisponde
      if (ocrResult.hp && card.hp === ocrResult.hp) {
        card.confidence = Math.min(card.confidence + 0.01, 1.0);
      }
      return card;
    }
  }

  return null;
}

function logOcrResult(ocr: OcrResult) {
  console.log('[AUTO] ── Dati OCR ──────────────');
  console.log('[AUTO] Nome:', ocr.cardName);
  console.log('[AUTO] Codice:', ocr.cardNumber, '/', ocr.setTotal);
  console.log('[AUTO] HP:', ocr.hp);
  console.log('[AUTO] Set code:', ocr.setCode);
  console.log('[AUTO] Reg mark:', ocr.regulationMark);
  console.log('[AUTO] Lingua:', ocr.language);
  console.log('[AUTO] ─────────────────────────');
}
