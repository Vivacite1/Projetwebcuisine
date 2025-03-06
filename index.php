<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Accueil - Gestion de Recettes</title>
    <!-- Lien vers le fichier CSS pour styliser la page -->
    <link rel="stylesheet" href="style.css">
    <!-- Intégration d'une police Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
      <div class="container">
        <h1>Gestion de Recettes</h1>
        <p>Découvrez et partagez vos recettes favorites</p>
      </div>
    </header>
    <main class="container">
        <section class="recipes-section">
            <h2>Liste des Recettes</h2>
            <!-- Zone d'affichage des recettes chargées en AJAX -->
            <div id="recipes"></div>
        </section>

        <section class="add-recipe-section">
            <h2>Ajouter une nouvelle recette</h2>
            <!-- Formulaire d'ajout de recette -->
            <form id="addRecipeForm">
                <div class="form-group">
                    <label for="title">Titre :</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="ingredients">Ingrédients (un par ligne) :</label>
                    <textarea id="ingredients" name="ingredients" required></textarea>
                </div>
                <div class="form-group">
                    <label for="steps">Étapes (un par ligne) :</label>
                    <textarea id="steps" name="steps" required></textarea>
                </div>
                <div class="form-group">
                    <label for="language">Langue (fr/en) :</label>
                    <input type="text" id="language" name="language" required>
                </div>
                <div class="form-group">
                    <label for="author">Auteur :</label>
                    <input type="text" id="author" name="author" required>
                </div>
                <button type="submit" class="btn">Ajouter</button>
            </form>
        </section>
    </main>

    <footer>
      <div class="container">
          <p>&copy; 2025 Gestion de Recettes. Tous droits réservés.</p>
      </div>
    </footer>

    <!-- Script JavaScript pour les appels AJAX et la gestion de la page -->
    <script>
        // Fonction pour charger les recettes via AJAX
        function loadRecipes() {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "api.php?action=get_recipes", true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if(response.status === "success") {
                        displayRecipes(response.recipes);
                    } else {
                        console.error("Erreur lors du chargement des recettes");
                    }
                }
            };
            xhr.send();
        }

        // Fonction pour afficher les recettes sur la page
        function displayRecipes(recipes) {
            var recipesDiv = document.getElementById("recipes");
            recipesDiv.innerHTML = "";
            recipes.forEach(function(recipe) {
                // Création d'une "carte" pour chaque recette
                var div = document.createElement("div");
                div.className = "recipe-card";
                div.innerHTML = "<h3>" + recipe.title + "</h3>" +
                                "<p class='author'>Par : " + recipe.author + "</p>" +
                                "<p><strong>Ingrédients :</strong><br>" + recipe.ingredients.join("<br>") + "</p>" +
                                "<p><strong>Étapes :</strong><br>" + recipe.steps.join("<br>") + "</p>" +
                                "<p><strong>Likes :</strong> " + recipe.likes + "</p>" +
                                "<button class='btn like-btn' onclick='likeRecipe(" + recipe.id + ")'>J'aime</button>" +
                                "<div class='comment-section'>" +
                                    "<textarea id='comment_" + recipe.id + "' placeholder='Ajouter un commentaire'></textarea>" +
                                    "<button class='btn comment-btn' onclick='addComment(" + recipe.id + ")'>Ajouter Commentaire</button>" +
                                "</div>";
                recipesDiv.appendChild(div);
            });
        }

        // Gestion de l'envoi du formulaire d'ajout de recette via AJAX
        document.getElementById("addRecipeForm").addEventListener("submit", function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            formData.append("action", "add_recipe");

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "api.php", true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if(response.status === "success") {
                        loadRecipes();
                        document.getElementById("addRecipeForm").reset();
                    } else {
                        console.error("Erreur lors de l'ajout de la recette");
                    }
                }
            };
            xhr.send(formData);
        });

        // Ajout d'un commentaire via AJAX
        function addComment(recipeId) {
            var commentText = document.getElementById("comment_" + recipeId).value;
            var formData = new FormData();
            formData.append("action", "add_comment");
            formData.append("id", recipeId);
            formData.append("comment", commentText);
            formData.append("username", "UtilisateurAnonyme");

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "api.php", true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    loadRecipes();
                }
            };
            xhr.send(formData);
        }

        // Fonction pour "liker" une recette via AJAX
        function likeRecipe(recipeId) {
            var formData = new FormData();
            formData.append("action", "like_recipe");
            formData.append("id", recipeId);

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "api.php", true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    loadRecipes();
                }
            };
            xhr.send(formData);
        }

        // Charger les recettes dès le chargement de la page
        window.onload = loadRecipes;
    </script>
</body>
</html>
