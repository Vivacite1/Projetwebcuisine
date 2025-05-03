<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

require_once 'Router.php';
require_once 'AuthController.php';
require_once 'CommentController.php';
require_once 'RecetteController.php';
require_once 'RoleController.php';


$router             = new Router();
$authController     = new AuthController(__DIR__ . '/data/users.json',__DIR__ . '/data/demande.json');
$commentController  = new CommentController(__DIR__ . '/data/comments.json', $authController);
$recetteController  = new RecetteController(__DIR__ . '/data/recettes.json', __DIR__ . '/data/likeRecipe.json', $authController);
$roleController     = new RoleController(__DIR__ . '/data/demande.json', $authController);

$router->register('POST', '/back/register', [$authController, 'handleRegister']); //fonctionne
$router->register('POST', '/back/login', [$authController, 'handleLogin']); //fonctionne
$router->register('POST', '/back/logout', [$authController, 'handleLogout']); 

$router->register('POST', '/back/role/ask', [$roleController, 'handlePostRole']);//fonctionne
$router->register('POST', '/back/role/accept/{id_user}', [$roleController, 'handlePostAcceptRole']);//fonctionne

$router->register('GET', '/back/recipe', [$recetteController, 'handleGetRecipesRequest']);//fonctionne
$router->register('POST', '/back/recipe/validate', [$recetteController, 'validateRecipe']);
$router->register('GET', '/back/recipe/search/{search_param}', [$recetteController, 'handleGetRecipesSearchNewRequest']);//fonctionne
$router->register('GET', '/back/recipe/detail/{id_recipe}', [$recetteController, 'handleGetRecipesCardDetail']);//fonctionne
$router->register('POST', '/back/recipe/add/{id_user}', [$recetteController, 'handlePostRecetteRequest']);//fonctionne
$router->register('POST', '/back/recipe/modify/{id_recipe}', [$recetteController, 'handlePostRecipeModifyRequest']);//fonctionne
$router->register('DELETE', '/back/recipe/delete/{id_recipe}', [$recetteController, 'handleDeleteRecipeRequest']);//fonctionne
$router->register('GET', '/back/translate/recipe/{id_recipe}', [$recetteController, 'handleGetTranslateRecipe']);

$router->register('POST', '/back/like/recipe/{id_recipe}/{id_user}', [$recetteController, 'handlePostLikeRecipe']);//fonctionne
$router->register('GET', '/back/like', [$recetteController, 'handleGetLike']);//fonctionne

$router->register('GET', '/back/user', [$authController, 'handleGetUser']);//fonctionne
$router->register('GET', '/back/demande', [$authController, 'handleGetDemande']);//fonctionne
$router->register('GET', '/back/user/{id_user}', [$authController, 'handleGetUserById']);//fonctionne

$router->register('POST', '/back/comment/recipe/{id_recipe}', [$commentController, 'handlePostRecipeCommentRequest']);//fonctionne
$router->register('DELETE', '/back/comment/delete/{id_comment}', [$commentController, 'handleDeleteCommentRequest']);//fonctionne
$router->register('GET', '/back/comment/{id_recipe}', [$commentController, 'handleGetCommentsById']);//fonctionne

$router->handleRequest();
