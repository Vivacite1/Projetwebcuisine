<?php
// api.php
header("Content-Type: application/json");
$dataFile = 'data.json';

function readData($dataFile) {
    if (!file_exists($dataFile)) {
        $data = array("recipes" => array(), "users" => array());
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
        return $data;
    }
    $jsonData = file_get_contents($dataFile);
    return json_decode($jsonData, true);
}

function writeData($dataFile, $data) {
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');
$data = readData($dataFile);
$response = array("status" => "error", "message" => "Action non reconnue");

if ($action == "get_recipes") {
    $response = array("status" => "success", "recipes" => $data["recipes"]);
} elseif ($action == "add_recipe") {
    $title = isset($_POST['title']) ? $_POST['title'] : "";
    $ingredients = isset($_POST['ingredients']) ? explode("\n", trim($_POST['ingredients'])) : array();
    $steps = isset($_POST['steps']) ? explode("\n", trim($_POST['steps'])) : array();
    $language = isset($_POST['language']) ? $_POST['language'] : "fr";
    $author = isset($_POST['author']) ? $_POST['author'] : "anonymous";

    if ($title != "") {
        $newRecipe = array(
            "id" => count($data["recipes"]) + 1,
            "title" => $title,
            "ingredients" => $ingredients,
            "steps" => $steps,
            "language" => $language,
            "author" => $author,
            "status" => "incomplete",
            "comments" => array(),
            "likes" => 0,
            "translations" => new stdClass()
        );
        $data["recipes"][] = $newRecipe;
        writeData($dataFile, $data);
        $response = array("status" => "success", "message" => "Recette ajoutée", "recipe" => $newRecipe);
    } else {
        $response = array("status" => "error", "message" => "Le titre est requis");
    }
} elseif ($action == "add_comment") {
    $recipeId = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $commentText = isset($_POST['comment']) ? $_POST['comment'] : "";
    $username = isset($_POST['username']) ? $_POST['username'] : "anonymous";
    
    foreach ($data["recipes"] as &$recipe) {
        if ($recipe["id"] == $recipeId) {
            $recipe["comments"][] = array("user" => $username, "text" => $commentText);
            writeData($dataFile, $data);
            $response = array("status" => "success", "message" => "Commentaire ajouté", "recipe" => $recipe);
            break;
        }
    }
    if ($response["status"] != "success") {
        $response = array("status" => "error", "message" => "Recette non trouvée");
    }
} elseif ($action == "like_recipe") {
    $recipeId = isset($_POST['id']) ? intval($_POST['id']) : 0;
    foreach ($data["recipes"] as &$recipe) {
        if ($recipe["id"] == $recipeId) {
            $recipe["likes"] = isset($recipe["likes"]) ? $recipe["likes"] + 1 : 1;
            writeData($dataFile, $data);
            $response = array("status" => "success", "message" => "Recette likée", "likes" => $recipe["likes"]);
            break;
        }
    }
    if ($response["status"] != "success") {
        $response = array("status" => "error", "message" => "Recette non trouvée");
    }
}

echo json_encode($response);
?>
