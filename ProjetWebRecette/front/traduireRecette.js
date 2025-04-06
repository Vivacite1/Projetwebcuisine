window.addEventListener("DOMContentLoaded", () => {
	const recetteJSON = sessionStorage.getItem("recetteTrad");
	if (recetteJSON) {
		const recette = JSON.parse(recetteJSON);
		afficherLesRecettes(recette);
	}
});

async function afficherLesRecettes(recette) {
	const divAnglais = document.querySelector(".recette-anglais");
	const divFr = document.querySelector(".recette-française");

	if (!divAnglais || !divFr) {
		console.error("Les conteneurs .recette-anglais ou .recette-française sont introuvables dans le DOM");
		return;
	}

	console.log("Recette reçue :", recette); // debug

	// --- Partie ANGLAISE ---
	const ingredientsEN = recette.ingredients?.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join("") || "";
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
	let titreFR = recette.nameFR && recette.nameFR.trim()
		? `<h2>${recette.nameFR}</h2>`
		: `<h2><input type="text" placeholder="Nom de la recette en français" id="input-nameFR" /></h2>`;

	// Ingrédients FR
	let ingredientsFR = "";
	recette.ingredientsFR?.forEach((ing, i) => {
		if (!ing.name || ing.name.trim() === "") {
			ingredientsFR += `<li>${ing.quantity} <input type="text" placeholder="Traduction de l'ingrédient" id="ingredient-${i}" /></li>`;
		} else {
			ingredientsFR += `<li>${ing.quantity} ${ing.name}</li>`;
		}
	});

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


