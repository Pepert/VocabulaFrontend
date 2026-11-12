import type en from './en';

/** French. Must stay in sync with en.ts (typed against it). */
const fr: typeof en = {
  common: {
    home: 'Accueil',
  },
  signin: {
    tagline: 'Votre histoire, écrite avec les mots que vous apprenez.',
    signin: 'Se connecter',
    signinFailed: 'Échec de la connexion : {{error}}',
    unknownError: 'Erreur inconnue',
  },
  home: {
    title: 'Votre histoire',
    emptyTitle: 'Une histoire vous attend 📖',
    emptyText:
      'Photographiez une page de votre carnet, et le premier chapitre de votre histoire s’écrit tout seul avec les mots que vous apprenez.',
    chapter: 'Chapitre {{count}}',
    oneChapter: 'Un chapitre écrit jusque-là. De nouvelles pages font avancer l’histoire.',
    manyChapters:
      '{{count}} chapitres écrits jusque-là. De nouvelles pages font avancer l’histoire.',
    addResources: 'Ajouter des ressources',
    chapters: 'Chapitres',
    settings: 'Réglages',
    signOut: 'Se déconnecter',
    loadError: 'Impossible de charger vos chapitres : {{error}}',
  },
  capture: {
    title: 'Ajouter du matériel',
    description:
      'Photographiez une page de votre carnet ; le prochain chapitre de votre histoire utilise ce qu’il y trouve.',
    takePhoto: 'Prendre une photo',
    chooseFromLibrary: 'Choisir dans la photothèque',
    cameraPermission:
      'L’accès à la caméra est nécessaire pour photographier votre matériel. Vous pouvez l’activer dans Réglages → Confidentialité et sécurité → Caméra.',
    preparingOne: 'Préparation de la photo…',
    preparingMany: 'Préparation de {{count}} photos…',
    readingOne: 'Lecture de votre carnet…',
    writing: 'Écriture de votre prochain chapitre…',
    opening: 'Ouverture de votre chapitre…',
    errorTitle: 'Une erreur est survenue',
    tryAgain: 'Réessayer',
  },
  chapters: {
    title: 'Vos chapitres',
    empty:
      'Aucun chapitre pour l’instant. Ajoutez du matériel depuis l’accueil pour écrire le premier.',
  },
  chapter: {
    back: '‹ Chapitres',
    pill: 'Chapitre {{number}}',
    notFound: 'Chapitre {{number}} introuvable.',
    close: 'Fermer',
    noDefinition: 'Aucune définition disponible pour le moment — elle apparaîtra peut-être plus tard.',
  },
  settings: {
    title: 'Réglages',
    general: 'Général',
    language: 'Langue',
    languageEnglish: 'English',
    languageFrench: 'Français',
    languageHint: 'S’applique à toute l’application, sur tous vos appareils.',
  },
};

export default fr;
