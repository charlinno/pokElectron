# 🚀 Quick Start - Pokédex Electron

Guide rapide pour démarrer l'application et préparer la présentation.

---

## Installation Rapide

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd Pokedex

# 2. Installer les dépendances
npm install

# 3. Lancer l'application
npm start
```

---

## Commandes Importantes

```bash
# Développement
npm start                # Lancer l'app en mode dev
npm test                 # Lancer les tests
npm run test:coverage    # Tests avec couverture

# Build
npm run build           # Build toutes plateformes
npm run build:win       # Build Windows uniquement
npm run build:mac       # Build macOS uniquement
npm run build:linux     # Build Linux uniquement

# Qualité
npm run lint            # Vérifier le code
```

---

## Structure du Projet

```
Pokedex/
├── src/
│   ├── main/              # Processus principal
│   │   ├── main.js        # Point d'entrée
│   │   ├── database.js    # Gestion SQLite
│   │   └── api-service.js # API PokéAPI
│   ├── preload.js         # Bridge sécurisé
│   └── renderer/          # Interface utilisateur
│       ├── index.html
│       ├── css/styles.css
│       └── js/
│           ├── home.js
│           ├── pokedex.js
│           ├── capture.js
│           └── team.js
├── tests/                 # Tests Jest
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD
```

---

## Checklist Présentation

### Avant de commencer
- [ ] Application lancée (`npm start`)
- [ ] Base de données synchronisée (bouton refresh dans l'app)
- [ ] Avoir quelques Pokémons capturés
- [ ] GitHub ouvert sur le repository
- [ ] README.md visible
- [ ] Chronomètre prêt (10 minutes)

### Démonstration
1. **Page d'accueil** (30s)
   - Montrer les statistiques
   - Expliquer les 3 boutons

2. **Pokédex** (1min)
   - Liste complète des Pokémons
   - Filtrage capturé/non capturé
   - Fiche détaillée d'un Pokémon

3. **Système de capture** (2min)
   - Équipe affichée à gauche
   - Cliquer sur le Pokémon
   - Montrer les animations
   - Capturer un Pokémon

4. **Gestion d'équipe** (1min30)
   - Drag & Drop
   - Sauvegarder
   - Popup de confirmation

### Architecture (2min)
- Main process (Node.js)
- Preload (Bridge sécurisé)
- Renderer (Interface)
- Communication IPC

---

## Points Clés à Retenir

### Sécurité
✅ `contextIsolation: true`  
✅ `nodeIntegration: false`  
✅ `sandbox: true`  
✅ API limitée dans preload  
✅ Validation côté main  

### Base de Données
✅ SQLite embarqué  
✅ Requêtes paramétrées  
✅ Gestion d'erreurs  
✅ Transactions  

### Tests
✅ Tests Jest  
✅ Base en mémoire  
✅ Mocks pour API  
✅ Couverture >70%  

### CI/CD
✅ GitHub Actions  
✅ Tests automatiques  
✅ Build multi-plateformes  
✅ Release automatique  

---

## Problèmes Courants

### L'app ne démarre pas
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install
npm start
```

### Base de données vide
- Cliquer sur le bouton "refresh" (2 flèches) en haut à droite
- Attendre la synchronisation (peut prendre 1-2 minutes)

### Tests échouent
```bash
# Vérifier que toutes les dépendances sont installées
npm ci
npm test
```

---

## Contact & Support

- 📧 Email: votre-email@example.com
- 🐙 GitHub: https://github.com/votre-username/pokedex-electron
- 📚 Documentation: `docs/`

---

**Bonne chance pour votre présentation ! 🎉**

