<?php
// Encabezados CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

header('Content-Type: application/json');
session_start();
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
if (isset($data['score'], $data['elemento_id'])) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            "status" => "error",
            "message" => "No has iniciado sesión"
        ]);
        exit;
    }
    $usuario_id = $_SESSION['user_id'];
    $score = $data['score'];
    $elemento_id = $data['elemento_id'];

    try {
        $stmt = $pdo->prepare("INSERT INTO puntuaciones (usuario_id, elemento_id, score) VALUES (?, ?, ?)");
        $stmt->execute([$usuario_id, $elemento_id, $score]);
        echo json_encode([
            "status" => "success",
            "message" => "Puntuación guardada exitosamente"
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => "Error al guardar la puntuación: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Datos incompletos"
    ]);
}
?>
