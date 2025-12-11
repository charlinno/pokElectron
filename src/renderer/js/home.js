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


    console.log('Page d\'accueil chargee');
  } catch (error) {
    console.error('Erreur loadHomePage:', error);
  }
}

