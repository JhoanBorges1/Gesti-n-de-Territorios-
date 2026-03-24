/* ARCHIVO: js/ui.js - PARTE 1: NAVEGACIÓN Y GESTIÓN DE CONDUCTORES (RESTAURADO) */

// --- 1. NAVEGACIÓN Y VISIBILIDAD DE PESTAÑAS ---

function switchTab(tabId) {
    // 1. Limpiamos estados activos de los botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Escondemos TODAS las pestañas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; 
    });

    // 3. Activamos el botón seleccionado
    const selectedBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.getAttribute('onclick').includes(tabId));
    if (selectedBtn) selectedBtn.classList.add('active');

    // 4. Activamos la pestaña seleccionada
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.display = 'block';
        
        // Inyectamos la estructura si está vacía (Loader)
        if (targetContent.innerHTML.trim() === "") {
            inyectarEstructuraTab(tabId);
        }
        
        // Renderizamos los datos específicos según la pestaña
        if (tabId === 'tab-personal') renderListaConductores();
        if (tabId === 'tab-territorios') renderListaTerritorios();
        if (tabId === 'tab-config') renderListaGrupos();
        if (tabId === 'tab-agenda') cargarAgendaDelMes();
    }
    
    localStorage.setItem('vdm_active_tab', tabId);
}

function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex'; 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
}

// --- 2. GESTIÓN DE CONDUCTORES (CRUD COMPLETO) ---

function openModalConductor() { 
    document.getElementById('formConductor').reset(); 
    document.getElementById('editIndexConductor').value = ""; 
    document.getElementById('grupoSugerido').classList.add('hidden'); 
    // Limpieza manual de checkboxes AM/PM
    document.querySelectorAll('#disponibilidadSemanal input[type="checkbox"]').forEach(cb => cb.checked = false);
    openModal('modalConductor'); 
}

function renderListaConductores() {
    const cont = document.getElementById('listaConductores');
    if (!cont) return;
    cont.innerHTML = '';
    conductores.sort((a,b) => a.nombre.localeCompare(b.nombre));

    conductores.forEach((c, i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div>
                    <strong>${c.nombre} ${c.apellido}</strong><br>
                    <small>G${c.grupo || 'S/G'} ${c.esAnciano ? '(Anciano)' : ''}</small>
                </div>
                <div>
                    <button class="btn-edit-outline" onclick="editarConductor(${i})">Edit</button>
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
    
    // Marcar disponibilidad AM/PM guardada
    document.querySelectorAll('#disponibilidadSemanal input[type="checkbox"]').forEach(cb => {
        cb.checked = (c.disponibilidadDias || []).includes(cb.value);
    });
    
    document.getElementById('cFechaDisponible').value = c.fechaDisponible || "";
    document.getElementById('cFechaNoDisponible').value = c.fechaNoDisponible || "";
    openModal('modalConductor');
}

function eliminarConductor(i) {
    if(confirm("¿Eliminar este conductor?")) {
        conductores.splice(i, 1);
        guardarLocal();
        renderListaConductores();
    }
}

/* ARCHIVO: js/ui.js - PARTE 2: LISTENERS Y GESTIÓN DE TERRITORIOS */

// --- 3. LISTENERS DE FORMULARIOS (CAPTURA DETALLADA) ---

document.addEventListener('DOMContentLoaded', () => {
    // Listener para el Formulario de Conductor
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'formConductor') {
            e.preventDefault();
            const index = document.getElementById('editIndexConductor').value;
            
            // Captura de disponibilidad AM/PM (Clave para la Mejora 2)
            const disponibilidadActualizada = [];
            document.querySelectorAll('#disponibilidadSemanal .day-row').forEach(row => {
                const dayCheck = row.querySelector('.day-check');
                if (dayCheck && dayCheck.checked) {
                    disponibilidadActualizada.push(dayCheck.value); // Guarda el día (LUN)
                    row.querySelectorAll('.time-options input:checked').forEach(timeCheck => {
                        disponibilidadActualizada.push(timeCheck.value); // Guarda el bloque (LUN-AM)
                    });
                }
            });

            const c = {
                nombre: document.getElementById('cNombre').value,
                apellido: document.getElementById('cApellido').value,
                telefono: document.getElementById('cTelefono').value,
                esAnciano: document.getElementById('cEsAnciano').value === 'si',
                grupo: document.getElementById('cGrupoAsignado').value,
                disponibilidadDias: disponibilidadActualizada, 
                fechaDisponible: document.getElementById('cFechaDisponible').value,
                fechaNoDisponible: document.getElementById('cFechaNoDisponible').value
            };

            if (index === "") conductores.push(c); else conductores[index] = c;
            guardarLocal(); renderListaConductores(); actualizarSelectAncianos(); closeModal('modalConductor');
        }

        // Listener para el Formulario de Territorio
        if (e.target.id === 'formTerritorio') {
            e.preventDefault();
            const index = document.getElementById('editIndexTerritorio').value;
            const t = { 
                numero: document.getElementById('tNumero').value, 
                nombre: document.getElementById('tNombre').value, 
                lugar: document.getElementById('tLugar').value,
                disponibilidadDias: Array.from(document.querySelectorAll('#tDias input:checked')).map(cb => cb.value),
                disponibilidadHoras: Array.from(document.querySelectorAll('#tHoras input:checked')).map(cb => cb.value),
                subNombre: document.getElementById('tsNombre').value.trim(),
                subDias: Array.from(document.querySelectorAll('#tsDias input:checked')).map(cb => cb.value),
                subHoras: Array.from(document.querySelectorAll('#tsHoras input:checked')).map(cb => cb.value)
            };
            if(index === "") territorios.push(t); else territorios[index] = t;
            guardarLocal(); renderListaTerritorios(); closeModal('modalTerritorio');
        }
    });
});

// --- 4. GESTIÓN DE TERRITORIOS (CRUD) ---

function openModalTerritorio() { 
    document.getElementById('formTerritorio').reset(); 
    document.getElementById('editIndexTerritorio').value = ""; 
    document.querySelectorAll('#modalTerritorio input[type="checkbox"]').forEach(cb => cb.checked = false);
    openModal('modalTerritorio'); 
}

function renderListaTerritorios() {
    const cont = document.getElementById('listaTerritorios');
    if (!cont) return;
    cont.innerHTML = '';
    territorios.sort((a,b) => (parseInt(a.numero)||999) - (parseInt(b.numero)||999));

    territorios.forEach((t, i) => {
        const subBadge = t.subNombre ? `<br><small class="subterritorio-badge">Sub: ${t.subNombre}</small>` : '';
        cont.innerHTML += `
            <div class="group-card">
                <div><strong>${t.numero}. ${t.nombre}</strong>${subBadge}</div>
                <div>
                    <button class="btn-edit-outline" onclick="editarTerritorio(${i})">Edit</button>
                    <button class="btn-danger-outline" onclick="eliminarTerritorio(${i})">X</button>
                </div>
            </div>`;
    });
}

function editarTerritorio(i) {
    const t = territorios[i];
    document.getElementById('editIndexTerritorio').value = i;
    document.getElementById('tNumero').value = t.numero;
    document.getElementById('tNombre').value = t.nombre;
    document.getElementById('tLugar').value = t.lugar;
    document.getElementById('tsNombre').value = t.subNombre || "";
    
    document.querySelectorAll('#tDias input').forEach(cb => cb.checked = (t.disponibilidadDias || []).includes(cb.value));
    document.querySelectorAll('#tHoras input').forEach(cb => cb.checked = (t.disponibilidadHoras || []).includes(cb.value));
    document.querySelectorAll('#tsDias input').forEach(cb => cb.checked = (t.subDias || []).includes(cb.value));
    document.querySelectorAll('#tsHoras input').forEach(cb => cb.checked = (t.subHoras || []).includes(cb.value));
    openModal('modalTerritorio');
}

function eliminarTerritorio(i) {
    if(confirm("¿Eliminar territorio?")) { territorios.splice(i,1); guardarLocal(); renderListaTerritorios(); }
}

/* ARCHIVO: js/ui.js - PARTE 3: AGENDA, GRUPOS Y WHATSAPP (COMPLETO) */

// --- 5. GESTIÓN DE GRUPOS (CRUD) ---

function openModalGrupo() { 
    document.getElementById('formGrupo').reset(); 
    document.getElementById('editIndexGrupo').value = ""; 
    actualizarSelectAncianos(); 
    openModal('modalGrupo'); 
}

function renderListaGrupos() { 
    const cont = document.getElementById('listaGrupos'); 
    if(!cont) return;
    cont.innerHTML = ''; 
    grupos.sort((a,b) => (parseInt(a.numero)||99) - (parseInt(b.numero)||99));
    
    grupos.forEach((g,i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div><strong>Grupo ${g.numero}</strong><br><small>Responsable: ${g.anciano}</small></div>
                <div>
                    <button class="btn-edit-outline" onclick="editarGrupo(${i})">Edit</button>
                    <button class="btn-danger-outline" onclick="eliminarGrupo(${i})">X</button>
                </div>
            </div>`;
    }); 
}

function editarGrupo(i) { 
    const g = grupos[i]; 
    document.getElementById('editIndexGrupo').value = i; 
    actualizarSelectAncianos(); 
    document.getElementById('gNumero').value = g.numero; 
    document.getElementById('gAnciano').value = g.anciano; 
    openModal('modalGrupo'); 
}

function eliminarGrupo(i) { 
    if(confirm("¿Eliminar este grupo?")) { 
        grupos.splice(i,1); 
        guardarLocal(); 
        guardarSincronizar();
        renderListaGrupos(); 
    } 
}

function actualizarSelectAncianos() {
    const s = document.getElementById('gAnciano'); 
    if(!s) return;
    s.innerHTML = '<option value="">Seleccione un anciano...</option>';
    conductores.filter(c => c.esAnciano).forEach(c => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`;
        s.innerHTML += `<option value="${nombreCompleto}">${nombreCompleto} (G${c.grupo})</option>`;
    });
}

// --- 6. RENDERIZADO DE AGENDA Y WHATSAPP ---

function renderAgenda(datos, nombreMes) {
    const displayFecha = document.getElementById('fechaActualDisplay');
    if (displayFecha) displayFecha.innerText = `${nombreMes} ${obtenerAnioTrabajo()}`;
    
    const cuerpo = document.getElementById('tablaCuerpoAgenda');
    if (!cuerpo) return;
    cuerpo.innerHTML = '';
    let ultimoDia = null;

    datos.forEach((f, i) => {
        const tr = document.createElement('tr');
        if (ultimoDia !== null && ultimoDia !== f.diaMes) tr.className = 'day-separator';
        
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
    renderContactos();
}

function renderContactos() {
    const cont = document.getElementById('listaContactos'); 
    if (!cont) return;
    cont.innerHTML = '';
    const mesActivo = document.getElementById('mesAgenda').value;
    const hoy = new Date().getDate();
    if (!agendasMaestras[mesActivo]) return;

    const proximas = agendasMaestras[mesActivo].filter(a => a.diaMes === hoy || a.diaMes === hoy + 1);
    
    proximas.forEach((asig) => {
        const idxReal = agendasMaestras[mesActivo].indexOf(asig);
        const cond = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === asig.conductor.toLowerCase());
        const telf = cond ? cond.telefono.replace(/\s/g, '').replace('+', '') : "58";
        
        const msg = `¡Hola! ¿Cómo estás?. Este mensaje es para notificarte que tienes el privilegio de dirigir el grupo del ${asig.diaSemana.toLowerCase()} ${asig.diaMes} a las ${asig.hora}. Ese día estarán abarcando el territorio ${asig.territorio}. El lugar de encuentro será en ${asig.lugar}. ¿Podrías confirmarme si vas a asistir? Estaré atento a tu respuesta. ¡Muchas gracias!`;
        
        cont.innerHTML += `
            <div class="contact-item">
                <div><strong>${asig.conductor}</strong><br><small>${asig.diaSemana} ${asig.diaMes} - ${asig.hora}</small></div>
                <div class="contact-actions">
                    <span class="check-icon" style="display: ${asig.avisado ? 'inline' : 'none'}; color: var(--google-green); margin-right: 8px;">✓</span>
                    <a href="https://wa.me/${telf}?text=${encodeURIComponent(msg)}" target="_blank" class="btn-whatsapp" onclick="marcarComoAvisado(${idxReal})">WhatsApp</a>
                </div>
            </div>`;
    });
}

function marcarComoAvisado(idx) {
    const mes = document.getElementById('mesAgenda').value;
    if (agendasMaestras[mes] && agendasMaestras[mes][idx]) {
        agendasMaestras[mes][idx].avisado = true;
        renderContactos();
    }
}

