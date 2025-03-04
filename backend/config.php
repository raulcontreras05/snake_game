<?php
// config.php
$host = 'localhost';
$db   = 'snake_game_db';  // Nombre de la base de datos
$user = 'root';           // Usuario (por defecto en XAMPP es 'root')
$pass = '';               // Contraseña (por defecto, suele estar vacía)
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    die("Error al conectar: " . $e->getMessage());
}
?>
