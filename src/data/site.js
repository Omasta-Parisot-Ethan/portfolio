/**
 * EOP. — Réglages du site (coordonnées, CV, mode brouillon)
 * Seul fichier à modifier pour renseigner vos informations réelles
 * sur les nouvelles pages (/contact/, /parcours/, études de cas).
 *
 * ⚠ Rien n'est inventé : tant qu'une valeur est `null`, la page affiche
 * un emplacement « À compléter » (si showPlaceholders est à true)
 * ou masque simplement l'élément (si showPlaceholders est à false).
 */
export const site = {
  // Passez à false avant mise en ligne pour masquer tous les emplacements « À compléter »
  showPlaceholders: true,

  // Adresse e-mail de contact
  email: '0ethanparisot@gmail.com',
  emailIsPlaceholder: false,

  // Profil LinkedIn
  linkedin: 'https://www.linkedin.com/in/ethan-omasta-parisot-215253337',

  // Chemin du CV dans /public
  cv: '/CV_stage_2027_Assistant_Charge_de_Communication.pdf',
};
