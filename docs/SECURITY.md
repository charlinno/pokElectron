# 🔒 Guide de Sécurité - Pokédex Electron

## Vue d'ensemble

Ce document détaille toutes les mesures de sécurité implémentées dans l'application Pokédex Electron et explique pourquoi elles sont cruciales.

---

## Architecture de Sécurité

```
┌─────────────────────────────────────────────────────────┐
│                 RENDERER PROCESS                         │
│                 (Faibles privilèges)                     │
│  ┌────────────────────────────────────────────────┐     │
│  │  - Pas d'accès Node.js                          │     │
│  │  - Pas d'accès Electron APIs                    │     │
│  │  - Sandboxé                                     │     │
│  │  - Uniquement API exposée via preload           │     │
│  └────────────────────────────────────────────────┘     │
└───────────────────────┬─────────────────────────────────┘
                        │ IPC sécurisé
                        │ (contextBridge)
┌───────────────────────▼─────────────────────────────────┐
│                 PRELOAD SCRIPT                           │
│                 (Bridge sécurisé)                        │
│  ┌────────────────────────────────────────────────┐     │
│  │  - Expose API limitée                           │     │
│  │  - Validation des paramètres                    │     │
│  │  - Principe du moindre privilège                │     │
│  └────────────────────────────────────────────────┘     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 MAIN PROCESS                             │
│                 (Privilèges élevés)                      │
│  ┌────────────────────────────────────────────────┐     │
│  │  - Accès complet Node.js                        │     │
│  │  - Accès filesystem                             │     │
│  │  - Gestion base de données                      │     │
│  │  - Validation stricte des entrées               │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Context Isolation

### Configuration

```javascript
// src/main/main.js
webPreferences: {
  contextIsolation: true  // ✅ ACTIVÉ
}
```

### Pourquoi ?

**Sans contextIsolation** :
```javascript
// Renderer peut accéder directement à tout
require('fs').unlinkSync('/important-file')  // ❌ DANGER
process.exit()  // ❌ DANGER
```

**Avec contextIsolation** :
```javascript
// Renderer est isolé
require('fs')  // ❌ undefined
process  // ❌ undefined
window.pokemonAPI.getAllPokemon()  // ✅ OK (exposé via preload)
```

### Bénéfices

✅ **Protection contre XSS** : Même si du code malveillant est injecté, il ne peut pas accéder aux APIs dangereuses

✅ **Isolation complète** : Le renderer et le main ne partagent pas le même contexte JavaScript

✅ **Sécurité renforcée** : Conformité aux best practices Electron

---

## 2. Node Integration

### Configuration

```javascript
// src/main/main.js
webPreferences: {
  nodeIntegration: false  // ✅ DÉSACTIVÉ
}
```

### Pourquoi ?

**Avec nodeIntegration: true** (❌ DANGEREUX) :
```javascript
// N'importe quel script dans le renderer peut :
const { exec } = require('child_process');
exec('rm -rf /')  // ❌ CATASTROPHE
```

**Avec nodeIntegration: false** (✅ SÉCURISÉ) :
```javascript
// Le renderer ne peut rien faire de dangereux
require('child_process')  // undefined
window.pokemonAPI.capturePokemon(1)  // ✅ OK
```

### Bénéfices

✅ **Prévention d'exécution de code** : Impossible d'exécuter des commandes système

✅ **Protection contre les injections** : Les scripts malveillants ne peuvent pas utiliser Node.js

✅ **Surface d'attaque réduite** : Moins de vecteurs d'attaque disponibles

---

## 3. Sandbox

### Configuration

```javascript
// src/main/main.js
webPreferences: {
  sandbox: true  // ✅ ACTIVÉ (implicite avec contextIsolation)
}
```

### Pourquoi ?

Le sandbox limite ce que le processus renderer peut faire :

**Sans sandbox** :
- Accès au filesystem
- Peut forker des processus
- Peut modifier des configurations système

**Avec sandbox** :
- Processus restreint
- Pas d'accès direct au système
- Isolé du reste de l'OS

### Bénéfices

✅ **Confinement** : En cas de compromission, les dégâts sont limités

✅ **Isolation système** : Protection du système d'exploitation

✅ **Sécurité en profondeur** : Couche de sécurité supplémentaire

---

## 4. Preload Script Sécurisé

### Implémentation

```javascript
// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// ✅ Exposition LIMITÉE et CONTRÔLÉE
contextBridge.exposeInMainWorld('pokemonAPI', {
  // Uniquement les fonctions nécessaires
  getAllPokemon: () => ipcRenderer.invoke('get-all-pokemon'),
  capturePokemon: (id) => ipcRenderer.invoke('capture-pokemon', id),
  // PAS d'exposition de fs, child_process, etc.
});
```

### Principe du Moindre Privilège

**❌ MAUVAIS** :
```javascript
// Exposer trop d'APIs
contextBridge.exposeInMainWorld('dangerousAPI', {
  fs: require('fs'),  // ❌ TROP DE POUVOIR
  exec: require('child_process').exec  // ❌ DANGEREUX
});
```

**✅ BON** :
```javascript
// Exposer uniquement ce qui est nécessaire
contextBridge.exposeInMainWorld('pokemonAPI', {
  getAllPokemon: () => ipcRenderer.invoke('get-all-pokemon')
  // Fonction spécifique, contrôlée
});
```

### Bénéfices

✅ **Contrôle total** : Vous décidez exactement ce qui est accessible

✅ **Audit facile** : Toutes les APIs exposées sont dans un seul fichier

✅ **Maintenance simple** : Ajouter/retirer des fonctions est trivial

---

## 5. Validation Côté Main

### Implémentation

```javascript
// src/main/main.js
ipcMain.handle('capture-pokemon', async (event, pokemonId) => {
  // ✅ TOUJOURS VALIDER
  if (!pokemonId || typeof pokemonId !== 'number') {
    throw new Error('Invalid pokemon ID');
  }
  
  if (pokemonId < 1 || pokemonId > 10000) {
    throw new Error('Pokemon ID out of range');
  }
  
  // Maintenant on peut utiliser pokemonId en toute sécurité
  return database.capturePokemon(pokemonId);
});
```

### Pourquoi ?

**Ne JAMAIS faire confiance au renderer** :
- Le renderer peut être compromis (XSS, injection)
- Un attaquant peut envoyer n'importe quelle donnée via IPC
- Le main doit être le gardien de la sécurité

### Checklist de validation

✅ **Type checking** : Vérifier que le type est correct
✅ **Range checking** : Vérifier que la valeur est dans une plage acceptable
✅ **Sanitization** : Nettoyer les strings (SQL injection, XSS)
✅ **Business logic** : Vérifier les règles métier

### Bénéfices

✅ **Protection contre les injections** : SQL, XSS, Command injection

✅ **Prévention des bugs** : Détection précoce des erreurs

✅ **Sécurité en profondeur** : Même si le renderer est compromis, le main reste sûr

---

## 6. Autres Mesures de Sécurité

### 6.1 Remote Module Désactivé

```javascript
webPreferences: {
  enableRemoteModule: false  // ✅ DÉSACTIVÉ
}
```

**Pourquoi ?** Le module remote est deprecated et dangereux. Il permet au renderer d'accéder directement aux APIs du main.

### 6.2 Web Security

```javascript
webPreferences: {
  webSecurity: true  // ✅ ACTIVÉ (par défaut)
}
```

**Pourquoi ?** Empêche le chargement de contenu cross-origin non autorisé.

### 6.3 Allow Running Insecure Content

```javascript
webPreferences: {
  allowRunningInsecureContent: false  // ✅ DÉSACTIVÉ
}
```

**Pourquoi ?** Empêche le chargement de scripts HTTP sur des pages HTTPS.

---

## 7. Sécurité de la Base de Données

### Protection contre SQL Injection

```javascript
// ✅ BON : Parameterized queries
database.run(
  'INSERT INTO pokemon (name, hp) VALUES (?, ?)',
  [name, hp]
);

// ❌ MAUVAIS : String concatenation
database.run(
  `INSERT INTO pokemon (name, hp) VALUES ('${name}', ${hp})`
);
```

### Gestion des Erreurs

```javascript
try {
  await database.insertPokemon(pokemon);
} catch (error) {
  // ✅ Logger l'erreur
  console.error('Database error:', error);
  
  // ✅ Retourner un message générique au renderer
  return { success: false, error: 'Database operation failed' };
  
  // ❌ NE PAS exposer les détails de l'erreur au renderer
}
```

---

## 8. Sécurité des Appels API

### Validation des Réponses

```javascript
// src/main/api-service.js
async getPokemon(id) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  
  // ✅ Valider le status
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  const data = await response.json();
  
  // ✅ Valider la structure
  if (!data || !data.name || !data.sprites) {
    throw new Error('Invalid API response');
  }
  
  return data;
}
```

### Gestion des Timeouts

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('API request timeout');
  }
  throw error;
} finally {
  clearTimeout(timeout);
}
```

---

## 9. Checklist de Sécurité Complète

### Configuration Electron

- [x] `contextIsolation: true`
- [x] `nodeIntegration: false`
- [x] `sandbox: true`
- [x] `enableRemoteModule: false`
- [x] `webSecurity: true`
- [x] `allowRunningInsecureContent: false`

### Preload Script

- [x] Utilisation de `contextBridge`
- [x] Exposition minimale d'APIs
- [x] Pas d'exposition de modules Node dangereux
- [x] Documentation de chaque API exposée

### Main Process

- [x] Validation de tous les paramètres IPC
- [x] Sanitization des entrées
- [x] Gestion d'erreurs robuste
- [x] Logging des opérations sensibles

### Base de Données

- [x] Parameterized queries (protection SQL injection)
- [x] Transactions pour opérations critiques
- [x] Gestion d'erreurs appropriée
- [x] Pas d'exposition de chemins de fichiers

### API Externe

- [x] Validation des réponses
- [x] Timeouts configurés
- [x] Gestion d'erreurs réseau
- [x] Rate limiting (si nécessaire)

---

## 10. Améliorations Futures

### Niveau 1 (Recommandé)

- [ ] **Content Security Policy (CSP)** : Restreindre les sources de scripts
- [ ] **HTTPS uniquement** : Si l'app charge du contenu distant
- [ ] **Auto-update sécurisé** : Vérification des signatures

### Niveau 2 (Avancé)

- [ ] **Chiffrement de la base** : SQLCipher pour chiffrer les données
- [ ] **Authentication** : Si données sensibles multi-utilisateurs
- [ ] **Audit logging** : Tracer les opérations sensibles

### Niveau 3 (Production)

- [ ] **Code signing** : Signer l'application (Windows/macOS)
- [ ] **Crash reporting** : Sentry ou similaire
- [ ] **Telemetry anonyme** : Monitoring des erreurs
- [ ] **Penetration testing** : Tests de sécurité externes

---

## 11. Ressources

### Documentation Officielle

- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [IPC Security](https://www.electronjs.org/docs/latest/tutorial/ipc)

### Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Electron Security Guidelines](https://github.com/doyensec/electronegativity)

---

## Conclusion

La sécurité est un processus continu, pas un état final. Cette application implémente toutes les bonnes pratiques de base d'Electron, mais peut toujours être améliorée.

**Principe fondamental** : Ne jamais faire confiance au renderer, toujours valider côté main.

---

*Dernière mise à jour : Décembre 2025*

