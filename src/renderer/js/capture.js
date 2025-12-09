/**
 * capture.js - Logique du système de capture de Pokémons
 */

const captureState = {
  isCapturing: false,
  currentPokemon: null,
  timeoutId: null,
  timerInterval: null,
  timeRemaining: 0,
  captureTimeout: 8000 // 8 secondes pour capturer
};

async function loadCapturePage() {
  console.log('Page capture chargée');
}

/**
 * Démarrer les captures aléatoires
 */
function startRandomCaptures() {
  captureState.isCapturing = true;
  console.log('Captures demarrees');
  spawnRandomPokemon();
}

/**
 * Arrêter les captures
 */
function stopRandomCaptures() {
  captureState.isCapturing = false;
  clearTimeout(captureState.timeoutId);
  clearInterval(captureState.timerInterval);

  const captureArea = document.getElementById('capture-area');
  captureArea.innerHTML = '<p class="instruction">Attends qu\'un Pokemon apparaisse et clique dessus!</p>';

  document.getElementById('pokemon-to-catch').style.display = 'none';

  console.log('Captures arretees');
}

/**
 * Faire apparaître un Pokémon aléatoire
 */
function spawnRandomPokemon() {
  if (!captureState.isCapturing) return;

  // Si aucun Pokémon n'est présent
  if (captureState.currentPokemon === null) {
    // Choisir un Pokémon aléatoire non capturé
    const uncapturedPokemons = appState.allPokemon.filter(p => !p.is_captured);

    if (uncapturedPokemons.length === 0) {
      document.getElementById('capture-area').innerHTML = `
        <div class="empty-state">
          <p>FELICITATIONS! Tu as capture tous les Pokemons!</p>
          <button class="btn btn-primary" onclick="stopRandomCaptures()">Retour</button>
        </div>
      `;
      return;
    }

    const randomIndex = Math.floor(Math.random() * uncapturedPokemons.length);
    captureState.currentPokemon = uncapturedPokemons[randomIndex];

    // Afficher le Pokémon
    displayCatchablePokemon(captureState.currentPokemon);

    // Démarrer le timer
    captureState.timeRemaining = captureState.captureTimeout / 1000;
    startCaptureTimer();

    // Faire disparaître après timeout
    captureState.timeoutId = setTimeout(() => {
      if (captureState.currentPokemon) {
        console.log(`TIMEOUT: ${captureState.currentPokemon.name} s'est echappe`);
        captureState.currentPokemon = null;
        clearInterval(captureState.timerInterval);
        spawnRandomPokemon(); // Faire apparaître un autre
      }
    }, captureState.captureTimeout);
  }
}

/**
 * Afficher un Pokémon capturable
 */
function displayCatchablePokemon(pokemon) {
  const captureArea = document.getElementById('capture-area');
  const pokemonInfo = document.getElementById('pokemon-to-catch');

  // Créer un élément cliquable pour le Pokémon
  captureArea.innerHTML = `
    <div class="catchable-pokemon" onclick="attemptCapture(${pokemon.id})">
      <img src="${pokemon.image_url}" alt="${pokemon.name}" onerror="this.src='https://via.placeholder.com/150'">
      <p>${pokemon.name}</p>
      <div class="pulse"></div>
    </div>
  `;

  // Mettre à jour les infos
  document.getElementById('capture-pokemon-img').src = pokemon.image_url;
  document.getElementById('capture-pokemon-name').textContent = pokemon.name;
  pokemonInfo.style.display = 'block';
}

/**
 * Démarrer le timer de capture
 */
function startCaptureTimer() {
  clearInterval(captureState.timerInterval);

  captureState.timerInterval = setInterval(() => {
    captureState.timeRemaining--;
    const timerElement = document.getElementById('capture-timer');
    timerElement.textContent = `${captureState.timeRemaining}s`;

    // Changer la couleur selon le temps restant
    if (captureState.timeRemaining <= 2) {
      timerElement.style.color = '#ff4444';
    } else if (captureState.timeRemaining <= 4) {
      timerElement.style.color = '#ffaa00';
    } else {
      timerElement.style.color = '#44ff44';
    }
  }, 1000);
}

/**
 * Tenter de capturer un Pokémon
 */
async function attemptCapture(pokemonId) {
  if (captureState.currentPokemon === null || captureState.currentPokemon.id !== pokemonId) {
    return; // Pas le bon Pokémon
  }

  try {
    // Clique rapide?
    clearTimeout(captureState.timeoutId);
    clearInterval(captureState.timerInterval);

    const pokemon = captureState.currentPokemon;
    captureState.currentPokemon = null;

    // Tenter la capture (70% de réussite)
    const successRate = 0.7;
    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      // Capturer le Pokémon
      const result = await window.pokemonAPI.capturePokemon(pokemon.id);

      if (result.success) {
        showCaptureSuccess(pokemon);

        // Mettre à jour l'état local
        const localPokemon = appState.allPokemon.find(p => p.id === pokemon.id);
        if (localPokemon) {
          localPokemon.is_captured = 1;
          appState.capturedPokemon.push(localPokemon);
        }
      }
    } else {
      showCaptureFailed(pokemon);
    }

    // Attendre un peu avant le prochain
    setTimeout(() => {
      if (captureState.isCapturing) {
        spawnRandomPokemon();
      }
    }, 2000);
  } catch (error) {
    console.error('Erreur capture:', error);
  }
}

/**
 * Afficher un message de succès de capture
 */
function showCaptureSuccess(pokemon) {
  const captureArea = document.getElementById('capture-area');

  captureArea.innerHTML = `
    <div class="capture-success">
      <h2>CAPTURE!</h2>
      <img src="${pokemon.image_url}" alt="${pokemon.name}">
      <p>${pokemon.name}</p>
      <p class="message">${getRandomCaptureMessage()}</p>
    </div>
  `;

  // Jouer un son (optionnel)
  playSound('capture');
}

/**
 * Afficher un message d'échec de capture
 */
function showCaptureFailed(pokemon) {
  const captureArea = document.getElementById('capture-area');

  captureArea.innerHTML = `
    <div class="capture-failed">
      <h2>ECHAPPE!</h2>
      <img src="${pokemon.image_url}" alt="${pokemon.name}" style="opacity: 0.5;">
      <p>${pokemon.name}</p>
      <p class="message">Le Pokemon s'est echappe...</p>
    </div>
  `;

  // Jouer un son (optionnel)
  playSound('fail');
}

/**
 * Obtenir un message aléatoire de capture
 */
function getRandomCaptureMessage() {
  const messages = [
    'Excellent capture!',
    'Bien joué!',
    'Tu l\'as attrapé!',
    'Parfait timing!',
    'Incroyable!',
    'C\'est un succès!'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Jouer un son (optionnel - sans implémentation pour l'instant)
 */
function playSound(type) {
  // Implémenter selon les besoins
  // Exemple: new Audio('./assets/sounds/capture.mp3').play();
}

