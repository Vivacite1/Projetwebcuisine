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
			'timestamp' => date('c'),
		];

		// Save the comment
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
		$comments[] = $comment;

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
		$comment 	= $_POST['comment'] ?? null;

		if (!$id_recipe || !$comment ) {
			http_response_code(400);
			echo json_encode(['error' => 'Missing required fields. Fields' . $id_recipe . $comment]);
			return;
		}

		$newComment = [
			'id_recipe' => $id_recipe,
			'id_user' => $id_user,
			'comment' => $comment,
		];

		$this->saveComment($newComment);

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

	public function handleDeleteCommentRequest(): void
	{	
		$_SESSION['user'] = "alban";
		$email = $_SESSION['user'];
		if (!$email) {
			http_response_code(401);
			echo json_encode(['error' => 'Unauthorized']);
			return;
		}

		file_put_contents($this->filePath, json_encode([]));

		http_response_code(200);
		echo json_encode(['message' => 'All comments deleted']);
	}

}
