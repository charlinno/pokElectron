# Pokedex Electron

Une application de bureau Electron permettant de capturer des Pokémons, de consulter le Pokédex complet et de gérer une équipe de 6 Pokémons.

## Description

Pokedex Electron est une application interactive qui simule l'expérience d'un vrai Pokédex. Les utilisateurs peuvent:
- **Explorer le Pokédex** : Visualiser tous les Pokémons disponibles avec leurs détails
- **Capturer des Pokémons** : Des Pokémons apparaissent aléatoirement et peuvent être capturés en cliquant dessus
- **Gérer une équipe** : Créer une équipe personnalisée avec 6 Pokémons capturés
- **Persistance locale** : Les données de capture et d'équipe sont sauvegardées localement via SQLite

## Contexte

Ce projet a été développé comme exercice d'apprentissage Electron, combinant:
- **Frontend** : Interface utilisateur avec HTML/CSS/JavaScript
- **Backend** : Electron Main Process avec gestion des données
- **API** : Intégration PokéAPI via la bibliothèque `pokenode-ts`
- **Persistance** : Base de données SQLite locale pour les captures et équipes

## Fonctionnalités

### Page d'accueil
- Interface principale avec deux boutons de navigation
- Navigation vers Pokédex ou Équipe

### Pokédex
- Liste complète de tous les Pokémons
- Pokémons grisés s'ils ne sont pas capturés
- Détails du Pokémon (nom, image, numéro de Pokédex)

### Équipe
- Sélection de 6 Pokémons parmi ceux capturés
- Interface drag-and-drop pour organiser l'équipe
- Sauvegarde automatique de l'équipe

### Système de capture
- Apparition aléatoire de Pokémons
- Mécanisme de clic pour capturer
- Feedback visuel sur le succès de capture

## Installation

### Prérequis
- Node.js >= 14
- npm ou yarn

### Étapes
```bash
# Cloner le repository
git clone https://github.com/yourusername/pokedex-electron.git
cd pokedex-electron

# Installer les dépendances
npm install

# Démarrer l'application en développement
npm start

# Builder l'application pour la production
npm run build
```

## Structure du projet

```
pokedex-electron/
├── src/
│   ├── main/
│   │   ├── index.js          # Point d'entrée Electron
│   │   └── database.js       # Gestion SQLite
│   ├── renderer/
│   │   ├── index.html        # HTML principal
│   │   ├── home.html         # Page d'accueil
│   │   ├── pokedex.html      # Page Pokédex
│   │   ├── team.html         # Page équipe
│   │   └── assets/
│   │       ├── css/
│   │       └── js/
│   └── preload.js            # Preload script pour IPC
├── docs/
│   ├── use-cases.md          # Cas d'usage
│   ├── data-models.md        # Modèles de données UML
│   └── architecture.md       # Architecture de l'application
├── tests/
│   └── database.test.js      # Tests unitaires
├── .github/
│   └── workflows/
│       └── build.yml         # CI/CD GitHub Actions
├── package.json
└── README.md
```

## Technologies utilisées

- **Electron** : Framework pour applications de bureau
- **SQLite3** : Base de données locale
- **pokenode-ts** : Client API Pokémon
- **Jest** : Framework de test
- **Vanilla JavaScript** : Pas de framework frontend lourd

## Guide de contribution

### Fork et cloner
```bash
git clone https://github.com/votre-username/pokedex-electron.git
cd pokedex-electron
npm install
```

### Créer une branche
```bash
git checkout -b feature/ma-fonctionnalite
```

### Développement
1. Faire vos modifications
2. Tester localement avec `npm start`
3. Exécuter les tests : `npm test`

### Commit et Push
```bash
git add .
git commit -m "feat: description de ma fonctionnalité"
git push origin feature/ma-fonctionnalite
```

### Pull Request
- Créer une PR depuis votre fork
- Décrire les changements effectués
- Attendre la review

## Conventions de code

- Utiliser camelCase pour les variables et fonctions
- Utiliser const/let, pas var
- Ajouter des commentaires pour le code complexe
- Exécuter les tests avant de soumettre une PR

## Tests

Les tests sont écrits avec Jest et couvrent au minimum:
- Les opérations de base de données (CRUD)
- La logique de capture de Pokémons
- La gestion de l'équipe

Exécuter les tests:
```bash
npm test
```

## API Pokémon

L'application utilise l'API gratuite PokéAPI via la bibliothèque `pokenode-ts`:
- https://pokeapi.co/
- https://github.com/Gabb-c/pokenode-ts

## Licence

MIT

## Auteur

[Votre nom] - M2 MIAGE

## Ressources

- [Documentation Electron](https://www.electronjs.org/docs)
- [PokéAPI Documentation](https://pokeapi.co/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Jest Testing Framework](https://jestjs.io/)

