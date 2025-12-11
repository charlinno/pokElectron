const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Classe de gestion de la base de données SQLite
 * Gère les opérations CRUD pour Pokemon et Team
 */
class Database {
  constructor(dbPath = null) {
    // Utiliser un chemin par défaut ou un chemin personnalisé
    if (dbPath) {
      this.dbPath = dbPath;
    } else {
      const appData = require('electron').app?.getPath('userData') || './data';
      this.dbPath = path.join(appData, 'pokedex.db');
    }

    this.db = null;
    console.log(`📁 Chemin DB: ${this.dbPath}`);
  }

  /**
   * Initialiser la base de données et créer les tables si nécessaire
   */
  initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Erreur de connexion à la BD:', err);
          reject(err);
        } else {
          console.log('✅ Connecté à SQLite');
          this.createTables();
          resolve();
        }
      });
    });
  }

  /**
   * Créer les tables Pokemon et Team
   */
  createTables() {
    const createPokemonTable = `
      CREATE TABLE IF NOT EXISTS pokemon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokedex_id INTEGER UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        is_captured BOOLEAN NOT NULL DEFAULT 0,
        capture_date TIMESTAMP,
        type_primary VARCHAR(50),
        type_secondary VARCHAR(50),
        height FLOAT,
        weight FLOAT,
        hp INTEGER DEFAULT 20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pokemon_name ON pokemon(name);
      CREATE INDEX IF NOT EXISTS idx_pokemon_is_captured ON pokemon(is_captured);
      CREATE INDEX IF NOT EXISTS idx_pokemon_pokedex_id ON pokemon(pokedex_id);
    `;

    const createTeamTable = `
      CREATE TABLE IF NOT EXISTS team (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        position INTEGER UNIQUE NOT NULL CHECK (position BETWEEN 1 AND 6),
        pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE SET NULL,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_index INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_team_position ON team(position);
      CREATE INDEX IF NOT EXISTS idx_team_pokemon_id ON team(pokemon_id);
    `;

    this.db.exec(createPokemonTable, (err) => {
      if (err) {
        console.error('❌ Erreur création table pokemon:', err);
      } else {
        console.log('✅ Table pokemon prête');
      }
    });

    this.db.exec(createTeamTable, (err) => {
      if (err) {
        console.error('❌ Erreur création table team:', err);
      } else {
        console.log('✅ Table team prête');
      }
    });
  }

  // ========================================
  // POKEMON OPERATIONS
  // ========================================

  /**
   * Insérer un Pokémon dans la base de données
   * @param {Object} pokemon - Données du Pokémon
   * @returns {Promise<number>} ID du Pokémon inséré
   */
  insertPokemon(pokemon) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO pokemon (pokedex_id, name, image_url, type_primary, type_secondary, height, weight, hp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
          sql,
          [
            pokemon.pokedex_id,
            pokemon.name,
            pokemon.image_url,
            pokemon.type_primary,
            pokemon.type_secondary,
            pokemon.height,
            pokemon.weight,
            pokemon.hp
        ],
        function(err) {
          if (err) {
            console.error('❌ Erreur insertPokemon:', err);
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les Pokémons
   * @returns {Promise<Array>} Liste de tous les Pokémons
   */
  getAllPokemon() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pokemon ORDER BY pokedex_id ASC';

      this.db.all(sql, (err, rows) => {
        if (err) {
          console.error('❌ Erreur getAllPokemon:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Récupérer un Pokémon par ID
   * @param {number} id - ID du Pokémon
   * @returns {Promise<Object>} Données du Pokémon
   */
  getPokemonById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pokemon WHERE id = ?';

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('❌ Erreur getPokemonById:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Récupérer un Pokémon par Pokedex ID
   * @param {number} pokedexId - Numéro du Pokédex
   * @returns {Promise<Object>} Données du Pokémon
   */
  getPokemonByPokedexId(pokedexId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pokemon WHERE pokedex_id = ?';

      this.db.get(sql, [pokedexId], (err, row) => {
        if (err) {
          console.error('❌ Erreur getPokemonByPokedexId:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Récupérer un Pokémon par nom
   * @param {string} name - Nom du Pokémon
   * @returns {Promise<Object>} Données du Pokémon
   */
  getPokemonByName(name) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pokemon WHERE LOWER(name) = LOWER(?)';

      this.db.get(sql, [name], (err, row) => {
        if (err) {
          console.error('❌ Erreur getPokemonByName:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Récupérer les Pokémons capturés
   * @returns {Promise<Array>} Liste des Pokémons capturés
   */
  getCapturedPokemon() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pokemon WHERE is_captured = 1 ORDER BY name ASC';

      this.db.all(sql, (err, rows) => {
        if (err) {
          console.error('❌ Erreur getCapturedPokemon:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Mettre à jour le statut de capture d'un Pokémon
   * @param {number} pokemonId - ID du Pokémon
   * @param {boolean} captured - Statut de capture
   * @returns {Promise<void>}
   */
  updatePokemonCaptured(pokemonId, captured) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE pokemon SET is_captured = ?, capture_date = ? WHERE id = ?';
      const captureDate = captured ? new Date().toISOString() : null;

      this.db.run(sql, [captured ? 1 : 0, captureDate, pokemonId], function(err) {
        if (err) {
          console.error('❌ Erreur updatePokemonCaptured:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Compter les Pokémons capturés
   * @returns {Promise<number>} Nombre de Pokémons capturés
   */
  countCapturedPokemon() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM pokemon WHERE is_captured = 1';

      this.db.get(sql, (err, row) => {
        if (err) {
          console.error('❌ Erreur countCapturedPokemon:', err);
          reject(err);
        } else {
          resolve(row?.count || 0);
        }
      });
    });
  }

  /**
   * Compter tous les Pokémons
   * @returns {number} Nombre total de Pokémons
   */
  countAllPokemon() {
    let count = 0;
    const sql = 'SELECT COUNT(*) as count FROM pokemon';

    this.db.get(sql, (err, row) => {
      if (err) {
        console.error('❌ Erreur countAllPokemon:', err);
      } else {
        count = row?.count || 0;
      }
    });

    return count;
  }

  /**
   * Supprimer un Pokémon
   * @param {number} pokemonId - ID du Pokémon
   * @returns {Promise<void>}
   */
  deletePokemon(pokemonId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM pokemon WHERE id = ?';

      this.db.run(sql, [pokemonId], function(err) {
        if (err) {
          console.error('❌ Erreur deletePokemon:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Vider la table des Pokémons
   * @returns {Promise<void>}
   */
  clearAllPokemon() {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM pokemon';

      this.db.run(sql, function(err) {
        if (err) {
          console.error('❌ Erreur clearAllPokemon:', err);
          reject(err);
        } else {
          console.log('✅ Tous les Pokemons ont ete supprimes de la base de donnees');
          resolve();
        }
      });
    });
  }

  // ========================================
  // TEAM OPERATIONS
  // ========================================

  /**
   * Récupérer l'équipe
   * @returns {Promise<Array>} Slots de l'équipe
   */
  getTeam() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM team ORDER BY position ASC';

      this.db.all(sql, (err, rows) => {
        if (err) {
          console.error('❌ Erreur getTeam:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Récupérer l'équipe avec détails des Pokémons
   * @returns {Promise<Array>} Équipe avec détails
   */
  getTeamWithDetails() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.position, p.* FROM team t
        LEFT JOIN pokemon p ON t.pokemon_id = p.id
        ORDER BY t.position ASC
      `;

      this.db.all(sql, (err, rows) => {
        if (err) {
          console.error('❌ Erreur getTeamWithDetails:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Ajouter un Pokémon à un slot de l'équipe
   * @param {number} position - Position (1-6)
   * @param {number} pokemonId - ID du Pokémon
   * @returns {Promise<void>}
   */
  addPokemonToTeam(position, pokemonId) {
    return new Promise((resolve, reject) => {
      if (position < 1 || position > 6) {
        reject(new Error('Position invalide (doit être entre 1 et 6)'));
        return;
      }

      const sql = `
        INSERT OR REPLACE INTO team (position, pokemon_id, added_date)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [position, pokemonId], function(err) {
        if (err) {
          console.error('❌ Erreur addPokemonToTeam:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Retirer un Pokémon d'un slot de l'équipe
   * @param {number} position - Position (1-6)
   * @returns {Promise<void>}
   */
  removePokemonFromTeam(position) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE team SET pokemon_id = NULL WHERE position = ?';

      this.db.run(sql, [position], function(err) {
        if (err) {
          console.error('❌ Erreur removePokemonFromTeam:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Mettre à jour l'équipe complète
   * @param {Array} teamData - Tableau avec { position, pokemon_id }
   * @returns {Promise<void>}
   */
  updateTeam(teamData) {
    return new Promise((resolve, reject) => {
      // Nettoyer l'équipe actuelle
      this.db.run('DELETE FROM team', (err) => {
        if (err) {
          console.error('❌ Erreur nettoyage équipe:', err);
          reject(err);
          return;
        }

        // Insérer les nouvelles données
        const insertSql = `
          INSERT INTO team (position, pokemon_id, added_date)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `;

        let completed = 0;
        let hasError = false;

        teamData.forEach((slot) => {
          if (slot.pokemon_id) {
            this.db.run(insertSql, [slot.position, slot.pokemon_id], (err) => {
              if (err && !hasError) {
                hasError = true;
                console.error('❌ Erreur updateTeam:', err);
                reject(err);
              } else {
                completed++;
                if (completed === teamData.length && !hasError) {
                  resolve();
                }
              }
            });
          } else {
            completed++;
            if (completed === teamData.length && !hasError) {
              resolve();
            }
          }
        });

        if (teamData.length === 0) {
          resolve();
        }
      });
    });
  }

  /**
   * Fermer la connexion à la base de données
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Erreur fermeture BD:', err);
            reject(err);
          } else {
            console.log('✅ Connexion BD fermée');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
