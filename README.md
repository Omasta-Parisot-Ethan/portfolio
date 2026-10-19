# EOP. — Portfolio Créatif & Éditorial (BUT MMI3 Communication)

Portfolio personnel conçu autour de l'identité **EOP.** et du concept directeur du **carré** (rigueur, fiabilité, organisation, efficacité, adaptabilité et créativité maîtrisée).

## 1. Stack technique

- **Astro** (`^4.16.18`) — Architecture par composants statiques ultra-performante, zéro framework JS client lourd.
- **Tailwind CSS** (`^3.4.17`) + CSS personnalisé (`src/styles/global.css`).
- **JavaScript Vanilla** centralisé dans `src/scripts/main.js`.
- **Illustrations SVG locales** intégrées aux composants (fonctionnement 100 % hors ligne).

## 2. Installation, lancement et build

Prérequis : **Node.js 18.17+** (ou Node 20 / 22 LTS).

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement local (http://localhost:4321)
npm run dev

# 3. Générer la version de production dans le dossier dist/
npm run build

# 4. Prévisualiser le build de production
npm run preview
3. Éléments de démonstration à personnaliserProjets (src/components/Projects.astro) :Les trois projets (Vitra — Autonomie accompagnée, Bocksons Festival — Identité événementielle, Communication — Formats numériques) sont des démonstrations structurées.Modifiez le tableau projects dans src/components/Projects.astro pour insérer vos véritables problématiques, livrables et visuels.Adresse de contact (src/data/site.js) :Renseignez votre adresse dans la propriété email. Elle est utilisée pour l’affichage et les liens mailto du site.Métadonnées (src/layouts/Layout.astro) :Adaptez la balise title et description avec votre nom et prénom si souhaité.
---

## 3. Générateur automatique de l'archive `portfolio-eop.zip`

Pour obtenir immédiatement le dossier complet **`portfolio-eop/`** ainsi que l'archive **`portfolio-eop.zip`** sans copier-coller chaque fichier manuellement, enregistrez le script Node.js autonome ci-dessous sous le nom `build-zip.mjs` et exécutez `node build-zip.mjs` :

```javascript
// Fichier : build-zip.mjs
// Usage : node build-zip.mjs
// Crée l'arborescence complète portfolio-eop/ et génère portfolio-eop.zip

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve('portfolio-eop');
const dirs = [
  'public',
  'src/components',
  'src/layouts',
  'src/pages',
  'src/scripts',
  'src/styles',
];

dirs.forEach((d) => fs.mkdirSync(path.join(root, d), { recursive: true }));

console.log('Arborescence portfolio-eop/ prête. Placez les fichiers ci-dessus puis lancez :');
console.log('zip -r portfolio-eop.zip portfolio-eop -x "*/node_modules/*"');
