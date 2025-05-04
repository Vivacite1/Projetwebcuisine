"use strict"

// Description: This file contains the JavaScript code for the front-end of the application.

const webServerAddress = "http://localhost:8080";

window.addEventListener("DOMContentLoaded", async () => {
	const idUser = localStorage.getItem("id_user");
	const role = localStorage.getItem("role");
	const pageActuelle = window.location.pathname.split("/").pop();
	// Si on est sur index.html et que l'utilisateur n'est pas connecté
	if (pageActuelle === "index.html" && (!idUser || !role)) {
		alert("⚠️ Vous devez être connecté pour accéder à cette page.");
		window.location.href = "connexion.html"; // ou autre page de ton choix
	}
	if (pageActuelle === "index.html") {
		const recettes = await getRecette();
		const likes 	= await getLike(); 
		const translate = document.getElementById("translateCheckbox").checked;
		await afficherRecette(recettes,likes,translate);
	}
});

window.addEventListener("beforeunload", async () => {
	const pageActuelle = window.location.pathname.split("/").pop();

	if (localStorage.getItem("id_user") && pageActuelle === "index.html") {
		await deconnexionUser();
	}
});

const role = localStorage.getItem("role");

const ajouterRecetteBtn = document.getElementById("ajouterRecette");

if (role !== "chef" && role !== "administrateur") 
{
	if (ajouterRecetteBtn) {
		ajouterRecetteBtn.style.display = "none";
	}
}

const listeUtilisateur = document.getElementById("listUtil")
if (role !== "administrateur")
{
	if (listeUtilisateur) {
		listeUtilisateur.style.display = "none";
	}
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
		await deconnexionUser();
	});
}

const checkbox = document.getElementById("translateCheckbox");
if (checkbox){
	checkbox.addEventListener("change", async function(){
		const searchTerm = document.getElementById("searchInput").value.trim();
		if(searchTerm.length !== 0){
			const recettes = await getRecettesByLettre(searchTerm);
			const likes 	= await getLike(); 
			const translate = document.getElementById("translateCheckbox").checked;
			await afficherRecette(recettes,likes,translate);
		}else{
			const recettes = await getRecette();
			const likes 	= await getLike(); 
			const translate = document.getElementById("translateCheckbox").checked;
			await afficherRecette(recettes,likes,translate);
		}
	})
}

const form1 = document.getElementById("register-form");

if (form1) {
	form1.addEventListener("submit", async (event) => {
		// Prevent the default form submission (page reload)
		console.log("bien rentré")
		event.preventDefault();
		const client = await inscription(event);
	});
}

const form2 = document.getElementById("login-form");

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
			const likes 	= await getLike(); 
			const translate = document.getElementById("translateCheckbox").checked;
			await afficherRecette(recettes,likes,translate);
		}else{ 
			const recetteListeDiv = document.getElementById("recette-list");
			recetteListeDiv.innerHTML = ""; 
			
		}
	});
}


const detailRecette = document.getElementById("recette-list");
if(detailRecette)
{
	detailRecette.classList.add("recette-list");
	detailRecette.addEventListener("click", async (event) => {
		let target = event.target;
		// Vérifie si on clique sur une image ou un titre
		if (target.tagName === "IMG" || target.tagName === "H2") {
			const idRecipe = target.closest(".recette-card").querySelector("#idRecipe").textContent.trim();        
			try {
				const recette = await getRecettesById(idRecipe); // Récupération des données
				console.log("test recette : ",recette);
				const likes = await getLike();
				const translate = document.getElementById("translateCheckbox").checked;
				await afficherDetailRecette(recette,likes, translate);
				await ouvrirModale();
			} catch (error) {
				console.error("Erreur lors de la récupération de la recette :", error);
			}
		}
	});
}

async function sendComment(idRecipe) 
{
	const comment = document.getElementById("comment").value.trim();
	const userID = localStorage.getItem("id_user");
	const recipeID = idRecipe;

	if (comment === "") {
		alert("Le commentaire ne peut pas être vide !");
		return;
	}

	const params = new URLSearchParams();
	params.append("message", comment);
	params.append("id_user", userID);

	try {
		const response = await fetch(`${webServerAddress}/back/comment/recipe/`+ recipeID, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});

		if (response.ok) {
			alert("Commentaire ajouté avec succès !");
		} else {
			alert("Erreur lors de l'ajout du commentaire.");
		}
	} catch (error) {
		console.error("Erreur lors de l'ajout du commentaire:", error);
	}
}

async function inscription(event) {
    const body = new URLSearchParams(new FormData(event.target));

    try {
        const response = await fetch(`${webServerAddress}/back/register`, {
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
			window.location.href = result.redirect;
        } else {
            console.error("Échec de l'inscription:", result);
            alert(result.message);
        }
        
        return result;
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
    }
}


async function connexion(event) {
	const body = new URLSearchParams(new FormData(event.target));

	try {
		const response = await fetch(`${webServerAddress}/back/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		const text = await response.text(); // Lire la réponse en texte brut

		if (response.ok) {
			const result = JSON.parse(text);
			localStorage.setItem("id_user", result.id_user);
			localStorage.setItem("role",result.role);
			alert(result.message)
			window.location.href = result.redirect;
			return result;
		} else {
			const result = JSON.parse(text);
			alert(result.message);
			console.error("Échec de la connexion:", response.status, response.statusText);
		}
	} catch (error) {
		console.error("Erreur lors de la connexion:", error);
	}
}

/**
 * This function sends a GET request to the server to retrieve all comments.
 */
async function getCommentsById(idRecipe) {
	try {
		// Send a GET request to the server to retrieve all comments
		const response = await fetch(`${webServerAddress}/back/comment/`+idRecipe, {
			method: "GET",
		});
		
		if (response.ok) {
			const result = await response.json();
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

async function getLike()
{
	try {
		// Send a GET request to the server to retrieve all comments
		const response = await fetch(`${webServerAddress}/back/like`, {
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

async function getRecette() {
	try {
		const response = await fetch(`${webServerAddress}/back/recipe`, {
			method: "GET",
		});

		if (!response.ok) {
			console.error(
				"Échec de la récupération des recettes:",
				response.status,
				response.statusText
			);
			return null;
		}

		const result = await response.json(); // Plus propre
		console.log("Recipes retrieved successfully:", result);
		return result;
	} catch (error) {
		console.error("Error occurred:", error);
		return null;
	}
}

/**
 * 
 * @param {*} allRecettes :
 * @param {*} likes 
 */
async function afficherRecette(allRecettes, likes, translate) {
    const recetteListeDiv = document.getElementById("recette-list");
    // On vide le contenu précédent
    recetteListeDiv.innerHTML = ""; 

	let tradButton;

	if (!allRecettes || allRecettes.length === 0) {
		recetteListeDiv.innerHTML = "<p>Aucune recette trouvée.</p>";
		return;
	}

    allRecettes.forEach(recette => {    
        // Création d'un conteneur pour chaque recette
        const recetteDiv = document.createElement("div");
        recetteDiv.classList.add("recette-card");

		const divHeader = document.createElement("div");
		divHeader.classList.add("recetteCard-header");

        const idRecipe = document.createElement("p");
        idRecipe.id = "idRecipe";
        idRecipe.textContent = recette.id_recette;

        // Création du titre
        const titre = document.createElement("h2");
        titre.id = "detail-image";
        // Définir d'abord le texte du titre selon la langue
        const titleText = translate ? recette.nameFR : recette.name;
        titre.textContent = titleText;
        // Puis, si la recette est validée, ajouter l'étoile
        if (recette.validated) {
            const star = document.createElement("span");
            star.textContent = " ★";
            star.classList.add("validated-star");
            titre.appendChild(star);
        }

		let auteurContent = recette.author;
		if (auteurContent === undefined && translate) {
			auteurContent = "Auteur inconnu";
		} else if (auteurContent === undefined && !translate) {
			auteurContent = "Unknown author";
		}

		let withoutContent = recette.without;
		if (withoutContent === undefined && translate) {
			withoutContent = "Aucune restriction";
		} else if (withoutContent === undefined && !translate) {
			withoutContent = "No restriction";
		}

        // Création des autres éléments
        const auteur = document.createElement("p");
        auteur.textContent = auteurContent;
        const description = document.createElement("p");
        description.textContent = translate ? `Sans: ${withoutContent}` : `Without: ${withoutContent}`;
        const image = document.createElement("img");
		console.log("Image URL:", recette.imageURL);
        image.src = recette.imageURL;
        image.classList.add("recette-image");
        image.id = "detail-image";
        image.alt = translate ? `Image de ${recette.name}` : `Image of ${recette.name}`;

		if (role === "traducteur" && !recette.validated) {
			tradButton = document.createElement("button");
			tradButton.classList.add("translateButton");
			tradButton.id = "tradButton";
			tradButton.textContent = translate ? "traduire" : "translate";
			tradButton.addEventListener("click", async () => {
				await traduireRecette(recette.id_recette);
			});
			recetteDiv.appendChild(tradButton);
		}


        // Gestion des likes
        let nombreLikes = 0;
        if (likes[recette.id_recette]) {
            nombreLikes = likes[recette.id_recette].likes.length;
        }
		const userID = localStorage.getItem("id_user");
        let userLiked = false;
        if (likes[recette.id_recette] && likes[recette.id_recette].likes.includes(userID)) {
            userLiked = true;
        }
        const likeButton = document.createElement("button");
        likeButton.textContent = `❤️ ${nombreLikes}`;
        likeButton.classList.add("like-button");
        if (userLiked) {
            likeButton.classList.add("liked");
        }
        likeButton.dataset.recipeId = recette.id_recette;
        likeButton.addEventListener("click", async () => {
			const userID = localStorage.getItem("id_user");
            await ajouteLike(recette.id_recette,userID);
            const searchInput = document.getElementById("searchInput").value;
			if (searchInput.length === 0) {
				const recipes = await getRecette();
				const likes = await getLike();
				const translate = document.getElementById("translateCheckbox").checked;
				await afficherRecette(recipes, likes, translate);
			} else {
				const recipes = await getRecettesByLettre(searchInput);
				const likes = await getLike();
				const translate = document.getElementById("translateCheckbox").checked;
				await afficherRecette(recipes, likes, translate);
			}
            
        });

        // Assemblage
		//création d'une poubelle pour supprimer les recettes
		if (role === "administrateur" || recette.id_user === localStorage.getItem("id_user")) {
			const deleteButton = document.createElement("button");
			deleteButton.classList.add("delete-button");
			deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
					<path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
					</svg>`;
					
			deleteButton.addEventListener("click", async () => {
				const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cette recette ?");
				if (confirmation) {
					await supprimerRecette(recette.id_recette);
					const searchInput = document.getElementById("searchInput").value;
					const recipes = await getRecette();
					const likes = await getLike();
					const translate = document.getElementById("translateCheckbox").checked;
					await afficherRecette(recipes, likes, translate);
				}
			});
		  recetteDiv.appendChild(deleteButton);

		}
		recetteDiv.appendChild(divHeader);
        divHeader.appendChild(idRecipe);
        divHeader.appendChild(titre);
        recetteDiv.appendChild(image);
        recetteDiv.appendChild(auteur);
        recetteDiv.appendChild(description);
        recetteDiv.appendChild(likeButton);
        recetteListeDiv.appendChild(recetteDiv);
    });
}

async function supprimerRecette(idRecipe) {
	const response = await fetch(`${webServerAddress}/back/recipe/delete/` + idRecipe, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (response.ok) {
		const result = await response.json();
		alert(result.message);
	} else {
		console.error("Erreur lors de la suppression de la recette:", response.status, response.statusText);
	}
	
}

async function ajouteLike(idRecipe,idUser)
{
	try {
        const response = await fetch(`${webServerAddress}/back/like/recipe/`+idRecipe+`/`+idUser, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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

async function getRecettesByLettre(searchTerm) {
    try {
        const response = await fetch(`${webServerAddress}/back/recipe/search/`+searchTerm, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
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

async function getRecettesById(idRecipe)
{
	try {
        const response = await fetch(`${webServerAddress}/back/recipe/detail/`+idRecipe, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
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

async function afficherDetailRecette(recette,likes,translate) {
	
	document.getElementById("modifierRecette").style.display = "block";
	document.getElementById("closeButton").style.display = "block";
	const role = localStorage.getItem("role");
	const idUser = localStorage.getItem("id_user");

	if ((role === "administrateur" || idUser === recette.id_user) && !recette.validated) {
		document.getElementById("modifierRecette").style.display = "block";
	} else {
		document.getElementById("modifierRecette").style.display = "none";
	}

	if (!recette) return;
	const listeLikes = likes;
	const recetteDetailDiv = document.getElementById("recetteDetail");
	const userID = localStorage.getItem("id_user");

	const recetteData = recette;

	// pour éviter les erreurs si la recette n'a pas de likes
	if (!listeLikes[recetteData.id_recette]) {
		listeLikes[recetteData.id_recette] = {
			likes: []
		};
	}
	const nombreLikes = listeLikes[recetteData.id_recette].likes.length;
	if (!nombreLikes) {
		listeLikes[recetteData.id_recette] = {
			likes: []
		};
	}

	let auteur = recetteData.author;
	if (auteur === undefined && translate) {
		auteur = "Auteur inconnu";
	} else if (auteur === undefined && !translate) {
		auteur = "Unknown author";
	}

	let without = recetteData.without;
	if (without === undefined && translate) {
		without = "Aucune restriction";
	}else if (without === undefined && !translate) {
		without = "No restriction";
	}

	if (translate)
	{
		// titreRecette.textContent = recetteData.nameFR;
		recetteDetailDiv.innerHTML = `
		<h2>${recetteData.nameFR}</h2>
		<img src="${recetteData.imageURL}" alt="Image de ${recetteData.nameFR}" class="recette-image">
		<p><strong>Auteur :</strong> ${auteur}</p>
		<p><strong>Sans :</strong> ${without}</p>

		<h3>Ingrédients :</h3>
		<ul>
			${recetteData.ingredientsFR?.map(ing => `<li>${ing.quantity} ${ing.name ?? "Ingrédient inconnu"} (${ing.type})</li>`).join("") || "<li>Aucun ingrédient</li>"}
		</ul>

		<h3>Étapes :</h3>
		<ol>
			${recetteData.stepsFR?.map(step => `<li>${step}</li>`).join("") || "<li>Aucune étape</li>"}
		</ol>
		<button id="detailBouton" class="like-button" > ❤️ ${listeLikes[recetteData.id_recette].likes.length} </button>
		<button id="listeCom" class="boutonModifier"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-square-dots-fill" viewBox="0 0 16 16">
  				<path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2zm5 4a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
		</svg> </button>
		<button id="commBouton" class="commentaire-button"> Ajouter Commentaire </button>
		
	`;
	}else
	{
		recetteDetailDiv.innerHTML = `
		<h2>${recetteData.name}</h2>
		<img src="${recetteData.imageURL}" alt="Image de ${recetteData.name}" class="recette-image">
		<p><strong>Author :</strong> ${auteur}</p>
		<p><strong>Without :</strong> ${without}</p>

		<h3>Ingredients :</h3>
		<ul>
			${recetteData.ingredients?.map(ing => `<li>${ing.quantity} ${ing.name ?? "Ingrédient inconnu"} (${ing.type})</li>`).join("") || "<li>Aucun ingrédient</li>"}
		</ul>

		<h3>Steps :</h3>
		<ol>
			${recetteData.steps?.map(step => `<li>${step}</li>`).join("") || "<li>No steps</li>"}
		</ol>
		<button id="detailBouton" class="like-button" > ❤️ ${listeLikes[recetteData.id_recette].likes.length} </button>
		<button id="listeCom" class="boutonModifier"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-square-dots-fill" viewBox="0 0 16 16">
  				<path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2zm5 4a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
		</svg> </button>
		<button id="commBouton" class="commentaire-button"> Add a comment </button>
	`;
	}

	let userLiked = false; 
	if (listeLikes[recetteData.id_recette])
	{
		userLiked = listeLikes[recetteData.id_recette]
		if (listeLikes[recetteData.id_recette].likes.includes(userID)) {
			userLiked = true;
		}
	}

	const likeButton = document.getElementById("detailBouton");
	// Ajoute la classe "liked" si l'utilisateur a déjà liké
	if (userLiked) {
		likeButton.classList.add("liked");
	} else {
		likeButton.classList.remove("liked");
	}

	likeButton.dataset.recipeId = recette.id_recette;
	//Obliger d'ajouter l'événement dans la fonction
	likeButton.addEventListener("click", async () => {
		await ajouteLike(recetteData.id_recette,userID); 
		const recipe = await getRecettesById(recetteData.id_recette);
		const likes = await getLike();
		const translate = document.getElementById("translateCheckbox").checked;
		await afficherDetailRecette(recipe, likes, translate);
	});
    // Ici, on suppose que l'objet recette contient un attribut "validated" (true/false)
    if (role === "administrateur" && !recette.validated) {
        const validateBtn = document.createElement("button");
        validateBtn.textContent = "Valider Recette";
        validateBtn.classList.add("validate-button");
        validateBtn.addEventListener("click", async () => {
            await validerRecette(recette.id_recette);
            // Optionnel : recharger la recette pour mettre à jour son état
            const updatedRecipe = await getRecettesById(recette.id_recette);
            await afficherDetailRecette(updatedRecipe, likes, translate);
        });
        recetteDetailDiv.appendChild(validateBtn);
    }

	//modifier la recette
	if (role === "administrateur" || idUser === recetteData.id_user) {
		const buttonModifier = document.getElementById("modifierRecette");

		if (buttonModifier) {
			buttonModifier.addEventListener("click", async (event) => {
				event.preventDefault();
				document.getElementById("modifierRecette").style.display = "none";
				document.getElementById("closeButton").style.display = "none";
				const detailDiv = document.getElementById("recetteDetail");

				let withoutHTML = "";
				for (let i = 0; i < recetteData.without.length; i++) {
					withoutHTML += `<label for="without${i}">Restriction ${i+1} :</label>
					<input type="text" id="without${i}" value="${recetteData.without[i]}">`;
				}

				let ingredientsHTML = "";
				for (let i = 0; i < recetteData.ingredients.length; i++) {
					ingredientsHTML += `<label for="ingredient${i}">Ingrédient ${i+1} :</label>
					<input type="text" id="ingredient${i}" value="${recetteData.ingredients[i].name}">
					<label for="quantity${i}">Quantité :</label>
					<input type="text" id="quantity${i}" value="${recetteData.ingredients[i].quantity}">
					<label for="type${i}">Type :</label>
					<input type="text" id="type${i}" value="${recetteData.ingredients[i].type}">`;
				}

				let stepsHTML = "";
				for (let i = 0; i < recetteData.steps.length; i++) {
					stepsHTML += `<label for="step${i}">Étape ${i+1} :</label>
					<textarea id="step${i}" rows="2">${recetteData.steps[i]}</textarea>`;
				}

				detailDiv.innerHTML = `
					<button id="annulerModif" class="annuler-button">Annuler</button>
					<div id="modifierRecetteForm">
						<label for="name">Nom de la recette :</label>
						<input type="text" id="nomInput" value="${recetteData.name}">
						<label for="author">Auteur : </label>
						<input type="text" id="authorInput" value="${recetteData.author}">
						${withoutHTML}
						${ingredientsHTML}
						${stepsHTML}
						<label for="imageUpload">Télécharger une nouvelle image :</label>
						<input type="file" id="imageUpload" name="imageUpload" accept="image/*" onchange="previewImage(event)" />
						<button id="modifRecette">Modifier Recette</button>
					</div>
				`;

				const annulerModif = document.getElementById("annulerModif");
				if (annulerModif) {
					annulerModif.addEventListener("click", async () => {
						// Recharger la recette pour annuler les modifications
						const updatedRecipe = await getRecettesById(recetteData.id_recette);
						const likes = await getLike();
						const translate = document.getElementById("translateCheckbox").checked;
						await afficherDetailRecette(updatedRecipe, likes, translate);
					});
				}

				const buttonModify = document.getElementById("modifRecette");
				if (buttonModify) {
					buttonModify.addEventListener("click", async () => {					
					
						const recetteJSON = {
							name: document.getElementById("nomInput").value,
							author: document.getElementById("authorInput").value,
							without: [],
							ingredients: [],
							steps: [],
							imageURL: recetteData.imageURL,
						};
						const withoutInputs = document.querySelectorAll("[id^='without']");
						for (let i = 0; i < withoutInputs.length; i++) {
							const withoutValue = document.getElementById(`without${i}`).value;
							if (withoutValue) {
								recetteJSON.without.push(withoutValue);
							}
						}
						const ingredientInputs = document.querySelectorAll("[id^='ingredient']");
						const quantityInputs = document.querySelectorAll("[id^='quantity']");
						const typeInputs = document.querySelectorAll("[id^='type']");
						for (let i = 0; i < ingredientInputs.length; i++) {

							recetteJSON.ingredients.push({
								name: ingredientInputs[i].value,
								quantity: quantityInputs[i].value,
								type: typeInputs[i].value,
							});
						}
						const stepInputs = document.querySelectorAll("[id^='step']");
						for (let i = 0; i < stepInputs.length; i++) {
							const stepValue = document.getElementById(`step${i}`).value;
							if (stepValue) {
								recetteJSON.steps.push(stepValue);
							}
						}
						const imageUpload = document.getElementById("imageUpload");
						if (imageUpload.files.length > 0) {
							recetteJSON.image = imageUpload.files[0];
						}

						await modifierRecette(recetteData.id_recette, recetteJSON);
						const likes = await getLike();
						const translate = document.getElementById("translateCheckbox").checked;
						await afficherDetailRecette(recetteData, likes, translate);
					});
				}
			});
		}
	}
		
	

	const buttonaddCom = document.getElementById("commBouton");
	if(buttonaddCom)
	{
		buttonaddCom.addEventListener("click", async () => {
			document.getElementById("modifierRecette").style.display = "none";
			const divFormulaire = document.getElementById("recetteDetail");
			divFormulaire.innerHTML = `
				<h2>Ajouter un Commentaire</h2>
				<label for="comment">Commentaire :</label>
				<textarea id="comment" name="comment" rows="4"></textarea>
				<button class="boutonRecette" id="envoyerCommentaire">Envoyer le commentaire</button>
			`;

			const boutonEnvoyer = document.getElementById("envoyerCommentaire");
			boutonEnvoyer.addEventListener("click", async function () {
				const idRecipe = recetteData.id_recette;
				await sendComment(idRecipe);
				fermerModale();
			});
		});
	}

	const buttonListeCom = document.getElementById("listeCom");
	if (buttonListeCom) {
		buttonListeCom.addEventListener("click", async () => {
			document.getElementById("modifierRecette").style.display = "none";
			const comments = await getCommentsById(recetteData.id_recette);
			const divFormulaire = document.getElementById("recetteDetail");
			divFormulaire.innerHTML = `
				<h2>Liste des Commentaires</h2>
				<div id="comment-list"></div>
			`;		


			const commentListeDiv = document.getElementById("comment-list");
			commentListeDiv.innerHTML = "";
			const ul = document.createElement("ul");
			for(let i = 0; i < comments.length; i++)
			{
				const li = document.createElement("li");
				// ajouter une poubelle
				li.textContent = `${comments[i].id_user} : ${comments[i].comment}`;
				if(role === "administrateur")
				{
					const deleteButton = document.createElement("button");
					deleteButton.classList.add("delete-buttonCom");
					deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
					<path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
					</svg>`;
					deleteButton.addEventListener("click", async () => {
						const confirmation = confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?");
						if (!confirmation) return;
						await deleteComment(comments[i].id_comment);
						li.remove();
					});

					li.appendChild(deleteButton);	
				}
				
				
				ul.appendChild(li);
			}
			commentListeDiv.appendChild(ul);
		});
	}

	//si l'utilisateur clique sur la croix
	const fermerModal = document.querySelector(".close");
	fermerModal.addEventListener("click", fermerModale);

	window.addEventListener("click", async (event) => {
		if (event.target === document.getElementById("recette-modal")) {
			fermerModale();
			const likes = await getLike();
			const searchTerm = document.getElementById("searchInput").value;
			if (searchTerm.length === 0) 
			{
				const recettes = await getRecette();
				const translate = document.getElementById("translateCheckbox").checked;
				await afficherRecette(recettes,likes,translate);
			}else
			{
				const recipes = await getRecettesByLettre(searchTerm);
				const translate = document.getElementById("translateCheckbox").checked;
				await afficherRecette(recipes,likes,translate);
			}
			
		}
	});
}

async function deleteComment(idComment)
{
	console.log(idComment);
	try {
		const response = await fetch(`${webServerAddress}/back/comment/delete/` + idComment, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (response.ok) {
			const result = await response.json();
			alert(result.message);
		} else {
			console.error("Erreur lors de la suppression du commentaire:", response.status, response.statusText);
		}
	} catch (error) {
		console.error("Erreur lors de la suppression du commentaire:", error);
	}
}

async function modifierRecette(idRecipe, recetteJSON) {

	try {
		const response = await fetch(`${webServerAddress}/back/recipe/modify/` + idRecipe, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(recetteJSON),
		});
		if (response.ok) {
			const result = await response.json();
			alert("Recette modifiée avec succès !");
			// Fermer la modale après la modification
			fermerModale();
			// Recharger la liste des recettes
			const searchTerm = document.getElementById("searchInput").value;
			const recipes = await getRecettesByLettre(searchTerm);
			const likes = await getLike();
			const translate = document.getElementById("translateCheckbox").checked;
			await afficherRecette(recipes, likes, translate);

		} else {
			const result = await response.json();
			alert("Erreur lors de la modification de la recette : " + result.message);
		}
	} catch (error) {
		console.error("Erreur lors de la modification:", error);
		alert("Erreur lors de la modification de la recette.");
	}
}


async function validerRecette(idRecipe) {
    try {
        const params = new URLSearchParams();
		console.log(idRecipe);
        params.append("id_recipe", idRecipe);
        const response = await fetch(`${webServerAddress}/back/recipe/validate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });
        const result = await response.json();
        if (response.ok) {
            alert("Recette validée avec succès !");
        } else {
            alert("Erreur lors de la validation de la recette : " + result.message);
        }
        return result;
    } catch (error) {
        console.error("Erreur lors de la validation:", error);
    }
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
	const role = localStorage.getItem("role");
	if (role !== "chef" && role !== "administrateur")
	{
		alert("Vous n'avez pas les droits nécessaires pour ajouter une recette.");
		return;
	}
	const modal = document.getElementById("formulaireModal");
	modal.style.display = "flex";
	document.body.classList.add("modal-open");

	const divFormulaire = document.getElementById("formulaireRecette");
	divFormulaire.innerHTML = `
		<h2>Ajouter une Recette</h2>
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
			<input type="file" id="imageUpload" name="image" accept="image/*" onchange="previewImage(event)" />
			<img id="imagePreview" src="" alt="Image preview" style="display: none; max-width: 100px; margin-top: 10px;" />

			<button class="boutonRecette" id="envoyerRecette">Envoyer la recette</button>`;

	window.addEventListener("click", (event) => {
		if (event.target === document.getElementById("formulaireModal")) {
			const modal = document.getElementById("formulaireModal");
			modal.style.display = "none";
			document.body.classList.remove("modal-open");
		}
	});

	const boutonEnvoyer = document.getElementById("envoyerRecette");

	if (boutonEnvoyer) {
		console.log("envoyé");
		boutonEnvoyer.addEventListener("click", async function () {
			console.log("🟡 Clic détecté sur Envoyer !");
			await sendRecette();
		});
	} else {
		console.error("❌ Bouton d'envoi introuvable !");
	}
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

	li.setAttribute("data-quantity", quantite);
    li.setAttribute("data-name", ingredient);
    li.setAttribute("data-type", type);

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


async function sendRecette() {

	const nameRecipe  = document.getElementById("name").value.trim();
    const author      = document.getElementById("author").value.trim();
    const imageFile   = document.getElementById("imageUpload").files[0];

    const restrictions = Array.from(document.querySelectorAll("#listeRestriction li")).map(li => li.textContent);
    const ingredients = Array.from(document.querySelectorAll("#listIngredient li")).map(li => ({
        quantity: li.getAttribute("data-quantity"),
        name: li.getAttribute("data-name"),
        type: li.getAttribute("data-type")
    }));
    const steps = Array.from(document.querySelectorAll("#listEtape li")).map(li => li.textContent);

	// Créer un FormData pour multipart/form-data
    const formData = new FormData();
    formData.append("name", nameRecipe);
    formData.append("author", author);
    formData.append("restriction", JSON.stringify(restrictions));
    formData.append("ingredients", JSON.stringify(ingredients));
    formData.append("steps", JSON.stringify(steps));
    if (imageFile) {
		console.log("imageFile", imageFile);
        formData.append("image", imageFile);
    }

	const idUser = localStorage.getItem("id_user");
    try {
        const response = await fetch(`${webServerAddress}/back/recipe/add/${idUser}`, {
            method: "POST",
			body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            alert("Recette ajoutée avec succès !");
        } else {
			console.error("Erreur lors de l'ajout de la recette:", result.error);
            alert("Erreur lors de l'ajout de la recette !");
        }
    } catch (error) {
        console.error(" Erreur :", error);
    }
}

async function deconnexionUser() {
	try {
		const response = await fetch(`${webServerAddress}/back/logout`, {
			method: "POST",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("déconnexion réussie", result);
			window.location.href = result.redirect;
			localStorage.removeItem("id_user");
			localStorage.removeItem("role");
			sessionStorage.removeItem("recetteTrad");
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


async function traduireRecette(idRecipe)
{
	try {
		const response = await fetch(`${webServerAddress}/back/translate/recipe/`+idRecipe, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		
		if (response.ok) {
			const result = await response.json();
			sessionStorage.setItem("recetteTrad", JSON.stringify(result.recipe));
			window.location.href = result.redirect;
			return result;
		} else {
			console.error(
				"Echec du changement de page",
				response.status,
				response.statusText
			);
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

