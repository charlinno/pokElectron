# Guide de Démarrage - Pokedex Electron

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Démarrer l'application en développement

```bash
npm start
```

L'application se lancera avec Electron et chargera la page d'accueil.

### 3. Premier lancement

Au premier lancement:
1. La base de données SQLite sera créée automatiquement
2. Un message d'avertissement apparaîtra demandant de synchroniser avec l'API
3. Cliquez sur le bouton de synchronisation pour charger les 151 Pokémons
4. Les données seront sauvegardées localement dans SQLite

### 4. Fonctionnalités principales

#### Page d'accueil
- Affiche les statistiques (nombre de Pokémons capturés)
- Boutons de navigation vers Pokédex, Équipe, et Capture

#### Page Pokédex
- Liste complète de tous les Pokémons
- Pokémons grisés si non capturés
- Affichage du numéro et type de Pokémon

#### Page Capture
- Pokémons apparaissent aléatoirement
- Cliquez sur le Pokémon avant le timeout pour le capturer
- Taux de succès: 70%

#### Page Équipe
- Drag-and-drop des Pokémons capturés dans les 6 slots
- Réorganisation de l'équipe
- Sauvegarde automatique en base de données

---

## 🧪 Tests

### Exécuter tous les tests

```bash
npm test
```

### Tests avec couverture

```bash
npm run test:coverage
```

### Tests en mode watch

```bash
npm run test:watch
```

### Structure des tests

```
tests/
├── database.test.js        # Tests CRUD de la base de données
└── api-service.test.js     # Tests du service API
```

**Couverture actuelle:**
- ✅ Database: 18 tests
- ✅ API Service: 11 tests
- Total: 29 tests unitaires

---

## 📁 Structure du projet

```
pokedex-electron/
├── src/
│   ├── main/
│   │   ├── main.js              # Point d'entrée Electron
│   │   ├── database.js          # Gestion SQLite
│   │   └── api-service.js       # Service API PokéAPI
│   ├── renderer/
│   │   ├── index.html           # Page principale
│   │   ├── js/
│   │   │   ├── renderer.js      # Logique commune
│   │   │   ├── home.js          # Page d'accueil
│   │   │   ├── pokedex.js       # Page Pokédex
│   │   │   ├── team.js          # Page équipe
│   │   │   └── capture.js       # Système de capture
│   │   └── css/
│   │       └── styles.css       # Styles globaux
│   └── preload.js               # Preload script sécurisé
├── tests/
│   ├── database.test.js         # Tests BD
│   └── api-service.test.js      # Tests API
├── docs/
│   ├── use-cases.md
│   ├── data-models.md
│   ├── architecture.md
│   └── TESTING.md
├── jest.config.js
├── package.json
├── .gitignore
└── README.md
```

---

## 🔄 API utilisée

### PokéAPI (https://pokeapi.co/api/v2)

L'application récupère les données des Pokémons via:
- `GET /pokemon/{id}` - Récupérer un Pokémon par ID
- `GET /pokemon?offset=X&limit=Y` - Lister des Pokémons

Données récupérées:
- ID du Pokédex
- Nom
- Image officielle
- Types (primaire + secondaire)
- Hauteur et poids

---

## 💾 Base de données

### Tables

#### pokemon
```sql
CREATE TABLE pokemon (
  id INTEGER PRIMARY KEY,
  pokedex_id INTEGER UNIQUE,
  name VARCHAR(100),
  image_url VARCHAR(255),
  is_captured BOOLEAN DEFAULT 0,
  capture_date TIMESTAMP,
  type_primary VARCHAR(50),
  type_secondary VARCHAR(50),
  height FLOAT,
  weight FLOAT,
  created_at TIMESTAMP
)
```

#### team
```sql
CREATE TABLE team (
  id INTEGER PRIMARY KEY,
  position INTEGER UNIQUE (1-6),
  pokemon_id INTEGER FOREIGN KEY,
  added_date TIMESTAMP,
  order_index INTEGER
)
```

### Chemins

- **Windows**: `%APPDATA%\pokedex-electron\pokedex.db`
- **macOS**: `~/Library/Application Support/pokedex-electron/pokedex.db`
- **Linux**: `~/.config/pokedex-electron/pokedex.db`

---

## 🔐 Sécurité

### Implémentée

1. **Context Isolation**: Isolement du contexte Electron
2. **No Node Integration**: Intégration Node désactivée
3. **Preload Script**: API limitée exposée via IPC
4. **Validation**: Validation des données avant insertion
5. **.gitignore**: Base de données excluée du versioning

---

## 🛠️ Développement

### Mode développement avec hot-reload

```bash
npm run dev
```

Cela démarrera le watcher et Electron ensemble.

### DevTools

Les DevTools sont automatiquement ouverts en mode développement.

### Logs

L'application log dans la console et dans les fichiers:
- `[📁] Chemin DB: ...`
- `[✅] Connecté à SQLite`
- `[🌐 Fetching: ...`
- `[📊 Progression: X/Y`

---

## 📦 Build et Distribution

### Builder l'application

```bash
npm run build
```

Cela créera:
- Exécutable Windows (.exe, .msi)
- Application macOS (.dmg)
- AppImage Linux

Les fichiers compilés seront dans `dist/`

---

## 🚀 CI/CD (GitHub Actions)

Un workflow GitHub Actions est configuré pour:
- Tester à chaque push
- Builder l'application
- Créer des releases

```yaml
# .github/workflows/build.yml
name: Build
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

## 🐛 Troubleshooting

### Problème: "DB is not initialized"
**Solution**: Relancer l'application. La DB est initialisée au démarrage.

### Problème: "Cannot fetch Pokemon"
**Solution**: Vérifier la connexion Internet. L'API PokéAPI est publique et ne nécessite pas d'authentification.

### Problème: "SQLite locked"
**Solution**: Fermer les autres instances de l'application.

### Problème: "Port already in use"
**Solution**: Tuer le processus Node:
```bash
pkill -f "node"
```

---

## 📚 Ressources

- [Electron Documentation](https://www.electronjs.org/docs)
- [PokéAPI Documentation](https://pokeapi.co/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Jest Testing Framework](https://jestjs.io/)

---

## 📝 Notes

- La base de données persiste entre les sessions
- Les Pokémons capturés et l'équipe sont sauvegardés automatiquement
- Le cache API a une validité de 24h
- Maximum 6 Pokémons dans une équipe

---

## 🤝 Contribution

Voir README.md pour les directives de contribution.

---

## 📄 Licence

MIT - Libre d'utilisation

---

**Bon jeu! 🎮 Capture tous les Pokémons!**

