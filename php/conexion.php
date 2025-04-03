<?php
$host = 'localhost';
$db = 'gestion_empleados';
$user = 'root'; // Por defecto en XAMPP
$pass = '';    // Por defecto en XAMPP
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "Error de conexión: " . $e->getMessage();
}
?>