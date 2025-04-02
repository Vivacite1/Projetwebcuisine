<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

class Router
{
    private array $routes = [];

    /**
     * Register a new route
     */
    public function register(string $method, string $path, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'handler' => $handler,
        ];
    }

    /**
     * Check if a route pattern matches the given path and extract parameters
     * 
     * @param string $pattern Route pattern with {param} placeholders
     * @param string $path Actual request path
     * @return array|false Returns parameters array if matched, false otherwise
     */
    private function matchRoute(string $pattern, string $path): array|false
    {
        // Convertir le modèle de route en expression régulière
        $patternParts = explode('/', trim($pattern, '/'));
        $pathParts = explode('/', trim($path, '/'));
        
        // Vérifier si le nombre de segments correspond
        if (count($patternParts) !== count($pathParts)) {
            return false;
        }
        
        $params = [];
        
        // Comparer chaque segment
        foreach ($patternParts as $index => $part) {
            // Vérifier si c'est un paramètre dynamique
            if (preg_match('/^\{([a-zA-Z0-9_]+)\}$/', $part, $matches)) {
                // Extraire le nom du paramètre et sa valeur
                $params[$matches[1]] = $pathParts[$index];
            } elseif ($part !== $pathParts[$index]) {
                // Si ce n'est pas un paramètre et que les segments ne correspondent pas
                return false;
            }
        }
        
        return $params;
    }

    public function handleRequest(): void
    {
        header('Content-Type: application/json; charset=UTF-8');
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        
        // Get the HTTP method and path of the request
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Gérer la requête OPTIONS (préflight CORS)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204); // 204 = No Content
            exit;
        }
        
        foreach ($this->routes as $route) {
            // Vérifier si la méthode correspond
            if ($route['method'] === $method) {
                // Vérifier si le chemin correspond exactement ou s'il y a des paramètres
                if ($route['path'] === $path) {
                    // Route exacte
                    call_user_func($route['handler']);
                    return;
                } elseif ($params = $this->matchRoute($route['path'], $path)) {
                    // Route avec paramètres
                    call_user_func_array($route['handler'], [$params]);
                    return;
                }
            }
        }
        
        // If no route was found, return a 404
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }
}