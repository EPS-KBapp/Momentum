# Momentum v2 — Plan technique

## Décision produit

Momentum v2 remplace l'ancienne logique Ambition par une application organisée en quatre espaces :

1. **Chill** — module existant conservé intact.
2. **Sport** — objectifs sportifs, programme hebdomadaire, séances, tests et profil.
3. **Hobbies** — objectifs personnels, pratiques, lecture, expériences et moments.
4. **Brain** — objectifs intellectuels, plan de travail, productions, agrégation interne EPS et projets professionnels.

La partie Ambition doit disparaître entièrement à terme : timer, prairie/forêt, calendrier, objectifs Ambition, progression Ambition et navigation associée.

## Règle de sécurité

La refonte se fait sur la branche `refonte-momentum-v2`.

`main` reste la version stable.

Chill ne doit pas être modifié dans un premier temps. Toute intégration de Chill dans la nouvelle coque devra préserver :

- les données `lt6_*`,
- les fonctions existantes de Chill,
- les quatre menus actuels,
- les formulaires actuels,
- le comportement actuel.

## Direction artistique

Momentum v2 doit garder une identité commune :

- design mobile-first,
- cartes arrondies,
- interfaces calmes,
- typographie lisible,
- structure homogène entre espaces,
- variations par couleur d'accent seulement.

Accents recommandés :

| Espace | Ambiance | Accent |
|---|---|---|
| Chill | chaleureux, envies, collections | doré / beige |
| Sport | énergie, forme, progression | vert / bleu |
| Hobbies | créativité, vie personnelle | terracotta / orange doux |
| Brain | concentration, apprentissage | violet / bleu nuit |

## Architecture cible

```text
index.html
styles.css
app.js
chill.js
goals-core.js
sport.js
hobbies.js
brain.js
sw.js
manifest.json
```

La première livraison de cette branche ajoute un prototype isolé dans `/v2/` pour valider la structure sans toucher au fichier `index.html` existant.

## Roadmap

### Phase 1 — Coque Momentum v2

Objectifs :

- créer un accueil avec quatre cartes ;
- ouvrir les espaces Chill, Sport, Hobbies, Brain ;
- garder Chill intact ;
- créer un premier moteur commun d'objectifs pour Sport/Hobbies/Brain.

Critères de validation :

- l'accueil s'affiche ;
- les quatre espaces s'ouvrent ;
- Sport, Hobbies et Brain partagent une logique d'objectifs ;
- aucune modification n'est faite dans Chill.

### Phase 2 — Intégration Chill sans modification fonctionnelle

Objectifs :

- encapsuler le module Chill dans la nouvelle coque ;
- conserver ses quatre menus ;
- ajouter seulement un retour global vers l'accueil Momentum v2.

### Phase 3 — Suppression propre d'Ambition

Objectifs :

- retirer l'interface Ambition ;
- supprimer les dépendances inutiles ;
- conserver uniquement les helpers nécessaires à Chill.

### Phase 4 — Sport v1

Objectifs :

- objectifs sportifs court/moyen/long terme ;
- programme hebdomadaire ;
- validation des séances ;
- comparaison prévu/réalisé ;
- profil sport ;
- premiers tests : VAMEVAL, Cooper/demi-Cooper.

### Phase 5 — Hobbies v1

Objectifs :

- objectifs hobbies ;
- pratiques suivies ;
- lecture avec progression ;
- expériences et moments.

### Phase 6 — Brain v1

Objectifs :

- objectifs intellectuels ;
- plan de travail ;
- productions ;
- agrégation interne EPS ;
- projets professionnels.

Note : il n'y a pas d'onglet Ressources dans Brain. Les références, lectures ou liens éventuels seront attachés aux tâches ou productions.
