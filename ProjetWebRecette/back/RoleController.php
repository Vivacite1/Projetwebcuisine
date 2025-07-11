<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);


class RoleController
{
    private string $filePathDemande;
	private AuthController $authController;

	public function __construct(string $filePathDemande, AuthController $authController)
	{
        $this->filePathDemande  = $filePathDemande;
		$this->authController   = $authController;
	}

    private function getAllDemande (): array
    {
        if (!file_exists($this->filePathDemande)) {
			return [];
		}

		$content = file_get_contents($this->filePathDemande);
		return json_decode($content, true) ?? [];
    }

    public function handlePostRole(): void 
    {
        header('Content-Type: application/json');
        
        // Récupérer les données POST, peu importe le Content-Type
        $input = file_get_contents('php://input');
        parse_str($input, $postData);
        
        // Vérifier que les données nécessaires sont présentes
        if (!isset($postData['id_user']) || !isset($postData['role'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        
        $userId = $postData['id_user'];
        $role = $postData['role'];
            
        $userAsking = $this->authController->getUserById($userId);
        if ($userAsking && $userAsking['role'] == "cuisinier") {
            $demandeEnvoyee = $this->askRole($userAsking, $role);
            if ($demandeEnvoyee) {
                echo json_encode(['message' => 'Demande envoyée avec succès', 'redirect' => 'index.html']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'une demande existe déjà']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Utilisateur non autorisé']);
        }
    }

    public function handlePostAcceptRole(array $params): void
{
    header('Content-Type: application/json');
    
    // Récupérer les données POST
    $input = file_get_contents('php://input');
    parse_str($input, $postData);
    
    
    // Vérifier que les données nécessaires sont présentes
    if (!isset($postData['role']) || !isset($postData['id_userAsking']) || !isset($postData['id_demande'])) {
        error_log("Paramètres manquants dans acceptRole: role=" . 
                  (isset($postData['role']) ? $postData['role'] : 'manquant') . 
                  ", id_userAsking=" . (isset($postData['id_userAsking']) ? $postData['id_userAsking'] : 'manquant') . 
                  ", id_demande=" . (isset($postData['id_demande']) ? $postData['id_demande'] : 'manquant'));
        
        http_response_code(400);
        echo json_encode(["error" => "Paramètres manquants"]);
        return;
    }
    
    // Vérifie que les paramètres requis existent bien
    if (!isset($params['id_user'])) {
        error_log("Paramètre id_user manquant dans l'URL");
        http_response_code(400);
        echo json_encode(["error" => "Paramètre id_user manquant"]);
        return;
    }
    
    $role = $postData['role'];
    $userId = $params['id_user'];
    $userIdAsking = $postData['id_userAsking'];
    $idDemande = $postData['id_demande'];
    
    error_log("Traitement acceptRole avec: role=$role, userId=$userId, userIdAsking=$userIdAsking, idDemande=$idDemande");
    
    // Vérification du rôle de l'utilisateur
    $user = $this->authController->getUserById($userId);
    if ($user['role'] === "administrateur") {
        $demande = $this->getDemandeByIdUser($userIdAsking);
        if (!empty($demande)) {
            $this->acceptRole($demande, $userIdAsking, $role, $idDemande);
            http_response_code(200);
            echo json_encode(["message" => "Rôle accepté avec succès", "redirect" => "index.html"]);
        } else {
            error_log("Aucune demande trouvée pour l'utilisateur $userIdAsking");
            http_response_code(404);
            echo json_encode(["error" => "Aucune demande trouvée"]);
        }
    } else {
        error_log("Accès refusé: l'utilisateur $userId n'est pas administrateur");
        http_response_code(403);
        echo json_encode(["error" => "Accès refusé"]);
    }
}
    

    private function getDemandeByIdUser(string $idUser) : array
    {
        $demandes = $this->getAllDemande();
        $demandeResearch = []; 
        
        foreach($demandes as $demande) {
            if($demande['id_user'] == $idUser) {
                $demandeResearch[] = $demande;
            }
        }
        
        return $demandeResearch;
    }

    private function askRole(array $user, string $role): bool
    {
        $demandes = $this->getAllDemande();
        $demande = $this->getDemandeByIdUser($user['id_user']);
        if(!empty($demande))
        {
            return false;
        }
        $ask = [
            "id_demande" => uniqid(),
            "id_user" => $user['id_user'],
            "role" => $role,
        ];
        $demandes[] = $ask;

        file_put_contents($this->filePathDemande, json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return true;
    }

    private function acceptRole(array $demande, string $userIdAsking, string $role, string $idDemande): void
    {
        
        $contenuDemande = file_get_contents($this->filePathDemande);
        $demandes       = json_decode($contenuDemande,true);
        $demandeIndex   = array_search($idDemande, array_column($demandes, 'id_demande'));
        unset($demandes[$demandeIndex]);
        $demandes = array_values($demandes);

        file_put_contents($this->filePathDemande, json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $user = $this->authController->getUserById($userIdAsking);
        $user['role'] = $role;
        $users = $this->authController->getAllUsers();
        foreach ($users as &$u) {
            if ($u['id_user'] == $userIdAsking) {
                $u = $user;
                break;
            }
        }
        file_put_contents($this->authController->getFilePath(), json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function handlePostRefuseRole(array $params): void 
    {
        header('Content-Type: application/json');
        
        // Récupérer les données POST, peu importe le Content-Type
        $input = file_get_contents('php://input');
        parse_str($input, $postData);
        
        // Vérifier que les données nécessaires sont présentes
        if (!isset($postData['id_userAsking']) || !isset($postData['id_demande'])) {
            http_response_code(400);
            echo json_encode(["error" => "Paramètres manquants"]);
            return;
        
        }
        // Vérifie que les paramètres requis existent bien
        if (!isset($params['id_user'])) {
            http_response_code(400);
            echo json_encode(["error" => "Paramètres manquants"]);
            return;
        }

        $userId         = $params['id_user'];
        $userIdAsking   = $postData['id_userAsking'];
        $idDemande      = $postData['id_demande'];

        // Vérification du rôle de l'utilisateur
        $user = $this->authController->getUserById($userId);
        if ($user['role'] === "administrateur") {
            $demande = $this->getDemandeByIdUser($userIdAsking);
            if (!empty($demande)) {
                $this->refuseRole($demande, $userIdAsking, $idDemande);
                http_response_code(200);
                echo json_encode(["message" => "Rôle refusé avec succès", "redirect" => "index.html"]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Aucune demande trouvée"]);
            }
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Accès refusé"]);
        }
    }

    private function refuseRole(array $demande, string $userIdAsking, string $idDemande)
    {
        $contenuDemande = file_get_contents($this->filePathDemande);
        $demandes       = json_decode($contenuDemande,true);
        $demandeIndex   = array_search($idDemande, array_column($demandes, 'id_demande'));
        unset($demandes[$demandeIndex]);
        $demandes = array_values($demandes);

        file_put_contents($this->filePathDemande, json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
