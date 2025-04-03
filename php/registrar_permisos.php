<?php
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $empleado_id = $_POST['empleado_id'];
    $tipo_ausencia = $_POST['tipo_ausencia'];
    $fecha_inicio = $_POST['fecha_inicio'];
    $fecha_fin = $_POST['fecha_fin'];
    $descripcion = !empty($_POST['descripcion']) ? $_POST['descripcion'] : null;
    $accion = isset($_POST['accion']) ? $_POST['accion'] : '';

    // Validación: Verificar si el empleado existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM empleados WHERE id = ?");
    $stmt->execute([$empleado_id]);
    if ($stmt->fetchColumn() == 0) {
        echo "Error: El empleado no existe";
        exit;
    }

    // Validación: Fecha fin no puede ser anterior a fecha inicio
    if (strtotime($fecha_fin) < strtotime($fecha_inicio)) {
        echo "Error: La fecha de fin no puede ser anterior a la fecha de inicio";
        exit;
    }

    if ($accion === 'registrar') {
        $stmt = $pdo->prepare("INSERT INTO permisos (empleado_id, tipo_ausencia, fecha_inicio, fecha_fin, descripcion) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$empleado_id, $tipo_ausencia, $fecha_inicio, $fecha_fin, $descripcion]);
        echo "Permiso registrado exitosamente";
    } else {
        echo "Error: Acción no válida";
    }
}

// Historial de permisos
if (isset($_GET['historial']) && isset($_GET['empleado_id'])) {
    $empleado_id = $_GET['empleado_id'];
    $stmt = $pdo->prepare("SELECT tipo_ausencia, fecha_inicio, fecha_fin, descripcion, estado FROM permisos WHERE empleado_id = ? ORDER BY fecha_inicio DESC");
    $stmt->execute([$empleado_id]);
    $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode($historial);
}
?>