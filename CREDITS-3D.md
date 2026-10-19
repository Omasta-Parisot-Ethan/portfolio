# Crédits & Licences des Ressources — Scène d'Introduction (`IntroScene.astro`)

## 1. Modèles 3D (Carnet ouvert & Crayon flottant)
Conformément aux exigences de performance web, de cohérence chromatique (`#232836` et `#f5dbf7`) et de fiabilité locale sans dépendance externe :
- **Modèle principal intégré** : Géométrie 3D procédurale PBR générée localement via **Three.js** dans `src/scripts/intro-scene.js` (`buildEditorialOpenNotebook()` et `buildFloatingPencil()`).
  - **Contenu** : Carnet ouvert en perspective trois-quarts avec couverture rigide `#232836`, reliure centrale, épaisseur des pages, pages gauche et droite galbées avec textures Canvas haute définition (grille éditoriale et croquis filaires), signet `#f5dbf7`, et crayon hexagonal flottant avec virole métallique et gomme `#f5dbf7`.
  - **Licence** : **CC0 1.0 Universal (Domaine Public) / Propriété intégrale du créateur du portfolio**. Aucune obligation d'attribution externe.
- **Compatibilité avec des fichiers `.glb` externes** :
  - Le composant `IntroScene.astro` supporte également le chargement de modèles `.glb` locaux via `GLTFLoader` (`public/models/notebook-open.glb` et `public/models/pencil-floating.glb`) en passant l'attribut `data-enable-external-glb="true"` sur `#intro-canvas-container`.

## 2. Bibliothèque 3D
- **Three.js** (`three` v0.169.0)
  - **Auteur** : Ricardo Cabello (Mr.doob) et contributeurs
  - **Licence** : MIT License
  - **URL officielle** : https://threejs.org/

## 3. Polices d'écriture manuscrite
- **Caveat** & **Cormorant Garamond** (Google Fonts)
  - **Licence** : SIL Open Font License 1.1 (OFL) — Utilisation libre pour un portfolio personnel ou commercial en ligne.
