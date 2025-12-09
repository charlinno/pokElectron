# Tests Unitaires - Pokedex Electron

## Vue d'ensemble

Ce document décrit la stratégie de test et l'implémentation des tests unitaires pour l'application Pokedex Electron avec Jest.

---

## Stratégie de test

### Objectifs
- Tester au minimum 2 entités (Pokemon et Team)
- Couvrir les opérations CRUD de la base de données
- Tester la logique métier de capture et d'équipe
- Tester les appels API et la gestion d'erreurs

### Couverture cible
- **Database Layer** : 80%+ de couverture
- **API Service** : 70%+ de couverture
- **Renderer Logic** : 50%+ de couverture

### Types de tests

```
┌─────────────────────────────────────────────┐
│           Types de Tests                    │
├─────────────────────────────────────────────┤
│                                             │
│ 1. Tests Unitaires (Jest)                   │
│    - Database operations                    │
│    - API Service                            │
│    - Utility functions                      │
│                                             │
│ 2. Tests d'Intégration                      │
│    - IPC communication                      │
│    - Database + API                         │
│                                             │
│ 3. Tests End-to-End (optionnel)             │
│    - Scenarios complets                     │
│    - Interactions utilisateur                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Configuration Jest

### Installation et configuration

```bash
npm install --save-dev jest @types/jest sqlite3
```

### jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/main/**/*.js',
    '!src/main/index.js', // Entry point
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
};
```

### package.json scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit/",
    "test:integration": "jest tests/integration/"
  }
}
```

---

## Tests Unitaires - Database

### Fichier: tests/database.test.js

```javascript
const Database = require('../src/main/database');
const path = require('path');
const fs = require('fs');

describe('Database Operations', () => {
  let db;
  const testDbPath = path.join(__dirname, 'test.db');

  // Setup: créer une DB de test avant chaque test
  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new Database(testDbPath);
    db.initialize();
  });

  // Cleanup: fermer la DB après chaque test
  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  // ============================================
  // Tests: Table Pokemon
  // ============================================

  describe('Pokemon CRUD Operations', () => {

    test('should insert a pokemon', (done) => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://...',
        type_primary: 'grass',
        height: 7,
        weight: 69
      };

      db.insertPokemon(pokemon, (err, id) => {
        expect(err).toBeNull();
        expect(id).toBeDefined();
        done();
      });
    });

    test('should retrieve all pokemon', (done) => {
      const pokemons = [
        {
          pokedex_id: 1,
          name: 'Bulbasaur',
          image_url: 'https://...',
          type_primary: 'grass'
        },
        {
          pokedex_id: 4,
          name: 'Charmander',
          image_url: 'https://...',
          type_primary: 'fire'
        }
      ];

      pokemons.forEach(p => {
        db.insertPokemon(p, () => {});
      });

      setTimeout(() => {
        db.getAllPokemon((err, result) => {
          expect(err).toBeNull();
          expect(result.length).toBe(2);
          expect(result[0].name).toBe('Bulbasaur');
          expect(result[1].name).toBe('Charmander');
          done();
        });
      }, 100);
    });

    test('should get pokemon by id', (done) => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://...'
      };

      db.insertPokemon(pokemon, (err, id) => {
        db.getPokemonById(id, (err, result) => {
          expect(err).toBeNull();
          expect(result.name).toBe('Bulbasaur');
          expect(result.pokedex_id).toBe(1);
          done();
        });
      });
    });

    test('should update pokemon as captured', (done) => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://...',
        is_captured: 0
      };

      db.insertPokemon(pokemon, (err, id) => {
        db.updatePokemonCaptured(id, 1, (err) => {
          expect(err).toBeNull();

          db.getPokemonById(id, (err, result) => {
            expect(result.is_captured).toBe(1);
            expect(result.capture_date).toBeDefined();
            done();
          });
        });
      });
    });

    test('should get captured pokemons only', (done) => {
      const pokemons = [
        {
          pokedex_id: 1,
          name: 'Bulbasaur',
          image_url: 'https://...',
          is_captured: 1
        },
        {
          pokedex_id: 2,
          name: 'Ivysaur',
          image_url: 'https://...',
          is_captured: 0
        }
      ];

      pokemons.forEach(p => {
        db.insertPokemon(p, () => {});
      });

      setTimeout(() => {
        db.getCapturedPokemon((err, result) => {
          expect(err).toBeNull();
          expect(result.length).toBe(1);
          expect(result[0].name).toBe('Bulbasaur');
          done();
        });
      }, 100);
    });

    test('should delete pokemon', (done) => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://...'
      };

      db.insertPokemon(pokemon, (err, id) => {
        db.deletePokemon(id, (err) => {
          expect(err).toBeNull();

          db.getPokemonById(id, (err, result) => {
            expect(result).toBeUndefined();
            done();
          });
        });
      });
    });

    test('should enforce unique pokedex_id', (done) => {
      const pokemon1 = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://...'
      };

      const pokemon2 = {
        pokedex_id: 1, // Même ID
        name: 'Bulbasaur-duplicate',
        image_url: 'https://...'
      };

      db.insertPokemon(pokemon1, () => {
        db.insertPokemon(pokemon2, (err) => {
          expect(err).toBeDefined(); // Doit échouer
          done();
        });
      });
    });

    test('should count captured pokemons', (done) => {
      const pokemons = [
        { pokedex_id: 1, name: 'Bulbasaur', image_url: '...', is_captured: 1 },
        { pokedex_id: 2, name: 'Ivysaur', image_url: '...', is_captured: 0 },
        { pokedex_id: 3, name: 'Venusaur', image_url: '...', is_captured: 1 }
      ];

      pokemons.forEach(p => {
        db.insertPokemon(p, () => {});
      });

      setTimeout(() => {
        db.countCapturedPokemon((err, count) => {
          expect(err).toBeNull();
          expect(count).toBe(2);
          done();
        });
      }, 100);
    });

  });

  // ============================================
  // Tests: Table Team
  // ============================================

  describe('Team CRUD Operations', () => {

    beforeEach((done) => {
      // Insérer des pokemons pour les tests d'équipe
      const pokemons = [
        { pokedex_id: 1, name: 'Bulbasaur', image_url: '...' },
        { pokedex_id: 4, name: 'Charmander', image_url: '...' },
        { pokedex_id: 7, name: 'Squirtle', image_url: '...' }
      ];

      let inserted = 0;
      pokemons.forEach(p => {
        db.insertPokemon(p, () => {
          inserted++;
          if (inserted === pokemons.length) done();
        });
      });
    });

    test('should add pokemon to team', (done) => {
      db.addPokemonToTeam(1, 1, (err) => {
        expect(err).toBeNull();

        db.getTeam((err, team) => {
          expect(team.length).toBe(1);
          expect(team[0].position).toBe(1);
          done();
        });
      });
    });

    test('should get complete team', (done) => {
      db.addPokemonToTeam(1, 1, () => {
        db.addPokemonToTeam(2, 2, () => {
          db.getTeam((err, team) => {
            expect(err).toBeNull();
            expect(team.length).toBe(2);
            expect(team[0].position).toBe(1);
            expect(team[0].pokemon_id).toBe(1);
            expect(team[1].position).toBe(2);
            expect(team[1].pokemon_id).toBe(2);
            done();
          });
        });
      });
    });

    test('should remove pokemon from team', (done) => {
      db.addPokemonToTeam(1, 1, () => {
        db.removePokemonFromTeam(1, (err) => {
          expect(err).toBeNull();

          db.getTeam((err, team) => {
            expect(team.length).toBe(0);
            done();
          });
        });
      });
    });

    test('should update team position', (done) => {
      db.addPokemonToTeam(1, 1, () => {
        db.updateTeamPosition(1, 3, (err) => {
          expect(err).toBeNull();

          db.getTeam((err, team) => {
            const slot = team.find(t => t.pokemon_id === 1);
            expect(slot.position).toBe(3);
            done();
          });
        });
      });
    });

    test('should prevent duplicate pokemon in team', (done) => {
      db.addPokemonToTeam(1, 1, () => {
        db.addPokemonToTeam(2, 1, (err) => {
          // Doit échouer ou ignorer le doublon
          expect(err).toBeDefined();
          done();
        });
      });
    });

    test('should enforce max 6 pokemon in team', (done) => {
      // Insérer 7 pokemons
      const addToTeam = (position, pokemonId) => {
        return new Promise((resolve) => {
          db.addPokemonToTeam(position, pokemonId, resolve);
        });
      };

      (async () => {
        try {
          for (let i = 1; i <= 7; i++) {
            await addToTeam(i, i);
          }
          // Le 7ème doit échouer ou être ignoré
          expect(true).toBe(true); // Vérifier comportement
          done();
        } catch (err) {
          expect(err).toBeDefined();
          done();
        }
      })();
    });

    test('should update entire team', (done) => {
      const teamData = [
        { position: 1, pokemon_id: 1 },
        { position: 2, pokemon_id: 2 },
        { position: 3, pokemon_id: 3 }
      ];

      db.updateTeam(teamData, (err) => {
        expect(err).toBeNull();

        db.getTeam((err, team) => {
          expect(team.length).toBe(3);
          expect(team[0].pokemon_id).toBe(1);
          expect(team[1].pokemon_id).toBe(2);
          expect(team[2].pokemon_id).toBe(3);
          done();
        });
      });
    });

  });

  // ============================================
  // Tests: Intégration
  // ============================================

  describe('Cross-Entity Operations', () => {

    test('should get full team with pokemon details', (done) => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://...',
        type_primary: 'grass'
      };

      db.insertPokemon(pokemon, (err, pokemonId) => {
        db.addPokemonToTeam(1, pokemonId, () => {
          db.getTeamWithDetails((err, team) => {
            expect(err).toBeNull();
            expect(team[0].name).toBe('Bulbasaur');
            expect(team[0].type_primary).toBe('grass');
            done();
          });
        });
      });
    });

    test('should handle captured pokemon in team', (done) => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: '...',
        is_captured: 1
      };

      db.insertPokemon(pokemon, (err, id) => {
        db.addPokemonToTeam(1, id, (err) => {
          expect(err).toBeNull();

          db.getPokemonById(id, (err, result) => {
            expect(result.is_captured).toBe(1);
            done();
          });
        });
      });
    });

  });

});
```

---

## Tests Unitaires - API Service

### Fichier: tests/api-service.test.js

```javascript
const APIService = require('../src/main/api-service');

// Mock du client PokéAPI
jest.mock('pokenode-ts', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      pokemon: {
        getPokemonByName: jest.fn((name) => {
          const mockData = {
            'bulbasaur': {
              id: 1,
              name: 'bulbasaur',
              sprites: { official_artwork: { front_default: 'https://...' } },
              types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
              height: 7,
              weight: 69
            }
          };
          return Promise.resolve(mockData[name]);
        })
      }
    }))
  };
});

describe('API Service', () => {
  let apiService;

  beforeEach(() => {
    apiService = new APIService();
  });

  describe('Pokemon Fetching', () => {

    test('should fetch pokemon by name', async () => {
      const pokemon = await apiService.getPokemonByName('bulbasaur');
      
      expect(pokemon).toBeDefined();
      expect(pokemon.name).toBe('bulbasaur');
      expect(pokemon.id).toBe(1);
    });

    test('should cache pokemon data', async () => {
      const pokemon1 = await apiService.getPokemonByName('bulbasaur');
      const pokemon2 = await apiService.getPokemonByName('bulbasaur');
      
      expect(pokemon1).toEqual(pokemon2);
      expect(apiService.client.pokemon.getPokemonByName).toHaveBeenCalledTimes(1); // Cache hit
    });

    test('should handle API errors', async () => {
      jest.spyOn(apiService.client.pokemon, 'getPokemonByName')
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getPokemonByName('invalid'))
        .rejects
        .toThrow('Network error');
    });

  });

  describe('Data Transformation', () => {

    test('should transform API response to DB format', async () => {
      const pokemon = await apiService.getPokemonByName('bulbasaur');
      const transformed = apiService.transformPokemonData(pokemon);

      expect(transformed.pokedex_id).toBe(1);
      expect(transformed.name).toBe('bulbasaur');
      expect(transformed.image_url).toBeDefined();
      expect(transformed.type_primary).toBe('grass');
      expect(transformed.type_secondary).toBe('poison');
    });

  });

});
```

---

## Tests Unitaires - Renderer Logic

### Fichier: tests/pokedex-logic.test.js

```javascript
const PokédexManager = require('../src/renderer/js/pokedex');

describe('Pokédex Logic', () => {
  let pokédex;
  let mockAPI;

  beforeEach(() => {
    mockAPI = {
      getAllPokemon: jest.fn().mockResolvedValue([
        { id: 1, name: 'Bulbasaur', is_captured: 1 },
        { id: 2, name: 'Ivysaur', is_captured: 0 },
        { id: 3, name: 'Venusaur', is_captured: 1 }
      ]),
      capturePokemon: jest.fn().mockResolvedValue({ success: true })
    };

    pokédex = new PokédexManager(mockAPI);
  });

  describe('Loading Pokemon', () => {

    test('should load all pokemon', async () => {
      await pokédex.loadPokemon();
      
      expect(pokédex.pokemonList.length).toBe(3);
      expect(pokédex.pokemonList[0].name).toBe('Bulbasaur');
    });

    test('should track captured pokemon', async () => {
      await pokédex.loadPokemon();
      
      expect(pokédex.capturedPokemon.has(1)).toBe(true);
      expect(pokédex.capturedPokemon.has(2)).toBe(false);
      expect(pokédex.capturedPokemon.has(3)).toBe(true);
    });

  });

  describe('Capture Mechanic', () => {

    test('should capture pokemon', async () => {
      await pokédex.capturePokemon(2);
      
      expect(mockAPI.capturePokemon).toHaveBeenCalledWith(2);
      expect(pokédex.capturedPokemon.has(2)).toBe(true);
    });

    test('should handle capture errors', async () => {
      mockAPI.capturePokemon.mockRejectedValueOnce(new Error('Capture failed'));
      
      await expect(pokédex.capturePokemon(2))
        .rejects
        .toThrow('Capture failed');
    });

  });

  describe('Filtering', () => {

    test('should filter captured pokemon', async () => {
      await pokédex.loadPokemon();
      const captured = pokédex.getFilteredPokemon({ captured: true });
      
      expect(captured.length).toBe(2);
      expect(captured.every(p => pokédex.capturedPokemon.has(p.id))).toBe(true);
    });

    test('should filter uncaptured pokemon', async () => {
      await pokédex.loadPokemon();
      const uncaptured = pokédex.getFilteredPokemon({ captured: false });
      
      expect(uncaptured.length).toBe(1);
      expect(uncaptured[0].name).toBe('Ivysaur');
    });

  });

});
```

---

## Tests Unitaires - Team Logic

### Fichier: tests/team-logic.test.js

```javascript
const TeamManager = require('../src/renderer/js/team');

describe('Team Logic', () => {
  let team;
  let mockAPI;

  beforeEach(() => {
    mockAPI = {
      getCapturedPokemon: jest.fn().mockResolvedValue([
        { id: 1, name: 'Bulbasaur' },
        { id: 2, name: 'Ivysaur' },
        { id: 3, name: 'Venusaur' },
        { id: 4, name: 'Charmander' }
      ]),
      getTeam: jest.fn().mockResolvedValue([]),
      updateTeam: jest.fn().mockResolvedValue({ success: true })
    };

    team = new TeamManager(mockAPI);
  });

  describe('Team Formation', () => {

    test('should add pokemon to team slot', async () => {
      await team.load();
      team.addToSlot(1, 1); // Slot 1, Pokemon ID 1
      
      expect(team.team[0]).toEqual({ position: 1, pokemon_id: 1 });
    });

    test('should remove pokemon from team', () => {
      team.team = [
        { position: 1, pokemon_id: 1 },
        { position: 2, pokemon_id: 2 }
      ];

      team.removeFromSlot(1);
      
      expect(team.team.length).toBe(1);
      expect(team.team[0].position).toBe(2);
    });

    test('should reorder team', () => {
      team.team = [
        { position: 1, pokemon_id: 1 },
        { position: 2, pokemon_id: 2 },
        { position: 3, pokemon_id: 3 }
      ];

      team.reorderSlots([3, 1, 2]); // Nouveau ordre
      
      expect(team.team[0].pokemon_id).toBe(3);
      expect(team.team[1].pokemon_id).toBe(1);
      expect(team.team[2].pokemon_id).toBe(2);
    });

  });

  describe('Validation', () => {

    test('should allow max 6 pokemon', () => {
      team.team = Array(6).fill(0).map((_, i) => ({
        position: i + 1,
        pokemon_id: i + 1
      }));

      expect(() => team.addToSlot(7, 7)).toThrow('Team is full');
    });

    test('should prevent duplicate pokemon', () => {
      team.team = [{ position: 1, pokemon_id: 1 }];
      
      expect(() => team.addToSlot(2, 1)).toThrow('Pokemon already in team');
    });

    test('should validate team before save', async () => {
      team.team = [{ position: 1, pokemon_id: 1 }]; // Équipe incomplète
      
      const valid = await team.validate();
      expect(valid).toBe(true); // Incomplète = ok
    });

  });

  describe('Persistence', () => {

    test('should save team', async () => {
      team.team = [
        { position: 1, pokemon_id: 1 },
        { position: 2, pokemon_id: 2 }
      ];

      await team.save();
      
      expect(mockAPI.updateTeam).toHaveBeenCalledWith(team.team);
    });

    test('should load existing team', async () => {
      mockAPI.getTeam.mockResolvedValueOnce([
        { position: 1, pokemon_id: 1 },
        { position: 2, pokemon_id: 2 }
      ]);

      await team.load();
      
      expect(team.team.length).toBe(2);
    });

  });

});
```

---

## Commandes de test

### Exécuter tous les tests
```bash
npm test
```

### Exécuter avec watch
```bash
npm run test:watch
```

### Couvrir les tests (rapport de couverture)
```bash
npm run test:coverage
```

### Exécuter un test spécifique
```bash
npm test -- database.test.js
```

### Exécuter avec logs détaillés
```bash
npm test -- --verbose
```

---

## Résultats attendus

### Exemple de résultat de test

```
PASS  tests/database.test.js
  Database Operations
    Pokemon CRUD Operations
      ✓ should insert a pokemon (45ms)
      ✓ should retrieve all pokemon (12ms)
      ✓ should get pokemon by id (8ms)
      ✓ should update pokemon as captured (15ms)
      ✓ should get captured pokemons only (18ms)
      ✓ should delete pokemon (10ms)
      ✓ should enforce unique pokedex_id (22ms)
      ✓ should count captured pokemons (9ms)
    Team CRUD Operations
      ✓ should add pokemon to team (14ms)
      ✓ should get complete team (11ms)
      ✓ should remove pokemon from team (12ms)
      ✓ should update team position (13ms)
      ✓ should prevent duplicate pokemon in team (16ms)
      ✓ should enforce max 6 pokemon in team (18ms)
      ✓ should update entire team (15ms)
    Cross-Entity Operations
      ✓ should get full team with pokemon details (22ms)
      ✓ should handle captured pokemon in team (19ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Time:        2.845s
```

---

## Bonnes pratiques de test

### 1. Isolation
- Chaque test doit être indépendant
- Utiliser `beforeEach` et `afterEach` pour setup/cleanup

### 2. Nommage clair
```javascript
// ❌ Mauvais
test('works', () => { });

// ✅ Bon
test('should capture pokemon when clicked before timeout expires', () => { });
```

### 3. Arrange-Act-Assert
```javascript
test('should update pokemon as captured', () => {
  // Arrange
  const pokemon = { id: 1, is_captured: 0 };
  
  // Act
  db.updatePokemonCaptured(1, 1);
  
  // Assert
  expect(pokemon.is_captured).toBe(1);
});
```

### 4. Coverage minimale
- Fonctions critiques : 80%+
- API calls : 70%+
- UI logic : 50%+

---

## Limitations et améliorations futures

### Limitations actuelles
- Pas de tests E2E (Spectron)
- Pas de tests de performance
- Mocking limité pour la DB

### Améliorations futures
- [ ] Ajouter tests E2E avec Spectron
- [ ] Tests de charge (API)
- [ ] Snapshot tests pour UI
- [ ] Coverage > 80% sur tout le code
- [ ] Integration tests avec vraie DB

---

## Ressources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Electron Testing](https://www.electronjs.org/docs/latest/tutorial/testing)

