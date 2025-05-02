<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);


class RecetteController
{
	private string $filePath;
    private string $filePathLike;
	private AuthController $authController;

	public function __construct(string $filePath, string $filePathLike, AuthController $authController)
	{
		$this->filePath         = $filePath;
        $this->filePathLike     = $filePathLike;
		$this->authController   = $authController;
	}

    public function handleGetRecipesRequest(): void
	{
		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
        $recettes = $this->getAllRecette();
		echo json_encode($recettes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
	}

    private function getAllRecette(): array
	{
		if (!file_exists($this->filePath)) {
			return [];
		}

		$content = file_get_contents($this->filePath);
		return json_decode($content, true) ?? [];
	}

    public function getRecetteByTitle($searchTerm): array
    {
        // Vérifie si le fichier existe
        if (!file_exists($this->filePath)) {
            return [];
        }
        // Charge le contenu du fichier
        $content = file_get_contents($this->filePath);

        // Décoder le JSON
        $recettes = json_decode($content, true); // assuming the file is in JSON format

        // Si aucune recette n'est trouvée
        if ($recettes === null) {
            return [];
        }

        // Filtre les recettes qui commencent par le terme de recherche
        $filteredRecettes = array_filter($recettes, function ($recette) use ($searchTerm) {
            if (stripos($recette['name'], $searchTerm) === 0)
            {
                return true;
            }
            if (isset($recette['nameFR']) && stripos($recette['name'], $searchTerm) === 0)
            {
                return true;
            }

            return stripos($recette['name'], $searchTerm) === 0; 
        });

        // Renvoie les recettes filtrées
        return array_values($filteredRecettes); // array_values pour réindexer les clés
    }

    public function handleGetRecipesCardDetail(array $params)
    {
        header('Content-Type: application/json; charset=utf-8');

        // Vérification du Content-Type
        if (!in_array($_SERVER['CONTENT_TYPE'], ['application/x-www-form-urlencoded', 'application/json'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid Content-Type header']);
            return;
        }

        $idRecipe = $params['id_recipe'];

        $recipeDetail = $this->getRecipeByID($idRecipe);
        
        if (!$recipeDetail) {
            http_response_code(404);
            echo json_encode([
                'message' => 'Aucune recette trouvée pour ce nom',
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode($recipeDetail, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function handleGetRecipesSearchNewRequest(array $params) :void 
    {
        header('Content-Type: application/json; charset=utf-8');

        $searchTerm = $params['search_param'];

        if (!$searchTerm) {
            http_response_code(400);
            echo json_encode(['error' => 'Aucun terme de recherche fourni']);
            return;
        }
        
        $recipes = $this->getRecipesBySearch($searchTerm);

        if (!$recipes) {
            http_response_code(404);
            echo json_encode([
                'message' => 'Aucune recette trouvée pour ce nom',
            ]);
            return;
        }

        http_response_code(200);
        echo json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function handlePostRecetteRequest(array $params): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // Récupération des données POST
        $nameRecipe = $_POST['name'] ?? '';
        $nameAuthor = $_POST['author'] ?? '';

        $without     = isset($_POST['restriction']) ? json_decode($_POST['restriction'], true) : [];
        $ingredients = isset($_POST['ingredients']) ? json_decode($_POST['ingredients'], true) : [];
        $steps       = isset($_POST['steps']) ? json_decode($_POST['steps'], true) : [];

        if (!$nameRecipe || !$nameAuthor || empty($without) || empty($ingredients) || empty($steps)) {
            http_response_code(400);
            echo json_encode(['error' => 'Champs requis manquants']);
            return;
        }

        // Traitement de l'image
        $imageURL = "";
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            $uniqueFileName = uniqid() . '_' . basename($_FILES['image']['name']);
            $targetFilePath = $uploadDir . $uniqueFileName;

            // Créer le dossier s’il n’existe pas
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Déplacement du fichier
            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)) {
                $imageURL = $targetFilePath;
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors du déplacement de l’image']);
                return;
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Aucune image reçue ou erreur lors du téléchargement']);
            return;
        }

        // Génération de l'ID unique
        $idRecipe = uniqid();

        // Création de la recette
        $newRecette = [
            'id_recette'    => $idRecipe,
            'name'          => $nameRecipe,
            'nameFR'        => '',
            'author'        => $nameAuthor,
            'without'       => $without,
            'ingredients'   => $ingredients,
            'ingredientsFR' => '',
            'steps'         => $steps,
            'stepsFR'       => '',
            'imageURL'      => "http://localhost:8080/back/$imageURL",
            'originalURL'   => '',
        ];

        // Sauvegarde de la recette
        $this->saveRecette($newRecette);

        // Réponse
        http_response_code(200);
        echo json_encode([
            'message' => 'Recette ajoutée avec succès !',
            'data' => $newRecette
        ]);
    }

    public function handlePostRecipeModifyRequest(array $params)
    {
        header('Content-Type: application/json; charset=utf-8');
        
        // Vérifier si le Content-Type est correct
        if ($_SERVER['CONTENT_TYPE'] !== 'application/json') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid Content-Type header', 'message' => 'erreur invalid']);
            return;
        }
        
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        $content = file_get_contents($this->filePath);
        $idRecipe = $params['id_recipe'];
        $recipe = $this->getRecipeByID($idRecipe);
        $recipes = json_decode($content, true);
        $recipeIndex = array_search($recipe['name'], array_column($recipes, 'name'));
        $recipes[$recipeIndex] = array_replace($recipes[$recipeIndex], $data);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Recette modifiée avec succès', 'name' => $data['name']]);
        
        file_put_contents($this->filePath, json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function handlePostLikeRecipe(array $params)
    {
       $idRecipe    = $params['id_recipe'];
       $idUser      = $params['id_user'];

       $content     = file_get_contents($this->filePathLike);
       $dejaLike    = false;
       $allLikes    = $this->getAllLike();

       if ($idRecipe == "" || $idUser == "") 
       {
           http_response_code(400);
           echo json_encode(["success" => false, "message" => "Erreur : id_recette ou id_user manquant"]);
           return;
       }

       if (isset($allLikes[$idRecipe])) 
       {
           if (in_array($idUser, $allLikes[$idRecipe]['likes'])) 
           {
               $allLikes[$idRecipe]["likes"] = array_values(array_diff($allLikes[$idRecipe]["likes"], [$idUser]));
               $message = "Unlike";
           }
           else
           {
               $allLikes[$idRecipe]['likes'][] = $idUser;
               $message = "Like ajouté";
           }
       }
       else 
       {
           // Ajouter une nouvelle recette avec le premier like
           $allLikes[$idRecipe] = ["likes" => [$idUser]];
           $message = "Nouvelle recette likée";
       }
       
       // Sauvegarde dans le fichier JSON
       file_put_contents($this->filePathLike, json_encode($allLikes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
       
       http_response_code(201);
       echo json_encode(["success" => true, "message" => $message]);       
    }

    public function handleGetLike()
    {
        http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
        $likes = $this->getAllLike();
		echo json_encode($likes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function getAllLike()
    {
        if (!file_exists($this->filePathLike)) {
			return [];
		}

		$content = file_get_contents($this->filePathLike);
		return json_decode($content, true) ?? [];
    }
    
    public function handleDeleteRecipeRequest(array $params)
    {
        header('Content-Type: application/json; charset=utf-8');
        
        $idRecipe = $params['id_recipe'];
        $recettes = $this->getAllRecette();
        $recetteIndex = array_search($idRecipe, array_column($recettes, 'id_recette'));

        if ($recetteIndex !== false) {
            unset($recettes[$recetteIndex]);
            file_put_contents($this->filePath, json_encode(array_values($recettes), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            http_response_code(200);
            echo json_encode(['message' => 'Recette supprimée avec succès']);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Recette non trouvée']);
        }
    }

    public function getRecipeByID($idRecipe)
    {
        $recettes = $this->getAllRecette();
        foreach($recettes as $recette)
        {
            if($recette['id_recette'] == $idRecipe)
            {
                $recetteDetail = $recette;
            }
        }

        return $recetteDetail;
    }

    public function getRecipesBySearch($searchTerm)
    {
        $recettes = $this->getAllRecette();
        $recipeResearch = [];
        foreach($recettes as $recette)
        {
            if(isset($recette['name']) && str_starts_with(strtolower($recette['name']),strtolower($searchTerm)))
            {
                $recipeResearch[] = $recette;
            }

            if(isset($recette['nameFR']) && str_starts_with(strtolower($recette['nameFR']),strtolower($searchTerm)))
            {
                $recipeResearch[] = $recette;
            }    

            foreach($recette['ingredients'] as $ingredient)
            {
                if(isset($ingredient['name']) && str_starts_with(strtolower($ingredient['name']),strtolower($searchTerm)))
                {
                    $recipeResearch[] = $recette;
                }
            }
        }

        return $recipeResearch;
    }

    public function saveRecette($recette)
    {
        $recettes = $this->getAllRecette();
		$recettes[] = $recette;

		file_put_contents($this->filePath, json_encode($recettes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function handleGetTranslateRecipe(array $params)
    {
            header('Content-Type: application/json; charset=utf-8');
            $idRecipe = $params['id_recipe'];
            $recipe = $this->getRecipeByID($idRecipe);

            echo json_encode(["message" => "changement de page réussi",
                            "recipe" => $recipe, 
                            "redirect" => "traductionRecette.html"]);
    }
    
    public function validateRecipe() {
        // Forcer l'envoi du Content-Type JSON dès le début
        header('Content-Type: application/json; charset=utf-8');
        
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            // Récupérer l'ID de la recette depuis le formulaire POST
            $recipeId = $_POST['id_recipe'] ?? null;
            if (!$recipeId) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Identifiant de recette manquant']);
                return;
            }
            // Lire toutes les recettes
            $recettes = $this->getAllRecette();
            $found = false;
            // Parcourir les recettes pour trouver celle qui correspond et la marquer comme validée
            foreach ($recettes as &$recette) {
                if ($recette['id_recette'] == $recipeId) {
                    $recette['validated'] = true;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Recette non trouvée']);
                return;
            }
            // Sauvegarder les recettes mises à jour dans le fichier JSON
            if (file_put_contents($this->filePath, json_encode($recettes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Erreur lors de la sauvegarde']);
                return;
            }
            echo json_encode(['status' => 'success', 'message' => 'Recette validée']);
        }
    }



}
