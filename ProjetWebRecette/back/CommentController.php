<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);


class CommentController
{
	private string $filePath;
	private AuthController $authController;

	public function __construct(string $filePath, AuthController $authController)
	{
		$this->filePath = $filePath;
		$this->authController = $authController;
	}

	// Handles the POST /comment route
	public function handlePostCommentRequest(): void
	{
		header('Content-Type: application/json; charset=utf-8');
		// Ensure the correct Content-Type header
		if ($_SERVER['CONTENT_TYPE'] !== 'application/x-www-form-urlencoded') {
			http_response_code(400);
			echo json_encode(['error' => 'Invalid Content-Type header']);
			return;
		}

		// Validate and sanitize form data
		$firstname = filter_input(INPUT_POST, 'firstname', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
		$lastname = filter_input(INPUT_POST, 'lastname', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
		$message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

		if (!$firstname || !$lastname || !$message) {
			http_response_code(400);
			echo json_encode(['error' => 'Missing required fields. Fields' . $firstname . $lastname . $message]);
			return;
		}

		// Create a new comment
		$newComment = [
			'firstname' => $firstname,
			'lastname' => $lastname,
			'message' => $message,
		];

		// Save the comment
		$allComments[$idRecipe] = ["likes" => [$idUser]];

		$this->saveComment($newComment);

		// Return the updated list of comments
		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->getAllComments(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
	}

	// Saves a new comment to the file
	private function saveComment(array $comment): void
	{
		$comments = $this->getAllComments();
		$idComment = uniqid();
		$comments[$idComment] = $comment;

		file_put_contents($this->filePath, json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
	}

	// Retrieves all comments from the file
	private function getAllComments(): array
	{
		if (!file_exists($this->filePath)) {
			return [];
		}

		$content = file_get_contents($this->filePath);
		return json_decode($content, true) ?? [];
	}

	public function handlePostRecipeCommentRequest(array $params)
	{
		header('Content-Type: application/json');

		if ($_SERVER['CONTENT_TYPE'] !== 'application/x-www-form-urlencoded') {
			http_response_code(400);
			echo json_encode(['error' => 'Invalid Content-Type header']);
			return;
		}

		$id_recipe 	= $params['id_recipe'];
		$id_user 	= "67d1db5418a12";
		$comment 	= $_POST['comment'];

		if (!$id_recipe || !$comment ) {
			http_response_code(400);
			echo json_encode(['error' => 'Missing required fields. Fields' . $id_recipe . $comment]);
			return;
		}

		$comments = $this->getAllComments();
		$idComment = uniqid();
		$comments[$idComment] = [
			"id_recipe" => $id_recipe,
			"id_user"   => $id_user,
			"comment"   => $comment
		];

		file_put_contents($this->filePath, json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->getAllComments(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
	}	

	public function handleGetCommentsRequest(): void
	{
		http_response_code(200);
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->getAllComments(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
	}

	public function handleDeleteCommentRequest(array $params): void
	{	
		$idUser = $params['id_user'];
		$idComment = $params['id_comment'];
		$user = $this->authController->getUserByID($idUser);

		if (!$user['role'] == 'administrateur') {
			http_response_code(401);
			echo json_encode(['error' => 'Unauthorized']);
			return;
		}

		if(!isset($comments[$id_comment]))
		{
			http_response_code(401);
			echo json_encode(['message' => 'Le commentaire n existe pas']);
		}
		
		$contenu = file_get_contents($this->filePath);
		$comments = json_decode($contenu,true);
		print_r($comments);
		unset($comments[$idComment]);
		$comments = array_values($comments);
		
		file_put_contents($this->filePath,json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

		http_response_code(200);
		echo json_encode(['message' => 'Le commentaire a été supprimé avec succés']);
	}

}
