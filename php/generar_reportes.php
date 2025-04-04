<?php
// Desactivar la visualización de errores en la salida
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/sistema-aeropuerto/php_errors.log');

include 'conexion.php';

if (isset($_GET['tipo_reporte'])) {
    $tipo_reporte = $_GET['tipo_reporte'];
    $empleado_id = isset($_GET['empleado_id']) && $_GET['empleado_id'] !== '' ? $_GET['empleado_id'] : null;
    $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : null;
    $mes = isset($_GET['mes']) ? $_GET['mes'] : null;
    $fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : null;
    $fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : null;
    $cargo = isset($_GET['cargo']) && $_GET['cargo'] !== '' ? $_GET['cargo'] : null;
    $departamento = isset($_GET['departamento']) && $_GET['departamento'] !== '' ? $_GET['departamento'] : null;
    $incluir_asistencias = isset($_GET['incluir_asistencias']) ? filter_var($_GET['incluir_asistencias'], FILTER_VALIDATE_BOOLEAN) : false;
    $incluir_tardanzas = isset($_GET['incluir_tardanzas']) ? filter_var($_GET['incluir_tardanzas'], FILTER_VALIDATE_BOOLEAN) : false;
    $incluir_ausencias = isset($_GET['incluir_ausencias']) ? filter_var($_GET['incluir_ausencias'], FILTER_VALIDATE_BOOLEAN) : false;
    $incluir_horas = isset($_GET['incluir_horas']) ? filter_var($_GET['incluir_horas'], FILTER_VALIDATE_BOOLEAN) : false;

    $resultados = [];

    // Base de la consulta para empleados
    $sql_empleados = "SELECT id, nombre, apellido, cargo, departamento FROM empleados WHERE estado = 'Activo'";
    $params = [];
    if ($empleado_id) {
        $sql_empleados .= " AND id = ?";
        $params[] = $empleado_id;
    }
    if ($cargo) {
        $sql_empleados .= " AND cargo = ?";
        $params[] = $cargo;
    }
    if ($departamento) {
        $sql_empleados .= " AND departamento = ?";
        $params[] = $departamento;
    }
    try {
        $stmt_empleados = $pdo->prepare($sql_empleados);
        $stmt_empleados->execute($params);
        $empleados = $stmt_empleados->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $resultados[] = ['error' => 'Error al consultar empleados: ' . $e->getMessage()];
        header('Content-Type: application/json');
        echo json_encode($resultados);
        exit;
    }

    if ($tipo_reporte === 'diario') {
        foreach ($empleados as $empleado) {
            $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, a.hora_salida 
                                   FROM asistencia a 
                                   WHERE a.empleado_id = ? AND a.fecha = ?");
            $stmt->execute([$empleado['id'], $fecha]);
            $asistencia = $stmt->fetch(PDO::FETCH_ASSOC);
            $resultados[] = [
                'empleado_id' => $empleado['id'],
                'nombre' => $empleado['nombre'] . ' ' . $empleado['apellido'],
                'cargo' => $empleado['cargo'],
                'departamento' => $empleado['departamento'],
                'fecha' => $fecha,
                'hora_entrada' => $asistencia['hora_entrada'] ?? 'No registrada',
                'hora_salida' => $asistencia['hora_salida'] ?? 'No registrada'
            ];
        }
    } elseif ($tipo_reporte === 'mensual') {
        if (!$mes) {
            $resultados[] = ['error' => 'El parámetro "mes" es requerido'];
        } else {
            $mes_inicio = "$mes-01";
            $mes_fin = date('Y-m-t', strtotime($mes_inicio));
            foreach ($empleados as $empleado) {
                try {
                    $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, a.hora_salida 
                                           FROM asistencia a 
                                           WHERE a.empleado_id = ? AND a.fecha BETWEEN ? AND ?");
                    $stmt->execute([$empleado['id'], $mes_inicio, $mes_fin]);
                    $asistencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    $resultados[] = [
                        'empleado_id' => $empleado['id'],
                        'nombre' => $empleado['nombre'] . ' ' . $empleado['apellido'],
                        'cargo' => $empleado['cargo'],
                        'departamento' => $empleado['departamento'],
                        'asistencias' => $asistencias
                    ];
                } catch (PDOException $e) {
                    $resultados[] = ['error' => 'Error al consultar asistencias: ' . $e->getMessage()];
                    break;
                }
            }
        }
    } elseif ($tipo_reporte === 'tardanzas') {
        foreach ($empleados as $empleado) {
            $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, h.hora_inicio 
                                   FROM asistencia a 
                                   JOIN asignaciones_horarios ah ON a.empleado_id = ah.empleado_id 
                                   JOIN horarios h ON ah.horario_id = h.id 
                                   WHERE a.empleado_id = ? AND a.fecha BETWEEN ? AND ? 
                                   AND a.hora_entrada > h.hora_inicio");
            $stmt->execute([$empleado['id'], $fecha_inicio, $fecha_fin]);
            $tardanzas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($tardanzas) {
                $resultados[] = [
                    'empleado_id' => $empleado['id'],
                    'nombre' => $empleado['nombre'] . ' ' . $empleado['apellido'],
                    'cargo' => $empleado['cargo'],
                    'departamento' => $empleado['departamento'],
                    'tardanzas' => $tardanzas
                ];
            }
        }
    } elseif ($tipo_reporte === 'ausencias') {
        foreach ($empleados as $empleado) {
            $ausencias = [];
            $current_date = new DateTime($fecha_inicio);
            $end_date = new DateTime($fecha_fin);
            while ($current_date <= $end_date) {
                $fecha = $current_date->format('Y-m-d');
                $stmt = $pdo->prepare("SELECT 1 FROM asistencia WHERE empleado_id = ? AND fecha = ?");
                $stmt->execute([$empleado['id'], $fecha]);
                $asistencia = $stmt->fetch();
                $stmt_permiso = $pdo->prepare("SELECT 1 FROM permisos WHERE empleado_id = ? AND ? BETWEEN fecha_inicio AND fecha_fin AND estado = 'Aprobado'");
                $stmt_permiso->execute([$empleado['id'], $fecha]);
                $permiso = $stmt_permiso->fetch();
                if (!$asistencia && !$permiso) {
                    $ausencias[] = ['fecha' => $fecha];
                }
                $current_date->modify('+1 day');
            }
            if ($ausencias) {
                $resultados[] = [
                    'empleado_id' => $empleado['id'],
                    'nombre' => $empleado['nombre'] . ' ' . $empleado['apellido'],
                    'cargo' => $empleado['cargo'],
                    'departamento' => $empleado['departamento'],
                    'ausencias' => $ausencias
                ];
            }
        }
    } elseif ($tipo_reporte === 'horas') {
        foreach ($empleados as $empleado) {
            $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, a.hora_salida 
                                   FROM asistencia a 
                                   WHERE a.empleado_id = ? AND a.fecha BETWEEN ? AND ? 
                                   AND a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL");
            $stmt->execute([$empleado['id'], $fecha_inicio, $fecha_fin]);
            $asistencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $horas_totales = 0;
            foreach ($asistencias as &$asistencia) {
                $entrada = new DateTime($asistencia['hora_entrada']);
                $salida = new DateTime($asistencia['hora_salida']);
                $intervalo = $entrada->diff($salida);
                $horas = $intervalo->h + ($intervalo->i / 60);
                $asistencia['horas'] = round($horas, 2);
                $horas_totales += $horas;
            }
            $resultados[] = [
                'empleado_id' => $empleado['id'],
                'nombre' => $empleado['nombre'] . ' ' . $empleado['apellido'],
                'cargo' => $empleado['cargo'],
                'departamento' => $empleado['departamento'],
                'asistencias' => $asistencias,
                'horas_totales' => round($horas_totales, 2)
            ];
        }
    } elseif ($tipo_reporte === 'personalizado') {
        foreach ($empleados as $empleado) {
            $reporte = [
                'empleado_id' => $empleado['id'],
                'nombre' => $empleado['nombre'] . ' ' . $empleado['apellido'],
                'cargo' => $empleado['cargo'],
                'departamento' => $empleado['departamento']
            ];

            if ($incluir_asistencias) {
                $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, a.hora_salida 
                                       FROM asistencia a 
                                       WHERE a.empleado_id = ? AND a.fecha BETWEEN ? AND ?");
                $stmt->execute([$empleado['id'], $fecha_inicio, $fecha_fin]);
                $reporte['asistencias'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($incluir_tardanzas) {
                $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, h.hora_inicio 
                                       FROM asistencia a 
                                       JOIN asignaciones_horarios ah ON a.empleado_id = ah.empleado_id 
                                       JOIN horarios h ON ah.horario_id = h.id 
                                       WHERE a.empleado_id = ? AND a.fecha BETWEEN ? AND ? 
                                       AND a.hora_entrada > h.hora_inicio");
                $stmt->execute([$empleado['id'], $fecha_inicio, $fecha_fin]);
                $reporte['tardanzas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($incluir_ausencias) {
                $ausencias = [];
                $current_date = new DateTime($fecha_inicio);
                $end_date = new DateTime($fecha_fin);
                while ($current_date <= $end_date) {
                    $fecha = $current_date->format('Y-m-d');
                    $stmt = $pdo->prepare("SELECT 1 FROM asistencia WHERE empleado_id = ? AND fecha = ?");
                    $stmt->execute([$empleado['id'], $fecha]);
                    $asistencia = $stmt->fetch();
                    $stmt_permiso = $pdo->prepare("SELECT 1 FROM permisos WHERE empleado_id = ? AND ? BETWEEN fecha_inicio AND fecha_fin AND estado = 'Aprobado'");
                    $stmt_permiso->execute([$empleado['id'], $fecha]);
                    $permiso = $stmt_permiso->fetch();
                    if (!$asistencia && !$permiso) {
                        $ausencias[] = ['fecha' => $fecha];
                    }
                    $current_date->modify('+1 day');
                }
                $reporte['ausencias'] = $ausencias;
            }

            if ($incluir_horas) {
                $stmt = $pdo->prepare("SELECT a.fecha, a.hora_entrada, a.hora_salida 
                                       FROM asistencia a 
                                       WHERE a.empleado_id = ? AND a.fecha BETWEEN ? AND ? 
                                       AND a.hora_entrada IS NOT NULL AND a.hora_salida IS NOT NULL");
                $stmt->execute([$empleado['id'], $fecha_inicio, $fecha_fin]);
                $asistencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $horas_totales = 0;
                foreach ($asistencias as &$asistencia) {
                    $entrada = new DateTime($asistencia['hora_entrada']);
                    $salida = new DateTime($asistencia['hora_salida']);
                    $intervalo = $entrada->diff($salida);
                    $horas = $intervalo->h + ($intervalo->i / 60);
                    $asistencia['horas'] = round($horas, 2);
                    $horas_totales += $horas;
                }
                $reporte['horas'] = $asistencias;
                $reporte['horas_totales'] = round($horas_totales, 2);
            }

            if ($incluir_asistencias || $incluir_tardanzas || $incluir_ausencias || $incluir_horas) {
                $resultados[] = $reporte;
            }
        }
    }

    header('Content-Type: application/json');
    echo json_encode($resultados);
    exit;
}
?>