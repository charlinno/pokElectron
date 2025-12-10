const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Expose une API sécurisée au renderer process
 * Empêche les injections XSS et le NodeIntegration
 */

contextBridge.exposeInMainWorld('pokemonAPI', {
  // ========================================
  // Pokemon Operations
  // ========================================

  /**
   * Récupérer tous les Pokémons
   */
  getAllPokemon: () => ipcRenderer.invoke('get-all-pokemon'),

  /**
   * Récupérer un Pokémon par ID
   */
  getPokemon: (id) => ipcRenderer.invoke('get-pokemon', id),

  /**
   * Récupérer les Pokémons capturés
   */
  getCapturedPokemon: () => ipcRenderer.invoke('get-captured-pokemon'),

  /**
   * Capturer un Pokémon
   */
  capturePokemon: (pokemonId) => ipcRenderer.invoke('capture-pokemon', pokemonId),

  /**
   * Compter les Pokémons capturés
   */
  countCapturedPokemon: () => ipcRenderer.invoke('count-captured-pokemon'),

  // ========================================
  // Team Operations
  // ========================================

  /**
   * Récupérer l'équipe
   */
  getTeam: () => ipcRenderer.invoke('get-team'),

  /**
   * Récupérer l'équipe avec détails
   */
  getTeamWithDetails: () => ipcRenderer.invoke('get-team-with-details'),

  /**
   * Ajouter un Pokémon à l'équipe
   */
  addPokemonToTeam: (position, pokemonId) =>
    ipcRenderer.invoke('add-pokemon-to-team', position, pokemonId),

  /**
   * Retirer un Pokémon de l'équipe
   */
  removePokemonFromTeam: (position) =>
    ipcRenderer.invoke('remove-pokemon-from-team', position),

  /**
   * Mettre à jour l'équipe complète
   */
  updateTeam: (teamData) => ipcRenderer.invoke('update-team', teamData),

  // ========================================
  // API & Sync Operations
  // ========================================

  /**
   * Récupérer un Pokémon depuis l'API
   */
  fetchPokemonFromAPI: (idOrName) =>
    ipcRenderer.invoke('fetch-pokemon-from-api', idOrName),

  /**
   * Récupérer une liste de Pokémons depuis l'API
   */
  fetchPokemonListFromAPI: (offset, limit) =>
    ipcRenderer.invoke('fetch-pokemon-list-from-api', offset, limit),

  /**
   * Synchroniser les Pokémons depuis l'API vers la DB
   */
  syncPokemonDatabase: (limit) =>
    ipcRenderer.invoke('sync-pokemon-database', limit),

  /**
   * Réinitialiser la base de données (vider et resynchroniser)
   */
  resetPokemonDatabase: () =>
    ipcRenderer.invoke('reset-pokemon-database'),

  // ========================================
  // Window Control Operations
  // ========================================

  /**
   * Minimiser la fenêtre
   */
  minimizeWindow: () => ipcRenderer.send('window-minimize'),

  /**
   * Maximiser/Restaurer la fenêtre
   */
  maximizeWindow: () => ipcRenderer.send('window-maximize'),

  /**
   * Fermer la fenêtre
   */
  closeWindow: () => ipcRenderer.send('window-close'),

  // ========================================
  // Listeners
  // ========================================

  /**
   * Écouter les mises à jour de capture de Pokémon
   */
  onPokemonCaptured: (callback) => {
    ipcRenderer.on('pokemon-captured', (event, data) => callback(data));
  },

  /**
   * Écouter les mises à jour d'équipe
   */
  onTeamUpdated: (callback) => {
    ipcRenderer.on('team-updated', (event, data) => callback(data));
  }
});

