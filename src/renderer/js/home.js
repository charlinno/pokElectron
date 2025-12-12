async function loadHomePage() {
  try {
    const capturedCount = appState.capturedPokemon.length;
    const totalCount = appState.allPokemon.length;

    document.getElementById('captured-count').textContent = capturedCount;
    document.getElementById('total-count').textContent = totalCount;

    const team = await window.pokemonAPI.getTeamWithDetails();
    appState.team = team;


    console.log('Page d\'accueil chargee');
  } catch (error) {
    console.error('Erreur loadHomePage:', error);
  }
}

