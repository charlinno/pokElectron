/**
 * team.js - Logique de la page équipe
 */

const teamState = {
  selectedTeam: [
    { position: 1, pokemon_id: null },
    { position: 2, pokemon_id: null },
    { position: 3, pokemon_id: null },
    { position: 4, pokemon_id: null },
    { position: 5, pokemon_id: null },
    { position: 6, pokemon_id: null }
  ],
  draggedPokemonId: null
};

async function loadTeamPage() {
  try {
    // Charger l'équipe existante
    const team = await window.pokemonAPI.getTeam();

    // Mettre à jour l'état
    team.forEach(slot => {
      if (slot.position >= 1 && slot.position <= 6) {
        teamState.selectedTeam[slot.position - 1] = slot;
      }
    });

    // Afficher les slots d'équipe
    displayTeamSlots();

    // Afficher les Pokémons capturés
    displayCapturedPokemonSelector();

    console.log('Page equipe chargee');
  } catch (error) {
    console.error('Erreur loadTeamPage:', error);
  }
}

/**
 * Afficher les slots de l'équipe
 */
function displayTeamSlots() {
  const slotsContainer = document.getElementById('team-slots');
  slotsContainer.innerHTML = '';

  teamState.selectedTeam.forEach(slot => {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'team-slot';
    slotDiv.draggable = true;
    slotDiv.id = `slot-${slot.position}`;
    slotDiv.ondrop = (e) => handleSlotDrop(e, slot.position);
    slotDiv.ondragover = (e) => e.preventDefault();

    if (slot.pokemon_id) {
      // Trouver le Pokémon
      const pokemon = appState.allPokemon.find(p => p.id === slot.pokemon_id);
      if (pokemon) {
        slotDiv.innerHTML = `
          <div class="slot-content">
            <img src="${pokemon.image_url}" alt="${pokemon.name}" onerror="this.src='https://via.placeholder.com/100'">
            <p>${pokemon.name}</p>
            <button class="btn-remove" onclick="removeFromTeam(${slot.position})">X</button>
          </div>
        `;
      }
    } else {
      slotDiv.innerHTML = `
        <div class="slot-placeholder">
          <p>Slot ${slot.position}</p>
          <p class="hint">Drag & drop un Pokémon</p>
        </div>
      `;
    }

    slotsContainer.appendChild(slotDiv);
  });
}

/**
 * Afficher les Pokémons capturés pour la sélection
 */
function displayCapturedPokemonSelector() {
  const selector = document.getElementById('captured-selector');
  selector.innerHTML = '';

  if (appState.capturedPokemon.length === 0) {
    selector.innerHTML = '<p class="empty-message">Capture des Pokémons d\'abord!</p>';
    return;
  }

  appState.capturedPokemon.forEach(pokemon => {
    const card = document.createElement('div');
    card.className = 'pokemon-select-card';
    card.draggable = true;
    card.ondragstart = (e) => handlePokemonDragStart(e, pokemon.id);
    card.ondragend = (e) => handleDragEnd(e);

    const inTeam = teamState.selectedTeam.some(slot => slot.pokemon_id === pokemon.id);
    if (inTeam) {
      card.classList.add('in-team');
    }

    card.innerHTML = `
      <img src="${pokemon.image_url}" alt="${pokemon.name}" onerror="this.src='https://via.placeholder.com/80'">
      <p>${pokemon.name}</p>
      ${inTeam ? '<span class="in-team-badge">[En equipe]</span>' : ''}
    `;

    selector.appendChild(card);
  });
}

/**
 * Gérer le drag d'un Pokémon
 */
function handlePokemonDragStart(event, pokemonId) {
  teamState.draggedPokemonId = pokemonId;
  event.dataTransfer.effectAllowed = 'move';
}

/**
 * Gérer le drop dans un slot
 */
function handleSlotDrop(event, position) {
  event.preventDefault();

  if (teamState.draggedPokemonId) {
    // Vérifier si le Pokémon est déjà en équipe
    const alreadyInTeam = teamState.selectedTeam.some(
      slot => slot.pokemon_id === teamState.draggedPokemonId && slot.position !== position
    );

    if (alreadyInTeam) {
      // Retirer du slot précédent
      teamState.selectedTeam.forEach(slot => {
        if (slot.pokemon_id === teamState.draggedPokemonId) {
          slot.pokemon_id = null;
        }
      });
    }

    // Ajouter au nouveau slot
    teamState.selectedTeam[position - 1].pokemon_id = teamState.draggedPokemonId;
    displayTeamSlots();
    displayCapturedPokemonSelector();
  }
}

/**
 * Gérer la fin du drag
 */
function handleDragEnd(event) {
  teamState.draggedPokemonId = null;
}

/**
 * Retirer un Pokémon du slot
 */
function removeFromTeam(position) {
  teamState.selectedTeam[position - 1].pokemon_id = null;
  displayTeamSlots();
  displayCapturedPokemonSelector();
}

/**
 * Sauvegarder l'équipe
 */
async function saveTeam() {
  try {
    showLoading('Sauvegarde de l\'équipe...');

    // Filtrer les slots avec un Pokémon
    const teamToSave = teamState.selectedTeam.filter(slot => slot.pokemon_id);

    // Vérifier qu'il y a au moins 1 Pokémon
    if (teamToSave.length === 0) {
      hideLoading();
      showNotification('ATTENTION', 'Ajoute au moins 1 Pokemon a ton equipe!');
      return;
    }

    const result = await window.pokemonAPI.updateTeam(teamState.selectedTeam);

    if (result.success) {
      hideLoading();
      showNotification('SUCCES', 'Equipe sauvegardee avec succes!', () => {
        showPage('home-page');
      });
    } else {
      hideLoading();
      showNotification('ERREUR', `Erreur: ${result.error}`);
    }
  } catch (error) {
    console.error('Erreur saveTeam:', error);
    hideLoading();
    showNotification('ERREUR', 'Impossible de sauvegarder l\'equipe');
  }
}

