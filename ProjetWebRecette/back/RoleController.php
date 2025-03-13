<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);


class RoleController
{
	private string $filePath;
	private AuthController $authController;

	public function __construct(string $filePath, AuthController $authController)
	{
		$this->filePath = $filePath;
		$this->authController = $authController;
	}

   public function handlePostRole(array $params): void
    {
        // $params['id_user'] contient la valeur extraite de l'URL
        $userId = $params['id_user'];

        $users = $this->getAllUsers();
        foreach($users as $user)
        {
            if($user['role'] == "cuisinier")
            {
                askRoleFor($user);
            }
        }
        
        echo json_encode(['success' => true, 'userId' => $userId]);
    }

    private function askRoleFor(array $param)
    {
        $ask = [
            "id_user" => $param['id_user'],
            "role" => "traducteur",
        ];
    }

        
    private function getAllUsers(): array
	{
		return file_exists($this->filePath) ? json_decode(file_get_contents($this->filePath), true) ?? [] : [];
	}
}
