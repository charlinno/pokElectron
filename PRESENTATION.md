# 🎤 Guide de Présentation - Pokédex Electron

**Durée totale : 10 minutes**  
**Préparation : Chronomètre, application lancée, GitHub ouvert**

---

## ⏱️ Timing Détaillé

| Section | Durée | Points clés |
|---------|-------|-------------|
| **1. Pitch** | 3 min | Présentation du projet |
| **2. Démo** | 5 min | Utilisation en direct |
| **3. Architecture** | 2 min | Explication technique |

---

## 1️⃣ PITCH DU PROJET (3 minutes)

### Intro (30s)
> "Bonjour, je vais vous présenter **Pokédex Electron**, une application desktop de collection et gestion de Pokémons."

### Contexte & Objectif (1 min)
📌 **Nom** : Pokédex Electron  
📌 **Objectif** : Créer une app desktop complète avec Electron  
📌 **Utilité** :
- Consulter un Pokédex complet (1000+ Pokémons)
- Capturer des Pokémons via un système de clicker
- Gérer une équipe stratégique de 6 Pokémons
- Sauvegarder localement sa progression

📌 **Public cible** : Fans de Pokémon qui veulent une expérience desktop immersive

### Fonctionnalités principales (1min30)

#### 🗂️ Pokédex complet
- Visualisation de tous les Pokémons
- Filtrage capturé/non capturé
- Fiches détaillées (stats, types, poids, taille)

#### 🎯 Système de capture innovant
- Mode clicker avec PV réels des Pokémons
- Coups critiques (3% chance) → x10 dégâts
- Pokéball rare (10% chance) → capture instantanée
- Animations fluides

#### ⚔️ Gestion d'équipe
- Équipe de 6 Pokémons
- Drag & Drop pour organiser
- Bonus : +1 dégât/clic par Pokémon

#### 💾 Persistance locale
- Base SQLite embarquée
- Sync avec PokéAPI
- Sauvegarde auto

---

## 2️⃣ DÉMONSTRATION (5 minutes)

### 🎯 Scénario de démo (préparé et fluide)

#### **Étape 1 : Page d'accueil (30s)**
✅ Montrer :
- Statistiques (X/1000 Pokémons capturés)
- 3 boutons principaux
- Interface moderne et épurée

> "Voici la page d'accueil. On voit immédiatement nos statistiques de progression."

---

#### **Étape 2 : Pokédex (1min)**
✅ Actions :
1. Cliquer sur "Consulter le Pokédex"
2. Scroller pour montrer la liste complète
3. Montrer des Pokémons capturés (en couleur)
4. Montrer des Pokémons non capturés (grisés)
5. Cliquer sur un Pokémon → Fiche détaillée

✅ Points à mentionner :
- "Plus de 1000 Pokémons synchronisés depuis PokéAPI"
- "Les capturés sont en couleur, les autres grisés"
- "Chaque Pokémon a une fiche avec ses vraies stats"

---

#### **Étape 3 : Système de capture (2min)**
✅ Actions :
1. Retour accueil → "Attraper des Pokémons"
2. Montrer l'équipe à gauche (si vide : "Pas encore d'équipe")
3. Pokémon apparaît avec barre de PV
4. **Cliquer plusieurs fois** pour montrer :
   - Les slashs d'attaque
   - La barre de PV qui descend (vert → jaune → rouge)
   - Les dégâts qui s'affichent
5. **Si chance** : montrer coup critique ou pokéball rare
6. Attendre la capture → Animation de capture
7. Message "CAPTURE !" s'affiche

✅ Points à mentionner :
- "Les PV sont basés sur les vraies stats du Pokémon"
- "Chaque clic fait 1 dégât de base"
- "Il y a 3% de chance de coup critique qui fait x10 dégâts"
- "Une Pokéball rare peut apparaître (10% chance) pour capture instantanée"

---

#### **Étape 4 : Gestion d'équipe (1min30)**
✅ Actions :
1. Retour accueil → "Gérer mon Équipe"
2. Montrer les 6 slots
3. **Drag & Drop** un Pokémon capturé dans un slot
4. Faire un 2e drag & drop
5. Cliquer sur "Sauvegarder"
6. **Popup de confirmation** s'affiche

✅ Points à mentionner :
- "On peut constituer une équipe de 6 Pokémons"
- "Drag & Drop intuitif"
- "Chaque Pokémon en équipe ajoute +1 dégât au clicker"
- "Sauvegarde locale dans SQLite avec confirmation"

---

### ⚠️ Points d'attention démo

✅ **Préparer** :
- App lancée ET HOME page affichée
- Avoir déjà quelques Pokémons capturés
- Avoir une équipe pré-configurée (ou vide pour montrer le setup)

✅ **Éviter** :
- Les bugs d'improvisation
- Les longs temps de chargement (avoir déjà sync)
- Les hésitations sur les clics

✅ **Backup plan** :
- Si bug : "Voici comment ça devrait fonctionner" + expliquer
- Si temps trop court : focus sur capture et équipe

---

## 3️⃣ ARCHITECTURE TECHNIQUE (2 minutes)

### Schéma mental à présenter

```
MAIN PROCESS (Node.js)
    ├── main.js → Création fenêtre, cycle de vie
    ├── database.js → SQLite (CRUD)
    └── api-service.js → PokéAPI (fetch)
           ↓ IPC (contextBridge)
PRELOAD SCRIPT
    └── preload.js → API sécurisée exposée
           ↓
RENDERER PROCESS (Navigateur)
    └── HTML/CSS/JS → Interface utilisateur
```

### Points à expliquer (2 min)

#### **1. Processus principal (main)** (30s)
> "Le processus principal gère :
> - La création de la fenêtre Electron
> - La base de données SQLite
> - Les appels à l'API PokéAPI
> - Les handlers IPC qui répondent aux demandes du renderer"

#### **2. Preload script** (30s)
> "Le preload est un bridge sécurisé :
> - Il expose une API limitée via `contextBridge`
> - Le renderer ne peut accéder qu'aux fonctions explicitement exposées
> - Exemple : `window.pokemonAPI.getAllPokemon()`
> - Ça protège contre les injections XSS"

#### **3. Renderer process** (30s)
> "Le renderer est l'interface utilisateur :
> - HTML/CSS/JS classique
> - Pas d'accès direct à Node.js ou Electron
> - Communique avec le main via l'API exposée
> - Totalement isolé pour la sécurité"

#### **4. IPC (Communication)** (30s)
> "La communication entre main et renderer se fait via IPC :
> - Le renderer envoie une requête : `ipcRenderer.invoke('get-all-pokemon')`
> - Le main traite et répond : `ipcMain.handle('get-all-pokemon', ...)`
> - C'est asynchrone, basé sur des Promises
> - Exemple : cliquer sur 'Capturer' → IPC → main update la DB → renderer reçoit la réponse"

---

## 🔒 SÉCURITÉ (Si questions)

### Points clés à retenir

**contextIsolation: true**
- Isolation complète renderer ↔ main
- Empêche l'accès direct aux APIs Node.js
- Protection contre XSS

**nodeIntegration: false**
- Pas d'accès Node.js dans le renderer
- Évite l'exécution de commandes système malveillantes

**sandbox: true**
- Processus sandboxé
- Limite les dégâts en cas de compromission

**API limitée dans preload**
- Principe du moindre privilège
- Uniquement les fonctions nécessaires exposées

**Validation côté main**
- Ne jamais faire confiance au renderer
- Toujours valider les paramètres

---

## 💾 BASE DE DONNÉES (Si questions)

### SQLite embarqué

**Tables principales** :
- `pokemon` : données des Pokémons
- `team` : composition de l'équipe

**Requêtes principales** :
```sql
-- Insertion
INSERT INTO pokemon (pokedex_id, name, ...) VALUES (?, ?, ...)

-- Sélection
SELECT * FROM pokemon WHERE is_captured = 1

-- Mise à jour
UPDATE pokemon SET is_captured = 1 WHERE id = ?

-- Équipe
INSERT INTO team (position, pokemon_id) VALUES (?, ?)
```

**Gestion d'erreurs** :
- Try/catch systématique
- Transactions pour opérations multiples
- Rollback en cas d'erreur

---

## 🔄 CI/CD & TESTS (Si questions)

### Tests Jest

**Couverture** :
- Tests unitaires sur database.js
- Tests sur api-service.js
- Base de données en mémoire pour isolation
- Mocks pour les appels réseau

**Exécution** :
```bash
npm test           # Lancer les tests
npm run test:watch # Mode watch
npm run test:coverage # Rapport de couverture
```

### Pipeline GitHub Actions

**CI Workflow** :
1. Lint du code
2. Exécution des tests Jest
3. Build multi-plateformes (Win/Mac/Linux)
4. Upload des artifacts

**Release Workflow** :
- Déclenché par tag `v*.*.*`
- Build automatique
- Création de release GitHub
- Upload des exécutables

---

## 📦 PACKAGING (Si questions)

### Electron Builder

**Configuration** :
```json
"build": {
  "appId": "com.sdv.pokedex",
  "asar": true,
  "win": { "target": "nsis" },
  "mac": { "target": "dmg" },
  "linux": { "target": ["AppImage", "deb"] }
}
```

**Formats de sortie** :
- Windows : `.exe` (installateur NSIS)
- macOS : `.dmg`
- Linux : `.AppImage` et `.deb`

**Build** :
```bash
npm run build:win
npm run build:mac
npm run build:linux
```

---

## 🎯 QUESTIONS ATTENDUES & RÉPONSES

### Q1: "Pourquoi utiliser un preload ?"
**R:** Le preload est le seul moyen de créer un pont sécurisé entre le main et le renderer tout en gardant `contextIsolation: true`. Il permet d'exposer uniquement les fonctions nécessaires, appliquant le principe du moindre privilège.

### Q2: "Que se passe-t-il si deux IPC se déclenchent en même temps ?"
**R:** Electron gère ça de manière asynchrone. Chaque `ipcRenderer.invoke()` retourne une Promise. Les deux requêtes sont traitées en parallèle par le main process, et chaque renderer reçoit sa réponse indépendamment. SQLite gère les accès concurrents avec des locks.

### Q3: "Comment sécuriser davantage votre app ?"
**R:** 
- Ajouter une **CSP (Content Security Policy)** stricte
- **Chiffrer** la base SQLite avec SQLCipher
- Valider/sanitizer **toutes** les entrées utilisateur
- Mettre en place des **logs d'audit**
- Implémenter une authentification si données sensibles

### Q4: "Comment gérer la corruption de la base de données ?"
**R:** 
- **Backup automatique** avant chaque opération critique
- **Détection** via `PRAGMA integrity_check`
- **Récupération** : restaurer depuis le backup ou recréer la DB
- **Prévention** : utiliser des transactions SQLite

### Q5: "Différence main/renderer en termes de sécurité ?"
**R:** 
- **Main** : accès complet (Node.js, Electron, filesystem) → privilèges élevés
- **Renderer** : sandboxé, pas d'accès Node → faibles privilèges
- **Pourquoi ?** Le renderer exécute du HTML/JS potentiellement injectable (XSS). En cas de compromission, l'attaquant ne peut rien faire sans passer par le main.

### Q6: "Pourquoi ne pas exposer directement `fs` ?"
**R:** Si on expose `fs` au renderer, n'importe quel code malveillant (XSS) pourrait lire/écrire/supprimer des fichiers système. En exposant seulement des fonctions spécifiques (ex: `savePokemon`), on contrôle exactement ce qui est accessible.

### Q7: "Pourquoi SQLite ?"
**R:** 
- **Embarqué** : pas de serveur séparé
- **Léger** : parfait pour desktop
- **Performant** pour volume faible/moyen
- **ACID** : transactions fiables
- **Portable** : un seul fichier `.db`

### Q8: "Pourquoi tester avec une DB en mémoire ?"
**R:** 
- **Rapide** : pas d'I/O disque
- **Isolé** : chaque test repart de zéro
- **Prévisible** : pas d'effets de bord
- Avec Jest, on crée une DB SQLite en mémoire (`:memory:`)

### Q9: "Idées d'amélioration ?"
**R:** 
- **Combats** contre des Pokémons IA
- **Échanges** entre utilisateurs (WebSocket)
- **Succès/Achievements**
- **Mode hors ligne** complet
- **Thèmes personnalisables**
- **Export/Import** équipe (JSON)

### Q10: "Déploiement multiplateforme ?"
**R:** 
- GitHub Actions avec matrice OS : `[ubuntu, windows, macos]`
- Electron Builder build pour chaque OS
- Artifacts uploadés vers GitHub Releases
- Utilisateurs téléchargent l'exécutable de leur plateforme

---

## 📋 CHECKLIST AVANT PRÉSENTATION

### Environnement
- [ ] Application lancée et sur page d'accueil
- [ ] Base de données synchronisée (Pokémons chargés)
- [ ] Avoir quelques Pokémons déjà capturés
- [ ] Avoir une équipe ou slots vides pour démo
- [ ] GitHub ouvert sur le repo
- [ ] Chronomètre prêt (10 min)

### Documents
- [ ] README.md complet et visible sur GitHub
- [ ] Documentation dans `docs/` accessible
- [ ] Ce guide de présentation sous la main

### Tests rapides
- [ ] Lancer `npm test` → tout passe
- [ ] Lancer `npm start` → app démarre sans erreur
- [ ] Tester capture → fonctionne
- [ ] Tester drag & drop équipe → fonctionne
- [ ] Tester sauvegarde équipe → popup s'affiche

---

## 💡 CONSEILS DERNIÈRE MINUTE

### ✅ À FAIRE
- Respirer et être confiant
- Parler clairement et pas trop vite
- Regarder l'audience, pas que l'écran
- Utiliser des termes techniques mais expliquer
- Montrer que vous comprenez (pas juste que "ça marche")
- Rester dans le timing (chrono!)

### ❌ À ÉVITER
- Lire vos notes mot à mot
- Parler trop technique sans contexte
- Improviser (démo préparée!)
- Paniquer si mini-bug (expliquer ce qui devrait se passer)
- Dépasser le temps

---

## 🎬 SCRIPT MENTAL SIMPLIFIÉ

**0-3min** : "Voici Pokédex Electron, une app pour capturer et gérer des Pokémons. Voici les fonctionnalités..."

**3-8min** : [DÉMO LIVE] "Je vous montre..." → Home → Pokédex → Capture → Équipe

**8-10min** : "L'architecture repose sur 3 piliers : main, preload, renderer. Voici comment ils communiquent..."

**10-15min** : [QUESTIONS] Répondre avec assurance en citant des exemples du code.

---

## 🚀 VOUS ÊTES PRÊT !

Bonne chance pour votre présentation ! 🎉

Rappelez-vous :
- **Vous connaissez votre projet**
- **La démo est préparée**
- **Vous avez anticipé les questions**
- **Restez calme et professionnel**

**Vous allez assurer ! 💪**

