/**
 * EOP. — Données des projets (galerie /projects/ et études de cas)
 *
 * Les champs title, categories, description, visualDirection, context,
 * approach et deliverables reprennent mot pour mot le contenu déjà présent
 * dans src/components/Projects.astro. Aucune statistique ni résultat n'est ajouté.
 *
 * `images` : ajoutez vos vrais visuels dans public/projects/<id>/ puis listez-les ici,
 * dans l’ordre de la couverture puis des livrables. Utilisez null pour conserver un emplacement vide :
 *   images: [{ src: '/projects/vitra/maquette-1.jpg', alt: 'Écran d’accueil de l’interface mobile' }]
 */
export const projects = [
  {
    id: 'vitra',
    num: '01',
    href: '/projects/vitra/',
    name: 'Vitra',
    tagline: 'Autonomie accompagnée',
    title: 'Vitra — Autonomie accompagnée',
    categories: 'STRATÉGIE · UX/UI',
    domain: 'Communication · Expérience de visite',
    description:
      'Imaginer une expérience de visite qui aide chacun à se repérer, à comprendre le campus et à explorer à son propre rythme.',
    visualDirection: 'Cartographie abstraite, modules, repères et système de navigation.',
    context:
      'Orientation et médiation au sein d’un espace culturel et architectural complexe.',
    approach: [
      'Analyse des besoins d’orientation selon différents profils de visiteurs (découverte libre, parcours thématique, visite rapide).',
      'Conception d’un système de repères visuels modulaires inspiré du carré et de la signalétique éditoriale.',
      'Prototypage d’une interface mobile claire permettant de visualiser sa position, les points d’intérêt et le temps de parcours sans surcharge cognitive.',
    ],
    deliverables: ['Note d’intention stratégique', 'Stratégie complète', 'Moodboard et planches de style', 'Proposition et présentation'],
    images: [],
  },
  {
    id: 'festivete',
    num: '02',
    href: '/projects/festivete/',
    name: 'Bocksons Festival',
    tagline: 'Identité événementielle',
    title: 'Bocksons Festival — Identité événementielle',
    categories: 'DIRECTION ARTISTIQUE · PRINT',
    domain: 'Identité visuelle · Événementiel',
    description:
      'Construire un univers graphique convivial et cohérent pour valoriser un événement culturel et renforcer son identité.',
    visualDirection: 'Affiche illustrée, composition géométrique et ambiance événementielle chaleureuse.',
    context:
      'Doter un rendez-vous culturel estival d’une identité visuelle immédiatement identifiable sur l’ensemble de ses supports.',
    approach: [
      'Définition d’un langage géométrique associant trames structurées, typographie expressive et contrastes chromatiques.',
      'Conception d’une affiche maîtresse modulaire pouvant se décliner en programme imprimé, signalétique sur site et bannières numériques.',
      'Hiérarchisation claire des informations pratiques (programmation, lieux, horaires) pour garantir une lecture immédiate.',
    ],
    deliverables: ['Affiche officielle & déclinaisons print', 'Charte graphique événementielle', 'Kit de signalétique modulaire'],
    images: [],
  },
  {
    id: 'formats-numeriques',
    num: '03',
    href: '/projects/formats-numeriques/',
    name: 'Formats numériques',
    tagline: 'Communication multi-supports',
    title: 'Communication — Formats numériques',
    categories: 'CONTENU · DIGITAL',
    domain: 'Communication · Digital',
    description:
      'Décliner un message sur différents supports numériques en conciliant lisibilité, cohérence éditoriale et impact visuel.',
    visualDirection: 'Composition éditoriale et aperçu de supports numériques.',
    context:
      'Adaptation d’une campagne éditoriale multi-supports (carrousels pédagogiques, formats courts et page dédiée).',
    approach: [
      'Découpage d’un sujet complexe en séquences narratives courtes, structurées autour d’une grille modulaire constante.',
      'Création de gabarits éditoriaux garantissant une reconnaissance visuelle immédiate d’un format à l’autre.',
      'Optimisation des contrastes typographiques et du rythme de lecture pour les écrans mobiles et ordinateurs.',
    ],
    deliverables: ['Série de carrousels éditoriaux', 'Gabarits réseaux sociaux', 'Landing page éditoriale responsive'],
    images: [
      null,
      {
        src: '/post_instagram.jpg',
        alt: 'Publication Instagram de Nike sur la promotion de sa nouvelle basket.',
      },
      {
        src: '/post_x.jpg',
        alt: 'Publication Nike sur X présentant le défi de course Vaporfly A274.',
      },
      {
        src: '/landing_page.png',
        alt: 'Landing page éditoriale responsive de Cookit-up.',
      },
    ],
  },
];

export const getProject = (id) => projects.find((p) => p.id === id);
