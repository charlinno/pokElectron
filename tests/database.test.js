const Database = require('../src/main/database');
const path = require('path');
const fs = require('fs');

describe('Database Operations', () => {
  let db;
  const testDbPath = path.join(__dirname, 'test.db');

  beforeEach(async () => {
    // Supprimer la DB de test si elle existe
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Créer une nouvelle DB de test
    db = new Database(testDbPath);
    await db.initialize();
  });

  afterEach(async () => {
    // Fermer la DB
    if (db) {
      await db.close();
    }

    // Supprimer la DB de test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  // ============================================
  // Pokemon CRUD Operations
  // ============================================

  describe('Pokemon CRUD Operations', () => {

    test('should insert a pokemon', async () => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://example.com/bulbasaur.png',
        type_primary: 'grass',
        type_secondary: 'poison',
        height: 0.7,
        weight: 6.9
      };

      const id = await db.insertPokemon(pokemon);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');
    });

    test('should retrieve all pokemon', async () => {
      const pokemons = [
        {
          pokedex_id: 1,
          name: 'Bulbasaur',
          image_url: 'https://example.com/bulbasaur.png',
          type_primary: 'grass'
        },
        {
          pokedex_id: 4,
          name: 'Charmander',
          image_url: 'https://example.com/charmander.png',
          type_primary: 'fire'
        }
      ];

      for (const pokemon of pokemons) {
        await db.insertPokemon(pokemon);
      }

      const result = await db.getAllPokemon();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bulbasaur');
      expect(result[1].name).toBe('Charmander');
    });

    test('should get pokemon by id', async () => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://example.com/bulbasaur.png'
      };

      const id = await db.insertPokemon(pokemon);
      const result = await db.getPokemonById(id);

      expect(result).toBeDefined();
      expect(result.name).toBe('Bulbasaur');
      expect(result.pokedex_id).toBe(1);
    });

    test('should get pokemon by pokedex id', async () => {
      const pokemon = {
        pokedex_id: 25,
        name: 'Pikachu',
        image_url: 'https://example.com/pikachu.png'
      };

      await db.insertPokemon(pokemon);
      const result = await db.getPokemonByPokedexId(25);

      expect(result).toBeDefined();
      expect(result.name).toBe('Pikachu');
    });

    test('should get pokemon by name', async () => {
      const pokemon = {
        pokedex_id: 25,
        name: 'pikachu',
        image_url: 'https://example.com/pikachu.png'
      };

      await db.insertPokemon(pokemon);
      const result = await db.getPokemonByName('PIKACHU');

      expect(result).toBeDefined();
      expect(result.name).toBe('pikachu');
    });

    test('should update pokemon as captured', async () => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://example.com/bulbasaur.png',
        is_captured: 0
      };

      const id = await db.insertPokemon(pokemon);
      await db.updatePokemonCaptured(id, 1);

      const result = await db.getPokemonById(id);
      expect(result.is_captured).toBe(1);
      expect(result.capture_date).toBeDefined();
    });

    test('should get captured pokemon only', async () => {
      const pokemons = [
        {
          pokedex_id: 1,
          name: 'Bulbasaur',
          image_url: 'https://example.com/bulbasaur.png',
          is_captured: 1
        },
        {
          pokedex_id: 2,
          name: 'Ivysaur',
          image_url: 'https://example.com/ivysaur.png',
          is_captured: 0
        }
      ];

      for (const pokemon of pokemons) {
        await db.insertPokemon(pokemon);
      }

      const result = await db.getCapturedPokemon();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bulbasaur');
    });

    test('should count captured pokemon', async () => {
      const pokemons = [
        { pokedex_id: 1, name: 'Bulbasaur', image_url: '...', is_captured: 1 },
        { pokedex_id: 2, name: 'Ivysaur', image_url: '...', is_captured: 0 },
        { pokedex_id: 3, name: 'Venusaur', image_url: '...', is_captured: 1 }
      ];

      for (const pokemon of pokemons) {
        await db.insertPokemon(pokemon);
      }

      const count = await db.countCapturedPokemon();
      expect(count).toBe(2);
    });

    test('should delete pokemon', async () => {
      const pokemon = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://example.com/bulbasaur.png'
      };

      const id = await db.insertPokemon(pokemon);
      await db.deletePokemon(id);

      const result = await db.getPokemonById(id);
      expect(result).toBeUndefined();
    });

    test('should enforce unique pokedex_id', async () => {
      const pokemon1 = {
        pokedex_id: 1,
        name: 'Bulbasaur',
        image_url: 'https://example.com/bulbasaur.png'
      };

      const pokemon2 = {
        pokedex_id: 1,
        name: 'Bulbasaur-duplicate',
        image_url: 'https://example.com/bulbasaur-duplicate.png'
      };

      await db.insertPokemon(pokemon1);

      // Le second insert devrait échouer
      await expect(db.insertPokemon(pokemon2)).rejects.toThrow();
    });
  });

  // ============================================
  // Team Operations
  // ============================================

  describe('Team Operations', () => {

    beforeEach(async () => {
      // Insérer des pokemons pour les tests d'équipe
      const pokemons = [
        { pokedex_id: 1, name: 'Bulbasaur', image_url: '...' },
        { pokedex_id: 4, name: 'Charmander', image_url: '...' },
        { pokedex_id: 7, name: 'Squirtle', image_url: '...' }
      ];

      for (const pokemon of pokemons) {
        await db.insertPokemon(pokemon);
      }
    });

    test('should add pokemon to team', async () => {
      await db.addPokemonToTeam(1, 1);

      const team = await db.getTeam();
      expect(team).toHaveLength(1);
      expect(team[0].position).toBe(1);
      expect(team[0].pokemon_id).toBe(1);
    });

    test('should get team', async () => {
      await db.addPokemonToTeam(1, 1);
      await db.addPokemonToTeam(2, 2);

      const team = await db.getTeam();
      expect(team).toHaveLength(2);
      expect(team[0].pokemon_id).toBe(1);
      expect(team[1].pokemon_id).toBe(2);
    });

    test('should remove pokemon from team', async () => {
      await db.addPokemonToTeam(1, 1);
      await db.removePokemonFromTeam(1);

      const team = await db.getTeam();
      const slot = team.find(s => s.position === 1);
      expect(slot.pokemon_id).toBeNull();
    });

    test('should prevent invalid position', async () => {
      await expect(db.addPokemonToTeam(7, 1)).rejects.toThrow();
      await expect(db.addPokemonToTeam(0, 1)).rejects.toThrow();
    });

    test('should update entire team', async () => {
      const teamData = [
        { position: 1, pokemon_id: 1 },
        { position: 2, pokemon_id: 2 },
        { position: 3, pokemon_id: 3 }
      ];

      await db.updateTeam(teamData);

      const team = await db.getTeam();
      expect(team).toHaveLength(3);
      expect(team[0].pokemon_id).toBe(1);
      expect(team[1].pokemon_id).toBe(2);
      expect(team[2].pokemon_id).toBe(3);
    });

    test('should get team with pokemon details', async () => {
      await db.addPokemonToTeam(1, 1);

      const team = await db.getTeamWithDetails();
      expect(team).toHaveLength(1);
      expect(team[0].name).toBe('Bulbasaur');
      expect(team[0].position).toBe(1);
    });
  });
});

