# Cas d'usage - Pokedex Electron

## Vue d'ensemble

Ce document décrit les principaux cas d'usage de l'application Pokedex Electron et les interactions utilisateur.

---

## UC1: Consulter le Pokédex

### Acteur principal
Utilisateur

### Description
L'utilisateur veut consulter la liste complète de tous les Pokémons disponibles avec leurs détails.

### Préconditions
- L'application est lancée
- L'utilisateur a accès à la page d'accueil

### Flux principal
1. L'utilisateur clique sur le bouton "Pokédex" depuis la page d'accueil
2. L'application charge la liste de tous les Pokémons depuis PokéAPI
3. L'interface affiche les Pokémons avec:
   - Image du Pokémon
   - Nom
   - Numéro de Pokédex
   - Statut de capture (grisé si non capturé, couleur si capturé)
4. L'utilisateur peut scroller dans la liste
5. L'utilisateur peut cliquer sur un Pokémon pour voir ses détails

### Postconditions
- La liste du Pokédex est affichée
- Les statuts de capture sont correctement reflétés depuis la base de données

### Cas alternatifs
- **Erreur de connexion API** : Un message d'erreur est affiché, la liste locale (si disponible) est affichée

---

## UC2: Capturer un Pokémon

### Acteur principal
Utilisateur

### Acteurs secondaires
Système de génération aléatoire

### Description
Des Pokémons apparaissent aléatoirement sur l'écran. L'utilisateur doit cliquer dessus pour les capturer.

### Préconditions
- L'application est en cours d'exécution
- Un Pokémon n'a pas déjà été capturé

### Flux principal
1. Un Pokémon apparaît aléatoirement à une position sur l'écran
2. Un timer de 5-10 secondes démarre
3. L'utilisateur clique sur le Pokémon avant que le timer n'expire
4. Le système confirme la capture et:
   - Met à jour le statut dans la base de données
   - Affiche un message de succès
   - Retire le Pokémon de l'écran
5. Un nouveau Pokémon apparaît après 2-3 secondes

### Postconditions
- Le Pokémon est marqué comme capturé en base de données
- L'interface du Pokédex le reflète
- Le Pokémon peut être ajouté à l'équipe

### Cas alternatifs
- **Timeout expiré** : Le Pokémon disparaît sans être capturé
- **Pokémon déjà capturé** : Un message indique qu'il est déjà dans l'équipe, pas de double capture

---

## UC3: Gérer une équipe de 6 Pokémons

### Acteur principal
Utilisateur

### Description
L'utilisateur crée et gère une équipe personnalisée de 6 Pokémons capturés.

### Préconditions
- L'application est lancée
- L'utilisateur a capturé au moins 1 Pokémon
- L'utilisateur a accès à la page d'accueil

### Flux principal
1. L'utilisateur clique sur le bouton "Équipe" depuis la page d'accueil
2. L'interface affiche:
   - Les 6 emplacements de l'équipe (slots 1-6)
   - La liste des Pokémons capturés en bas de l'écran
3. L'utilisateur sélectionne un Pokémon capturé
4. L'utilisateur le drag-and-drop dans un slot de l'équipe
5. Le Pokémon apparaît dans le slot avec:
   - Son image
   - Son nom
   - Ses stats
6. L'utilisateur peut réorganiser l'ordre en déplaçant les Pokémons
7. L'utilisateur peut retirer un Pokémon en le dragging hors de son slot
8. L'utilisateur clique "Sauvegarder" pour persister l'équipe
9. Un message de confirmation apparaît

### Postconditions
- L'équipe de 6 Pokémons est sauvegardée en base de données
- L'ordre des Pokémons est conservé
- La page d'accueil peut afficher l'équipe formée

### Cas alternatifs
- **Moins de 6 Pokémons capturés** : Message d'avertissement, équipe incomplète sauvegardable
- **Pokémon retiré avant sauvegarde** : Les changements sont perdus si l'utilisateur quitte la page
- **Équipe déjà formée** : Possibilité de modifier l'équipe existante

---

## UC4: Naviguer entre les pages

### Acteur principal
Utilisateur

### Description
L'utilisateur navigue entre les différentes pages de l'application.

### Préconditions
- L'application est lancée
- L'utilisateur est sur la page d'accueil

### Flux principal
1. L'utilisateur voit les boutons:
   - "Consulter le Pokédex"
   - "Gérer mon Équipe"
   - "À propos"
2. L'utilisateur clique sur un bouton
3. L'application change de page
4. L'utilisateur voit un bouton "Retour" ou peut cliquer sur le logo pour revenir

### Postconditions
- La page demandée est affichée
- Les données sont conservées en base de données

---

## Diagramme des cas d'usage

```
┌─────────────────────────────────────────────────────┐
│                    Pokedex Electron                 │
└─────────────────────────────────────────────────────┘
        │
        │
        ├─────────── UC1: Consulter le Pokédex
        │                 - Lister tous les Pokémons
        │                 - Afficher détails
        │                 - Montrer statut de capture
        │
        ├─────────── UC2: Capturer un Pokémon
        │                 - Apparition aléatoire
        │                 - Cliquer pour capturer
        │                 - Persister en base de données
        │
        ├─────────── UC3: Gérer une équipe
        │                 - Sélectionner 6 Pokémons
        │                 - Organiser l'ordre
        │                 - Sauvegarder l'équipe
        │
        └─────────── UC4: Naviguer entre les pages
                          - Accueil
                          - Pokédex
                          - Équipe
```

---

## Acteurs

### Utilisateur
Personne qui utilise l'application pour:
- Consulter le Pokédex
- Capturer des Pokémons
- Gérer une équipe
- Naviguer dans l'application

### Système
- **PokéAPI** : Fournit les données des Pokémons
- **Base de données SQLite** : Persiste les captures et l'équipe
- **Générateur aléatoire** : Détermine quand les Pokémons apparaissent

---

## Scénarios d'utilisation typiques

### Scénario 1: Premier lancement
1. Utilisateur ouvre l'application
2. Voit la page d'accueil
3. Clique sur "Consulter le Pokédex"
4. Voit la liste vide (aucun Pokémon capturé)
5. Retour à l'accueil
6. Attend l'apparition d'un Pokémon
7. Clique pour capturer
8. Voit que le Pokédex est mis à jour

### Scénario 2: Formation d'une équipe
1. Utilisateur a capturé 10+ Pokémons
2. Clique sur "Gérer mon Équipe"
3. Sélectionne 6 Pokémons favoris
4. Les organise par ordre de préférence
5. Sauvegarde l'équipe
6. Voit l'équipe affichée sur la page d'accueil

### Scénario 3: Session longue
1. Utilisateur lance l'application
2. Laisse tourner pour capturer des Pokémons
3. Ferme et relance l'application
4. Ses captures et son équipe sont toujours là (persistance)

