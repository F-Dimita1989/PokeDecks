# PokéDecks TCG

App mobile PokéDecks per **carte da gioco Pokémon (TCG)** che permette agli utenti di catalogare, gestire e valutare la propria collezione.

L’app consente agli utenti **autenticati** di salvare le proprie carte tramite **scannerizzazione con fotocamera**, consultare i dettagli delle carte e visualizzare il **valore di mercato aggiornato** grazie all’integrazione con API esterne (es. Cardmarket).

---

## 🚀 Funzionalità

- 🔐 Autenticazione utente
- 📸 Scannerizzazione delle carte Pokémon tramite fotocamera
- 🗂️ Salvataggio e gestione della collezione personale
- 🔎 Ricerca e visualizzazione dettagli delle carte
- 💹 Integrazione con API di trading per:
  - Valore di mercato
  - Prezzo medio aggiornato
  - Andamento dei prezzi
- ☁️ Sincronizzazione dati con backend remoto

## 🧰 Tecnologie

### Frontend (Mobile App)
- **React Native**
- **TypeScript**
- Gestione stato (Redux / Zustand / Context API)
- Fotocamera & Image Processing

### Backend
- **C# / .NET**
- Web API REST
- Autenticazione (JWT)
- Database (SQL Server / PostgreSQL / SQLite)

### API Esterne
- **Cardmarket API** (prezzi e valore di mercato)
- Altre API TCG (eventuali)

## 📦 Installazione

### Frontend

```bash
# Clona il repository
git clone https://github.com/username/pokedex-tcg.git

# Entra nella cartella frontend
cd pokedex-tcg/mobile

# Installa le dipendenze
npm install
```

### Backend

```bash
# Entra nella cartella backend
cd pokedex-tcg/backend

# Ripristina le dipendenze
dotnet restore

# Avvia l’API
dotnet run
```

## ▶️ Utilizzo

1. Avvia il backend
2. Avvia l’app React Native su emulatore o dispositivo fisico
3. Registrati o effettua il login
4. Scansiona le carte Pokémon
5. Consulta la tua collezione e il valore aggiornato sul mercato

## 🗂️ Struttura del progetto

```
pokedex-tcg/
├── mobile/            # App React Native (TypeScript)
│   ├── src/
│   ├── assets/
│   └── package.json
├── backend/           # API C# / .NET
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
├── README.md
└── docs/
```

## ✅ Requisiti

- Node.js >= 18
- npm o yarn
- .NET SDK >= 7
- Dispositivo con fotocamera (per scannerizzazione)

## 🧪 Test

```bash
# Frontend
npm test

# Backend
dotnet test
```

## 🤝 Contribuire

I contributi sono benvenuti!

1. Fai una fork del progetto
2. Crea un branch (`git checkout -b feature/nome-feature`)
3. Fai commit delle modifiche
4. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza **MIT**.

## 🧑‍💻 Team

Il progetto è sviluppato da:

- **Filippo Dimita**
- **Nicolas Girardi**
- **Francesco "Bomber" Tria**

## 🛠️ Architettura

Il progetto segue un’architettura **client-server**:

- **Mobile App (React Native)**
  - Gestione UI e UX
  - Scannerizzazione carte tramite fotocamera
  - Comunicazione con backend via API REST

- **Backend (.NET / C#)**
  - Autenticazione e autorizzazione utenti (JWT)
  - Gestione collezioni e carte
  - Integrazione con API esterne
  - Persistenza dati

## 🗄️ Database

Il database memorizza:

- Utenti
- Collezioni
- Carte possedute
- Storico prezzi (opzionale)

Tecnologie supportate:
- PostgreSQL / SQL Server (produzione)
- SQLite (sviluppo)

## 🔐 Sicurezza

- Autenticazione tramite **JWT**
- Password hashate
- Protezione endpoint API
- Validazione input lato backend

## 🌐 API Backend

Endpoint principali:

- `POST /auth/register`
- `POST /auth/login`
- `GET /cards`
- `POST /cards`
- `GET /collection`
- `POST /collection/add`
- `GET /prices/{cardId}`

## 🔌 API Esterne

- **Cardmarket API**
  - Prezzo medio
  - Prezzo minimo
  - Trend di mercato

⚠️ L’uso delle API esterne è soggetto ai relativi **termini di servizio**.

## 📸 Scannerizzazione Carte

La scannerizzazione utilizza:

- Fotocamera del dispositivo
- Riconoscimento immagine / OCR
- Matching con database carte Pokémon

## 🚧 Roadmap

- [ ] Scannerizzazione avanzata con AI
- [ ] Grafici andamento prezzi
- [ ] Esportazione collezione (CSV / PDF)
- [ ] Wishlist e notifiche prezzo
- [ ] Modalità offline

## 🧪 Logging & Monitoraggio

- Logging backend
- Gestione errori centralizzata
- Monitoraggio performance API

## 🧩 Convenzioni di sviluppo

- Commit message chiari (Conventional Commits)
- Code review tramite Pull Request
- Branching model: `main` / `develop` / `feature/*`

## 📄 Licenza

Questo progetto è distribuito sotto licenza **MIT**.

---

⚠️ **Disclaimer**: Pokémon e Pokémon Trading Card Game sono marchi registrati di Nintendo / The Pokémon Company. Questo progetto è non ufficiale e a scopo educativo.
