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
});