/* ARCHIVO: js/ui.js - PARTE 1: NAVEGACIÓN Y CAPTURA DE DATOS AM/PM */

// --- 1. NAVEGACIÓN DE PESTAÑAS ---
function switchTab(tabId) {
    // Gestionar estado visual de los botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Ocultar contenidos previos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; 
    });

    // Activar pestaña elegida
    const selectedBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.getAttribute('onclick').includes(tabId));
    if (selectedBtn) selectedBtn.classList.add('active');

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        
        // Inyectar estructura si es la primera vez o está vacío
        if (target.innerHTML.trim() === "") {
            inyectarEstructuraTab(tabId);
        }
        
        // Refrescar datos según la sección
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

// --- 2. GESTIÓN DE PERSONAL (CONDUCTORES) ---

function openModalConductor() { 
    const form = document.getElementById('formConductor');
    form.reset(); 
    document.getElementById('editIndexConductor').value = ""; 
    document.getElementById('grupoSugerido').classList.add('hidden'); 
    
    // Limpiar manualmente los checks de AM/PM para nuevo registro
    document.querySelectorAll('#disponibilidadSemanal input[type="checkbox"]').forEach(cb => cb.checked = false);
    openModal('modalConductor'); 
}

function renderListaConductores() {
    const cont = document.getElementById('listaConductores');
    if (!cont) return;
    cont.innerHTML = '';
    
    // Ordenar alfabéticamente para que se vea profesional
    conductores.sort((a,b) => a.nombre.localeCompare(b.nombre));

    conductores.forEach((c, i) => {
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <span style="font-weight:700; color: var(--google-blue);">${c.nombre} ${c.apellido}</span><br>
                    <small style="color: var(--text-sub);">Grupo ${c.grupo || '?'} | ${c.esAnciano ? 'Anciano' : 'Publicador'}</small>
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
    
    // Restaurar los checks AM/PM guardados en la base de datos
    document.querySelectorAll('#disponibilidadSemanal input[type="checkbox"]').forEach(cb => {
        cb.checked = (c.disponibilidadDias || []).includes(cb.value);
    });
    
    document.getElementById('cFechaDisponible').value = c.fechaDisponible || "";
    document.getElementById('cFechaNoDisponible').value = c.fechaNoDisponible || "";
    openModal('modalConductor');
}

function eliminarConductor(i) {
    if(confirm("¿Eliminar este registro de personal?")) {
        conductores.splice(i, 1);
        guardarLocal();
        renderListaConductores();
    }
}
/* ARCHIVO: js/ui.js - PARTE 2: LISTENERS Y GESTIÓN DE TERRITORIOS/GRUPOS */

// --- 3. LISTENERS DE FORMULARIOS (CAPTURA DE DATOS) ---

document.addEventListener('DOMContentLoaded', () => {
    // Listener Único para procesar todos los formularios
    document.body.addEventListener('submit', (e) => {
        
        // A. GUARDAR CONDUCTOR
        if (e.target.id === 'formConductor') {
            e.preventDefault();
            const index = document.getElementById('editIndexConductor').value;
            
            // Captura dinámica de disponibilidad AM/PM
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
                nombre: document.getElementById('cNombre').value.trim(),
                apellido: document.getElementById('cApellido').value.trim(),
                telefono: document.getElementById('cTelefono').value.trim(),
                esAnciano: document.getElementById('cEsAnciano').value === 'si',
                grupo: document.getElementById('cGrupoAsignado').value,
                disponibilidadDias: disponibilidadActualizada, 
                fechaDisponible: document.getElementById('cFechaDisponible').value,
                fechaNoDisponible: document.getElementById('cFechaNoDisponible').value
            };

            if (index === "") conductores.push(c); else conductores[index] = c;
            
            guardarLocal(); 
            renderListaConductores(); 
            actualizarSelectAncianos(); 
            closeModal('modalConductor');
        }

        // B. GUARDAR TERRITORIO
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

        // C. GUARDAR GRUPO
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
        const subInfo = t.subNombre ? `<br><small style="color:var(--google-blue);">↳ Sub: ${t.subNombre}</small>` : '';
        cont.innerHTML += `
            <div class="contact-item">
                <div><strong>${t.numero}. ${t.nombre}</strong>${subInfo}</div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit-outline" onclick="editarTerritorio(${i})">Editar</button>
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

/* ARCHIVO: js/ui.js - PARTE 3: GRUPOS, HISTORIAL Y WHATSAPP (RESTAURADO) */

// --- 5. GESTIÓN DE GRUPOS (8 GRUPOS) ---

function renderListaGrupos() { 
    const cont = document.getElementById('listaGrupos'); 
    if(!cont) return;
    cont.innerHTML = ''; 
    grupos.sort((a,b) => (parseInt(a.numero)||99) - (parseInt(b.numero)||99));
    
    grupos.forEach((g,i) => {
        cont.innerHTML += `
            <div class="contact-item">
                <div><strong>Grupo ${g.numero}</strong><br><small>Responsable: ${g.anciano}</small></div>
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
    conductores.filter(c => c.esAnciano).forEach(c => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`;
        s.innerHTML += `<option value="${nombreCompleto}">${nombreCompleto} (G${c.grupo})</option>`;
    });
}

// --- 6. WHATSAPP Y RECORDATORIOS (Aspecto Mejorado) ---

function renderContactos() {
    const cont = document.getElementById('listaContactos'); 
    if (!cont) return;
    cont.innerHTML = '';
    const mesActivo = document.getElementById('mesAgenda').value;
    const hoy = new Date().getDate();
    if (!agendasMaestras[mesActivo]) {
        cont.innerHTML = '<p style="font-size:0.8rem; color:var(--text-sub);">No hay agenda generada para este mes.</p>';
        return;
    }

    const proximas = agendasMaestras[mesActivo].filter(a => a.diaMes === hoy || a.diaMes === hoy + 1);
    
    proximas.forEach((asig) => {
        const idxReal = agendasMaestras[mesActivo].indexOf(asig);
        const cond = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === asig.conductor.toLowerCase());
        const telf = cond ? cond.telefono.replace(/\s/g, '').replace('+', '') : "58";
        
        const msg = `¡Hola! ¿Cómo estás?. Este mensaje es para notificarte que tienes el privilegio de dirigir el grupo del ${asig.diaSemana.toLowerCase()} ${asig.diaMes} a las ${asig.hora}. Ese día estarán abarcando el territorio ${asig.territorio}. El lugar de encuentro será en ${asig.lugar}. ¿Podrías confirmarme si vas a asistir? Estaré atento a tu respuesta. ¡Muchas gracias!`;
        
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <span style="font-weight:700;">${asig.conductor}</span><br>
                    <small>${asig.diaSemana} ${asig.diaMes} - ${asig.hora}</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="check-icon" style="display: ${asig.avisado ? 'inline' : 'none'}; color: var(--google-green); font-weight: bold;">✓</span>
                    <a href="https://wa.me/${telf}?text=${encodeURIComponent(msg)}" target="_blank" class="btn-whatsapp" style="background:#25D366; color:white; padding:8px 12px; border-radius:12px; text-decoration:none; font-size:0.75rem;" onclick="marcarComoAvisado(${idxReal})">WhatsApp</a>
                </div>
            </div>`;
    });
}

// --- 7. HISTORIAL Y EXPORTACIÓN ---

function renderHistorial() {
    const cont = document.getElementById('listaHistorial'); 
    if(!cont) return;
    cont.innerHTML = '';
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    Object.keys(historialAgendas).sort((a,b) => a-b).forEach(m => {
        cont.innerHTML += `
            <div class="contact-item">
                <span>Agenda de <strong>${meses[m-1]}</strong></span> 
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit-outline" onclick="cargarDeHistorial(${m})">Cargar</button>
                    <button class="btn-danger-outline" onclick="borrarDeHistorial(${m})">Borrar</button>
                </div>
            </div>`;
    });
}

async function descargarImagen() {
    const area = document.getElementById('areaExportar'); 
    const rango = document.getElementById('rangoExportar').value;
    const filas = Array.from(document.querySelectorAll('#tablaCuerpoAgenda tr'));

    // Filtrar visualmente para la foto
    filas.forEach(tr => {
        let diaCelda = tr.cells[1].innerText;
        if (!diaCelda) { 
            let prev = tr.previousElementSibling; 
            while (prev && !diaCelda) { diaCelda = prev.cells[1].innerText; prev = prev.previousElementSibling; } 
        }
        const dia = parseInt(diaCelda); 
        let visible = true;
        if (rango === 'sem1' && (dia < 1 || dia > 7)) visible = false; 
        else if (rango === 'sem2' && (dia < 8 || dia > 14)) visible = false; 
        else if (rango === 'sem3' && (dia < 15 || dia > 21)) visible = false; 
        else if (rango === 'sem4' && dia < 22) visible = false;
        tr.style.display = visible ? '' : 'none';
    });

    try {
        const canvas = await html2canvas(area, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
        const link = document.createElement('a'); 
        link.download = `Agenda_VistaAlMar_${rango}.png`; 
        link.href = canvas.toDataURL("image/png"); 
        link.click();
    } catch (e) { console.error("Error capturando imagen", e); } 
    finally { filas.forEach(f => f.style.display = ''); }
}



