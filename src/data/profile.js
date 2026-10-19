/**
 * EOP. — Contenu de la page /parcours/
 * Les textes sont repris du portfolio existant (About, Skills, Method, README).
 * Aucun niveau de maîtrise, certification ou expérience n'est ajouté.
 */
export const steps = [
  { num: '01', title: 'Comprendre', tag: 'DIAGNOSTIC & ÉCOUTE', text: 'Identifier le besoin, le contexte, les contraintes et les attentes du public.' },
  { num: '02', title: 'Structurer', tag: 'ARCHITECTURE & SENS', text: 'Organiser les informations, hiérarchiser les priorités et définir une direction.' },
  { num: '03', title: 'Concevoir', tag: 'CRÉATION & FORME', text: 'Transformer la stratégie en propositions visuelles, éditoriales ou numériques.' },
  { num: '04', title: 'Ajuster', tag: 'ITÉRATION & JUSTESSE', text: 'Tester, recueillir les retours et améliorer la réponse finale.' },
];

export const values = [
  { num: '01', name: 'Rigueur.', text: 'Chaque prise de parole repose sur une analyse vérifiée du contexte, du public et des objectifs.' },
  { num: '02', name: 'Fiabilité.', text: 'Respect des délais, cohérence des livrables et clarté dans le suivi de chaque étape du projet.' },
  { num: '03', name: 'Organisation.', text: 'Structuration méthodique des idées, des ressources éditoriales et des systèmes graphiques.' },
  { num: '04', name: 'Efficacité.', text: 'Aller à l’essentiel pour que le message soit compris rapidement et retienne l’attention.' },
  { num: '05', name: 'Adaptabilité.', text: 'Ajuster le ton, le format et la direction visuelle selon les contraintes et les supports.' },
  { num: '06', name: 'Créativité maîtrisée.', text: 'Oser des partis pris graphiques et éditoriaux forts, toujours au service du sens.' },
];

export const skillCategories = [
  {
    num: '01',
    title: 'Stratégie & communication',
    badge: 'ANALYSE & SENS',
    tone: 'bg-eop-offwhite',
    axes: [
      'Veille, diagnostic éditorial et analyse de positionnement',
      'Définition des publics cibles et des objectifs de communication',
      'Architecture de message, ton de voix et plan d’actions',
    ],
  },
  {
    num: '02',
    title: 'Création graphique',
    badge: 'SYSTÈME VISUEL',
    tone: 'bg-eop-light/60',
    axes: [
      'Systèmes d’identité visuelle, grilles et chartes graphiques',
      'Choix typographiques, palettes chromatiques et contrastes',
      'Déclinaisons print et numériques cohérentes',
      'Conception de visuels, mises en page et formats réseaux sociaux',
    ],
  },
  {
    num: '03',
    title: 'Conception numérique',
    badge: 'EXPÉRIENCE WEB',
    tone: 'bg-eop-rose/50',
    axes: [
      'Architecture de l’information, parcours utilisateur et maquettage UX/UI',
      'Intégration web soignée, responsive design et micro-interactions',
      'Attention portée à l’accessibilité et à la clarté de navigation',
    ],
  },
];

// Outils réellement utilisés dans ce portfolio (package.json / README)
export const portfolioTools = ['Astro', 'Tailwind CSS', 'HTML & CSS', 'JavaScript', 'Three.js'];
