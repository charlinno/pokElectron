/**
 * pokedex.js - Logique de la page Pokédex
 */

async function loadPokédexPage() {
  try {
    const pokemonList = document.getElementById('pokemon-list');
    pokemonList.innerHTML = '';

    if (appState.allPokemon.length === 0) {
      pokemonList.innerHTML = `
        <div class="empty-state">
          <p>Aucun Pokemon disponible</p>
          <button class="btn btn-primary" onclick="syncPokemonDatabase()">
            Synchroniser depuis l'API
          </button>
        </div>
      `;
      return;
    }

    // Créer les cartes Pokémon
    appState.allPokemon.forEach(pokemon => {
      const card = createPokemonCard(pokemon);
      pokemonList.appendChild(card);
    });

    console.log(`Pokedex charge (${appState.allPokemon.length} Pokemons)`);
  } catch (error) {
    console.error('Erreur loadPokédexPage:', error);
  }
}

/**
 * Créer une carte Pokémon
 */
function createPokemonCard(pokemon) {
  const card = document.createElement('div');
  card.className = `pokemon-card ${pokemon.is_captured ? 'captured' : 'uncaptured'}`;

  const image = document.createElement('img');
  image.src = pokemon.image_url || 'https://via.placeholder.com/150';
  image.alt = pokemon.name;
  image.onerror = () => {
    image.src = 'https://via.placeholder.com/150';
  };

  const name = document.createElement('p');
  name.className = 'pokemon-name';
  name.textContent = pokemon.name;

  const id = document.createElement('p');
  id.className = 'pokemon-id';
  id.textContent = `#${pokemon.pokedex_id}`;

  const type = document.createElement('div');
  type.className = 'pokemon-types';
  if (pokemon.type_primary) {
    const typeBadge = document.createElement('span');
    typeBadge.className = `type-badge type-${pokemon.type_primary.toLowerCase()}`;
    typeBadge.textContent = pokemon.type_primary;
    type.appendChild(typeBadge);
  }

  card.appendChild(image);
  card.appendChild(name);
  card.appendChild(id);
  card.appendChild(type);

  if (pokemon.is_captured) {
    const badge = document.createElement('div');
    badge.className = 'captured-badge';
    badge.textContent = '[Capture]';
    card.appendChild(badge);
  } else {
    const badge = document.createElement('div');
    badge.className = 'uncaptured-badge';
    badge.textContent = '[Non capture]';
    card.appendChild(badge);
  }

  return card;
}

