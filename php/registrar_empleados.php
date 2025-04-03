<?php
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nombre = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $cedula = $_POST['cedula'];
    $cargo = $_POST['cargo'];
    $departamento = $_POST['departamento'];
    $fecha_contratacion = !empty($_POST['fecha_contratacion']) ? $_POST['fecha_contratacion'] : null;
    $telefono = !empty($_POST['telefono']) ? $_POST['telefono'] : null;
    $email = !empty($_POST['email']) ? $_POST['email'] : null;
    $accion = isset($_POST['accion']) ? $_POST['accion'] : '';

    if ($accion === 'registrar') {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM empleados WHERE cedula = ?");
        $stmt->execute([$cedula]);
        if ($stmt->fetchColumn() > 0) {
            echo "Error: Ya existe un empleado con esta cédula";
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO empleados (nombre, apellido, cedula, cargo, departamento, fecha_contratacion, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $apellido, $cedula, $cargo, $departamento, $fecha_contratacion, $telefono, $email]);
        echo "Empleado registrado exitosamente";
    } elseif ($accion === 'editar') {
        $id = $_POST['empleado_id'];
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM empleados WHERE cedula = ? AND id != ?");
        $stmt->execute([$cedula, $id]);
        if ($stmt->fetchColumn() > 0) {
            echo "Error: Ya existe otro empleado con esta cédula";
            exit;
        }

        $stmt = $pdo->prepare("UPDATE empleados SET nombre = ?, apellido = ?, cedula = ?, cargo = ?, departamento = ?, fecha_contratacion = ?, telefono = ?, email = ? WHERE id = ?");
        $stmt->execute([$nombre, $apellido, $cedula, $cargo, $departamento, $fecha_contratacion, $telefono, $email, $id]);
        echo "Datos del empleado actualizados exitosamente";
    } elseif ($accion === 'inhabilitar') {
        $id = $_POST['empleado_id'];
        $stmt = $pdo->prepare("UPDATE empleados SET estado = 'Inactivo' WHERE id = ?");
        $stmt->execute([$id]);
        echo "Empleado inhabilitado exitosamente";
    } else {
        echo "Error: Acción no válida";
    }
}

// Cargar datos de un empleado
if (isset($_GET['cargar']) && isset($_GET['empleado_id'])) {
    $id = $_GET['empleado_id'];
    $stmt = $pdo->prepare("SELECT nombre, apellido, cedula, cargo, departamento, fecha_contratacion, telefono, email, estado FROM empleados WHERE id = ?");
    $stmt->execute([$id]);
    $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    if ($empleado) {
        echo json_encode($empleado);
    } else {
        echo json_encode(['error' => 'Empleado no encontrado']);
    }
    exit; // Aseguramos que no haya salida adicional
}

// Buscar empleados
if (isset($_GET['buscar']) && isset($_GET['termino'])) {
    $termino = "%" . $_GET['termino'] . "%";
    $stmt = $pdo->prepare("SELECT id, nombre, apellido, cedula, cargo, departamento, estado FROM empleados WHERE nombre LIKE ? OR apellido LIKE ? OR cedula LIKE ?");
    $stmt->execute([$termino, $termino, $termino]);
    $empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode($empleados);
    exit; // Aseguramos que no haya salida adicional
}
?>