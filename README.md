# ScannerPokedecks

Applicazione mobile per la scansione e il riconoscimento automatico di carte Pokémon TCG, sviluppata con **React Native** ed **Expo**.

Inquadra una carta con la fotocamera del dispositivo: l'app estrae il testo tramite OCR, identifica la carta attraverso l'API TCGdex e mostra tutti i dettagli — incluso il valore di mercato corrente.

---

## Funzionalità

- **Scansione automatica** — Inquadra la carta e scatta: l'app riconosce nome, codice, set, HP e regulation mark senza input manuali.
- **OCR cloud** — Estrazione del testo dalla foto tramite [OCR.space](https://ocr.space), con parsing intelligente dei dati identificativi.
- **Matching preciso** — Ricerca multi-criterio su [TCGdex](https://tcgdex.dev): nome + codice carta + totale set + HP come fallback.
- **Valore di mercato** — Prezzi Cardmarket (media, trend, minimo, media holo) aggiornati direttamente dall'API.
- **Collezione locale** — Salvataggio delle carte scansionate in memoria locale con gestione completa (aggiungi, elimina, svuota).
- **Ricerca manuale** — Campo di ricerca per nome come alternativa alla scansione automatica.
- **Tema chiaro/scuro** — Interfaccia adattiva al tema di sistema.

---

## Tecnologie

| Ambito | Tecnologia |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 54) + [React Native](https://reactnative.dev) 0.81 |
| Navigazione | [Expo Router](https://docs.expo.dev/router/introduction/) v6 (file-based routing) |
| Fotocamera | `expo-camera` |
| Elaborazione immagini | `expo-image-manipulator` (ridimensionamento, crop, base64) |
| OCR | [OCR.space API](https://ocr.space/ocrapi) (cloud, free tier) |
| Dati carte | [TCGdex API](https://tcgdex.dev) (ricerca, dettagli, prezzi Cardmarket) |
| Storage locale | `@react-native-async-storage/async-storage` |
| Linguaggio | TypeScript 5.9 |

---

## Struttura del progetto

```
scannerPokedecks/
├── app/                        # Schermate e navigazione (Expo Router)
│   ├── _layout.tsx             # Layout radice dell'app
│   └── (tabs)/
│       ├── _layout.tsx         # Layout tab bar
│       ├── index.tsx           # Tab Scanner (fotocamera + riconoscimento)
│       └── explore.tsx         # Tab Collezione (carte salvate)
├── components/                 # Componenti riutilizzabili
│   ├── camera-overlay.tsx      # Overlay mirino con cornice carta
│   ├── confidence-bar.tsx      # Barra di confidenza del match
│   ├── haptic-tab.tsx          # Tab con feedback aptico (iOS)
│   └── ui/
│       ├── icon-symbol.tsx     # Icone Material (Android/Web)
│       └── icon-symbol.ios.tsx # Icone SF Symbols (iOS)
├── hooks/
│   ├── use-color-scheme.ts     # Hook schema colori
│   └── use-color-scheme.web.ts # Variante web
├── utils/
│   ├── api.ts                  # Comunicazione TCGdex + pipeline riconoscimento
│   ├── ocr.ts                  # OCR.space + parsing dati carta
│   ├── crop.ts                 # Calcolo area di crop (rapporto 63×88 mm)
│   └── storage.ts              # Persistenza collezione (AsyncStorage)
└── assets/images/              # Icone e splash screen
```

---

## Installazione

### Prerequisiti

- [Node.js](https://nodejs.org) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) sul dispositivo mobile (Android/iOS)

### Setup

```bash
# Clona il repository
git clone <url-repository>
cd scannerPokedecks

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm start
```

Scansiona il QR code con Expo Go per avviare l'app sul dispositivo.

---

## Pipeline di riconoscimento

```
Foto → Ridimensionamento (1024px) → OCR.space (lingua: italiano)
                                          │
                                          ▼
                                    Parsing testo
                              (nome, codice, HP, set, reg. mark)
                                          │
                                          ▼
                                   Ricerca TCGdex
                         ┌─────────────────────────────────┐
                         │ 1. Cerca per nome                │
                         │ 2. Filtra per codice carta       │
                         │ 3. Match per totale set (±5)     │
                         │ 4. Fallback: filtra per HP       │
                         │ 5. Fallback finale: primo match  │
                         └─────────────────────────────────┘
                                          │
                                          ▼
                              Risultato + Prezzi Cardmarket
```

---

## Comandi disponibili

| Comando | Descrizione |
|---|---|
| `npm start` | Avvia il server di sviluppo Expo |
| `npm run android` | Avvia su emulatore/dispositivo Android |
| `npm run ios` | Avvia su simulatore/dispositivo iOS |
| `npm run web` | Avvia la versione web |
| `npm run lint` | Esegue il linter ESLint |

---

## Note

- La scansione richiede una buona illuminazione e la carta ben inquadrata nei quattro angoli del mirino.
- L'OCR è ottimizzato per carte in lingua **italiana** (parametro `language: 'ita'`).
- I prezzi di mercato provengono da Cardmarket tramite TCGdex e potrebbero non essere disponibili per tutte le carte.
- L'app funziona interamente client-side — non richiede backend.

---

## Licenza

Progetto privato. Tutti i diritti riservati.
