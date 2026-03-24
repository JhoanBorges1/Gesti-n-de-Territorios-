/* ARCHIVO: js/ui.js - PARTE 1: NAVEGACIÓN Y GESTIÓN DE PERSONAL */

// --- 1. NAVEGACIÓN Y CONTROL DE PESTAÑAS ---

function switchTab(tabId) {
    // 1. Limpiamos el estado activo de todos los botones de navegación
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Ocultamos todos los contenidos de las pestañas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; 
    });

    // 3. Buscamos el botón que activó la función y le ponemos la clase activa
    const selectedBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.getAttribute('onclick').includes(tabId));
    if (selectedBtn) selectedBtn.classList.add('active');

    // 4. Mostramos el contenedor de la pestaña seleccionada
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.display = 'block';
        
        // Si el contenedor está vacío (primera vez), inyectamos la estructura
        if (targetContent.innerHTML.trim() === "") {
            inyectarEstructuraTab(tabId);
        }
        
        // Refrescamos los datos específicos según la pestaña activa
        if (tabId === 'tab-personal') renderListaConductores();
        if (tabId === 'tab-territorios') renderListaTerritorios();
        if (tabId === 'tab-config') renderListaGrupos();
        if (tabId === 'tab-agenda') cargarAgendaDelMes();
    }
    
    // Guardamos la última pestaña para que no se pierda al recargar
    localStorage.setItem('vdm_active_tab', tabId);
}

// --- 2. AYUDANTES DE MODALES (VENTANAS EMERGENTES) ---

function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex'; 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
}

// --- 3. GESTIÓN DE CONDUCTORES (RESTAURACIÓN ESTÉTICA) ---

function openModalConductor() { 
    const form = document.getElementById('formConductor');
    form.reset(); 
    document.getElementById('editIndexConductor').value = ""; 
    document.getElementById('grupoSugerido').classList.add('hidden'); 
    
    // Limpiamos manualmente las casillas AM/PM para un nuevo registro
    document.querySelectorAll('#disponibilidadSemanal input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    openModal('modalConductor'); 
}

function renderListaConductores() {
    const cont = document.getElementById('listaConductores');
    if (!cont) return;
    cont.innerHTML = '';
    
    // Ordenamos alfabéticamente para mantener el estilo Google
    conductores.sort((a,b) => a.nombre.localeCompare(b.nombre));

    conductores.forEach((c, i) => {
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <span style="font-weight:700; color: var(--google-blue);">${c.nombre} ${c.apellido}</span><br>
                    <small style="color: var(--text-sub);">Grupo ${c.grupo || 'S/G'} | ${c.esAnciano ? 'Anciano' : 'Publicador'}</small>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-edit-outline" onclick="editarConductor(${i})">Editar</button>
                    <button class="btn-danger-outline" onclick="eliminarConductor(${i})">X</button>
                </div>
            </div>`;
    });
}

function editarConductor(i) {
    const c = conductores[i];
    document.getElementById('editIndexConductor').value = i;
    document.getElementById('cNombre').value = c.nombre;
    document.getElementById('cApellido').value = c.apellido;
    document.getElementById('cTelefono').value = c.telefono;
    document.getElementById('cEsAnciano').value = c.esAnciano ? 'si' : 'no';
    document.getElementById('cGrupoAsignado').value = c.grupo || "1";
    document.getElementById('grupoSugerido').classList.toggle('hidden', !c.esAnciano);
    
    // Restauramos las casillas de verificación AM/PM guardadas
    document.querySelectorAll('#disponibilidadSemanal input[type="checkbox"]').forEach(cb => {
        cb.checked = (c.disponibilidadDias || []).includes(cb.value);
    });
    
    document.getElementById('cFechaDisponible').value = c.fechaDisponible || "";
    document.getElementById('cFechaNoDisponible').value = c.fechaNoDisponible || "";
    openModal('modalConductor');
}

function eliminarConductor(i) {
    // Uso un mensaje personalizado en vez de alert para no romper la estética
    if(confirm("¿Estás seguro de que quieres eliminar a este conductor?")) {
        conductores.splice(i, 1);
        guardarLocal();
        renderListaConductores();
    }
}

/* ARCHIVO: js/ui.js - PARTE 2: CAPTURA DE FORMULARIOS Y LISTENERS */

// --- 4. LISTENERS DE FORMULARIOS (PROCESAMIENTO DE DATOS) ---

document.addEventListener('DOMContentLoaded', () => {
    // Usamos delegación de eventos para que funcione incluso si el formulario se inyecta dinámicamente
    document.body.addEventListener('submit', (e) => {
        
        // A. PROCESAR REGISTRO DE CONDUCTOR
        if (e.target.id === 'formConductor') {
            e.preventDefault();
            const index = document.getElementById('editIndexConductor').value;
            
            // Captura avanzada de disponibilidad AM/PM por cada fila de día
            const disponibilidadActualizada = [];
            document.querySelectorAll('#disponibilidadSemanal .day-row').forEach(row => {
                const dayCheck = row.querySelector('.day-check');
                // Si el día está marcado, guardamos el día y sus bloques horarios
                if (dayCheck && dayCheck.checked) {
                    disponibilidadActualizada.push(dayCheck.value); // Guarda "LUN", "MAR", etc.
                    
                    const timeChecks = row.querySelectorAll('.time-options input:checked');
                    timeChecks.forEach(timeCheck => {
                        disponibilidadActualizada.push(timeCheck.value); // Guarda "LUN-AM", "LUN-PM", etc.
                    });
                }
            });

            const nuevoConductor = {
                nombre: document.getElementById('cNombre').value.trim(),
                apellido: document.getElementById('cApellido').value.trim(),
                telefono: document.getElementById('cTelefono').value.trim(),
                esAnciano: document.getElementById('cEsAnciano').value === 'si',
                grupo: document.getElementById('cGrupoAsignado').value,
                disponibilidadDias: disponibilidadActualizada, 
                fechaDisponible: document.getElementById('cFechaDisponible').value,
                fechaNoDisponible: document.getElementById('cFechaNoDisponible').value
            };

            // Validación rápida para no guardar basura
            if (nuevoConductor.nombre.length < 2) return;

            if (index === "") {
                conductores.push(nuevoConductor);
            } else {
                conductores[index] = nuevoConductor;
            }
            
            guardarLocal(); 
            renderListaConductores(); 
            actualizarSelectAncianos(); 
            closeModal('modalConductor');
        }

        // B. PROCESAR REGISTRO DE TERRITORIO
        if (e.target.id === 'formTerritorio') {
            e.preventDefault();
            const index = document.getElementById('editIndexTerritorio').value;
            
            const nuevoTerritorio = { 
                numero: document.getElementById('tNumero').value, 
                nombre: document.getElementById('tNombre').value.trim(), 
                lugar: document.getElementById('tLugar').value.trim(),
                disponibilidadDias: Array.from(document.querySelectorAll('#tDias input:checked')).map(cb => cb.value),
                disponibilidadHoras: Array.from(document.querySelectorAll('#tHoras input:checked')).map(cb => cb.value),
                subNombre: document.getElementById('tsNombre').value.trim(),
                subDias: Array.from(document.querySelectorAll('#tsDias input:checked')).map(cb => cb.value),
                subHoras: Array.from(document.querySelectorAll('#tsHoras input:checked')).map(cb => cb.value)
            };

            if (index === "") {
                territorios.push(nuevoTerritorio);
            } else {
                territorios[index] = nuevoTerritorio;
            }
            
            guardarLocal(); 
            renderListaTerritorios(); 
            closeModal('modalTerritorio');
        }

        // C. PROCESAR REGISTRO DE GRUPO (1-8)
        if (e.target.id === 'formGrupo') {
            e.preventDefault();
            const index = document.getElementById('editIndexGrupo').value;
            
            const nuevoGrupo = { 
                numero: document.getElementById('gNumero').value, 
                anciano: document.getElementById('gAnciano').value 
            };

            if (index === "") {
                grupos.push(nuevoGrupo);
            } else {
                grupos[index] = nuevoGrupo;
            }
            
            guardarLocal(); 
            renderListaGrupos(); 
            closeModal('modalGrupo');
        }
    });
});

// --- 5. GESTIÓN DE TERRITORIOS (VISTA) ---

function renderListaTerritorios() {
    const cont = document.getElementById('listaTerritorios');
    if (!cont) return;
    cont.innerHTML = '';
    
    // Ordenar por número de territorio para que no sea un caos
    territorios.sort((a, b) => (parseInt(a.numero) || 999) - (parseInt(b.numero) || 999));

    territorios.forEach((t, i) => {
        const subTag = t.subNombre ? `<br><small style="color:var(--google-blue);">Sub: ${t.subNombre}</small>` : '';
        cont.innerHTML += `
            <div class="contact-item">
                <div><strong>${t.numero}. ${t.nombre}</strong>${subTag}</div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit-outline" onclick="editarTerritorio(${i})">Editar</button>
                    <button class="btn-danger-outline" onclick="eliminarTerritorio(${i})">X</button>
                </div>
            </div>`;
    });
}

function eliminarTerritorio(i) {
    if (confirm("¿Eliminar este territorio del catálogo?")) {
        territorios.splice(i, 1);
        guardarLocal();
        renderListaTerritorios();
    }
}



/* ARCHIVO: js/ui.js - PARTE 3: GRUPOS, AGENDA Y WHATSAPP */

// --- 6. GESTIÓN DE GRUPOS (VISUALIZACIÓN DE LOS 8 GRUPOS) ---

function renderListaGrupos() { 
    const cont = document.getElementById('listaGrupos'); 
    if(!cont) return;
    cont.innerHTML = ''; 
    
    // Ordenamos numéricamente para que se vea como una lista oficial
    grupos.sort((a,b) => (parseInt(a.numero)||99) - (parseInt(b.numero)||99));
    
    grupos.forEach((g,i) => {
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <span style="font-weight:700; color: var(--google-blue);">Grupo ${g.numero}</span><br>
                    <small style="color: var(--text-sub);">Responsable: ${g.anciano}</small>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit-outline" onclick="editarGrupo(${i})">Editar</button>
                    <button class="btn-danger-outline" onclick="eliminarGrupo(${i})">X</button>
                </div>
            </div>`;
    }); 
}

function actualizarSelectAncianos() {
    const s = document.getElementById('gAnciano'); 
    if(!s) return;
    
    s.innerHTML = '<option value="">Seleccione un anciano...</option>';
    
    // Solo mostramos a los conductores marcados como Ancianos
    conductores.filter(c => c.esAnciano).forEach(c => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`;
        s.innerHTML += `<option value="${nombreCompleto}">${nombreCompleto} (G${c.grupo})</option>`;
    });
}

// --- 7. RENDERIZADO DE LA TABLA DE AGENDA (CON ESTÉTICA ORIGINAL) ---

function renderAgenda(datos, nombreMes) {
    const displayFecha = document.getElementById('fechaActualDisplay');
    if (displayFecha) {
        displayFecha.innerText = `${nombreMes} ${obtenerAnioTrabajo()}`;
    }
    
    const cuerpo = document.getElementById('tablaCuerpoAgenda');
    if (!cuerpo) return;
    
    cuerpo.innerHTML = '';
    let ultimoDia = null;

    datos.forEach((f, i) => {
        const tr = document.createElement('tr');
        
        // Si cambia el día del mes, añadimos el separador visual (línea azul gruesa)
        if (ultimoDia !== null && ultimoDia !== f.diaMes) {
            tr.className = 'day-separator';
        }
        
        // Mantenemos las clases bold-cell para que el Día y la Fecha resalten
        tr.innerHTML = `
            <td class="bold-cell">${ultimoDia !== f.diaMes ? f.diaSemana : ''}</td>
            <td class="bold-cell">${ultimoDia !== f.diaMes ? f.diaMes : ''}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i},'hora',this.innerText)">${f.hora}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i},'conductor',this.innerText)">${f.conductor}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i},'territorio',this.innerText)">${f.territorio}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i},'lugar',this.innerText)">${f.lugar}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i},'grupos',this.innerText)">${f.grupos}</td>`;
        
        cuerpo.appendChild(tr);
        ultimoDia = f.diaMes;
    });
    
    // Cada vez que renderizamos la agenda, refrescamos los recordatorios de WhatsApp
    renderContactos();
}

// --- 8. WHATSAPP Y RECORDATORIOS ---

function renderContactos() {
    const cont = document.getElementById('listaContactos'); 
    if (!cont) return;
    
    cont.innerHTML = '';
    const mesActivo = document.getElementById('mesAgenda').value;
    const hoy = new Date().getDate();
    
    if (!agendasMaestras[mesActivo]) return;

    // Filtramos para mostrar solo hoy y mañana para que la lista no sea gigante
    const proximas = agendasMaestras[mesActivo].filter(a => a.diaMes === hoy || a.diaMes === hoy + 1);
    
    proximas.forEach((asig) => {
        const idxReal = agendasMaestras[mesActivo].indexOf(asig);
        const cond = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === asig.conductor.toLowerCase());
        
        // Limpiamos el teléfono por si acaso tiene espacios o signos
        const telf = cond ? cond.telefono.replace(/\s/g, '').replace('+', '') : "58";
        
        const msg = `¡Hola! ¿Cómo estás?. Este mensaje es para notificarte que tienes el privilegio de dirigir el grupo del ${asig.diaSemana.toLowerCase()} ${asig.diaMes} a las ${asig.hora}. Ese día estarán abarcando el territorio ${asig.territorio}. El lugar de encuentro será en ${asig.lugar}. ¿Podrías confirmarme si vas a asistir? Estaré atento a tu respuesta. ¡Muchas gracias!`;
        
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <span style="font-weight:700;">${asig.conductor}</span><br>
                    <small style="color:var(--text-sub);">${asig.diaSemana} ${asig.diaMes} - ${asig.hora}</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="check-icon" style="display: ${asig.avisado ? 'inline' : 'none'}; color: var(--google-green); font-weight: bold;">✓</span>
                    <a href="https://wa.me/${telf}?text=${encodeURIComponent(msg)}" target="_blank" class="btn-whatsapp" onclick="marcarComoAvisado(${idxReal})">WhatsApp</a>
                </div>
            </div>`;
    });
}

function marcarComoAvisado(idx) {
    const mes = document.getElementById('mesAgenda').value;
    if (agendasMaestras[mes] && agendasMaestras[mes][idx]) {
        agendasMaestras[mes][idx].avisado = true;
        // Guardamos localmente para que el check no desaparezca
        guardarLocal();
        renderContactos();
    }
}

// --- 9. HISTORIAL Y EXPORTACIÓN ---

function renderHistorial() {
    const cont = document.getElementById('listaHistorial'); 
    if(!cont) return;
    cont.innerHTML = '';
    
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    Object.keys(historialAgendas).sort((a,b) => a-b).forEach(m => {
        cont.innerHTML += `
            <div class="group-card">
                <span>Agenda de <strong>${meses[m-1]}</strong></span> 
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit-outline" onclick="cargarDeHistorial(${m})">Cargar</button>
                    <button class="btn-danger-outline" onclick="borrarDeHistorial(${m})">Borrar</button>
                </div>
            </div>`;
    });
}

