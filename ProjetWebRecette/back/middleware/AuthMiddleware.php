<?php

class AuthMiddleware{
    private AuthController $authController;

    public function __construct(AuthController $authController){
        $this->authControler = $authController;
    }

    public function verifyAuth(){
        if (!isset($SESSION['user'])){
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit();
        }
    }
}
?>