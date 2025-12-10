/**
 * renderer.js - Logique commune pour toutes les pages
 */

// État global de l'application
const appState = {
  allPokemon: [],
  capturedPokemon: [],
  team: [],
  currentPage: 'home-page'
};

/**
 * Afficher une page
 */
function showPage(pageId) {
  // Masquer toutes les pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Afficher la page demandée
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    appState.currentPage = pageId;

    // Charger les données si nécessaire
    if (pageId === 'home-page') {
      loadHomePage();
    } else if (pageId === 'pokedex-page') {
      loadPokédexPage();
    } else if (pageId === 'team-page') {
      loadTeamPage();
    } else if (pageId === 'capture-page') {
      loadCapturePage();
    }
  }
}

/**
 * Montrer un modal de loading
 */
function showLoading(message = 'Chargement...') {
  const modal = document.getElementById('loading-modal');
  document.getElementById('loading-message').textContent = message;
  modal.style.display = 'flex';
}

/**
 * Masquer le modal de loading
 */
function hideLoading() {
  const modal = document.getElementById('loading-modal');
  modal.style.display = 'none';
}

/**
 * Montrer une notification
 */
function showNotification(title, message, callback = null) {
  const modal = document.getElementById('notification-modal');
  document.getElementById('notification-title').textContent = title;
  document.getElementById('notification-message').textContent = message;
  modal.style.display = 'flex';

  // Stocker le callback
  window.notificationCallback = callback;
}

/**
 * Fermer la notification
 */
function closeNotification() {
  const modal = document.getElementById('notification-modal');
  modal.style.display = 'none';

  if (window.notificationCallback) {
    window.notificationCallback();
    window.notificationCallback = null;
  }
}

/**
 * Charger tous les Pokémons depuis la base de données
 */
async function loadAllPokemon() {
  try {
    showLoading('Chargement des Pokémons...');

    const pokemons = await window.pokemonAPI.getAllPokemon();
    appState.allPokemon = pokemons;

    console.log(`${pokemons.length} Pokemons charges`);

    // Actualiser les captures
    appState.capturedPokemon = pokemons.filter(p => p.is_captured);

    hideLoading();
    return pokemons;
  } catch (error) {
    console.error('Erreur lors du chargement des Pokemons:', error);
    hideLoading();
    showNotification('Erreur', 'Impossible de charger les Pokémons');
    return [];
  }
}

/**
 * Synchroniser les Pokémons depuis l'API
 */
async function syncPokemonDatabase() {
  try {
    showLoading('Synchronisation avec PokéAPI (tous les Pokemons)...');

    const result = await window.pokemonAPI.syncPokemonDatabase(0);

    if (result.success) {
      console.log(`Sync terminee: ${result.data.successCount} Pokemons`);

      // Recharger les données
      await loadAllPokemon();

      showNotification(
        'SYNCHRONISATION REUSSIE',
        `${result.data.successCount} Pokemons ajoutes a la base de donnees`
      );
    } else {
      console.error('Erreur sync:', result.error);
      showNotification('ERREUR', `Erreur de synchronisation: ${result.error}`);
    }
  } catch (error) {
    console.error('Erreur syncPokemonDatabase:', error);
    hideLoading();
    showNotification('ERREUR', 'Impossible de synchroniser les Pokemons');
  }
}

/**
 * Forcer la resynchronisation complète (vider et recharger)
 */
async function forceSyncPokemonDatabase() {
  try {
    showLoading('Reinitialisation de la base de donnees...');

    // Vider la BD
    const resetResult = await window.pokemonAPI.resetPokemonDatabase();
    if (!resetResult.success) {
      showNotification('ERREUR', `Erreur: ${resetResult.error}`);
      hideLoading();
      return;
    }

    // Recharger tous les Pokémon
    showLoading('Chargement de TOUS les Pokemons depuis l\'API (cela peut prendre du temps)...');
    const syncResult = await window.pokemonAPI.syncPokemonDatabase(0);

    if (syncResult.success) {
      console.log(`Synchronisation complete: ${syncResult.data.successCount} Pokemons`);

      // Recharger les données
      await loadAllPokemon();

      showNotification(
        'SYNCHRONISATION COMPLETE',
        `${syncResult.data.successCount} Pokemons charges dans la base de donnees!`
      );
    } else {
      console.error('Erreur sync:', syncResult.error);
      showNotification('ERREUR', `Erreur de synchronisation: ${syncResult.error}`);
    }
  } catch (error) {
    console.error('Erreur forceSyncPokemonDatabase:', error);
    hideLoading();
    showNotification('ERREUR', 'Impossible de synchroniser les Pokemons');
  }
}

/**
 * Initialiser l'application
 */
async function initializeApp() {
  console.log('Initialisation de l\'application...');

  try {
    // Charger les Pokémons
    await loadAllPokemon();

    // Si aucun Pokémon, synchroniser depuis l'API
    if (appState.allPokemon.length === 0) {
      console.log('Base vide, synchronisation avec PokéAPI...');
      await syncPokemonDatabase();
    }

    // Charger la page d'accueil
    showPage('home-page');

    console.log('Application prete!');
  } catch (error) {
    console.error('Erreur initialisation:', error);
    showNotification('ERREUR', 'Impossible d\'initialiser l\'application');
  }
}

// Initialiser au chargement du document
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Contrôles de la fenêtre
 */
document.getElementById('btn-minimize').addEventListener('click', () => {
  window.pokemonAPI.minimizeWindow();
});

document.getElementById('btn-maximize').addEventListener('click', () => {
  window.pokemonAPI.maximizeWindow();
});

document.getElementById('btn-close').addEventListener('click', () => {
  window.pokemonAPI.closeWindow();
});
