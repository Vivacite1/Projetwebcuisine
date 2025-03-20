// Description: This file contains the JavaScript code for the front-end of the application.

const webServerAddress = "http://localhost:8080";

// Trigger the getComments function when the form is submitted
const form = document.getElementById("post-comment");
if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const comments = await sendComment(event);
		event.target.reset();
		await displayComments(comments);
	});
}


const formRecette = document.getElementById("form-recette");
if(formRecette)
{
	console.log("requête envoyée");
	formRecette.addEventListener("submit", async (event) => {
		event.preventDefault();
		const recette = await sendRecette(event);
	});
}

const buttonSupprimer = document.getElementById("supprimerCommentaire");

if (buttonSupprimer) {
	buttonSupprimer.addEventListener("click", async () => {
		const success = await supprimerTousLesCommentaires();
		if (success) {
			// Mise à jour de l'affichage
			document.getElementById("comment-list").innerHTML = "";
		}
	});
}

const buttonDeconnexion = document.getElementById("deconnexion");

if (buttonDeconnexion) {
	buttonDeconnexion.addEventListener("click", async () => {
		const success = await deconnexionUser();
	});
}

const button = document.getElementById("get-comments");

if (button) {
	button.addEventListener("click", async () => {
		const comments = await getComments();
		await displayComments(comments);
	});
}

const button1 = document.getElementById("get-recipes");

if (button1) {
	button1.addEventListener("click", async () => {
		const recipes = await getRecette();
		console.log("recettes : ", recipes);
		await afficherRecette(recipes);
	});
}

const form1 = document.getElementById("register");

if (form1) {
	form1.addEventListener("submit", async (event) => {
		// Prevent the default form submission (page reload)
		event.preventDefault();
		const client = await inscription(event);
	});
}

const form2 = document.getElementById("connexion");

if(form2) {
	form2.addEventListener("submit", async (event) => {
		// Prevent the default form submission (page reload)
		event.preventDefault();
		const client = await connexion(event);
	});
}

const searchRecipe = document.querySelector(".search-input");
if (searchRecipe){
	searchRecipe.addEventListener("input", async function(event) {
		const searchTerm = event.target.value.trim(); // Récupère la valeur
		if (searchTerm.length > 0) {
			console.log("Texte recherché :", searchTerm);
			const recettes = await getRecettesByLettre(searchTerm);
			console.log("Recettes filtrées :", recettes);
			await afficherRecette(recettes);
		}else{
			const recipes = await getRecette();
			await afficherRecette(recipes);
		}
	});
}
const detailRecette = document.getElementById("recette-list")
detailRecette.addEventListener("click", async (event) => {
    let target = event.target;

    // Vérifie si on clique sur une image ou un titre
    if (target.tagName === "IMG" || target.tagName === "H2") {
        const nomRecette = target.closest(".recette-card").querySelector("h2").textContent.trim();
        
        try {
            const recette = await getRecettesByNom(nomRecette); // Récupération des données
			console.log("test recette : ",recette);
            await afficherDetailRecette(recette);
            await ouvrirModale();
        } catch (error) {
            console.error("Erreur lors de la récupération de la recette :", error);
        }
    }
});

const bouttonAjouterRecette = document.getElementById("ajouterRecette");
if(bouttonAjouterRecette)
{
	bouttonAjouterRecette.addEventListener("click", async (event) => {
		await afficherFormulaire();
	})
}



/**
 * This function sends a POST request to the server with the form data to add a new comment.
 * @param {SubmitEvent} event The event that triggered the function
 * @returns {Object} The result of the form submission
 */
async function sendComment(event) {
	const body = new URLSearchParams(new FormData(event.target));

	try {
		// Send a POST request to the server with the form data
		const response = await fetch(`${webServerAddress}/comment`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			// Serialize the form data to URL-encoded format
			body,
		});

		if (response.ok) {
			// If the request was successful, log the result
			const result = await response.json();
			console.log("Form submitted successfully:", result);
			return result;
		} else {
			console.error(
				"Form submission failed:",
				response.status,
				response.statusText
			);
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

async function inscription(event) {
    const body = new URLSearchParams(new FormData(event.target));

    try {
        const response = await fetch(`${webServerAddress}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Inscription réussie:", result);
            alert(result.message);
        } else {
            console.error("Échec de l'inscription:", result);
            alert(result.message);

            if (result.redirect) {
                window.location.href = result.redirect; // Redirection vers connexion.html
            }
        }
        
        return result;
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
    }
}


async function connexion(event) {
	const body = new URLSearchParams(new FormData(event.target));

	console.log("Données envoyées:", body.toString());

	try {
		console.log("Envoi de la requête à:", `${webServerAddress}/login`);
		const response = await fetch(`${webServerAddress}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		console.log("Statut de la réponse HTTP:", response.status);
		const text = await response.text(); // Lire la réponse en texte brut
		console.log("Réponse brute du serveur:", text); // Debug

		if (response.ok) {
			const result = JSON.parse(text);
			console.log("Connexion réussie:", result);
			window.location.href = result.redirect; // Redirection vers index.html

			return result;
		} else {
			console.error("Échec de la connexion:", response.status, response.statusText);
		}
	} catch (error) {
		console.error("Erreur lors de la connexion:", error);
	}
}

/**
 * This function sends a GET request to the server to retrieve all comments.
 */
async function getComments() {
	try {
		// Send a GET request to the server to retrieve all comments
		const response = await fetch(`${webServerAddress}/commentAffiche`, {
			method: "GET",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("Comments retrieved successfully:", result);
			return result;
		} else {
			console.error(
				"Échec de la récupération des commentaires:",
				response.status,
				response.statusText
			);
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

/**
 * This function takes the list of comments and displays them in the HTML list inside the div with id="comment-list".
 * @param {Array} comments List of comments to display
 */
async function displayComments(comments) {

	const listeCommentaires = comments;
	const commentListeDiv = document.getElementById("comment-list");

	commentListeDiv.innerHTML = ""; 

	const ul = document.createElement("ul");

	listeCommentaires.forEach(commentaire => {	
		const li = document.createElement("li");

		li.innerHTML = (`${commentaire.firstname} ${commentaire.lastname} : ${commentaire.message}`);
		ul.appendChild(li);
	});
	
	commentListeDiv.appendChild(ul)
}

async function supprimerTousLesCommentaires() {
	try {
		const response = await fetch(`${webServerAddress}/commentSupprimer`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		if (response.ok) {
			console.log("Tous les commentaires ont été supprimés avec succès.");
			alert("Tous les commentaires ont été supprimés !");
			// Rafraîchir la liste des commentaires après suppression
			return true;
		} else {
			console.error("Échec de la suppression des commentaires:", response.status, response.statusText);
			alert("Erreur lors de la suppression des commentaires.");
			return false;
		}
	} catch (error) {
		console.error("Erreur lors de la suppression:", error);
		alert("Erreur lors de la suppression des commentaires.");
		return false;
	}
}

async function getRecette()
{
	try {
		// Send a GET request to the server to retrieve all comments
		const response = await fetch(`${webServerAddress}/recipe`, {
			method: "GET",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("recipes retrieved successfully:", result);
			return result;
		} else {
			console.error(
				"Échec de la récupération des recettes:",
				response.status,
				response.statusText
			);
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

async function afficherRecette(allRecettes) {
    const listeRecette = allRecettes;
    const recetteListeDiv = document.getElementById("recette-list");

    // On vide le contenu précédent
    recetteListeDiv.innerHTML = ""; 

    listeRecette.forEach(recette => {    
        // Création d'un conteneur pour chaque recette
        const recetteDiv = document.createElement("div");
        recetteDiv.classList.add("recette-card"); // Ajoute une classe pour le CSS

        // Titre de la recette
        const titre = document.createElement("h2");
		titre.id = "detail-image";
        titre.textContent = recette.name;

        // Auteur
        const auteur = document.createElement("p");
        auteur.textContent = `Auteur: ${recette.Author}`;

        // Description (Sans quoi ?)
        const description = document.createElement("p");
        description.textContent = `Sans: ${recette.Without}`;

        // Image de la recette
        const image = document.createElement("img");
        image.src = recette.imageURL;
        image.alt = `Image de ${recette.name}`;
        image.classList.add("recette-image"); // Ajoute une classe pour le CSS
		image.id = "detail-image";

        // Ajout des éléments au conteneur de recette
        recetteDiv.appendChild(titre);
        recetteDiv.appendChild(image);
        recetteDiv.appendChild(auteur);
        recetteDiv.appendChild(description);

        // Ajout au conteneur principal
        recetteListeDiv.appendChild(recetteDiv);
    });
}

async function getRecettesByLettre(searchTerm) {
    try {
        const response = await fetch(`${webServerAddress}/recetteSearch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ search: searchTerm }), // Envoie la valeur de recherche
        });

        // Vérifie le type de contenu avant de parser
        const contentType = response.headers.get('Content-Type');

        if (response.ok) {
            const responseText = await response.text(); // Récupère la réponse en texte brut
			const result = JSON.parse(responseText); // Essaie explicitement de parser
			return result; // Renvoie les résultats

        } else {
            console.error(
                "Échec de la récupération des recettes:",
                response.status,
                response.statusText
            );
        }
    } catch (error) {
        console.error("Erreur survenue:", error);
    }
}

async function getRecettesByNom(nomRecette)
{
	try {
        const response = await fetch(`${webServerAddress}/recetteDetail`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nomRec: nomRecette }), // Envoie la valeur de recherche
        });

        // Vérifie le type de contenu avant de parser
        const contentType = response.headers.get('Content-Type');

        if (response.ok) {
            const responseText = await response.text(); // Récupère la réponse en texte brut
            // Essaie de convertir la réponse en JSON
			const result = JSON.parse(responseText); // Essaie explicitement de parser
			return result; // Renvoie les résultats

        } else {
            console.error(
                "Échec de la récupération des recettes:",
                response.status,
                response.statusText
            );
        }
    } catch (error) {
        console.error("Erreur survenue:", error);
    }
}

async function afficherDetailRecette(recette) {
	if (!recette) return;

	const recetteDetailDiv = document.getElementById("recetteDetail");

	recetteData = recette[0];
	const titreRecette = document.createElement("h2");
	console.log ("recette : ", recetteData);

	titreRecette.textContent = recetteData.name;
	console.log ("recette : ", recetteData.name);
	recetteDetailDiv.innerHTML = `
		<div class="recette-header" >
		    <span class="close" >×</span> 
        </div>
		<h2>${recetteData.name}</h2>
		<img src="${recetteData.imageURL}" alt="Image de ${recetteData.name}" class="recette-image">
		<p><strong>Auteur :</strong> ${recetteData.Author}</p>
		<p><strong>Sans :</strong> ${recetteData.Without ? recetteData.Without.join(", ") : "Aucune restriction"}</p>

		<h3>Ingrédients :</h3>
		<ul>
			${recetteData.ingredients?.map(ing => `<li>${ing.quantity} ${ing.name ?? "Ingrédient inconnu"} (${ing.type})</li>`).join("") || "<li>Aucun ingrédient</li>"}
		</ul>

		<h3>Étapes :</h3>
		<ol>
			${recetteData.steps?.map(step => `<li>${step}</li>`).join("") || "<li>Aucune étape</li>"}
		</ol>
	`;

	//si l'utilisateur clique sur la croix
	const fermerModal = document.querySelector(".close");
	fermerModal.addEventListener("click", fermerModale);

	//si l'utilisateur clique a coté de la fiche recette
	window.addEventListener("click", (event) => {
		if (event.target === document.getElementById("recette-modal")) {
			fermerModale();
		}
	});
}

async function ouvrirModale() {
    const modal = document.getElementById("recette-modal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
}

async function fermerModale() {
    const modal = document.getElementById("recette-modal");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
}

async function formAjouter()
{
	const modal = document.getElementById("formulaireModal");
	modal.style.display = "flex";
	document.body.classList.add("modal-open");

	const divFormulaire = document.getElementById("formulaireRecette");
	divFormulaire.innerHTML = `
		<h2>Ajouter une Recette</h2>
    	<form id="form-recette">
			<div class="enteteForm">
				<label for="name">Nom (FR) :</label>
				<input type="text" id="name" name="name">

				<label for="author">Auteur :</label>
				<input type="text" id="author" name="author">
			</div>

			<fieldset>
				<legend>Ajouter des restrictions :</legend>
				<div class="contenuRest">
					<label for="restriction">Restriction : </label>
					<input type="text" id="restriction" name="restriction">
					<button type="button" onClick="ajoutRestriction(event)" class="valider">Valider</button>
				</div>

				<ul id="listeRestriction" class="listRestriction">
				
				</ul>

			</fieldset>

			<fieldset>
				<legend>Ingrédients</legend>
				<div class="ingredientContenu">
					<label for="quantite">Quantité :</label>
					<input type="text" id="quantite" name="quantite">
					<label for="ingredient">Nom :</label>
					<input type="text" id="ingredient" name="ingredient">
					<label for="type">Type :</label>
					<input type="text" id="type" name="type">
				</div>

				<div class="boutonAjoutIngr">
					<button type="button" onClick="ajouterIngredient(event)" class="validerIngredient">Valider</button>
				</div>

				<ul id="listIngredient" class="listIngredient">

				</ul>
			</fieldset>

			<fieldset>
				<legend>Étapes</legend>
				<div class="etape">
					<label for="etape">Étape 1 :</label>
					<textarea id="etape" name="etape" rows="2"></textarea>
					<button type="button" onClick="ajouterEtape(event)" class="valider">Valider</button>
				</div>
				<ul>
					<div id="listEtape" class="listEtape">
					
					</div>
				</ul>
			</fieldset>

			<label for="imageUpload">Télécharger une image :</label>
			<input type="file" id="imageUpload" name="imageUpload" accept="image/*" onchange="previewImage(event)" />
			<img id="imagePreview" src="" alt="Image preview" style="display: none; max-width: 100px; margin-top: 10px;" />

			<input class="boutonRecette" type="submit" value="Envoyer"></button>
    	</form> `;

	window.addEventListener("click", (event) => {
		if (event.target === document.getElementById("formulaireModal")) {
			const modal = document.getElementById("formulaireModal");
			modal.style.display = "none";
			document.body.classList.remove("modal-open");
		}
	});
}

async function previewImage(event) {
    const file = event.target.files[0]; // Récupère le premier fichier sélectionné
    const reader = new FileReader(); // Crée un objet FileReader pour lire le fichier
    
    reader.onload = function() {
        const imagePreview = document.getElementById("imagePreview");
        imagePreview.src = reader.result; // Met le résultat du fichier en tant que source de l'image
        imagePreview.style.display = "block"; // Affiche l'image après l'avoir chargée
    };
    
    if (file) {
        reader.readAsDataURL(file); // Lit le fichier comme une URL
    }
}


async function ajoutRestriction(event) {
	event.preventDefault();

    const listeDivRestriction = document.getElementById("listeRestriction");
    const restriction = document.getElementById("restriction").value.trim();

    if (restriction === "") return; // Empêcher l'ajout d'éléments vides

    // Créer un nouvel élément <li>
    const li = document.createElement("li");
    li.textContent = restriction;

    // Créer un bouton de suppression
    const btnSupprimer = document.createElement("button");
    btnSupprimer.textContent = "✖";
    btnSupprimer.classList.add("supprimer");
    btnSupprimer.onclick = function () {
        listeDivRestriction.removeChild(li);
    };

    // Ajouter le bouton à l'élément <li>
    li.appendChild(btnSupprimer);

    // Ajouter <li> à la liste
    listeDivRestriction.appendChild(li);

    // Réinitialiser le champ
    document.getElementById("restriction").value = "";
}

async function ajouterEtape(event) {
	event.preventDefault();
    const listeDivEtape = document.getElementById("listEtape");
    const etape = document.getElementById("etape").value.trim();

    if (etape === "") return; // Empêcher l'ajout d'éléments vides

    // Créer un nouvel élément <li>
    const li = document.createElement("li");
    li.textContent = etape;

    // Créer un bouton de suppression
    const btnSupprimer = document.createElement("button");
    btnSupprimer.textContent = "✖";
    btnSupprimer.classList.add("supprimer");
    btnSupprimer.onclick = function () {
        listeDivEtape.removeChild(li);
    };

    // Ajouter le bouton à l'élément <li>
    li.appendChild(btnSupprimer);

    // Ajouter <li> à la liste
    listeDivEtape.appendChild(li);

    // Réinitialiser le champ
    document.getElementById("etape").value = "";
}

async function ajouterIngredient(event) {
	event.preventDefault();

    // Récupère les valeurs des champs
    const quantite = document.getElementById("quantite").value.trim();
    const ingredient = document.getElementById("ingredient").value.trim();
    const type = document.getElementById("type").value.trim();

    // Vérifier que tous les champs sont remplis
    if (quantite === "" || ingredient === "" || type === "") {
        alert("Tous les champs doivent être remplis !");
        return; // Empêche l'ajout d'un ingrédient si les champs sont vides
    }

    // Créer un nouvel élément <li> pour l'ingrédient
    const li = document.createElement("li");
    li.textContent = `${quantite} ${ingredient} (${type})`;

    // Créer un bouton de suppression
    const btnSupprimer = document.createElement("button");
    btnSupprimer.textContent = "✖";
    btnSupprimer.classList.add("supprimer");
    btnSupprimer.onclick = function () {
        li.remove(); // Supprime l'élément <li> de la liste
    };

    // Ajouter le bouton de suppression à l'élément <li>
    li.appendChild(btnSupprimer);

    // Ajouter l'élément <li> à la liste des ingrédients
    document.getElementById("listIngredient").appendChild(li);

    // Réinitialiser les champs après l'ajout
    document.getElementById("quantite").value = "";
    document.getElementById("ingredient").value = "";
    document.getElementById("type").value = "";
}

async function sendRecette(event) {
	const body = new URLSearchParams(new FormData(event.target));

	console.log("Données envoyées:", body.toString());
	

    try {
        const response = await fetch(`${webServerAddress}/recette`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Form submitted successfully:", result);
        } else {
            console.error("Form submission failed:", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Error occurred:", error);
    }
}




async function deconnexionUser() {
	try {
		// Send a GET request to the server to retrieve all comments
		const response = await fetch(`${webServerAddress}/logout`, {
			method: "POST",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("déconnexion réussie", result);
			window.location.href = result.redirect;
			return result;
		} else {
			console.error(
				"Echec de la déconnexion:",
				response.status,
				response.statusText
			);
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

