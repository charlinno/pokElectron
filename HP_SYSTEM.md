# Système des HP (Points de Vie) - Pokédex Electron

## Comment fonctionnent les HP

### 1. Récupération depuis l'API PokéAPI

Les HP sont récupérés depuis l'endpoint PokéAPI officiel :
```
https://pokeapi.co/api/v2/pokemon/{id}
```

**Localisation dans la réponse JSON :**
```json
{
  "stats": [
    {
      "stat": {
        "name": "hp",
        "url": "https://pokeapi.co/api/v2/stat/1/"
      },
      "base_stat": 45  ← C'est la valeur utilisée
    },
    ...
  ]
}
```

### 2. Valeurs des HP par Pokémon

Les HP varient énormément selon le Pokémon :

| Pokémon | HP |
|---------|------|
| Pikachu | 35 |
| Bulbizarre | 45 |
| Florizarre | 80 |
| Charizard | 78 |
| Snorlax | 150 (très élevé) |
| Onix | 35 (très bas) |

**Plage typique :** 20 à 150 HP

### 3. Stockage dans la Base de Données

Les HP sont sauvegardés dans la table `pokemon` :

```sql
CREATE TABLE pokemon (
  ...
  hp INTEGER DEFAULT 20,  -- Colonne pour les HP
  ...
);
```

### 4. Utilisation dans l'Application

#### a) Page de Détails Pokédex
```
Pokédex → Cliquer sur un Pokémon → Voir les détails
└─ Affiche une barre de vie avec :
   - Nombre de HP (ex: "45")
   - Barre colorée (vert > 50%, orange 25-50%, rouge < 25%)
```

#### b) Système de Capture
```
Attraper des Pokémons → Pokémon qui apparaît
└─ Affiche :
   - Image du Pokémon
   - Barre de PV interactive
   - Texte : "PV: 45/45"
   - Cliquer pour réduire les PV
   - Capture automatique quand PV = 0
```

### 5. Code d'implémentation

**Récupération (api-service.js) :**
```javascript
// stats[0] contient toujours les HP
hp = apiPokemon.stats[0].base_stat;
```

**Affichage avec barre (pokedex.js) :**
```javascript
const hpPercentage = (hp / 150) * 100; // 150 = max théorique
// Affiche barre colorée selon le pourcentage
```

**Stockage en BD (database.js) :**
```javascript
INSERT INTO pokemon (... hp) VALUES (?, ?, ..., pokemon.hp)
```

## Résumé des modifications

### Fichiers modifiés :

1. **`src/main/api-service.js`**
   - Utilise directement `stats[0].base_stat`
   - Plus simple que chercher par nom
   - Plus performant

2. **`src/main/database.js`**
   - Maintenant stocke les HP lors de l'insertion
   - Paramètre ajouté à insertPokemon()

3. **`src/renderer/js/pokedex.js`**
   - Affiche les HP avec barre de vie colorée
   - Couleur : vert/orange/rouge selon pourcentage

4. **`src/renderer/js/capture.js`**
   - Utilise les HP pour le système de capture
   - Réduit progressivement les PV au clic

## Test des HP

Pour vérifier que les HP sont correctement récupérés :

```bash
# Exemple : Pikachu a 35 HP
# Bulbizarre a 45 HP
# Florizarre a 80 HP
```

Les HP s'affichent automatiquement dans :
- ✅ Page de détails (avec barre)
- ✅ Page de capture (HP réduits au clic)
- ✅ Base de données (sauvegardés)

## Notes importantes

1. **HP réalistes** : Les valeurs proviennent directement de l'API officielle
2. **Performance** : Récupération optimisée avec `stats[0]`
3. **Persistance** : Sauvegardés en local (SQLite)
4. **Interactivité** : Utilisés dans le système de capture

---

**Implémentation :** ✅ Complétée  
**Tests :** ✅ Validés  
**Version :** 2.2

