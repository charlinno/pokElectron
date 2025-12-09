# Architecture - Pokedex Electron

## Vue d'ensemble

Ce document décrit l'architecture globale de l'application Pokedex Electron, ses composants et leurs interactions.

---

## Architecture générale

```
┌─────────────────────────────────────────────────────────────────┐
│                     Pokedex Electron App                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐              ┌──────────────────────────┐  │
│  │  Main Process   │              │  Renderer Process(s)     │  │
│  │  (Node.js)      │◄────IPC────►│  (Chromium)              │  │
│  │                 │              │                          │  │
│  │ • Window Mgmt   │              │ • UI/UX                 │  │
│  │ • File System   │              │ • User Interactions     │  │
│  │ • DB Connection │              │ • DOM Rendering         │  │
│  │ • API Calls     │              │                          │  │
│  └────────┬────────┘              └──────────────────────────┘  │
│           │                                                      │
│           │                                                      │
│  ┌────────▼────────────────────────────────────────────────┐    │
│  │           Local Storage Layer                          │    │
│  │                                                        │    │
│  │  ┌─────────────────┐         ┌──────────────────────┐ │    │
│  │  │ SQLite Database │         │ File System Cache    │ │    │
│  │  │ • pokemon       │         │ • API Cache          │ │    │
│  │  │ • team          │         │ • Images             │ │    │
│  │  └─────────────────┘         └──────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  External APIs                                         │   │
│  │  • PokéAPI (https://pokeapi.co/)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Composants principaux

### 1. Main Process (Processus Principal)

**Fichier:** `src/main/index.js`

#### Responsabilités
- Créer et gérer la fenêtre Electron
- Gérer le cycle de vie de l'application
- Gérer les appels IPC avec le Renderer Process
- Initialiser et gérer la base de données SQLite
- Effectuer les appels API vers PokéAPI

#### Modules clés

```
Main Process
├── Window Manager
│   ├── Créer fenêtre principale
│   ├── Gérer navigation
│   └── Gérer menus
├── IPC Handler
│   ├── Écouter messages du renderer
│   ├── Répondre avec données
│   └── Gérer erreurs
├── Database Manager
│   ├── Initialiser SQLite
│   ├── Opérations CRUD
│   ├── Migrations
│   └── Transactions
└── API Service
    ├── Appels PokéAPI
    ├── Cache des données
    ├── Gestion des erreurs réseau
    └── Retry logic
```

#### Structure de code

```javascript
// src/main/index.js
const { app, BrowserWindow, ipcMain } = require('electron');
const database = require('./database');
const apiService = require('./api-service');

app.on('ready', () => {
  // Créer window
  // Initialiser DB
  // Charger le fichier HTML
  // Écouter les IPC
});

ipcMain.handle('get-all-pokemon', async () => {
  return database.getAllPokemon();
});

ipcMain.handle('capture-pokemon', async (event, pokemonId) => {
  return database.updatePokemonCaptured(pokemonId, true);
});
```

---

### 2. Renderer Process (Processus de Rendu)

**Fichier:** `src/renderer/index.html`

#### Responsabilités
- Afficher l'interface utilisateur
- Gérer les interactions de l'utilisateur
- Communiquer avec le Main Process via IPC
- Mettre à jour le DOM dynamiquement

#### Pages principales

```
Renderer Process
├── home.html
│   ├── Page d'accueil
│   ├── Affichage de l'équipe (si existante)
│   └── Boutons de navigation
├── pokedex.html
│   ├── Liste complète des Pokémons
│   ├── Filtrage (capturés/non-capturés)
│   ├── Détails d'un Pokémon
│   └── Système de capture aléatoire
├── team.html
│   ├── 6 slots d'équipe
│   ├── Liste des Pokémons capturés
│   ├── Drag-and-drop
│   └── Sauvegarde
└── assets/
    ├── css/
    │   ├── styles.css
    │   ├── home.css
    │   ├── pokedex.css
    │   └── team.css
    └── js/
        ├── renderer.js (logique commune)
        ├── home.js
        ├── pokedex.js
        └── team.js
```

#### Architecture Front-end

```javascript
// src/renderer/js/pokedex.js
class PokédexManager {
  constructor() {
    this.pokemonList = [];
    this.capturedPokemon = new Set();
  }

  async loadPokemon() {
    const data = await window.api.getAllPokemon();
    this.pokemonList = data;
    this.render();
  }

  async capturePokemon(pokemonId) {
    const result = await window.api.capturePokemon(pokemonId);
    this.capturedPokemon.add(pokemonId);
    this.updateUI();
  }

  render() {
    // Afficher la liste avec filtrage
  }
}
```

---

### 3. Database Layer (Couche Base de Données)

**Fichier:** `src/main/database.js`

#### Responsabilités
- Gérer les connexions SQLite
- Exécuter les requêtes CRUD
- Valider les données
- Gérer les transactions

#### Classes et méthodes

```javascript
class Database {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
  }

  // Pokémon operations
  getAllPokemon() { }
  getPokemonById(id) { }
  getPokemonCaptured() { }
  updatePokemonCaptured(id, captured) { }
  
  // Team operations
  getTeam() { }
  addPokemonToTeam(position, pokemonId) { }
  removePokemonFromTeam(position) { }
  updateTeam(teamArray) { }

  // Initialization
  initialize() { }
  seedInitialData(pokemonList) { }
}
```

---

### 4. API Service (Service API)

**Fichier:** `src/main/api-service.js`

#### Responsabilités
- Interfacer avec PokéAPI
- Mettre en cache les réponses
- Gérer les erreurs réseau
- Transformer les données

#### Interface

```javascript
class APIService {
  constructor() {
    this.client = new Client();
    this.cache = new Map();
  }

  async getPokemonList(limit = 151) {
    // Récupérer liste complète
    // Cacher les résultats
    // Retourner données formatées
  }

  async getPokemonDetails(id) {
    // Récupérer détails spécifiques
    // Transformer pour DB
  }

  async seedDatabase() {
    // Récupérer tous les Pokémons
    // Insérer dans DB
  }
}
```

---

### 5. Preload Script

**Fichier:** `src/preload.js`

#### Responsabilités
- Exposer une API sécurisée au renderer
- Protéger contre les injections XSS
- Faire le bridge IPC

#### Code

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAllPokemon: () => ipcRenderer.invoke('get-all-pokemon'),
  getPokemonById: (id) => ipcRenderer.invoke('get-pokemon', id),
  capturePokemon: (id) => ipcRenderer.invoke('capture-pokemon', id),
  getTeam: () => ipcRenderer.invoke('get-team'),
  updateTeam: (team) => ipcRenderer.invoke('update-team', team),
});
```

---

## Communication Inter-Processus (IPC)

### Flux de données

```
Renderer Process               Main Process
    │                              │
    ├─ ipcRenderer.invoke()────────┤
    │  (demande async)             │
    │                              ├─ Effectuer l'opération
    │◄─ ipcMain.handle()───────────┤
    │  (réponse)                   │
    │                              │
```

### Canaux IPC principaux

| Canal | Direction | Données | Réponse |
|-------|-----------|---------|---------|
| `get-all-pokemon` | Renderer → Main | - | Pokemon[] |
| `get-pokemon` | Renderer → Main | { id } | Pokemon |
| `capture-pokemon` | Renderer → Main | { id } | { success, message } |
| `get-team` | Renderer → Main | - | Team[] |
| `update-team` | Renderer → Main | { team } | { success } |
| `get-captured-count` | Renderer → Main | - | { count } |

---

## Flux d'application typique

### 1. Démarrage

```
1. Electron app.on('ready')
   ↓
2. Créer fenêtre + charger index.html
   ↓
3. Initialiser Database
   ↓
4. Premier lancement? Seed data depuis PokéAPI
   ↓
5. Preload script expose API au renderer
   ↓
6. Afficher page d'accueil
```

### 2. Navigation vers Pokédex

```
1. Utilisateur clique "Pokédex"
   ↓
2. Renderer charge pokedex.html
   ↓
3. pokedex.js appelle window.api.getAllPokemon()
   ↓
4. Main Process récupère depuis SQLite
   ↓
5. Renderer reçoit données et affiche
   ↓
6. Pokémons grisés si non-capturés
```

### 3. Capture d'un Pokémon

```
1. Pokémon apparaît aléatoirement
   ↓
2. Utilisateur clique avant timeout
   ↓
3. Renderer appelle window.api.capturePokemon(id)
   ↓
4. Main Process met à jour is_captured = 1 en DB
   ↓
5. Renderer reçoit confirmation
   ↓
6. UI met à jour (Pokédex reflète le changement)
```

### 4. Sauvegarde d'équipe

```
1. Utilisateur drag-drop 6 Pokémons
   ↓
2. Clique "Sauvegarder"
   ↓
3. Renderer appelle window.api.updateTeam(teamArray)
   ↓
4. Main Process:
   - Valide (6 Pokémons, pas de doublons)
   - Insère/met à jour table team
   ↓
5. Renderer reçoit succès
   ↓
6. Affiche message de confirmation
```

---

## Structure de fichiers détaillée

```
pokedex-electron/
├── src/
│   ├── main/
│   │   ├── index.js                    # Point d'entrée Electron
│   │   ├── database.js                 # Gestion SQLite
│   │   ├── api-service.js              # Appels PokéAPI
│   │   └── constants.js                # Constantes (DB path, etc.)
│   │
│   ├── renderer/
│   │   ├── index.html                  # HTML principal (chargement initial)
│   │   ├── home.html                   # Page d'accueil
│   │   ├── pokedex.html                # Page Pokédex
│   │   ├── team.html                   # Page équipe
│   │   │
│   │   ├── js/
│   │   │   ├── renderer.js             # Logique commune
│   │   │   ├── home.js                 # Logique page accueil
│   │   │   ├── pokedex.js              # Logique Pokédex + capture
│   │   │   └── team.js                 # Logique équipe
│   │   │
│   │   └── css/
│   │       ├── styles.css              # Styles globaux
│   │       ├── home.css                # Styles page accueil
│   │       ├── pokedex.css             # Styles Pokédex
│   │       └── team.css                # Styles équipe
│   │
│   └── preload.js                      # Preload script (sécurité IPC)
│
├── tests/
│   ├── database.test.js                # Tests DB
│   ├── api-service.test.js             # Tests API
│   └── pokedex.test.js                 # Tests logique métier
│
├── docs/
│   ├── use-cases.md
│   ├── data-models.md
│   ├── architecture.md
│   └── TESTING.md
│
├── .github/
│   └── workflows/
│       └── build.yml                   # CI/CD GitHub Actions
│
├── package.json
├── package-lock.json
├── README.md
└── Pokedex.iml
```

---

## Patterns et bonnes pratiques

### 1. Single Responsibility Principle
- Main process: gestion window + coordination
- Database: requêtes SQL uniquement
- API Service: appels externes uniquement
- Renderer: affichage UI uniquement

### 2. Error Handling

```javascript
// Main Process
ipcMain.handle('capture-pokemon', async (event, id) => {
  try {
    const result = await database.updatePokemonCaptured(id, true);
    return { success: true, data: result };
  } catch (error) {
    console.error('Capture error:', error);
    return { success: false, error: error.message };
  }
});

// Renderer Process
try {
  const result = await window.api.capturePokemon(id);
  if (!result.success) {
    showError(result.error);
  }
} catch (error) {
  showError('Network error');
}
```

### 3. Caching Strategy

```javascript
// API Service cache
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

async function getPokemonList() {
  if (cache.has('pokemon_list')) {
    const cached = cache.get('pokemon_list');
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }
  
  const data = await this.client.pokemon.listAll();
  cache.set('pokemon_list', { data, timestamp: Date.now() });
  return data;
}
```

### 4. Event-Driven Updates

```javascript
// Notifier le renderer quand DB change
ipcMain.handle('capture-pokemon', async (event, id) => {
  const result = await database.updatePokemonCaptured(id, true);
  
  // Notifier tous les renderers
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('pokemon-captured', { id });
  });
  
  return result;
});

// Renderer écoute les mises à jour
ipcRenderer.on('pokemon-captured', (event, { id }) => {
  pokédexManager.updateUI();
});
```

---

## Sécurité

### 1. Context Isolation
- Isoler le contexte du renderer pour éviter les injections XSS
- Utiliser `preload.js` pour exposer une API limitée

### 2. Validation des données
- Valider tous les inputs du renderer avant traitement
- Valider les données avant insertion en DB

### 3. Gestion des fichiers
- Ne pas exposer les chemins de fichiers au renderer
- Utiliser des chemins sécurisés pour la DB

---

## Déploiement et packaging

### Build avec electron-builder

```json
{
  "build": {
    "appId": "com.pokedex.app",
    "productName": "Pokedex Electron",
    "files": [
      "src/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

### Processus de release

1. Développement local: `npm start`
2. Tests: `npm test`
3. Build: `npm run build`
4. Packager: electron-builder crée .exe, .msi
5. Release: Publier sur GitHub/Assets

---

## Performance et optimisation

### 1. Lazy Loading
- Charger les images des Pokémons à la demande
- Pagination de la liste Pokédex

### 2. Database Optimization
- Indexation sur colonnes fréquemment requêtées
- Requêtes préparées pour éviter les injections

### 3. Memory Management
- Fermer les connexions DB proprement
- Nettoyer les listeners IPC
- Éviter les memory leaks dans les timers

---

## Monitoring et debugging

### Logs
```javascript
// src/main/index.js
const log = require('electron-log');
log.transports.file.level = 'info';
log.transports.console.level = 'info';
```

### DevTools
```javascript
// En développement
mainWindow.webContents.openDevTools();
```

### Tests
```bash
npm test           # Exécuter tous les tests
npm run test:cov   # Coverage report
npm run test:watch # Watch mode
```

