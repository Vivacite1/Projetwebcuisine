"use strict"

const webServerAddress = "http://localhost:8080";

const role = localStorage.getItem("role");

document.addEventListener("DOMContentLoaded", async () => {
	const idUser = localStorage.getItem("id_user");
	const role = localStorage.getItem("role");
	const pageActuelle = window.location.pathname.split("/").pop();

	// Si on est sur index.html et que l'utilisateur n'est pas connecté
	if (pageActuelle === "demanderRole.html" && (!idUser || !role)) {
		alert("⚠️ Vous devez être connecté pour accéder à cette page.");
		window.location.href = "connexion.html"; // ou autre page de ton choix
	}
});

window.addEventListener("beforeunload", async () => {
	if (localStorage.getItem("id_user")) {
		await deconnexionUser();
	}
});

const listeUtilisateur = document.getElementById("listUtil")
if (role !== "administrateur")
{
	if (listeUtilisateur) {
		listeUtilisateur.style.display = "none";
	}
}

const btnChef = document.getElementById("btn-chef");
if(btnChef)
{
    btnChef.addEventListener("click", async() => {
        await demandeRole("chef");
    });
}

const btnAdmin = document.getElementById("btn-admin");
if(btnAdmin)
{
    btnAdmin.addEventListener("click", async() => {
        await demandeRole("administrateur");
    });
}

const btnTraducteur = document.getElementById("btn-traducteur");
if(btnTraducteur)
{
    btnTraducteur.addEventListener("click", async() => {
        await demandeRole("traducteur");
    });
}

const buttonDeconnexion = document.getElementById("deconnexion");
if (buttonDeconnexion) {
	buttonDeconnexion.addEventListener("click", async () => {
		await deconnexionUser();
	});
}


async function demandeRole(role) {
    try {
      const idUser = localStorage.getItem("id_user");
      
      // Créer directement un URLSearchParams
      const params = new URLSearchParams();
      params.append("role", role);
      params.append("id_user", idUser);
      
      const response = await fetch(`${webServerAddress}/back/role/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      
      if (response.ok) {
        const result = await response.json();
        alert("Demande envoyée avec succés");
        window.location.href = result.redirect;
        return result;
      } else {
        const errorText = await response.text();
        console.error("Échec de la demande:", response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error("Erreur lors de la requête:", error);
    }
}

async function deconnexionUser() {
	try {
		// Send a GET request to the server to retrieve all comments
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