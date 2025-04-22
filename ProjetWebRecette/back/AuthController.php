<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
class AuthController
{
	private string $filePath;
	private string $filePathDemande;

	public function __construct(string $filePath, string $filePathDemande)
	{
		$this->filePath = $filePath;
		$this->filePathDemande = $filePathDemande;
	}

	// TODO: Implement the handleRegister method
	public function handleRegister(): void
	{
		header('Content-Type: application/json');

		if ($_SERVER['CONTENT_TYPE'] !== 'application/x-www-form-urlencoded') {
			http_response_code(400);
			echo json_encode(['error' => 'Invalid Content-Type header']);
			return;
		}

		$idUtilisateur = uniqid();
		$email = $_POST['email'] ?? '';
		$password = $_POST['password'] ?? '';
		$role = "cuisinier";

		if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
			http_response_code(400);
			echo json_encode(['message' => 'Invalid email : ']);
			return;
		}

		if (strlen($password) < 8) {
			http_response_code(400);
			echo json_encode(['message' => 'Password must be at least 8 characters']);
			return;
		}

		$users = $this->getAllUsers();
		
		foreach ($users as $user) { 
			if ($user['mail'] === $email) {  
				http_response_code(400);
				echo json_encode([
					'message' => 'Email already registered',
					'redirect' => 'connexion.html'
				]);
				return;
			}
		}
		
		$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
		$user = [
			"id_user" => $idUtilisateur,
			"mail" => $email,
			"password" => $hashedPassword,
			"role" => $role,
		];

		$users[] = $user;

		file_put_contents($this->filePath, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

		http_response_code(201);
		echo json_encode(['message' => 'User registered successfully',
						'redirect' => 'connexion.html']);

	}

	// TODO: Implement the handleLogin method
	public function handleLogin(): void
	{   
		// Vérifier le type de contenu
		if ($_SERVER['CONTENT_TYPE'] !== 'application/x-www-form-urlencoded') {
			http_response_code(400);
			echo json_encode(['error' => 'Invalid Content-Type header']);
			return;
		}

		// Récupérer les données
		$email = $_POST['email'] ?? null;
		$password = $_POST['password'] ?? null;

		// Vérifier si les champs sont vides
		if (!$email || !$password) {
			http_response_code(400);
			echo json_encode(['message' => 'Email et mot de passe requis']);
			return;
		}

		// Vérifier si l'utilisateur existe
		$users = $this->getAllUsers();
		$trouve = false;
		foreach($users as $user)
		{
			if ($user['mail'] === $email) {
				$trouve = true;
				$userRole = $user['role'];
				$userId = $user['id_user'];
				if (!password_verify($password, $user['password'])) {
					http_response_code(400);
					echo json_encode(['message' => 'Mot de passe incorrect']);
					return;
				}
			}
		}

		if(!$trouve){
			http_response_code(400);
			echo json_encode(['message' => 'Utilisateur non trouvé']);
			return;
		}


		$_SESSION['id'] = $userId;
		$_SESSION['role'] = $userRole;

		// http_response_code(200);
		echo json_encode([
						'redirect' => 'index.html',
						'message' => 'Connexion réussie',
					     'id_user' => $userId,
						  'role' => $userRole]);

		// echo json_encode(['redirect' => 'index.html']);
		http_response_code(200);

	}


	public function handleLogout(): void
	{
		http_response_code(200);
		echo json_encode(['message' => 'Logged out successfully',
							'redirect' => 'connexion.html']);
	}

	public function getUserById($userId): array
    {
        $users = $this->getAllUsers();
        foreach($users as $user)
        {
            if($user['id_user'] == $userId)
            {
                $userResearch = $user;
            }
        }

        return $userResearch;
    }

	public function getFilePath(): string
	{
		return $this->filePath;
	}

	public function validateAuth(): ?string
	{
		return $_SESSION['user'] ?? null;
	}


	public function handleGetUser() : void
	{
		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
        $users = $this->getAllUsers();
		echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
	}

	public function handleGetDemande() : void
	{
		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
        $demandes = $this->getAllDemande();
		echo json_encode($demandes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
	}

	private function getAllUsers(): array
	{
		return file_exists($this->filePath) ? json_decode(file_get_contents($this->filePath), true) ?? [] : [];
	}
	private function getAllDemande(): array
	{
		return file_exists($this->filePathDemande) ? json_decode(file_get_contents($this->filePathDemande), true) ?? [] : [];
	}
}
