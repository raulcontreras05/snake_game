<?php
// Encabezados CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

header('Content-Type: application/json');
require 'config.php';

try {
    $stmt = $pdo->query("SELECT u.username, p.score, p.fecha FROM puntuaciones p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.score DESC LIMIT 10");
    $rankings = $stmt->fetchAll();
    echo json_encode([
        "status" => "success",
        "data" => $rankings
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Error al obtener rankings: " . $e->getMessage()
    ]);
}
?>
