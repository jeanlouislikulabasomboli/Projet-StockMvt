// ==================== SUPABASE ====================
const URL_SUPABASE = "https://sscfbqidwfzmwfycmpgu.supabase.co";
const CLE_PUBLIQUE_SUPABASE = "sb_publishable__gqk44RVJvob57geoVDvCw_jwPqFX0n";

const clientSupabase = supabase.createClient(URL_SUPABASE, CLE_PUBLIQUE_SUPABASE);

        // ==================== DONNÉES ====================
        const traductions = {
            fr: {
                titre: "StockMvt",
                bienvenue: "Bienvenue",
                continuer: "Continuer",
                suivant: "Suivant",
                creer: "Créer une entreprise",
                rejoindre: "Rejoindre une entreprise",
                valider: "Valider",
                enregistrer: "Enregistrer",
                annuler: "Annuler",
                accueil: "Accueil",
                produits: "Produits",
                historique: "Historique",
                rapports: "Rapports",
                menu: "Menu",
                enStock: "En stock",
                stockFaible: "Stock faible",
                rupture: "Rupture",
                surstock: "Surstock",
                entree: "Entrée",
                sortie: "Sortie",
                inventaire: "Inventaire",
                achats: "Achats",
                ventes: "Ventes",
                pertes: "Pertes",
                benefices: "Bénéfices"
            }
        };

         

         

         
        
        const donneesRolesEntreprise = {
            administrateur: {
                nom: "Administrateur",
                description: function(prenom) {
                    return `<strong>${prenom}</strong> dispose d'un accès complet : gestion des membres, paramètres système, autorisations et supervision de l'ensemble de l'activité.`;
                },
                actions: ["Tout gérer"]
            },
            editeur: {
                nom: "Éditeur",
                description: function(prenom) {
                    return `<strong>${prenom}</strong> peut créer, modifier et supprimer des produits, ainsi qu'enregistrer les entrées, sorties et inventaires.`;
                },
                actions: ["Créer", "Modifier", "Supprimer", "Entrée", "Sortie", "Inventaire"]
            },
            coordinateur: {
                nom: "Coordinateur",
                description: function(prenom) {
                    return `<strong>${prenom}</strong> supervise les flux de stock en enregistrant les entrées, sorties et en effectuant les corrections d'inventaire.`;
                },
                actions: ["Entrée", "Sortie", "Inventaire"]
            },
            auditeur: {
                nom: "Auditeur",
                description: function(prenom) {
                    return `<strong>${prenom}</strong> est habilité à vérifier les niveaux de stock et à appliquer les corrections nécessaires via l'inventaire.`;
                },
                actions: ["Inventaire"]
            },
            operateur: {
                nom: "Opérateur",
                description: function(prenom) {
                    return `<strong>${prenom}</strong> enregistre les mouvements de marchandises : réceptions en entrée et expéditions en sortie.`;
                },
                actions: ["Entrée", "Sortie"]
            }
        };

// ==================== SESSION / DONNÉES COURANTES ====================
let sessionActuelle = null;
let utilisateurActuel = null;
let profilActuel = null;
let entrepriseActuelle = null;
let entreprisesUtilisateur = [];
let logoEntrepriseFichier = null;
let logoEntreprisePreviewUrl = null;
let modeEditionEntreprise = false;
let logoEntrepriseUrlExistante = null;
let roleCourantMembreEntreprise = null;
let roleSelectionneMembreEntreprise = null;
let membreSelectionneEntreprise = null;
let instanceQrCodeEntreprise = null;
let scannerQrStream = null;
let scannerQrTorcheActive = false;
let scannerQrTrack = null;
let roleUtilisateurActuel = null;
let membresEntrepriseActuelle = [];
// ==================== MOUVEMENT — VARIABLES GLOBALES ====================
let typeMouvementActuel = "entree";
let motifSelectionne = null;
// Stock dynamique — sera alimenté par le produit sélectionné
let stockGlobalActuel = 0;
let produitActuelDetails = null; // Objet complet du produit affiché dans les détails
let emplacementSelectionneId = null; // ID de l'emplacement sélectionné dans le modal mouvement
let emplacementSelectionneQte = 0; // Quantité de l'emplacement sélectionné
 
// Données motifs mouvement
const donneeMotifsMouvement = {
    entree: [
        { id: "achat", nom: "Achat", desc: "Réception fournisseur", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="m16 10-4 4-4-4"/></svg>' },
        { id: "retour-client", nom: "Retour client", desc: "Article retourné", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>' },
        { id: "production", nom: "Production", desc: "Fabrication interne", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>' },
        { id: "autre-entree", nom: "Autre", desc: "Motif personnalisé", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>' }
    ],
    sortie: [
        { id: "vente", nom: "Vente", desc: "Commande client", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>' },
        { id: "retour-fournisseur", nom: "Retour fournisseur", desc: "Renvoi au fournisseur", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>' },
        { id: "usage-interne", nom: "Usage interne", desc: "Consommation interne", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
        { id: "casse", nom: "Casse", desc: "Produit endommagé", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
        { id: "autre-sortie", nom: "Autre", desc: "Motif personnalisé", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>' }
    ],
    inventaire: [
        { id: "permanent", nom: "Permanent", desc: "Contrôle en continu", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
        { id: "tournant", nom: "Tournant", desc: "Par catégorie / zone", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>' },
        { id: "annuel", nom: "Annuel", desc: "Bilan complet de fin d'année", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
        { id: "autre-inventaire", nom: "Autre", desc: "Motif personnalisé", icone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>' }
    ]
};

// Icônes en-tête mouvement
const iconesEnteteMouvement = {
    entree: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
    sortie: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
    inventaire: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>'
};

// ==================== PRODUITS — VARIABLES GLOBALES ====================
let produitsEntreprise = [];
let categoriesEntreprise = [];
let produitSelectionneId = null;
let filtreOngletActuel = 'tous';
let periodeSelectionneeHistorique = "cette-semaine";
let donneesHistorique = [];
let filtreTypeHistorique = 'tous';
let periodeSelectionneeRapport = "aujourdhui";
let typeRapportActuelRapport = null;
let estRapportBudgetaireRapport = false;

// ==================== NOTIFICATIONS STOCK — VARIABLES ====================
let notificationsStock = [];
let intervalleRafraichissementNotifications = null;
// ==================== CODE-BARRES — VARIABLES GLOBALES (codeProduit) ====================
let formatSelectionneCodeProduit = null; // Ex: "EAN13", "CODE128", "AUTO", null
let codeGenereCodeProduit = null; // Le code généré automatiquement

// ==================== PHOTO PRODUIT — VARIABLES GLOBALES ====================
let fluxVideoActif_photoProduit = null;
let pisteTorche_photoProduit = null;
let torcheActive_photoProduit = false;
let imageSourceValidation_photoProduit = null;

// Rognage
let rognage_photoProduit = {
    cadre: { x: 0, y: 0, w: 0, h: 0 },
    imageRect: { x: 0, y: 0, w: 0, h: 0 },
    enDeplacement: false,
    direction: null,
    pointDepart: { x: 0, y: 0 },
    cadreDepart: { x: 0, y: 0, w: 0, h: 0 },
    tailleMini: 40
};
        // ==================== ÉTAT ====================
        let ecranActuel = "ecran-langue";
        let slideOnboarding = 0;
        let modeSombre = false;

        // ==================== FONCTIONS UTILITAIRES ====================
        function afficherEcran(idEcran) {
    document.querySelectorAll(".ecran").forEach(e => e.classList.remove("actif"));

    const ecran = document.getElementById(idEcran);
    if (ecran) {
        ecran.classList.add("actif");
        ecranActuel = idEcran;

        sessionStorage.setItem("ecran-actuel", idEcran);
    }

    const nav = document.getElementById("nav-principale");
    const ecransAvecNav = ["ecran-accueil", "ecran-produits", "ecran-historique", "ecran-rapports", "ecran-menu"];

    if (nav) {
        nav.style.display = ecransAvecNav.includes(idEcran) ? "flex" : "none";
    }
}

function obtenirEcranSauvegarde() {
    return sessionStorage.getItem("ecran-actuel");
}

function ecranExiste(idEcran) {
    return !!document.getElementById(idEcran);
}

function restaurerEcranSauvegarde() {
    const ecranSauvegarde = obtenirEcranSauvegarde();

    if (!ecranSauvegarde) return false;
    if (!ecranExiste(ecranSauvegarde)) return false;

    afficherEcran(ecranSauvegarde);
    return true;
}

        function formaterDate(dateStr) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            return new Date(dateStr).toLocaleDateString('fr-FR', options);
        }

        function obtenirStatutClass(statut) {
    const classes = {
        nul: "statut-nul",
        faible: "statut-faible",
        normal: "statut-normal",
        eleve: "statut-eleve",
        // Rétrocompatibilité
        rupture: "statut-nul",
        stock: "statut-normal",
        surstock: "statut-eleve"
    };
    return classes[statut] || "statut-normal";
}


        function obtenirStatutTexte(statut) {
    const textes = {
        nul: "Stock nul",
        faible: "Stock faible",
        normal: "Stock normal",
        eleve: "Stock élevé",
        // Rétrocompatibilité avec les anciennes valeurs (au cas où)
        rupture: "Stock nul",
        stock: "Stock normal",
        surstock: "Stock élevé"
    };
    return textes[statut] || "Stock normal";
}

// ==================== CODE-BARRES — FONCTIONS UTILITAIRES (codeProduit) ====================

/**
 * Données des formats de codes-barres
 */
const formatsCodeBarresCodeProduit = {
    EAN13: {
        nom: "EAN-13",
        longueur: 12, // 12 chiffres + 1 checksum auto
        numerique: true,
        generer: () => {
            let code = "";
            for (let i = 0; i < 12; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        }
    },
    EAN8: {
        nom: "EAN-8",
        longueur: 7, // 7 chiffres + 1 checksum auto
        numerique: true,
        generer: () => {
            let code = "";
            for (let i = 0; i < 7; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        }
    },
    UPC: {
        nom: "UPC-A",
        longueur: 11, // 11 chiffres + 1 checksum auto
        numerique: true,
        generer: () => {
            let code = "";
            for (let i = 0; i < 11; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        }
    },
    CODE128: {
        nom: "CODE 128",
        longueur: 0, // libre
        numerique: false,
        generer: () => {
            const prefixes = ["PRD", "ART", "REF", "LOT", "STK"];
            const prefixe = prefixes[Math.floor(Math.random() * prefixes.length)];
            const numero = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
            const suffixes = ["A", "B", "C", "X", "Z"];
            const suffixe = suffixes[Math.floor(Math.random() * suffixes.length)];
            return `${prefixe}-${numero}-${suffixe}`;
        }
    },
    CODE39: {
        nom: "CODE 39",
        longueur: 0,
        numerique: false,
        generer: () => {
            const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let code = "";
            for (let i = 0; i < 3; i++) {
                code += lettres[Math.floor(Math.random() * lettres.length)];
            }
            code += String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
            return code;
        }
    },
    ITF14: {
        nom: "ITF-14",
        longueur: 13, // 13 chiffres + 1 checksum auto
        numerique: true,
        generer: () => {
            let code = "";
            for (let i = 0; i < 13; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        }
    },
    MSI: {
        nom: "MSI",
        longueur: 0,
        numerique: true,
        generer: () => {
            let code = "";
            const longueur = Math.floor(Math.random() * 4) + 6; // 6 à 9 chiffres
            for (let i = 0; i < longueur; i++) {
                code += Math.floor(Math.random() * 10);
            }
            return code;
        }
    }
};

/**
 * Détecte automatiquement le meilleur format pour un code saisi
 */
function detecterFormatCodeProduit(code) {
    if (!code || code.trim() === "") return null;

    code = code.trim();
    const estNumerique = /^\d+$/.test(code);

    if (estNumerique) {
        if (code.length === 13 || code.length === 12) return "EAN13";
        if (code.length === 8 || code.length === 7) return "EAN8";
        if (code.length === 12 || code.length === 11) return "UPC";
        if (code.length === 14 || code.length === 13) return "ITF14";
        // Numérique libre → MSI
        return "MSI";
    }

    // Alphanumérique → CODE128 (plus universel que CODE39)
    // Vérifier si compatible CODE39 (uniquement A-Z, 0-9, -, ., $, /, +, %, espace)
    const compatibleCode39 = /^[A-Z0-9\-\.\$\/\+\%\s]+$/.test(code.toUpperCase());
    if (compatibleCode39 && code.length <= 20) return "CODE39";

    return "CODE128";
}

/**
 * Génère le code-barres SVG dans un élément donné
 */
function genererCodeBarreSvgCodeProduit(elementSvg, code, format) {
    if (!elementSvg || !code || !format) return false;

    try {
        JsBarcode(elementSvg, code, {
            format: format,
            displayValue: true,
            fontSize: 14,
            height: 60,
            margin: 10,
            background: "transparent",
            lineColor: "#1a1a2e",
            font: "'JetBrains Mono', monospace"
        });
        return true;
    } catch (erreur) {
        console.warn("Erreur génération code-barres :", erreur.message);
        return false;
    }
}

/**
 * Met à jour l'aperçu de l'étiquette dans l'écran ajout produit
 */
function mettreAJourEtiquetteCodeProduit() {
    const zoneEtiquette = document.getElementById("zone-etiquette-codeProduit");
    const inputCode = document.getElementById("input-code-produit-codeProduit");
    const inputNom = document.querySelector("#ecran-ajout-produit .ajout-champ:nth-child(1) .ajout-input");

    if (!zoneEtiquette || !inputCode) return;

    const code = inputCode.value.trim();
    const nom = inputNom ? inputNom.value.trim() : "";

    if (!code) {
        zoneEtiquette.style.display = "none";
        return;
    }

    // Déterminer le format
    let format = formatSelectionneCodeProduit;
    if (!format || format === "AUTO") {
        format = detecterFormatCodeProduit(code);
    }

    if (!format) {
        zoneEtiquette.style.display = "none";
        return;
    }

    const infoFormat = formatsCodeBarresCodeProduit[format];
    if (!infoFormat) {
        zoneEtiquette.style.display = "none";
        return;
    }

    // Mettre à jour le nom
    const etiquetteNom = document.getElementById("etiquette-nom-codeProduit");
    if (etiquetteNom) {
        etiquetteNom.textContent = nom || "Nom du produit";
    }

    // Mettre à jour le badge
    const etiquetteBadge = document.getElementById("etiquette-type-badge-codeProduit");
    if (etiquetteBadge) {
        etiquetteBadge.textContent = infoFormat.nom;
    }

    // Générer le code-barres
    const svgElement = document.getElementById("etiquette-svg-codeProduit");
    const succes = genererCodeBarreSvgCodeProduit(svgElement, code, format);

    if (succes) {
        zoneEtiquette.style.display = "block";
    } else {
        // Essayer CODE128 en fallback
        const succesFallback = genererCodeBarreSvgCodeProduit(svgElement, code, "CODE128");
        if (succesFallback) {
            zoneEtiquette.style.display = "block";
            if (etiquetteBadge) etiquetteBadge.textContent = "CODE 128";
        } else {
            zoneEtiquette.style.display = "none";
        }
    }
}

/**
 * Ouvre le bottom sheet des types de codes-barres
 */
function ouvrirFeuilleTypesCodeProduit() {
    const superposition = document.getElementById("superposition-types-codeProduit");
    if (superposition) {
        superposition.classList.add("visible-codeProduit");

        // Marquer la sélection actuelle
        document.querySelectorAll(".feuille-option-codeProduit").forEach(opt => {
            opt.classList.remove("selectionne-codeProduit");
            if (opt.dataset.formatCodeproduit === formatSelectionneCodeProduit) {
                opt.classList.add("selectionne-codeProduit");
            }
        });
    }
}

/**
 * Ferme le bottom sheet
 */
function fermerFeuilleTypesCodeProduit() {
    const superposition = document.getElementById("superposition-types-codeProduit");
    if (superposition) {
        superposition.classList.remove("visible-codeProduit");
    }
}

/**
 * Sélectionne un type de code-barres depuis le bottom sheet
 */
function selectionnerTypeCodeProduit(format) {
    formatSelectionneCodeProduit = format;

    const inputCode = document.getElementById("input-code-produit-codeProduit");
    if (!inputCode) return;

    if (format === "AUTO") {
        // Ne pas modifier l'input, juste mettre à jour l'étiquette
        fermerFeuilleTypesCodeProduit();
        mettreAJourEtiquetteCodeProduit();
        return;
    }

    const infoFormat = formatsCodeBarresCodeProduit[format];
    if (!infoFormat) return;

    // Générer un code pour ce format
    const codeGenere = infoFormat.generer();
    codeGenereCodeProduit = codeGenere;
    inputCode.value = codeGenere;

    fermerFeuilleTypesCodeProduit();
    mettreAJourEtiquetteCodeProduit();
}

/**
 * Exporte l'étiquette en image PNG
 */
async function exporterEtiquetteCodeProduit(nomProduit, codeBarres, format) {
    if (!codeBarres) {
        afficherMessageErreur("Aucun code-barres à exporter.");
        return;
    }

    // Créer un canvas hors écran
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const largeur = 400;
    const hauteur = 260;
    canvas.width = largeur;
    canvas.height = hauteur;

    // Fond blanc
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largeur, hauteur);

    // Nom du produit
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 18px 'Space Grotesk', Arial, sans-serif";
    ctx.textAlign = "center";

    // Tronquer le nom si trop long
    let nomAffiche = nomProduit || "Produit";
    if (nomAffiche.length > 30) nomAffiche = nomAffiche.substring(0, 27) + "...";
    ctx.fillText(nomAffiche, largeur / 2, 35);

    // Générer le code-barres dans un SVG temporaire
    const svgTemp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svgTemp);
    svgTemp.style.position = "absolute";
    svgTemp.style.left = "-9999px";

    let formatEffectif = format;
    if (!formatEffectif || formatEffectif === "AUTO") {
        formatEffectif = detecterFormatCodeProduit(codeBarres);
    }

    try {
        JsBarcode(svgTemp, codeBarres, {
            format: formatEffectif || "CODE128",
            displayValue: true,
            fontSize: 16,
            height: 80,
            margin: 5,
            background: "transparent",
            lineColor: "#1a1a2e"
        });
    } catch (e) {
        // Fallback CODE128
        try {
            JsBarcode(svgTemp, codeBarres, {
                format: "CODE128",
                displayValue: true,
                fontSize: 16,
                height: 80,
                margin: 5,
                background: "transparent",
                lineColor: "#1a1a2e"
            });
        } catch (e2) {
            document.body.removeChild(svgTemp);
            afficherMessageErreur("Impossible de générer l'image.");
            return;
        }
    }

    // Convertir SVG → image
    const svgData = new XMLSerializer().serializeToString(svgTemp);
    document.body.removeChild(svgTemp);

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const urlSvg = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
        // Centrer le code-barres
        const xImg = (largeur - img.width) / 2;
        const yImg = 50;
        ctx.drawImage(img, xImg, yImg, Math.min(img.width, largeur - 20), Math.min(img.height, 150));

        // Badge format en bas
        const formatNom = formatsCodeBarresCodeProduit[formatEffectif]?.nom || formatEffectif;
        ctx.fillStyle = "#adb5bd";
        ctx.font = "11px 'Space Grotesk', Arial, sans-serif";
        ctx.fillText(formatNom, largeur / 2, hauteur - 15);

        URL.revokeObjectURL(urlSvg);

        // Télécharger
        const lien = document.createElement("a");
        lien.download = `etiquette-${(nomProduit || "produit").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.png`;
        lien.href = canvas.toDataURL("image/png");
        lien.click();

        afficherMessageSucces("Étiquette exportée avec succès.");
    };

    img.onerror = () => {
        URL.revokeObjectURL(urlSvg);
        afficherMessageErreur("Erreur lors de l'export.");
    };

    img.src = urlSvg;
}

// ==================== MOUVEMENT — FONCTIONS ====================

function ouvrirModalMouvement(type) {
    if (!produitActuelDetails) {
        afficherMessageErreur("Aucun produit sélectionné.");
        return;
    }

    const modalMouvement = document.getElementById("modal-mouvement");
    const inputQuantiteMouvement = document.getElementById("input-quantite-mouvement");
    const textareaMouvement = document.getElementById("textarea-note-mouvement");
    const compteurNoteMouvement = document.getElementById("compteur-note-mouvement");
    const selecteurEmplacementMouvement = document.getElementById("selecteur-emplacement-mouvement");
    const titreMouvement = document.getElementById("titre-mouvement");
    const sousTitreMouvement = document.getElementById("sous-titre-mouvement");
    const iconeTitreMouvement = document.getElementById("icone-titre-mouvement");
    const labelQuantiteMouvement = document.getElementById("label-quantite-mouvement");
    const btnValiderMouvement = document.getElementById("btn-valider-mouvement");
    const btnValiderTexteMouvement = document.getElementById("btn-valider-texte-mouvement");

    typeMouvementActuel = type;
    motifSelectionne = null;

    // Mettre à jour le stock global depuis le produit actuel
    stockGlobalActuel = produitActuelDetails.quantite_totale || 0;

    // Reset quantité
    inputQuantiteMouvement.value = 0;

    // Reset note
    textareaMouvement.value = "";
    compteurNoteMouvement.textContent = "0 / 50";
    compteurNoteMouvement.classList.remove("limite-mouvement");

    // Fermer sélecteur emplacement
    selecteurEmplacementMouvement.classList.remove("ouvert-mouvement");

    // En-tête
    iconeTitreMouvement.className = "icone-titre-mouvement";
    btnValiderMouvement.className = "btn-valider-mouvement";

    if (type === "entree") {
        titreMouvement.textContent = "Entrée de stock";
        sousTitreMouvement.textContent = "Ajouter des unités au stock";
        iconeTitreMouvement.classList.add("entree-mouvement");
        iconeTitreMouvement.innerHTML = iconesEnteteMouvement.entree;
        labelQuantiteMouvement.textContent = "Quantité à entrer";
        btnValiderTexteMouvement.textContent = "Confirmer l'entrée";
        btnValiderMouvement.classList.add("entree-mouvement");
    } else if (type === "sortie") {
        titreMouvement.textContent = "Sortie de stock";
        sousTitreMouvement.textContent = "Retirer des unités du stock";
        iconeTitreMouvement.classList.add("sortie-mouvement");
        iconeTitreMouvement.innerHTML = iconesEnteteMouvement.sortie;
        labelQuantiteMouvement.textContent = "Quantité à sortir";
        btnValiderTexteMouvement.textContent = "Confirmer la sortie";
        btnValiderMouvement.classList.add("sortie-mouvement");
    } else {
        titreMouvement.textContent = "Inventaire correctif";
        sousTitreMouvement.textContent = "Compter et ajuster le stock";
        iconeTitreMouvement.classList.add("inventaire-mouvement");
        iconeTitreMouvement.innerHTML = iconesEnteteMouvement.inventaire;
        labelQuantiteMouvement.textContent = "Quantité comptée";
        btnValiderTexteMouvement.textContent = "Confirmer l'inventaire";
        btnValiderMouvement.classList.add("inventaire-mouvement");
    }

    // Construire motifs
    construireMotifsMouvement(type);

    // Construire la liste des emplacements dynamiquement
    construireEmplacementsMouvement();

    // Mettre à jour résultat
    mettreAJourResultatMouvement();

    // Réinitialiser étapes visuelles
    reinitialiserEtapesMouvement();

    modalMouvement.classList.add("actif");
}


function construireMotifsMouvement(type) {
    const grilleMotifsMouvement = document.getElementById("grille-motifs-mouvement");
    const motifs = donneeMotifsMouvement[type];
    grilleMotifsMouvement.innerHTML = "";

    motifs.forEach((motif, index) => {
        const carte = document.createElement("div");
        carte.className = "carte-motif-mouvement" + (index === 0 ? " selectionne-mouvement" : "");
        carte.dataset.motifMouvement = motif.id;

        carte.innerHTML = `
            <div class="coche-motif-mouvement">
                <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div class="icone-motif-mouvement">${motif.icone}</div>
            <div class="texte-motif-mouvement">
                <span class="nom-motif-mouvement">${motif.nom}</span>
                <span class="desc-motif-mouvement">${motif.desc}</span>
            </div>
        `;

        carte.addEventListener("click", () => {
            grilleMotifsMouvement.querySelectorAll(".carte-motif-mouvement").forEach(c => c.classList.remove("selectionne-mouvement"));
            carte.classList.add("selectionne-mouvement");
            motifSelectionne = motif.id;
            // Passer étape 1 à fait
            const etapes = document.querySelectorAll(".etape-mouvement");
            etapes[0].classList.remove("active");
            etapes[0].classList.add("fait");
            etapes[1].classList.add("active");
        });

        grilleMotifsMouvement.appendChild(carte);

        if (index === 0) motifSelectionne = motif.id;
    });
}

function reinitialiserEtapesMouvement() {
    const etapes = document.querySelectorAll(".etape-mouvement");
    etapes.forEach((e, i) => {
        e.classList.remove("active", "fait");
        if (i === 0) e.classList.add("active");
    });
}

// ==================== MOUVEMENT — NOUVELLES FONCTIONS ====================

function construireEmplacementsMouvement() {
    const listeEmplacementMouvement = document.getElementById("liste-emplacement-mouvement");
    const emplacements = Array.isArray(produitActuelDetails?.emplacements) ? produitActuelDetails.emplacements : [];

    if (!listeEmplacementMouvement) return;

    listeEmplacementMouvement.innerHTML = "";

    if (emplacements.length === 0) {
        listeEmplacementMouvement.innerHTML = `
            <div style="padding:1rem;text-align:center;color:var(--texte-secondaire);font-size:0.85rem;">
                Aucun emplacement pour ce produit
            </div>
        `;
        emplacementSelectionneId = null;
        emplacementSelectionneQte = 0;
        return;
    }

    emplacements.forEach((emp, index) => {
        const option = document.createElement("div");
        option.className = "selecteur-option-mouvement" + (index === 0 ? " active" : "");
        option.dataset.emplacement = emp.id;
        option.dataset.qty = emp.quantite;

        option.innerHTML = `
            <div class="option-emp-gauche-mouvement">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                    <span class="option-emp-nom-mouvement">${emp.nom}</span>
                    <span class="option-emp-detail-mouvement">${emp.quantite} unités en stock</span>
                </div>
            </div>
            <span class="option-emp-badge-mouvement">${emp.quantite} u.</span>
        `;

        option.addEventListener("click", () => {
            listeEmplacementMouvement.querySelectorAll(".selecteur-option-mouvement").forEach(o => o.classList.remove("active"));
            option.classList.add("active");

            emplacementSelectionneId = emp.id;
            emplacementSelectionneQte = emp.quantite;

            // Mettre à jour l'affichage du sélecteur
            document.querySelector(".emplacement-nom-mouvement").textContent = emp.nom;
            document.querySelector(".emplacement-qty-mouvement").textContent = emp.quantite + " unités";

            const selecteurEmplacementMouvement = document.getElementById("selecteur-emplacement-mouvement");
            selecteurEmplacementMouvement.classList.remove("ouvert-mouvement");

            // Recalculer le résultat car l'emplacement a changé (important pour inventaire)
            mettreAJourResultatMouvement();
        });

        listeEmplacementMouvement.appendChild(option);
    });

    // Sélectionner le premier par défaut
    const premierEmplacement = emplacements[0];
    emplacementSelectionneId = premierEmplacement.id;
    emplacementSelectionneQte = premierEmplacement.quantite;

    document.querySelector(".emplacement-nom-mouvement").textContent = premierEmplacement.nom;
    document.querySelector(".emplacement-qty-mouvement").textContent = premierEmplacement.quantite + " unités";
}

async function validerMouvement() {
    if (!produitActuelDetails) {
        afficherMessageErreur("Aucun produit sélectionné.");
        return;
    }

    if (!emplacementSelectionneId) {
        afficherMessageErreur("Veuillez sélectionner un emplacement.");
        return;
    }

    if (!motifSelectionne) {
        afficherMessageErreur("Veuillez sélectionner un motif.");
        return;
    }

    const inputQuantiteMouvement = document.getElementById("input-quantite-mouvement");
    const textareaMouvement = document.getElementById("textarea-note-mouvement");

    const quantite = parseInt(inputQuantiteMouvement.value) || 0;

    if (quantite <= 0 && typeMouvementActuel !== "inventaire") {
        afficherMessageErreur("La quantité doit être supérieure à 0.");
        return;
    }

    if (typeMouvementActuel === "inventaire" && quantite < 0) {
        afficherMessageErreur("La quantité comptée ne peut pas être négative.");
        return;
    }

    // Pour la sortie, vérifier le stock de l'emplacement
    if (typeMouvementActuel === "sortie" && quantite > emplacementSelectionneQte) {
        afficherMessageErreur(`Stock insuffisant dans cet emplacement. Disponible : ${emplacementSelectionneQte} unités.`);
        return;
    }

    // Trouver le libellé du motif
    const motifs = donneeMotifsMouvement[typeMouvementActuel] || [];
    const motifObj = motifs.find(m => m.id === motifSelectionne);
    const motifNom = motifObj ? motifObj.nom : motifSelectionne;

    const note = textareaMouvement.value.trim() || null;

    // Désactiver le bouton pendant l'appel
    const btnValiderMouvement = document.getElementById("btn-valider-mouvement");
    const btnValiderTexteMouvement = document.getElementById("btn-valider-texte-mouvement");
    const texteOriginal = btnValiderTexteMouvement.textContent;
    btnValiderTexteMouvement.textContent = "Traitement...";
    btnValiderMouvement.disabled = true;

    try {
        const { data, error } = await clientSupabase
            .rpc("effectuer_mouvement_stock", {
                p_produit_id: produitActuelDetails.id,
                p_emplacement_id: emplacementSelectionneId,
                p_type_mouvement: typeMouvementActuel,
                p_motif: motifNom,
                p_quantite: quantite,
                p_note: note
            });

        if (error) {
            console.error("Erreur mouvement stock :", error);
            afficherMessageErreur(error.message || "Impossible d'effectuer le mouvement.");
            return;
        }

        console.log("Mouvement effectué :", data);

        // Message de succès
        const typeTexte = typeMouvementActuel === "entree" ? "Entrée" : typeMouvementActuel === "sortie" ? "Sortie" : "Inventaire";
        afficherMessageSucces(`${typeTexte} enregistrée avec succès.`);

        // Fermer le modal
        const modalMouvement = document.getElementById("modal-mouvement");
        modalMouvement.classList.remove("actif");

        // Recharger les détails du produit pour mettre à jour l'affichage
        await afficherDetailsProduit(produitActuelDetails.id);

        // Recharger les produits pour la liste
        await chargerProduitsEntreprise();
        rendreProduits();
        
                // Rafraîchir les notifications
        await chargerNotificationsStock();
        rendreNotificationsStock();


    } catch (erreur) {
        console.error("Erreur inattendue mouvement :", erreur);
        afficherMessageErreur("Une erreur est survenue.");
    } finally {
        btnValiderTexteMouvement.textContent = texteOriginal;
        btnValiderMouvement.disabled = false;
    }
}

// ==================== HISTORIQUE — NOUVELLES FONCTIONS ====================

function calculerPlageDatesPeriode() {
    const maintenant = new Date();
    let dateDebut = null;
    let dateFin = null;

    switch (periodeSelectionneeHistorique) {
        case "aujourdhui":
            dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 0, 0, 0);
            dateFin = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 23, 59, 59);
            break;

        case "cette-semaine": {
            const jourSemaine = maintenant.getDay();
            const decalage = jourSemaine === 0 ? 6 : jourSemaine - 1; // Lundi = début de semaine
            dateDebut = new Date(maintenant);
            dateDebut.setDate(maintenant.getDate() - decalage);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(dateDebut);
            dateFin.setDate(dateDebut.getDate() + 6);
            dateFin.setHours(23, 59, 59, 999);
            break;
        }

        case "ce-mois":
            dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1, 0, 0, 0);
            dateFin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);
            break;

        case "cette-annee":
            dateDebut = new Date(maintenant.getFullYear(), 0, 1, 0, 0, 0);
            dateFin = new Date(maintenant.getFullYear(), 11, 31, 23, 59, 59);
            break;

        case "periode": {
            const inputDebut = document.getElementById("date-debut-historique").value;
            const inputFin = document.getElementById("date-fin-historique").value;
            if (inputDebut) {
                dateDebut = new Date(inputDebut + "T00:00:00");
            }
            if (inputFin) {
                dateFin = new Date(inputFin + "T23:59:59");
            }
            break;
        }

        default:
            // Pas de filtre de date
            break;
    }

    return { dateDebut, dateFin };
}

async function chargerHistoriqueMouvements() {
    if (!entrepriseActuelle?.id) {
        donneesHistorique = [];
        rendreHistorique();
        return;
    }

    const { dateDebut, dateFin } = calculerPlageDatesPeriode();

    const params = {
        p_entreprise_id: entrepriseActuelle.id,
        p_type_filtre: filtreTypeHistorique || 'tous',
        p_date_debut: dateDebut ? dateDebut.toISOString() : null,
        p_date_fin: dateFin ? dateFin.toISOString() : null
    };

    console.log("Chargement historique avec params :", params);

    const { data, error } = await clientSupabase
        .rpc("recuperer_historique_mouvements", params);

    if (error) {
        console.error("Erreur chargement historique :", error);
        donneesHistorique = [];
        rendreHistorique();
        return;
    }

    donneesHistorique = Array.isArray(data) ? data : [];
    console.log("Historique chargé :", donneesHistorique.length, "mouvements");

    rendreHistorique();
}

function mettreAJourCompteursHistorique() {
    const filtres = document.querySelectorAll("#ecran-historique .filtre-btn");
    if (!filtres || filtres.length === 0) return;

    const total = donneesHistorique.length;
    const entrees = donneesHistorique.filter(h => h.type === "entree").length;
    const sorties = donneesHistorique.filter(h => h.type === "sortie").length;
    const inventaires = donneesHistorique.filter(h => h.type === "inventaire").length;

    const comptes = [total, entrees, sorties, inventaires];

    filtres.forEach((filtre, index) => {
        const span = filtre.querySelector("span");
        if (span && comptes[index] !== undefined) {
            span.textContent = comptes[index];
        }
    });
}


function mettreAJourResultatMouvement() {
    const inputQuantiteMouvement = document.getElementById("input-quantite-mouvement");
    const resultatAvantMouvement = document.getElementById("resultat-avant-mouvement");
    const badgeVariationMouvement = document.getElementById("badge-variation-mouvement");
    const resultatApresMouvement = document.getElementById("resultat-apres-mouvement");

    const qty = parseInt(inputQuantiteMouvement.value) || 0;
    const avant = stockGlobalActuel;
    let variation = 0;
    let apres = avant;

    if (typeMouvementActuel === "entree") {
        variation = qty;
        apres = avant + qty;
    } else if (typeMouvementActuel === "sortie") {
        variation = -qty;
        apres = avant - qty;
    } else {
        // Inventaire : la quantité saisie est comparée à l'emplacement sélectionné
        // L'impact global = différence entre quantité comptée et quantité de l'emplacement
        const differenceEmplacement = qty - emplacementSelectionneQte;
        variation = differenceEmplacement;
        apres = avant + differenceEmplacement;
    }

    if (apres < 0) apres = 0;

    resultatAvantMouvement.textContent = avant;
    resultatApresMouvement.textContent = apres;

    // Badge variation
    badgeVariationMouvement.className = "variation-badge-mouvement";
    if (variation > 0) {
        badgeVariationMouvement.textContent = "+" + variation;
        badgeVariationMouvement.classList.add("positif-mouvement");
    } else if (variation < 0) {
        badgeVariationMouvement.textContent = variation;
        badgeVariationMouvement.classList.add("negatif-mouvement");
    } else {
        badgeVariationMouvement.textContent = "0";
        badgeVariationMouvement.classList.add("neutre");
    }

    // Couleur de l'après
    resultatApresMouvement.style.color = "";
    if (variation > 0) {
        resultatApresMouvement.style.color = "var(--succes)";
    } else if (variation < 0) {
        resultatApresMouvement.style.color = "var(--danger)";
    }

    // Mettre étape 2 si quantité > 0
    const etapes = document.querySelectorAll(".etape-mouvement");
    if (qty > 0) {
        etapes[1].classList.remove("active");
        etapes[1].classList.add("fait");
        etapes[2].classList.add("active");
    }
}


// ==================== BOTTOM SHEET PÉRIODE — FONCTIONS HISTORIQUE ====================

function ouvrirFeuillePeriodesHistorique() {
    const superposition = document.getElementById("superposition-periode-historique");
    const zoneDates = document.getElementById("zone-dates-personnalisees-historique");
    const listePeriodes = document.querySelector(".liste-periodes-historique");
    const titreFeuille = document.querySelector(".titre-feuille-periode-historique");

    // Réinitialiser : afficher la liste, masquer les dates
    listePeriodes.style.display = "flex";
    titreFeuille.style.display = "block";
    zoneDates.classList.remove("visible-historique");

    superposition.classList.add("visible-historique");
}

function fermerFeuillePeriodesHistorique() {
    const superposition = document.getElementById("superposition-periode-historique");
    superposition.classList.remove("visible-historique");
}

async function selectionnerPeriodeHistorique(periode) {
    const options = document.querySelectorAll(".option-periode-historique");
    const dateSelectSpan = document.querySelector(".date-select span");

    options.forEach(opt => opt.classList.remove("actif-historique"));

    const optionChoisie = document.querySelector(`[data-periode-historique="${periode}"]`);
    if (optionChoisie) {
        optionChoisie.classList.add("actif-historique");
    }

    periodeSelectionneeHistorique = periode;

    const labelsPeriodesHistorique = {
        "aujourdhui": "Aujourd'hui",
        "cette-semaine": "Cette semaine",
        "ce-mois": "Ce mois-ci",
        "cette-annee": "Cette année"
    };

    if (labelsPeriodesHistorique[periode]) {
        dateSelectSpan.textContent = labelsPeriodesHistorique[periode];
    }

    fermerFeuillePeriodesHistorique();

    // Recharger l'historique avec la période sélectionnée
    await chargerHistoriqueMouvements();
}


function afficherDatesPersonnaliseesHistorique() {
    const listePeriodes = document.querySelector(".liste-periodes-historique");
    const titreFeuille = document.querySelector(".titre-feuille-periode-historique");
    const zoneDates = document.getElementById("zone-dates-personnalisees-historique");

    listePeriodes.style.display = "none";
    titreFeuille.style.display = "none";
    zoneDates.classList.add("visible-historique");
}

function retourListePeriodesHistorique() {
    const listePeriodes = document.querySelector(".liste-periodes-historique");
    const titreFeuille = document.querySelector(".titre-feuille-periode-historique");
    const zoneDates = document.getElementById("zone-dates-personnalisees-historique");

    zoneDates.classList.remove("visible-historique");
    listePeriodes.style.display = "flex";
    titreFeuille.style.display = "block";
}

async function appliquerDatesPersonnaliseesHistorique() {
    const dateDebut = document.getElementById("date-debut-historique").value;
    const dateFin = document.getElementById("date-fin-historique").value;
    const dateSelectSpan = document.querySelector(".date-select span");

    if (!dateDebut || !dateFin) {
        return;
    }

    const optionsFormat = { day: 'numeric', month: 'short' };
    const debutFormate = new Date(dateDebut).toLocaleDateString('fr-FR', optionsFormat);
    const finFormate = new Date(dateFin).toLocaleDateString('fr-FR', optionsFormat);

    dateSelectSpan.textContent = `${debutFormate} — ${finFormate}`;

    document.querySelectorAll(".option-periode-historique").forEach(opt => {
        opt.classList.remove("actif-historique");
    });

    periodeSelectionneeHistorique = "periode";

    fermerFeuillePeriodesHistorique();

    // Recharger avec dates personnalisées
    await chargerHistoriqueMouvements();
}

// ==================== BOTTOM SHEET PÉRIODE — FONCTIONS RAPPORT ====================

function ouvrirFeuillePeriodesRapport() {
    const superpositionRapport = document.getElementById("superposition-periode-rapport");
    const zoneDatesRapport = document.getElementById("zone-dates-personnalisees-rapport");
    const listePeriodesRapport = document.querySelector(".liste-periodes-rapport");
    const titreFeuiileRapport = document.querySelector(".titre-feuille-periode-rapport");

    // Réinitialiser : afficher la liste, masquer les dates
    listePeriodesRapport.style.display = "flex";
    titreFeuiileRapport.style.display = "block";
    zoneDatesRapport.classList.remove("visible-rapport");

    superpositionRapport.classList.add("visible-rapport");
}

function fermerFeuillePeriodesRapport() {
    const superpositionRapport = document.getElementById("superposition-periode-rapport");
    superpositionRapport.classList.remove("visible-rapport");
}

function selectionnerPeriodeRapport(periodeRapport) {
    const optionsRapport = document.querySelectorAll(".option-periode-rapport");

    optionsRapport.forEach(opt => opt.classList.remove("actif-rapport"));

    const optionChoisieRapport = document.querySelector(`[data-periode-rapport="${periodeRapport}"]`);
    if (optionChoisieRapport) {
        optionChoisieRapport.classList.add("actif-rapport");
    }

    periodeSelectionneeRapport = periodeRapport;

    fermerFeuillePeriodesRapport();

    // Ouvrir l'aperçu du rapport après sélection de la période
    if (typeRapportActuelRapport) {
        const carteRapport = document.querySelector(`[data-rapport="${typeRapportActuelRapport}"]`);
        const titreRapport = carteRapport ? carteRapport.querySelector(".rapport-nom").textContent : typeRapportActuelRapport;
        ouvrirApercuRapport(typeRapportActuelRapport, titreRapport);
    }
}


function afficherDatesPersonnaliseesRapport() {
    const listePeriodesRapport = document.querySelector(".liste-periodes-rapport");
    const titreFeuiileRapport = document.querySelector(".titre-feuille-periode-rapport");
    const zoneDatesRapport = document.getElementById("zone-dates-personnalisees-rapport");

    listePeriodesRapport.style.display = "none";
    titreFeuiileRapport.style.display = "none";
    zoneDatesRapport.classList.add("visible-rapport");
}

function retourListePeriodesRapport() {
    const listePeriodesRapport = document.querySelector(".liste-periodes-rapport");
    const titreFeuiileRapport = document.querySelector(".titre-feuille-periode-rapport");
    const zoneDatesRapport = document.getElementById("zone-dates-personnalisees-rapport");

    zoneDatesRapport.classList.remove("visible-rapport");
    listePeriodesRapport.style.display = "flex";
    titreFeuiileRapport.style.display = "block";
}

function appliquerDatesPersonnaliseesRapport() {
    const dateDebutRapport = document.getElementById("date-debut-rapport").value;
    const dateFinRapport = document.getElementById("date-fin-rapport").value;

    if (!dateDebutRapport || !dateFinRapport) {
        return;
    }

    periodeSelectionneeRapport = "periode";

    // Retirer toutes les sélections actives
    document.querySelectorAll(".option-periode-rapport").forEach(opt => {
        opt.classList.remove("actif-rapport");
    });

    fermerFeuillePeriodesRapport();

    // Ouvrir l'aperçu avec les dates personnalisées
    if (typeRapportActuelRapport) {
        const carteRapport = document.querySelector(`[data-rapport="${typeRapportActuelRapport}"]`);
        const titreRapport = carteRapport ? carteRapport.querySelector(".rapport-nom").textContent : typeRapportActuelRapport;

        // Mettre à jour le titre et le sous-titre
        document.getElementById("rapport-titre").textContent = titreRapport;
        document.getElementById("rapport-soustitre").textContent = `Rapport concernant ${titreRapport.toLowerCase()}`;

        // Mettre à jour la date dans l'aperçu
        const optionsFormatRapport = { day: 'numeric', month: 'long', year: 'numeric' };
        const debutFormateRapport = new Date(dateDebutRapport).toLocaleDateString('fr-FR', optionsFormatRapport);
        const finFormateRapport = new Date(dateFinRapport).toLocaleDateString('fr-FR', optionsFormatRapport);
        const maintenant = new Date();
        const heureFormateRapport = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const spanDateRapport = document.getElementById("rapport-date");
        if (spanDateRapport) {
            spanDateRapport.textContent = `Du ${debutFormateRapport} au ${finFormateRapport} — ${heureFormateRapport}`;
        }

        rendreTableauRapport(typeRapportActuelRapport);
        afficherEcran("ecran-apercu-rapport");
    }
}


function mettreAJourDateRapport(periodeRapport) {
    const maintenant = new Date();
    const spanDateRapport = document.getElementById("rapport-date");
    if (!spanDateRapport) return;

    const optionsJourRapport = { day: 'numeric', month: 'long', year: 'numeric' };
    const heureRapport = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let texteDate = "";

    switch (periodeRapport) {
        case "aujourdhui": {
            const dateFormateeRapport = maintenant.toLocaleDateString('fr-FR', optionsJourRapport);
            texteDate = `${dateFormateeRapport} à ${heureRapport}`;
            break;
        }
        case "cette-semaine": {
            const jourSemaineRapport = maintenant.getDay();
            const decalageRapport = jourSemaineRapport === 0 ? 6 : jourSemaineRapport - 1;
            const debutSemaineRapport = new Date(maintenant);
            debutSemaineRapport.setDate(maintenant.getDate() - decalageRapport);
            const finSemaineRapport = new Date(debutSemaineRapport);
            finSemaineRapport.setDate(debutSemaineRapport.getDate() + 6);

            const debutTexteRapport = debutSemaineRapport.toLocaleDateString('fr-FR', optionsJourRapport);
            const finTexteRapport = finSemaineRapport.toLocaleDateString('fr-FR', optionsJourRapport);
            texteDate = `Du ${debutTexteRapport} au ${finTexteRapport} — ${heureRapport}`;
            break;
        }
        case "ce-mois": {
            const debutMoisRapport = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
            const finMoisRapport = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);

            const debutMoisTexteRapport = debutMoisRapport.toLocaleDateString('fr-FR', optionsJourRapport);
            const finMoisTexteRapport = finMoisRapport.toLocaleDateString('fr-FR', optionsJourRapport);
            texteDate = `Du ${debutMoisTexteRapport} au ${finMoisTexteRapport} — ${heureRapport}`;
            break;
        }
        case "cette-annee": {
            const debutAnneeRapport = new Date(maintenant.getFullYear(), 0, 1);
            const finAnneeRapport = new Date(maintenant.getFullYear(), 11, 31);

            const debutAnneeTexteRapport = debutAnneeRapport.toLocaleDateString('fr-FR', optionsJourRapport);
            const finAnneeTexteRapport = finAnneeRapport.toLocaleDateString('fr-FR', optionsJourRapport);
            texteDate = `Du ${debutAnneeTexteRapport} au ${finAnneeTexteRapport} — ${heureRapport}`;
            break;
        }
        default: {
            const dateFormateeDefautRapport = maintenant.toLocaleDateString('fr-FR', optionsJourRapport);
            texteDate = `${dateFormateeDefautRapport} à ${heureRapport}`;
            break;
        }
    }

    spanDateRapport.textContent = texteDate;
}

function genererDateHeureActuelleRapport() {
    const maintenant = new Date();
    const optionsDateRapport = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateFormateRapport = maintenant.toLocaleDateString('fr-FR', optionsDateRapport);
    const heureFormateRapport = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateFormateRapport} à ${heureFormateRapport}`;
}

function estRapportBudgetaireTypeRapport(typeRapport) {
    const typesBudgetairesRapport = ["achats", "ventes", "pertes", "finance"];
    return typesBudgetairesRapport.includes(typeRapport);
}

function ouvrirApercuRapport(typeRapport, titreRapport) {
    document.getElementById("rapport-titre").textContent = titreRapport;
    document.getElementById("rapport-soustitre").textContent = `Rapport concernant ${titreRapport.toLowerCase()}`;

    // Mettre à jour la date et heure
    const spanDateRapport = document.getElementById("rapport-date");
    if (spanDateRapport) {
        if (estRapportBudgetaireRapport) {
            mettreAJourDateRapport(periodeSelectionneeRapport);
        } else {
            spanDateRapport.textContent = genererDateHeureActuelleRapport();
        }
    }

    rendreTableauRapport(typeRapport);
    afficherEcran("ecran-apercu-rapport");
}



// ==================== NOTIFICATIONS STOCK — FONCTIONS ====================

async function chargerNotificationsStock() {
    if (!entrepriseActuelle?.id) {
        notificationsStock = [];
        return [];
    }

    const { data, error } = await clientSupabase
        .rpc("recuperer_notifications_stock", {
            p_entreprise_id: entrepriseActuelle.id
        });

    if (error) {
        console.error("Erreur chargement notifications stock :", error);
        notificationsStock = [];
        return [];
    }

    notificationsStock = Array.isArray(data) ? data : [];
    console.log("Notifications stock chargées :", notificationsStock.length);
    return notificationsStock;
}

function obtenirLabelTemporel(dateISO) {
    const maintenant = new Date();
    const date = new Date(dateISO);
    const diffMs = maintenant - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHeures = Math.floor(diffMs / 3600000);
    const diffJours = Math.floor(diffMs / 86400000);

    const aujourdhuiDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    const hierDebut = new Date(aujourdhuiDebut);
    hierDebut.setDate(hierDebut.getDate() - 1);

    const lundiCetteSemaine = new Date(aujourdhuiDebut);
    const jourSemaine = maintenant.getDay();
    const decalage = jourSemaine === 0 ? 6 : jourSemaine - 1;
    lundiCetteSemaine.setDate(lundiCetteSemaine.getDate() - decalage);

    const debutCeMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

    if (diffMin < 5) return "maintenant";
    if (diffMin < 60) return "il-y-a-peu";
    if (date >= aujourdhuiDebut) return "plus-tot-aujourd-hui";
    if (date >= hierDebut && date < aujourdhuiDebut) return "hier";
    if (date >= lundiCetteSemaine) return "cette-semaine";
    if (date >= debutCeMois) return "ce-mois";

    // Mois précédents
    const moisNoms = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    return moisNoms[date.getMonth()] + " " + date.getFullYear();
}

function obtenirLabelTemporelAffichage(clef) {
    const correspondances = {
        "maintenant": "Maintenant",
        "il-y-a-peu": "Il y a peu",
        "plus-tot-aujourd-hui": "Plus tôt aujourd'hui",
        "hier": "Hier",
        "cette-semaine": "Cette semaine",
        "ce-mois": "Ce mois"
    };
    return correspondances[clef] || clef;
}

function formaterHorodatageNotification(dateISO) {
    const date = new Date(dateISO);
    const maintenant = new Date();
    const aujourdhuiDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());

    const heures = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const heureTexte = `${heures}:${minutes}`;

    // Si c'est aujourd'hui, afficher seulement l'heure
    if (date >= aujourdhuiDebut) {
        return heureTexte;
    }

    // Sinon, afficher le jour et l'heure
    const joursNoms = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
    const moisNoms = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
        "juil.", "août", "sept.", "oct.", "nov.", "déc."];

    const jourNom = joursNoms[date.getDay()];
    const jour = date.getDate();
    const mois = moisNoms[date.getMonth()];

    // Vérifier si c'est la même année
    if (date.getFullYear() === maintenant.getFullYear()) {
        return `${jourNom} ${jour} ${mois} · ${heureTexte}`;
    }

    return `${jourNom} ${jour} ${mois} ${date.getFullYear()} · ${heureTexte}`;
}

function obtenirSeveriteNotification(statut) {
    if (statut === 'nul') return 'critique';
    if (statut === 'faible') return 'attention';
    if (statut === 'eleve') return 'info';
    return 'attention';
}

function obtenirEtiquetteNotification(statut) {
    if (statut === 'nul') return 'Rupture';
    if (statut === 'faible') return 'Stock faible';
    if (statut === 'eleve') return 'Surstock';
    return 'Alerte';
}

function obtenirMessageNotification(notification) {
    const n = notification;
    if (n.statut_declencheur === 'nul') {
        return `Stock épuisé — quantité : ${n.quantite_actuelle}`;
    }
    if (n.statut_declencheur === 'faible') {
        return `Il reste ${n.quantite_actuelle} unités — seuil min : ${n.quantite_min}`;
    }
    if (n.statut_declencheur === 'eleve') {
        return `${n.quantite_actuelle} unités — dépasse le seuil max de ${n.quantite_max}`;
    }
    return `Quantité : ${n.quantite_actuelle}`;
}

function calculerJaugeNotification(notification) {
    const n = notification;
    if (n.statut_declencheur === 'nul') {
        return { valeur: 0, couleur: 'var(--danger)' };
    }
    if (n.statut_declencheur === 'faible') {
        // Pourcentage relatif au seuil min
        const pourcentage = n.quantite_min > 0
            ? Math.round((n.quantite_actuelle / n.quantite_min) * 100)
            : 0;
        return { valeur: Math.min(pourcentage, 100), couleur: 'var(--attention)' };
    }
    if (n.statut_declencheur === 'eleve') {
        // Pourcentage basé sur le max
        const pourcentage = n.quantite_max > 0
            ? Math.round((n.quantite_actuelle / n.quantite_max) * 100)
            : 100;
        return { valeur: Math.min(pourcentage, 100), couleur: 'var(--info)' };
    }
    return { valeur: 50, couleur: 'var(--attention)' };
}

function construireHtmlNotification(notification) {
    const severite = obtenirSeveriteNotification(notification.statut_declencheur);
    const etiquette = obtenirEtiquetteNotification(notification.statut_declencheur);
    const message = obtenirMessageNotification(notification);
    const horodatage = formaterHorodatageNotification(notification.declenchee_le);
    const jauge = calculerJaugeNotification(notification);
    const ondeHtml = severite === 'critique'
        ? '<div class="notification-noeud-onde"></div>'
        : '';

    return `
        <div class="notification-evenement notification-severite-${severite}" data-produit-id="${notification.produit_id}" data-notification-id="${notification.id}">
            <div class="notification-noeud">
                <div class="notification-noeud-centre"></div>
                ${ondeHtml}
            </div>
            <div class="notification-bulle">
                <div class="notification-bulle-entete">
                    <div class="notification-jauge" style="--notification-jauge-valeur: ${jauge.valeur}; --notification-jauge-couleur: ${jauge.couleur};">
                        <svg viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3" stroke="currentColor" opacity="0.1"/>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3" stroke="currentColor" stroke-dasharray="${jauge.valeur}, ${100 - jauge.valeur}" class="notification-jauge-arc"/>
                        </svg>
                        <span class="notification-jauge-texte">${notification.quantite_actuelle}</span>
                    </div>
                    <div class="notification-bulle-info">
                        <span class="notification-etiquette notification-etiquette-${severite}">${etiquette}</span>
                        <p class="notification-bulle-titre">${notification.produit_nom}</p>
                    </div>
                </div>
                <p class="notification-bulle-message">${message}</p>
                <div class="notification-bulle-pied">
                    <span class="notification-horodatage">${horodatage}</span>
                    <button class="notification-action-btn" onclick="naviguerVersNotificationProduit('${notification.produit_id}')">Voir le produit →</button>
                </div>
            </div>
        </div>
    `;
}

async function naviguerVersNotificationProduit(produitId) {
    if (produitId) {
        await afficherDetailsProduit(produitId);
    }
}

function rendreNotificationsStock() {
    const conteneur = document.getElementById("notifications-fil");
    if (!conteneur) return;

    // Si aucune notification active
    if (!notificationsStock || notificationsStock.length === 0) {
        conteneur.innerHTML = `
            <div class="notification-vide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                <p>Aucune alerte en cours</p>
                <p style="font-size:12px;margin-top:4px;opacity:0.6;">Tout votre stock est dans un état normal</p>
            </div>
        `;
        mettreAJourBadgeNotifications(0);
        return;
    }

    // Grouper par label temporel
    const groupes = {};
    const ordreGroupes = [];

    notificationsStock.forEach(n => {
        const clef = obtenirLabelTemporel(n.declenchee_le);
        if (!groupes[clef]) {
            groupes[clef] = [];
            ordreGroupes.push(clef);
        }
        groupes[clef].push(n);
    });

    let html = '';

    ordreGroupes.forEach(clef => {
        const labelAffichage = obtenirLabelTemporelAffichage(clef);
        const estMaintenant = clef === 'maintenant';

        html += `
            <div class="notification-temps">
                <span class="notification-temps-label">${labelAffichage}</span>
                ${estMaintenant ? '<span class="notification-temps-pulse"></span>' : ''}
            </div>
        `;

        groupes[clef].forEach(notification => {
            html += construireHtmlNotification(notification);
        });
    });

    conteneur.innerHTML = html;

    mettreAJourBadgeNotifications(notificationsStock.length);
}

function mettreAJourBadgeNotifications(nombre) {
    // Badge cloche accueil
    const badge = document.querySelector(".notification-badge");
    if (badge) {
        if (nombre > 0) {
            badge.textContent = nombre > 99 ? '99+' : nombre;
            badge.style.display = "flex";
        } else {
            badge.textContent = "";
            badge.style.display = "none";
        }
    }

    // Compteur entête écran notifications
    const compteur = document.getElementById("notifications-compteur");
    if (compteur) {
        if (nombre > 0) {
            compteur.textContent = nombre + " alerte" + (nombre > 1 ? "s" : "");
            compteur.classList.add("visible");
        } else {
            compteur.textContent = "";
            compteur.classList.remove("visible");
        }
    }
}


function demarrerRafraichissementNotifications() {
    arreterRafraichissementNotifications();

    // Rafraîchir toutes les 60 secondes pour mettre à jour les labels temporels
    intervalleRafraichissementNotifications = setInterval(async () => {
        await chargerNotificationsStock();
        rendreNotificationsStock();
    }, 60000);
}

function arreterRafraichissementNotifications() {
    if (intervalleRafraichissementNotifications) {
        clearInterval(intervalleRafraichissementNotifications);
        intervalleRafraichissementNotifications = null;
    }
}

        
        // ==================== PHOTO PRODUIT — FONCTIONS ====================

function ouvrirCamera_photoProduit() {
    const superposition = document.getElementById('superposition-camera-photo-produit');
    const video = document.getElementById('flux-camera-photo-produit');

    superposition.classList.add('visible-photo-produit');

    const contraintes = {
        video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
    };

    navigator.mediaDevices.getUserMedia(contraintes)
        .then(flux => {
            fluxVideoActif_photoProduit = flux;
            video.srcObject = flux;

            const piste = flux.getVideoTracks()[0];
            pisteTorche_photoProduit = piste;
        })
        .catch(err => {
            console.error('Erreur accès caméra :', err);
            fermerCamera_photoProduit();
            // Fallback : ouvrir galerie si pas de caméra
            document.getElementById('input-galerie-photo-produit').click();
        });
}

function fermerCamera_photoProduit() {
    const superposition = document.getElementById('superposition-camera-photo-produit');

    if (fluxVideoActif_photoProduit) {
        fluxVideoActif_photoProduit.getTracks().forEach(piste => piste.stop());
        fluxVideoActif_photoProduit = null;
    }

    pisteTorche_photoProduit = null;
    torcheActive_photoProduit = false;

    const btnTorche = document.getElementById('btn-torche-photo-produit');
    btnTorche.classList.remove('torche-active-photo-produit');

    const video = document.getElementById('flux-camera-photo-produit');
    video.srcObject = null;

    superposition.classList.remove('visible-photo-produit');
}

function basculerTorche_photoProduit() {
    if (!pisteTorche_photoProduit) return;

    const capacites = pisteTorche_photoProduit.getCapabilities();
    if (!capacites.torch) return;

    torcheActive_photoProduit = !torcheActive_photoProduit;

    pisteTorche_photoProduit.applyConstraints({
        advanced: [{ torch: torcheActive_photoProduit }]
    }).then(() => {
        const btnTorche = document.getElementById('btn-torche-photo-produit');
        btnTorche.classList.toggle('torche-active-photo-produit', torcheActive_photoProduit);
    }).catch(err => {
        console.error('Erreur torche :', err);
    });
}

function capturerPhoto_photoProduit() {
    const video = document.getElementById('flux-camera-photo-produit');
    const canvas = document.getElementById('canvas-capture-photo-produit');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Effet flash
    const flash = document.createElement('div');
    flash.className = 'flash-capture-photo-produit';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    imageSourceValidation_photoProduit = dataUrl;

    fermerCamera_photoProduit();
    afficherValidation_photoProduit(dataUrl);
}

function afficherValidation_photoProduit(src) {
    const superposition = document.getElementById('superposition-validation-photo-produit');
    const image = document.getElementById('image-apercu-photo-produit');

    image.src = src;
    superposition.classList.add('visible-photo-produit');
}

function fermerValidation_photoProduit() {
    const superposition = document.getElementById('superposition-validation-photo-produit');
    superposition.classList.remove('visible-photo-produit');
    imageSourceValidation_photoProduit = null;
}

function confirmerValidation_photoProduit() {
    const superposition = document.getElementById('superposition-validation-photo-produit');
    superposition.classList.remove('visible-photo-produit');

    ouvrirRognage_photoProduit(imageSourceValidation_photoProduit);
}

function ouvrirRognage_photoProduit(src) {
    const superposition = document.getElementById('superposition-rognage-photo-produit');
    const image = document.getElementById('image-rognage-photo-produit');

    image.src = src;

    image.onload = function () {
        superposition.classList.add('visible-photo-produit');

        // Laisser le DOM se recalculer
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initialiserCadreRognage_photoProduit();
            });
        });
    };
}

function initialiserCadreRognage_photoProduit() {
    const zone = document.getElementById('zone-rognage-photo-produit');
    const image = document.getElementById('image-rognage-photo-produit');

    const zoneRect = zone.getBoundingClientRect();
    const imgRect = image.getBoundingClientRect();

    // Position de l'image relative à la zone
    rognage_photoProduit.imageRect = {
        x: imgRect.left - zoneRect.left,
        y: imgRect.top - zoneRect.top,
        w: imgRect.width,
        h: imgRect.height
    };

    // Cadre initial = toute l'image avec marge de 10%
    const marge = 0.1;
    rognage_photoProduit.cadre = {
        x: rognage_photoProduit.imageRect.x + rognage_photoProduit.imageRect.w * marge,
        y: rognage_photoProduit.imageRect.y + rognage_photoProduit.imageRect.h * marge,
        w: rognage_photoProduit.imageRect.w * (1 - 2 * marge),
        h: rognage_photoProduit.imageRect.h * (1 - 2 * marge)
    };

    dessinerCadreRognage_photoProduit();
}

function dessinerCadreRognage_photoProduit() {
    const cadreEl = document.getElementById('cadre-rognage-photo-produit');
    const c = rognage_photoProduit.cadre;

    cadreEl.style.left = c.x + 'px';
    cadreEl.style.top = c.y + 'px';
    cadreEl.style.width = c.w + 'px';
    cadreEl.style.height = c.h + 'px';

    // Mettre à jour les masques
    const zone = document.getElementById('zone-rognage-photo-produit');
    const zW = zone.offsetWidth;
    const zH = zone.offsetHeight;

    // Masque haut
    const masqueH = document.getElementById('masque-haut-photo-produit');
    masqueH.style.height = c.y + 'px';

    // Masque bas
    const masqueB = document.getElementById('masque-bas-photo-produit');
    masqueB.style.top = (c.y + c.h) + 'px';
    masqueB.style.height = (zH - c.y - c.h) + 'px';

    // Masque gauche
    const masqueG = document.getElementById('masque-gauche-photo-produit');
    masqueG.style.top = c.y + 'px';
    masqueG.style.height = c.h + 'px';
    masqueG.style.width = c.x + 'px';

    // Masque droite
    const masqueD = document.getElementById('masque-droite-photo-produit');
    masqueD.style.top = c.y + 'px';
    masqueD.style.height = c.h + 'px';
    masqueD.style.left = (c.x + c.w) + 'px';
    masqueD.style.width = (zW - c.x - c.w) + 'px';
}

function gererDebutToucher_photoProduit(e) {
    e.preventDefault();
    const toucher = e.touches ? e.touches[0] : e;
    const zone = document.getElementById('zone-rognage-photo-produit');
    const zoneRect = zone.getBoundingClientRect();
    const px = toucher.clientX - zoneRect.left;
    const py = toucher.clientY - zoneRect.top;

    const cible = e.target.closest('.poignee-rognage-photo-produit');
    const cadreEl = document.getElementById('cadre-rognage-photo-produit');

    if (cible) {
        rognage_photoProduit.direction = cible.dataset.direction;
    } else if (e.target === cadreEl || cadreEl.contains(e.target)) {
        rognage_photoProduit.direction = 'deplacer';
    } else {
        return;
    }

    rognage_photoProduit.enDeplacement = true;
    rognage_photoProduit.pointDepart = { x: px, y: py };
    rognage_photoProduit.cadreDepart = { ...rognage_photoProduit.cadre };
}

function gererMouvementToucher_photoProduit(e) {
    if (!rognage_photoProduit.enDeplacement) return;
    e.preventDefault();

    const toucher = e.touches ? e.touches[0] : e;
    const zone = document.getElementById('zone-rognage-photo-produit');
    const zoneRect = zone.getBoundingClientRect();
    const px = toucher.clientX - zoneRect.left;
    const py = toucher.clientY - zoneRect.top;

    const dx = px - rognage_photoProduit.pointDepart.x;
    const dy = py - rognage_photoProduit.pointDepart.y;
    const d = rognage_photoProduit.cadreDepart;
    const img = rognage_photoProduit.imageRect;
    const mini = rognage_photoProduit.tailleMini;
    const dir = rognage_photoProduit.direction;

    let nx = d.x, ny = d.y, nw = d.w, nh = d.h;

    if (dir === 'deplacer') {
        nx = d.x + dx;
        ny = d.y + dy;
        // Contraindre aux limites de l'image
        nx = Math.max(img.x, Math.min(nx, img.x + img.w - d.w));
        ny = Math.max(img.y, Math.min(ny, img.y + img.h - d.h));
    } else {
        // Redimensionnement
        if (dir.includes('gauche')) {
            nx = Math.max(img.x, Math.min(d.x + dx, d.x + d.w - mini));
            nw = d.w - (nx - d.x);
        }
        if (dir.includes('droite')) {
            nw = Math.max(mini, Math.min(d.w + dx, img.x + img.w - d.x));
        }
        if (dir === 'haut' || dir.includes('haut')) {
            ny = Math.max(img.y, Math.min(d.y + dy, d.y + d.h - mini));
            nh = d.h - (ny - d.y);
        }
        if (dir === 'bas' || dir.includes('bas')) {
            nh = Math.max(mini, Math.min(d.h + dy, img.y + img.h - d.y));
        }

        // Uniquement horizontal pour gauche/droite purs
        if (dir === 'gauche' || dir === 'droite') {
            ny = d.y;
            nh = d.h;
        }
        // Uniquement vertical pour haut/bas purs
        if (dir === 'haut' || dir === 'bas') {
            nx = d.x;
            nw = d.w;
        }
    }

    rognage_photoProduit.cadre = { x: nx, y: ny, w: nw, h: nh };
    dessinerCadreRognage_photoProduit();
}

function gererFinToucher_photoProduit() {
    rognage_photoProduit.enDeplacement = false;
    rognage_photoProduit.direction = null;
}

function reinitialiserRognage_photoProduit() {
    initialiserCadreRognage_photoProduit();
}

function validerRognage_photoProduit() {
    const image = document.getElementById('image-rognage-photo-produit');
    const img = rognage_photoProduit.imageRect;
    const c = rognage_photoProduit.cadre;

    // Calculer les ratios par rapport à l'image naturelle
    const ratioX = image.naturalWidth / img.w;
    const ratioY = image.naturalHeight / img.h;

    const sx = (c.x - img.x) * ratioX;
    const sy = (c.y - img.y) * ratioY;
    const sw = c.w * ratioX;
    const sh = c.h * ratioY;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh), 0, 0, canvas.width, canvas.height);

    const resultat = canvas.toDataURL('image/jpeg', 0.92);

    // Fermer le rognage
    document.getElementById('superposition-rognage-photo-produit').classList.remove('visible-photo-produit');

    // Afficher dans la zone d'image du formulaire
    afficherImageFinale_photoProduit(resultat);
}

function afficherImageFinale_photoProduit(src) {
    const zone = document.getElementById('zone-ajout-image-photo-produit');
    const apercu = document.getElementById('apercu-final-photo-produit');
    const contenu = document.getElementById('contenu-ajout-image-photo-produit');
    const btnSupprimer = document.getElementById('btn-supprimer-image-photo-produit');

    apercu.src = src;
    apercu.style.display = 'block';
    contenu.style.display = 'none';
    btnSupprimer.style.display = 'flex';
    zone.classList.add('avec-image-photo-produit');
}

function supprimerImageProduit_photoProduit() {
    const zone = document.getElementById('zone-ajout-image-photo-produit');
    const apercu = document.getElementById('apercu-final-photo-produit');
    const contenu = document.getElementById('contenu-ajout-image-photo-produit');
    const btnSupprimer = document.getElementById('btn-supprimer-image-photo-produit');

    apercu.src = '';
    apercu.style.display = 'none';
    contenu.style.display = 'flex';
    btnSupprimer.style.display = 'none';
    zone.classList.remove('avec-image-photo-produit');
    imageSourceValidation_photoProduit = null;
}
        
        // ==================== SÉLECTEUR CATÉGORIE ====================
function initialiserSelecteurCategorie() {
    const selecteur = document.getElementById("selecteur-categorie");
    const affichage = document.getElementById("affichage-categorie");
    const texte = document.getElementById("texte-categorie");
    const recherche = document.getElementById("recherche-categorie");
    const options = document.getElementById("options-categorie");
    const vide = document.getElementById("categorie-vide");

    // Ouvrir / Fermer
    affichage.addEventListener("click", () => {
        selecteur.classList.toggle("ouvert");
        if (selecteur.classList.contains("ouvert")) {
            recherche.value = "";
            filtrerCategories("");
            setTimeout(() => recherche.focus(), 50);
        }
    });

    // Fermer en cliquant à l'extérieur
    document.addEventListener("click", (e) => {
        if (!selecteur.contains(e.target)) {
            selecteur.classList.remove("ouvert");
        }
    });

    // Recherche
    recherche.addEventListener("input", () => {
        filtrerCategories(recherche.value);
    });

    // Sélection d'une option
    options.addEventListener("click", (e) => {
        const option = e.target.closest(".selecteur-option");
        if (!option) return;

        options.querySelectorAll(".selecteur-option").forEach(o => o.classList.remove("actif"));
        option.classList.add("actif");
        texte.textContent = option.textContent;
        texte.classList.add("selectionne");
        selecteur.dataset.valeur = option.dataset.valeur;
        selecteur.classList.remove("ouvert");
    });
}

function filtrerCategories(terme) {
    const options = document.querySelectorAll("#options-categorie .selecteur-option");
    const vide = document.getElementById("categorie-vide");
    let visible = 0;
    const termeMin = terme.toLowerCase().trim();

    options.forEach(option => {
        const correspond = option.textContent.toLowerCase().includes(termeMin);
        option.style.display = correspond ? "" : "none";
        if (correspond) visible++;
    });

    vide.style.display = visible === 0 ? "" : "none";
}

function ajouterCategorieOption(id, nom) {
    const conteneur = document.getElementById("options-categorie");
    const option = document.createElement("div");
    option.className = "selecteur-option";
    option.dataset.valeur = id;
    option.textContent = nom;
    conteneur.appendChild(option);
}


// ==================== EMPLACEMENTS MULTIPLES ====================
let compteurEmplacement = 1;

function ajouterEmplacement() {
    const conteneur = document.getElementById("emplacements-conteneur");
    const index = compteurEmplacement++;
    const ligne = document.createElement("div");
    ligne.className = "emplacement-ligne";
    ligne.dataset.index = index;
    ligne.innerHTML = `
        <input type="text" class="ajout-input emplacement-nom" placeholder="Ex: Entrepôt B - Rayon 1">
        <input type="number" class="ajout-input emplacement-qte" placeholder="Qté" min="0">
        <button class="emplacement-supprimer" title="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
        </button>
    `;
    conteneur.appendChild(ligne);
    mettreAJourSupprimerBtns();

    // Écouter les changements de quantité sur le nouveau champ
    ligne.querySelector(".emplacement-qte").addEventListener("input", calculerQuantiteTotale);
}

function supprimerEmplacement(ligne) {
    ligne.style.opacity = "0";
    ligne.style.transform = "translateX(20px)";
    ligne.style.transition = "opacity 0.2s, transform 0.2s";
    setTimeout(() => {
        ligne.remove();
        mettreAJourSupprimerBtns();
        calculerQuantiteTotale();
    }, 200);
}

function mettreAJourSupprimerBtns() {
    const lignes = document.querySelectorAll(".emplacement-ligne");
    lignes.forEach(l => {
        const btn = l.querySelector(".emplacement-supprimer");
        btn.disabled = lignes.length <= 1;
    });
}

function calculerQuantiteTotale() {
    const champs = document.querySelectorAll(".emplacement-qte");
    let total = 0;
    champs.forEach(c => {
        const val = parseInt(c.value);
        if (!isNaN(val) && val > 0) total += val;
    });
    document.getElementById("valeur-quantite-totale").textContent = total;

    // Recalculer les prix aussi
    calculerEtAfficherPrix();
}


// ==================== CATÉGORIES — SUPABASE ====================

async function chargerCategoriesEntreprise() {
    if (!entrepriseActuelle?.id) {
        categoriesEntreprise = [];
        return [];
    }

    const { data, error } = await clientSupabase
        .rpc("recuperer_categories_entreprise", {
            p_entreprise_id: entrepriseActuelle.id
        });

    if (error) {
        console.error("Erreur chargement catégories :", error);
        categoriesEntreprise = [];
        return [];
    }

    categoriesEntreprise = Array.isArray(data) ? data : [];
    console.log("Catégories chargées :", categoriesEntreprise);
    return categoriesEntreprise;
}

function rendreOptionsCategoriesSelecteur() {
    const conteneurOptions = document.getElementById("options-categorie");
    if (!conteneurOptions) return;

    conteneurOptions.innerHTML = "";

    categoriesEntreprise.forEach(cat => {
        const option = document.createElement("div");
        option.className = "selecteur-option";
        option.dataset.valeur = cat.id;
        option.textContent = cat.nom;
        conteneurOptions.appendChild(option);
    });
}

async function creerCategorieSupabase(nomCategorie) {
    if (!entrepriseActuelle?.id || !nomCategorie) return null;

    const { data, error } = await clientSupabase
        .rpc("creer_categorie", {
            p_entreprise_id: entrepriseActuelle.id,
            p_nom: nomCategorie
        });

    if (error) {
        console.error("Erreur création catégorie :", error);
        if (error.message && error.message.includes("existe déjà")) {
            afficherMessageErreur("Cette catégorie existe déjà.");
        } else {
            afficherMessageErreur("Impossible de créer la catégorie.");
        }
        return null;
    }

    console.log("Catégorie créée :", data);

    // Recharger les catégories
    await chargerCategoriesEntreprise();
    rendreOptionsCategoriesSelecteur();

    return data;
}

// ==================== PRODUITS — SUPABASE ====================

async function chargerProduitsEntreprise() {
    if (!entrepriseActuelle?.id) {
        produitsEntreprise = [];
        return [];
    }

    const { data, error } = await clientSupabase
        .rpc("recuperer_produits_entreprise", {
            p_entreprise_id: entrepriseActuelle.id
        });

    if (error) {
        console.error("Erreur chargement produits :", error);
        produitsEntreprise = [];
        return [];
    }

    produitsEntreprise = Array.isArray(data) ? data : [];
    console.log("Produits chargés :", produitsEntreprise);
    return produitsEntreprise;
}

async function genererCodeProduit() {
    if (!entrepriseActuelle?.id) return "PRD-001";

    const { data, error } = await clientSupabase
        .rpc("generer_code_produit", {
            p_entreprise_id: entrepriseActuelle.id
        });

    if (error) {
        console.error("Erreur génération code :", error);
        return "PRD-001";
    }

    return data;
}

function collecterDonneesFormulaireProduit() {
    const nom = document.querySelector("#ecran-ajout-produit .ajout-champ:nth-child(1) .ajout-input").value.trim();
    const inputsCode = document.getElementById("input-code-produit-codeProduit");
const code = inputsCode ? inputsCode.value.trim() : "";
    const categorieIdBrut = document.getElementById("selecteur-categorie").dataset.valeur;
const categorieId = (categorieIdBrut && categorieIdBrut.trim() !== "" && categorieIdBrut !== "undefined") ? categorieIdBrut : null;

    const qteMin = parseInt(document.getElementById("input-qte-min").value) || 0;
    const qteMax = parseInt(document.getElementById("input-qte-max").value) || 0;

    // Prix
    const inputsPrix = document.querySelectorAll("#ecran-ajout-produit .ajout-ligne:last-of-type .ajout-input");
    // On cible les inputs prix d'achat et prix de vente
    const tousInputs = document.querySelectorAll("#ecran-ajout-produit .ajout-formulaire .ajout-input[type='number']");
    let prixAchat = 0;
    let prixVente = 0;

    // Les inputs prix sont dans le dernier .ajout-ligne avant .ajout-prix-section
    const lignesPrix = document.querySelectorAll("#ecran-ajout-produit .ajout-ligne");
    if (lignesPrix.length >= 2) {
        const derniereLigne = lignesPrix[lignesPrix.length - 1];
        const inputsDerniereLigne = derniereLigne.querySelectorAll(".ajout-input");
        if (inputsDerniereLigne.length >= 2) {
            prixAchat = parseFloat(inputsDerniereLigne[0].value) || 0;
            prixVente = parseFloat(inputsDerniereLigne[1].value) || 0;
        }
    }

    // Notes
    const textareaNotes = document.querySelector("#ecran-ajout-produit .ajout-formulaire textarea");
    const notes = textareaNotes ? textareaNotes.value.trim() : "";

    // Emplacements
    const emplacements = [];
    document.querySelectorAll(".emplacement-ligne").forEach(ligne => {
        const nomEmplacement = ligne.querySelector(".emplacement-nom").value.trim();
        const qteEmplacement = parseInt(ligne.querySelector(".emplacement-qte").value) || 0;
        if (nomEmplacement) {
            emplacements.push({ nom: nomEmplacement, quantite: qteEmplacement });
        }
    });

    // Quantité totale
    let quantiteTotale = 0;
    emplacements.forEach(e => { quantiteTotale += e.quantite; });

    // Photo
    const apercuPhoto = document.getElementById("apercu-final-photo-produit");
    const photoBase64 = (apercuPhoto && apercuPhoto.style.display !== "none" && apercuPhoto.src) ? apercuPhoto.src : null;

    return {
        nom,
        code,
        categorieId,
        quantiteTotale,
        qteMin,
        qteMax,
        prixAchat,
        prixVente,
        notes,
        emplacements,
        photoBase64
    };
}

async function uploaderPhotoProduit(base64OuUrl) {
    if (!base64OuUrl || !base64OuUrl.startsWith("data:")) return null;
    if (!utilisateurActuel || !entrepriseActuelle) return null;

    // Convertir base64 en Blob
    const reponse = await fetch(base64OuUrl);
    const blob = await reponse.blob();

    const cheminFichier = `${entrepriseActuelle.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

    const { error: erreurUpload } = await clientSupabase
        .storage
        .from("photos-produits")
        .upload(cheminFichier, blob, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/webp"
        });

    if (erreurUpload) {
        console.error("Erreur upload photo produit :", erreurUpload);
        return null;
    }

    const { data: donneesPubliques } = clientSupabase
        .storage
        .from("photos-produits")
        .getPublicUrl(cheminFichier);

    return donneesPubliques.publicUrl;
}

async function enregistrerProduit() {
    const donnees = collecterDonneesFormulaireProduit();

    // Validation
    if (!donnees.nom) {
        afficherMessageErreur("Veuillez entrer le nom du produit.");
        return;
    }

    if (donnees.emplacements.length === 0) {
        afficherMessageErreur("Veuillez ajouter au moins un emplacement avec un nom.");
        return;
    }

    if (!entrepriseActuelle?.id) {
        afficherMessageErreur("Aucune entreprise sélectionnée.");
        return;
    }

    // Bouton loading
    const btnEnregistrer = document.querySelector("#ecran-ajout-produit .ajout-enregistrer-btn");
    const texteOriginal = btnEnregistrer.textContent;
    btnEnregistrer.textContent = "Enregistrement...";
    btnEnregistrer.disabled = true;

    try {
        // Upload photo si présente
        let photoUrl = null;
        if (donnees.photoBase64 && donnees.photoBase64.startsWith("data:")) {
            photoUrl = await uploaderPhotoProduit(donnees.photoBase64);
        }

// Déterminer le format du code-barres
let formatCodeBarresFinal = formatSelectionneCodeProduit;
if ((!formatCodeBarresFinal || formatCodeBarresFinal === "AUTO") && donnees.code) {
    formatCodeBarresFinal = detecterFormatCodeProduit(donnees.code);
}

// Appel RPC
const { data, error } = await clientSupabase
    .rpc("enregistrer_produit", {
        p_entreprise_id: entrepriseActuelle.id,
        p_nom: donnees.nom,
        p_code: donnees.code || null,
        p_code_barres: donnees.code || null,
        p_format_code_barres: formatCodeBarresFinal || null,
        p_categorie_id: donnees.categorieId || null,
        p_quantite_totale: donnees.quantiteTotale,
        p_quantite_min: donnees.qteMin,
        p_quantite_max: donnees.qteMax,
        p_prix_achat: donnees.prixAchat,
        p_prix_vente: donnees.prixVente,
        p_notes: donnees.notes || null,
        p_photo_url: photoUrl,
        p_emplacements: donnees.emplacements
    });



        if (error) {
    console.error("Erreur enregistrement produit :", error);
    console.error("Code erreur :", error.code);
    console.error("Message erreur :", error.message);
    console.error("Détails erreur :", error.details);
    console.error("Hint erreur :", error.hint);
    console.error("Données envoyées :", {
        entreprise_id: entrepriseActuelle.id,
        nom: donnees.nom,
        code: donnees.code,
        categorieId: donnees.categorieId,
        quantiteTotale: donnees.quantiteTotale,
        qteMin: donnees.qteMin,
        qteMax: donnees.qteMax,
        prixAchat: donnees.prixAchat,
        prixVente: donnees.prixVente,
        emplacements: donnees.emplacements,
        photoUrl: photoUrl
    });
    afficherMessageErreur("Impossible d'enregistrer le produit : " + (error.message || "Erreur inconnue"));
    return;
}


        console.log("Produit enregistré :", data);

        afficherMessageSucces("Produit enregistré avec succès.");

        // Réinitialiser le formulaire
        reinitialiserFormulaireAjoutProduit();

        // Recharger les produits et afficher la liste
        await chargerProduitsEntreprise();
        rendreProduits();
        
                // Rafraîchir les notifications
        await chargerNotificationsStock();
        rendreNotificationsStock();


        afficherEcran("ecran-produits");

    } catch (erreur) {
        console.error("Erreur inattendue :", erreur);
        afficherMessageErreur("Une erreur est survenue.");
    } finally {
        btnEnregistrer.textContent = texteOriginal;
        btnEnregistrer.disabled = false;
    }
}

function reinitialiserFormulaireAjoutProduit() {
    // Nom
    const inputNom = document.querySelector("#ecran-ajout-produit .ajout-champ:nth-child(1) .ajout-input");
    if (inputNom) inputNom.value = "";

    // Code
    const inputCode = document.getElementById("input-code-produit-codeProduit");
    if (inputCode) inputCode.value = "";
    
        // Code-barres — réinitialiser le format et l'étiquette
    formatSelectionneCodeProduit = null;
    codeGenereCodeProduit = null;
    const zoneEtiquette = document.getElementById("zone-etiquette-codeProduit");
    if (zoneEtiquette) zoneEtiquette.style.display = "none";


    // Catégorie
    const texteCategorie = document.getElementById("texte-categorie");
    const selecteurCategorie = document.getElementById("selecteur-categorie");
    if (texteCategorie) {
        texteCategorie.textContent = "Sélectionner une catégorie";
        texteCategorie.classList.remove("selectionne");
    }
    if (selecteurCategorie) {
        delete selecteurCategorie.dataset.valeur;
    }

    // Emplacements — remettre à 1 ligne vide
    const conteneurEmplacements = document.getElementById("emplacements-conteneur");
    if (conteneurEmplacements) {
        conteneurEmplacements.innerHTML = `
            <div class="emplacement-ligne" data-index="0">
                <input type="text" class="ajout-input emplacement-nom" placeholder="Ex: Entrepôt A - Rayon 3">
                <input type="number" class="ajout-input emplacement-qte" placeholder="Qté" min="0">
                <button class="emplacement-supprimer" title="Supprimer" disabled>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        `;
        compteurEmplacement = 1;
    }

    // Quantité totale
    const valeurQteTotale = document.getElementById("valeur-quantite-totale");
    if (valeurQteTotale) valeurQteTotale.textContent = "0";

    // Qté min/max
    const inputQteMin = document.getElementById("input-qte-min");
    const inputQteMax = document.getElementById("input-qte-max");
    if (inputQteMin) inputQteMin.value = "";
    if (inputQteMax) inputQteMax.value = "";

    // Prix
    const lignesPrix = document.querySelectorAll("#ecran-ajout-produit .ajout-ligne");
    if (lignesPrix.length >= 2) {
        const derniereLigne = lignesPrix[lignesPrix.length - 1];
        const inputsDerniereLigne = derniereLigne.querySelectorAll(".ajout-input");
        inputsDerniereLigne.forEach(input => { input.value = ""; });
    }

    // Section prix résumé
    const prixValeurs = document.querySelectorAll("#ecran-ajout-produit .ajout-prix-valeur");
    prixValeurs.forEach(el => {
        el.textContent = el.classList.contains("positif") ?
            (el.textContent.includes("%") ? "0%" : "0.00 $") : "0.00 $";
    });

    // Notes
    const textareaNotes = document.querySelector("#ecran-ajout-produit .ajout-formulaire textarea");
    if (textareaNotes) textareaNotes.value = "";

    // Photo
    supprimerImageProduit_photoProduit();
}

// ==================== CALCUL PRIX TEMPS RÉEL ====================

function calculerEtAfficherPrix() {
    const lignesPrix = document.querySelectorAll("#ecran-ajout-produit .ajout-ligne");
    if (lignesPrix.length < 2) return;

    const derniereLigne = lignesPrix[lignesPrix.length - 1];
    const inputsDerniereLigne = derniereLigne.querySelectorAll(".ajout-input");
    if (inputsDerniereLigne.length < 2) return;

    const prixAchat = parseFloat(inputsDerniereLigne[0].value) || 0;
    const prixVente = parseFloat(inputsDerniereLigne[1].value) || 0;
    const quantiteTotale = parseInt(document.getElementById("valeur-quantite-totale").textContent) || 0;

    const valeurAchat = prixAchat * quantiteTotale;
    const valeurVente = prixVente * quantiteTotale;
    const benefice = valeurVente - valeurAchat;
    const marge = valeurVente > 0 ? ((benefice / valeurVente) * 100) : 0;

    const prixValeurs = document.querySelectorAll("#ecran-ajout-produit .ajout-prix-valeur");

    if (prixValeurs.length >= 4) {
        const deviseSymbole = entrepriseActuelle?.devise || "$";
        prixValeurs[0].textContent = `${valeurAchat.toFixed(2)} ${deviseSymbole}`;
        prixValeurs[1].textContent = `${valeurVente.toFixed(2)} ${deviseSymbole}`;
        prixValeurs[2].textContent = `${benefice.toFixed(2)} ${deviseSymbole}`;
        prixValeurs[2].className = `ajout-prix-valeur ${benefice >= 0 ? 'positif' : 'negatif'}`;
        prixValeurs[3].textContent = `${marge.toFixed(1)}%`;
        prixValeurs[3].className = `ajout-prix-valeur ${marge >= 0 ? 'positif' : 'negatif'}`;
    }
}

// ==================== DÉTAILS PRODUIT — AFFICHAGE DYNAMIQUE ====================

async function afficherDetailsProduit(produitId) {
    produitSelectionneId = produitId;

    const { data: produit, error } = await clientSupabase
        .rpc("recuperer_details_produit", {
            p_produit_id: produitId
        });

    if (error || !produit) {
        console.error("Erreur chargement détails produit :", error);
        afficherMessageErreur("Impossible de charger les détails du produit.");
        return;
    }

    console.log("Détails produit :", produit);

    // STOCKER le produit pour le modal mouvement
    produitActuelDetails = produit;
    stockGlobalActuel = produit.quantite_totale || 0;

    const deviseSymbole = entrepriseActuelle?.devise || "$";

    // Image
    const zoneImage = document.querySelector("#ecran-details-produit .details-image");
    if (zoneImage) {
        if (produit.photo_url) {
            zoneImage.innerHTML = `<img src="${produit.photo_url}?t=${Date.now()}" alt="${produit.nom}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" onerror="this.outerHTML='<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'9\\' cy=\\'9\\' r=\\'2\\'/><path d=\\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\\'/></svg>'" />`;
        } else {
            zoneImage.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>`;
        }
    }

    // Nom et code
    const nomEl = document.querySelector("#ecran-details-produit .details-nom");
    const codeEl = document.querySelector("#ecran-details-produit .details-code");
    if (nomEl) nomEl.textContent = produit.nom;
    if (codeEl) {
        const parties = [produit.code, produit.code_barres].filter(Boolean);
        codeEl.textContent = parties.length > 0 ? parties.join(" | ") : "Aucun code";
    }

    // Informations de stock
    const statutTexte = obtenirStatutTexte(produit.statut);
const statutCouleur = {
    nul: "var(--erreur, red)",
    faible: "var(--avertissement, orange)",
    normal: "var(--succes)",
    eleve: "var(--info, blue)",
    // Rétrocompatibilité
    rupture: "var(--erreur, red)",
    stock: "var(--succes)",
    surstock: "var(--info, blue)"
};


    const contenusDetails = document.querySelector("#ecran-details-produit .details-contenu");

    const emplacements = Array.isArray(produit.emplacements) ? produit.emplacements : [];
    const valeurAchat = produit.prix_achat * produit.quantite_totale;
    const valeurVente = produit.prix_vente * produit.quantite_totale;
    const benefice = valeurVente - valeurAchat;
    const marge = valeurVente > 0 ? ((benefice / valeurVente) * 100) : 0;

    const dateCreation = produit.cree_le ? new Date(produit.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "—";
    const dateModification = produit.modifie_le ? new Date(produit.modifie_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "—";

        if (contenusDetails) {
        // Déterminer si on peut afficher un code-barres
        const codeBarresDetail = produit.code_barres || produit.code || null;
        const formatDetail = produit.format_code_barres || null;
        let formatEffectifDetail = formatDetail;
        if ((!formatEffectifDetail || formatEffectifDetail === "AUTO") && codeBarresDetail) {
            formatEffectifDetail = detecterFormatCodeProduit(codeBarresDetail);
        }

        const afficherEtiquetteDetail = !!codeBarresDetail && !!formatEffectifDetail;
        const nomFormatDetail = formatsCodeBarresCodeProduit[formatEffectifDetail]?.nom || formatEffectifDetail || "";

        contenusDetails.innerHTML = `
            <h2 class="details-nom">${produit.nom}</h2>
            <p class="details-code">${[produit.code, produit.code_barres].filter(Boolean).join(" | ") || "Aucun code"}</p>

            ${afficherEtiquetteDetail ? `
            <div class="details-section details-etiquette-section-codeProduit">
                <h4 class="details-section-titre">Étiquette code-barres</h4>
                <div class="details-etiquette-carte-codeProduit">
                    <div class="details-etiquette-contenu-codeProduit" id="details-etiquette-contenu-codeProduit">
                        <div class="details-etiquette-nom-codeProduit">${produit.nom}</div>
                        <svg id="details-etiquette-svg-codeProduit"></svg>
                        <div class="details-etiquette-badge-codeProduit">${nomFormatDetail}</div>
                    </div>
                    <button class="btn-exporter-etiquette-codeProduit" id="btn-exporter-etiquette-codeProduit">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Exporter l'étiquette</span>
                    </button>
                </div>
            </div>
            ` : ''}

            <div class="details-section">
                <h4 class="details-section-titre">Informations de stock</h4>
                <div class="details-grille">
                    <div class="details-item">
                        <div class="details-item-label">Quantité totale</div>
                        <div class="details-item-valeur">${produit.quantite_totale} unités</div>
                    </div>
                    <div class="details-item">
                        <div class="details-item-label">Statut</div>
                        <div class="details-item-valeur" style="color:${statutCouleur[produit.statut] || 'var(--succes)'}">${statutTexte}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-item-label">Stock min.</div>
                        <div class="details-item-valeur">${produit.quantite_min} unités</div>
                    </div>
                    <div class="details-item">
                        <div class="details-item-label">Stock max.</div>
                        <div class="details-item-valeur">${produit.quantite_max} unités</div>
                    </div>
                </div>
            </div>

            <div class="details-section">
                <h4 class="details-section-titre">Prix unitaires</h4>
                <div class="details-grille">
                    <div class="details-item">
                        <div class="details-item-label">Prix d'achat</div>
                        <div class="details-item-valeur">${parseFloat(produit.prix_achat).toFixed(2)} ${deviseSymbole}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-item-label">Prix de vente</div>
                        <div class="details-item-valeur">${parseFloat(produit.prix_vente).toFixed(2)} ${deviseSymbole}</div>
                    </div>
                </div>
            </div>

            <div class="details-section">
                <h4 class="details-section-titre">Valorisation du stock</h4>
                <div class="carte-valorisation-details-produit">
                    <div class="ligne-valorisation-details-produit">
                        <div class="colonne-valorisation-details-produit">
                            <span class="etiquette-valorisation-details-produit">Valeur d'achat</span>
                            <span class="montant-valorisation-details-produit">${valeurAchat.toFixed(2)} ${deviseSymbole}</span>
                        </div>
                        <div class="separateur-valorisation-details-produit"></div>
                        <div class="colonne-valorisation-details-produit">
                            <span class="etiquette-valorisation-details-produit">Valeur de vente</span>
                            <span class="montant-valorisation-details-produit">${valeurVente.toFixed(2)} ${deviseSymbole}</span>
                        </div>
                    </div>
                    <div class="barre-marge-details-produit">
                        <div class="barre-marge-remplissage-details-produit" style="width: ${Math.max(0, Math.min(100, marge)).toFixed(1)}%"></div>
                    </div>
                    <div class="ligne-benefice-details-produit">
                        <div class="info-benefice-details-produit">
                            <span class="etiquette-benefice-details-produit">Bénéfice potentiel</span>
                            <span class="montant-benefice-details-produit">${benefice >= 0 ? '+' : ''} ${benefice.toFixed(2)} ${deviseSymbole}</span>
                        </div>
                        <div class="badge-marge-details-produit">${marge.toFixed(1)} %</div>
                    </div>
                </div>
            </div>

            ${emplacements.length > 0 ? `
            <div class="details-section">
                <h4 class="details-section-titre">Emplacements</h4>
                <div class="details-grille">
                    ${emplacements.map(e => `
                        <div class="details-item">
                            <div class="details-item-label">${e.nom}</div>
                            <div class="details-item-valeur">${e.quantite} unités</div>
                        </div>
                    `).join("")}
                </div>
            </div>
            ` : ''}

            <div class="details-section">
                <h4 class="details-section-titre">Informations supplémentaires</h4>
                <div class="details-grille">
                    <div class="details-item">
                        <div class="details-item-label">Catégorie</div>
                        <div class="details-item-valeur">${produit.categorie_nom || 'Sans catégorie'}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-item-label">Date d'ajout</div>
                        <div class="details-item-valeur" style="font-size:14px">${dateCreation}</div>
                    </div>
                    <div class="details-item">
                        <div class="details-item-label">Dernière modif.</div>
                        <div class="details-item-valeur" style="font-size:14px">${dateModification}</div>
                    </div>
                </div>
            </div>

            ${produit.notes ? `
            <div class="details-section">
                <h4 class="details-section-titre">Notes</h4>
                <div class="bloc-note-details-produit">
                    <p class="texte-note-details-produit">${produit.notes}</p>
                </div>
            </div>
            ` : ''}

            <button class="details-modifier-btn">Modifier le produit</button>
            <button class="details-supprimer-btn" id="btn-supprimer-produit">Supprimer le produit</button>
        `;

        // Générer le code-barres dans les détails
        if (afficherEtiquetteDetail) {
            const svgDetailCB = document.getElementById("details-etiquette-svg-codeProduit");
            if (svgDetailCB) {
                const succesDetail = genererCodeBarreSvgCodeProduit(svgDetailCB, codeBarresDetail, formatEffectifDetail);
                if (!succesDetail) {
                    // Fallback CODE128
                    genererCodeBarreSvgCodeProduit(svgDetailCB, codeBarresDetail, "CODE128");
                }
            }

            // Événement bouton export
            const btnExporter = document.getElementById("btn-exporter-etiquette-codeProduit");
            if (btnExporter) {
                btnExporter.addEventListener("click", () => {
                    exporterEtiquetteCodeProduit(produit.nom, codeBarresDetail, formatEffectifDetail);
                });
            }
        }

        // Rattacher l'événement suppression
        const btnSupprimer = document.getElementById("btn-supprimer-produit");
        if (btnSupprimer) {
            btnSupprimer.addEventListener("click", async () => {
                await confirmerSupprimerProduit(produit.id, produit.nom);
            });
        }

        appliquerVisibiliteRole();
    }


    afficherEcran("ecran-details-produit");
}


async function confirmerSupprimerProduit(produitId, nomProduit) {
    const confirmer = confirm(`Supprimer le produit "${nomProduit}" ? Cette action est irréversible.`);
    if (!confirmer) return;

    const { data, error } = await clientSupabase
        .rpc("supprimer_produit", {
            p_produit_id: produitId
        });

    if (error) {
        console.error("Erreur suppression produit :", error);
        afficherMessageErreur("Impossible de supprimer le produit.");
        return;
    }

    afficherMessageSucces(`Produit "${nomProduit}" supprimé.`);

    produitSelectionneId = null;

    await chargerProduitsEntreprise();
    rendreProduits();
    
        // Rafraîchir les notifications
    await chargerNotificationsStock();
    rendreNotificationsStock();


    afficherEcran("ecran-produits");
}

// ==================== FILTRAGE ONGLETS PRODUITS ====================

function filtrerProduitsParOnglet(filtre) {
    filtreOngletActuel = filtre;

    if (filtre === 'tous') {
        return produitsEntreprise;
    }

    return produitsEntreprise.filter(p => {
        if (filtre === 'nul') return p.statut === 'nul' || p.statut === 'rupture';
        if (filtre === 'faible') return p.statut === 'faible';
        if (filtre === 'normal') return p.statut === 'normal' || p.statut === 'stock';
        if (filtre === 'eleve') return p.statut === 'eleve' || p.statut === 'surstock';
        return true;
    });
}


function mettreAJourCompteursOnglets() {
    const total = produitsEntreprise.length;
    const nul = produitsEntreprise.filter(p => p.statut === 'nul' || p.statut === 'rupture').length;
    const faible = produitsEntreprise.filter(p => p.statut === 'faible').length;
    const normal = produitsEntreprise.filter(p => p.statut === 'normal' || p.statut === 'stock').length;
    const eleve = produitsEntreprise.filter(p => p.statut === 'eleve' || p.statut === 'surstock').length;

    const onglets = document.querySelectorAll("#ecran-produits .onglet-btn");
    if (onglets.length >= 5) {
        onglets[0].innerHTML = `Tous <span class="onglet-nombre">${total}</span>`;
        onglets[1].innerHTML = `Nul <span class="onglet-nombre">${nul}</span>`;
        onglets[2].innerHTML = `Faible <span class="onglet-nombre">${faible}</span>`;
        onglets[3].innerHTML = `Normal <span class="onglet-nombre">${normal}</span>`;
        onglets[4].innerHTML = `Élevé <span class="onglet-nombre">${eleve}</span>`;
    }
}


// ==================== RECHERCHE PRODUITS ====================

function rechercherProduits(terme) {
    const termeMin = terme.toLowerCase().trim();

    if (!termeMin) {
        return filtrerProduitsParOnglet(filtreOngletActuel);
    }

    const produitsFiltres = filtrerProduitsParOnglet(filtreOngletActuel);

    return produitsFiltres.filter(p => {
        return (
            (p.nom && p.nom.toLowerCase().includes(termeMin)) ||
            (p.code && p.code.toLowerCase().includes(termeMin)) ||
            (p.code_barres && p.code_barres.toLowerCase().includes(termeMin)) ||
            (p.categorie_nom && p.categorie_nom.toLowerCase().includes(termeMin))
        );
    });
}


        // ==================== RENDU ====================
        function rendreMouvementsRecents() {
            const conteneur = document.getElementById("mouvements-recents");
            if (!conteneur) return;
            
            conteneur.innerHTML = donneesHistorique.slice(0, 4).map(m => {
                const iconeClass = m.type === "entree" ? "entree" : m.type === "sortie" ? "sortie" : "inventaire";
                const iconePath = m.type === "entree" 
                    ? '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'
                    : m.type === "sortie"
                    ? '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>'
                    : '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>';
                
                return `
                    <div class="mouvement-item">
                        <div class="mouvement-icone ${iconeClass}">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconePath}</svg>
                        </div>
                        <div class="mouvement-infos">
                            <div class="mouvement-produit">${m.produit}</div>
                            <div class="mouvement-detail">${m.motif} - ${m.utilisateur}</div>
                        </div>
                        <div class="mouvement-quantite ${m.type === "entree" ? "positif" : "negatif"}">
                            ${m.type === "entree" ? "+" : "-"}${m.quantite}
                        </div>
                    </div>
                `;
            }).join("");
        }

        function rendreProduits(produitsAfficher = null) {
    const conteneur = document.getElementById("produits-liste");
    if (!conteneur) return;

    const produits = produitsAfficher || filtrerProduitsParOnglet(filtreOngletActuel);

    mettreAJourCompteursOnglets();

    if (!produits || produits.length === 0) {
        conteneur.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--texte-secondaire);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;margin-bottom:1rem;opacity:0.4;">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <p style="font-size:0.95rem;font-weight:500;">Aucun produit</p>
                <p style="font-size:0.8rem;margin-top:0.25rem;">Ajoutez votre premier produit avec le bouton +</p>
            </div>
        `;
        return;
    }

    // Grouper par catégorie
    const categories = {};
    produits.forEach(p => {
        const cat = p.categorie_nom || "Sans catégorie";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(p);
    });

    conteneur.innerHTML = Object.entries(categories).map(([cat, produitsCat]) => `
        <div class="categorie-section">
            <div class="categorie-entete">
                <div class="categorie-gauche">
                    <span class="categorie-nom">${cat}</span>
                    <span class="categorie-nombre">${produitsCat.length}</span>
                </div>
                <div class="categorie-toggle">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="categorie-produits">
                ${produitsCat.map(p => `
                    <div class="produit-carte" data-id="${p.id}">
                        <div class="produit-image">
                            ${p.photo_url
                                ? `<img src="${p.photo_url}?t=${Date.now()}" alt="${p.nom}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.outerHTML='<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'9\\' cy=\\'9\\' r=\\'2\\'/><path d=\\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\\'/></svg>'" />`
                                : `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="9" cy="9" r="2"/>
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                </svg>`
                            }
                        </div>
                        <div class="produit-infos">
                            <div class="produit-nom">${p.nom}</div>
                            <div class="produit-code">${p.code || '—'}</div>
                        </div>
                        <div class="produit-droite">
                            <div class="produit-quantite">${p.quantite_totale}</div>
                            <span class="produit-statut ${obtenirStatutClass(p.statut)}">${obtenirStatutTexte(p.statut)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");

    // Toggle catégories
    conteneur.querySelectorAll(".categorie-entete").forEach(entete => {
        entete.addEventListener("click", () => {
            entete.closest(".categorie-section").classList.toggle("ferme");
        });
    });

    // Clic produit → détails dynamiques
    conteneur.querySelectorAll(".produit-carte").forEach(carte => {
        carte.addEventListener("click", async () => {
            const produitId = carte.dataset.id;
            if (produitId) {
                await afficherDetailsProduit(produitId);
            }
        });
    });
}


        function rendreHistorique() {
    const conteneur = document.getElementById("historique-liste");
    if (!conteneur) return;

    if (!donneesHistorique || donneesHistorique.length === 0) {
        conteneur.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--texte-secondaire);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;margin-bottom:1rem;opacity:0.4;">
                    <path d="M12 8v4l3 3"/>
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                <p style="font-size:0.95rem;font-weight:500;">Aucun mouvement</p>
                <p style="font-size:0.8rem;margin-top:0.25rem;">Les entrées, sorties et inventaires apparaîtront ici</p>
            </div>
        `;
        mettreAJourCompteursHistorique();
        return;
    }

    const parDate = {};
    donneesHistorique.forEach(h => {
        const dateClef = h.date || 'inconnue';
        if (!parDate[dateClef]) parDate[dateClef] = [];
        parDate[dateClef].push(h);
    });

    conteneur.innerHTML = Object.entries(parDate).map(([date, items]) => `
        <div class="historique-jour">
            <div class="historique-date">${formaterDate(date)}</div>
            ${items.map(h => {
                const iconeClass = h.type === "entree" ? "entree" : h.type === "sortie" ? "sortie" : "inventaire";
                const iconePath = h.type === "entree"
                    ? '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'
                    : h.type === "sortie"
                    ? '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>'
                    : '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>';
                const typeTexte = h.type === "entree" ? "Entrée" : h.type === "sortie" ? "Sortie" : "Inventaire";

                const variationGlobale = h.apres - h.avant;

                return `
                    <div class="historique-item">
                        <div class="historique-item-entete">
                            <div class="historique-type-icone ${iconeClass}">
                                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconePath}</svg>
                            </div>
                            <span class="historique-type">${typeTexte}</span>
                            <span class="historique-heure">${h.heure || ''}</span>
                        </div>
                        <div class="historique-produit">${h.produit || ''}</div>
                        <div class="historique-details">
                            <span class="historique-detail">Motif: ${h.motif || '—'}</span>
                            <span class="historique-detail">Par: ${h.utilisateur || '—'}</span>
                            <span class="historique-detail">Emplacement: ${h.emplacement || '—'}</span>
                            ${h.note ? `<span class="historique-detail">Note: ${h.note}</span>` : ""}
                        </div>
                        <div class="historique-quantites">
                            <span class="quantite-badge avant">Avant: ${h.avant}</span>
                            <span class="quantite-badge variation ${variationGlobale > 0 ? 'positif' : variationGlobale < 0 ? 'negatif' : 'neutre'}">${variationGlobale > 0 ? '+' : ''}${variationGlobale}</span>
                            <span class="quantite-badge apres">Après: ${h.apres}</span>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `).join("");

    mettreAJourCompteursHistorique();
}


        function rendreNotifications() {
    rendreNotificationsStock();
}

function obtenirDonneesStatiquesRapport(typeRapport) {
    const donneesExemplesRapport = {
        surstock: [
            { code: "PRD-001", nom: "Cahier A4 96 pages", categorie: "Fournitures", quantite: 250, max: 150, excedent: 100, prixAchat: 1.50 },
            { code: "PRD-008", nom: "Stylo bille bleu", categorie: "Fournitures", quantite: 500, max: 300, excedent: 200, prixAchat: 0.75 },
            { code: "PRD-015", nom: "Ramette papier A4", categorie: "Papeterie", quantite: 180, max: 100, excedent: 80, prixAchat: 4.20 },
            { code: "PRD-022", nom: "Classeur levier", categorie: "Rangement", quantite: 95, max: 60, excedent: 35, prixAchat: 3.80 },
            { code: "PRD-029", nom: "Cartouche encre noire", categorie: "Impression", quantite: 70, max: 40, excedent: 30, prixAchat: 12.50 },
            { code: "PRD-033", nom: "Agrafeuse métal", categorie: "Fournitures", quantite: 45, max: 25, excedent: 20, prixAchat: 6.90 },
            { code: "PRD-041", nom: "Chemise cartonnée", categorie: "Rangement", quantite: 200, max: 120, excedent: 80, prixAchat: 0.95 },
            { code: "PRD-048", nom: "Marqueur permanent", categorie: "Fournitures", quantite: 160, max: 100, excedent: 60, prixAchat: 1.80 }
        ],
        ventes: [
            { produit: "Cahier A4 96 pages", quantite: 45, prixUnitaire: 2.50, prixTotal: 112.50 },
            { produit: "Stylo bille bleu", quantite: 120, prixUnitaire: 1.50, prixTotal: 180.00 },
            { produit: "Ramette papier A4", quantite: 30, prixUnitaire: 6.80, prixTotal: 204.00 },
            { produit: "Cartouche encre noire", quantite: 15, prixUnitaire: 18.90, prixTotal: 283.50 },
            { produit: "Classeur levier", quantite: 22, prixUnitaire: 5.90, prixTotal: 129.80 },
            { produit: "Chemise cartonnée", quantite: 60, prixUnitaire: 1.80, prixTotal: 108.00 },
            { produit: "Agrafeuse métal", quantite: 8, prixUnitaire: 9.90, prixTotal: 79.20 },
            { produit: "Marqueur permanent", quantite: 35, prixUnitaire: 2.90, prixTotal: 101.50 }
        ],
        achats: [
            { produit: "Cahier A4 96 pages", quantite: 200, prixUnitaire: 1.50, prixTotal: 300.00 },
            { produit: "Stylo bille bleu", quantite: 500, prixUnitaire: 0.75, prixTotal: 375.00 },
            { produit: "Ramette papier A4", quantite: 100, prixUnitaire: 4.20, prixTotal: 420.00 },
            { produit: "Cartouche encre noire", quantite: 40, prixUnitaire: 12.50, prixTotal: 500.00 },
            { produit: "Classeur levier", quantite: 60, prixUnitaire: 3.80, prixTotal: 228.00 },
            { produit: "Agrafeuse métal", quantite: 25, prixUnitaire: 6.90, prixTotal: 172.50 },
            { produit: "Chemise cartonnée", quantite: 150, prixUnitaire: 0.95, prixTotal: 142.50 },
            { produit: "Marqueur permanent", quantite: 100, prixUnitaire: 1.80, prixTotal: 180.00 }
        ],
        pertes: [
            { produit: "Ramette papier A4", quantite: 5, prixUnitaire: 4.20, prixTotal: 21.00 },
            { produit: "Cartouche encre noire", quantite: 3, prixUnitaire: 12.50, prixTotal: 37.50 },
            { produit: "Cahier A4 96 pages", quantite: 10, prixUnitaire: 1.50, prixTotal: 15.00 },
            { produit: "Stylo bille bleu", quantite: 25, prixUnitaire: 0.75, prixTotal: 18.75 },
            { produit: "Agrafeuse métal", quantite: 2, prixUnitaire: 6.90, prixTotal: 13.80 }
        ]
    };

    return donneesExemplesRapport[typeRapport] || [];
}


        function rendreTableauRapport(typeRapport) {
    const conteneur = document.getElementById("rapport-tableau-conteneur");
    if (!conteneur) return;

    let tableauHTML = "";

    // ==================== RAPPORTS D'ACTUALITÉ ====================

    if (typeRapport === "global" || typeRapport === "stock") {
        const produits = typeRapport === "stock" ? donneesProduits.filter(p => p.statut === "stock" || p.statut === "normal") : donneesProduits;
        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Code</th>
                        <th>Désignation</th>
                        <th>Catégorie</th>
                        <th>Qté</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>P.Achat</th>
                        <th>P.Vente</th>
                        <th>Valeur achat</th>
                        <th>Valeur vente</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${produits.map((p, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td style="font-family:JetBrains Mono,monospace;font-size:11px">${p.code}</td>
                            <td>${p.nom}</td>
                            <td>${p.categorie}</td>
                            <td style="font-weight:600">${p.quantite}</td>
                            <td>${p.min}</td>
                            <td>${p.max}</td>
                            <td>${p.prixAchat.toFixed(2)} $</td>
                            <td>${p.prixVente.toFixed(2)} $</td>
                            <td>${(p.quantite * p.prixAchat).toFixed(2)} $</td>
                            <td>${(p.quantite * p.prixVente).toFixed(2)} $</td>
                            <td><span class="produit-statut ${obtenirStatutClass(p.statut)}">${obtenirStatutTexte(p.statut)}</span></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Valeur totale du stock</span>
                <span class="rapport-total-valeur">${produits.reduce((acc, p) => acc + p.quantite * p.prixAchat, 0).toFixed(2)} $</span>
            </div>
        `;
    } else if (typeRapport === "faible") {
        const produits = donneesProduits.filter(p => p.statut === "faible");
        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Code</th>
                        <th>Désignation</th>
                        <th>Catégorie</th>
                        <th>Qté actuelle</th>
                        <th>Qté min</th>
                        <th>À commander</th>
                        <th>Valeur achat</th>
                    </tr>
                </thead>
                <tbody>
                    ${produits.map((p, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td style="font-family:JetBrains Mono,monospace;font-size:11px">${p.code}</td>
                            <td>${p.nom}</td>
                            <td>${p.categorie}</td>
                            <td style="font-weight:600;color:var(--attention)">${p.quantite}</td>
                            <td>${p.min}</td>
                            <td style="color:var(--info)">${p.min - p.quantite}</td>
                            <td>${((p.min - p.quantite) * p.prixAchat).toFixed(2)} $</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Valeur à commander</span>
                <span class="rapport-total-valeur">${produits.reduce((acc, p) => acc + (p.min - p.quantite) * p.prixAchat, 0).toFixed(2)} $</span>
            </div>
        `;
    } else if (typeRapport === "rupture") {
        const produits = donneesProduits.filter(p => p.statut === "rupture" || p.statut === "nul");
        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Code</th>
                        <th>Désignation</th>
                        <th>Catégorie</th>
                        <th>Qté min</th>
                        <th>Qté à commander</th>
                        <th>Valeur achat estimée</th>
                    </tr>
                </thead>
                <tbody>
                    ${produits.map((p, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td style="font-family:JetBrains Mono,monospace;font-size:11px">${p.code}</td>
                            <td>${p.nom}</td>
                            <td>${p.categorie}</td>
                            <td>${p.min}</td>
                            <td style="color:var(--danger);font-weight:600">${p.min}</td>
                            <td>${(p.min * p.prixAchat).toFixed(2)} $</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Valeur à commander (urgent)</span>
                <span class="rapport-total-valeur" style="color:var(--danger)">${produits.reduce((acc, p) => acc + p.min * p.prixAchat, 0).toFixed(2)} $</span>
            </div>
        `;

    // ==================== SURSTOCK (NOUVEAU) ====================

    } else if (typeRapport === "surstock") {
        const produits = donneesProduits.filter(p => p.statut === "eleve" || p.statut === "surstock");
        const donneesStatiquesRapport = produits.length > 0 ? produits : obtenirDonneesStatiquesRapport("surstock");
        const estStatiqueRapport = produits.length === 0;

        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Code</th>
                        <th>Désignation</th>
                        <th>Catégorie</th>
                        <th>Qté actuelle</th>
                        <th>Qté max</th>
                        <th>Excédent</th>
                        <th>P.Achat</th>
                        <th>Valeur excédent</th>
                    </tr>
                </thead>
                <tbody>
                    ${donneesStatiquesRapport.map((p, i) => {
                        const excedent = estStatiqueRapport ? p.excedent : Math.max(0, p.quantite - p.max);
                        const prixAchat = estStatiqueRapport ? p.prixAchat : p.prixAchat;
                        const valeurExcedent = excedent * prixAchat;
                        return `
                            <tr>
                                <td>${i + 1}</td>
                                <td style="font-family:JetBrains Mono,monospace;font-size:11px">${p.code}</td>
                                <td>${p.nom}</td>
                                <td>${p.categorie}</td>
                                <td style="font-weight:600;color:var(--info)">${estStatiqueRapport ? p.quantite : p.quantite}</td>
                                <td>${estStatiqueRapport ? p.max : p.max}</td>
                                <td style="color:var(--info);font-weight:600">+${excedent}</td>
                                <td>${prixAchat.toFixed(2)} $</td>
                                <td style="font-weight:600">${valeurExcedent.toFixed(2)} $</td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Valeur totale en excédent</span>
                <span class="rapport-total-valeur" style="color:var(--info)">${donneesStatiquesRapport.reduce((acc, p) => {
                    const excedent = estStatiqueRapport ? p.excedent : Math.max(0, p.quantite - p.max);
                    return acc + excedent * p.prixAchat;
                }, 0).toFixed(2)} $</span>
            </div>
        `;

    // ==================== VENTES (CORRIGÉ) ====================

    } else if (typeRapport === "ventes") {
        const donneesStatiquesRapport = obtenirDonneesStatiquesRapport("ventes");

        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Produit</th>
                        <th>Qté vendue</th>
                        <th>P.U vente</th>
                        <th>Prix total</th>
                    </tr>
                </thead>
                <tbody>
                    ${donneesStatiquesRapport.sort((a, b) => b.prixTotal - a.prixTotal).map((v, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${v.produit}</td>
                            <td style="font-weight:600">${v.quantite}</td>
                            <td>${v.prixUnitaire.toFixed(2)} $</td>
                            <td style="color:var(--succes);font-weight:600">${v.prixTotal.toFixed(2)} $</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Total des ventes</span>
                <span class="rapport-total-valeur" style="color:var(--succes)">${donneesStatiquesRapport.reduce((acc, v) => acc + v.prixTotal, 0).toFixed(2)} $</span>
            </div>
        `;

    // ==================== ACHATS (CORRIGÉ) ====================

    } else if (typeRapport === "achats") {
        const donneesStatiquesRapport = obtenirDonneesStatiquesRapport("achats");

        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Produit</th>
                        <th>Qté achetée</th>
                        <th>P.U achat</th>
                        <th>Prix total</th>
                    </tr>
                </thead>
                <tbody>
                    ${donneesStatiquesRapport.sort((a, b) => b.prixTotal - a.prixTotal).map((a, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${a.produit}</td>
                            <td style="font-weight:600">${a.quantite}</td>
                            <td>${a.prixUnitaire.toFixed(2)} $</td>
                            <td style="color:#6c5ce7;font-weight:600">${a.prixTotal.toFixed(2)} $</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Total des achats</span>
                <span class="rapport-total-valeur" style="color:#6c5ce7">${donneesStatiquesRapport.reduce((acc, a) => acc + a.prixTotal, 0).toFixed(2)} $</span>
            </div>
        `;

    // ==================== PERTES (CORRIGÉ) ====================

    } else if (typeRapport === "pertes") {
        const donneesStatiquesRapport = obtenirDonneesStatiquesRapport("pertes");

        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Produit</th>
                        <th>Qté perdue</th>
                        <th>P.U achat</th>
                        <th>Prix total</th>
                    </tr>
                </thead>
                <tbody>
                    ${donneesStatiquesRapport.sort((a, b) => b.prixTotal - a.prixTotal).map((p, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${p.produit}</td>
                            <td style="font-weight:600">${p.quantite}</td>
                            <td>${p.prixUnitaire.toFixed(2)} $</td>
                            <td style="color:var(--danger);font-weight:600">${p.prixTotal.toFixed(2)} $</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="rapport-total">
                <span class="rapport-total-label">Total des pertes</span>
                <span class="rapport-total-valeur" style="color:var(--danger)">${donneesStatiquesRapport.reduce((acc, p) => acc + p.prixTotal, 0).toFixed(2)} $</span>
            </div>
        `;

    // ==================== RAPPORT FINANCIER ====================

    } else if (typeRapport === "finance") {
        const donneeVentesFinanceRapport = obtenirDonneesStatiquesRapport("ventes");
        const donneeAchatsFinanceRapport = obtenirDonneesStatiquesRapport("achats");
        const donneePertesFinanceRapport = obtenirDonneesStatiquesRapport("pertes");

        const totalAchatsRapport = donneeAchatsFinanceRapport.reduce((acc, a) => acc + a.prixTotal, 0);
        const totalVentesRapport = donneeVentesFinanceRapport.reduce((acc, v) => acc + v.prixTotal, 0);
        const totalPertesRapport = donneePertesFinanceRapport.reduce((acc, p) => acc + p.prixTotal, 0);
        const beneficeRapport = totalVentesRapport - totalAchatsRapport - totalPertesRapport;
        const margeRapport = totalVentesRapport > 0 ? ((beneficeRapport / totalVentesRapport) * 100).toFixed(1) : 0;

        tableauHTML = `
            <table class="rapport-tableau">
                <thead>
                    <tr>
                        <th>Intitulé</th>
                        <th>Montant</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight:600">Total des achats</td>
                        <td style="color:#6c5ce7">${totalAchatsRapport.toFixed(2)} $</td>
                    </tr>
                    <tr>
                        <td style="font-weight:600">Total des ventes</td>
                        <td style="color:var(--succes)">${totalVentesRapport.toFixed(2)} $</td>
                    </tr>
                    <tr>
                        <td style="font-weight:600">Total des pertes</td>
                        <td style="color:var(--danger)">${totalPertesRapport.toFixed(2)} $</td>
                    </tr>
                    <tr style="background:var(--fond-tertiaire)">
                        <td style="font-weight:700">Bénéfice net</td>
                        <td style="font-weight:700;color:${beneficeRapport >= 0 ? 'var(--succes)' : 'var(--danger)'}">${beneficeRapport.toFixed(2)} $</td>
                    </tr>
                    <tr style="background:var(--fond-tertiaire)">
                        <td style="font-weight:700">Marge bénéficiaire</td>
                        <td style="font-weight:700;color:var(--accent)">${margeRapport}%</td>
                    </tr>
                </tbody>
            </table>
        `;
    }


    conteneur.innerHTML = tableauHTML;
}

        
         // ==================== FONCTIONS UTILITAIRES ENTREPRISE ====================
        function ouvrirPanneauEntreprise(panneau) {
            overlayEntreprise.classList.add('actif');
            panneau.classList.add('actif');
            document.body.style.overflow = 'hidden';
        }

        function fermerPanneauEntreprise(panneau) {
            overlayEntreprise.classList.remove('actif');
            panneau.classList.remove('actif');
            document.body.style.overflow = '';
        }

        function fermerTousPanneauxEntreprise() {
            overlayEntreprise.classList.remove('actif');
            panneauInvitationEntreprise.classList.remove('actif');
            panneauProfilEntreprise.classList.remove('actif');
            document.body.style.overflow = '';
        }

        function extrairePrenomEntreprise(nomComplet) {
            return nomComplet.split(' ')[0];
        }   
        
        // ==================== OUTILS UTILISATEUR ====================
function obtenirNomUtilisateurDepuisAuth(utilisateur) {
    if (!utilisateur) return "Utilisateur";

    const meta = utilisateur.user_metadata || {};
    return (
        meta.full_name ||
        meta.name ||
        meta.nom_complet ||
        (utilisateur.email ? utilisateur.email.split("@")[0] : "Utilisateur")
    );
}

function obtenirPhotoUtilisateurDepuisAuth(utilisateur) {
    if (!utilisateur) return null;

    const meta = utilisateur.user_metadata || {};
    return meta.avatar_url || meta.picture || null;
}

function afficherAvatarDansElement(idImage, idSvg, photoUrl) {
    const image = document.getElementById(idImage);
    const svg = document.getElementById(idSvg);

    if (!image || !svg) return;

    if (!photoUrl || photoUrl.trim() === "") {
        image.removeAttribute("src");
        image.style.display = "none";
        svg.style.display = "block";
        return;
    }

    const urlFinale = `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

    image.onload = () => {
        image.style.display = "block";
        svg.style.display = "none";
    };

    image.onerror = () => {
        console.error("Erreur chargement avatar :", photoUrl);
        image.removeAttribute("src");
        image.style.display = "none";
        svg.style.display = "block";
    };

    image.style.display = "none";
    svg.style.display = "block";
    image.src = urlFinale;
}

function afficherLogoDansElement(idImage, idSvg, logoUrl) {
    const image = document.getElementById(idImage);
    const svg = document.getElementById(idSvg);

    if (!image || !svg) return;

    if (!logoUrl || logoUrl.trim() === "") {
        image.removeAttribute("src");
        image.style.display = "none";
        svg.style.display = "block";
        return;
    }

    const urlFinale = `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

    image.onload = () => {
        image.style.display = "block";
        svg.style.display = "none";
    };

    image.onerror = () => {
        console.error("Erreur chargement logo entreprise :", logoUrl);
        image.removeAttribute("src");
        image.style.display = "none";
        svg.style.display = "block";
    };

    image.style.display = "none";
    svg.style.display = "block";
    image.src = urlFinale;
}

function remplirAvatarsUtilisateur() {
    const photoUtilisateur =
        profilActuel?.photo_url ||
        obtenirPhotoUtilisateurDepuisAuth(utilisateurActuel) ||
        null;

    console.log("Photo utilisateur utilisée :", photoUtilisateur);

    afficherAvatarDansElement("menu-avatar-img", "menu-avatar-svg", photoUtilisateur);
    afficherAvatarDansElement("entreprise-admin-avatar-img", "entreprise-admin-avatar-svg", photoUtilisateur);
}

function remplirLogosEntreprise() {
    const logoEntreprise = entrepriseActuelle?.logo_url || null;

    console.log("Logo entreprise utilisé :", logoEntreprise);

    afficherLogoDansElement("entreprise-logo-img", "entreprise-logo-svg", logoEntreprise);
    afficherLogoDansElement("accueil-logo-img", "accueil-logo-svg", logoEntreprise);
}

function afficherMessageErreur(message) {
    alert(message);
}

function afficherMessageSucces(message) {
    alert(message);
}

function convertirDataUrlEnBlob(dataUrl) {
    const parties = dataUrl.split(",");
    const mime = parties[0].match(/:(.*?);/)?.[1] || "image/webp";
    const binaire = atob(parties[1]);
    const longueur = binaire.length;
    const tableau = new Uint8Array(longueur);

    for (let i = 0; i < longueur; i++) {
        tableau[i] = binaire.charCodeAt(i);
    }

    return new Blob([tableau], { type: mime });
}

function chargerImageDepuisFichier(fichier) {
    return new Promise((resolve, reject) => {
        const lecteur = new FileReader();

        lecteur.onload = () => {
            const image = new Image();

            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = lecteur.result;
        };

        lecteur.onerror = reject;
        lecteur.readAsDataURL(fichier);
    });
}

async function compresserLogoEntreprise(fichier) {
    const image = await chargerImageDepuisFichier(fichier);

    const canvas = document.createElement("canvas");
    const contexte = canvas.getContext("2d");

    let largeur = image.width;
    let hauteur = image.height;

    // Pour un logo, 320px suffit largement dans la majorité des cas
    const dimensionMax = 320;

    if (largeur > hauteur) {
        if (largeur > dimensionMax) {
            hauteur = Math.round(hauteur * (dimensionMax / largeur));
            largeur = dimensionMax;
        }
    } else {
        if (hauteur > dimensionMax) {
            largeur = Math.round(largeur * (dimensionMax / hauteur));
            hauteur = dimensionMax;
        }
    }

    canvas.width = largeur;
    canvas.height = hauteur;

    contexte.clearRect(0, 0, largeur, hauteur);
    contexte.drawImage(image, 0, 0, largeur, hauteur);

    // Compression WebP optimisée logo
    let qualite = 0.82;
    let dataUrl = canvas.toDataURL("image/webp", qualite);
    let taille = calculerTailleDataUrl(dataUrl);

    // Cible max approximative : 35 Ko pour un logo propre et rapide
    while (taille > 35 * 1024 && qualite > 0.45) {
        qualite -= 0.08;
        dataUrl = canvas.toDataURL("image/webp", qualite);
        taille = calculerTailleDataUrl(dataUrl);
    }

    const blob = convertirDataUrlEnBlob(dataUrl);

    const fichierCompresse = new File(
        [blob],
        `logo-${Date.now()}.webp`,
        { type: "image/webp" }
    );

    return {
        fichier: fichierCompresse,
        previewUrl: dataUrl,
        largeur,
        hauteur,
        taille
    };
}

function calculerTailleDataUrl(dataUrl) {
    const base64 = dataUrl.split(",")[1] || "";
    return Math.round((base64.length * 3) / 4);
}

function afficherPreviewLogoEntreprise(source) {
    const image = document.getElementById("preview-logo-entreprise");
    const placeholder = document.getElementById("logo-upload-placeholder");

    if (!image || !placeholder) return;

    if (!source) {
        image.removeAttribute("src");
        image.style.display = "none";
        placeholder.style.display = "flex";
        return;
    }

    image.onload = () => {
        image.style.display = "block";
        placeholder.style.display = "none";
    };

    image.onerror = () => {
        image.removeAttribute("src");
        image.style.display = "none";
        placeholder.style.display = "flex";
    };

    image.src = source;
}

function obtenirLogoEntrepriseUrlAvecCacheBuster(url) {
    if (!url) return null;
    return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}
// ==================== AUTH ====================
async function connecterAvecGoogle() {
    const { error } = await clientSupabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        console.error("Erreur connexion Google :", error);
        afficherMessageErreur("Impossible de se connecter avec Google.");
    }
}

async function deconnecterUtilisateur() {
    const { error } = await clientSupabase.auth.signOut();

    if (error) {
        console.error("Erreur déconnexion :", error);
        afficherMessageErreur("Erreur lors de la déconnexion.");
        return;
    }

    sessionActuelle = null;
    utilisateurActuel = null;
    profilActuel = null;
    entrepriseActuelle = null;
    roleUtilisateurActuel = null;
    membresEntrepriseActuelle = [];

    afficherEcran("ecran-auth");
}


// ==================== PROFIL ====================
async function creerProfilSiInexistant(utilisateur) {
    if (!utilisateur) return null;

    const nomUtilisateur = obtenirNomUtilisateurDepuisAuth(utilisateur);
    const photoUtilisateur = obtenirPhotoUtilisateurDepuisAuth(utilisateur);

    console.log("Nom auth détecté :", nomUtilisateur);
    console.log("Photo auth détectée :", photoUtilisateur);

    const { data: profilExistant, error: erreurLecture } = await clientSupabase
        .from("profils")
        .select("*")
        .eq("id", utilisateur.id)
        .maybeSingle();

    if (erreurLecture) {
        console.error("Erreur lecture profil :", erreurLecture);
        throw erreurLecture;
    }

    const donneesProfil = {
        id: utilisateur.id,
        nom_complet: nomUtilisateur,
        email: utilisateur.email,
        photo_url: photoUtilisateur,
        entreprise_active_id: profilExistant?.entreprise_active_id || null
    };

    const { data: profilSauvegarde, error: erreurSauvegarde } = await clientSupabase
        .from("profils")
        .upsert(donneesProfil, { onConflict: "id" })
        .select()
        .single();

    if (erreurSauvegarde) {
        console.error("Erreur sauvegarde profil :", erreurSauvegarde);
        throw erreurSauvegarde;
    }

    console.log("Profil sauvegardé :", profilSauvegarde);

    return profilSauvegarde;
}

async function chargerProfilActuel() {
    if (!utilisateurActuel) return null;

    const { data, error } = await clientSupabase
        .from("profils")
        .select("*")
        .eq("id", utilisateurActuel.id)
        .maybeSingle();

    if (error) {
        console.error("Erreur chargement profil :", error);
        return null;
    }

    console.log("Profil chargé :", data);

    profilActuel = data || null;
    return data;
}

// ==================== ENTREPRISE ====================
// ==================== CHOIX ENTREPRISE ====================
function obtenirInitialesEntreprise(nom) {
    if (!nom || typeof nom !== "string") return "EN";

    return nom
        .trim()
        .split(" ")
        .filter(Boolean)
        .map(mot => mot[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function obtenirLibelleRoleEntreprise(role) {
    if (!role) return "Membre";

    const roleNormalise = String(role).toLowerCase();

    const libelles = {
        administrateur: "Admin",
        admin: "Admin",
        owner: "Admin",
        editeur: "Éditeur",
        coordinateur: "Coordinateur",
        auditeur: "Auditeur",
        operateur: "Opérateur",
        membre: "Membre"
    };

    return libelles[roleNormalise] || "Membre";
}


function rendreListeChoixEntreprise() {
    const conteneur = document.getElementById("choix-entreprise-liste");
    const btnContinuer = document.getElementById("btn-choix-entreprise-continuer");
    const texteHelper = document.getElementById("texte-choix-entreprise-helper");

    if (!conteneur || !btnContinuer || !texteHelper) return;

    const entrepriseSelectionneeId = profilActuel?.entreprise_active_id || null;

    if (!entreprisesUtilisateur || entreprisesUtilisateur.length === 0) {
        conteneur.innerHTML = `
            <div class="choix-entreprise-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l7-4 7 4v14"></path>
                    <path d="M9 10h.01"></path>
                    <path d="M15 10h.01"></path>
                    <path d="M9 14h.01"></path>
                    <path d="M15 14h.01"></path>
                </svg>
                <p>Aucune entreprise trouvée pour votre compte.</p>
            </div>
        `;

        btnContinuer.disabled = true;
        texteHelper.textContent = "Créez une entreprise pour continuer.";
        return;
    }

    conteneur.innerHTML = `
        <div class="choix-entreprise-company-list">
            ${entreprisesUtilisateur.map(entreprise => {
                const estActive = String(entreprise.id) === String(entrepriseSelectionneeId);
                const logoUrl = entreprise.logo_url ? `${entreprise.logo_url}${entreprise.logo_url.includes("?") ? "&" : "?"}t=${Date.now()}` : null;
                const role = obtenirLibelleRoleEntreprise(entreprise.role);

                return `
                    <div class="choix-entreprise-company-item ${estActive ? "actif" : ""}" data-entreprise-id="${entreprise.id}">
                        <div class="choix-entreprise-company-left">
                            <div class="choix-entreprise-company-logo">
                                ${
                                    logoUrl
                                        ? `<img src="${logoUrl}" alt="Logo ${entreprise.nom}" />`
                                        : obtenirInitialesEntreprise(entreprise.nom)
                                }
                            </div>

                            <div>
                                <div class="choix-entreprise-company-name">${entreprise.nom || "Entreprise"}</div>
                                <div class="choix-entreprise-company-role">${entreprise.description || "Aucune description"}</div>
                            </div>
                        </div>

                        <div class="choix-entreprise-company-right">
                            <div class="choix-entreprise-tag">${role}</div>
                            <div class="choix-entreprise-radio-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    document.querySelectorAll(".choix-entreprise-company-item").forEach(item => {
        item.addEventListener("click", async () => {
            const entrepriseId = item.dataset.entrepriseId;
            if (!entrepriseId) return;

            const succes = await definirEntrepriseActive(entrepriseId);
            if (!succes) return;

            rendreListeChoixEntreprise();
        });
    });

    btnContinuer.disabled = !entrepriseSelectionneeId;

    const entrepriseSelectionnee = entreprisesUtilisateur.find(
        entreprise => String(entreprise.id) === String(entrepriseSelectionneeId)
    );

    if (!entrepriseSelectionnee) {
        texteHelper.textContent = "Sélectionnez une entreprise pour continuer.";
    } else {
        texteHelper.textContent = `Entreprise sélectionnée : ${entrepriseSelectionnee.nom}`;
    }
}

async function chargerEntrepriseActive() {
    if (!profilActuel || !profilActuel.entreprise_active_id) {
        console.log("Aucune entreprise active dans le profil.");
        entrepriseActuelle = null;
        return null;
    }

    console.log("Chargement entreprise active ID :", profilActuel.entreprise_active_id);

    const { data, error } = await clientSupabase
        .from("entreprises")
        .select("*")
        .eq("id", profilActuel.entreprise_active_id)
        .maybeSingle();

    if (error) {
        console.error("Erreur chargement entreprise :", error);
        entrepriseActuelle = null;
        return null;
    }

    console.log("Entreprise chargée :", data);

    entrepriseActuelle = data || null;
    return entrepriseActuelle;
}

async function chargerEntreprisesUtilisateur() {
    if (!utilisateurActuel) {
        entreprisesUtilisateur = [];
        return [];
    }

    const { data, error } = await clientSupabase
        .rpc("recuperer_entreprises_utilisateur");

    if (error) {
        console.error("Erreur récupération entreprises utilisateur :", error);
        entreprisesUtilisateur = [];
        return [];
    }

    entreprisesUtilisateur = Array.isArray(data) ? data : [];

    console.log("Entreprises utilisateur récupérées via RPC :", entreprisesUtilisateur);

    return entreprisesUtilisateur;
}

async function definirEntrepriseActive(entrepriseId) {
    if (!utilisateurActuel || !entrepriseId) return false;

    const { data, error } = await clientSupabase
        .from("profils")
        .update({
            entreprise_active_id: entrepriseId
        })
        .eq("id", utilisateurActuel.id)
        .select()
        .single();

    if (error) {
        console.error("Erreur définition entreprise active :", error);
        afficherMessageErreur("Impossible de sélectionner cette entreprise.");
        return false;
    }

    profilActuel = data || profilActuel;

    await chargerContexteUtilisateurComplet();
    await chargerEntreprisesUtilisateur();

    remplirInterfaceUtilisateurEtEntreprise();

    return true;
}


async function chargerContexteUtilisateurComplet() {
    const { data, error } = await clientSupabase
        .rpc("recuperer_contexte_utilisateur");

    if (error) {
        console.error("Erreur récupération contexte utilisateur :", error);
        return null;
    }

    console.log("Contexte utilisateur récupéré :", data);

    profilActuel = data?.profil || null;
    entrepriseActuelle = data?.entreprise || null;
    roleUtilisateurActuel = data?.role || null;

    console.log("Rôle utilisateur actuel :", roleUtilisateurActuel);

    return data;
}

// ==================== VISIBILITÉ SELON LE RÔLE ====================

const PERMISSIONS_ROLES = {
    administrateur: {
        boutons: [
            "btn-ajout-produit",
            "btn-entree",
            "btn-sortie",
            "btn-inventaire"
        ],
        classes: [
            "details-modifier-btn",
            "details-supprimer-btn"
        ],
        admin: true  // voit les éléments admin
    },
    editeur: {
        boutons: [
            "btn-ajout-produit",
            "btn-entree",
            "btn-sortie",
            "btn-inventaire"
        ],
        classes: [
            "details-modifier-btn",
            "details-supprimer-btn"
        ],
        admin: false
    },
    coordinateur: {
        boutons: [
            "btn-entree",
            "btn-sortie",
            "btn-inventaire"
        ],
        classes: [],
        admin: false
    },
    auditeur: {
        boutons: [
            "btn-inventaire"
        ],
        classes: [],
        admin: false
    },
    operateur: {
        boutons: [
            "btn-entree",
            "btn-sortie"
        ],
        classes: [],
        admin: false
    }
};

function appliquerVisibiliteRole() {
    const role = roleUtilisateurActuel || "operateur";
    const permissions = PERMISSIONS_ROLES[role] || PERMISSIONS_ROLES.operateur;

    console.log("Application visibilité pour le rôle :", role);

    // --- Boutons par ID : cacher/montrer ---
    const tousLesBoutonsParId = [
        "btn-ajout-produit",
        "btn-entree",
        "btn-sortie",
        "btn-inventaire"
    ];

    tousLesBoutonsParId.forEach(idBouton => {
        const el = document.getElementById(idBouton);
        if (el) {
            if (permissions.boutons.includes(idBouton)) {
                el.style.display = "";
            } else {
                el.style.display = "none";
            }
        }
    });

    // --- Boutons par classe : cacher/montrer ---
    const toutesLesClassesBoutons = [
        "details-modifier-btn",
        "details-supprimer-btn"
    ];

    toutesLesClassesBoutons.forEach(nomClasse => {
        document.querySelectorAll(`.${nomClasse}`).forEach(el => {
            if (permissions.classes.includes(nomClasse)) {
                el.style.display = "";
            } else {
                el.style.display = "none";
            }
        });
    });

    // --- Éléments réservés aux administrateurs ---
    const elementsAdmin = [
        "ouvrir-edition-entreprise",
        "btn-ajouter-utilisateur-entreprise",
        "action-verrouiller-entreprise"
    ];

    elementsAdmin.forEach(idElement => {
        const el = document.getElementById(idElement);
        if (el) {
            if (permissions.admin) {
                el.style.display = "";
            } else {
                el.style.display = "none";
            }
        }
    });

    // --- Panneau profil utilisateur : empêcher les non-admin de modifier les rôles ---
    const panneauActionsAdmin = document.querySelector(".actions-profil-panneau-entreprise");
    const zoneRolesPanneau = document.querySelector(".zone-roles-panneau-entreprise");

    if (panneauActionsAdmin) {
        panneauActionsAdmin.style.display = permissions.admin ? "" : "none";
    }

    if (zoneRolesPanneau) {
        // Les non-admin voient le rôle mais ne peuvent pas cliquer
        const tags = zoneRolesPanneau.querySelectorAll(".tag-role-panneau-entreprise");
        tags.forEach(tag => {
            tag.style.pointerEvents = permissions.admin ? "" : "none";
            tag.style.opacity = permissions.admin ? "" : "0.7";
        });
    }

    // --- Vérifier verrouillage ---
    if (entrepriseActuelle?.verrouillee && role !== "administrateur") {
        afficherEcranVerrouille();
    }
}

function afficherEcranVerrouille() {
    afficherMessageErreur("Cette entreprise est verrouillée. Seuls les administrateurs ont accès. Contactez un administrateur.");
    afficherEcran("ecran-choix-entreprise");
}

// ==================== MEMBRES ENTREPRISE ====================

async function chargerMembresEntreprise() {
    if (!entrepriseActuelle?.id) {
        membresEntrepriseActuelle = [];
        return [];
    }

    const { data, error } = await clientSupabase
        .rpc("recuperer_membres_entreprise", {
            p_entreprise_id: entrepriseActuelle.id
        });

    if (error) {
        console.error("Erreur chargement membres :", error);
        membresEntrepriseActuelle = [];
        return [];
    }

    membresEntrepriseActuelle = Array.isArray(data) ? data : [];

    console.log("Membres chargés :", membresEntrepriseActuelle);

    return membresEntrepriseActuelle;
}

function rendreListeMembresEntreprise() {
    const conteneur = document.getElementById("liste-utilisateurs-entreprise");
    const compteur = document.getElementById("compteur-utilisateurs-entreprise");

    if (!conteneur) return;

    if (!membresEntrepriseActuelle || membresEntrepriseActuelle.length === 0) {
        conteneur.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--texte-secondaire);font-size:0.85rem;">
                Aucun membre trouvé.
            </div>
        `;
        if (compteur) compteur.textContent = "0";
        return;
    }

    if (compteur) compteur.textContent = membresEntrepriseActuelle.length;

    // Grouper par rôle
    const groupes = {
        administrateur: { label: "Administrateurs", icone: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>', membres: [] },
        editeur: { label: "Éditeurs", icone: '<svg viewBox="0 0 24 24"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>', membres: [] },
        coordinateur: { label: "Coordinateurs", icone: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>', membres: [] },
        auditeur: { label: "Auditeurs", icone: '<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>', membres: [] },
        operateur: { label: "Opérateurs", icone: '<svg viewBox="0 0 24 24"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>', membres: [] }
    };

    membresEntrepriseActuelle.forEach(membre => {
        const role = membre.role || "operateur";
        if (groupes[role]) {
            groupes[role].membres.push(membre);
        }
    });

    let html = "";

    Object.entries(groupes).forEach(([role, groupe]) => {
        if (groupe.membres.length === 0) return;

        html += `
            <div class="groupe-role-entreprise">
                <div class="etiquette-groupe-entreprise">
                    ${groupe.icone}
                    ${groupe.label}
                </div>
                <div class="liste-membres-entreprise">
                    ${groupe.membres.map(membre => {
                        const photoHtml = membre.photo_url
                            ? `<img src="${membre.photo_url}${membre.photo_url.includes('?') ? '&' : '?'}t=${Date.now()}" alt="${membre.nom_complet}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                               <svg viewBox="0 0 24 24" style="display:none;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
                            : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

                        return `
                            <div class="membre-entreprise"
                                data-role-entreprise="${membre.role}"
                                data-nom-entreprise="${membre.nom_complet || ''}"
                                data-email-entreprise="${membre.email || ''}"
                                data-photo-entreprise="${membre.photo_url || ''}"
                                data-id-entreprise="${membre.id || ''}">
                                <div class="avatar-membre-entreprise">
                                    ${photoHtml}
                                </div>
                                <div class="infos-membre-entreprise">
                                    <div class="nom-membre-entreprise">${membre.nom_complet || 'Utilisateur'}</div>
                                    <div class="email-membre-entreprise">${membre.email || ''}</div>
                                </div>
                                <svg class="chevron-membre-entreprise" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    });

    conteneur.innerHTML = html;

    // Réattacher les événements click sur les membres
    attacherEvenementsMembres();
}

function attacherEvenementsMembres() {
    document.querySelectorAll('.membre-entreprise').forEach(membre => {
        membre.addEventListener('click', () => {
            const nomEntreprise = membre.getAttribute('data-nom-entreprise');
            const emailEntreprise = membre.getAttribute('data-email-entreprise');
            const roleEntreprise = membre.getAttribute('data-role-entreprise');
            const idMembre = membre.getAttribute('data-id-entreprise');
            const photoMembre = membre.getAttribute('data-photo-entreprise');

            membreSelectionneEntreprise = {
                id: idMembre,
                nom: nomEntreprise,
                email: emailEntreprise,
                role: roleEntreprise,
                photo: photoMembre
            };
            roleCourantMembreEntreprise = roleEntreprise;
            roleSelectionneMembreEntreprise = roleEntreprise;

            // Remplir le profil dans le panneau
            document.getElementById('nom-panneau-entreprise').textContent = nomEntreprise;
            document.getElementById('email-panneau-entreprise').textContent = emailEntreprise;

            // Avatar dans le panneau
            const avatarPanneau = document.getElementById('avatar-panneau-entreprise');
            if (avatarPanneau) {
                if (photoMembre && photoMembre.trim() !== '') {
                    avatarPanneau.innerHTML = `
                        <img src="${photoMembre}${photoMembre.includes('?') ? '&' : '?'}t=${Date.now()}" 
                             alt="${nomEntreprise}" 
                             style="width:100%;height:100%;object-fit:cover;border-radius:50%;" 
                             onerror="this.outerHTML='<svg viewBox=\\'0 0 24 24\\'><path d=\\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\\'/><circle cx=\\'12\\' cy=\\'7\\' r=\\'4\\'/></svg>'" />
                    `;
                } else {
                    avatarPanneau.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
                }
            }

            // Sélectionner le bon tag
            mettreAJourTagsRolesEntreprise(roleEntreprise);

            // Description
            mettreAJourDescriptionRoleEntreprise(nomEntreprise, roleEntreprise);

            // Bouton modifier désactivé par défaut
            const btnModifierEntreprise = document.getElementById('btn-modifier-role-entreprise');
            btnModifierEntreprise.disabled = true;

            ouvrirPanneauEntreprise(panneauProfilEntreprise);
        });
    });
}

// ==================== INVITATIONS QR CODE ====================

async function creerInvitationEntreprise(role) {
    if (!entrepriseActuelle?.id) {
        afficherMessageErreur("Aucune entreprise active.");
        return null;
    }

    const { data, error } = await clientSupabase
        .rpc("creer_invitation", {
            p_entreprise_id: entrepriseActuelle.id,
            p_role: role
        });

    if (error) {
        console.error("Erreur création invitation :", error);
        afficherMessageErreur("Impossible de créer l'invitation.");
        return null;
    }

    console.log("Invitation créée :", data);
    return data;
}

async function utiliserInvitation(token) {
    if (!token || typeof token !== "string" || token.trim() === "") {
        afficherMessageErreur("Token d'invitation invalide.");
        return null;
    }

    const { data, error } = await clientSupabase
        .rpc("utiliser_invitation", {
            p_token: token.trim()
        });

    if (error) {
        console.error("Erreur utilisation invitation :", error);

        // Messages d'erreur lisibles
        const message = error.message || "";
        if (message.includes("déjà été utilisée")) {
            afficherMessageErreur("Cette invitation a déjà été utilisée par un autre membre.");
        } else if (message.includes("expiré")) {
            afficherMessageErreur("Cette invitation a expiré.");
        } else if (message.includes("déjà membre")) {
            afficherMessageErreur("Vous êtes déjà membre de cette entreprise.");
        } else if (message.includes("introuvable")) {
            afficherMessageErreur("Invitation introuvable ou invalide.");
        } else {
            afficherMessageErreur("Impossible de rejoindre l'entreprise.");
        }

        return null;
    }

    console.log("Invitation utilisée avec succès :", data);
    return data;
}

function extraireTokenDepuisQrCode(contenuQr) {
    if (!contenuQr || typeof contenuQr !== "string") return null;

    // Essayer de parser comme JSON
    try {
        const parsed = JSON.parse(contenuQr);
        if (parsed.token) return parsed.token;
    } catch (e) {
        // Pas du JSON, peut-être juste le token brut
    }

    // Si c'est un token hex de 64 caractères
    const trimmed = contenuQr.trim();
    if (/^[a-f0-9]{64}$/i.test(trimmed)) {
        return trimmed;
    }

    return null;
}

async function traiterQrCodeScanne(contenuQr) {
    console.log("QR code scanné :", contenuQr);

    const token = extraireTokenDepuisQrCode(contenuQr);

    if (!token) {
        afficherMessageErreur("Ce QR code n'est pas une invitation valide.");
        return;
    }

    // Fermer le scanner
    fermerScannerQr();

    // Utiliser l'invitation
    const resultat = await utiliserInvitation(token);

    if (!resultat) return;

    // Succès ! Recharger tout
    afficherMessageSucces(
        `Vous avez rejoint "${resultat.entreprise_nom}" en tant que ${obtenirLibelleRoleEntreprise(resultat.role)}.`
    );

    await chargerContexteUtilisateurComplet();
    await chargerEntreprisesUtilisateur();

    remplirInterfaceUtilisateurEtEntreprise();
    rendreListeChoixEntreprise();

    afficherEcran("ecran-choix-entreprise");
}

// ==================== LECTURE QR CODE (CAMÉRA + GALERIE) ====================

let scannerQrAnimationId = null;
let scannerQrEnCours = false;

function demarrerLectureQrCamera() {
    const video = document.getElementById('scanner-qr-video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    scannerQrEnCours = true;

    function scanner() {
        if (!scannerQrEnCours) return;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            scannerQrAnimationId = requestAnimationFrame(scanner);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert"
            });

            if (code && code.data) {
                console.log("QR détecté par caméra :", code.data);
                scannerQrEnCours = false;
                traiterQrCodeScanne(code.data);
                return;
            }
        }

        scannerQrAnimationId = requestAnimationFrame(scanner);
    }

    scannerQrAnimationId = requestAnimationFrame(scanner);
}

function arreterLectureQrCamera() {
    scannerQrEnCours = false;
    if (scannerQrAnimationId) {
        cancelAnimationFrame(scannerQrAnimationId);
        scannerQrAnimationId = null;
    }
}

function lireQrCodeDepuisImage(fichier) {
    if (!fichier) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();

        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Limiter la taille pour performance
            const maxSize = 1024;
            let w = img.width;
            let h = img.height;

            if (w > maxSize || h > maxSize) {
                const ratio = Math.min(maxSize / w, maxSize / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);

            const imageData = ctx.getImageData(0, 0, w, h);

            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth"
                });

                if (code && code.data) {
                    console.log("QR détecté depuis image :", code.data);
                    traiterQrCodeScanne(code.data);
                } else {
                    afficherMessageErreur("Aucun QR code détecté dans cette image. Essayez avec une image plus nette.");
                }
            } else {
                afficherMessageErreur("Le lecteur de QR code n'est pas chargé.");
            }
        };

        img.onerror = function() {
            afficherMessageErreur("Impossible de lire cette image.");
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(fichier);
}


async function creerEntreprise() {
    if (!utilisateurActuel || !profilActuel) {
        afficherMessageErreur("Utilisateur non connecté.");
        return;
    }

    const nom = document.getElementById("input-nom-entreprise").value.trim();
    const description = document.getElementById("input-description").value.trim();
    const devise = document.getElementById("input-devise").value.trim() || "USD";
    const themeSelectionne = document.querySelector(".theme-option.actif")?.dataset.theme || "#2d3436";

    if (!nom) {
        afficherMessageErreur("Veuillez entrer le nom de l'entreprise.");
        return;
    }

    let logoUrl = null;

    // 1) Upload logo si présent
    if (logoEntrepriseFichier) {
    const cheminFichier = `${utilisateurActuel.id}/logo-${Date.now()}.webp`;

    const { error: erreurUpload } = await clientSupabase
        .storage
        .from("logos-entreprises")
        .upload(cheminFichier, logoEntrepriseFichier, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/webp"
        });

    if (erreurUpload) {
        console.error("Erreur upload logo :", erreurUpload);
        afficherMessageErreur("Impossible d'envoyer le logo.");
        return;
    }

    const { data: donneesPubliques } = clientSupabase
        .storage
        .from("logos-entreprises")
        .getPublicUrl(cheminFichier);

    logoUrl = donneesPubliques.publicUrl;
}

    // 2) Créer entreprise + admin + entreprise active via RPC SQL
    const { data: entrepriseCreee, error: erreurEntreprise } = await clientSupabase
        .rpc("creer_entreprise_complete", {
            p_nom: nom,
            p_description: description || null,
            p_devise: devise,
            p_theme: themeSelectionne,
            p_logo_url: logoUrl
        });

    if (erreurEntreprise) {
        console.error("Erreur création entreprise complète :", erreurEntreprise);
        afficherMessageErreur("Impossible de créer l'entreprise.");
        return;
    }

    console.log("Entreprise créée :", entrepriseCreee);

// Mise à jour locale immédiate
entrepriseActuelle = entrepriseCreee;

if (!profilActuel) {
    profilActuel = {};
}

profilActuel.entreprise_active_id = entrepriseCreee.id;

// Recharger le contexte complet depuis la base
await chargerContexteUtilisateurComplet();

console.log("Profil après création :", profilActuel);
console.log("Entreprise active après création :", entrepriseActuelle);

// Rafraîchir interface
await chargerEntreprisesUtilisateur();

remplirInterfaceUtilisateurEtEntreprise();
rendreListeChoixEntreprise();

afficherMessageSucces("Entreprise créée avec succès.");

reinitialiserFormulaireEntreprise();

afficherEcran("ecran-choix-entreprise");
}

function reinitialiserFormulaireEntreprise() {
    const titre = document.getElementById("titre-formulaire-entreprise");
    const btnValider = document.getElementById("btn-valider-entreprise");
    const inputNom = document.getElementById("input-nom-entreprise");
    const inputDescription = document.getElementById("input-description");
    const inputDevise = document.getElementById("input-devise");
    const inputLogo = document.getElementById("input-logo-entreprise");
    const zoneLogo = document.getElementById("zone-logo-upload");
    const texteLogo = zoneLogo?.querySelector(".logo-upload-texte");

    modeEditionEntreprise = false;
    logoEntrepriseFichier = null;
    logoEntreprisePreviewUrl = null;
    logoEntrepriseUrlExistante = null;

    if (titre) titre.textContent = "Créer une entreprise";
    if (btnValider) btnValider.textContent = "Créer l'entreprise";

    if (inputNom) inputNom.value = "";
    if (inputDescription) inputDescription.value = "";
    if (inputDevise) inputDevise.value = "";
    if (inputLogo) inputLogo.value = "";

    if (texteLogo) {
    texteLogo.textContent = "Ajouter";
}

afficherPreviewLogoEntreprise(null);

    document.querySelectorAll(".theme-option").forEach(option => {
        option.classList.remove("actif");
        if (option.dataset.theme === "#2d3436") {
            option.classList.add("actif");
        }
    });

    document.documentElement.style.setProperty("--accent", "#2d3436");
    document.documentElement.style.setProperty("--accent-clair", eclaircirCouleur("#2d3436", 22));

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute("content", "#2d3436");
    }
}

function preRemplirFormulaireEntreprisePourEdition() {
    if (!entrepriseActuelle) {
        afficherMessageErreur("Aucune entreprise à modifier.");
        return;
    }

    const titre = document.getElementById("titre-formulaire-entreprise");
    const btnValider = document.getElementById("btn-valider-entreprise");
    const inputNom = document.getElementById("input-nom-entreprise");
    const inputDescription = document.getElementById("input-description");
    const inputDevise = document.getElementById("input-devise");
    const inputLogo = document.getElementById("input-logo-entreprise");
    const zoneLogo = document.getElementById("zone-logo-upload");
    const texteLogo = zoneLogo?.querySelector(".logo-upload-texte");

    modeEditionEntreprise = true;
logoEntrepriseFichier = null;
logoEntreprisePreviewUrl = null;
logoEntrepriseUrlExistante = entrepriseActuelle.logo_url || null;

    if (titre) titre.textContent = "Modifier l'entreprise";
    if (btnValider) btnValider.textContent = "Enregistrer les modifications";

    if (inputNom) inputNom.value = entrepriseActuelle.nom || "";
    if (inputDescription) inputDescription.value = entrepriseActuelle.description || "";
    if (inputDevise) inputDevise.value = entrepriseActuelle.devise || "USD";
    if (inputLogo) inputLogo.value = "";

    if (texteLogo) {
    texteLogo.textContent = logoEntrepriseUrlExistante ? "Logo actuel" : "Ajouter";
}

if (logoEntrepriseUrlExistante) {
    afficherPreviewLogoEntreprise(obtenirLogoEntrepriseUrlAvecCacheBuster(logoEntrepriseUrlExistante));
} else {
    afficherPreviewLogoEntreprise(null);
}

    const themeEntreprise = entrepriseActuelle.theme || "#2d3436";

    document.querySelectorAll(".theme-option").forEach(option => {
        option.classList.remove("actif");

        if (option.dataset.theme === themeEntreprise) {
            option.classList.add("actif");
        }
    });

    document.documentElement.style.setProperty("--accent", themeEntreprise);
    document.documentElement.style.setProperty("--accent-clair", eclaircirCouleur(themeEntreprise, 22));

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute("content", themeEntreprise);
    }
}

async function modifierEntreprise() {
    if (!utilisateurActuel || !profilActuel || !entrepriseActuelle) {
        afficherMessageErreur("Entreprise introuvable.");
        return false;
    }

    const nom = document.getElementById("input-nom-entreprise").value.trim();
    const description = document.getElementById("input-description").value.trim();
    const devise = document.getElementById("input-devise").value.trim() || "USD";
    const themeSelectionne = document.querySelector(".theme-option.actif")?.dataset.theme || "#2d3436";

    if (!nom) {
        afficherMessageErreur("Veuillez entrer le nom de l'entreprise.");
        return false;
    }

    let logoUrlFinal = logoEntrepriseUrlExistante || entrepriseActuelle.logo_url || null;

    // Upload nouveau logo si l'utilisateur en choisit un
    if (logoEntrepriseFichier) {
    const cheminFichier = `${utilisateurActuel.id}/logo-${Date.now()}.webp`;

    const { error: erreurUpload } = await clientSupabase
        .storage
        .from("logos-entreprises")
        .upload(cheminFichier, logoEntrepriseFichier, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/webp"
        });

    if (erreurUpload) {
        console.error("Erreur upload logo modification :", erreurUpload);
        afficherMessageErreur("Impossible d'envoyer le nouveau logo.");
        return false;
    }

    const { data: donneesPubliques } = clientSupabase
        .storage
        .from("logos-entreprises")
        .getPublicUrl(cheminFichier);

    logoUrlFinal = donneesPubliques.publicUrl;
}

    const { data: entrepriseModifiee, error: erreurModification } = await clientSupabase
        .rpc("modifier_entreprise_complete", {
            p_entreprise_id: entrepriseActuelle.id,
            p_nom: nom,
            p_description: description || null,
            p_devise: devise,
            p_theme: themeSelectionne,
            p_logo_url: logoUrlFinal
        });

    if (erreurModification) {
        console.error("Erreur modification entreprise :", erreurModification);
        afficherMessageErreur(`Impossible de modifier l'entreprise : ${erreurModification.message}`);
        return false;
    }

    console.log("Entreprise modifiée :", entrepriseModifiee);

    entrepriseActuelle = entrepriseModifiee;

    await chargerContexteUtilisateurComplet();
await chargerEntreprisesUtilisateur();

remplirInterfaceUtilisateurEtEntreprise();
rendreListeChoixEntreprise();

    afficherMessageSucces("Entreprise modifiée avec succès.");

    modeEditionEntreprise = false;
    logoEntrepriseFichier = null;
    logoEntrepriseUrlExistante = null;

    afficherEcran("ecran-entreprise");

    return true;
}

function mettreAJourTagsRolesEntreprise(roleActifEntreprise) {
            document.querySelectorAll('[data-tag-role-entreprise]').forEach(tag => {
                tag.classList.toggle('selectionne-entreprise', tag.getAttribute('data-tag-role-entreprise') === roleActifEntreprise);
            });
        }
        
function mettreAJourDescriptionRoleEntreprise(nomCompletEntreprise, roleEntreprise) {
            const prenomEntreprise = extrairePrenomEntreprise(nomCompletEntreprise);
            const descriptionEntreprise = donneesRolesEntreprise[roleEntreprise];
            if (descriptionEntreprise) {
                document.getElementById('description-role-panneau-entreprise').innerHTML = descriptionEntreprise.description(prenomEntreprise);
            }
        }

function mettreAJourCompteurEntreprise() {
            const totalEntreprise = document.querySelectorAll('.membre-entreprise').length;
            document.getElementById('compteur-utilisateurs-entreprise').textContent = totalEntreprise;
        }
        
// ==================== AFFICHAGE INTERFACE ====================
function eclaircirCouleur(hex, pourcentage = 20) {
    if (!hex || !hex.startsWith("#")) return hex;

    let couleur = hex.replace("#", "");

    if (couleur.length === 3) {
        couleur = couleur.split("").map(c => c + c).join("");
    }

    const num = parseInt(couleur, 16);

    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.min(255, Math.round(r + (255 - r) * (pourcentage / 100)));
    g = Math.min(255, Math.round(g + (255 - g) * (pourcentage / 100)));
    b = Math.min(255, Math.round(b + (255 - b) * (pourcentage / 100)));

    return `rgb(${r}, ${g}, ${b})`;
}

function appliquerThemeEntreprise() {
    const theme = entrepriseActuelle?.theme || "#2d3436";
    const themeClair = eclaircirCouleur(theme, 22);

    console.log("Application du thème entreprise :", theme);

    document.documentElement.style.setProperty("--accent", theme);
    document.documentElement.style.setProperty("--accent-clair", themeClair);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute("content", theme);
    }

    document.querySelectorAll(".theme-option").forEach(option => {
        option.classList.remove("actif");

        if (option.dataset.theme === theme) {
            option.classList.add("actif");
        }
    });
}

function remplirInterfaceUtilisateurEtEntreprise() {
    console.log("Remplissage interface");
    console.log("profilActuel :", profilActuel);
    console.log("entrepriseActuelle :", entrepriseActuelle);
    console.log("utilisateurActuel :", utilisateurActuel);
    console.log("roleUtilisateurActuel :", roleUtilisateurActuel);

    appliquerThemeEntreprise();

    const nomUtilisateur = profilActuel?.nom_complet || obtenirNomUtilisateurDepuisAuth(utilisateurActuel);
    const emailUtilisateur = profilActuel?.email || utilisateurActuel?.email || "";
    const photoUtilisateur = profilActuel?.photo_url || obtenirPhotoUtilisateurDepuisAuth(utilisateurActuel) || null;
    const nomEntreprise = entrepriseActuelle?.nom || "Mon Entreprise";
    const descriptionEntreprise = entrepriseActuelle?.description || "Aucune description";
    const deviseEntreprise = entrepriseActuelle?.devise || "USD";

    // Accueil
    const texteBienvenue = document.getElementById("texte-bienvenue-utilisateur");
    if (texteBienvenue) {
        texteBienvenue.textContent = `Bonjour, ${nomUtilisateur}`;
    }

    document.querySelectorAll(".accueil-nom-entreprise, .entreprise-nom, .rapport-entreprise-nom").forEach(el => {
        el.textContent = nomEntreprise;
    });

    // Menu
    const menuNom = document.getElementById("menu-profil-nom");
    const menuEmail = document.getElementById("menu-profil-email");

    if (menuNom) menuNom.textContent = nomUtilisateur;
    if (menuEmail) menuEmail.textContent = emailUtilisateur;

    // Entreprise
    const adminNom = document.getElementById("entreprise-admin-nom");
    const adminEmail = document.getElementById("entreprise-admin-email");

    if (adminNom) adminNom.textContent = nomUtilisateur;
    if (adminEmail) adminEmail.textContent = emailUtilisateur;

    // Nom et description entreprise dans l'écran entreprise
    const nomEntrepriseAffichage = document.getElementById("nom-entreprise-affichage");
    const descriptionEntrepriseAffichage = document.getElementById("description-entreprise-affichage");

    if (nomEntrepriseAffichage) nomEntrepriseAffichage.textContent = nomEntreprise;
    if (descriptionEntrepriseAffichage) descriptionEntrepriseAffichage.textContent = descriptionEntreprise;

    const descriptionEntrepriseEl = document.querySelector(".entreprise-description");
    const deviseEntrepriseEl = document.querySelector(".entreprise-devise");

    if (descriptionEntrepriseEl) {
        descriptionEntrepriseEl.textContent = descriptionEntreprise;
    }

    if (deviseEntrepriseEl) {
        deviseEntrepriseEl.textContent = `Devise: ${deviseEntreprise}`;
    }

    // Verrouillage
    const verrouCheckbox = document.getElementById("verrou-entreprise");
    if (verrouCheckbox && entrepriseActuelle) {
        verrouCheckbox.checked = !!entrepriseActuelle.verrouillee;
    }

    remplirAvatarsUtilisateur();
    remplirLogosEntreprise();
    rendreListeChoixEntreprise();

    // AJOUT : appliquer la visibilité selon le rôle
    appliquerVisibiliteRole();
}


async function initialiserSessionUtilisateur(session, options = {}) {
    const {
        appliquerRoutage = true,
        restaurerEcran = false
    } = options;

    sessionActuelle = session;
    utilisateurActuel = session?.user || null;

    console.log("Initialisation session :", sessionActuelle);
    console.log("Utilisateur actuel :", utilisateurActuel);
    console.log("Options :", { appliquerRoutage, restaurerEcran });

    if (!utilisateurActuel) {
        profilActuel = null;
        entrepriseActuelle = null;
        roleUtilisateurActuel = null;
        afficherEcran("ecran-auth");
        return;
    }

    await creerProfilSiInexistant(utilisateurActuel);
    await chargerContexteUtilisateurComplet();
    await chargerEntreprisesUtilisateur();

    console.log("Profil actuel chargé :", profilActuel);
    console.log("Entreprise actuelle chargée :", entrepriseActuelle);
    console.log("Rôle actuel :", roleUtilisateurActuel);
    console.log("Entreprises utilisateur :", entreprisesUtilisateur);

 
remplirInterfaceUtilisateurEtEntreprise();
rendreListeChoixEntreprise();

await chargerCategoriesEntreprise();
await chargerProduitsEntreprise();
await chargerNotificationsStock();
rendreNotificationsStock();
demarrerRafraichissementNotifications();

    // Vérifier verrouillage
    if (entrepriseActuelle?.verrouillee && roleUtilisateurActuel !== "administrateur") {
        afficherEcran("ecran-choix-entreprise");
        afficherMessageErreur("Cette entreprise est verrouillée. Contactez un administrateur.");
        return;
    }

    if (restaurerEcran) {
        const ecranRestaure = restaurerEcranSauvegarde();

        if (ecranRestaure) {
            console.log("Écran restauré :", obtenirEcranSauvegarde());
            return;
        }
    }

    if (!appliquerRoutage) {
        console.log("Aucun routage forcé, écran actuel conservé :", ecranActuel);
        return;
    }

    afficherEcran("ecran-choix-entreprise");
}


// ==================== ROUTAGE APRÈS CONNEXION ====================
async function verifierRedirectionUtilisateur() {
    const { data: donneesSession } = await clientSupabase.auth.getSession();

    await initialiserSessionUtilisateur(donneesSession.session, {
        appliquerRoutage: true,
        restaurerEcran: true
    });
}

        // ==================== ÉVÉNEMENTS ====================
// ==================== SCANNER QR CODE ====================

async function ouvrirScannerQr() {
    const video = document.getElementById('scanner-qr-video');
    const ligne = document.getElementById('scanner-qr-ligne');

    // Réinitialiser l'état torche
    scannerQrTorcheActive = false;
    document.getElementById('scanner-qr-btn-torche').classList.remove('actif');

    try {
        scannerQrStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = scannerQrStream;
        await video.play();

        scannerQrTrack = scannerQrStream.getVideoTracks()[0];

        ligne.classList.add('actif');
        scannerQrEntreprise.classList.add('actif');

        // AJOUT : démarrer la lecture continue du QR code
        demarrerLectureQrCamera();

    } catch (erreur) {
        console.error('Erreur accès caméra :', erreur);

        scannerQrEntreprise.classList.add('actif');
        ligne.classList.add('actif');

        if (erreur.name === 'NotAllowedError') {
            afficherMessageErreur("Accès à la caméra refusé. Autorisez l'accès dans les paramètres.");
        } else if (erreur.name === 'NotFoundError') {
            afficherMessageErreur("Aucune caméra détectée sur cet appareil.");
        } else {
            afficherMessageErreur("Impossible d'accéder à la caméra.");
        }
    }
}


function fermerScannerQr() {
    const video = document.getElementById('scanner-qr-video');
    const ligne = document.getElementById('scanner-qr-ligne');

    // AJOUT : arrêter la lecture QR
    arreterLectureQrCamera();

    ligne.classList.remove('actif');

    if (scannerQrTorcheActive && scannerQrTrack) {
        try {
            scannerQrTrack.applyConstraints({ advanced: [{ torch: false }] });
        } catch (e) {}
        scannerQrTorcheActive = false;
        document.getElementById('scanner-qr-btn-torche').classList.remove('actif');
    }

    if (scannerQrStream) {
        scannerQrStream.getTracks().forEach(track => track.stop());
        scannerQrStream = null;
        scannerQrTrack = null;
    }

    video.srcObject = null;
    scannerQrEntreprise.classList.remove('actif');
}


async function basculerTorcheScanner() {
    if (!scannerQrTrack) {
        afficherMessageErreur("La torche n'est pas disponible.");
        return;
    }

    // Vérifier si la torche est supportée
    let capabilities;
    try {
        capabilities = scannerQrTrack.getCapabilities();
    } catch (e) {
        capabilities = {};
    }

    if (!capabilities.torch) {
        afficherMessageErreur("La torche n'est pas supportée sur cet appareil.");
        return;
    }

    scannerQrTorcheActive = !scannerQrTorcheActive;

    try {
        await scannerQrTrack.applyConstraints({
            advanced: [{ torch: scannerQrTorcheActive }]
        });

        document.getElementById('scanner-qr-btn-torche').classList.toggle('actif', scannerQrTorcheActive);
    } catch (erreur) {
        console.error('Erreur torche :', erreur);
        scannerQrTorcheActive = false;
        document.getElementById('scanner-qr-btn-torche').classList.remove('actif');
        afficherMessageErreur("Impossible d'activer la torche.");
    }
}

function ouvrirGalerieScanner() {
    const input = document.getElementById('scanner-qr-input-galerie');
    sessionStorage.setItem("ecran-actuel", ecranActuel);
    input.click();
}

 


 

        const overlayEntreprise = document.getElementById('overlay-entreprise');
const panneauInvitationEntreprise = document.getElementById('panneau-invitation-entreprise');
const panneauProfilEntreprise = document.getElementById('panneau-profil-utilisateur-entreprise');
const qrPleinEcranEntreprise = document.getElementById('qr-plein-ecran-entreprise');
const scannerQrEntreprise = document.getElementById('scanner-qr-entreprise');


        document.addEventListener("DOMContentLoaded", () => {
          verifierRedirectionUtilisateur();
          // ===== Sélecteur catégorie =====
initialiserSelecteurCategorie();

// Modale ajout catégorie
const btnAjouterCategorie = document.getElementById("btn-ajouter-categorie");
const modaleCategorie = document.getElementById("modale-categorie");
const inputNouvelleCategorie = document.getElementById("input-nouvelle-categorie");
const btnAnnulerCategorie = document.getElementById("btn-annuler-categorie");
const btnConfirmerCategorie = document.getElementById("btn-confirmer-categorie");

if (btnAjouterCategorie) {
    btnAjouterCategorie.addEventListener("click", () => {
        document.getElementById("selecteur-categorie").classList.remove("ouvert");
        inputNouvelleCategorie.value = "";
        modaleCategorie.classList.add("visible");
        setTimeout(() => inputNouvelleCategorie.focus(), 100);
    });
}

if (btnAnnulerCategorie) {
    btnAnnulerCategorie.addEventListener("click", () => {
        modaleCategorie.classList.remove("visible");
    });
}

if (btnConfirmerCategorie) {
    btnConfirmerCategorie.addEventListener("click", async () => {
        const nom = inputNouvelleCategorie.value.trim();
        if (nom) {
            btnConfirmerCategorie.textContent = "Ajout...";
            btnConfirmerCategorie.disabled = true;

            const resultat = await creerCategorieSupabase(nom);

            btnConfirmerCategorie.textContent = "Ajouter";
            btnConfirmerCategorie.disabled = false;

            if (resultat) {
                modaleCategorie.classList.remove("visible");

                // Sélectionner automatiquement la nouvelle catégorie
                const nouvelleCat = categoriesEntreprise.find(c => c.nom.toLowerCase() === nom.toLowerCase());
                if (nouvelleCat) {
                    const texteCategorie = document.getElementById("texte-categorie");
                    const selecteurCategorie = document.getElementById("selecteur-categorie");
                    if (texteCategorie) {
                        texteCategorie.textContent = nouvelleCat.nom;
                        texteCategorie.classList.add("selectionne");
                    }
                    if (selecteurCategorie) {
                        selecteurCategorie.dataset.valeur = nouvelleCat.id;
                    }
                }
            }
        }
    });
}


// Fermer modale en cliquant sur le fond
if (modaleCategorie) {
    modaleCategorie.addEventListener("click", (e) => {
        if (e.target === modaleCategorie) {
            modaleCategorie.classList.remove("visible");
        }
    });
}

    // ==================== CODE-BARRES — ÉVÉNEMENTS (codeProduit) ====================

    // Ouvrir le bottom sheet
    const btnOuvrirTypesCB = document.getElementById("btn-ouvrir-types-codeProduit");
    if (btnOuvrirTypesCB) {
        btnOuvrirTypesCB.addEventListener("click", () => {
            ouvrirFeuilleTypesCodeProduit();
        });
    }

    // Fermer le bottom sheet en cliquant sur la superposition
    const superpositionTypesCB = document.getElementById("superposition-types-codeProduit");
    if (superpositionTypesCB) {
        superpositionTypesCB.addEventListener("click", (e) => {
            if (e.target === superpositionTypesCB) {
                fermerFeuilleTypesCodeProduit();
            }
        });
    }

    // Sélection d'un type dans le bottom sheet
    document.querySelectorAll(".feuille-option-codeProduit").forEach(option => {
        option.addEventListener("click", () => {
            const format = option.dataset.formatCodeproduit;
            if (format) {
                selectionnerTypeCodeProduit(format);
            }
        });
    });

    // Mise à jour en temps réel de l'étiquette quand on tape dans le champ code
    const inputCodeProduitCB = document.getElementById("input-code-produit-codeProduit");
    if (inputCodeProduitCB) {
        inputCodeProduitCB.addEventListener("input", () => {
            mettreAJourEtiquetteCodeProduit();
        });
    }

    // Mise à jour de l'étiquette quand on modifie le nom du produit
    const inputNomProduitCB = document.querySelector("#ecran-ajout-produit .ajout-champ:nth-child(1) .ajout-input");
    if (inputNomProduitCB) {
        inputNomProduitCB.addEventListener("input", () => {
            mettreAJourEtiquetteCodeProduit();
        });
    }


// ===== Emplacements =====
const btnAjouterEmplacement = document.getElementById("btn-ajouter-emplacement");
if (btnAjouterEmplacement) {
    btnAjouterEmplacement.addEventListener("click", ajouterEmplacement);
}

// Suppression emplacement (délégation)
const emplacementsConteneur = document.getElementById("emplacements-conteneur");
if (emplacementsConteneur) {
    emplacementsConteneur.addEventListener("click", (e) => {
        const btnSupprimer = e.target.closest(".emplacement-supprimer");
        if (btnSupprimer && !btnSupprimer.disabled) {
            supprimerEmplacement(btnSupprimer.closest(".emplacement-ligne"));
        }
    });

    // Calcul quantité totale (délégation sur input)
    emplacementsConteneur.addEventListener("input", (e) => {
        if (e.target.classList.contains("emplacement-qte")) {
            calculerQuantiteTotale();
        }
    });
}

    // ==================== PHOTO PRODUIT — ÉVÉNEMENTS ====================

    // Clic sur la zone d'image pour ouvrir la caméra
    const zoneAjoutImage_photoProduit = document.getElementById('zone-ajout-image-photo-produit');
    if (zoneAjoutImage_photoProduit) {
        zoneAjoutImage_photoProduit.addEventListener('click', (e) => {
            // Ne pas ouvrir si on clique sur le bouton supprimer
            if (e.target.closest('#btn-supprimer-image-photo-produit')) return;
            // Ne pas ouvrir si une image est déjà affichée
            const apercu = document.getElementById('apercu-final-photo-produit');
            if (apercu && apercu.style.display !== 'none') return;

            ouvrirCamera_photoProduit();
        });
    }

    // Fermer la caméra
    const btnFermerCamera_photoProduit = document.getElementById('btn-fermer-camera-photo-produit');
    if (btnFermerCamera_photoProduit) {
        btnFermerCamera_photoProduit.addEventListener('click', fermerCamera_photoProduit);
    }

    // Capturer la photo
    const btnDeclencheur_photoProduit = document.getElementById('btn-declencheur-photo-produit');
    if (btnDeclencheur_photoProduit) {
        btnDeclencheur_photoProduit.addEventListener('click', capturerPhoto_photoProduit);
    }

    // Torche
    const btnTorche_photoProduit = document.getElementById('btn-torche-photo-produit');
    if (btnTorche_photoProduit) {
        btnTorche_photoProduit.addEventListener('click', basculerTorche_photoProduit);
    }

    // Galerie — ouvrir le sélecteur de fichier
    const btnGalerie_photoProduit = document.getElementById('btn-galerie-photo-produit');
    const inputGalerie_photoProduit = document.getElementById('input-galerie-photo-produit');
    if (btnGalerie_photoProduit && inputGalerie_photoProduit) {
        btnGalerie_photoProduit.addEventListener('click', () => {
            inputGalerie_photoProduit.click();
        });

        inputGalerie_photoProduit.addEventListener('change', (e) => {
            const fichier = e.target.files[0];
            if (!fichier) return;

            const lecteur = new FileReader();
            lecteur.onload = (ev) => {
                imageSourceValidation_photoProduit = ev.target.result;
                fermerCamera_photoProduit();
                afficherValidation_photoProduit(ev.target.result);
            };
            lecteur.readAsDataURL(fichier);

            // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
            inputGalerie_photoProduit.value = '';
        });
    }

    // Validation — Annuler (reprendre)
    const btnAnnulerValidation_photoProduit = document.getElementById('btn-annuler-validation-photo-produit');
    if (btnAnnulerValidation_photoProduit) {
        btnAnnulerValidation_photoProduit.addEventListener('click', () => {
            fermerValidation_photoProduit();
            ouvrirCamera_photoProduit();
        });
    }

    // Validation — Confirmer
    const btnConfirmerValidation_photoProduit = document.getElementById('btn-confirmer-validation-photo-produit');
    if (btnConfirmerValidation_photoProduit) {
        btnConfirmerValidation_photoProduit.addEventListener('click', confirmerValidation_photoProduit);
    }

    // Rognage — Retour
    const btnRetourRognage_photoProduit = document.getElementById('btn-retour-rognage-photo-produit');
    if (btnRetourRognage_photoProduit) {
        btnRetourRognage_photoProduit.addEventListener('click', () => {
            document.getElementById('superposition-rognage-photo-produit').classList.remove('visible-photo-produit');
            afficherValidation_photoProduit(imageSourceValidation_photoProduit);
        });
    }

    // Rognage — Réinitialiser
    const btnReinitialiserRognage_photoProduit = document.getElementById('btn-reinitialiser-rognage-photo-produit');
    if (btnReinitialiserRognage_photoProduit) {
        btnReinitialiserRognage_photoProduit.addEventListener('click', reinitialiserRognage_photoProduit);
    }

    // Rognage — Valider
    const btnValiderRognage_photoProduit = document.getElementById('btn-valider-rognage-photo-produit');
    if (btnValiderRognage_photoProduit) {
        btnValiderRognage_photoProduit.addEventListener('click', validerRognage_photoProduit);
    }

    // Rognage — Interactions tactiles et souris
    const zoneRognage_photoProduit = document.getElementById('zone-rognage-photo-produit');
    if (zoneRognage_photoProduit) {
        // Tactile
        zoneRognage_photoProduit.addEventListener('touchstart', gererDebutToucher_photoProduit, { passive: false });
        zoneRognage_photoProduit.addEventListener('touchmove', gererMouvementToucher_photoProduit, { passive: false });
        zoneRognage_photoProduit.addEventListener('touchend', gererFinToucher_photoProduit);
        zoneRognage_photoProduit.addEventListener('touchcancel', gererFinToucher_photoProduit);

        // Souris
        zoneRognage_photoProduit.addEventListener('mousedown', gererDebutToucher_photoProduit);
        document.addEventListener('mousemove', (e) => {
            if (rognage_photoProduit.enDeplacement) {
                gererMouvementToucher_photoProduit(e);
            }
        });
        document.addEventListener('mouseup', gererFinToucher_photoProduit);
    }

    // Supprimer l'image affichée
    const btnSupprimerImage_photoProduit = document.getElementById('btn-supprimer-image-photo-produit');
    if (btnSupprimerImage_photoProduit) {
        btnSupprimerImage_photoProduit.addEventListener('click', (e) => {
            e.stopPropagation();
            supprimerImageProduit_photoProduit();
        });
    }


            // Langue
            document.querySelectorAll(".langue-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    afficherEcran("ecran-mode");
                });
            });
            
            // Mode
            document.querySelectorAll(".mode-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("actif"));
                    btn.classList.add("actif");
                    
                    const mode = btn.dataset.mode;
                    if (mode === "sombre") {
                        document.documentElement.setAttribute("data-mode", "sombre");
                        modeSombre = true;
                    } else if (mode === "clair") {
                        document.documentElement.removeAttribute("data-mode");
                        modeSombre = false;
                    } else {
                        const prefereSombre = window.matchMedia("(prefers-color-scheme: dark)").matches;
                        if (prefereSombre) {
                            document.documentElement.setAttribute("data-mode", "sombre");
                            modeSombre = true;
                        } else {
                            document.documentElement.removeAttribute("data-mode");
                            modeSombre = false;
                        }
                    }
                    
                    setTimeout(() => afficherEcran("ecran-onboarding"), 300);
                });
            });
            
            // Onboarding
            const btnSuivant = document.getElementById("btn-onboarding-suivant");
            if (btnSuivant) {
                btnSuivant.addEventListener("click", () => {
                    const slides = document.querySelectorAll(".onboarding-slide");
                    const indicateurs = document.querySelectorAll(".onboarding-indicateur");
                    
                    if (slideOnboarding < slides.length - 1) {
                        slides[slideOnboarding].classList.remove("actif");
                        indicateurs[slideOnboarding].classList.remove("actif");
                        slideOnboarding++;
                        slides[slideOnboarding].classList.add("actif");
                        indicateurs[slideOnboarding].classList.add("actif");
                        btnSuivant.textContent = slideOnboarding === slides.length - 1 ? "Commencer" : "Suivant";
                    } else {
                        afficherEcran("ecran-auth");
                    }
                });
            }
            
// Auth Google
const btnGoogle = document.getElementById("btn-google");
if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
        await connecterAvecGoogle();
    });
}

// Bouton Déconnexion avec confirmation
const btnDeconnexion = document.getElementById("btn-deconnexion");
if (btnDeconnexion) {
    btnDeconnexion.addEventListener("click", async () => {
        const confirmer = confirm("Voulez-vous vraiment vous déconnecter ?");
        if (confirmer) {
            await deconnecterUtilisateur();
        }
    });
}
            
            // Créer entreprise
            const btnCreer = document.getElementById("btn-creer-entreprise");
if (btnCreer) {
    btnCreer.addEventListener("click", () => {
        reinitialiserFormulaireEntreprise();
        afficherEcran("ecran-creer-entreprise");
    });
}

// Rejoindre entreprise → ouvrir scanner QR
const btnRejoindreEntreprise = document.getElementById("btn-rejoindre-entreprise");
if (btnRejoindreEntreprise) {
    btnRejoindreEntreprise.addEventListener("click", () => {
        ouvrirScannerQr();
    });
}


// Continuer après choix entreprise
const btnChoixEntrepriseContinuer = document.getElementById("btn-choix-entreprise-continuer");
if (btnChoixEntrepriseContinuer) {
    btnChoixEntrepriseContinuer.addEventListener("click", async () => {
        if (!profilActuel?.entreprise_active_id) {
            afficherMessageErreur("Veuillez sélectionner une entreprise.");
            return;
        }

        await chargerContexteUtilisateurComplet();
        await chargerEntreprisesUtilisateur();

        // Vérifier verrouillage
        if (entrepriseActuelle?.verrouillee && roleUtilisateurActuel !== "administrateur") {
            afficherMessageErreur("Cette entreprise est verrouillée. Contactez un administrateur.");
            return;
        }


remplirInterfaceUtilisateurEtEntreprise();

await chargerCategoriesEntreprise();
await chargerProduitsEntreprise();
rendreProduits();
await chargerNotificationsStock();
rendreNotificationsStock();
demarrerRafraichissementNotifications();

afficherEcran("ecran-accueil");


         
    });
}

            
            const retourChoix = document.getElementById("retour-choix");
if (retourChoix) {
    retourChoix.addEventListener("click", () => {
        if (modeEditionEntreprise) {
            afficherEcran("ecran-entreprise");
        } else {
            afficherEcran("ecran-choix-entreprise");
        }
    });
}
            
            // Thème sélection
document.querySelectorAll(".theme-option").forEach(opt => {
    opt.addEventListener("click", () => {
        document.querySelectorAll(".theme-option").forEach(o => o.classList.remove("actif"));
        opt.classList.add("actif");

        const theme = opt.dataset.theme || "#2d3436";
        const themeClair = eclaircirCouleur(theme, 22);

        document.documentElement.style.setProperty("--accent", theme);
        document.documentElement.style.setProperty("--accent-clair", themeClair);

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute("content", theme);
        }
    });
});
            
// Valider entreprise
const btnValiderEntreprise = document.getElementById("btn-valider-entreprise");
if (btnValiderEntreprise) {
    btnValiderEntreprise.addEventListener("click", async () => {
        let succes = false;

        if (modeEditionEntreprise) {
            succes = await modifierEntreprise();
        } else {
            await creerEntreprise();
            succes = true;
        }

        if (!succes) return;

        rendreMouvementsRecents();
await chargerProduitsEntreprise();
rendreProduits();
rendreHistorique();
await chargerNotificationsStock();
rendreNotificationsStock();


    });
}
            
// Navigation principale
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", async () => {
        document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("actif"));
        item.classList.add("actif");

        const ecranCible = item.dataset.ecran;
        afficherEcran(ecranCible);

        // Charger l'historique quand on arrive sur l'écran historique
        if (ecranCible === "ecran-historique") {
            await chargerHistoriqueMouvements();
        }
    });
});

            
            // Notifications depuis accueil
            const btnNotifications = document.getElementById("btn-notifications");
if (btnNotifications) {
    btnNotifications.addEventListener("click", async () => {
        afficherEcran("ecran-notifications");
        await chargerNotificationsStock();
        rendreNotificationsStock();
    });
}

const retourNotifications = document.getElementById("retour-notifications");
if (retourNotifications) {
    retourNotifications.addEventListener("click", () => {
        afficherEcran("ecran-accueil");
    });
}


            
            // Recherche produits
const inputRechercheProduits = document.querySelector("#ecran-produits .recherche-input");
if (inputRechercheProduits) {
    inputRechercheProduits.addEventListener("input", () => {
        const terme = inputRechercheProduits.value;
        const resultats = rechercherProduits(terme);
        rendreProduits(resultats);
    });
}

            
            // Ajout produit
const btnAjoutProduit = document.getElementById("btn-ajout-produit");
if (btnAjoutProduit) {
    btnAjoutProduit.addEventListener("click", async () => {
        reinitialiserFormulaireAjoutProduit();
        await chargerCategoriesEntreprise();
        rendreOptionsCategoriesSelecteur();
        afficherEcran("ecran-ajout-produit");
    });
}

            
 

// Bouton enregistrer produit
const btnEnregistrerProduit = document.querySelector("#ecran-ajout-produit .ajout-enregistrer-btn");
if (btnEnregistrerProduit) {
    btnEnregistrerProduit.addEventListener("click", async () => {
        await enregistrerProduit();
    });
}

// Calcul prix en temps réel
const observerPrixEtQuantites = () => {
    // Écouter les changements de prix
    const lignesPrix = document.querySelectorAll("#ecran-ajout-produit .ajout-ligne");
    if (lignesPrix.length >= 2) {
        const derniereLigne = lignesPrix[lignesPrix.length - 1];
        const inputsDerniereLigne = derniereLigne.querySelectorAll(".ajout-input");
        inputsDerniereLigne.forEach(input => {
            input.addEventListener("input", calculerEtAfficherPrix);
        });
    }
};
observerPrixEtQuantites();



            
            // Retours
            const retourProduits = document.getElementById("retour-produits");
            if (retourProduits) {
                retourProduits.addEventListener("click", () => {
                    afficherEcran("ecran-produits");
                });
            }
            
            const retourAjout = document.getElementById("retour-ajout");
            if (retourAjout) {
                retourAjout.addEventListener("click", () => {
                    afficherEcran("ecran-produits");
                });
            }
            
            const retourRapports = document.getElementById("retour-rapports");
            if (retourRapports) {
                retourRapports.addEventListener("click", () => {
                    afficherEcran("ecran-rapports");
                });
            }
            
            const retourMenuEntreprise = document.getElementById("retour-menu-entreprise");
            if (retourMenuEntreprise) {
                retourMenuEntreprise.addEventListener("click", () => {
                    afficherEcran("ecran-menu");
                });
            }
            
// Upload logo entreprise
const zoneLogoUpload = document.getElementById("zone-logo-upload");
const inputLogoEntreprise = document.getElementById("input-logo-entreprise");

if (zoneLogoUpload && inputLogoEntreprise) {
    zoneLogoUpload.addEventListener("click", () => {
        sessionStorage.setItem("ecran-actuel", ecranActuel);
        inputLogoEntreprise.click();
    });

    inputLogoEntreprise.addEventListener("change", async (event) => {
        restaurerEcranSauvegarde();

        const fichier = event.target.files?.[0];
        if (!fichier) return;

        try {
            const resultatCompression = await compresserLogoEntreprise(fichier);

            logoEntrepriseFichier = resultatCompression.fichier;
            logoEntreprisePreviewUrl = resultatCompression.previewUrl;

            afficherPreviewLogoEntreprise(logoEntreprisePreviewUrl);

            console.log("Logo compressé :", {
                nom: logoEntrepriseFichier.name,
                type: logoEntrepriseFichier.type,
                tailleKo: (logoEntrepriseFichier.size / 1024).toFixed(2),
                largeur: resultatCompression.largeur,
                hauteur: resultatCompression.hauteur
            });
        } catch (erreur) {
            console.error("Erreur compression logo :", erreur);
            afficherMessageErreur("Impossible de traiter cette image.");
        }
    });
}
            
            // Menu entreprise
            const menuEntreprise = document.getElementById("menu-entreprise");
if (menuEntreprise) {
    menuEntreprise.addEventListener("click", async () => {
        afficherEcran("ecran-entreprise");

        // Charger et afficher les membres dynamiquement
        await chargerMembresEntreprise();
        rendreListeMembresEntreprise();

        // Réappliquer la visibilité
        appliquerVisibiliteRole();
    });
}




document.getElementById('btn-ajouter-utilisateur-entreprise').addEventListener('click', () => {
            ouvrirPanneauEntreprise(panneauInvitationEntreprise);
        });
        
document.querySelectorAll('[data-role-invitation-entreprise]').forEach(carte => {
    carte.addEventListener('click', async () => {
        const roleEntreprise = carte.getAttribute('data-role-invitation-entreprise');
        const infosRoleEntreprise = donneesRolesEntreprise[roleEntreprise];

        fermerPanneauEntreprise(panneauInvitationEntreprise);

        // Créer l'invitation en base (avec token unique)
        const invitation = await creerInvitationEntreprise(roleEntreprise);

        if (!invitation) return;

        // Mettre à jour l'interface QR
        const nomEntrepriseEntreprise = document.getElementById('nom-entreprise-affichage').textContent;
        document.getElementById('invitation-qr-entreprise').textContent =
            `${nomEntrepriseEntreprise} vous invite à rejoindre l'équipe en tant que`;
        document.getElementById('nom-entreprise-qr').textContent = nomEntrepriseEntreprise;
        document.getElementById('nom-role-qr-entreprise').textContent = infosRoleEntreprise.nom;

        // Générer le QR code avec le token unique
        const conteneurQrEntreprise = document.getElementById('qrcode-entreprise');
        conteneurQrEntreprise.innerHTML = '';

        // Le contenu du QR = JSON avec le token
        const donneeQrEntreprise = JSON.stringify({
            type: 'invitation',
            token: invitation.token,
            entreprise_id: invitation.entreprise_id,
            role: invitation.role
        });

        if (typeof QRCode !== 'undefined') {
            instanceQrCodeEntreprise = new QRCode(conteneurQrEntreprise, {
                text: donneeQrEntreprise,
                width: 200,
                height: 200,
                colorDark: "#1a1a2e",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            conteneurQrEntreprise.innerHTML = '<div style="width:200px;height:200px;background:var(--fond-tertiaire);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--texte-secondaire);font-size:0.75rem;">QR Code</div>';
        }

        setTimeout(() => {
            qrPleinEcranEntreprise.classList.add('actif');
        }, 280);
    });
});


        
document.getElementById('btn-fermer-qr-entreprise').addEventListener('click', () => {
            qrPleinEcranEntreprise.classList.remove('actif');
        });
        
 
            
const ouvrirEditionEntreprise = document.getElementById("ouvrir-edition-entreprise");
if (ouvrirEditionEntreprise) {
    ouvrirEditionEntreprise.addEventListener("click", () => {
        preRemplirFormulaireEntreprisePourEdition();
        afficherEcran("ecran-creer-entreprise");
    });
}

document.querySelectorAll('[data-tag-role-entreprise]').forEach(tag => {
            tag.addEventListener('click', () => {
                const nouveauRoleEntreprise = tag.getAttribute('data-tag-role-entreprise');
                roleSelectionneMembreEntreprise = nouveauRoleEntreprise;

                mettreAJourTagsRolesEntreprise(nouveauRoleEntreprise);

                if (membreSelectionneEntreprise) {
                    mettreAJourDescriptionRoleEntreprise(membreSelectionneEntreprise.nom, nouveauRoleEntreprise);
                }

                // Activer/désactiver le bouton modifier
                const btnModifierEntreprise = document.getElementById('btn-modifier-role-entreprise');
                btnModifierEntreprise.disabled = (nouveauRoleEntreprise === roleCourantMembreEntreprise);
            });
        });  
        
document.getElementById('btn-modifier-role-entreprise').addEventListener('click', async () => {
    if (!membreSelectionneEntreprise || !membreSelectionneEntreprise.id) return;
    if (roleSelectionneMembreEntreprise === roleCourantMembreEntreprise) return;

    const ancienRoleEntreprise = donneesRolesEntreprise[roleCourantMembreEntreprise].nom;
    const nouveauRoleEntreprise = donneesRolesEntreprise[roleSelectionneMembreEntreprise].nom;

    const confirmer = confirm(
        `Modifier le rôle de ${membreSelectionneEntreprise.nom} ?\n${ancienRoleEntreprise} → ${nouveauRoleEntreprise}`
    );

    if (!confirmer) return;

    const { data, error } = await clientSupabase
        .rpc("modifier_role_membre", {
            p_entreprise_id: entrepriseActuelle.id,
            p_membre_id: membreSelectionneEntreprise.id,
            p_nouveau_role: roleSelectionneMembreEntreprise
        });

    if (error) {
        console.error("Erreur modification rôle :", error);
        const message = error.message || "";
        if (message.includes("dernier administrateur") || message.includes("au moins un")) {
            afficherMessageErreur("Impossible : il doit rester au moins un administrateur.");
        } else {
            afficherMessageErreur("Impossible de modifier le rôle.");
        }
        return;
    }

    afficherMessageSucces(`Rôle de ${membreSelectionneEntreprise.nom} modifié : ${ancienRoleEntreprise} → ${nouveauRoleEntreprise}`);

    fermerPanneauEntreprise(panneauProfilEntreprise);

    // Recharger les membres
    await chargerMembresEntreprise();
    rendreListeMembresEntreprise();
});

        
document.getElementById('btn-retirer-membre-entreprise').addEventListener('click', async () => {
    if (!membreSelectionneEntreprise || !membreSelectionneEntreprise.id) return;

    const confirmer = confirm(`Retirer ${membreSelectionneEntreprise.nom} de l'équipe ?`);
    if (!confirmer) return;

    const { data, error } = await clientSupabase
        .rpc("retirer_membre_entreprise", {
            p_entreprise_id: entrepriseActuelle.id,
            p_membre_id: membreSelectionneEntreprise.id
        });

    if (error) {
        console.error("Erreur retrait membre :", error);
        const message = error.message || "";
        if (message.includes("dernier administrateur")) {
            afficherMessageErreur("Impossible de retirer le dernier administrateur.");
        } else if (message.includes("vous-même")) {
            afficherMessageErreur("Utilisez 'Quitter l'entreprise' pour vous retirer.");
        } else {
            afficherMessageErreur("Impossible de retirer ce membre.");
        }
        return;
    }

    afficherMessageSucces(`${membreSelectionneEntreprise.nom} a été retiré de l'équipe.`);

    fermerPanneauEntreprise(panneauProfilEntreprise);

    await chargerMembresEntreprise();
    rendreListeMembresEntreprise();
});

        
      overlayEntreprise.addEventListener('click', fermerTousPanneauxEntreprise);
      
  document.getElementById('verrou-entreprise').addEventListener('change', async function() {
    if (!entrepriseActuelle?.id) return;

    const verrouiller = this.checked;

    const { data, error } = await clientSupabase
        .rpc("basculer_verrouillage_entreprise", {
            p_entreprise_id: entrepriseActuelle.id,
            p_verrouiller: verrouiller
        });

    if (error) {
        console.error("Erreur verrouillage :", error);
        afficherMessageErreur("Impossible de modifier le verrouillage.");
        // Remettre le switch à son état d'avant
        this.checked = !verrouiller;
        return;
    }

    entrepriseActuelle.verrouillee = verrouiller;

    if (verrouiller) {
        afficherMessageSucces("L'entreprise est verrouillée. Seuls les administrateurs conservent l'accès.");
    } else {
        afficherMessageSucces("L'entreprise est déverrouillée. Tous les membres retrouvent leur accès.");
    }
});

        
  document.getElementById('btn-quitter-entreprise').addEventListener('click', async () => {
    if (!entrepriseActuelle?.id) return;

    const confirmer = confirm("Êtes-vous sûr de vouloir quitter cette entreprise ? Cette action est irréversible.");
    if (!confirmer) return;

    const { data, error } = await clientSupabase
        .rpc("quitter_entreprise", {
            p_entreprise_id: entrepriseActuelle.id
        });

    if (error) {
        console.error("Erreur quitter entreprise :", error);
        const message = error.message || "";
        if (message.includes("seul administrateur")) {
            afficherMessageErreur("Vous êtes le seul administrateur. Nommez un autre administrateur avant de quitter.");
        } else {
            afficherMessageErreur("Impossible de quitter l'entreprise.");
        }
        return;
    }

    afficherMessageSucces("Vous avez quitté l'entreprise.");

    entrepriseActuelle = null;
    roleUtilisateurActuel = null;

    await chargerContexteUtilisateurComplet();
    await chargerEntreprisesUtilisateur();

    remplirInterfaceUtilisateurEtEntreprise();
    rendreListeChoixEntreprise();

    afficherEcran("ecran-choix-entreprise");
});

        
document.getElementById('btn-exporter-qr-entreprise').addEventListener('click', () => {
            const canvasEntreprise = document.querySelector('#qrcode-entreprise canvas');
            const imgEntreprise = document.querySelector('#qrcode-entreprise img');

            let urlDonneeEntreprise = null;

            if (canvasEntreprise) {
                urlDonneeEntreprise = canvasEntreprise.toDataURL('image/png');
            } else if (imgEntreprise) {
                urlDonneeEntreprise = imgEntreprise.src;
            }

            if (urlDonneeEntreprise) {
                const lienEntreprise = document.createElement('a');
                lienEntreprise.download = 'invitation-qr-entreprise.png';
                lienEntreprise.href = urlDonneeEntreprise;
                lienEntreprise.click();
            } else {
                alert("Aucun QR code à exporter.");
            }
        });
        
        // ===== Scanner QR : fermer =====
document.getElementById('scanner-qr-btn-fermer').addEventListener('click', () => {
    fermerScannerQr();
});

// ===== Scanner QR : torche =====
document.getElementById('scanner-qr-btn-torche').addEventListener('click', () => {
    basculerTorcheScanner();
});

// ===== Scanner QR : galerie =====
document.getElementById('scanner-qr-btn-galerie').addEventListener('click', () => {
    ouvrirGalerieScanner();
});

// ===== Scanner QR : fichier importé depuis galerie =====
document.getElementById('scanner-qr-input-galerie').addEventListener('change', (event) => {
    restaurerEcranSauvegarde();
    const fichier = event.target.files?.[0];
    if (!fichier) return;

    console.log('Image QR sélectionnée :', fichier.name, fichier.type, (fichier.size / 1024).toFixed(2) + ' Ko');

    // Fermer le scanner visuel pendant le traitement
    fermerScannerQr();

    // Lire le QR code depuis l'image
    lireQrCodeDepuisImage(fichier);

    // Réinitialiser l'input
    event.target.value = '';
});


            
            // Toggle mode depuis menu
            const toggleMode = document.getElementById("toggle-mode");
            if (toggleMode) {
                toggleMode.addEventListener("click", () => {
                    toggleMode.classList.toggle("actif");
                    modeSombre = !modeSombre;
                    if (modeSombre) {
                        document.documentElement.setAttribute("data-mode", "sombre");
                    } else {
                        document.documentElement.removeAttribute("data-mode");
                    }
                });
            }
            
            // Rapports
            document.querySelectorAll(".rapport-carte").forEach(carte => {
                carte.addEventListener("click", () => {
                    const typeRapportClique = carte.dataset.rapport;
                    const titreRapportClique = carte.querySelector(".rapport-nom").textContent;

                    typeRapportActuelRapport = typeRapportClique;
                    estRapportBudgetaireRapport = estRapportBudgetaireTypeRapport(typeRapportClique);

                    if (estRapportBudgetaireRapport) {
                        // Stocker les infos puis ouvrir le bottom sheet de période
                        ouvrirFeuillePeriodesRapport();
                    } else {
                        // Rapport d'actualité : ouvrir directement
                        ouvrirApercuRapport(typeRapportClique, titreRapportClique);
                    }
                });
            });

            
            // ===== Modal Mouvement =====
            const btnEntree = document.getElementById("btn-entree");
            const btnSortie = document.getElementById("btn-sortie");
            const btnInventaire = document.getElementById("btn-inventaire");
            const modalMouvement = document.getElementById("modal-mouvement");
            const fermerMouvementBtn = document.getElementById("fermer-mouvement");

            if (btnEntree) {
                btnEntree.addEventListener("click", () => {
                    ouvrirModalMouvement("entree");
                });
            }

            if (btnSortie) {
                btnSortie.addEventListener("click", () => {
                    ouvrirModalMouvement("sortie");
                });
            }

            if (btnInventaire) {
                btnInventaire.addEventListener("click", () => {
                    ouvrirModalMouvement("inventaire");
                });
            }

            if (fermerMouvementBtn) {
                fermerMouvementBtn.addEventListener("click", () => {
                    modalMouvement.classList.remove("actif");
                });
            }

            if (modalMouvement) {
                modalMouvement.addEventListener("click", (e) => {
                    if (e.target === modalMouvement) {
                        modalMouvement.classList.remove("actif");
                    }
                });
            }

            // Sélecteur emplacement mouvement
            const afficheEmplacementMouvement = document.getElementById("affiche-emplacement-mouvement");
            const selecteurEmplacementMouvement = document.getElementById("selecteur-emplacement-mouvement");
            const listeEmplacementMouvement = document.getElementById("liste-emplacement-mouvement");

            if (afficheEmplacementMouvement) {
                afficheEmplacementMouvement.addEventListener("click", () => {
                    selecteurEmplacementMouvement.classList.toggle("ouvert-mouvement");
                });
            }

             

            // Fermer sélecteur emplacement si clic ailleurs
            document.addEventListener("click", (e) => {
                if (selecteurEmplacementMouvement && !selecteurEmplacementMouvement.contains(e.target)) {
                    selecteurEmplacementMouvement.classList.remove("ouvert-mouvement");
                }
            });

            // Quantité +/-
            const btnPlusMouvement = document.getElementById("btn-plus-mouvement");
            const btnMoinsMouvement = document.getElementById("btn-moins-mouvement");
            const inputQuantiteMouvement = document.getElementById("input-quantite-mouvement");

            if (btnPlusMouvement) {
                btnPlusMouvement.addEventListener("click", () => {
                    let val = parseInt(inputQuantiteMouvement.value) || 0;
                    val++;
                    inputQuantiteMouvement.value = val;
                    mettreAJourResultatMouvement();
                });
            }

            if (btnMoinsMouvement) {
                btnMoinsMouvement.addEventListener("click", () => {
                    let val = parseInt(inputQuantiteMouvement.value) || 0;
                    if (val > 0) val--;
                    inputQuantiteMouvement.value = val;
                    mettreAJourResultatMouvement();
                });
            }

            if (inputQuantiteMouvement) {
                inputQuantiteMouvement.addEventListener("input", () => {
                    mettreAJourResultatMouvement();
                });
            }

            // Compteur note mouvement
            const textareaMouvement = document.getElementById("textarea-note-mouvement");
            const compteurNoteMouvement = document.getElementById("compteur-note-mouvement");

            if (textareaMouvement) {
                textareaMouvement.addEventListener("input", () => {
                    const longueur = textareaMouvement.value.length;
                    compteurNoteMouvement.textContent = longueur + " / 50";
                    if (longueur >= 45) {
                        compteurNoteMouvement.classList.add("limite-mouvement");
                    } else {
                        compteurNoteMouvement.classList.remove("limite-mouvement");
                    }
                });
            }
            
            // ===== Bouton Valider Mouvement =====
const btnValiderMouvementEvt = document.getElementById("btn-valider-mouvement");
if (btnValiderMouvementEvt) {
    btnValiderMouvementEvt.addEventListener("click", async () => {
        await validerMouvement();
    });
}


            
// Onglets produits avec filtrage 
document.querySelectorAll("#ecran-produits .onglet-btn").forEach((onglet, index) => {
    onglet.addEventListener("click", () => {
        document.querySelectorAll("#ecran-produits .onglet-btn").forEach(o => o.classList.remove("actif"));
        onglet.classList.add("actif");

        const filtres = ['tous', 'nul', 'faible', 'normal', 'eleve'];
        const filtre = filtres[index] || 'tous';

        const produitsFiltres = filtrerProduitsParOnglet(filtre);
        rendreProduits(produitsFiltres);
    });
});


            
// Filtres historique
document.querySelectorAll("#ecran-historique .filtre-btn").forEach((filtre, index) => {
    filtre.addEventListener("click", async () => {
        document.querySelectorAll("#ecran-historique .filtre-btn").forEach(f => f.classList.remove("actif"));
        filtre.classList.add("actif");

        const types = ['tous', 'entree', 'sortie', 'inventaire'];
        filtreTypeHistorique = types[index] || 'tous';

        await chargerHistoriqueMouvements();
    });
});

            
            // ==================== BOTTOM SHEET PÉRIODE HISTORIQUE ====================

// Ouvrir le bottom sheet en cliquant sur date-select
const dateSelectHistorique = document.querySelector(".date-select");
if (dateSelectHistorique) {
    dateSelectHistorique.addEventListener("click", () => {
        ouvrirFeuillePeriodesHistorique();
    });
}

// Fermer en cliquant sur la superposition (fond sombre)
const superpositionPeriodeHistorique = document.getElementById("superposition-periode-historique");
if (superpositionPeriodeHistorique) {
    superpositionPeriodeHistorique.addEventListener("click", (e) => {
        if (e.target === superpositionPeriodeHistorique) {
            fermerFeuillePeriodesHistorique();
        }
    });
}

// Sélection d'une période
document.querySelectorAll(".option-periode-historique").forEach(option => {
    option.addEventListener("click", async () => {
        const periode = option.dataset.periodeHistorique;

        if (periode === "periode") {
            afficherDatesPersonnaliseesHistorique();
        } else {
            await selectionnerPeriodeHistorique(periode);
        }
    });
});


// Retour depuis les dates personnalisées vers la liste
const btnRetourDatesHistorique = document.getElementById("btn-retour-dates-historique");
if (btnRetourDatesHistorique) {
    btnRetourDatesHistorique.addEventListener("click", () => {
        retourListePeriodesHistorique();
    });
}

// Appliquer les dates personnalisées
const btnAppliquerDatesHistorique = document.getElementById("btn-appliquer-dates-historique");
if (btnAppliquerDatesHistorique) {
    btnAppliquerDatesHistorique.addEventListener("click", async () => {
        await appliquerDatesPersonnaliseesHistorique();
    });
}

// ==================== BOTTOM SHEET PÉRIODE RAPPORT ====================

// Fermer en cliquant sur la superposition (fond sombre)
const superpositionPeriodeRapport = document.getElementById("superposition-periode-rapport");
if (superpositionPeriodeRapport) {
    superpositionPeriodeRapport.addEventListener("click", (e) => {
        if (e.target === superpositionPeriodeRapport) {
            fermerFeuillePeriodesRapport();
        }
    });
}

// Sélection d'une période rapport
document.querySelectorAll(".option-periode-rapport").forEach(optionRapport => {
    optionRapport.addEventListener("click", () => {
        const periodeRapport = optionRapport.dataset.periodeRapport;

        if (periodeRapport === "periode") {
            afficherDatesPersonnaliseesRapport();
        } else {
            selectionnerPeriodeRapport(periodeRapport);
        }
    });
});

// Retour depuis les dates personnalisées vers la liste rapport
const btnRetourDatesRapport = document.getElementById("btn-retour-dates-rapport");
if (btnRetourDatesRapport) {
    btnRetourDatesRapport.addEventListener("click", () => {
        retourListePeriodesRapport();
    });
}

// Appliquer les dates personnalisées rapport
const btnAppliquerDatesRapport = document.getElementById("btn-appliquer-dates-rapport");
if (btnAppliquerDatesRapport) {
    btnAppliquerDatesRapport.addEventListener("click", () => {
        appliquerDatesPersonnaliseesRapport();
    });
}

            
            // Onglets notifications
            document.querySelectorAll(".notif-onglet").forEach(onglet => {
                onglet.addEventListener("click", () => {
                    document.querySelectorAll(".notif-onglet").forEach(o => o.classList.remove("actif"));
                    onglet.classList.add("actif");
                });
            });
        
          document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        const ecranSauvegarde = obtenirEcranSauvegarde();

        if (ecranSauvegarde && ecranSauvegarde !== ecranActuel) {
            console.log("Retour application - restauration écran :", ecranSauvegarde);
            restaurerEcranSauvegarde();
        }
    }
});

window.addEventListener("focus", () => {
    const ecranSauvegarde = obtenirEcranSauvegarde();

    if (ecranSauvegarde && ecranSauvegarde !== ecranActuel) {
        console.log("Focus application - restauration écran :", ecranSauvegarde);
        restaurerEcranSauvegarde();
    }
});
        });
        
        clientSupabase.auth.onAuthStateChange((evenement, session) => {
    console.log("Changement auth :", evenement, session);

    setTimeout(async () => {
        if (evenement === "SIGNED_OUT") {
            await initialiserSessionUtilisateur(session, {
                appliquerRoutage: true,
                restaurerEcran: false
            });
            return;
        }

        if (evenement === "SIGNED_IN") {
            await initialiserSessionUtilisateur(session, {
                appliquerRoutage: true,
                restaurerEcran: true
            });
            return;
        }

        await initialiserSessionUtilisateur(session, {
            appliquerRoutage: false,
            restaurerEcran: true
        });
    }, 0);
});
    