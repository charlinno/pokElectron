const captureState = {
  isActive: false,
  currentPokemon: null,
  currentPokemonHP: 0,
  maxPokemonHP: 0,
  spawnTimeoutId: null,
  spawnInterval: 5000,
  pokeballElement: null,
  isCapturing: false
};

const BASE_CLICK_DAMAGE = 1;
const POKEBALL_CHANCE = 0.1;

async function loadCapturePage() {
  console.log('Page capture chargee');
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
  startCaptures();
}

function renderCaptureTeam() {
  const teamContainer = document.getElementById('capture-team');
  teamContainer.innerHTML = '';

  let teamSlots = [];
  if (window.pokemonAPI && typeof window.pokemonAPI.getTeam === 'function') {
    teamSlots = appState.team && appState.team.length ? appState.team : [];
  } else {
    teamSlots = appState.team || [];
  }

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

function computeClickDamage() {
  const teamSlots = appState.team || [];
  const teamCount = teamSlots.filter(s => s && s.pokemon_id).length || 0;
  return BASE_CLICK_DAMAGE + teamCount;
}

function startCaptures() {
  if (captureState.isActive) return;

  captureState.isActive = true;
  console.log('Captures automatiques demarrees');
  spawnNextPokemon();
}

function getPokemonHP(pokemon) {
  if (!pokemon) return undefined;

  if (typeof pokemon.hp === 'number') return pokemon.hp;
  if (pokemon.stats && typeof pokemon.stats.hp === 'number') return pokemon.stats.hp;

  if (Array.isArray(pokemon.stats) && pokemon.stats[0] && typeof pokemon.stats[0].base_stat === 'number') {
    return pokemon.stats[0].base_stat;
  }

  if (Array.isArray(pokemon.stats)) {
    const hpEntry = pokemon.stats.find(s => s && (s.name === 'hp' || s.stat === 'hp') && (typeof s.base_stat === 'number'));
    if (hpEntry) return hpEntry.base_stat;
  }

  if (typeof pokemon.base_hp === 'number') return pokemon.base_hp;

  return undefined;
}

function spawnNextPokemon() {
  if (!captureState.isActive) return;

  const uncapturedPokemons = appState.allPokemon.filter(p => !p.is_captured);

  if (uncapturedPokemons.length === 0) {
    showAllCaptured();
    return;
  }

  const randomIndex = Math.floor(Math.random() * uncapturedPokemons.length);
  captureState.currentPokemon = uncapturedPokemons[randomIndex];

  let maxHp = 20;
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

function displayPokemonWithHP(pokemon) {
  const pokemonInfo = document.getElementById('pokemon-to-catch');
  const captureArea = document.getElementById('capture-area');

  captureArea.innerHTML = '';

  const catchable = document.createElement('div');
  catchable.className = 'catchable-pokemon';
  catchable.innerHTML = `
    <img id="capture-pokemon-img" src="${pokemon.image_url || pokemon.sprites?.regular || 'https://via.placeholder.com/150'}" alt="${pokemon.name}" />
  `;

  catchable.querySelector('#capture-pokemon-img').addEventListener('click', (e) => attackPokemon(false, e));

  captureArea.appendChild(catchable);

  document.getElementById('capture-pokemon-name').textContent = pokemon.name;
  updateHPBar();
  pokemonInfo.style.display = 'flex';

  if (Math.random() < POKEBALL_CHANCE) {
    spawnPokeballNear(catchable);
  } else {
    removePokeball();
  }
}

function updateHPBar() {
  const max = captureState.maxPokemonHP || 0;
  const current = typeof captureState.currentPokemonHP === 'number' ? captureState.currentPokemonHP : 0;

  const hpBar = document.getElementById('pokemon-hp-bar');
  const hpText = document.getElementById('pokemon-hp-text');

  if (!hpBar || !hpText) return;

  const hpPercent = max > 0 ? (current / max) * 100 : 0;

  hpBar.style.width = Math.max(0, Math.min(100, hpPercent)) + '%';
  hpText.textContent = `PV: ${current}/${max}`;

  hpBar.classList.remove('hp-high', 'hp-medium', 'hp-low');

  if (hpPercent > 50) {
    hpBar.classList.add('hp-high');
    hpBar.style.background = '#4caf50';
  } else if (hpPercent > 25) {
    hpBar.classList.add('hp-medium');
    hpBar.style.background = '#ffb300';
  } else {
    hpBar.classList.add('hp-low');
    hpBar.style.background = '#f44336';
  }
}

function attackPokemon(viaPokeball = false, event = null) {
  if (!captureState.currentPokemon) return;

  if (captureState.isCapturing) return;

  if (viaPokeball) {
    console.log('🎯 Pokéball cliquée ! Capture instantanée !');
    captureState.currentPokemonHP = 0;
    updateHPBar();
    captureState.isCapturing = true;
    capturePokemon();
    return;
  }

  let damage = computeClickDamage();

  const isCritical = Math.random() < 0.03;

  if (isCritical) {
    damage = damage * 10;
    console.log('⚡ COUP CRITIQUE ! ⚡');

    const parentEl = document.querySelector('.catchable-pokemon');
    playLightningEffect(parentEl, event, damage);
  } else {
    const parentEl = document.querySelector('.catchable-pokemon');
    playMultipleSlashesWithDamage(parentEl, damage, event);
  }

  captureState.currentPokemonHP -= damage;
  captureState.currentPokemonHP = Math.max(0, Math.floor(captureState.currentPokemonHP));

  console.log(`Attaque! ${captureState.currentPokemon.name} - PV restants: ${captureState.currentPokemonHP} (dégats: ${damage}${isCritical ? ' - CRITIQUE!' : ''})`);

  updateHPBar();

  if (captureState.currentPokemonHP <= 0) {
    captureState.isCapturing = true;
    capturePokemon();
  }
}

async function capturePokemon() {
  const pokemon = captureState.currentPokemon;

  if (!pokemon) return;

  try {
    clearTimeout(captureState.spawnTimeoutId);

    removePokeball();

    const catchablePokemon = document.querySelector('.catchable-pokemon');
    if (catchablePokemon) {
      catchablePokemon.classList.add('capturing-in-progress');
    }

    const captureArea = document.getElementById('capture-area');
    const existingCaptureBall = captureArea.querySelector('.capture-pokeball-anim');
    if (existingCaptureBall) {
      existingCaptureBall.remove();
    }

    const captureBall = document.createElement('img');
    captureBall.src = 'assets/pokeball.png';
    captureBall.className = 'capture-pokeball-anim from-right';
    captureBall.onerror = () => {
      captureBall.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
    };

    captureArea.appendChild(captureBall);

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (captureBall.parentNode) {
      captureBall.parentNode.removeChild(captureBall);
    }

    const pokemonImg = document.querySelector('.catchable-pokemon img');
    if (pokemonImg) {
      pokemonImg.classList.add('capturing');
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    const result = await window.pokemonAPI.capturePokemon(pokemon.id || pokemon.pokedex_id || pokemon.pokedexId);

    if (result && result.success) {
      showCaptureSuccess(pokemon);

      const localPokemon = appState.allPokemon.find(p => p.id === pokemon.id || p.pokedex_id === pokemon.pokedex_id);
      if (localPokemon) {
        localPokemon.is_captured = 1;
        appState.capturedPokemon.push(localPokemon);
      }

      setTimeout(() => {
        if (captureState.isActive) {
          captureState.isCapturing = false;
          spawnNextPokemon();
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Erreur capture:', error);
    captureState.isCapturing = false;
  }
}

function spawnPokeballNear(parentEl) {
  removePokeball();

  const captureArea = document.getElementById('capture-area');
  const pokeball = document.createElement('img');
  pokeball.src = 'assets/pokeball.png';
  pokeball.className = 'pokeball';
  pokeball.onerror = () => {
    pokeball.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
  };

  const areaRect = captureArea.getBoundingClientRect();
  const x = Math.random() * (areaRect.width - 60) + 20;
  const y = Math.random() * (areaRect.height - 60) + 20;

  pokeball.style.left = `${x}px`;
  pokeball.style.top = `${y}px`;

  pokeball.addEventListener('click', (e) => {
    e.stopPropagation();
    attackPokemon(true);
    pokeball.style.transform = 'scale(0.8)';
    setTimeout(() => removePokeball(), 200);
  });

  captureArea.appendChild(pokeball);
  captureState.pokeballElement = pokeball;
}

function removePokeball() {
  if (captureState.pokeballElement && captureState.pokeballElement.parentNode) {
    captureState.pokeballElement.parentNode.removeChild(captureState.pokeballElement);
  }
  captureState.pokeballElement = null;
}

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

function playMultipleSlashesWithDamage(parentEl, damage, event) {
  if (!parentEl) return;

  if (event) {
    showDamageText(parentEl, event, damage);
  }

  const effectContainer = document.createElement('div');
  effectContainer.className = 'slash-effect';
  parentEl.appendChild(effectContainer);

  for (let i = 0; i < damage; i++) {
    const delay = 20 + Math.random() * 40;

    setTimeout(() => {
      createSingleSlash(effectContainer);
    }, i * delay);
  }

  setTimeout(() => {
    if (effectContainer && effectContainer.parentNode) {
      effectContainer.parentNode.removeChild(effectContainer);
    }
  }, damage * 60 + 700);
}

function createSingleSlash(container) {
  const line = document.createElement('div');
  line.className = 'slash-line';

  const leftPercent = 15 + Math.random() * 70;
  const topPercent = -25 + Math.random() * 60;
  line.style.left = leftPercent + '%';
  line.style.top = topPercent + '%';

  const rotation = -60 + Math.random() * 120;
  line.style.setProperty('--rot', rotation + 'deg');

  container.appendChild(line);

  setTimeout(() => {
    if (line && line.parentNode) {
      line.parentNode.removeChild(line);
    }
  }, 500);
}

function showDamageText(parentEl, event, damage) {
  const damageText = document.createElement('div');
  damageText.className = 'damage-text';
  damageText.textContent = `-${damage}`;

  const rect = parentEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  damageText.style.left = x + 'px';
  damageText.style.top = y + 'px';

  parentEl.appendChild(damageText);

  setTimeout(() => {
    if (damageText && damageText.parentNode) {
      damageText.parentNode.removeChild(damageText);
    }
  }, 1000);
}

function playLightningEffect(parentEl, event, damage) {
  if (!parentEl) return;

  showCriticalDamageText(parentEl, damage);

  const lightningContainer = document.createElement('div');
  lightningContainer.className = 'lightning-effect';
  parentEl.appendChild(lightningContainer);

  for (let i = 0; i < 3; i++) {
    const lightning = document.createElement('div');
    lightning.className = 'lightning-bolt';

    lightning.style.animationDelay = `${i * 0.1}s`;

    lightningContainer.appendChild(lightning);
  }

  const pokemonImg = parentEl.querySelector('img');
  if (pokemonImg) {
    pokemonImg.classList.add('critical-flash');
    setTimeout(() => {
      pokemonImg.classList.remove('critical-flash');
    }, 600);
  }

  setTimeout(() => {
    if (lightningContainer && lightningContainer.parentNode) {
      lightningContainer.parentNode.removeChild(lightningContainer);
    }
  }, 1000);
}

function showCriticalDamageText(parentEl, damage) {
  const damageText = document.createElement('div');
  damageText.className = 'damage-text critical-damage-text';
  damageText.textContent = `-${damage} CRITIQUE!`;

  damageText.style.left = '50%';
  damageText.style.top = '50%';
  damageText.style.transform = 'translate(-50%, -50%)';

  parentEl.appendChild(damageText);

  setTimeout(() => {
    if (damageText && damageText.parentNode) {
      damageText.parentNode.removeChild(damageText);
    }
  }, 1500);
}

