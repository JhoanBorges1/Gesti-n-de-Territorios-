/* ARCHIVO: js/ui.js - PARTE 1: Navegación y Gestión de Conductores */

// --- 1. NAVEGACIÓN Y VISIBILIDAD DE PESTAÑAS ---

function switchTab(tabId) {
    // 1. Limpiamos estados activos de los botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Escondemos TODAS las pestañas y limpiamos su contenido para evitar duplicados
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
        
        // Inyectamos la estructura si está vacía
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

// --- 2. RENDERIZADO GENERAL ---

function renderAll() {
    renderListaConductores();
    renderListaTerritorios();
    renderListaGrupos();
    renderHistorial();
    cargarAgendaDelMes();
    
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda';
    switchTab(lastTab);
}

// --- 3. GESTIÓN DE CONDUCTORES (CRUD) ---

function openModalConductor() { 
    document.getElementById('formConductor').reset(); 
    document.getElementById('editIndexConductor').value = ""; 
    document.getElementById('grupoSugerido').classList.add('hidden'); 
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
                    <small>G${c.grupo} ${c.esAnciano ? '(Anciano)' : ''}</small>
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
    
    document.querySelectorAll('#cDias input').forEach(cb => cb.checked = c.disponibilidadDias?.includes(cb.value));
    document.querySelectorAll('#cHoras input').forEach(cb => cb.checked = c.disponibilidadHoras?.includes(cb.value));
    
    document.getElementById('cFechaDisponible').value = c.fechaDisponible || "";
    document.getElementById('cFechaNoDisponible').value = c.fechaNoDisponible || "";
    openModal('modalConductor');
}

function eliminarConductor(i) {
    if(confirm("¿Eliminar este conductor?")) {
        conductores.splice(i, 1);
        guardarLocal();
        renderListaConductores();
        actualizarSelectAncianos();
    }
}

// Validación de datos (Traída del código original)
function validarDatosConductor(c) {
    if (!c.nombre || c.nombre.trim().length < 2) {
        alert("El nombre es obligatorio.");
        return false;
    }
    if (!c.telefono || c.telefono.length < 8) {
        alert("Por favor, ingresa un número de teléfono válido.");
        return false;
    }
    return true;
}

// --- 4. GESTIÓN DE TERRITORIOS (CRUD) ---

function openModalTerritorio() { 
    document.getElementById('formTerritorio').reset(); 
    document.getElementById('editIndexTerritorio').value = ""; 
    openModal('modalTerritorio'); 
}

function renderListaTerritorios() {
    const cont = document.getElementById('listaTerritorios');
    if (!cont) return;
    cont.innerHTML = '';
    territorios.sort((a,b) => (parseInt(a.numero)||999) - (parseInt(b.numero)||999));

    territorios.forEach((t, i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div>
                    <strong>${t.numero}. ${t.nombre}</strong>
                    ${t.subNombre ? '<br><small>Sub: '+t.subNombre+'</small>' : ''}
                </div>
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
    
    document.querySelectorAll('#tDias input').forEach(cb => cb.checked = t.disponibilidadDias?.includes(cb.value));
    document.querySelectorAll('#tHoras input').forEach(cb => cb.checked = t.disponibilidadHoras?.includes(cb.value));
    document.querySelectorAll('#tsDias input').forEach(cb => cb.checked = t.subDias?.includes(cb.value));
    document.querySelectorAll('#tsHoras input').forEach(cb => cb.checked = t.subHoras?.includes(cb.value));
    openModal('modalTerritorio');
}

function eliminarTerritorio(i) {
    if(confirm("¿Eliminar este territorio?")) {
        territorios.splice(i, 1);
        guardarLocal();
        renderListaTerritorios();
    }
}

// --- 5. GESTIÓN DE GRUPOS (CRUD) ---

function openModalGrupo() { 
    document.getElementById('formGrupo').reset(); 
    document.getElementById('editIndexGrupo').value = ""; 
    actualizarSelectAncianos(); 
    openModal('modalGrupo'); 
}

function renderListaGrupos() { 
    const cont = document.getElementById('listaGrupos'); 
    if (!cont) return;
    cont.innerHTML = ''; 
    grupos.sort((a,b) => (parseInt(a.numero)||99) - (parseInt(b.numero)||99));
    grupos.forEach((g,i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div>Grupo ${g.numero} - ${g.anciano}</div>
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
    if(confirm("¿Eliminar?")) { grupos.splice(i,1); guardarLocal(); renderListaGrupos(); } 
}

function actualizarSelectAncianos() {
    const s = document.getElementById('gAnciano'); 
    if (!s) return;
    s.innerHTML = '';
    conductores.filter(c => c.esAnciano).forEach(c => {
        s.innerHTML += `<option value="${c.nombre} ${c.apellido}">${c.nombre} ${c.apellido} (G${c.grupo})</option>`;
    });
}

// --- 6. MOTOR DE FORMULARIOS (LISTENERS) ---

document.addEventListener('DOMContentLoaded', () => {
    // Listener Conductor
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'formConductor') {
            e.preventDefault();
            const index = document.getElementById('editIndexConductor').value;
            const c = {
                nombre: document.getElementById('cNombre').value,
                apellido: document.getElementById('cApellido').value,
                telefono: document.getElementById('cTelefono').value,
                esAnciano: document.getElementById('cEsAnciano').value === 'si',
                grupo: document.getElementById('cGrupoAsignado').value,
                disponibilidadDias: Array.from(document.querySelectorAll('#cDias input:checked')).map(cb => cb.value),
                disponibilidadHoras: Array.from(document.querySelectorAll('#cHoras input:checked')).map(cb => cb.value),
                fechaDisponible: document.getElementById('cFechaDisponible').value,
                fechaNoDisponible: document.getElementById('cFechaNoDisponible').value
            };
            if (!validarDatosConductor(c)) return;
            if (index === "") conductores.push(c); else conductores[index] = c;
            guardarLocal(); renderListaConductores(); actualizarSelectAncianos(); closeModal('modalConductor');
        }

        // Listener Territorio
        if (e.target.id === 'formTerritorio') {
            e.preventDefault();
            const index = document.getElementById('editIndexTerritorio').value;
            const t = { 
                numero: document.getElementById('tNumero').value, 
                nombre: document.getElementById('tNombre').value, 
                lugar: document.getElementById('tLugar').value,
                disponibilidadDias: Array.from(document.querySelectorAll('#tDias input:checked')).map(cb => cb.value),
                disponibilidadHoras: Array.from(document.querySelectorAll('#tHoras input:checked')).map(cb => cb.value),
                subNombre: document.getElementById('tsNombre').value,
                subDias: Array.from(document.querySelectorAll('#tsDias input:checked')).map(cb => cb.value),
                subHoras: Array.from(document.querySelectorAll('#tsHoras input:checked')).map(cb => cb.value)
            };
            if(index === "") territorios.push(t); else territorios[index] = t;
            guardarLocal(); renderListaTerritorios(); closeModal('modalTerritorio');
        }

        // Listener Grupo
        if (e.target.id === 'formGrupo') {
            e.preventDefault();
            const index = document.getElementById('editIndexGrupo').value;
            const g = { 
                numero: document.getElementById('gNumero').value, 
                anciano: document.getElementById('gAnciano').value 
            };
            if(index === "") grupos.push(g); else grupos[index] = g;
            guardarLocal(); renderListaGrupos(); closeModal('modalGrupo');
        }
    });
});
// --- 7. RENDERIZADO DE LA TABLA (CON NEGRITAS) ---

function renderAgenda(datos, nombreMes) {
    const cuerpo = document.getElementById('tablaCuerpoAgenda');
    const displayFecha = document.getElementById('fechaActualDisplay');
    
    if (!cuerpo || !displayFecha) return;
    
    displayFecha.innerText = `${nombreMes} ${obtenerAnioTrabajo()}`;
    cuerpo.innerHTML = '';
    let ultimoDia = null;

    datos.forEach((f, i) => {
        const tr = document.createElement('tr');
        
        // Separador visual azul cuando cambia el día
        if (ultimoDia !== null && ultimoDia !== f.diaMes) {
            tr.className = 'day-separator';
        }
        
        // La clase 'bold-cell' asegura que Día y Fecha resalten
        tr.innerHTML = `
            <td class="bold-cell">${ultimoDia !== f.diaMes ? f.diaSemana : ''}</td>
            <td class="bold-cell">${ultimoDia !== f.diaMes ? f.diaMes : ''}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'hora', this.innerText)">${f.hora}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'conductor', this.innerText)">${f.conductor}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'territorio', this.innerText)">${f.territorio}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'lugar', this.innerText)">${f.lugar}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'grupos', this.innerText)">${f.grupos}</td>
        `;
        
        cuerpo.appendChild(tr);
        ultimoDia = f.diaMes;
    });
    
    renderContactos();
}

// --- 8. NOTIFICACIONES WHATSAPP ---

function renderContactos() {
    const cont = document.getElementById('listaContactos');
    if (!cont) return;
    
    cont.innerHTML = '';
    const mesActivo = document.getElementById('mesAgenda').value;
    const hoy = new Date().getDate();
    
    if (!agendasMaestras[mesActivo]) return;

    // Filtramos asignaciones de hoy y mañana
    const proximos = agendasMaestras[mesActivo].filter(a => a.diaMes === hoy || a.diaMes === hoy + 1);
    
    proximos.forEach((asig) => {
        const idxReal = agendasMaestras[mesActivo].indexOf(asig);
        const cond = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === asig.conductor.toLowerCase());
        const telf = cond ? cond.telefono.replace(/\s/g, '').replace('+', '') : "58";
        
        const msg = `¡Hola! ¿Cómo estás?. Este mensaje es para notificarte que tienes el privilegio de dirigir el grupo del ${asig.diaSemana.toLowerCase()} ${asig.diaMes} a las ${asig.hora}. Ese día estarán abarcando el territorio ${asig.territorio}. El lugar de encuentro será en ${asig.lugar}. ¿Podrías confirmarme si vas a asistir? Estaré atento a tu respuesta. ¡Muchas gracias!`;
        
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <strong>${asig.conductor}</strong><br>
                    <small>${asig.diaMes} - ${asig.hora}</small>
                </div>
                <div class="contact-actions">
                    <span class="check-icon" style="display: ${asig.avisado ? 'inline' : 'none'}; color: var(--google-green); font-weight: bold; margin-right: 8px;">✓ Enviado</span>
                    <a href="https://wa.me/${telf}?text=${encodeURIComponent(msg)}" 
                       target="_blank" class="btn-whatsapp" 
                       onclick="marcarComoAvisado(${idxReal})">WhatsApp</a>
                </div>
            </div>`;
    });
}

function marcarComoAvisado(idx) {
    const mes = document.getElementById('mesAgenda').value;
    if (agendasMaestras[mes] && agendasMaestras[mes][idx]) {
        agendasMaestras[mes][idx].avisado = true;
        guardarLocal();
        renderContactos();
    }
}

// --- 9. EXPORTACIÓN A IMAGEN HD ---

async function descargarImagen() {
    const area = document.getElementById('areaExportar'); 
    const rango = document.getElementById('rangoExportar').value;
    const filas = Array.from(document.querySelectorAll('#tablaCuerpoAgenda tr'));

    // Filtrado por semanas
    filas.forEach(tr => {
        let diaCelda = tr.cells[1].innerText;
        if (!diaCelda) { 
            let prev = tr.previousElementSibling; 
            while (prev && !diaCelda) { 
                diaCelda = prev.cells[1].innerText; 
                prev = prev.previousElementSibling; 
            } 
        }
        const dia = parseInt(diaCelda); 
        let visible = true;
        if (rango === 'sem1' && (dia < 1 || dia > 7)) visible = false; 
        else if (rango === 'sem2' && (dia < 8 || dia > 14)) visible = false; 
        else if (rango === 'sem3' && (dia < 15 || dia > 21)) visible = false; 
        else if (rango === 'sem4' && dia < 22) visible = false;
        
        tr.style.display = visible ? '' : 'none';
    });

    const opciones = {
        scale: 3, // Alta nitidez
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
            const areaClonada = clonedDoc.getElementById('areaExportar');
            if(areaClonada) areaClonada.style.padding = '40px';
        }
    };

    try {
        const canvas = await html2canvas(area, opciones);
        const link = document.createElement('a'); 
        link.download = `Agenda_VistaAlMar_${rango}.png`; 
        link.href = canvas.toDataURL("image/png"); 
        link.click();
    } catch (error) {
        console.error("Error imagen:", error);
    } finally {
        filas.forEach(f => f.style.display = '');
    }
}

// --- 10. HISTORIAL VISUAL ---

function renderHistorial() {
    const cont = document.getElementById('listaHistorial');
    if (!cont) return;
    cont.innerHTML = '';
    const mesesNombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    Object.keys(historialAgendas).forEach(m => {
        cont.innerHTML += `
            <div class="group-card">
                <span>Agenda de ${mesesNombres[m-1]} 2026</span>
                <div>
                    <button class="btn-edit-outline" onclick="cargarDeHistorial(${m})">Cargar</button>
                    <button class="btn-danger-outline" onclick="borrarDeHistorial(${m})">Borrar</button>
                </div>
            </div>`;
    });
}

function cargarDeHistorial(m) {
    agendasMaestras[m] = JSON.parse(JSON.stringify(historialAgendas[m]));
    document.getElementById('mesAgenda').value = m;
    const nombreMes = document.getElementById('mesAgenda').options[m-1].text;
    renderAgenda(agendasMaestras[m], nombreMes);
    document.getElementById('resultadoAgenda').classList.remove('hidden');
    closeModal('modalHistorial');
}

function borrarDeHistorial(m) {
    if(confirm("¿Borrar historial de este mes?")) {
        delete historialAgendas[m];
        guardarLocal();
        renderHistorial();
    }
}

