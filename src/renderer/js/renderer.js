const appState = {
  allPokemon: [],
  capturedPokemon: [],
  team: [],
  currentPage: 'home-page'
};

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    appState.currentPage = pageId;

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

function showLoading(message = 'Chargement...') {
  const modal = document.getElementById('loading-modal');
  document.getElementById('loading-message').textContent = message;
  modal.style.display = 'flex';
}

function hideLoading() {
  const modal = document.getElementById('loading-modal');
  modal.style.display = 'none';
}

function showNotification(title, message, callback = null) {
  const modal = document.getElementById('notification-modal');
  document.getElementById('notification-title').textContent = title;
  document.getElementById('notification-message').textContent = message;
  modal.style.display = 'flex';

  window.notificationCallback = callback;
}

function closeNotification() {
  const modal = document.getElementById('notification-modal');
  modal.style.display = 'none';

  if (window.notificationCallback) {
    window.notificationCallback();
    window.notificationCallback = null;
  }
}

async function loadAllPokemon() {
  try {
    showLoading('Chargement des Pokémons...');

    const pokemons = await window.pokemonAPI.getAllPokemon();
    console.log('Pokemons depuis DB:', pokemons.slice(0, 3));
    appState.allPokemon = pokemons;

    console.log(`${pokemons.length} Pokemons charges`);

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

async function syncPokemonDatabase() {
  try {
    showLoading('Synchronisation avec PokéAPI (tous les Pokemons)...');

    const result = await window.pokemonAPI.syncPokemonDatabase(0);

    if (result.success) {
      console.log(`Sync terminee: ${result.data.successCount} Pokemons`);

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

async function forceSyncPokemonDatabase() {
  try {
    const refreshBtn = document.getElementById('btn-refresh');
    refreshBtn.classList.add('rotating');
    refreshBtn.disabled = true;

    showLoading('Reinitialisation de la base de donnees...');

    const resetResult = await window.pokemonAPI.resetPokemonDatabase();
    if (!resetResult.success) {
      showNotification('ERREUR', `Erreur: ${resetResult.error}`);
      hideLoading();
      refreshBtn.classList.remove('rotating');
      refreshBtn.disabled = false;
      return;
    }

    showLoading('Chargement de TOUS les Pokemons depuis l\'API (cela peut prendre du temps)...');
    const syncResult = await window.pokemonAPI.syncPokemonDatabase(0);

    if (syncResult.success) {
      console.log(`Synchronisation complete: ${syncResult.data.successCount} Pokemons`);

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
  } finally {
    const refreshBtn = document.getElementById('btn-refresh');
    refreshBtn.classList.remove('rotating');
    refreshBtn.disabled = false;
  }
}

async function initializeApp() {
  console.log('Initialisation de l\'application...');

  try {
    await loadAllPokemon();

    if (appState.allPokemon.length === 0) {
      console.log('Base vide, synchronisation avec PokéAPI...');
      await syncPokemonDatabase();
    }

    showPage('home-page');

    console.log('Application prete!');
  } catch (error) {
    console.error('Erreur initialisation:', error);
    showNotification('ERREUR', 'Impossible d\'initialiser l\'application');
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);

document.getElementById('btn-minimize').addEventListener('click', () => {
  window.pokemonAPI.minimizeWindow();
});

document.getElementById('btn-maximize').addEventListener('click', () => {
  window.pokemonAPI.maximizeWindow();
});

document.getElementById('btn-close').addEventListener('click', () => {
  window.pokemonAPI.closeWindow();
});
