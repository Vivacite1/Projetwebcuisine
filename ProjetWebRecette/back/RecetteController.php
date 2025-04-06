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

    private function getAllRecette(): array
	{
		if (!file_exists($this->filePath)) {
			return [];
		}

		$content = file_get_contents($this->filePath);
		return json_decode($content, true) ?? [];
	}

    public function handleGetRecipesRequest(): void
	{
		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
        $recettes = $this->getAllRecette();
		echo json_encode($recettes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
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
            return stripos($recette['name'], $searchTerm) === 0; // Si le titre commence par $searchTerm (case-insensitive)
        });

        // Renvoie les recettes filtrées
        return array_values($filteredRecettes); // array_values pour réindexer les clés
    }

    public function handleGetRecipesSearchRequest(): void
    {
        // Récupère le contenu brut de la requête (le JSON)
        $data = json_decode(file_get_contents("php://input"), true);

        // Vérifie si 'search' existe et n'est pas vide
        $searchTerm = isset($data['search']) ? trim($data['search']) : '';

        // Vérifie si le terme de recherche est bien récupéré
        error_log("Terme recherché: " . $searchTerm); // Affiche dans le log PHP
        // Exécute la recherche
        $recettes = $this->getRecetteByTitle($searchTerm);

        // Retourne le résultat en JSON
        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($recettes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function handleGetRecipesCard(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // Vérification du Content-Type
        if (!in_array($_SERVER['CONTENT_TYPE'], ['application/x-www-form-urlencoded', 'application/json'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid Content-Type header']);
            return;
        }

        // Récupération des données
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);

        $nomRecette = $input['nomRec'] ?? '';

        if (empty($nomRecette)) {
            http_response_code(400);
            echo json_encode(['error' => 'Le nom de la recette est requis']);
            return;
        }

        // Récupération de la recette
        $recetteDetail = $this->getRecetteByTitle($nomRecette);

        // Vérification si la recette existe
        if (!$recetteDetail) {
            http_response_code(404);
            echo json_encode([
                'message' => 'Aucune recette trouvée pour ce nom',
            ]);
            return;
        }

        // Réponse OK avec la recette
        http_response_code(200);
        echo json_encode($recetteDetail, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
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
        
        // Vérifier si le Content-Type est correct
        if ($_SERVER['CONTENT_TYPE'] !== 'application/json') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid Content-Type header']);
            return;
        }
    
        // Lire le contenu JSON de la requête
        $jsonData = file_get_contents('php://input');
    
        // Décoder les données JSON en tableau PHP
        $data = json_decode($jsonData, true);
    
        // Vérifier si la décodification a réussi
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            return;
        }
    
        $idRecipe       = uniqid(); 
        $nameRecipe     = $data['name'] ?? '';
        $nameRecipeFR   = "";
        $nameAuthor     = $params['id_user'];
        $without        = $data['without'] ?? [];
        $ingredient     = $data['ingredients'] ?? [];
        $ingredientsFR  = "";
        $steps          = $data['steps'] ?? [];
        $stepsFR        = "";
        $imageURL       = $data['imageURL'] ?? '';
        $originalURL    = "";
    
        // Valider les champs principaux
        if (!$nameRecipe || !$nameAuthor || !$without || !$ingredient || !$steps) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
    
        // Créer un nouveau tableau de recette
        $newRecette = [
            'id_recette'   => $idRecipe,
            'name'         => $nameRecipe,
            'nameFR'       => $nameRecipeFR,
            'nameAuthor'   => $nameAuthor,
            'without'      => $without,
            'ingredients'  => $ingredient,
            'ingredientsFR'=> $ingredientsFR,
            'steps'        => $steps,
            'stepsFR'      => $stepsFR,
            'imageURL'     => $imageURL,
            'originalURL'  => $originalURL,
        ];
    
        // Sauvegarder la recette (fonction à adapter à votre logique de stockage)
        $this->saveRecette($newRecette);
    
        // Répondre avec les données de la recette
        http_response_code(200);
        echo json_encode(['message' => 'Recette added successfully!', 'data' => $newRecette]);
    }

    public function handlePostRecipeModifyRequest(array $params)
    {
        header('Content-Type: application/json; charset=utf-8');
        
        // Vérifier si le Content-Type est correct
        if ($_SERVER['CONTENT_TYPE'] !== 'application/json') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid Content-Type header']);
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

        echo $data['name'];
        http_response_code(200);
        file_put_contents($this->filePath, json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function handlePostLikeRecipe(array $params)
    {
       $idRecipe    = $params['id_recipe'];
       $idUser      = $params['id_user'];

       $content     = file_get_contents($this->filePathLike);
       $dejaLike    = false;
       $allLikes    = $this->getAllLike();

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
           // 🆕 Ajouter une nouvelle recette avec le premier like
           $allLikes[$idRecipe] = ["likes" => [$idUser]];
           $message = "Nouvelle recette likée";
       }
       
       // 💾 Sauvegarde dans le fichier JSON
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
            if(str_starts_with(strtolower($recette['name']),strtolower($searchTerm)))
            {
                $recipeResearch[] = $recette;
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

}
