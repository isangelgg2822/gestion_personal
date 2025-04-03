<?php
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $empleado_id = $_POST['empleado_id'];
    $fecha = $_POST['fecha'];
    $hora_entrada = !empty($_POST['hora_entrada']) ? $_POST['hora_entrada'] : null;
    $hora_salida = !empty($_POST['hora_salida']) ? $_POST['hora_salida'] : null;
    $accion = isset($_POST['accion']) ? $_POST['accion'] : '';

    echo "Debug: empleado_id = $empleado_id, fecha = $fecha, hora_entrada = $hora_entrada, hora_salida = $hora_salida, accion = $accion<br>";

    // Validación: Verificar si el empleado existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM empleados WHERE id = ?");
    $stmt->execute([$empleado_id]);
    if ($stmt->fetchColumn() == 0) {
        echo "Error: El empleado no existe";
        exit;
    }

    if ($accion === 'registrar') {
        // Verificar si ya existe un registro para ese empleado y fecha
        $stmt = $pdo->prepare("SELECT id, hora_salida FROM asistencia WHERE empleado_id = ? AND fecha = ?");
        $stmt->execute([$empleado_id, $fecha]);
        $registro = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($registro) {
            echo "Debug: Registro encontrado, ID = " . $registro['id'] . ", hora_salida actual = " . $registro['hora_salida'] . "<br>";
            // Si ya existe un registro, actualizar la hora de salida si se proporciona
            if ($hora_salida && !$registro['hora_salida']) {
                $stmt = $pdo->prepare("UPDATE asistencia SET hora_salida = ? WHERE id = ?");
                $stmt->execute([$hora_salida, $registro['id']]);
                echo "Salida registrada";
            } else {
                echo "Error: Ya existe un registro completo para esta fecha o no se proporcionó hora de salida";
            }
        } else {
            echo "Debug: No se encontró registro previo<br>";
            // Si no existe, crear un nuevo registro con hora de entrada
            if ($hora_entrada) {
                $stmt = $pdo->prepare("INSERT INTO asistencia (empleado_id, fecha, hora_entrada, hora_salida) VALUES (?, ?, ?, ?)");
                $stmt->execute([$empleado_id, $fecha, $hora_entrada, $hora_salida]);
                echo "Asistencia registrada";
            } else {
                echo "Error: Debe proporcionar al menos la hora de entrada";
            }
        }
    } else {
        echo "Error: Acción no válida";
    }
}

// Historial
if (isset($_GET['historial']) && isset($_GET['empleado_id'])) {
    $empleado_id = $_GET['empleado_id'];
    $stmt = $pdo->prepare("SELECT fecha, hora_entrada, hora_salida FROM asistencia WHERE empleado_id = ? ORDER BY fecha DESC");
    $stmt->execute([$empleado_id]);
    $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode($historial);
}
?>