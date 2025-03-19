<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);


class RoleController
{
	private string $filePathRole;
    private string $filePathDemande;
	private AuthController $authController;

	public function __construct(string $filePathRole, string $filePathDemande, AuthController $authController)
	{
        $this->filePathRole     = $filePathRole;
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
        $userId         = $params['id_user'];
        $userIdAsking   = $params['id_userAsking'];

        $user           = $this->authController->getUserById($userId);
        if($user['role'] == "administrateur")
        {
            $demande = $this->getDemandeByIdUser($userIdAsking);
            if (!empty($demande))
            {
                $this->acceptRole($demande, $userIdAsking);
            }
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
            "id_user" => $user['id_user'],
            "role" => "traducteur",
        ];

        $demandes = $this->getAllDemande();
        $demandes[] = $ask;

        file_put_contents($this->filePathDemande, json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    private function acceptRole(array $demande, string $userIdAsking)
    {
        $filePath = $this->authController->getFilePath();

        $contenu    = file_get_contents($filePath);
        $users      = json_decode($contenu, true);

        foreach ($users as $u) {
            if ($u['id_user'] == $userIdAsking) {
                $u['role'] = "traducteur";  // Modification du rôle
                break;
            }
        }

        file_put_contents($filePath, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["success" => true, "message" => "Rôle mis à jour"]);
        http_response_code(200);

    }
}
