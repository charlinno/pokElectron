/**
 * capture.js - Système de capture avec PV
 */

const captureState = {
  isActive: false,
  currentPokemon: null,
  currentPokemonHP: 0,
  maxPokemonHP: 0,
  spawnIntervalId: null,
  spawnInterval: 5000 // Nouveau Pokemon toutes les 5 secondes
};

async function loadCapturePage() {
  console.log('Page capture chargee');
  // Démarrer automatiquement les captures au chargement
  startCaptures();
}

/**
 * Démarrer les captures automatiques
 */
function startCaptures() {
  if (captureState.isActive) return;

  captureState.isActive = true;
  console.log('Captures automatiques demarrees');
  spawnNextPokemon();
}

/**
 * Faire apparaitre le prochain Pokemon
 */
function spawnNextPokemon() {
  if (!captureState.isActive) return;

  // Choisir un Pokemon aléatoire non capturé
  const uncapturedPokemons = appState.allPokemon.filter(p => !p.is_captured);

  if (uncapturedPokemons.length === 0) {
    showAllCaptured();
    return;
  }

  const randomIndex = Math.floor(Math.random() * uncapturedPokemons.length);
  captureState.currentPokemon = uncapturedPokemons[randomIndex];

  // Les PV initiaux = HP du Pokemon
  captureState.maxPokemonHP = captureState.currentPokemon.hp || 20;
  captureState.currentPokemonHP = captureState.maxPokemonHP;

  // Afficher le Pokemon avec ses PV
  displayPokemonWithHP(captureState.currentPokemon);

  // Planifier le prochain Pokemon
  clearTimeout(captureState.spawnIntervalId);
  captureState.spawnIntervalId = setTimeout(() => {
    if (captureState.currentPokemon && captureState.isActive) {
      console.log(`Pokemon ${captureState.currentPokemon.name} a echappe`);
      spawnNextPokemon(); // Faire apparaitre le suivant
    }
  }, captureState.spawnInterval);
}

/**
 * Afficher un Pokemon avec sa barre de PV
 */
function displayPokemonWithHP(pokemon) {
  const pokemonInfo = document.getElementById('pokemon-to-catch');

  // Mettre à jour les éléments
  document.getElementById('capture-pokemon-img').src = pokemon.image_url || 'https://via.placeholder.com/150';
  document.getElementById('capture-pokemon-name').textContent = pokemon.name;
  updateHPBar();
  pokemonInfo.style.display = 'flex';
}

/**
 * Mettre à jour la barre de PV
 */
function updateHPBar() {
  const hpPercent = (captureState.currentPokemonHP / captureState.maxPokemonHP) * 100;
  const hpBar = document.getElementById('pokemon-hp-bar');
  const hpText = document.getElementById('pokemon-hp-text');

  hpBar.style.width = hpPercent + '%';
  hpText.textContent = `PV: ${captureState.currentPokemonHP}/${captureState.maxPokemonHP}`;

  // Changer la couleur selon les PV
  if (hpPercent > 50) {
    hpBar.style.background = 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)';
  } else if (hpPercent > 25) {
    hpBar.style.background = 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)';
  } else {
    hpBar.style.background = 'linear-gradient(90deg, #ff5722 0%, #ff6f00 100%)';
  }
}

/**
 * Attaquer le Pokemon (réduire ses PV)
 */
function attackPokemon() {
  if (!captureState.currentPokemon) return;

  // Réduire les PV de 1
  captureState.currentPokemonHP--;

  console.log(`Attaque! ${captureState.currentPokemon.name} - PV restants: ${captureState.currentPokemonHP}`);

  updateHPBar();

  // Si les PV atteignent 0, capturer le Pokemon
  if (captureState.currentPokemonHP <= 0) {
    capturePokemon();
  }
}

/**
 * Capturer le Pokemon actuel
 */
async function capturePokemon() {
  const pokemon = captureState.currentPokemon;

  if (!pokemon) return;

  try {
    clearTimeout(captureState.spawnIntervalId);

    // Sauvegarder la capture en base de données
    const result = await window.pokemonAPI.capturePokemon(pokemon.id);

    if (result.success) {
      showCaptureSuccess(pokemon);

      // Mettre à jour l'état local
      const localPokemon = appState.allPokemon.find(p => p.id === pokemon.id);
      if (localPokemon) {
        localPokemon.is_captured = 1;
        appState.capturedPokemon.push(localPokemon);
      }

      // Afficher le Pokemon suivant après 2 secondes
      setTimeout(() => {
        if (captureState.isActive) {
          spawnNextPokemon();
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Erreur capture:', error);
  }
}

/**
 * Afficher le message de capture réussie
 */
function showCaptureSuccess(pokemon) {
  const captureArea = document.getElementById('capture-area');
  const pokemonInfo = document.getElementById('pokemon-to-catch');

  pokemonInfo.style.display = 'none';

  captureArea.innerHTML = `
    <div class="capture-success">
      <h2>CAPTURE!</h2>
      <img src="${pokemon.image_url}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
      <p class="message">${getRandomCaptureMessage()}</p>
    </div>
  `;
}

/**
 * Afficher quand tous les Pokemons sont capturés
 */
function showAllCaptured() {
  captureState.isActive = false;
  const captureArea = document.getElementById('capture-area');
  const pokemonInfo = document.getElementById('pokemon-to-catch');

  pokemonInfo.style.display = 'none';

  captureArea.innerHTML = `
    <div class="empty-state">
      <p>FELICITATIONS! Tu as capture tous les Pokemons!</p>
      <button class="btn btn-back" onclick="showPage('home-page')">Retour</button>
    </div>
  `;
}

/**
 * Obtenir un message aléatoire de capture
 */
function getRandomCaptureMessage() {
  const messages = [
    'Excellent capture!',
    'Bien joue!',
    'Tu l\'as attrape!',
    'Parfait timing!',
    'Incroyable!',
    'C\'est un succes!'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

