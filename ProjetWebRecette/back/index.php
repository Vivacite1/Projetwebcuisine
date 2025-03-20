<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);


require_once 'Router.php';
require_once 'AuthController.php';
require_once 'CommentController.php';
require_once 'RecetteController.php';
require_once 'RoleController.php';

session_start();

$router = new Router();
$authController = new AuthController(__DIR__ . '/data/users.json');
$commentController = new CommentController(__DIR__ . '/data/comments.json', $authController);
$recetteController = new RecetteController(__DIR__ . '/data/recettes.json', __DIR__ . '/data/likeRecipe.json', $authController);
$roleController = new RoleController(__DIR__ . '/data/demande.json', $authController);

$router->register('POST', '/register', [$authController, 'handleRegister']); //fonctionne
$router->register('POST', '/login', [$authController, 'handleLogin']); //fonctionne
$router->register('POST', '/logout', [$authController, 'handleLogout']); 

$router->register('GET', '/role/ask/{id_user}', [$roleController, 'handlePostRole']);//fonctionne
$router->register('POST', '/role/accept/{id_user}/{id_userAsking}', [$roleController, 'handlePostAcceptRole']);//fonctionne

$router->register('GET', '/recipe', [$recetteController, 'handleGetRecipesRequest']);//fonctionne
$router->register('GET', '/recipe/search/{search_param}', [$recetteController, 'handleGetRecipesSearchNewRequest']);//fonctionne
$router->register('POST', '/recipe/detail/{id_recipe}', [$recetteController, 'handleGetRecipesCardDetail']);//fonctionne
$router->register('POST', '/recipe/add/{id_user}', [$recetteController, 'handlePostRecetteRequest']);//fonctionne
$router->register('POST', '/recipe/modify/{id_recipe}', [$recetteController, 'handlePostRecipeModifyRequest']);//fonctionne

$router->register('POST', '/like/recipe/{id_recipe}/{id_user}', [$recetteController, 'handlePostLikeRecipe']);//fonctionne

$router->register('POST', '/comment/recipe/{id_recipe}', [$commentController, 'handlePostRecipeCommentRequest']);//fonctionne
$router->register('DELETE', '/comment/{id_comment}/user/{id_user}', [$commentController, 'handleDeleteCommentRequest']);//fonctionne

// $router->register('POST', '/comment/liste', [$recetteController, 'handlePostDisplayComment']);

// $router->register('POST', '/comment', [$commentController, 'handlePostCommentRequest']);
// $router->register('GET', '/commentAffiche', [$commentController, 'handleGetCommentsRequest']);
// $router->register('DELETE', '/commentSupprimer', [$commentController, 'handleDeleteCommentRequest']);

$router->handleRequest();
