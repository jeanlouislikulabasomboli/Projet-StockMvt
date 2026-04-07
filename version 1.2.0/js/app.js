
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

        const donneesProduits = [
            { id: 1, nom: "Riz Premium 5kg", code: "PRD-001", codeBarres: "6123456789012", categorie: "Alimentaire", quantite: 156, min: 20, max: 500, prixAchat: 8.50, prixVente: 12.00, emplacement: "Entrepôt A", statut: "stock" },
            { id: 2, nom: "Huile de palme 1L", code: "PRD-002", codeBarres: "6123456789013", categorie: "Alimentaire", quantite: 89, min: 30, max: 200, prixAchat: 3.20, prixVente: 5.00, emplacement: "Entrepôt A", statut: "stock" },
            { id: 3, nom: "Sucre blanc 1kg", code: "PRD-003", codeBarres: "6123456789014", categorie: "Alimentaire", quantite: 15, min: 25, max: 150, prixAchat: 1.80, prixVente: 2.50, emplacement: "Magasin", statut: "faible" },
            { id: 4, nom: "Farine de blé 2kg", code: "PRD-004", codeBarres: "6123456789015", categorie: "Alimentaire", quantite: 0, min: 20, max: 100, prixAchat: 2.50, prixVente: 4.00, emplacement: "Entrepôt B", statut: "rupture" },
            { id: 5, nom: "Savon de ménage", code: "PRD-005", codeBarres: "6123456789016", categorie: "Hygiène", quantite: 234, min: 50, max: 200, prixAchat: 0.80, prixVente: 1.50, emplacement: "Magasin", statut: "surstock" },
            { id: 6, nom: "Pâte dentifrice", code: "PRD-006", codeBarres: "6123456789017", categorie: "Hygiène", quantite: 67, min: 20, max: 100, prixAchat: 1.20, prixVente: 2.00, emplacement: "Magasin", statut: "stock" },
            { id: 7, nom: "Café instantané 200g", code: "PRD-007", codeBarres: "6123456789018", categorie: "Boissons", quantite: 8, min: 15, max: 80, prixAchat: 4.50, prixVente: 7.00, emplacement: "Entrepôt A", statut: "faible" },
            { id: 8, nom: "Lait concentré 400g", code: "PRD-008", codeBarres: "6123456789019", categorie: "Alimentaire", quantite: 145, min: 30, max: 150, prixAchat: 1.50, prixVente: 2.50, emplacement: "Magasin", statut: "stock" },
            { id: 9, nom: "Eau minérale 1.5L", code: "PRD-009", codeBarres: "6123456789020", categorie: "Boissons", quantite: 0, min: 50, max: 300, prixAchat: 0.50, prixVente: 1.00, emplacement: "Entrepôt A", statut: "rupture" },
            { id: 10, nom: "Jus d'orange 1L", code: "PRD-010", codeBarres: "6123456789021", categorie: "Boissons", quantite: 78, min: 20, max: 100, prixAchat: 2.00, prixVente: 3.50, emplacement: "Magasin", statut: "stock" },
            { id: 11, nom: "Détergent 1kg", code: "PRD-011", codeBarres: "6123456789022", categorie: "Ménage", quantite: 12, min: 25, max: 100, prixAchat: 3.00, prixVente: 5.00, emplacement: "Entrepôt B", statut: "faible" },
            { id: 12, nom: "Eponges (lot de 5)", code: "PRD-012", codeBarres: "6123456789023", categorie: "Ménage", quantite: 189, min: 30, max: 100, prixAchat: 1.00, prixVente: 2.00, emplacement: "Magasin", statut: "surstock" }
        ];

        const donneesHistorique = [
            { id: 1, type: "entree", produit: "Riz Premium 5kg", quantite: 50, avant: 106, apres: 156, motif: "Achat", utilisateur: "Jean Dupont", date: "2025-01-15", heure: "14:30", observations: "Livraison fournisseur ABC" },
            { id: 2, type: "sortie", produit: "Huile de palme 1L", quantite: 24, avant: 113, apres: 89, motif: "Vente", utilisateur: "Marie Martin", date: "2025-01-15", heure: "11:45", observations: "Vente client grossiste" },
            { id: 3, type: "entree", produit: "Sucre blanc 1kg", quantite: 100, avant: 0, apres: 100, motif: "Achat", utilisateur: "Jean Dupont", date: "2025-01-14", heure: "09:15", observations: "" },
            { id: 4, type: "inventaire", produit: "Savon de ménage", quantite: -10, avant: 244, apres: 234, motif: "Correction", utilisateur: "Paul Durand", date: "2025-01-14", heure: "16:00", observations: "Produits endommagés" },
            { id: 5, type: "sortie", produit: "Café instantané 200g", quantite: 7, avant: 15, apres: 8, motif: "Vente", utilisateur: "Marie Martin", date: "2025-01-13", heure: "10:30", observations: "" },
            { id: 6, type: "entree", produit: "Lait concentré 400g", quantite: 45, avant: 100, apres: 145, motif: "Transfert", utilisateur: "Jean Dupont", date: "2025-01-13", heure: "08:00", observations: "Transfert du dépôt central" },
            { id: 7, type: "sortie", produit: "Eau minérale 1.5L", quantite: 120, avant: 120, apres: 0, motif: "Vente", utilisateur: "Marie Martin", date: "2025-01-12", heure: "15:20", observations: "Commande spéciale événement" },
            { id: 8, type: "entree", produit: "Jus d'orange 1L", quantite: 30, avant: 48, apres: 78, motif: "Achat", utilisateur: "Jean Dupont", date: "2025-01-12", heure: "11:00", observations: "" }
        ];

        const donneesNotifications = [
            { id: 1, type: "faible", titre: "Stock faible", desc: "Sucre blanc 1kg - 15 unités restantes", date: "Il y a 2h", lu: false },
            { id: 2, type: "faible", titre: "Stock faible", desc: "Café instantané 200g - 8 unités restantes", date: "Il y a 5h", lu: false },
            { id: 3, type: "rupture", titre: "Rupture de stock", desc: "Farine de blé 2kg - Stock épuisé", date: "Hier", lu: false },
            { id: 4, type: "rupture", titre: "Rupture de stock", desc: "Eau minérale 1.5L - Stock épuisé", date: "Hier", lu: false },
            { id: 5, type: "surstock", titre: "Surstock détecté", desc: "Savon de ménage - 234 unités (max: 200)", date: "Il y a 2 jours", lu: true },
            { id: 6, type: "surstock", titre: "Surstock détecté", desc: "Eponges (lot de 5) - 189 unités (max: 100)", date: "Il y a 3 jours", lu: true },
            { id: 7, type: "faible", titre: "Stock faible", desc: "Détergent 1kg - 12 unités restantes", date: "Il y a 3 jours", lu: true }
        ];
        
        // ==================== SUPABASE ====================
const URL_SUPABASE = "https://sscfbqidwfzmwfycmpgu.supabase.co";
const CLE_PUBLIQUE_SUPABASE = "sb_publishable__gqk44RVJvob57geoVDvCw_jwPqFX0n";

const clientSupabase = supabase.createClient(URL_SUPABASE, CLE_PUBLIQUE_SUPABASE);

// ==================== SESSION / DONNÉES COURANTES ====================
let sessionActuelle = null;
let utilisateurActuel = null;
let profilActuel = null;
let entrepriseActuelle = null;
let logoEntrepriseFichier = null;
let modeEditionEntreprise = false;
let logoEntrepriseUrlExistante = null;

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
            }
            
            const nav = document.getElementById("nav-principale");
            const ecransAvecNav = ["ecran-accueil", "ecran-produits", "ecran-historique", "ecran-rapports", "ecran-menu"];
            nav.style.display = ecransAvecNav.includes(idEcran) ? "flex" : "none";
        }

        function formaterDate(dateStr) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            return new Date(dateStr).toLocaleDateString('fr-FR', options);
        }

        function obtenirStatutClass(statut) {
            const classes = {
                stock: "stock",
                faible: "faible",
                rupture: "rupture",
                surstock: "surstock"
            };
            return classes[statut] || "stock";
        }

        function obtenirStatutTexte(statut) {
            const textes = {
                stock: "En stock",
                faible: "Stock faible",
                rupture: "Rupture",
                surstock: "Surstock"
            };
            return textes[statut] || "En stock";
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

        function rendreProduits() {
            const conteneur = document.getElementById("produits-liste");
            if (!conteneur) return;
            
            const categories = {};
            donneesProduits.forEach(p => {
                const cat = p.categorie || "Sans catégorie";
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(p);
            });
            
            conteneur.innerHTML = Object.entries(categories).map(([cat, produits]) => `
                <div class="categorie-section">
                    <div class="categorie-entete">
                        <div class="categorie-gauche">
                            <span class="categorie-nom">${cat}</span>
                            <span class="categorie-nombre">${produits.length}</span>
                        </div>
                        <div class="categorie-toggle">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </div>
                    </div>
                    <div class="categorie-produits">
                        ${produits.map(p => `
                            <div class="produit-carte" data-id="${p.id}">
                                <div class="produit-image">
                                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <circle cx="9" cy="9" r="2"/>
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                    </svg>
                                </div>
                                <div class="produit-infos">
                                    <div class="produit-nom">${p.nom}</div>
                                    <div class="produit-code">${p.code}</div>
                                </div>
                                <div class="produit-droite">
                                    <div class="produit-quantite">${p.quantite}</div>
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
            
            // Clic produit
            conteneur.querySelectorAll(".produit-carte").forEach(carte => {
                carte.addEventListener("click", () => {
                    afficherEcran("ecran-details-produit");
                });
            });
        }

        function rendreHistorique() {
            const conteneur = document.getElementById("historique-liste");
            if (!conteneur) return;
            
            const parDate = {};
            donneesHistorique.forEach(h => {
                if (!parDate[h.date]) parDate[h.date] = [];
                parDate[h.date].push(h);
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
                        
                        return `
                            <div class="historique-item">
                                <div class="historique-item-entete">
                                    <div class="historique-type-icone ${iconeClass}">
                                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconePath}</svg>
                                    </div>
                                    <span class="historique-type">${typeTexte}</span>
                                    <span class="historique-heure">${h.heure}</span>
                                </div>
                                <div class="historique-produit">${h.produit}</div>
                                <div class="historique-details">
                                    <span class="historique-detail">Motif: ${h.motif}</span>
                                    <span class="historique-detail">Par: ${h.utilisateur}</span>
                                    ${h.observations ? `<span class="historique-detail">Note: ${h.observations}</span>` : ""}
                                </div>
                                <div class="historique-quantites">
                                    <span class="quantite-badge avant">Avant: ${h.avant}</span>
                                    <span class="quantite-badge apres">Après: ${h.apres}</span>
                                    <span class="quantite-badge final">Final: ${h.apres}</span>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            `).join("");
        }

        function rendreNotifications() {
            const conteneur = document.getElementById("notifications-liste");
            if (!conteneur) return;
            
            conteneur.innerHTML = donneesNotifications.map(n => {
                const iconePath = n.type === "faible" 
                    ? '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
                    : n.type === "rupture"
                    ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                    : '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>';
                
                return `
                    <div class="notification-carte ${n.lu ? "" : "non-lue"} ${n.type}">
                        <div class="notification-icone ${n.type}">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconePath}</svg>
                        </div>
                        <div class="notification-contenu">
                            <div class="notification-titre">${n.titre}</div>
                            <div class="notification-desc">${n.desc}</div>
                            <div class="notification-date">${n.date}</div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        function rendreTableauRapport(typeRapport) {
            const conteneur = document.getElementById("rapport-tableau-conteneur");
            if (!conteneur) return;
            
            let tableauHTML = "";
            
            if (typeRapport === "global" || typeRapport === "stock") {
                const produits = typeRapport === "stock" ? donneesProduits.filter(p => p.statut === "stock") : donneesProduits;
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
                const produits = donneesProduits.filter(p => p.statut === "rupture");
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
            } else if (typeRapport === "ventes") {
                const ventes = donneesHistorique.filter(h => h.type === "sortie" && h.motif === "Vente");
                tableauHTML = `
                    <table class="rapport-tableau">
                        <thead>
                            <tr>
                                <th>N°</th>
                                <th>Date</th>
                                <th>Heure</th>
                                <th>Produit</th>
                                <th>Qté vendue</th>
                                <th>P.U vente</th>
                                <th>Total vente</th>
                                <th>Vendeur</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ventes.map((v, i) => {
                                const produit = donneesProduits.find(p => p.nom === v.produit);
                                const prixUnitaire = produit ? produit.prixVente : 0;
                                return `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${formaterDate(v.date)}</td>
                                        <td>${v.heure}</td>
                                        <td>${v.produit}</td>
                                        <td style="font-weight:600">${v.quantite}</td>
                                        <td>${prixUnitaire.toFixed(2)} $</td>
                                        <td style="color:var(--succes);font-weight:600">${(v.quantite * prixUnitaire).toFixed(2)} $</td>
                                        <td>${v.utilisateur}</td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                    <div class="rapport-total">
                        <span class="rapport-total-label">Total des ventes</span>
                        <span class="rapport-total-valeur" style="color:var(--succes)">${ventes.reduce((acc, v) => {
                            const produit = donneesProduits.find(p => p.nom === v.produit);
                            return acc + v.quantite * (produit ? produit.prixVente : 0);
                        }, 0).toFixed(2)} $</span>
                    </div>
                `;
            } else if (typeRapport === "finance") {
                const totalAchats = donneesHistorique.filter(h => h.type === "entree" && h.motif === "Achat").reduce((acc, h) => {
                    const produit = donneesProduits.find(p => p.nom === h.produit);
                    return acc + h.quantite * (produit ? produit.prixAchat : 0);
                }, 0);
                
                const totalVentes = donneesHistorique.filter(h => h.type === "sortie" && h.motif === "Vente").reduce((acc, h) => {
                    const produit = donneesProduits.find(p => p.nom === h.produit);
                    return acc + h.quantite * (produit ? produit.prixVente : 0);
                }, 0);
                
                const benefice = totalVentes - totalAchats;
                const marge = totalVentes > 0 ? ((benefice / totalVentes) * 100).toFixed(1) : 0;
                
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
                                <td style="color:var(--danger)">${totalAchats.toFixed(2)} $</td>
                            </tr>
                            <tr>
                                <td style="font-weight:600">Total des ventes</td>
                                <td style="color:var(--succes)">${totalVentes.toFixed(2)} $</td>
                            </tr>
                            <tr style="background:var(--fond-tertiaire)">
                                <td style="font-weight:700">Bénéfice net</td>
                                <td style="font-weight:700;color:${benefice >= 0 ? 'var(--succes)' : 'var(--danger)'}">${benefice.toFixed(2)} $</td>
                            </tr>
                            <tr style="background:var(--fond-tertiaire)">
                                <td style="font-weight:700">Marge bénéficiaire</td>
                                <td style="font-weight:700;color:var(--accent)">${marge}%</td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }
            
            conteneur.innerHTML = tableauHTML;
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

function remplirAvatarsUtilisateur() {
    const photoUtilisateur =
        profilActuel?.photo_url ||
        obtenirPhotoUtilisateurDepuisAuth(utilisateurActuel) ||
        null;

    console.log("Photo utilisateur utilisée :", photoUtilisateur);

    afficherAvatarDansElement("menu-avatar-img", "menu-avatar-svg", photoUtilisateur);
    afficherAvatarDansElement("entreprise-admin-avatar-img", "entreprise-admin-avatar-svg", photoUtilisateur);
}

function afficherMessageErreur(message) {
    alert(message);
}

function afficherMessageSucces(message) {
    alert(message);
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

    return data;
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
        const extension = logoEntrepriseFichier.name.split(".").pop();
        const cheminFichier = `${utilisateurActuel.id}/${Date.now()}.${extension}`;

        const { error: erreurUpload } = await clientSupabase
            .storage
            .from("logos-entreprises")
            .upload(cheminFichier, logoEntrepriseFichier, {
                cacheControl: "3600",
                upsert: false
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
remplirInterfaceUtilisateurEtEntreprise();

afficherMessageSucces("Entreprise créée avec succès.");

reinitialiserFormulaireEntreprise();

afficherEcran("ecran-accueil");
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
        const extension = logoEntrepriseFichier.name.split(".").pop();
        const cheminFichier = `${utilisateurActuel.id}/${Date.now()}.${extension}`;

        const { error: erreurUpload } = await clientSupabase
            .storage
            .from("logos-entreprises")
            .upload(cheminFichier, logoEntrepriseFichier, {
                cacheControl: "3600",
                upsert: false
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

    remplirInterfaceUtilisateurEtEntreprise();

    afficherMessageSucces("Entreprise modifiée avec succès.");

    modeEditionEntreprise = false;
    logoEntrepriseFichier = null;
    logoEntrepriseUrlExistante = null;

    afficherEcran("ecran-entreprise");

    return true;
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

    const descriptionEntrepriseEl = document.querySelector(".entreprise-description");
    const deviseEntrepriseEl = document.querySelector(".entreprise-devise");

    if (descriptionEntrepriseEl) {
        descriptionEntrepriseEl.textContent = descriptionEntreprise;
    }

    if (deviseEntrepriseEl) {
        deviseEntrepriseEl.textContent = `Devise: ${deviseEntreprise}`;
    }

  
  remplirAvatarsUtilisateur();
}

async function initialiserSessionUtilisateur(session) {
    sessionActuelle = session;
    utilisateurActuel = session?.user || null;

    console.log("Initialisation session :", sessionActuelle);
    console.log("Utilisateur actuel :", utilisateurActuel);

    if (!utilisateurActuel) {
        profilActuel = null;
        entrepriseActuelle = null;
        afficherEcran("ecran-auth");
        return;
    }

    await creerProfilSiInexistant(utilisateurActuel);
await chargerContexteUtilisateurComplet();

console.log("Profil actuel chargé :", profilActuel);
console.log("Entreprise actuelle chargée :", entrepriseActuelle);
console.log("Photo profil actuelle après contexte :", profilActuel?.photo_url);

remplirInterfaceUtilisateurEtEntreprise();

    if (!profilActuel?.entreprise_active_id) {
        afficherEcran("ecran-choix-entreprise");
    } else {
        afficherEcran("ecran-accueil");
    }
}

// ==================== ROUTAGE APRÈS CONNEXION ====================
async function verifierRedirectionUtilisateur() {
    const { data: donneesSession } = await clientSupabase.auth.getSession();
    await initialiserSessionUtilisateur(donneesSession.session);
}

        // ==================== ÉVÉNEMENTS ====================
        document.addEventListener("DOMContentLoaded", () => {
          verifierRedirectionUtilisateur();
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
        rendreProduits();
        rendreHistorique();
        rendreNotifications();
    });
}
            
            // Navigation principale
            document.querySelectorAll(".nav-item").forEach(item => {
                item.addEventListener("click", () => {
                    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("actif"));
                    item.classList.add("actif");
                    afficherEcran(item.dataset.ecran);
                });
            });
            
            // Notifications depuis accueil
            const btnNotifications = document.getElementById("btn-notifications");
            if (btnNotifications) {
                btnNotifications.addEventListener("click", () => {
                    afficherEcran("ecran-notifications");
                });
            }
            
            // Ajout produit
            const btnAjoutProduit = document.getElementById("btn-ajout-produit");
            if (btnAjoutProduit) {
                btnAjoutProduit.addEventListener("click", () => {
                    afficherEcran("ecran-ajout-produit");
                });
            }
            
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
        inputLogoEntreprise.click();
    });

    inputLogoEntreprise.addEventListener("change", (event) => {
        const fichier = event.target.files[0];
        if (!fichier) return;

        logoEntrepriseFichier = fichier;

        const texte = zoneLogoUpload.querySelector(".logo-upload-texte");
        if (texte) {
            texte.textContent = fichier.name;
        }
    });
}
            
            // Menu entreprise
            const menuEntreprise = document.getElementById("menu-entreprise");
            if (menuEntreprise) {
                menuEntreprise.addEventListener("click", () => {
                    afficherEcran("ecran-entreprise");
                });
            }
            
            const ouvrirEditionEntreprise = document.getElementById("ouvrir-edition-entreprise");
if (ouvrirEditionEntreprise) {
    ouvrirEditionEntreprise.addEventListener("click", () => {
        preRemplirFormulaireEntreprisePourEdition();
        afficherEcran("ecran-creer-entreprise");
    });
}
            
            // Ouvrir l'écran changer d'entreprise
            const ouvrirChangerEntreprise = document.getElementById("ouvrir-changer-entreprise");
            if (ouvrirChangerEntreprise) {
                ouvrirChangerEntreprise.addEventListener("click", () => {
                    afficherEcran("ecran-changer-entreprise");
                });
            }

            // Retour vers la fiche entreprise
            const retourEntrepriseVersFiche = document.getElementById("retour-entreprise-vers-fiche");
            if (retourEntrepriseVersFiche) {
                retourEntrepriseVersFiche.addEventListener("click", () => {
                    afficherEcran("ecran-entreprise");
                });
            }
            
            // Sélection d'entreprise
            const entreprisesSelection = document.querySelectorAll(".entreprise-selection-item");
            entreprisesSelection.forEach(item => {
                item.addEventListener("click", () => {
                    entreprisesSelection.forEach(el => el.classList.remove("actif"));
                    item.classList.add("actif");
                });
            });
            
            // Continuer avec l'entreprise sélectionnée
            const confirmerChangementBtn = document.querySelector(".confirmer-changement-btn");
            if (confirmerChangementBtn) {
                confirmerChangementBtn.addEventListener("click", () => {
                    afficherEcran("ecran-entreprise");
                });
            }
            
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
                    const type = carte.dataset.rapport;
                    const titre = carte.querySelector(".rapport-nom").textContent;
                    document.getElementById("rapport-titre").textContent = titre;
                    document.getElementById("rapport-soustitre").textContent = `Rapport concernant ${titre.toLowerCase()}`;
                    rendreTableauRapport(type);
                    afficherEcran("ecran-apercu-rapport");
                });
            });
            
            // Modals
            const btnEntree = document.getElementById("btn-entree");
            const btnSortie = document.getElementById("btn-sortie");
            const btnInventaire = document.getElementById("btn-inventaire");
            const modalMouvement = document.getElementById("modal-mouvement");
            const fermerModal = document.getElementById("fermer-modal");
            const modalTitre = document.getElementById("modal-titre");
            
            if (btnEntree) {
                btnEntree.addEventListener("click", () => {
                    modalTitre.textContent = "Entrée de stock";
                    modalMouvement.classList.add("actif");
                });
            }
            
            if (btnSortie) {
                btnSortie.addEventListener("click", () => {
                    modalTitre.textContent = "Sortie de stock";
                    modalMouvement.classList.add("actif");
                });
            }
            
            if (btnInventaire) {
                btnInventaire.addEventListener("click", () => {
                    modalTitre.textContent = "Inventaire correctif";
                    modalMouvement.classList.add("actif");
                });
            }
            
            if (fermerModal) {
                fermerModal.addEventListener("click", () => {
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
            
            // Onglets produits
            document.querySelectorAll(".onglet-btn").forEach(onglet => {
                onglet.addEventListener("click", () => {
                    document.querySelectorAll(".onglet-btn").forEach(o => o.classList.remove("actif"));
                    onglet.classList.add("actif");
                });
            });
            
            // Filtres historique
            document.querySelectorAll(".filtre-btn").forEach(filtre => {
                filtre.addEventListener("click", () => {
                    document.querySelectorAll(".filtre-btn").forEach(f => f.classList.remove("actif"));
                    filtre.classList.add("actif");
                });
            });
            
            // Onglets notifications
            document.querySelectorAll(".notif-onglet").forEach(onglet => {
                onglet.addEventListener("click", () => {
                    document.querySelectorAll(".notif-onglet").forEach(o => o.classList.remove("actif"));
                    onglet.classList.add("actif");
                });
            });
        });
        
        clientSupabase.auth.onAuthStateChange((evenement, session) => {
    console.log("Changement auth :", evenement, session);

    setTimeout(async () => {
        await initialiserSessionUtilisateur(session);
    }, 0);
});
    