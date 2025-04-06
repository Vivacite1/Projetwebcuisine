

const webServerAddress = "http://localhost:8080";

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
      
      const response = await fetch(`${webServerAddress}/role/ask`, {
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
		const response = await fetch(`${webServerAddress}/logout`, {
			method: "POST",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("déconnexion réussie", result);
			window.location.href = result.redirect;
			localStorage.removeItem("id_user");
			localStorage.removeItem("role");
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