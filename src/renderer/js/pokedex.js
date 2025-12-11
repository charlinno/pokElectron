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
          <button class="btn btn-primary" onclick="forceSyncPokemonDatabase()">
            Charger TOUS les Pokemons
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
  card.style.cursor = 'pointer';

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

  // Ajouter l'événement de clic pour afficher les détails
  card.addEventListener('click', () => {
    showPokemonDetails(pokemon);
  });

  return card;
}

/**
 * Afficher les détails d'un Pokémon
 */
function showPokemonDetails(pokemon) {
  // Mettre à jour le contenu de la page de détails
  document.getElementById('details-title').textContent = pokemon.name;
  document.getElementById('details-image').src = pokemon.image_url || 'https://via.placeholder.com/200';
  document.getElementById('details-name').textContent = pokemon.name;
  document.getElementById('details-id').textContent = `#${pokemon.pokedex_id}`;
  document.getElementById('details-height').textContent = pokemon.height ? `${pokemon.height} m` : 'N/A';
  document.getElementById('details-weight').textContent = pokemon.weight ? `${pokemon.weight} kg` : 'N/A';
  // Utiliser stats.hp si présent
  document.getElementById('details-hp').textContent = (pokemon.stats && typeof pokemon.stats.hp !== 'undefined') ? pokemon.stats.hp : (pokemon.hp || 'N/A');

  // Afficher les types
  const typesList = document.getElementById('details-types-list');
  typesList.innerHTML = '';
  if (pokemon.type_primary) {
    const badge = document.createElement('span');
    badge.className = `type-badge type-${pokemon.type_primary.toLowerCase()}`;
    badge.textContent = pokemon.type_primary;
    typesList.appendChild(badge);
  }
  if (pokemon.type_secondary) {
    const badge = document.createElement('span');
    badge.className = `type-badge type-${pokemon.type_secondary.toLowerCase()}`;
    badge.textContent = pokemon.type_secondary;
    typesList.appendChild(badge);
  }

  // Afficher le statut de capture
  const statusElement = document.getElementById('details-capture-status');
  if (pokemon.is_captured) {
    statusElement.innerHTML = '<span class="captured-status">Ce Pokemon a ete capture!</span>';
  } else {
    statusElement.innerHTML = '<span class="uncaptured-status">Ce Pokemon n\'a pas encore ete capture</span>';
  }

  // Afficher la page de détails
  showPage('pokemon-details-page');
}
