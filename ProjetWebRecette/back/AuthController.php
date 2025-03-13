<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

class AuthController
{
	private string $filePath;

	public function __construct(string $filePath)
	{
		$this->filePath = $filePath;
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
				if (!password_verify($password, $user['password'])) {
					http_response_code(400);
					echo json_encode(['message' => 'Mot de passe incorrect'.$user['password'].' : '.$password]);
					return;
				}
			}
		}
		if(!$trouve){
			http_response_code(400);
			echo json_encode(['message' => 'Utilisateur non trouvé']);
			return;
		}


		$_SESSION['user'] = "alban";
		http_response_code(200);
		echo json_encode(['message' => 'Connexion réussie',
						'redirect' => 'index.html']);
	}


	public function handleLogout(): void
	{
		session_destroy(); // Clear session
		http_response_code(200);
		echo json_encode(['message' => 'Logged out successfully',
							'redirect' => 'connexion.html']);
	}

	public function validateAuth(): ?string
	{
		return $_SESSION['user'] ?? null;
	}

	private function getAllUsers(): array
	{
		return file_exists($this->filePath) ? json_decode(file_get_contents($this->filePath), true) ?? [] : [];
	}
}
