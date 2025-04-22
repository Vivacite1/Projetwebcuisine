"use strict"

// Description: This file contains the JavaScript code for the front-end of the application.
const webServerAddress = "http://localhost:8080";

window.addEventListener("DOMContentLoaded", () => {
	const idUser = localStorage.getItem("id_user");
	const role = localStorage.getItem("role");
	const pageActuelle = window.location.pathname.split("/").pop();

	// Si on est sur index.html et que l'utilisateur n'est pas connecté
	if (pageActuelle === "traductionRecette.html" && (!idUser || !role)) {
		alert("⚠️ Vous devez être connecté pour accéder à cette page.");
		window.location.href = "connexion.html"; // ou autre page de ton choix
	}else{
		const recetteJSON = sessionStorage.getItem("recetteTrad");
		if (recetteJSON) {
			const recette = JSON.parse(recetteJSON);
			afficherLesRecettes(recette);
		}
	}
});

window.addEventListener("beforeunload", async () => {
	if (localStorage.getItem("id_user")) {
		await deconnexionUser();
	}
});

const buttonSave = document.getElementById("buttonSave");
if(buttonSave)
{
	buttonSave.addEventListener("click", async () => {
		const recetteJSON = sessionStorage.getItem("recetteTrad");
		const recette = JSON.parse(recetteJSON);
		const idRecipe = recette.id_recette;
		await saveModif(idRecipe);
	});

}

const buttonDeconnexion = document.getElementById("deconnexion");
if (buttonDeconnexion) {
	buttonDeconnexion.addEventListener("click", async () => {
		await deconnexionUser();
	});
}

async function afficherLesRecettes(recette) {
	const divAnglais = document.querySelector(".recette-anglais");
	const divFr = document.querySelector(".recette-française");

	if (!divAnglais || !divFr) {
		console.error("Les conteneurs .recette-anglais ou .recette-française sont introuvables dans le DOM");
		return;
	}

	console.log("Recette reçue :", recette); // debug

	// --- Partie ANGLAISE ---
	const ingredientsEN = recette.ingredients?.map(ing => `<li>${ing.quantity} ${ing.name} , ${ing.type} </li>`).join("") || "";
	const stepsEN = recette.steps?.map(step => `<li>${step}</li>`).join("") || "";

	divAnglais.innerHTML = `
		<h2>${recette.name || "No Title"}</h2>
		<img src="${recette.imageURL}" alt="Image of ${recette.name}" style="max-width: 100%; border-radius: 12px;" />
		<p><strong>Author:</strong> ${recette.author}</p>
		<h3>Ingredients</h3>
		<ul>${ingredientsEN}</ul>
		<h3>Steps</h3>
		<ol>${stepsEN}</ol>
	`;

	// --- Partie FRANÇAISE ---
	let titreFR;
	console.log(recette.nameFR)
	if(!recette.nameFR)
	{
		titreFR =  `<h2><input type="text" placeholder="Nom de la recette en français" id="input-nameFR" /></h2>`;
	}else {
		titreFR = `<h2>${recette.nameFR}</h2>`;
	}
	
	let ingredientsFR = "";

	for (let i = 0; i < recette.ingredients.length; i++) {
		const ing = recette.ingredients[i];

		// Si le tableau ingredientsFR n'existe pas ou que l'élément à i est manquant ou incomplet
		if (
			!recette.ingredientsFR || 
			!recette.ingredientsFR[i] || 
			!recette.ingredientsFR[i].name
		) {
			ingredientsFR += `
				<li>${ing.quantity} 
					<input type="text" placeholder="Traduction de : ${ing.name}" id="ingredient-${i}" />
					<input type="text" placeholder="Traduction du ${ing.type}" id="type-${i}" />
				</li>`;
		} else {
			const fr = recette.ingredientsFR[i];
			ingredientsFR += `<li>${fr.quantity} ${fr.name}, ${fr.type}</li>`;
		}
	}
	
	// Étapes FR
	let stepsFR = "";
	const totalStepsEN = recette.steps?.length || 0;
	const totalStepsFR = recette.stepsFR?.length || 0;

	for (let i = 0; i < totalStepsEN; i++) {
		if (i < totalStepsFR && recette.stepsFR[i]?.trim()) {
			stepsFR += `<li>${recette.stepsFR[i]}</li>`;
		} else {
			const originalStep = recette.steps?.[i] || "";
			stepsFR += `<li><textarea placeholder="Traduire cette étape : ${originalStep}" id="stepFR-${i}" rows="2" cols="40"></textarea></li>`;
		}
	}

	divFr.innerHTML = `
		${titreFR}
		<img src="${recette.imageURL}" alt="Image de ${recette.nameFR || 'recette'}" style="max-width: 100%; border-radius: 12px;" />
		<p><strong>Auteur :</strong> ${recette.author}</p>
		<h3>Ingrédients</h3>
		<ul>${ingredientsFR}</ul>
		<h3>Étapes</h3>
		<ol>${stepsFR}</ol>
	`;
}

async function saveModif(idRecipe)
{
	const recipeTraduit = sessionStorage.getItem("recetteTrad");
	if(!recipeTraduit)
	{
		alert("Aucune ne recette n'est stockée");
	}

	const recetteDataJson = JSON.parse(recipeTraduit);

	const nameFR = document.getElementById("input-nameFR");
	if (nameFR)
	{
		recetteDataJson.nameFR = nameFR;
	}

	if (!recetteDataJson.ingredientsFR) {
		recetteDataJson.ingredientsFR = [];
	}

	for (let i = 0; i<recetteDataJson.ingredients.length;i++)
	{
		const ingredient = document.getElementById('ingredient-'+i);
		const type = document.getElementById('type-'+i);
		if(ingredient && type)
		{
			if (ingredient && type) {
				// S'assurer que l'objet à l'indice i existe
				recetteDataJson.ingredientsFR[i] = {
					quantity: recetteDataJson.ingredients[i].quantity,
					name: ingredient.value,
					type: type.value // ⚠️ tu avais mis `ingredient.type` ce qui est incorrect
				};
			}
		}
	}

	if(!recetteDataJson.stepsFR)
	{
		recetteDataJson.stepsFR = [];
	}
	for (let i=0; i<recetteDataJson.steps.length;i++)
	{
		const steps = document.getElementById("stepFR-"+i);
		if(steps)
		{
			recetteDataJson.stepsFR[i] = steps.value;
		}
	}

	console.log(recetteDataJson);
	console.log("await fetch(${webServerAddress}/recipe/modify/"+idRecipe);
	try {
        const response = await fetch(`${webServerAddress}/recipe/modify/`+idRecipe, {
            method: "POST",
			headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recetteDataJson),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Recette modifiée avec succès !");
        } else {
            alert("Erreur lors de la modification de la recette !");
        }
    } catch (error) {
        console.error(" Erreur :", error);
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

