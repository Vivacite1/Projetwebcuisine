<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

// error_log("index.php");
// error_log(json_encode($_SESSION));


require_once 'Router.php';
require_once 'AuthController.php';
require_once 'CommentController.php';
require_once 'RecetteController.php';
require_once 'RoleController.php';


$router = new Router();
$authController = new AuthController(__DIR__ . '/data/users.json',__DIR__ . '/data/demande.json');
$commentController = new CommentController(__DIR__ . '/data/comments.json', $authController);
$recetteController = new RecetteController(__DIR__ . '/data/recettes.json', __DIR__ . '/data/likeRecipe.json', $authController);
$roleController = new RoleController(__DIR__ . '/data/demande.json', $authController);

$router->register('POST', '/register', [$authController, 'handleRegister']); //fonctionne
$router->register('POST', '/login', [$authController, 'handleLogin']); //fonctionne
$router->register('POST', '/logout', [$authController, 'handleLogout']); 

$router->register('POST', '/role/ask', [$roleController, 'handlePostRole']);//fonctionne
$router->register('POST', '/role/accept/{id_user}', [$roleController, 'handlePostAcceptRole']);//fonctionne

$router->register('GET', '/recipe', [$recetteController, 'handleGetRecipesRequest']);//fonctionne
$router->register('POST', '/recipe/validate', [$recetteController, 'validateRecipe']);
$router->register('GET', '/recipe/search/{search_param}', [$recetteController, 'handleGetRecipesSearchNewRequest']);//fonctionne
$router->register('GET', '/recipe/detail/{id_recipe}', [$recetteController, 'handleGetRecipesCardDetail']);//fonctionne
$router->register('POST', '/recipe/add/{id_user}', [$recetteController, 'handlePostRecetteRequest']);//fonctionne
$router->register('POST', '/recipe/modify/{id_recipe}', [$recetteController, 'handlePostRecipeModifyRequest']);//fonctionne
$router->register('GET', '/translate/recipe/{id_recipe}', [$recetteController, 'handleGetTranslateRecipe']);

$router->register('POST', '/like/recipe/{id_recipe}/{id_user}', [$recetteController, 'handlePostLikeRecipe']);//fonctionne
$router->register('GET', '/like', [$recetteController, 'handleGetLike']);//fonctionne

$router->register('GET', '/user', [$authController, 'handleGetUser']);//fonctionne
$router->register('GET', '/demande', [$authController, 'handleGetDemande']);//fonctionne

$router->register('POST', '/comment/recipe/{id_recipe}', [$commentController, 'handlePostRecipeCommentRequest']);//fonctionne
$router->register('DELETE', '/comment/{id_comment}/user/{id_user}', [$commentController, 'handleDeleteCommentRequest']);//fonctionne

// $router->register('POST', '/comment/liste', [$recetteController, 'handlePostDisplayComment']);

// $router->register('POST', '/comment', [$commentController, 'handlePostCommentRequest']);
// $router->register('GET', '/commentAffiche', [$commentController, 'handleGetCommentsRequest']);
// $router->register('DELETE', '/commentSupprimer', [$commentController, 'handleDeleteCommentRequest']);

$router->handleRequest();
