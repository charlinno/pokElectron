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
  pokeballElement: null,
  isCapturing: false // Bloque les clics pendant l'animation de capture
};

const BASE_CLICK_DAMAGE = 1; // dégâts de base par clic
const POKEBALL_CHANCE = 0.1; // 10% de chance d'apparition (5x plus rare)

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
      slot.innerHTML = `
        <div class="pokemon-circle">
          <span style="color:rgba(255,255,255,0.4);font-size:1.2em;">--</span>
        </div>
        <p style="color:rgba(255,255,255,0.5);">Vide</p>
      `;
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
        slotEl.innerHTML = `
          <div class="pokemon-circle">
            <img src="${imgSrc}" alt="${pokemon.name}" onerror="this.src='https://via.placeholder.com/48'"/>
          </div>
          <p>${pokemon.name}</p>
        `;
      } else {
        slotEl.innerHTML = `
          <div class="pokemon-circle">
            <span style="color:rgba(255,255,255,0.4);font-size:1.2em;">--</span>
          </div>
          <p style="color:rgba(255,255,255,0.5);">Vide</p>
        `;
      }
    } else {
      slotEl.innerHTML = `
        <div class="pokemon-circle">
          <span style="color:rgba(255,255,255,0.4);font-size:1.2em;">--</span>
        </div>
        <p style="color:rgba(255,255,255,0.5);">Vide</p>
      `;
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
 * Obtenir les PV d'un objet Pokémon en essayant plusieurs chemins possibles
 * Supporte : pokemon.hp ; pokemon.stats.hp ; pokemon.stats[0].base_stat ; pokemon.stats.find(s=>s.name==='hp').base_stat
 */
function getPokemonHP(pokemon) {
  if (!pokemon) return undefined;
  // 1) propriété hp directe
  if (typeof pokemon.hp === 'number') return pokemon.hp;

  // 2) stats objet { hp: ... }
  if (pokemon.stats && typeof pokemon.stats.hp === 'number') return pokemon.stats.hp;

  // 3) stats array with base_stat at index 0
  if (Array.isArray(pokemon.stats) && pokemon.stats[0] && typeof pokemon.stats[0].base_stat === 'number') {
    return pokemon.stats[0].base_stat;
  }

  // 4) find hp by name inside stats array
  if (Array.isArray(pokemon.stats)) {
    const hpEntry = pokemon.stats.find(s => s && (s.name === 'hp' || s.stat === 'hp') && (typeof s.base_stat === 'number'));
    if (hpEntry) return hpEntry.base_stat;
  }

  // 5) legacy fields
  if (typeof pokemon.base_hp === 'number') return pokemon.base_hp;

  return undefined;
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

  // PV initiaux : essayer d'obtenir via getPokemonHP
  let maxHp = 20; // fallback
  const hpFromData = getPokemonHP(captureState.currentPokemon);
  if (typeof hpFromData === 'number') {
    maxHp = hpFromData;
  } else {
    console.warn('spawnNextPokemon: impossible de récupérer les PV depuis l\'objet pokemon, fallback à', maxHp, 'pokemon:', captureState.currentPokemon);
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
  `;

  // Clic sur l'image principal attaque (clic normal)
  catchable.querySelector('#capture-pokemon-img').addEventListener('click', () => attackPokemon(false));

  captureArea.appendChild(catchable);

  // Afficher le nom et les PV dans la colonne de stats
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
 * Mettre à jour la barre de PV avec style classique (vert → jaune → rouge)
 */
function updateHPBar() {
  const max = captureState.maxPokemonHP || 0;
  const current = typeof captureState.currentPokemonHP === 'number' ? captureState.currentPokemonHP : 0;

  const hpBar = document.getElementById('pokemon-hp-bar');
  const hpText = document.getElementById('pokemon-hp-text');

  if (!hpBar || !hpText) return;

  const hpPercent = max > 0 ? (current / max) * 100 : 0;

  hpBar.style.width = Math.max(0, Math.min(100, hpPercent)) + '%';
  hpText.textContent = `PV: ${current}/${max}`;

  // Couleur de la barre selon le pourcentage (style classique Pokémon)
  // Supprimer les anciennes classes
  hpBar.classList.remove('hp-high', 'hp-medium', 'hp-low');

  if (hpPercent > 50) {
    hpBar.classList.add('hp-high');
    hpBar.style.background = '#4caf50'; // vert
  } else if (hpPercent > 25) {
    hpBar.classList.add('hp-medium');
    hpBar.style.background = '#ffb300'; // jaune/orange
  } else {
    hpBar.classList.add('hp-low');
    hpBar.style.background = '#f44336'; // rouge
  }
}

/**
 * Attaquer le Pokemon (réduire ses PV)
 * @param {boolean} viaPokeball indique si le clic provient de la pokéball (capture instantanée)
 */
function attackPokemon(viaPokeball = false) {
  if (!captureState.currentPokemon) return;

  // Bloquer les clics pendant l'animation de capture
  if (captureState.isCapturing) return;

  // Si clic sur la Pokéball : capture instantanée
  if (viaPokeball) {
    console.log('🎯 Pokéball cliquée ! Capture instantanée !');
    captureState.currentPokemonHP = 0;
    updateHPBar();
    // Activer le flag pour bloquer les clics
    captureState.isCapturing = true;
    capturePokemon();
    return;
  }

  // Effet visuel: slash pour clic normal
  const parentEl = document.querySelector('.catchable-pokemon');
  playSlashEffect(parentEl);

  // Calculer dégâts: base + nombre de pokemons en équipe
  let damage = computeClickDamage();

  // Réduire les PV
  captureState.currentPokemonHP -= damage;
  captureState.currentPokemonHP = Math.max(0, Math.floor(captureState.currentPokemonHP));

  console.log(`Attaque! ${captureState.currentPokemon.name} - PV restants: ${captureState.currentPokemonHP} (dégats: ${damage})`);

  updateHPBar();

  // Si les PV atteignent 0, capturer le Pokemon
  if (captureState.currentPokemonHP <= 0) {
    // Activer le flag pour bloquer les clics
    captureState.isCapturing = true;
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

    // Retirer la Pokéball cliquable si elle existe
    removePokeball();

    // Désactiver visuellement les interactions sur le Pokémon
    const catchablePokemon = document.querySelector('.catchable-pokemon');
    if (catchablePokemon) {
      catchablePokemon.classList.add('capturing-in-progress');
    }

    // Retirer toute Pokéball d'animation existante pour éviter les doublons
    const captureArea = document.getElementById('capture-area');
    const existingCaptureBall = captureArea.querySelector('.capture-pokeball-anim');
    if (existingCaptureBall) {
      existingCaptureBall.remove();
    }

    // Créer la Pokéball d'animation qui arrive de la droite
    const captureBall = document.createElement('img');
    captureBall.src = 'assets/Poké_Ball_icon.svg.png';
    captureBall.className = 'capture-pokeball-anim from-right';
    captureBall.onerror = () => {
      captureBall.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
    };

    captureArea.appendChild(captureBall);

    // Attendre que la Pokéball arrive au centre (1s)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Retirer la Pokéball d'animation
    if (captureBall.parentNode) {
      captureBall.parentNode.removeChild(captureBall);
    }

    // Déclencher l'animation de capture (halo blanc)
    const pokemonImg = document.querySelector('.catchable-pokemon img');
    if (pokemonImg) {
      pokemonImg.classList.add('capturing');
    }

    // Attendre la fin de l'animation de capture (0.6s)
    await new Promise(resolve => setTimeout(resolve, 600));

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


      // Afficher le Pokemon suivant après 2 secondes
      setTimeout(() => {
        if (captureState.isActive) {
          // Réactiver les clics pour le prochain Pokémon
          captureState.isCapturing = false;
          spawnNextPokemon();
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Erreur capture:', error);
    // Réactiver les clics en cas d'erreur
    captureState.isCapturing = false;
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

/**
 * Jouer l'effet visuel de slash sur l'élément parent fourni
 * Injection temporaire de 3 lignes avec animations, puis suppression
 * Chaque ligne reçoit une position et une rotation aléatoires pour varier l'effet
 */
function playSlashEffect(parentEl) {
  if (!parentEl) return;
  // retirer un effet précédent s'il existe
  const existing = parentEl.querySelector('.slash-effect');
  if (existing) existing.remove();

  const effect = document.createElement('div');
  effect.className = 'slash-effect';

  const linesCount = 3;
  for (let i = 0; i < linesCount; i++) {
    const line = document.createElement('div');
    line.className = 'slash-line';

    // Positionnement aléatoire en pourcentage pour rester responsive
    const leftPercent = 15 + Math.random() * 70; // entre 15% et 85%
    const topPercent = -25 + Math.random() * 60; // entre -25% et +35%
    line.style.left = leftPercent + '%';
    line.style.top = topPercent + '%';

    // Rotation aléatoire pour chaque ligne (-60deg à 60deg)
    const rotation = -60 + Math.random() * 120;
    // Appliquer rotation via variable CSS --rot; la règle CSS utilise rotate(var(--rot))
    line.style.setProperty('--rot', rotation + 'deg');

    // Delay aléatoire pour le stagger (0 - 140ms)
    const delay = Math.floor(Math.random() * 140);
    line.style.animationDelay = `${delay}ms`;

    // Légère variation d'opacité/échelle initiale possible via style (la keyframe gère le reste)
    effect.appendChild(line);
  }

  parentEl.appendChild(effect);

  // durée maximale de l'animation (un peu plus que la durée CSS) puis suppression
  setTimeout(() => {
    if (effect && effect.parentNode) effect.parentNode.removeChild(effect);
  }, 700);
}

// Exports implicites - le fichier est chargé globalement
