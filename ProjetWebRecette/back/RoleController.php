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

    public function handlePostRole(array $params): void
    {
        // $params['id_user'] contient la valeur extraite de l'URL
        $userId = $params['id_user'];

        $userAsking = $this->authController->getUserById($userId);
        if($userAsking['role'] == "cuisinier")
        {
            $this->askRole($userAsking);
        }
        
        echo json_encode(['success' => true, 'userId' => $userId]);

    }
    public function handlePostAcceptRole(array $params): void 
    {
        if ($_SERVER["REQUEST_METHOD"] === "POST") {
            if (isset($_POST["role"])) {
                $role = $_POST["role"]; // Récupère le rôle envoyé par JavaScript
                echo json_encode(["message" => "Rôle reçu: $role"]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Aucun rôle reçu"]);
                return; // Stoppe l'exécution si le rôle est manquant
            }
        } else {
            http_response_code(405);
            echo json_encode(["error" => "Méthode non autorisée"]);
            return;
        }
    
        // Vérifie que les paramètres requis existent bien
        if (!isset($params['id_user']) || !isset($params['id_userAsking'])) {
            http_response_code(400);
            echo json_encode(["error" => "Paramètres manquants"]);
            return;
        }
    
        $userId         = $params['id_user'];
        $userIdAsking   = $params['id_userAsking'];
    
        // Vérification du rôle de l'utilisateur
        $user = $this->authController->getUserById($userId);
        if ($user && $user['role'] === "administrateur") {
            $demande = $this->getDemandeByIdUser($userIdAsking);
            if (!empty($demande)) {
                $this->acceptRole($demande, $userIdAsking, $role);
                echo json_encode(["message" => "Rôle accepté avec succès"]);
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
        foreach($demandes as $demande)
        {
            if($demande['id_user'] == $idUser)
            {
                $demandeResearch = $demande;
            }
        }

        return $demandeResearch;
    }

    private function askRole(array $user)
    {

        $ask = [
            "id_demande" => uniqid(),
            "id_user" => $user['id_user'],
            "role" => "traducteur",
        ];

        $demandes = $this->getAllDemande();
        $demandes[] = $ask;

        file_put_contents($this->filePathDemande, json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
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
        echo json_encode(["success" => true, "message" => "Rôle mis à jour"]);
        http_response_code(200);

    }
}
