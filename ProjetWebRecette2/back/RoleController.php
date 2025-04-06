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
        
        // Récupérer les données POST, peu importe le Content-Type
        $input = file_get_contents('php://input');
        parse_str($input, $postData);
        
        // Vérifier que les données nécessaires sont présentes
        if (!isset($postData['role']) || !isset($postData['id_userAsking'])) {
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
    
        $role           = $postData['role'];
        $userId         = $params['id_user'];
        $userIdAsking   = $postData['id_userAsking'];
    
        // Vérification du rôle de l'utilisateur
        $user = $this->authController->getUserById($userId);
        if ($user['role'] === "administrateur") {
            $demande = $this->getDemandeByIdUser($userIdAsking);
            if (!empty($demande)) {
                $this->acceptRole($demande, $userIdAsking, $role);
                http_response_code(200);
                echo json_encode(["message" => "Rôle accepté avec succès", "redirect" => "index.html"]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Aucune demande trouvée"]);
            }
        } else {
            http_response_code(403);
            echo json_encode(["error" => "Accès refusé"]);
        }
    }
    

    private function getDemandeByIdUser(string $idUser)
    {
        $demandes = $this->getAllDemande();
        $demandeResearch = null; 
        
        foreach($demandes as $demande) {
            if($demande['id_user'] == $idUser) {
                $demandeResearch = $demande;
                break; 
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

    private function acceptRole(array $demande, string $userIdAsking, string $role)
    {
        $filePath = $this->authController->getFilePath();
        $contenu    = file_get_contents($filePath);
        $users      = json_decode($contenu, true);
        $user       = $this->authController->getUserById($userIdAsking);
        $userIndex = array_search($user['id_user'], array_column($users, 'id_user'));
        $users[$userIndex]['role'] = $role;

        $contenuDemande = file_get_contents($this->filePathDemande);
        $demandes       = json_decode($contenuDemande,true);
        $demande        = $this->getDemandeByIdUser($userIdAsking);
        $demandeIndex   = array_search($demande['id_user'], array_column($demandes, 'id_user'));
        unset($demandes[$demandeIndex]);
        $demandes = array_values($demandes);

        file_put_contents($this->filePathDemande, json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        file_put_contents($filePath, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
