const APIService = require('../src/main/api-service');

// Mock fetch pour les tests
global.fetch = jest.fn();

describe('API Service', () => {
  let apiService;

  beforeEach(() => {
    apiService = new APIService();
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Pokemon Fetching', () => {

    test('should fetch pokemon by id', async () => {
      const mockResponse = {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        sprites: {
          other: {
            'official-artwork': {
              front_default: 'https://example.com/bulbasaur.png'
            }
          },
          front_default: 'https://example.com/bulbasaur-alt.png'
        },
        types: [
          { type: { name: 'grass' } },
          { type: { name: 'poison' } }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiService.getPokemon(1);

      expect(result).toBeDefined();
      expect(result.pokedex_id).toBe(1);
      expect(result.name).toBe('bulbasaur');
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should fetch pokemon by name', async () => {
      const mockResponse = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        sprites: {
          front_default: 'https://example.com/pikachu.png'
        },
        types: [{ type: { name: 'electric' } }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiService.getPokemon('pikachu');

      expect(result).toBeDefined();
      expect(result.name).toBe('pikachu');
    });

    test('should cache pokemon data', async () => {
      const mockResponse = {
        id: 1,
        name: 'bulbasaur',
        sprites: { front_default: 'https://example.com/bulbasaur.png' },
        types: [{ type: { name: 'grass' } }],
        height: 7,
        weight: 69
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Premier appel
      const result1 = await apiService.getPokemon(1);

      // Deuxième appel (devrait utiliser le cache)
      const result2 = await apiService.getPokemon(1);

      expect(result1).toEqual(result2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Seulement 1 appel API
    });

    test('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(apiService.getPokemon(99999)).rejects.toThrow();
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getPokemon(1)).rejects.toThrow('Network error');
    });
  });

  describe('Pokemon List Fetching', () => {

    test('should fetch pokemon list', async () => {
      const mockResponse = {
        results: [
          { name: 'bulbasaur', url: '...' },
          { name: 'ivysaur', url: '...' },
          { name: 'venusaur', url: '...' }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiService.getPokemonList(0, 3);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('bulbasaur');
    });

    test('should use offset and limit', async () => {
      const mockResponse = { results: [] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await apiService.getPokemonList(10, 20);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10&limit=20')
      );
    });
  });

  describe('Data Transformation', () => {

    test('should transform pokemon data correctly', () => {
      const apiData = {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        sprites: {
          other: {
            'official-artwork': {
              front_default: 'https://example.com/bulbasaur.png'
            }
          }
        },
        types: [
          { type: { name: 'grass' } },
          { type: { name: 'poison' } }
        ]
      };

      const transformed = apiService.transformPokemonData(apiData);

      expect(transformed.pokedex_id).toBe(1);
      expect(transformed.name).toBe('bulbasaur');
      expect(transformed.type_primary).toBe('grass');
      expect(transformed.type_secondary).toBe('poison');
      expect(transformed.height).toBe(0.7);
      expect(transformed.weight).toBe(6.9);
      expect(transformed.is_captured).toBe(0);
    });

    test('should handle missing secondary type', () => {
      const apiData = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        sprites: { front_default: 'https://example.com/pikachu.png' },
        types: [{ type: { name: 'electric' } }]
      };

      const transformed = apiService.transformPokemonData(apiData);

      expect(transformed.type_primary).toBe('electric');
      expect(transformed.type_secondary).toBeNull();
    });

    test('should use fallback image URL', () => {
      const apiData = {
        id: 1,
        name: 'test',
        height: 1,
        weight: 1,
        sprites: {
          front_default: 'https://example.com/fallback.png'
        },
        types: []
      };

      const transformed = apiService.transformPokemonData(apiData);

      expect(transformed.image_url).toBe('https://example.com/fallback.png');
    });
  });

  describe('Cache Management', () => {

    test('should clear cache', async () => {
      const mockResponse = {
        id: 1,
        name: 'bulbasaur',
        sprites: { front_default: '...' },
        types: [{ type: { name: 'grass' } }],
        height: 7,
        weight: 69
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // Faire un appel pour cacher
      await apiService.getPokemon(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Nettoyer le cache
      apiService.clearCache();

      // Faire un second appel
      await apiService.getPokemon(1);
      expect(global.fetch).toHaveBeenCalledTimes(2); // 2 appels totaux
    });

    test('should check cache expiration', () => {
      const testKey = 'test_key';
      const testData = { data: 'test' };

      // Ajouter au cache
      apiService.cache.set(testKey, {
        data: testData,
        timestamp: Date.now()
      });

      // Doit être en cache
      expect(apiService.isCached(testKey)).toBe(true);

      // Simuler l'expiration
      apiService.cache.set(testKey, {
        data: testData,
        timestamp: Date.now() - apiService.cacheTimeout - 1000
      });

      // Doit être expiré
      expect(apiService.isCached(testKey)).toBe(false);
    });
  });
});

