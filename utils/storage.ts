/**
 * Collection Storage — AsyncStorage
 *
 * Gestisce il salvataggio locale delle carte confermate.
 * Le carte vengono salvate come array JSON sotto la chiave STORAGE_KEY.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pokescanner_collection';

export interface CollectionCard {
  /** ID univoco (dal server o generato) */
  id: string;
  /** Nome della carta */
  name: string;
  /** Set di appartenenza */
  set: string;
  /** Numero nel set (es. "25/102") */
  number: string;
  /** Rarità */
  rarity: string;
  /** Confidenza del match (0–1) */
  confidence: number;
  /** URL immagine dalla Pokémon TCG API */
  imageUrl?: string;
  /** URI locale dell'immagine croppata */
  localImageUri?: string;
  /** Testo OCR estratto */
  ocrText?: string;
  /** Data di scansione (ISO string) */
  scannedAt: string;
}

/**
 * Salva una carta nella collezione.
 * Se esiste già una carta con lo stesso ID, la aggiorna.
 */
export async function saveCard(card: CollectionCard): Promise<void> {
  const cards = await getCards();
  const index = cards.findIndex((c) => c.id === card.id);

  if (index >= 0) {
    cards[index] = card; // aggiorna
  } else {
    cards.unshift(card); // aggiungi in testa
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/**
 * Ritorna tutte le carte salvate, ordinate per data (più recenti prima).
 */
export async function getCards(): Promise<CollectionCard[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as CollectionCard[];
  } catch (e) {
    console.error('[Storage] Errore lettura:', e);
    return [];
  }
}

/**
 * Rimuove una carta dalla collezione per ID.
 */
export async function deleteCard(id: string): Promise<void> {
  const cards = await getCards();
  const filtered = cards.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Svuota tutta la collezione.
 */
export async function clearCollection(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
