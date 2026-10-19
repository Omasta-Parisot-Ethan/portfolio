# EOP. — Nouvelles pages (galerie, études de cas, parcours, contact)

## Pages ajoutées

| URL | Fichier |
| --- | --- |
| `/projects/` | `src/pages/projects/index.astro` |
| `/projects/vitra/` | `src/pages/projects/vitra.astro` |
| `/projects/festivete/` | `src/pages/projects/festivete.astro` |
| `/projects/formats-numeriques/` | `src/pages/projects/formats-numeriques.astro` |
| `/parcours/` | `src/pages/parcours.astro` |
| `/contact/` | `src/pages/contact.astro` |

`src/pages/index.astro` n'a pas été modifié. Les liens vers les nouvelles pages ont été ajoutés
dans les composants de l'accueil (`Projects.astro`, `About.astro`, `Contact.astro`, `Footer.astro`).

## Où renseigner vos vraies informations

Tout se trouve dans `src/data/` :

- `site.js` : e-mail, URL LinkedIn, chemin du CV (`/cv-eop.pdf` si le fichier est dans `public/`),
  et l'interrupteur `showPlaceholders` (mettre `false` avant la mise en ligne pour masquer tous les
  encadrés « À compléter »).
- `projects.js` : textes des projets et **liste des vrais visuels** (`images`). Déposez vos fichiers dans
  `public/projects/<id>/` puis déclarez-les : `{ src: '/projects/vitra/maquette-1.jpg', alt: '…' }`.
  Les index 0 à 3 correspondent, dans l'ordre, au visuel principal puis aux emplacements de chaque page.
- `profile.js` : contenu de la page Parcours (repris de About, Skills et Method).

L'adresse e-mail est aussi présente en dur dans `src/components/Contact.astro` (section de l'accueil) :
pensez à la remplacer aux deux endroits.

## Composants et scripts ajoutés

- `src/layouts/PageLayout.astro` : gabarit commun (réutilise `Layout`, `Header`, `Footer`).
- `Header.astro` et `Footer.astro` : prop `variant="page"` pour la navigation entre pages ; sans prop, le rendu de l'accueil est inchangé.
- `ProjectVisual`, `ProjectFigure`, `PlaceholderSlot`, `ProjectPager`, `SectionTag`.
- `src/styles/pages.css` et `src/scripts/pages.js` : animations propres aux nouvelles pages
  (aucune dépendance ajoutée ; `prefers-reduced-motion` respecté).
- Transitions entre pages : CSS natif (`@view-transition`), actif dans les navigateurs compatibles entre les nouvelles pages ;
  les autres navigateurs naviguent normalement.

## Animations des pages de projets et du Parcours

Concept : **« le carré se construit »** — le logo EOP. (trois carrés emboîtés) sert de fil conducteur.

- **Rideau de colonnes** (`PageLayout.astro` + `pages.css`) : sept colonnes sombres à bord rose se retirent vers le haut à l'arrivée
  sur un projet ou sur Parcours, et se referment au départ (clic sur un lien vers Projets, Parcours ou Contact).
- **Hero de chaque projet** : une entrée propre à chacun, avec une logique commune (titre composé lettre par lettre,
  visuel qui s'ouvre comme une fenêtre, carrés décoratifs en profondeur).
  - Vitra : lettres qui se placent sur la grille ; la carte se construit (zones, tracé, repères).
  - Festiv'Été : lettres qui retombent ; l'affiche se déroule et les déclinaisons en sortent.
  - Formats numériques : lettres qui défilent comme un carrousel ; les trois formats s'éventent.
- **Au défilement** : titres de section révélés mot par mot, grands visuels qui s'ouvrent, carte synchronisée (Vitra).
- **Parcours** : scène épinglée sur grand écran (≥ 1024 px de large et ≥ 620 px de haut). Le défilement reste natif.
  Un escalier relie les quatre étapes, le carré du logo se construit (cœur, carré clair, cadre) puis la scène bascule
  sur fond sombre ; la page se termine par un portail qui s'ouvre vers les projets.
  Sur mobile, sans JavaScript ou en mouvement réduit : les quatre étapes s'affichent empilées.
- **Micro-interactions** : légère attraction des boutons, zoom des visuels, balayage rose du « projet suivant ».

Aucune dépendance ajoutée. `prefers-reduced-motion` : aucune animation d'entrée, aucun rideau, aucune scène épinglée.
Les états masqués n'existent que si JavaScript est actif (et un filet de sécurité remet tout à son état final après 4,5 s).
Pour retirer l'entrée en scène d'une page, supprimez la prop `stage` dans son `<PageLayout>`.
