# Momentum v2 — Plan technique de refonte

## Objectif

Construire une nouvelle version de Momentum autour de quatre espaces :

- Chill
- Sport
- Hobbies
- Brain

La version stable actuelle reste sur `main`. La refonte est développée sur la branche :

```text
refonte-momentum-v2
```

## Règles de sécurité

1. Ne pas modifier directement `main`.
2. Ne pas casser Chill.
3. Ne pas modifier le code interne de Chill dans un premier temps.
4. Supprimer Ambition seulement après validation de la coque v2.
5. Ne pas ajouter d’API externe.
6. Garder les données Chill existantes isolées.
7. Stocker les nouvelles données dans des clés `momentum_v2_*`.

## État actuel de la PR

La PR contient un prototype isolé dans `/v2/`.

### Inclus

- Accueil Momentum v2 avec quatre espaces.
- Direction artistique commune avec accents par espace.
- Encapsulation de Chill via iframe same-origin vers l’app stable.
- Ouverture automatique de Chill via `enterApp('chill')` sans modifier le code legacy.
- Moteur commun pour Sport, Hobbies et Brain.
- Objectifs court / moyen / long terme.
- Actions planifiées.
- Journaux de réalisation.
- Collections métiers simples.
- Premiers écrans fonctionnels pour Sport, Hobbies et Brain.

### Non inclus

- Suppression effective d’Ambition dans `index.html`.
- Migration du code Chill hors du fichier legacy.
- Fusion dans `main`.
- Connexions Garmin, Strava, Health Connect ou API externes.

## Architecture actuelle

```text
v2/
├── index.html
├── styles.css
├── app.js
├── goals-core.js
├── sport.js
├── hobbies.js
└── brain.js
```

## Données locales

Chill conserve ses clés historiques.

La v2 utilise :

```text
momentum_v2_goals
momentum_v2_actions
momentum_v2_logs
momentum_v2_collections
```

## Moteur commun

Le fichier `goals-core.js` gère :

- objectifs ;
- actions planifiées ;
- réalisations ;
- collections simples ;
- résumés par espace ;
- libellés communs ;
- nettoyage objectif → actions/logs associés.

## Espace Sport

Fonctions v1 :

- objectifs sportifs ;
- programme / séances prévues ;
- validation des séances réalisées ;
- comparaison qualitative prévu / réalisé ;
- profil sportif simple ;
- tests simples : VAMEVAL/VMA directe, Cooper, demi-Cooper, RABIT, gainage ;
- calculs simples pour VMA ou vitesse moyenne quand possible.

## Espace Hobbies

Fonctions v1 :

- objectifs hobbies ;
- pratiques planifiées ;
- pratiques réalisées ;
- livres avec progression en pages ;
- expériences / moments avec statut idée, prévu, réalisé.

## Espace Brain

Fonctions v1 :

- objectifs intellectuels ;
- plan de travail ;
- validation du travail réalisé ;
- productions ;
- préparation agrégation interne EPS ;
- projets professionnels.

Il n’y a pas d’onglet Ressources autonome. Les références peuvent être notées dans les tâches et productions.

## Tests manuels à effectuer

### Coque

- ouvrir `/v2/index.html` ;
- vérifier l’accueil 4 espaces ;
- ouvrir puis quitter chaque espace ;
- vérifier le responsive mobile.

### Chill

- ouvrir Chill depuis la v2 ;
- vérifier que les quatre menus Chill fonctionnent ;
- vérifier que les données existantes sont visibles ;
- revenir à l’accueil v2.

### Sport

- créer un objectif ;
- planifier une séance ;
- valider une séance ;
- renseigner le profil ;
- ajouter un test.

### Hobbies

- créer un objectif ;
- planifier une pratique ;
- valider une pratique ;
- ajouter un livre ;
- ajouter une expérience.

### Brain

- créer un objectif ;
- planifier une tâche ;
- valider une tâche ;
- ajouter une production.

## Prochaine étape technique

Avant suppression d’Ambition :

1. Tester `/v2/index.html` sur mobile et desktop.
2. Corriger les bugs v2.
3. Vérifier Chill dans l’iframe.
4. Ajouter éventuellement un lien de test depuis la version stable, sans remplacer l’accueil.
5. Seulement ensuite : préparer la suppression propre d’Ambition dans une étape séparée.
