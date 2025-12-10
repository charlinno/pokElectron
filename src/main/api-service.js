const fetch = require('node-fetch');

/**
 * Service pour interagir avec l'API PokéAPI
 * Documentation: https://pokeapi.co/docs/v2
 */
class APIService {
  constructor() {
    this.baseURL = 'https://pokeapi.co/api/v2';
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 heures
  }

  /**
   * Récupérer un Pokémon depuis l'API
   * @param {number|string} idOrName - ID ou nom du Pokémon
   * @returns {Promise<Object>} Données du Pokémon
   */
  async getPokemon(idOrName) {
    try {
      // Vérifier le cache
      const cacheKey = `pokemon_${idOrName}`;
      if (this.isCached(cacheKey)) {
        console.log(`Cache hit: ${idOrName}`);
        return this.cache.get(cacheKey).data;
      }

      // Récupérer depuis l'API
      const url = `${this.baseURL}/pokemon/${idOrName}`;
      console.log(`Fetching: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transformer les données
      const transformedData = this.transformPokemonData(data);

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      return transformedData;
    } catch (error) {
      console.error(`Erreur getPokemon(${idOrName}):`, error.message);
      throw error;
    }
  }

  /**
   * Récupérer une liste de Pokémons
   * @param {number} offset - Décalage dans la liste
   * @param {number} limit - Nombre de Pokémons à retourner
   * @returns {Promise<Array>} Liste des Pokémons
   */
  async getPokemonList(offset = 0, limit = 50) {
    try {
      // Vérifier le cache
      const cacheKey = `pokemon_list_${offset}_${limit}`;
      if (this.isCached(cacheKey)) {
        console.log(`Cache hit: pokemon_list_${offset}_${limit}`);
        return this.cache.get(cacheKey).data;
      }

      // Récupérer depuis l'API
      const url = `${this.baseURL}/pokemon?offset=${offset}&limit=${limit}`;
      console.log(`Fetching: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const pokemons = data.results;

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: pokemons,
        timestamp: Date.now()
      });

      return pokemons;
    } catch (error) {
      console.error(`Erreur getPokemonList(${offset}, ${limit}):`, error.message);
      throw error;
    }
  }

  /**
   * Récupérer tous les Pokémons de la première génération (151)
   * @returns {Promise<Array>} Liste de tous les Pokémons
   */
  async getAllFirstGenPokemon() {
    try {
      const cacheKey = 'pokemon_list_all_first_gen';
      if (this.isCached(cacheKey)) {
        console.log(`Cache hit: pokemon_list_all_first_gen`);
        return this.cache.get(cacheKey).data;
      }

      const allPokemons = [];
      const limit = 50;
      let offset = 0;
      let hasMore = true;

      while (hasMore && allPokemons.length < 151) {
        const pokemons = await this.getPokemonList(offset, limit);
        allPokemons.push(...pokemons);
        offset += limit;
        hasMore = pokemons.length === limit;
      }

      const firstGenPokemons = allPokemons.slice(0, 151);

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: firstGenPokemons,
        timestamp: Date.now()
      });

      return firstGenPokemons;
    } catch (error) {
      console.error('Erreur getAllFirstGenPokemon:', error.message);
      throw error;
    }
  }

  /**
   * Récupérer tous les Pokémons disponibles
   * @returns {Promise<Array>} Liste de tous les Pokémons
   */
  async getAllPokemon() {
    try {
      const cacheKey = 'pokemon_list_all';
      if (this.isCached(cacheKey)) {
        console.log(`Cache hit: pokemon_list_all`);
        return this.cache.get(cacheKey).data;
      }

      const allPokemons = [];
      const limit = 100;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const pokemons = await this.getPokemonList(offset, limit);
        if (pokemons.length === 0) {
          hasMore = false;
        } else {
          allPokemons.push(...pokemons);
          offset += limit;
        }
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: allPokemons,
        timestamp: Date.now()
      });

      console.log(`Total Pokemons charges: ${allPokemons.length}`);
      return allPokemons;
    } catch (error) {
      console.error('Erreur getAllPokemon:', error.message);
      throw error;
    }
  }

  /**
   * Transformer les données de l'API au format de la base de données
   * @param {Object} apiPokemon - Données brutes de l'API
   * @returns {Object} Données transformées
   */
  transformPokemonData(apiPokemon) {
    try {
      // Récupérer les types
      const types = apiPokemon.types.map(t => t.type.name);
      const typePrimary = types[0] || null;
      const typeSecondary = types[1] || null;

      // Récupérer l'image (priorité: official-artwork > front_default)
      const spriteUrl =
        apiPokemon.sprites?.other?.['official-artwork']?.front_default ||
        apiPokemon.sprites?.front_default ||
        '';

      // Récupérer les PV (HP) depuis les stats
      let hp = 20; // Valeur par défaut
      if (apiPokemon.stats && Array.isArray(apiPokemon.stats)) {
        const hpStat = apiPokemon.stats.find(stat => stat.stat.name === 'hp');
        if (hpStat) {
          hp = Math.ceil(hpStat.base_stat / 5); // Diviser par 5 pour avoir des valeurs raisonnables
        }
      }

      return {
        pokedex_id: apiPokemon.id,
        name: apiPokemon.name,
        image_url: spriteUrl,
        type_primary: typePrimary,
        type_secondary: typeSecondary,
        height: apiPokemon.height / 10, // Convertir en mètres
        weight: apiPokemon.weight / 10, // Convertir en kg
        hp: hp,
        is_captured: 0,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur transformPokemonData:', error.message);
      throw error;
    }
  }

  /**
   * Vérifier si les données sont en cache et valides
   * @param {string} key - Clé du cache
   * @returns {boolean}
   */
  isCached(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const cached = this.cache.get(key);
    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Nettoyer le cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Cache nettoye');
  }

  /**
   * Remplir la base de données avec les Pokémons depuis l'API
   * @param {Database} database - Instance de la base de données
   * @param {number} limit - Nombre de Pokémons à télécharger (0 = tous)
   * @returns {Promise<Object>} Résultats de la synchronisation
   */
  async seedDatabase(database, limit = 0) {
    try {
      console.log(`Synchronisation de ${limit === 0 ? 'TOUS les' : limit} Pokemons en cours...`);

      // Vérifier si la DB est déjà remplie
      const existingCount = database.countAllPokemon();
      if (existingCount > 0 && limit === 0) {
        console.log(`Base de donnees deja remplie (${existingCount} Pokemons)`);
        return { status: 'already_filled', successCount: existingCount };
      }

      // Récupérer la liste des Pokémons
      const pokemonList = await this.getAllPokemon();
      const pokemonsToFetch = limit === 0 ? pokemonList : pokemonList.slice(0, limit);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Récupérer les détails de chaque Pokémon et les insérer
      for (let i = 0; i < pokemonsToFetch.length; i++) {
        try {
          const pokemonRef = pokemonsToFetch[i];
          const pokemonData = await this.getPokemon(pokemonRef.name);

          // Insérer dans la base de données
          database.insertPokemon(pokemonData);
          successCount++;

          // Afficher la progression
          if ((i + 1) % 10 === 0) {
            console.log(`Progression: ${i + 1}/${pokemonsToFetch.length}`);
          }
        } catch (error) {
          errorCount++;
          errors.push({
            pokemon: pokemonsToFetch[i].name,
            error: error.message
          });
          console.error(`Erreur pour ${pokemonsToFetch[i].name}:`, error.message);
        }
      }

      console.log(`\nSynchronisation terminee!`);
      console.log(`   Succes: ${successCount}`);
      console.log(`   Erreurs: ${errorCount}`);

      return {
        status: 'completed',
        successCount,
        errorCount,
        totalProcessed: successCount + errorCount,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('Erreur seedDatabase:', error.message);
      throw error;
    }
  }

  /**
   * Récupérer les stats d'un Pokémon
   * @param {number|string} idOrName - ID ou nom du Pokémon
   * @returns {Promise<Object>} Stats du Pokémon
   */
  async getPokemonStats(idOrName) {
    try {
      const pokemon = await this.getPokemon(idOrName);
      return {
        name: pokemon.name,
        hp: pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || 0,
        attack: pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || 0,
        defense: pokemon.stats?.find(s => s.stat.name === 'defense')?.base_stat || 0,
        spAtk: pokemon.stats?.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
        spDef: pokemon.stats?.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
        speed: pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || 0
      };
    } catch (error) {
      console.error(`Erreur getPokemonStats(${idOrName}):`, error.message);
      throw error;
    }
  }
}

module.exports = APIService;

