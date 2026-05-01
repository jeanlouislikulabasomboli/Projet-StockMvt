// ============================================================================
// MODULE TRADUCTION (i18n) — StockMvt
// ============================================================================
// Ce module gère le chargement des fichiers JSON de traduction
// et l'application des textes traduits dans toute l'interface.
// Aucun attribut data-* n'est utilisé pour la traduction.
// Toutes les variables, fonctions et constantes sont en français.
// ============================================================================

// ==================== CONSTANTES ====================
const CLE_LANGUE_STOCKAGE = 'smv_langue';
const LANGUE_PAR_DEFAUT = 'fr';
const LANGUES_DISPONIBLES = ['fr', 'en', 'hi', 'ln', 'sw'];

// ==================== ÉTAT ====================
let langueActuelle = LANGUE_PAR_DEFAUT;
let traductionsChargees = {};
let traductionPrete = false;

// ==================== NOMS DES LANGUES (affichage natif) ====================
const nomsLanguesNatifs = {
    fr: 'Français',
    en: 'English',
    hi: 'हिन्दी',
    ln: 'Lingala',
    sw: 'Swahili'
};

const emojisLangues = {
    fr: '🇫🇷',
    en: '🇬🇧',
    hi: '🇮🇳',
    ln: '🇨🇩',
    sw: '🇨🇩'
};

// ==================== CHARGEMENT ====================

/**
 * Charge un fichier JSON de traduction pour une langue donnée.
 * Met en cache le résultat pour éviter les rechargements.
 */
async function chargerFichierTraduction(codeLang) {
    if (traductionsChargees[codeLang]) {
        return traductionsChargees[codeLang];
    }

    try {
        const reponse = await fetch(`lang/${codeLang}.json`);
        if (!reponse.ok) {
            console.error(`Erreur chargement traduction ${codeLang} : ${reponse.status}`);
            return null;
        }
        const donnees = await reponse.json();
        traductionsChargees[codeLang] = donnees;
        return donnees;
    } catch (erreur) {
        console.error(`Erreur chargement fichier lang/${codeLang}.json :`, erreur);
        return null;
    }
}

/**
 * Initialise le système de traduction.
 * Lit la langue sauvegardée, charge le fichier, applique les textes.
 */
async function initialiserTraduction() {
    // Lire la langue sauvegardée
    const langueSauvegardee = localStorage.getItem(CLE_LANGUE_STOCKAGE);
    if (langueSauvegardee && LANGUES_DISPONIBLES.includes(langueSauvegardee)) {
        langueActuelle = langueSauvegardee;
    }

    // Charger la langue par défaut (français) en premier comme fallback
    await chargerFichierTraduction(LANGUE_PAR_DEFAUT);

    // Charger la langue active si différente du français
    if (langueActuelle !== LANGUE_PAR_DEFAUT) {
        await chargerFichierTraduction(langueActuelle);
    }

    traductionPrete = true;

    // Appliquer les traductions à l'interface
    appliquerTraductionsInterface();

    console.log('Traduction initialisée — Langue :', langueActuelle);
}

// ==================== ACCÈS AUX TRADUCTIONS ====================

/**
 * Récupère une traduction par son chemin (ex: "ecranAccueil.bonjour").
 * Supporte les variables de remplacement {variable}.
 * Fallback sur le français si la clé n'existe pas dans la langue active.
 */
function t(chemin, variables) {
    let valeur = obtenirValeurTraduction(chemin, langueActuelle);

    // Fallback sur le français
    if (valeur === null || valeur === undefined) {
        valeur = obtenirValeurTraduction(chemin, LANGUE_PAR_DEFAUT);
    }

    // Si toujours pas trouvé, retourner le chemin comme indicateur
    if (valeur === null || valeur === undefined) {
        console.warn('Traduction manquante :', chemin);
        return `[${chemin}]`;
    }

    // Remplacement des variables
    if (variables && typeof valeur === 'string') {
        Object.keys(variables).forEach(cle => {
            valeur = valeur.replace(new RegExp(`\\{${cle}\\}`, 'g'), variables[cle]);
        });
    }

    return valeur;
}

/**
 * Accède à une valeur imbriquée dans un objet via un chemin pointé.
 */
function obtenirValeurTraduction(chemin, codeLang) {
    const donnees = traductionsChargees[codeLang];
    if (!donnees) return null;

    const parties = chemin.split('.');
    let courant = donnees;

    for (let i = 0; i < parties.length; i++) {
        if (courant === null || courant === undefined) return null;
        courant = courant[parties[i]];
    }

    return courant;
}

/**
 * Raccourci pour accéder aux messages (messages.xxx)
 */
function tm(cleMesage, variables) {
    return t('messages.' + cleMesage, variables);
}

// ==================== CHANGEMENT DE LANGUE ====================

/**
 * Change la langue de l'application.
 * Charge le fichier si nécessaire, sauvegarde le choix, ré-applique les traductions.
 */
async function changerLangue(nouvelleLang) {
    if (!LANGUES_DISPONIBLES.includes(nouvelleLang)) {
        console.error('Langue non disponible :', nouvelleLang);
        return;
    }

    // Charger si pas encore en cache
    const donnees = await chargerFichierTraduction(nouvelleLang);
    if (!donnees) {
        console.error('Impossible de charger la langue :', nouvelleLang);
        return;
    }

    langueActuelle = nouvelleLang;
    localStorage.setItem(CLE_LANGUE_STOCKAGE, nouvelleLang);

    // Ré-appliquer toute l'interface
    appliquerTraductionsInterface();

    console.log('Langue changée :', nouvelleLang);
}

/**
 * Retourne le code de la langue actuelle.
 */
function obtenirLangueActuelle() {
    return langueActuelle;
}

/**
 * Retourne le nom natif de la langue actuelle (ex: "Français").
 */
function obtenirNomLangueActuelle() {
    return nomsLanguesNatifs[langueActuelle] || langueActuelle;
}

// ==================== APPLICATION DES TRADUCTIONS À L'INTERFACE ====================

/**
 * Fonction principale qui parcourt TOUT le DOM et applique les traductions.
 * Appelée au chargement et à chaque changement de langue.
 */
function appliquerTraductionsInterface() {
    if (!traductionPrete) return;

    traduireEcranLangue();
    traduireEcranMode();
    traduireEcranOnboarding();
    traduireEcranAuth();
    traduireEcranChoixEntreprise();
    traduireEcranCreerEntreprise();
    traduireEcranAccueil();
    traduireEcranProduits();
    traduireEcranDetailsProduit();
    traduireEcranAjoutProduit();
    traduireEcranHistorique();
    traduireEcranRapports();
    traduireEcranApercuRapport();
    traduireEcranMenu();
    traduireEcranEntreprise();
    traduireEcranNotifications();
    traduireNavigation();
    traduireModalMouvement();
    traduireModaleCategorie();
    traduireFeuilleCodeBarres();
    traduireFiltresProduits();
    traduirePeriodesHistorique();
    traduirePeriodesRapport();
    traduireInvitationEntreprise();
    traduireProfilMembre();
    traduireQrCode();
    traduireScannerQr();
    traduireLecteurCodeBarres();
    traduirePhotoProduit();
    traduireExportPdf();

    // Mettre à jour l'indicateur de langue dans le menu
    mettreAJourIndicateurLangueMenu();
}

// ==================== TRADUCTION PAR ÉCRAN ====================

function traduireEcranLangue() {
    // Le titre "StockMvt" reste inchangé (nom de l'app)
    // Les noms de langues dans les boutons restent en langue native (ne pas traduire)
}

function traduireEcranMode() {
    definirTexte('#ecran-mode .mode-titre', t('ecranMode.titre'));
    definirTexte('#ecran-mode .mode-soustitre', t('ecranMode.sousTitre'));

    const boutonsModes = document.querySelectorAll('#ecran-mode .mode-btn');
    if (boutonsModes.length >= 3) {
        definirTexte(boutonsModes[0].querySelector('.mode-btn-titre'), t('ecranMode.systeme'));
        definirTexte(boutonsModes[0].querySelector('.mode-btn-desc'), t('ecranMode.systemeDesc'));
        definirTexte(boutonsModes[1].querySelector('.mode-btn-titre'), t('ecranMode.clair'));
        definirTexte(boutonsModes[1].querySelector('.mode-btn-desc'), t('ecranMode.clairDesc'));
        definirTexte(boutonsModes[2].querySelector('.mode-btn-titre'), t('ecranMode.sombre'));
        definirTexte(boutonsModes[2].querySelector('.mode-btn-desc'), t('ecranMode.sombreDesc'));
    }
}

function traduireEcranOnboarding() {
    const slides = document.querySelectorAll('#ecran-onboarding .onboarding-slide');
    if (slides.length >= 4) {
        definirTexte(slides[0].querySelector('.onboarding-titre'), t('ecranOnboarding.slide1Titre'));
        definirTexte(slides[0].querySelector('.onboarding-desc'), t('ecranOnboarding.slide1Desc'));
        definirTexte(slides[1].querySelector('.onboarding-titre'), t('ecranOnboarding.slide2Titre'));
        definirTexte(slides[1].querySelector('.onboarding-desc'), t('ecranOnboarding.slide2Desc'));
        definirTexte(slides[2].querySelector('.onboarding-titre'), t('ecranOnboarding.slide3Titre'));
        definirTexte(slides[2].querySelector('.onboarding-desc'), t('ecranOnboarding.slide3Desc'));
        definirTexte(slides[3].querySelector('.onboarding-titre'), t('ecranOnboarding.slide4Titre'));
        definirTexte(slides[3].querySelector('.onboarding-desc'), t('ecranOnboarding.slide4Desc'));
    }

    const btnSuivant = document.getElementById('btn-onboarding-suivant');
    if (btnSuivant) {
        const slideActif = document.querySelector('.onboarding-slide.actif');
        const estDernier = slideActif && slideActif.dataset.slide === '3';
        btnSuivant.textContent = estDernier ? t('general.commencer') : t('general.suivant');
    }
}

function traduireEcranAuth() {
    definirTexte('#ecran-auth .auth-titre', t('ecranAuth.titre'));
    definirTexte('#ecran-auth .auth-desc', t('ecranAuth.description'));

    const btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) {
        // Préserver le SVG Google, ne changer que le texte
        const svg = btnGoogle.querySelector('svg');
        const texteActuel = btnGoogle.textContent.trim();
        if (svg) {
            // Reconstruire : SVG + nouveau texte
            btnGoogle.innerHTML = '';
            btnGoogle.appendChild(svg);
            btnGoogle.appendChild(document.createTextNode('\n                ' + t('ecranAuth.btnGoogle')));
        }
    }
}

function traduireEcranChoixEntreprise() {
    definirTexte('.choix-entreprise-badge', t('ecranChoixEntreprise.badge'));
    definirTexte('.choix-entreprise-title', t('ecranChoixEntreprise.titre'));
    definirTexte('.choix-entreprise-subtitle', t('ecranChoixEntreprise.sousTitre'));

    const btnCreer = document.getElementById('btn-creer-entreprise');
    if (btnCreer) {
        definirTexte(btnCreer.querySelector('.choix-entreprise-action-title'), t('ecranChoixEntreprise.creer'));
        definirTexte(btnCreer.querySelector('.choix-entreprise-action-text'), t('ecranChoixEntreprise.creerDesc'));
    }

    const btnRejoindre = document.getElementById('btn-rejoindre-entreprise');
    if (btnRejoindre) {
        definirTexte(btnRejoindre.querySelector('.choix-entreprise-action-title'), t('ecranChoixEntreprise.rejoindre'));
        definirTexte(btnRejoindre.querySelector('.choix-entreprise-action-text'), t('ecranChoixEntreprise.rejoindreDesc'));
    }

    definirTexte('.choix-entreprise-section-title', t('ecranChoixEntreprise.vosEntreprises'));

    const btnContinuer = document.getElementById('btn-choix-entreprise-continuer');
    if (btnContinuer) btnContinuer.textContent = t('ecranChoixEntreprise.continuer');
}

function traduireEcranCreerEntreprise() {
    // Les titres dynamiques sont gérés dans les fonctions JS
    // Mais on traduit les labels statiques
    const labelsCreer = document.querySelectorAll('#ecran-creer-entreprise .formulaire-label');
    if (labelsCreer.length >= 4) {
        labelsCreer[0].textContent = t('ecranCreerEntreprise.labelLogo');
        labelsCreer[1].textContent = t('ecranCreerEntreprise.labelNom');
        labelsCreer[2].textContent = t('ecranCreerEntreprise.labelDescription');
        labelsCreer[3].textContent = t('ecranCreerEntreprise.labelDevise');
    }
    if (labelsCreer.length >= 5) {
        labelsCreer[4].textContent = t('ecranCreerEntreprise.labelTheme');
    }

    definirAttribut('#input-nom-entreprise', 'placeholder', t('ecranCreerEntreprise.placeholderNom'));
    definirAttribut('#input-description', 'placeholder', t('ecranCreerEntreprise.placeholderDescription'));
    definirAttribut('#input-devise', 'placeholder', t('ecranCreerEntreprise.placeholderDevise'));

    const placeholderLogo = document.querySelector('#logo-upload-placeholder .logo-upload-texte');
    if (placeholderLogo) placeholderLogo.textContent = t('ecranCreerEntreprise.logoAjouter');
}

function traduireEcranAccueil() {
    definirTexte('.accueil-bienvenue-texte', t('ecranAccueil.sousTitre'));

    const statLabels = document.querySelectorAll('#ecran-accueil .stat-label');
    if (statLabels.length >= 4) {
        statLabels[0].textContent = t('ecranAccueil.enStock');
        statLabels[1].textContent = t('ecranAccueil.stockFaible');
        statLabels[2].textContent = t('ecranAccueil.rupture');
        statLabels[3].textContent = t('ecranAccueil.valeurTotale');
    }

    definirTexte('.section-titre', t('ecranAccueil.mouvementsRecents'));
}

function traduireEcranProduits() {
    definirAttribut('#ecran-produits .recherche-input', 'placeholder', t('ecranProduits.placeholderRecherche'));

    const onglets = document.querySelectorAll('#ecran-produits .onglet-btn');
    const nomsOnglets = [
        t('ecranProduits.tous'),
        t('ecranProduits.nul'),
        t('ecranProduits.faible'),
        t('ecranProduits.normal'),
        t('ecranProduits.eleve')
    ];
    onglets.forEach((onglet, i) => {
        if (nomsOnglets[i]) {
            const nombre = onglet.querySelector('.onglet-nombre');
            const nb = nombre ? nombre.textContent : '0';
            onglet.innerHTML = `${nomsOnglets[i]} <span class="onglet-nombre">${nb}</span>`;
        }
    });
}

function traduireEcranDetailsProduit() {
    definirTexte('#ecran-details-produit .entete-titre', t('ecranDetailsProduit.titre'));

    const actionBtns = document.querySelectorAll('#ecran-details-produit .details-actions .action-btn span');
    if (actionBtns.length >= 3) {
        actionBtns[0].textContent = t('ecranDetailsProduit.entree');
        actionBtns[1].textContent = t('ecranDetailsProduit.sortie');
        actionBtns[2].textContent = t('ecranDetailsProduit.inventaire');
    }
}

function traduireEcranAjoutProduit() {
    // Les labels et placeholders
    const labels = document.querySelectorAll('#ecran-ajout-produit .ajout-champ-label');
    // L'ordre des labels dans le formulaire :
    // 0: Nom du produit, 1: Code produit, 2: Aperçu étiquette, 3: Catégorie,
    // 4: Emplacements, 5: Quantité totale, 6: Quantité min, 7: Quantité max,
    // 8: Prix achat, 9: Prix vente, 10: Notes

    const correspondancesLabels = {
        0: t('ecranAjoutProduit.nomProduit'),
        1: t('ecranAjoutProduit.codeProduit'),
        2: t('ecranAjoutProduit.apercuEtiquette'),
        3: t('ecranAjoutProduit.categorie'),
        4: t('ecranAjoutProduit.emplacementsQuantites'),
        5: t('ecranAjoutProduit.quantiteTotale')
    };

    labels.forEach((label, i) => {
        if (correspondancesLabels[i]) {
            label.textContent = correspondancesLabels[i];
        }
    });

    // Labels dans les ajout-ligne (Qté min, Qté max, Prix achat, Prix vente)
    const lignes = document.querySelectorAll('#ecran-ajout-produit .ajout-ligne .ajout-champ-label');
    if (lignes.length >= 4) {
        lignes[0].textContent = t('ecranAjoutProduit.quantiteMin');
        lignes[1].textContent = t('ecranAjoutProduit.quantiteMax');
        lignes[2].textContent = t('ecranAjoutProduit.prixAchatUnit');
        lignes[3].textContent = t('ecranAjoutProduit.prixVenteUnit');
    }

    // Section prix
    const prixLabels = document.querySelectorAll('#ecran-ajout-produit .ajout-prix-label');
    if (prixLabels.length >= 4) {
        prixLabels[0].textContent = t('ecranAjoutProduit.valeurTotaleAchat');
        prixLabels[1].textContent = t('ecranAjoutProduit.valeurTotaleVente');
        prixLabels[2].textContent = t('ecranAjoutProduit.beneficePotentiel');
        prixLabels[3].textContent = t('ecranAjoutProduit.margeBeneficiaire');
    }

    // Dernier label "Notes"
    const dernierLabel = document.querySelector('#ecran-ajout-produit .ajout-formulaire > .ajout-champ:last-of-type .ajout-champ-label');
    if (dernierLabel) dernierLabel.textContent = t('ecranAjoutProduit.notesLabel');

    // Placeholders
    definirAttribut('#ecran-ajout-produit .ajout-champ:nth-child(1) .ajout-input', 'placeholder', t('ecranAjoutProduit.placeholderNom'));
    definirAttribut('#input-code-produit-codeProduit', 'placeholder', t('ecranAjoutProduit.placeholderCode'));
    definirAttribut('#ecran-ajout-produit .ajout-formulaire textarea', 'placeholder', t('ecranAjoutProduit.placeholderNotes'));

    // Texte sélecteur catégorie
    const texteCategorie = document.getElementById('texte-categorie');
    if (texteCategorie && !texteCategorie.classList.contains('selectionne')) {
        texteCategorie.textContent = t('ecranAjoutProduit.selectionnerCategorie');
    }

    definirAttribut('#recherche-categorie', 'placeholder', t('ecranAjoutProduit.rechercherCategorie'));

    // Bouton ajouter catégorie
    const btnAjouterCat = document.querySelector('#btn-ajouter-categorie span');
    if (btnAjouterCat) btnAjouterCat.textContent = t('ecranAjoutProduit.ajouterCategorie');

    // Bouton ajouter emplacement
    const btnAjouterEmp = document.querySelector('#btn-ajouter-emplacement span');
    if (btnAjouterEmp) btnAjouterEmp.textContent = t('ecranAjoutProduit.ajouterEmplacement');

    // Unité
    const qteTotaleUnite = document.querySelector('.quantite-totale-unite');
    if (qteTotaleUnite) qteTotaleUnite.textContent = t('general.unite');

    // Bouton enregistrer
    const btnEnregistrer = document.querySelector('#ecran-ajout-produit .ajout-enregistrer-btn');
    if (btnEnregistrer && !modeModifierProduit) {
        btnEnregistrer.textContent = t('ecranAjoutProduit.enregistrerProduit');
    }

    // Zone image
    const texteZoneImage = document.querySelector('#contenu-ajout-image-photo-produit span');
    if (texteZoneImage) texteZoneImage.textContent = t('ecranAjoutProduit.prendrePhoto');
}

function traduireEcranHistorique() {
    definirTexte('#ecran-historique .historique-titre', t('ecranHistorique.titre'));

    const filtres = document.querySelectorAll('#ecran-historique .filtre-btn');
    const nomsFiltres = [
        t('ecranHistorique.tous'),
        t('ecranHistorique.entrees'),
        t('ecranHistorique.sorties'),
        t('ecranHistorique.inventaires')
    ];
    filtres.forEach((filtre, i) => {
        if (nomsFiltres[i]) {
            const span = filtre.querySelector('span');
            const nb = span ? span.textContent : '0';
            filtre.innerHTML = `${nomsFiltres[i]} <span>${nb}</span>`;
        }
    });

    definirTexte('#ecran-historique .date-select span', t('ecranHistorique.cetteSemaine'));
}

function traduireEcranRapports() {
    definirTexte('#ecran-rapports .rapports-titre', t('ecranRapports.titre'));

    const sectionTitres = document.querySelectorAll('#ecran-rapports .rapport-section-titre');
    if (sectionTitres.length >= 2) {
        sectionTitres[0].textContent = t('ecranRapports.rapportsActualite');
        sectionTitres[1].textContent = t('ecranRapports.rapportsBudgetaires');
    }

    // Noms des rapports
    const cartes = document.querySelectorAll('#ecran-rapports .rapport-carte');
    const nomsRapports = {
        'global': t('ecranRapports.etatGlobal'),
        'normal': t('ecranRapports.stockNormal'),
        'faible': t('ecranRapports.stockFaible'),
        'nul': t('ecranRapports.stockNul'),
        'eleve': t('ecranRapports.stockEleve'),
        'achats': t('ecranRapports.achats'),
        'ventes': t('ecranRapports.ventes'),
        'pertes': t('ecranRapports.pertes'),
        'finance': t('ecranRapports.rapportFinancier')
    };

    cartes.forEach(carte => {
        const type = carte.dataset.rapport;
        const nomEl = carte.querySelector('.rapport-nom');
        if (nomEl && nomsRapports[type]) {
            nomEl.textContent = nomsRapports[type];
        }
    });
}

function traduireEcranApercuRapport() {
    // Traduit dynamiquement lors de l'ouverture — voir les fonctions modifiées dans app.js
    const texteChargement = document.querySelector('.texte-chargement-exporterRapportPDF');
    if (texteChargement) texteChargement.textContent = t('ecranApercuRapport.generationPdf');

    const sousTexteChargement = document.querySelector('.sous-texte-chargement-exporterRapportPDF');
    if (sousTexteChargement) sousTexteChargement.textContent = t('ecranApercuRapport.veuiliezPatienter');
}

function traduireEcranMenu() {
    // Sections
    const sectionTitres = document.querySelectorAll('#ecran-menu .menu-section-titre');
    const nomsSections = [
        t('ecranMenu.general'),
        t('ecranMenu.securite'),
        t('ecranMenu.donnees'),
        t('ecranMenu.support')
    ];
    sectionTitres.forEach((titre, i) => {
        if (nomsSections[i]) titre.textContent = nomsSections[i];
    });

    // Items de menu
    const items = document.querySelectorAll('#ecran-menu .menu-item .menu-item-texte');
    const nomsItems = [
        t('ecranMenu.entreprise'),
        t('ecranMenu.langue'),
        t('ecranMenu.modeSombre'),
        t('ecranMenu.codePin'),
        t('ecranMenu.verrouBiometrique'),
        t('ecranMenu.questionSecurite'),
        t('ecranMenu.sauvegarder'),
        t('ecranMenu.restaurer'),
        t('ecranMenu.cloud'),
        t('ecranMenu.aideSupport'),
        t('ecranMenu.evaluerApp'),
        t('ecranMenu.seDeconnecter'),
        t('ecranMenu.supprimerCompte')
    ];
    items.forEach((item, i) => {
        if (nomsItems[i]) item.textContent = nomsItems[i];
    });

    // Version
    definirTexte('#ecran-menu .menu-version', t('general.version'));
}

function traduireEcranEntreprise() {
    definirTexte('#ecran-entreprise .entete-titre', t('ecranEntreprise.titre'));

    const titreEquipe = document.querySelector('.titre-utilisateurs-entreprise span:not(.compteur-utilisateurs-entreprise)');
    if (titreEquipe) titreEquipe.textContent = t('ecranEntreprise.equipe');

    const btnInviter = document.getElementById('btn-ajouter-utilisateur-entreprise');
    if (btnInviter) {
        // Préserver le SVG
        const svg = btnInviter.querySelector('svg');
        if (svg) {
            btnInviter.innerHTML = '';
            btnInviter.appendChild(svg);
            btnInviter.appendChild(document.createTextNode('\n                        ' + t('ecranEntreprise.inviter')));
        }
    }

    definirTexte('.titre-zone-actions-entreprise', t('ecranEntreprise.parametres'));

    // Actions
    definirTexte('#action-verrouiller-entreprise .label-action-entreprise', t('ecranEntreprise.verrouillerEntreprise'));
    definirTexte('#action-verrouiller-entreprise .desc-action-entreprise', t('ecranEntreprise.verrouillerDesc'));

    definirTexte('#ouvrir-changer-entreprise .label-action-entreprise', t('ecranEntreprise.changerEntreprise'));
    definirTexte('#ouvrir-changer-entreprise .desc-action-entreprise', t('ecranEntreprise.changerDesc'));

    definirTexte('#btn-quitter-entreprise .label-action-entreprise', t('ecranEntreprise.quitterEntreprise'));
    definirTexte('#btn-quitter-entreprise .desc-action-entreprise', t('ecranEntreprise.quitterDesc'));
}

function traduireEcranNotifications() {
    definirTexte('#ecran-notifications .notifications-titre', t('ecranNotifications.titre'));
}

function traduireNavigation() {
    const navItems = document.querySelectorAll('#nav-principale .nav-item span');
    const nomsNav = [
        t('nav.accueil'),
        t('nav.produits'),
        t('nav.historique'),
        t('nav.rapports'),
        t('nav.menu')
    ];
    navItems.forEach((span, i) => {
        if (nomsNav[i]) span.textContent = nomsNav[i];
    });
}

function traduireModalMouvement() {
    // Les étapes
    const etapes = document.querySelectorAll('.etape-mouvement');
    if (etapes.length >= 3) {
        const texteEtapes = [
            t('modalMouvement.etapeMotif'),
            t('modalMouvement.etapeDetails'),
            t('modalMouvement.etapeConfirmer')
        ];
        etapes.forEach((etape, i) => {
            // Ne pas toucher au <span> numéro, changer le texte après
            const span = etape.querySelector('span');
            if (span && texteEtapes[i]) {
                // Le texte est après le span
                etape.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        node.textContent = texteEtapes[i];
                    }
                });
            }
        });
    }

    definirTexte('#section-motif-mouvement .label-mouvement', t('modalMouvement.pourquoi'));
    definirTexte('#section-emplacement-mouvement .label-mouvement', t('modalMouvement.emplacementConcerne'));
    definirTexte('#section-resultat-mouvement .label-mouvement', t('modalMouvement.impactStock'));

    const etiquetteAvant = document.querySelectorAll('.resultat-etiquette-mouvement');
    if (etiquetteAvant.length >= 2) {
        etiquetteAvant[0].textContent = t('modalMouvement.avant');
        etiquetteAvant[1].textContent = t('modalMouvement.apres');
    }

    // Note
    const labelNote = document.querySelector('#section-note-mouvement .label-mouvement');
    if (labelNote) {
        labelNote.innerHTML = t('modalMouvement.noteOptionnel') + ' <span class="optionnel-mouvement">' + t('modalMouvement.optionnel') + '</span>';
    }

    definirAttribut('#textarea-note-mouvement', 'placeholder', t('modalMouvement.placeholderNote'));
}

function traduireModaleCategorie() {
    definirTexte('#modale-categorie .modale-titre', t('modaleCategorie.titre'));
    definirAttribut('#input-nouvelle-categorie', 'placeholder', t('modaleCategorie.placeholder'));
    definirTexte('#btn-annuler-categorie', t('modaleCategorie.annuler'));
    definirTexte('#btn-confirmer-categorie', t('modaleCategorie.ajouter'));
}

function traduireFeuilleCodeBarres() {
    definirTexte('.feuille-titre-codeProduit', t('codeBarres.titre'));
    definirTexte('.feuille-soustitre-codeProduit', t('codeBarres.sousTitre'));

    // Les descriptions et exemples de chaque type
    const options = document.querySelectorAll('.feuille-option-codeProduit');
    const traductionsCB = {
        'EAN13': { desc: t('codeBarres.ean13Desc'), exemple: t('codeBarres.ean13Exemple') },
        'EAN8': { desc: t('codeBarres.ean8Desc'), exemple: t('codeBarres.ean8Exemple') },
        'UPC': { desc: t('codeBarres.upcDesc'), exemple: t('codeBarres.upcExemple') },
        'CODE128': { desc: t('codeBarres.code128Desc'), exemple: t('codeBarres.code128Exemple') },
        'CODE39': { desc: t('codeBarres.code39Desc'), exemple: t('codeBarres.code39Exemple') },
        'ITF14': { desc: t('codeBarres.itf14Desc'), exemple: t('codeBarres.itf14Exemple') },
        'MSI': { desc: t('codeBarres.msiDesc'), exemple: t('codeBarres.msiExemple') },
        'AUTO': { nom: t('codeBarres.autoNom'), desc: t('codeBarres.autoDesc'), exemple: t('codeBarres.autoExemple') }
    };

    options.forEach(option => {
        const format = option.dataset.formatCodeproduit;
        if (format && traductionsCB[format]) {
            const descEl = option.querySelector('.feuille-option-desc-codeProduit');
            const exEl = option.querySelector('.feuille-option-exemple-codeProduit');
            if (descEl) descEl.textContent = traductionsCB[format].desc;
            if (exEl) exEl.textContent = traductionsCB[format].exemple;
            if (traductionsCB[format].nom) {
                const nomEl = option.querySelector('.feuille-option-nom-codeProduit');
                if (nomEl) nomEl.textContent = traductionsCB[format].nom;
            }
        }
    });
}

function traduireFiltresProduits() {
    definirTexte('.titre-filtreProduits', t('filtresProduits.titre'));
    definirTexte('#btn-reinitialiser-filtreProduits', t('filtresProduits.reinitialiser'));

    const labelsSection = document.querySelectorAll('.label-section-filtreProduits');
    const nomsLabels = [
        t('filtresProduits.modeAffichage'),
        t('filtresProduits.activite'),
        t('filtresProduits.quantiteStock'),
        t('filtresProduits.ordreAlpha'),
        t('filtresProduits.dateModification')
    ];
    labelsSection.forEach((label, i) => {
        if (nomsLabels[i]) label.textContent = nomsLabels[i];
    });

    // Textes des boutons d'options
    const optionsTraductions = {
        'affichage': {
            'sans-categorie': t('filtresProduits.listeSimple'),
            'avec-categorie': t('filtresProduits.parCategorie')
        },
        'activite': {
            'tous': t('filtresProduits.tous'),
            'actifs': t('filtresProduits.actifs'),
            'inactifs': t('filtresProduits.inactifs')
        },
        'quantite': {
            'aucun': t('filtresProduits.parDefaut'),
            'croissant': t('filtresProduits.basEleve'),
            'decroissant': t('filtresProduits.eleveBas')
        },
        'alpha': {
            'aucun': t('filtresProduits.parDefaut'),
            'a-z': t('filtresProduits.aZ'),
            'z-a': t('filtresProduits.zA')
        },
        'date': {
            'recents': t('filtresProduits.recentsDabord'),
            'anciens': t('filtresProduits.anciensDabord')
        }
    };

    document.querySelectorAll('.option-filtreProduits').forEach(option => {
        const groupe = option.dataset.filtreProduits;
        const valeur = option.dataset.valeurFiltreproduits;
        const span = option.querySelector('span');
        if (span && optionsTraductions[groupe] && optionsTraductions[groupe][valeur]) {
            span.textContent = optionsTraductions[groupe][valeur];
        }
    });

    const btnAppliquer = document.querySelector('#btn-appliquer-filtreProduits span');
    if (btnAppliquer) btnAppliquer.textContent = t('filtresProduits.appliquerFiltres');
}

function traduirePeriodesHistorique() {
    definirTexte('.titre-feuille-periode-historique', t('periodes.titre'));

    const options = document.querySelectorAll('.option-periode-historique');
    const traductionsPeriodes = {
        'aujourdhui': { nom: t('periodes.aujourdhui'), desc: t('periodes.aujourdhuiDescHistorique') },
        'cette-semaine': { nom: t('periodes.cetteSemaine'), desc: t('periodes.cetteSemaineDesc') },
        'ce-mois': { nom: t('periodes.ceMois'), desc: t('periodes.ceMoisDesc') },
        'cette-annee': { nom: t('periodes.cetteAnnee'), desc: t('periodes.cetteAnneeDesc') },
        'periode': { nom: t('periodes.periode'), desc: t('periodes.periodeDesc') }
    };

    options.forEach(option => {
        const periode = option.dataset.periodeHistorique;
        if (periode && traductionsPeriodes[periode]) {
            const nomEl = option.querySelector('.nom-periode-historique');
            const descEl = option.querySelector('.desc-periode-historique');
            if (nomEl) nomEl.textContent = traductionsPeriodes[periode].nom;
            if (descEl) descEl.textContent = traductionsPeriodes[periode].desc;
        }
    });

    definirTexte('.titre-dates-personnalisees-historique', t('periodes.periodePersonnalisee'));
    definirTexte('#ecran-historique .label-date-historique:first-of-type', t('periodes.dateDebut'));

    const labelsDateH = document.querySelectorAll('.label-date-historique');
    if (labelsDateH.length >= 2) {
        labelsDateH[0].textContent = t('periodes.dateDebut');
        labelsDateH[1].textContent = t('periodes.dateFin');
    }

    definirTexte('#btn-appliquer-dates-historique', t('general.appliquer'));
}

function traduirePeriodesRapport() {
    definirTexte('.titre-feuille-periode-rapport', t('periodes.titre'));

    const options = document.querySelectorAll('.option-periode-rapport');
    const traductionsPeriodes = {
        'aujourdhui': { nom: t('periodes.aujourdhui'), desc: t('periodes.aujourdhuiDescRapport') },
        'cette-semaine': { nom: t('periodes.cetteSemaine'), desc: t('periodes.cetteSemaineDesc') },
        'ce-mois': { nom: t('periodes.ceMois'), desc: t('periodes.ceMoisDesc') },
        'cette-annee': { nom: t('periodes.cetteAnnee'), desc: t('periodes.cetteAnneeDesc') },
        'periode': { nom: t('periodes.periode'), desc: t('periodes.periodeDesc') }
    };

    options.forEach(option => {
        const periode = option.dataset.periodeRapport;
        if (periode && traductionsPeriodes[periode]) {
            const nomEl = option.querySelector('.nom-periode-rapport');
            const descEl = option.querySelector('.desc-periode-rapport');
            if (nomEl) nomEl.textContent = traductionsPeriodes[periode].nom;
            if (descEl) descEl.textContent = traductionsPeriodes[periode].desc;
        }
    });

    definirTexte('.titre-dates-personnalisees-rapport', t('periodes.periodePersonnalisee'));

    const labelsDateR = document.querySelectorAll('.label-date-rapport');
    if (labelsDateR.length >= 2) {
        labelsDateR[0].textContent = t('periodes.dateDebut');
        labelsDateR[1].textContent = t('periodes.dateFin');
    }

    definirTexte('#btn-appliquer-dates-rapport', t('general.appliquer'));
}

function traduireInvitationEntreprise() {
    definirTexte('#panneau-invitation-entreprise .titre-panneau-entreprise', t('invitationEntreprise.inviterMembre'));
    definirTexte('#panneau-invitation-entreprise .sous-titre-panneau-entreprise', t('invitationEntreprise.selectionnerRole'));

    const cartes = document.querySelectorAll('#panneau-invitation-entreprise .carte-role-entreprise');
    const descriptionsRoles = {
        'administrateur': t('invitationEntreprise.administrateurDesc'),
        'editeur': t('invitationEntreprise.editeurDesc'),
        'coordinateur': t('invitationEntreprise.coordinateurDesc'),
        'auditeur': t('invitationEntreprise.auditeurDesc'),
        'operateur': t('invitationEntreprise.operateurDesc')
    };

    cartes.forEach(carte => {
        const role = carte.dataset.roleInvitationEntreprise;
        if (role) {
            const nomEl = carte.querySelector('.nom-role-entreprise');
            const descEl = carte.querySelector('.desc-role-entreprise');
            if (nomEl) nomEl.textContent = t(`roles.${role}.nom`);
            if (descEl && descriptionsRoles[role]) descEl.textContent = descriptionsRoles[role];
        }
    });
}

function traduireProfilMembre() {
    definirTexte('.label-roles-panneau-entreprise', t('profilMembre.role'));
    definirTexte('#description-role-panneau-entreprise', t('profilMembre.selectionnerRoleVoir'));

    const btnModifier = document.getElementById('btn-modifier-role-entreprise');
    if (btnModifier) {
        const svg = btnModifier.querySelector('svg');
        if (svg) {
            btnModifier.innerHTML = '';
            btnModifier.appendChild(svg);
            btnModifier.appendChild(document.createTextNode('\n                    ' + t('profilMembre.modifierRole')));
        }
    }

    const btnRetirer = document.getElementById('btn-retirer-membre-entreprise');
    if (btnRetirer) {
        const svg = btnRetirer.querySelector('svg');
        if (svg) {
            btnRetirer.innerHTML = '';
            btnRetirer.appendChild(svg);
            btnRetirer.appendChild(document.createTextNode('\n                    ' + t('profilMembre.retirerEquipe')));
        }
    }

    // Tags de rôles dans le panneau
    const tags = document.querySelectorAll('.tag-role-panneau-entreprise');
    const nomsCourtsTags = {
        'administrateur': t('roles.administrateur.nomCourt'),
        'editeur': t('roles.editeur.nomCourt'),
        'coordinateur': t('roles.coordinateur.nomCourt'),
        'auditeur': t('roles.auditeur.nomCourt'),
        'operateur': t('roles.operateur.nomCourt')
    };
    tags.forEach(tag => {
        const role = tag.dataset.tagRoleEntreprise;
        if (role && nomsCourtsTags[role]) {
            const svg = tag.querySelector('svg');
            if (svg) {
                tag.innerHTML = '';
                tag.appendChild(svg);
                tag.appendChild(document.createTextNode('\n                        ' + nomsCourtsTags[role]));
            }
        }
    });
}

function traduireQrCode() {
    const btnExporter = document.getElementById('btn-exporter-qr-entreprise');
    if (btnExporter) {
        const svg = btnExporter.querySelector('svg');
        if (svg) {
            btnExporter.innerHTML = '';
            btnExporter.appendChild(svg);
            btnExporter.appendChild(document.createTextNode('\n                ' + t('qrCode.exporter')));
        }
    }

    const instructions = document.querySelector('.instructions-qr-entreprise');
    if (instructions) {
        instructions.innerHTML = `<strong>${t('qrCode.commentUtiliser')}</strong>\n                ${t('qrCode.instructions')}`;
    }
}

function traduireScannerQr() {
    definirTexte('.scanner-qr-titre-entete', t('scannerQr.titre'));
    definirTexte('.scanner-qr-instruction', t('scannerQr.instruction'));
    definirTexte('.scanner-qr-sous-instruction', t('scannerQr.sousInstruction'));

    const labels = document.querySelectorAll('.scanner-qr-action-label');
    if (labels.length >= 2) {
        labels[0].textContent = t('scannerQr.galerie');
        labels[1].textContent = t('scannerQr.torche');
    }
}

function traduireLecteurCodeBarres() {
    definirTexte('.titre-lecteur-code-barres', t('lecteurCodeBarres.titre'));

    const indicationSpan = document.querySelector('#indication-lecteur-code-barres span');
    if (indicationSpan) indicationSpan.textContent = t('lecteurCodeBarres.placezCode');

    definirTexte('.resultat-label-lecteur-code-barres', t('lecteurCodeBarres.codeDetecteLabel'));

    const actionsLabels = document.querySelectorAll('.actions-lecteur-code-barres .btn-action-lecteur-code-barres span');
    if (actionsLabels.length >= 2) {
        actionsLabels[0].textContent = t('lecteurCodeBarres.torche');
        actionsLabels[1].textContent = t('lecteurCodeBarres.galerie');
    }
}

function traduirePhotoProduit() {
    const actionsCamera = document.querySelectorAll('.controles-camera-photo-produit .btn-action-camera-photo-produit span');
    if (actionsCamera.length >= 2) {
        actionsCamera[0].textContent = t('photoProduit.galerie');
        actionsCamera[1].textContent = t('photoProduit.torche');
    }

    definirTexte('#btn-annuler-validation-photo-produit span', t('photoProduit.reprendre'));
    definirTexte('#btn-confirmer-validation-photo-produit span', t('photoProduit.utiliserPhoto'));

    definirTexte('.titre-rognage-photo-produit h3', t('photoProduit.cadrerProduit'));
    definirTexte('.titre-rognage-photo-produit p', t('photoProduit.cadrerDesc'));

    definirTexte('#btn-reinitialiser-rognage-photo-produit span', t('photoProduit.reinitialiser'));
    definirTexte('#btn-valider-rognage-photo-produit span', t('photoProduit.validerCadrage'));
}

function traduireExportPdf() {
    definirTexte('.texte-chargement-exporterRapportPDF', t('ecranApercuRapport.generationPdf'));
    definirTexte('.sous-texte-chargement-exporterRapportPDF', t('ecranApercuRapport.veuiliezPatienter'));
}

// ==================== INDICATEUR LANGUE DANS LE MENU ====================

function mettreAJourIndicateurLangueMenu() {
    const menuLangue = document.getElementById('menu-langue');
    if (!menuLangue) return;

    const indicateurSpan = menuLangue.querySelector('.menu-item-droite span:first-child');
    if (indicateurSpan) {
        indicateurSpan.textContent = obtenirNomLangueActuelle();
    }
}

// ==================== BOTTOM SHEET LANGUE (depuis le menu) ====================

let feuilleLangueCreee = false;

function ouvrirFeuilleLangue() {
    // Créer le bottom sheet s'il n'existe pas encore
    if (!feuilleLangueCreee) {
        creerFeuilleLangue();
    }

    const superposition = document.getElementById('superposition-feuille-langue');
    if (superposition) {
        superposition.classList.add('visible-feuille-langue');
    }
}

function fermerFeuilleLangue() {
    const superposition = document.getElementById('superposition-feuille-langue');
    if (superposition) {
        superposition.classList.remove('visible-feuille-langue');
    }
}

function creerFeuilleLangue() {
    // Créer la superposition et la feuille
    const superposition = document.createElement('div');
    superposition.className = 'superposition-feuille-langue';
    superposition.id = 'superposition-feuille-langue';

    const feuille = document.createElement('div');
    feuille.className = 'feuille-langue-menu';
    feuille.id = 'feuille-langue-menu';

    // Poignée
    feuille.innerHTML = `
        <div class="poignee-feuille-langue"><span></span></div>
        <h3 class="titre-feuille-langue">${t('feuilleLangue.titre')}</h3>
        <div class="liste-langues-feuille">
            ${LANGUES_DISPONIBLES.map(codeLang => `
                <button class="option-langue-feuille ${codeLang === langueActuelle ? 'active-langue-feuille' : ''}" data-code-langue="${codeLang}">
                    <span class="emoji-langue-feuille">${emojisLangues[codeLang] || ''}</span>
                    <span class="nom-langue-feuille">${nomsLanguesNatifs[codeLang] || codeLang}</span>
                    <div class="coche-langue-feuille">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                        </svg>
                    </div>
                </button>
            `).join('')}
        </div>
    `;

    superposition.appendChild(feuille);
    document.body.appendChild(superposition);

    // Événements
    superposition.addEventListener('click', (e) => {
        if (e.target === superposition) {
            fermerFeuilleLangue();
        }
    });

    feuille.querySelectorAll('.option-langue-feuille').forEach(option => {
        option.addEventListener('click', async () => {
            const codeLang = option.dataset.codeLangue;
            if (!codeLang) return;

            // Changer la langue
            await changerLangue(codeLang);

            // Mettre à jour l'état visuel
            feuille.querySelectorAll('.option-langue-feuille').forEach(opt => {
                opt.classList.remove('active-langue-feuille');
            });
            option.classList.add('active-langue-feuille');

            // Mettre à jour le titre de la feuille
            definirTexte('.titre-feuille-langue', t('feuilleLangue.titre'));

            // Fermer après un court délai
            setTimeout(() => {
                fermerFeuilleLangue();
            }, 300);
        });
    });

    feuilleLangueCreee = true;
}

// ==================== UTILITAIRES DOM ====================

/**
 * Définit le texte d'un élément trouvé par sélecteur CSS.
 * Ne fait rien si l'élément n'existe pas.
 */
function definirTexte(selecteurOuElement, texte) {
    if (!texte) return;

    let element;
    if (typeof selecteurOuElement === 'string') {
        element = document.querySelector(selecteurOuElement);
    } else {
        element = selecteurOuElement;
    }

    if (element) {
        element.textContent = texte;
    }
}

/**
 * Définit un attribut d'un élément trouvé par sélecteur CSS.
 */
function definirAttribut(selecteur, attribut, valeur) {
    if (!valeur) return;
    const element = document.querySelector(selecteur);
    if (element) {
        element.setAttribute(attribut, valeur);
    }
}
