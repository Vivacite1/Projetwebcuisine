window.addEventListener("DOMContentLoaded", () => {
	const recetteJSON = sessionStorage.getItem("recetteTrad");
	if (recetteJSON) {
		const recette = JSON.parse(recetteJSON);
		afficherLesRecettes(recette);
	}
});

const buttonSave = document.getElementById("buttonSave");
if(buttonSave)
{
	// await saveModif();
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
	// Ingrédients FR
	let ingredientsFR = "";
	for(let i = 0; i < recette.ingredients?.length; i++)
	{
		if(!recette.ingredientsFR)
		{
			ingredientsFR += `<li>${recette.ingredients[i].quantity} <input type="text" placeholder="Traduction de : ${recette.ingredients[i].name}" id="ingredient-${i}" />
			                                      <input type="text" placeholder="Traduction du ${recette.ingredients[i].type}" id="type-${i}" /></li>`;
		}else
		{
			if(recette.ingredientsFR[i].name == "")
			{
				ingredientsFR += `<li>${recette.ingredients[i].quantity} <input type="text" placeholder="Traduction de : ${recette.ingredients[i].name}" id="ingredient-${i}" />
			                                      <input type="text" placeholder="Traduction du ${recette.ingredients[i].type}" id="type-${i}" /></li>`;
			}else
			{
				ingredientsFR += `<li>${recette.ingredientsFR[i].quantity} ${recette.ingredientsFR[i].name} , ${recette.ingredientsFR[i].type}</li>`;
			}
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
	const recipeTraduit = sessionStorage.getItem(recetteTrad);

	
	try {
        const response = await fetch(`${webServerAddress}/recipe/modify/`+idRecipe, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recetteData)
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


