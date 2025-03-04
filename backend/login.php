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
if (isset($data['username'], $data['password'])) {
    $username = $data['username'];
    $password = $data['password'];

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        echo json_encode([
            "status" => "success",
            "message" => "Inicio de sesión exitoso"
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Credenciales incorrectas"
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Datos incompletos"
    ]);
}
?>

