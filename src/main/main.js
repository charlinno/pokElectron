const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');
const APIService = require('./api-service');

let mainWindow;
let database;
let apiService;

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 12 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload.js')
    }
  });

  // Charger le fichier HTML
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // DevTools en développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialiser l'application
app.on('ready', async () => {
  try {
    // Initialiser la base de données
    database = new Database();
    database.initialize();
    console.log('Base de données SQLite initialisée');

    // Initialiser le service API
    apiService = new APIService();
    console.log('Service API initialisé');

    // Créer la fenêtre
    createWindow();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    app.quit();
  }
});

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ========================================
// IPC HANDLERS - Pokémon Operations
// ========================================

// Récupérer tous les Pokémons
ipcMain.handle('get-all-pokemon', async () => {
  try {
    return database.getAllPokemon();
  } catch (error) {
    console.error('Erreur get-all-pokemon:', error);
    throw error;
  }
});

// Récupérer un Pokémon par ID
ipcMain.handle('get-pokemon', async (event, id) => {
  try {
    return database.getPokemonById(id);
  } catch (error) {
    console.error('Erreur get-pokemon:', error);
    throw error;
  }
});

// Récupérer les Pokémons capturés
ipcMain.handle('get-captured-pokemon', async () => {
  try {
    return database.getCapturedPokemon();
  } catch (error) {
    console.error('Erreur get-captured-pokemon:', error);
    throw error;
  }
});

// Capturer un Pokémon
ipcMain.handle('capture-pokemon', async (event, pokemonId) => {
  try {
    database.updatePokemonCaptured(pokemonId, 1);
    return { success: true, message: 'Pokémon capturé!' };
  } catch (error) {
    console.error('Erreur capture-pokemon:', error);
    return { success: false, error: error.message };
  }
});

// Compter les Pokémons capturés
ipcMain.handle('count-captured-pokemon', async () => {
  try {
    return database.countCapturedPokemon();
  } catch (error) {
    console.error('Erreur count-captured-pokemon:', error);
    throw error;
  }
});

// ========================================
// IPC HANDLERS - Team Operations
// ========================================

// Récupérer l'équipe
ipcMain.handle('get-team', async () => {
  try {
    return database.getTeam();
  } catch (error) {
    console.error('Erreur get-team:', error);
    throw error;
  }
});

// Récupérer l'équipe avec détails des Pokémons
ipcMain.handle('get-team-with-details', async () => {
  try {
    return database.getTeamWithDetails();
  } catch (error) {
    console.error('Erreur get-team-with-details:', error);
    throw error;
  }
});

// Ajouter un Pokémon à l'équipe
ipcMain.handle('add-pokemon-to-team', async (event, position, pokemonId) => {
  try {
    database.addPokemonToTeam(position, pokemonId);
    return { success: true, message: 'Pokémon ajouté à l\'équipe!' };
  } catch (error) {
    console.error('Erreur add-pokemon-to-team:', error);
    return { success: false, error: error.message };
  }
});

// Retirer un Pokémon de l'équipe
ipcMain.handle('remove-pokemon-from-team', async (event, position) => {
  try {
    database.removePokemonFromTeam(position);
    return { success: true, message: 'Pokémon retiré de l\'équipe!' };
  } catch (error) {
    console.error('Erreur remove-pokemon-from-team:', error);
    return { success: false, error: error.message };
  }
});

// Mettre à jour l'équipe complète
ipcMain.handle('update-team', async (event, teamData) => {
  try {
    database.updateTeam(teamData);
    return { success: true, message: 'Équipe mise à jour!' };
  } catch (error) {
    console.error('Erreur update-team:', error);
    return { success: false, error: error.message };
  }
});

// ========================================
// IPC HANDLERS - API & Sync Operations
// ========================================

// Récupérer un Pokémon depuis l'API
ipcMain.handle('fetch-pokemon-from-api', async (event, pokemonIdOrName) => {
  try {
    const pokemonData = await apiService.getPokemon(pokemonIdOrName);
    return { success: true, data: pokemonData };
  } catch (error) {
    console.error('Erreur fetch-pokemon-from-api:', error);
    return { success: false, error: error.message };
  }
});

// Récupérer une liste de Pokémons depuis l'API
ipcMain.handle('fetch-pokemon-list-from-api', async (event, offset = 0, limit = 50) => {
  try {
    const pokemonList = await apiService.getPokemonList(offset, limit);
    return { success: true, data: pokemonList };
  } catch (error) {
    console.error('Erreur fetch-pokemon-list-from-api:', error);
    return { success: false, error: error.message };
  }
});

// Synchroniser les Pokémons depuis l'API vers la DB
ipcMain.handle('sync-pokemon-database', async (event, limit = 151) => {
  try {
    const results = await apiService.seedDatabase(database, limit);
    return { success: true, data: results };
  } catch (error) {
    console.error('Erreur sync-pokemon-database:', error);
    return { success: false, error: error.message };
  }
});

// ========================================
// Window Control Handlers
// ========================================

// Minimiser la fenêtre
ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// Maximiser/Restaurer la fenêtre
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

// Fermer la fenêtre
ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// ========================================
// Cleanup
// ========================================

// Fermer la base de données à la fermeture de l'app
app.on('before-quit', () => {
  if (database) {
    database.close();
  }
});

