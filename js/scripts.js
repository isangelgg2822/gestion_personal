document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    function addEventIfExists(elementId, event, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, callback);
        }
    }

    // Gestión de Empleados (registro, edición, inhabilitación)
    if (page === 'gestion-empleados') {
        addEventIfExists('form-empleados', 'submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const accion = e.submitter.name === 'accion' ? e.submitter.value : 'registrar';
            formData.append('accion', accion);
            if (accion === 'editar' || accion === 'inhabilitar') {
                const empleadoId = document.getElementById('empleado_id').value;
                formData.append('empleado_id', empleadoId);
                const hiddenId = document.getElementById('empleado_id_hidden');
                if (hiddenId) hiddenId.value = empleadoId;
            }
            const response = await fetch('php/registrar_empleados.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.text();
            document.getElementById('mensaje').innerText = result;
            if (result.includes('exitosamente')) {
                if (accion !== 'inhabilitar') {
                    document.getElementById('form-empleados').reset();
                }
                const btnEditar = document.getElementById('btn-editar');
                const btnInhabilitar = document.getElementById('btn-inhabilitar');
                if (btnEditar) btnEditar.style.display = 'none';
                if (btnInhabilitar) btnInhabilitar.style.display = 'none';
                const empleadoId = document.getElementById('empleado_id');
                if (empleadoId) empleadoId.value = '';
                if (accion === 'inhabilitar') {
                    document.getElementById('form-empleados').reset();
                }
            }
        });

        addEventIfExists('cargar-datos', 'click', async () => {
            const empleadoId = document.getElementById('empleado_id').value;
            if (!empleadoId) {
                document.getElementById('mensaje').innerText = 'Por favor, ingrese un ID de empleado';
                return;
            }
            try {
                const response = await fetch(`php/registrar_empleados.php?cargar=true&empleado_id=${empleadoId}`);
                const empleado = await response.json();
                if (empleado.error) {
                    document.getElementById('mensaje').innerText = empleado.error;
                } else {
                    document.getElementById('nombre').value = empleado.nombre;
                    document.getElementById('apellido').value = empleado.apellido;
                    document.getElementById('cedula').value = empleado.cedula;
                    const hiddenId = document.getElementById('empleado_id_hidden');
                    if (hiddenId) hiddenId.value = empleadoId;
                    if (document.getElementById('cargo')) {
                        document.getElementById('cargo').value = empleado.cargo;
                        document.getElementById('departamento').value = empleado.departamento;
                        document.getElementById('fecha_contratacion').value = empleado.fecha_contratacion || '';
                        document.getElementById('telefono').value = empleado.telefono || '';
                        document.getElementById('email').value = empleado.email || '';
                        document.getElementById('btn-editar').style.display = 'inline-block';
                    }
                    const btnInhabilitar = document.getElementById('btn-inhabilitar');
                    if (btnInhabilitar) {
                        btnInhabilitar.style.display = empleado.estado === 'Activo' ? 'inline-block' : 'none';
                    }
                    document.getElementById('mensaje').innerText = `Datos cargados (Estado: ${empleado.estado})`;
                }
            } catch (error) {
                console.error('Error al cargar datos:', error);
                document.getElementById('mensaje').innerText = 'Error al cargar los datos del empleado';
            }
        });
    }

    // Consulta de empleados y visualización de horarios
    if (page === 'consultar-empleados' || page === 'visualizar-horarios') {
        addEventIfExists('buscar', 'click', async () => {
            const empleadoId = document.getElementById('empleado_id') ? document.getElementById('empleado_id').value : '';
            const termino = document.getElementById('buscar-empleado') ? document.getElementById('buscar-empleado').value.trim() : '';
            if (document.getElementById('buscar-empleado') && !termino) {
                document.getElementById('resultado-busqueda').innerText = 'Por favor, ingrese un término de búsqueda';
                return;
            }
            try {
                const url = document.getElementById('buscar-empleado') 
                    ? `php/registrar_empleados.php?buscar=true&termino=${encodeURIComponent(termino)}`
                    : `php/registrar_horarios.php?buscar=true&empleado_id=${encodeURIComponent(empleadoId)}`;
                console.log('URL de búsqueda:', url);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                console.log('Datos recibidos:', data);
                const resultado = document.getElementById('resultado-busqueda');
                if (data.length === 0) {
                    resultado.innerText = page === 'consultar-empleados' ? 'No se encontraron empleados' : 'No se encontraron horarios asignados';
                } else if (page === 'consultar-empleados') {
                    let tabla = '<table><tr><th>ID</th><th>Nombre</th><th>Apellido</th><th>Cédula</th><th>Cargo</th><th>Departamento</th><th>Estado</th></tr>';
                    data.forEach(empleado => {
                        tabla += `<tr><td>${empleado.id}</td><td>${empleado.nombre}</td><td>${empleado.apellido}</td><td>${empleado.cedula}</td><td>${empleado.cargo}</td><td>${empleado.departamento}</td><td>${empleado.estado}</td></tr>`;
                    });
                    tabla += '</table>';
                    resultado.innerHTML = tabla;
                } else {
                    let tabla = '<table><tr><th>ID</th><th>Empleado</th><th>Horario</th><th>Tipo</th><th>Hora Inicio</th><th>Hora Fin</th><th>Días</th><th>Fecha Inicio</th><th>Fecha Fin</th></tr>';
                    data.forEach(horario => {
                        tabla += `<tr><td>${horario.id}</td><td>${horario.empleado || 'Todos'}</td><td>${horario.horario}</td><td>${horario.tipo}</td><td>${horario.hora_inicio || '-'}</td><td>${horario.hora_fin || '-'}</td><td>${horario.dias}</td><td>${horario.fecha_inicio}</td><td>${horario.fecha_fin || '-'}</td></tr>`;
                    });
                    tabla += '</table>';
                    resultado.innerHTML = tabla;
                }
            } catch (error) {
                console.error('Error al buscar:', error);
                document.getElementById('resultado-busqueda').innerText = 'Error al realizar la búsqueda: ' + error.message;
            }
        });
    }

    // Gestión de Asistencia
    if (page === 'asistencia') {
        addEventIfExists('form-asistencia', 'submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            formData.append('accion', 'registrar');
            const response = await fetch('php/registrar_asistencia.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.text();
            document.getElementById('mensaje').innerText = result;
            if (result.includes('exitosamente')) {
                document.getElementById('form-asistencia').reset();
            }
        });

        addEventIfExists('ver-historial', 'click', async () => {
            const empleadoId = document.getElementById('empleado_id_historial').value;
            if (!empleadoId) {
                document.getElementById('historial').innerText = 'Por favor, ingrese un ID de empleado';
                return;
            }
            try {
                const response = await fetch(`php/registrar_asistencia.php?historial=true&empleado_id=${empleadoId}`);
                const historial = await response.json();
                if (historial.length === 0) {
                    document.getElementById('historial').innerText = 'No hay registros de asistencia para este empleado';
                } else {
                    let tabla = '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th></tr>';
                    historial.forEach(registro => {
                        tabla += `<tr><td>${registro.fecha}</td><td>${registro.hora_entrada || 'No registrada'}</td><td>${registro.hora_salida || 'No registrada'}</td></tr>`;
                    });
                    tabla += '</table>';
                    document.getElementById('historial').innerHTML = tabla;
                }
            } catch (error) {
                console.error('Error al obtener historial:', error);
                document.getElementById('historial').innerText = 'Error al cargar el historial';
            }
        });
    }

    // Gestión de Permisos
    if (page === 'permisos') {
        addEventIfExists('form-permisos', 'submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            formData.append('accion', 'registrar');
            const response = await fetch('php/registrar_permisos.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.text();
            document.getElementById('mensaje').innerText = result;
            if (result.includes('exitosamente')) {
                document.getElementById('form-permisos').reset();
            }
        });

        addEventIfExists('ver-historial-permisos', 'click', async () => {
            const empleadoId = document.getElementById('empleado_id_historial').value;
            if (!empleadoId) {
                document.getElementById('historial-permisos').innerText = 'Por favor, ingrese un ID de empleado';
                return;
            }
            try {
                const response = await fetch(`php/registrar_permisos.php?historial=true&empleado_id=${empleadoId}`);
                const historial = await response.json();
                if (historial.length === 0) {
                    document.getElementById('historial-permisos').innerText = 'No hay registros de permisos para este empleado';
                } else {
                    let tabla = '<table><tr><th>Tipo Ausencia</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Descripción</th><th>Estado</th></tr>';
                    historial.forEach(registro => {
                        tabla += `<tr><td>${registro.tipo_ausencia}</td><td>${registro.fecha_inicio}</td><td>${registro.fecha_fin}</td><td>${registro.descripcion || 'Sin descripción'}</td><td>${registro.estado}</td></tr>`;
                    });
                    tabla += '</table>';
                    document.getElementById('historial-permisos').innerHTML = tabla;
                }
            } catch (error) {
                console.error('Error al obtener historial:', error);
                document.getElementById('historial-permisos').innerText = 'Error al cargar el historial';
            }
        });
    }

    // Gestión de Horarios (crear, asignar, excepciones)
    if (page === 'gestion-horarios') {
        addEventIfExists('form-horarios', 'submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const accion = e.submitter.name === 'accion' ? e.submitter.value : 'crear';
            formData.append('accion', accion);
            const response = await fetch('php/registrar_horarios.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.text();
            document.getElementById('mensaje').innerText = result;
            if (result.includes('exitosamente')) {
                document.getElementById('form-horarios').reset();
            }
        });
    }

   // Generación de Reportes
if (page === 'reporte-diario' || page === 'reporte-mensual' || page === 'reporte-tardanzas' || 
    page === 'reporte-ausencias' || page === 'reporte-horas' || page === 'reporte-personalizado') {
    let reporteData = [];

    addEventIfExists('generar-reporte', 'click', async () => {
        const empleadoId = document.getElementById('empleado_id') ? document.getElementById('empleado_id').value : '';
        const fecha = document.getElementById('fecha') ? document.getElementById('fecha').value : '';
        const mes = document.getElementById('mes') ? document.getElementById('mes').value : '';
        const fechaInicio = document.getElementById('fecha_inicio') ? document.getElementById('fecha_inicio').value : '';
        const fechaFin = document.getElementById('fecha_fin') ? document.getElementById('fecha_fin').value : '';
        const cargo = document.getElementById('cargo') ? document.getElementById('cargo').value : '';
        const departamento = document.getElementById('departamento') ? document.getElementById('departamento').value : '';
        const incluirAsistencias = document.getElementById('incluir-asistencias') ? document.getElementById('incluir-asistencias').checked : false;
        const incluirTardanzas = document.getElementById('incluir-tardanzas') ? document.getElementById('incluir-tardanzas').checked : false;
        const incluirAusencias = document.getElementById('incluir-ausencias') ? document.getElementById('incluir-ausencias').checked : false;
        const incluirHoras = document.getElementById('incluir-horas') ? document.getElementById('incluir-horas').checked : false;

        let url = `php/generar_reportes.php?tipo_reporte=${page.split('-')[1]}&empleado_id=${encodeURIComponent(empleadoId)}`;
        if (fecha) url += `&fecha=${encodeURIComponent(fecha)}`;
        if (mes) url += `&mes=${encodeURIComponent(mes)}`;
        if (fechaInicio) url += `&fecha_inicio=${encodeURIComponent(fechaInicio)}`;
        if (fechaFin) url += `&fecha_fin=${encodeURIComponent(fechaFin)}`;
        if (cargo) url += `&cargo=${encodeURIComponent(cargo)}`;
        if (departamento) url += `&departamento=${encodeURIComponent(departamento)}`;
        if (page === 'reporte-personalizado') {
            url += `&incluir_asistencias=${incluirAsistencias}&incluir_tardanzas=${incluirTardanzas}&incluir_ausencias=${incluirAusencias}&incluir_horas=${incluirHoras}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            console.log('Datos del reporte:', data);
            console.log('Estructura de un elemento:', data[0]);
            const resultado = document.getElementById('resultado-reporte');
            resultado.innerHTML = '';

            if (data.error) {
                resultado.innerText = data.error;
                return;
            }

            if (data.length === 0) {
                resultado.innerText = 'No se encontraron datos para el reporte';
                return;
            }

            reporteData = data;

            if (page === 'reporte-diario') {
                let tabla = '<table><tr><th>ID Empleado</th><th>Nombre</th><th>Cargo</th><th>Departamento</th><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th></tr>';
                data.forEach(item => {
                    tabla += `<tr><td>${item.empleado_id}</td><td>${item.nombre}</td><td>${item.cargo}</td><td>${item.departamento}</td><td>${item.fecha}</td><td>${item.hora_entrada}</td><td>${item.hora_salida}</td></tr>`;
                });
                tabla += '</table>';
                resultado.innerHTML = tabla;
            } else if (page === 'reporte-mensual') {
                data.forEach(item => {
                    let tabla = `<h3>${item.nombre} (ID: ${item.empleado_id})</h3>`;
                    tabla += '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th></tr>';
                    if (Array.isArray(item.asistencias) && item.asistencias.length > 0) {
                        item.asistencias.forEach(asistencia => {
                            tabla += `<tr><td>${asistencia.fecha}</td><td>${asistencia.hora_entrada || 'No registrada'}</td><td>${asistencia.hora_salida || 'No registrada'}</td></tr>`;
                        });
                    } else {
                        tabla += '<tr><td colspan="3">No hay asistencias registradas</td></tr>';
                    }
                    tabla += '</table>';
                    resultado.innerHTML += tabla;
                });
            
            } else if (page === 'reporte-tardanzas') {
                data.forEach(item => {
                    let tabla = `<h3>${item.nombre} (ID: ${item.empleado_id})</h3>`;
                    tabla += '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Inicio Esperada</th></tr>';
                    item.tardanzas.forEach(tardanza => {
                        tabla += `<tr><td>${tardanza.fecha}</td><td>${tardanza.hora_entrada}</td><td>${tardanza.hora_inicio}</td></tr>`;
                    });
                    tabla += '</table>';
                    resultado.innerHTML += tabla;
                });
            } else if (page === 'reporte-ausencias') {
                data.forEach(item => {
                    let tabla = `<h3>${item.nombre} (ID: ${item.empleado_id})</h3>`;
                    tabla += '<table><tr><th>Fecha</th></tr>';
                    item.ausencias.forEach(ausencia => {
                        tabla += `<tr><td>${ausencia.fecha}</td></tr>`;
                    });
                    tabla += '</table>';
                    resultado.innerHTML += tabla;
                });
            } else if (page === 'reporte-horas') {
                data.forEach(item => {
                    let tabla = `<h3>${item.nombre} (ID: ${item.empleado_id})</h3>`;
                    tabla += '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th><th>Horas Trabajadas</th></tr>';
                    item.asistencias.forEach(asistencia => {
                        tabla += `<tr><td>${asistencia.fecha}</td><td>${asistencia.hora_entrada}</td><td>${asistencia.hora_salida}</td><td>${asistencia.horas}</td></tr>`;
                    });
                    tabla += `<tr><td colspan="3"><strong>Total</strong></td><td><strong>${item.horas_totales}</strong></td></tr>`;
                    tabla += '</table>';
                    resultado.innerHTML += tabla;
                });
            } else if (page === 'reporte-personalizado') {
                data.forEach(item => {
                    let contenido = `<h3>${item.nombre} (ID: ${item.empleado_id})</h3>`;
                    contenido += `<p><strong>Cargo:</strong> ${item.cargo} | <strong>Departamento:</strong> ${item.departamento}</p>`;

                    if (item.asistencias && item.asistencias.length > 0) {
                        contenido += '<h4>Asistencias</h4>';
                        contenido += '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th></tr>';
                        item.asistencias.forEach(asistencia => {
                            contenido += `<tr><td>${asistencia.fecha}</td><td>${asistencia.hora_entrada || 'No registrada'}</td><td>${asistencia.hora_salida || 'No registrada'}</td></tr>`;
                        });
                        contenido += '</table>';
                    }

                    if (item.tardanzas && item.tardanzas.length > 0) {
                        contenido += '<h4>Tardanzas</h4>';
                        contenido += '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Inicio Esperada</th></tr>';
                        item.tardanzas.forEach(tardanza => {
                            contenido += `<tr><td>${tardanza.fecha}</td><td>${tardanza.hora_entrada}</td><td>${tardanza.hora_inicio}</td></tr>`;
                        });
                        contenido += '</table>';
                    }

                    if (item.ausencias && item.ausencias.length > 0) {
                        contenido += '<h4>Ausencias</h4>';
                        contenido += '<table><tr><th>Fecha</th></tr>';
                        item.ausencias.forEach(ausencia => {
                            contenido += `<tr><td>${ausencia.fecha}</td></tr>`;
                        });
                        contenido += '</table>';
                    }

                    if (item.horas && item.horas.length > 0) {
                        contenido += '<h4>Horas Trabajadas</h4>';
                        contenido += '<table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th><th>Horas Trabajadas</th></tr>';
                        item.horas.forEach(hora => {
                            contenido += `<tr><td>${hora.fecha}</td><td>${hora.hora_entrada}</td><td>${hora.hora_salida}</td><td>${hora.horas}</td></tr>`;
                        });
                        contenido += `<tr><td colspan="3"><strong>Total</strong></td><td><strong>${item.horas_totales}</strong></td></tr>`;
                        contenido += '</table>';
                    }

                    resultado.innerHTML += contenido;
                });
            }
        } catch (error) {
            console.error('Error al generar reporte:', error);
            document.getElementById('resultado-reporte').innerText = 'Error al generar el reporte: ' + error.message;
        }
    });

        addEventIfExists('exportar-pdf', 'click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text(document.querySelector('header h1').innerText, 10, 10);
            const resultado = document.getElementById('resultado-reporte');
            doc.html(resultado, {
                callback: function (doc) {
                    doc.save(`${page}.pdf`);
                },
                x: 10,
                y: 20,
                width: 190,
                windowWidth: 650
            });
        });

        addEventIfExists('exportar-excel', 'click', () => {
            const ws_data = [];
            if (page === 'reporte-diario') {
                ws_data.push(['ID Empleado', 'Nombre', 'Cargo', 'Departamento', 'Fecha', 'Hora Entrada', 'Hora Salida']);
                reporteData.forEach(item => {
                    ws_data.push([item.empleado_id, item.nombre, item.cargo, item.departamento, item.fecha, item.hora_entrada, item.hora_salida]);
                });
            } else if (page === 'reporte-mensual') {
                ws_data.push(['ID Empleado', 'Nombre', 'Fecha', 'Hora Entrada', 'Hora Salida']);
                reporteData.forEach(item => {
                    item.asistencias.forEach(asistencia => {
                        ws_data.push([item.empleado_id, item.nombre, asistencia.fecha, asistencia.hora_entrada || 'No registrada', asistencia.hora_salida || 'No registrada']);
                    });
                });
            } else if (page === 'reporte-tardanzas') {
                ws_data.push(['ID Empleado', 'Nombre', 'Fecha', 'Hora Entrada', 'Hora Inicio Esperada']);
                reporteData.forEach(item => {
                    item.tardanzas.forEach(tardanza => {
                        ws_data.push([item.empleado_id, item.nombre, tardanza.fecha, tardanza.hora_entrada, tardanza.hora_inicio]);
                    });
                });
            } else if (page === 'reporte-ausencias') {
                ws_data.push(['ID Empleado', 'Nombre', 'Fecha']);
                reporteData.forEach(item => {
                    item.ausencias.forEach(ausencia => {
                        ws_data.push([item.empleado_id, item.nombre, ausencia.fecha]);
                    });
                });
            } else if (page === 'reporte-horas') {
                ws_data.push(['ID Empleado', 'Nombre', 'Fecha', 'Hora Entrada', 'Hora Salida', 'Horas Trabajadas']);
                reporteData.forEach(item => {
                    item.asistencias.forEach(asistencia => {
                        ws_data.push([item.empleado_id, item.nombre, asistencia.fecha, asistencia.hora_entrada, asistencia.hora_salida, asistencia.horas]);
                    });
                    ws_data.push(['', '', '', '', 'Total', item.horas_totales]);
                });
            } else if (page === 'reporte-personalizado') {
                reporteData.forEach(item => {
                    ws_data.push([`ID Empleado: ${item.empleado_id}`, `Nombre: ${item.nombre}`, `Cargo: ${item.cargo}`, `Departamento: ${item.departamento}`]);
                    if (item.asistencias && item.asistencias.length > 0) {
                        ws_data.push(['Asistencias']);
                        ws_data.push(['Fecha', 'Hora Entrada', 'Hora Salida']);
                        item.asistencias.forEach(asistencia => {
                            ws_data.push([asistencia.fecha, asistencia.hora_entrada || 'No registrada', asistencia.hora_salida || 'No registrada']);
                        });
                    }
                    if (item.tardanzas && item.tardanzas.length > 0) {
                        ws_data.push(['Tardanzas']);
                        ws_data.push(['Fecha', 'Hora Entrada', 'Hora Inicio Esperada']);
                        item.tardanzas.forEach(tardanza => {
                            ws_data.push([tardanza.fecha, tardanza.hora_entrada, tardanza.hora_inicio]);
                        });
                    }
                    if (item.ausencias && item.ausencias.length > 0) {
                        ws_data.push(['Ausencias']);
                        ws_data.push(['Fecha']);
                        item.ausencias.forEach(ausencia => {
                            ws_data.push([ausencia.fecha]);
                        });
                    }
                    if (item.horas && item.horas.length > 0) {
                        ws_data.push(['Horas Trabajadas']);
                        ws_data.push(['Fecha', 'Hora Entrada', 'Hora Salida', 'Horas Trabajadas']);
                        item.horas.forEach(hora => {
                            ws_data.push([hora.fecha, hora.hora_entrada, hora.hora_salida, hora.horas]);
                        });
                        ws_data.push(['', '', 'Total', item.horas_totales]);
                    }
                    ws_data.push([]); // Separador
                });
            }

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
            XLSX.writeFile(wb, `${page}.xlsx`);
        });
    }
});