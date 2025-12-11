/**
 * capture.js - Système de capture avec PV et pokéball
 * Modifications:
 * - Affiche l'équipe dans la page de capture
 * - Utilise stats.hp comme PV du Pokémon à attraper
 * - Dégâts par clic = BASE_CLICK_DAMAGE (1) + nombre de Pokémon en équipe
 * - Pokéball spawn aléatoire (50%) et double les dégâts si cliquée (handler séparé)
 */

const captureState = {
  isActive: false,
  currentPokemon: null,
  currentPokemonHP: 0,
  maxPokemonHP: 0,
  spawnTimeoutId: null,
  spawnInterval: 5000, // Nouveau Pokemon toutes les 5 secondes
  pokeballElement: null
};

const BASE_CLICK_DAMAGE = 1; // dégâts de base par clic
const POKEBALL_CHANCE = 0.5; // 50% de chance d'apparition

async function loadCapturePage() {
  console.log('Page capture chargee');
  // Charger l'équipe depuis l'API si la fonction existe
  try {
    if (window.pokemonAPI && typeof window.pokemonAPI.getTeam === 'function') {
      const teamFromApi = await window.pokemonAPI.getTeam();
      if (Array.isArray(teamFromApi) && teamFromApi.length > 0) {
        appState.team = teamFromApi;
      }
    }
  } catch (err) {
    console.warn('Impossible de charger l\'équipe depuis l\'API:', err);
  }

  renderCaptureTeam();
  // Démarrer automatiquement les captures
  startCaptures();
}

/**
 * Affiche l'équipe sur la colonne gauche de la page de capture
 */
function renderCaptureTeam() {
  const teamContainer = document.getElementById('capture-team');
  teamContainer.innerHTML = '';

  // Récupérer l'équipe sauvegardée si disponible via API sinon via teamState
  let teamSlots = [];
  if (window.pokemonAPI && typeof window.pokemonAPI.getTeam === 'function') {
    // appel synchrone non available -> utiliser appState.team si présent
    // on tente d'utiliser appState.team qui devrait être initialisé
    teamSlots = appState.team && appState.team.length ? appState.team : [];
  } else {
    teamSlots = appState.team || [];
  }

  // Si teamSlots est vide, afficher 6 placeholders
  if (!teamSlots || teamSlots.length === 0) {
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = 'team-slot-small';
      slot.innerHTML = `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="color:rgba(255,255,255,0.5)">--</span></div><p>Vide</p>`;
      teamContainer.appendChild(slot);
    }
    return;
  }

  // teamSlots attend un tableau d'objets { position, pokemon_id } ou simplement ids
  for (let i = 0; i < 6; i++) {
    const slotData = teamSlots[i] || { position: i + 1, pokemon_id: null };
    const slotEl = document.createElement('div');
    slotEl.className = 'team-slot-small';

    if (slotData && slotData.pokemon_id) {
      const pokemon = appState.allPokemon.find(p => p.id === slotData.pokemon_id || p.pokedex_id === slotData.pokemon_id);
      if (pokemon) {
        const imgSrc = pokemon.image_url || pokemon.sprites?.regular || 'https://via.placeholder.com/64';
        slotEl.innerHTML = `<img src="${imgSrc}" alt="${pokemon.name}" onerror="this.src='https://via.placeholder.com/64'"/><p>${pokemon.name}</p>`;
      } else {
        slotEl.innerHTML = `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="color:rgba(255,255,255,0.5)">--</span></div><p>Vide</p>`;
      }
    } else {
      slotEl.innerHTML = `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="color:rgba(255,255,255,0.5)">--</span></div><p>Vide</p>`;
    }

    teamContainer.appendChild(slotEl);
  }
}

/**
 * Calcule les dégâts par clic en fonction de l'équipe active
 * Règle: dégâts = BASE_CLICK_DAMAGE + nombreDePokemonsDansLEquipe
 * (documenté ici pour clarté et futur ajustement)
 */
function computeClickDamage() {
  const teamSlots = appState.team || [];
  const teamCount = teamSlots.filter(s => s && s.pokemon_id).length || 0;
  return BASE_CLICK_DAMAGE + teamCount;
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

  const uncapturedPokemons = appState.allPokemon.filter(p => !p.is_captured);

  if (uncapturedPokemons.length === 0) {
    showAllCaptured();
    return;
  }

  const randomIndex = Math.floor(Math.random() * uncapturedPokemons.length);
  captureState.currentPokemon = uncapturedPokemons[randomIndex];

  // PV initiaux : utiliser le champ `hp` déjà transformé par l'API (transformPokemonData)
  let maxHp = 20;
  if (typeof captureState.currentPokemon.hp !== 'undefined') {
    maxHp = captureState.currentPokemon.hp;
  }

  captureState.maxPokemonHP = maxHp;
  captureState.currentPokemonHP = maxHp;

  displayPokemonWithHP(captureState.currentPokemon);

  clearTimeout(captureState.spawnTimeoutId);
  captureState.spawnTimeoutId = setTimeout(() => {
    if (captureState.currentPokemon && captureState.isActive) {
      console.log(`Pokemon ${captureState.currentPokemon.name} a echappe`);
      spawnNextPokemon();
    }
  }, captureState.spawnInterval);
}

/**
 * Afficher un Pokemon avec sa barre de PV et potentiellement une Pokéball
 */
function displayPokemonWithHP(pokemon) {
  const pokemonInfo = document.getElementById('pokemon-to-catch');
  const captureArea = document.getElementById('capture-area');

  // Vider la zone de capture et ajouter l'élément catchable
  captureArea.innerHTML = '';

  const catchable = document.createElement('div');
  catchable.className = 'catchable-pokemon';
  catchable.innerHTML = `
    <img id="capture-pokemon-img" src="${pokemon.image_url || pokemon.sprites?.regular || 'https://via.placeholder.com/150'}" alt="${pokemon.name}" />
    <p id="capture-pokemon-name">${pokemon.name}</p>
  `;

  // Clic sur l'image principal attaque (clic normal)
  catchable.querySelector('#capture-pokemon-img').addEventListener('click', () => attackPokemon(false));

  captureArea.appendChild(catchable);

  // Afficher les PV dans la colonne de stats
  document.getElementById('capture-pokemon-img').src = pokemon.image_url || pokemon.sprites?.regular || 'https://via.placeholder.com/150';
  document.getElementById('capture-pokemon-name').textContent = pokemon.name;
  updateHPBar();
  pokemonInfo.style.display = 'flex';

  // Pokéball: spawn 50% du temps
  if (Math.random() < POKEBALL_CHANCE) {
    spawnPokeballNear(catchable);
  } else {
    // s'assurer que l'ancien pokeball est retiré
    removePokeball();
  }
}

/**
 * Mettre à jour la barre de PV
 */
function updateHPBar() {
  const hpPercent = (captureState.currentPokemonHP / captureState.maxPokemonHP) * 100;
  const hpBar = document.getElementById('pokemon-hp-bar');
  const hpText = document.getElementById('pokemon-hp-text');

  if (!hpBar || !hpText) return;

  hpBar.style.width = Math.max(0, Math.min(100, hpPercent)) + '%';
  hpText.textContent = `PV: ${captureState.currentPokemonHP}/${captureState.maxPokemonHP}`;

  // Couleur unique (plus simple)
  if (hpPercent > 50) {
    hpBar.style.background = '#4caf50';
  } else if (hpPercent > 25) {
    hpBar.style.background = '#ff9800';
  } else {
    hpBar.style.background = '#ff5722';
  }
}

/**
 * Attaquer le Pokemon (réduire ses PV)
 * @param {boolean} viaPokeball indique si le clic provient de la pokeball (double dégâts)
 */
function attackPokemon(viaPokeball = false) {
  if (!captureState.currentPokemon) return;

  // Calculer dégâts: base + nombre de pokemons en équipe
  let damage = computeClickDamage();
  if (viaPokeball) damage = damage * 2;

  // Réduire les PV
  captureState.currentPokemonHP -= damage;
  captureState.currentPokemonHP = Math.max(0, Math.floor(captureState.currentPokemonHP));

  console.log(`Attaque! ${captureState.currentPokemon.name} - PV restants: ${captureState.currentPokemonHP} (dégats: ${damage})`);

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
    clearTimeout(captureState.spawnTimeoutId);

    // Sauvegarder la capture en base de données
    const result = await window.pokemonAPI.capturePokemon(pokemon.id || pokemon.pokedex_id || pokemon.pokedexId);

    if (result && result.success) {
      showCaptureSuccess(pokemon);

      // Mettre à jour l'état local
      const localPokemon = appState.allPokemon.find(p => p.id === pokemon.id || p.pokedex_id === pokemon.pokedex_id);
      if (localPokemon) {
        localPokemon.is_captured = 1;
        appState.capturedPokemon.push(localPokemon);
      }

      // Retirer pokeball
      removePokeball();

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
 * Spawn une pokéball positionnée aléatoirement près du Pokémon (élément parent fourni)
 */
function spawnPokeballNear(parentEl) {
  removePokeball();

  const captureArea = document.getElementById('capture-area');
  const pokeball = document.createElement('img');
  // Chemin local préféré, sinon fallback vers une URL publique
  pokeball.src = 'assets/Poké_Ball_icon.svg.png';
  pokeball.className = 'pokeball';
  pokeball.onerror = () => {
    // fallback: petite image pokéball publique
    pokeball.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
  };

  // Calculer position aléatoire relative au centre du parentEl
  const areaRect = captureArea.getBoundingClientRect();
  const x = Math.random() * (areaRect.width - 60) + 20; // marge
  const y = Math.random() * (areaRect.height - 60) + 20;

  pokeball.style.left = `${x}px`;
  pokeball.style.top = `${y}px`;

  // Handler: si on clique sur la pokéball, inflige double dégâts
  pokeball.addEventListener('click', (e) => {
    e.stopPropagation();
    // Doublage de dégâts uniquement pour ce clic
    attackPokemon(true);
    // Animer et retirer la pokéball
    pokeball.style.transform = 'scale(0.8)';
    setTimeout(() => removePokeball(), 200);
  });

  captureArea.appendChild(pokeball);
  captureState.pokeballElement = pokeball;
}

/**
 * Supprime la pokéball si présente
 */
function removePokeball() {
  if (captureState.pokeballElement && captureState.pokeballElement.parentNode) {
    captureState.pokeballElement.parentNode.removeChild(captureState.pokeballElement);
  }
  captureState.pokeballElement = null;
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
      <img src="${pokemon.image_url || pokemon.sprites?.regular}" alt="${pokemon.name}">
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

// Exports implicites - le fichier est chargé globalement
