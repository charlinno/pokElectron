/**
 * home.js - Logique de la page d'accueil
 */

async function loadHomePage() {
  try {
    // Mettre à jour les stats
    const capturedCount = appState.capturedPokemon.length;
    const totalCount = appState.allPokemon.length;

    document.getElementById('captured-count').textContent = capturedCount;
    document.getElementById('total-count').textContent = totalCount;

    // Charger l'équipe
    const team = await window.pokemonAPI.getTeamWithDetails();
    appState.team = team;

    // Afficher l'aperçu de l'équipe si elle existe
    const teamPreview = document.getElementById('team-preview');
    const teamPreviewList = document.getElementById('team-preview-list');

    const pokemonsInTeam = team.filter(slot => slot.id); // Slots avec Pokémon

    if (pokemonsInTeam.length > 0) {
      teamPreview.style.display = 'block';
      teamPreviewList.innerHTML = pokemonsInTeam
        .map(
          pokemon => `
        <div class="team-preview-item">
          <img src="${pokemon.image_url}" alt="${pokemon.name}" onerror="this.src='https://via.placeholder.com/80'">
          <span>${pokemon.name}</span>
        </div>
      `
        )
        .join('');
    } else {
      teamPreview.style.display = 'none';
    }

    console.log('Page d\'accueil chargee');
  } catch (error) {
    console.error('Erreur loadHomePage:', error);
  }
}

