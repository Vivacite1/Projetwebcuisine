"use strict"

const webServerAddress = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", async () => {
   const users      = await getUsers();
   const demandes   = await getDemandes();
   await afficherUser(users, demandes);
});

async function getUsers() {
    try {
		// Send a GET request to the server to retrieve all comments
		const response = await fetch(`${webServerAddress}/user`, {
			method: "GET",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("user retrieved successfully:", result);
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

async function getDemandes() {
    try {
		const response = await fetch(`${webServerAddress}/demande`, {
			method: "GET",
		});
		
		if (response.ok) {
			const result = await response.json();
			console.log("Demandes retrieved successfully:", result);
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

async function afficherUser(users, demandes) {
    const userListeDiv = document.getElementById("listeUtilisateur");

    // On vide le contenu précédent
    userListeDiv.innerHTML = ""; 

    // Création du tableau
    const table = document.createElement("table");
    table.classList.add("user-table");

    // Création de l'en-tête du tableau
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>ID Utilisateur</th>
            <th>Email</th>
            <th>Rôle Actuel</th>
            <th>Demande de Rôle</th>
            <th>Actions</th>
        </tr>
    `;

    const tbody = document.createElement("tbody");

    // Remplissage du tableau avec les utilisateurs
    users.forEach(user => {    
        const demande = demandes.find(d => d.id_user === user.id_user);
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${user.id_user}</td>
            <td>${user.mail}</td>
            <td>${user.role}</td>
            <td>${demande ? demande.role : "Aucune demande"}</td>
            <td>
                ${demande ? `
                    <button class="acceptButton" user="${user.id_user}"  role="${demande.role}">✔ Accepter</button>
                    <button class="rejectButton" user="${user.id_user}"  role="${demande.role}">✖ Rejeter</button>
                ` : "—"}
            </td>
        `;

        tbody.appendChild(row);
    });

    // Ajout des parties du tableau
    table.appendChild(thead);
    table.appendChild(tbody);
    userListeDiv.appendChild(table);

    document.querySelectorAll(".acceptButton").forEach(button => {
        button.addEventListener("click", async (event) => {
            const idUserAsking = event.target.getAttribute("user");
            const role = event.target.getAttribute("role");
            await accepterDemande(idUserAsking, role);
        });
    });

    document.querySelectorAll(".rejectButton").forEach(button => {
        button.addEventListener("click", async (event) => {
            const idUserAsking = event.target.getAttribute("user");
            const role = event.target.getAttribute("role");
            await rejeterDemande(idUserAsking, role);
        });
    });
}

async function accepterDemande(idUserAsking, role) {
    try {
<<<<<<< HEAD:ProjetWebRecette/ProjetWebRecette/front/ListeUtil.js
        if (!idUserAsking || !role) {
            console.error("Erreur : ID utilisateur ou rôle manquant !");
            return;
        }

        console.log("Envoi de la demande avec ID :", idUserAsking, "et rôle :", role);

        const formData = new FormData();
        formData.append("role", role);

        const url = `${webServerAddress}/role/accept/67dbf72c672b5/${encodeURIComponent(idUserAsking)}`;
        console.log("URL utilisée pour fetch:", url);

        const response = await fetch(url, {
            method: "POST",
            body: formData, // FormData au lieu de URLSearchParams
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Demande acceptée avec succès :", data);
            return data;
        } else {
            console.error("Erreur lors de la requête :", response.status, data.error);
=======
        const idUser = localStorage.getItem("id_user");

        const params = new URLSearchParams();
        params.append("role", role);
        params.append("id_userAsking", idUserAsking);

        const response = await fetch(`${webServerAddress}/role/accept/${idUser}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });
        console.log("Demande acceptée");

        if (response.ok) {
            const result = await response.json();
            console.log("Demande acceptée avec succès :", result);
            const users      = await getUsers();
            const demandes   = await getDemandes();
            await afficherUser(users, demandes);
            return result;
        } else {
            const errorText = await response.text();
            console.error("Échec de la demande:", response.status, response.statusText, errorText);
>>>>>>> alban:ProjetWebRecette/front/ListeUtil.js
        }
    } catch (error) {
        console.error("Une erreur est survenue :", error);
    }
}




<<<<<<< HEAD:ProjetWebRecette/ProjetWebRecette/front/ListeUtil.js
=======

>>>>>>> alban:ProjetWebRecette/front/ListeUtil.js
