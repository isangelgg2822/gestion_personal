<?php
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $accion = isset($_POST['accion']) ? $_POST['accion'] : '';

    if ($accion === 'crear') {
        $nombre = $_POST['nombre'];
        $tipo = $_POST['tipo'];
        $hora_inicio = !empty($_POST['hora_inicio']) ? $_POST['hora_inicio'] : null;
        $hora_fin = !empty($_POST['hora_fin']) ? $_POST['hora_fin'] : null;
        $dias = $_POST['dias'];

        $stmt = $pdo->prepare("INSERT INTO horarios (nombre, tipo, hora_inicio, hora_fin, dias) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $tipo, $hora_inicio, $hora_fin, $dias]);
        echo "Horario creado exitosamente";
    } elseif ($accion === 'asignar') {
        $empleado_id = !empty($_POST['empleado_id']) ? $_POST['empleado_id'] : null;
        $horario_id = $_POST['horario_id'];
        $fecha_inicio = $_POST['fecha_inicio'];
        $fecha_fin = !empty($_POST['fecha_fin']) ? $_POST['fecha_fin'] : null;

        $stmt = $pdo->prepare("INSERT INTO asignaciones_horarios (empleado_id, horario_id, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)");
        $stmt->execute([$empleado_id, $horario_id, $fecha_inicio, $fecha_fin]);
        echo "Horario asignado exitosamente";
    } elseif ($accion === 'excepcion') {
        $empleado_id = !empty($_POST['empleado_id']) ? $_POST['empleado_id'] : null;
        $fecha = $_POST['fecha'];
        $descripcion = $_POST['descripcion'];
        $tipo = $_POST['tipo'];

        $stmt = $pdo->prepare("INSERT INTO excepciones_horarios (empleado_id, fecha, descripcion, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([$empleado_id, $fecha, $descripcion, $tipo]);
        echo "Excepción registrada exitosamente";
    }
}

// Visualización de horarios
if (isset($_GET['buscar']) && isset($_GET['empleado_id'])) {
    try {
        $empleado_id = $_GET['empleado_id'] === '' ? null : $_GET['empleado_id'];
        if ($empleado_id) {
            // Verificar si el empleado existe
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM empleados WHERE id = ?");
            $stmt->execute([$empleado_id]);
            if ($stmt->fetchColumn() == 0) {
                header('Content-Type: application/json');
                echo json_encode(['error' => 'El empleado con ID ' . $empleado_id . ' no existe']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT a.id, e.nombre AS empleado, h.nombre AS horario, h.tipo, h.hora_inicio, h.hora_fin, h.dias, a.fecha_inicio, a.fecha_fin 
                                   FROM asignaciones_horarios a 
                                   JOIN empleados e ON a.empleado_id = e.id 
                                   JOIN horarios h ON a.horario_id = h.id 
                                   WHERE a.empleado_id = ?");
            $stmt->execute([$empleado_id]);
        } else {
            $stmt = $pdo->prepare("SELECT a.id, e.nombre AS empleado, h.nombre AS horario, h.tipo, h.hora_inicio, h.hora_fin, h.dias, a.fecha_inicio, a.fecha_fin 
                                   FROM asignaciones_horarios a 
                                   LEFT JOIN empleados e ON a.empleado_id = e.id 
                                   JOIN horarios h ON a.horario_id = h.id");
            $stmt->execute();
        }
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        header('Content-Type: application/json');
        echo json_encode($horarios);
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Error en la consulta: ' . $e->getMessage()]);
    }
    exit;
}
?>