/* ARCHIVO: js/ui.js - PARTE 1: Navegación y Gestión de Modales */

// --- 1. NAVEGACIÓN POR PESTAÑAS (TABS) ---

function switchTab(tabId) {
    // Quitamos la clase 'active' de todos los botones y contenidos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'))

    // Activamos el botón clickeado
    const selectedBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.getAttribute('onclick').includes(tabId))
    
    if (selectedBtn) selectedBtn.classList.add('active')

    // Mostramos el contenido correspondiente
    const targetContent = document.getElementById(tabId)
    if (targetContent) {
        targetContent.classList.add('active')
        // Si el tab está vacío, intentamos inyectar su estructura base
        if (targetContent.innerHTML.trim() === "") {
            inyectarEstructuraTab(tabId)
        }
    }

    // Guardamos la última pestaña visitada
    localStorage.setItem('vdm_active_tab', tabId)
}

// --- 2. GESTIÓN DE MODALES ---

function openModal(id) {
    const modal = document.getElementById(id)
    if (modal) modal.style.display = 'flex'
}

function closeModal(id) {
    const modal = document.getElementById(id)
    if (modal) modal.style.display = 'none'
}

// --- 3. RENDERIZADO DE COMPONENTES ---

// Esta es la función maestra que llamamos desde app.js al iniciar
function renderAll() {
    renderListaConductores()
    renderListaTerritorios()
    renderListaGrupos()
    renderHistorial()
    cargarAgendaDelMes() // Esta viene de app.js
    
    // Restaurar el tab donde se quedó el usuario
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda'
    switchTab(lastTab)
}

function renderListaConductores() {
    const cont = document.getElementById('listaConductores')
    if (!cont) return // Seguridad por si el elemento no existe aún
    
    cont.innerHTML = ''
    // Ordenamos alfabéticamente para que Jhoan encuentre todo rápido
    conductores.sort((a,b) => a.nombre.localeCompare(b.nombre))

    conductores.forEach((c, i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div>
                    <strong>${c.nombre} ${c.apellido}</strong><br>
                    <small>Grupo ${c.grupo} ${c.esAnciano ? '(Anciano)' : ''}</small>
                </div>
                <div>
                    <button class="btn-edit-outline" onclick="editarConductor(${i})">Editar</button>
                    <button class="btn-danger-outline" onclick="eliminarConductor(${i})">X</button>
                </div>
            </div>`
    })
}

// Esta función prepara el modal para editar a alguien existente
function editarConductor(i) {
    const c = conductores[i]
    document.getElementById('editIndexConductor').value = i
    
    // Llenamos los campos del modal con los datos actuales
    document.getElementById('cNombre').value = c.nombre
    document.getElementById('cApellido').value = c.apellido
    document.getElementById('cTelefono').value = c.telefono
    document.getElementById('cEsAnciano').value = c.esAnciano ? 'si' : 'no'
    document.getElementById('cGrupoAsignado').value = c.grupo || "1"
    
    // Mostramos u ocultamos el selector de grupo si es anciano
    document.getElementById('grupoSugerido').classList.toggle('hidden', !c.esAnciano)
    
    // Marcamos los checkboxes de días y horas (esto requiere un bucle)
    document.querySelectorAll('#cDias input').forEach(cb => cb.checked = c.disponibilidadDias?.includes(cb.value))
    document.querySelectorAll('#cHoras input').forEach(cb => cb.checked = c.disponibilidadHoras?.includes(cb.value))
    
    document.getElementById('cFechaDisponible').value = c.fechaDisponible || ""
    document.getElementById('cFechaNoDisponible').value = c.fechaNoDisponible || ""
    
    openModal('modalConductor')
}

/* ARCHIVO: js/ui.js - PARTE 2: Render de Territorios, Grupos y Sugerencias */

// --- 4. RENDERIZADO DE TERRITORIOS ---

function renderListaTerritorios() {
    const cont = document.getElementById('listaTerritorios')
    if (!cont) return
    
    cont.innerHTML = ''
    // Ya vienen ordenados por número desde app.js
    territorios.forEach((t, i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div>
                    <strong>${t.numero}. ${t.nombre}</strong><br>
                    <small>${t.subNombre ? t.subNombre + ' | ' : ''}${t.lugar}</small>
                </div>
                <div>
                    <button class="btn-edit-outline" onclick="editarTerritorio(${i})">Editar</button>
                    <button class="btn-danger-outline" onclick="eliminarTerritorio(${i})">X</button>
                </div>
            </div>`
    })
}

function editarTerritorio(i) {
    const t = territorios[i]
    document.getElementById('editIndexTerritorio').value = i
    
    document.getElementById('tNumero').value = t.numero
    document.getElementById('tNombre').value = t.nombre
    document.getElementById('tSubNombre').value = t.subNombre || ""
    document.getElementById('tLugar').value = t.lugar
    
    // Marcamos disponibilidad de días y horas del territorio
    document.querySelectorAll('#tDias input').forEach(cb => cb.checked = t.disponibilidadDias?.includes(cb.value))
    document.querySelectorAll('#tHoras input').forEach(cb => cb.checked = t.disponibilidadHoras?.includes(cb.value))
    
    openModal('modalTerritorio')
}

// --- 5. RENDERIZADO DE GRUPOS ---

function renderListaGrupos() {
    const cont = document.getElementById('listaGrupos')
    if (!cont) return
    
    cont.innerHTML = ''
    grupos.forEach((g, i) => {
        cont.innerHTML += `
            <div class="group-card">
                <div>
                    <strong>Grupo ${g.numero}</strong><br>
                    <small>Encargado: ${g.encargado || 'Sin asignar'}</small>
                </div>
                <div>
                    <button class="btn-edit-outline" onclick="editarGrupo(${i})">Editar</button>
                    <button class="btn-danger-outline" onclick="eliminarGrupo(${i})">X</button>
                </div>
            </div>`
    })
}

function editarGrupo(i) {
    const g = grupos[i]
    document.getElementById('editIndexGrupo').value = i
    document.getElementById('gNumero').value = g.numero
    document.getElementById('gEncargado').value = g.encargado || ""
    openModal('modalGrupo')
}

// --- 6. AYUDANTES DE INTERFAZ (DATALISTS) ---

// Esta función es vital: actualiza las sugerencias que aparecen cuando escribes
function actualizarDatalists() {
    const dlConductores = document.getElementById('dl-conductores')
    const dlTerritorios = document.getElementById('dl-territorios')
    
    if (dlConductores) {
        dlConductores.innerHTML = conductores
            .map(c => `<option value="${c.nombre} ${c.apellido}">`)
            .join('')
    }
    
    if (dlTerritorios) {
        dlTerritorios.innerHTML = territorios
            .map(t => `<option value="${t.numero}. ${t.nombre}">`)
            .join('')
    }
}

// Muestra u oculta el campo de grupo si el conductor es anciano
function toggleGrupoAnciano() {
    const esAnciano = document.getElementById('cEsAnciano').value === 'si'
    document.getElementById('grupoSugerido').classList.toggle('hidden', !esAnciano)
}


/* ARCHIVO: js/ui.js - PARTE 3: Render de Agenda y Contactos WhatsApp */

// --- 7. RENDERIZADO DE LA TABLA DE AGENDA ---

function renderAgenda(datos, nombreMes) {
    const cuerpo = document.getElementById('tablaCuerpoAgenda')
    const displayFecha = document.getElementById('fechaActualDisplay')
    
    if (!cuerpo || !displayFecha) return
    
    displayFecha.innerText = `${nombreMes} ${obtenerAnioTrabajo()}`
    cuerpo.innerHTML = ''
    let ultimoDia = null

    datos.forEach((f, i) => {
        const tr = document.createElement('tr')
        
        // Si el día cambia, añadimos una línea gruesa azul para separar visualmente
        if (ultimoDia !== null && ultimoDia !== f.diaMes) {
            tr.className = 'day-separator'
        }
        
        tr.innerHTML = `
            <td class="bold-cell">${ultimoDia !== f.diaMes ? f.diaSemana : ''}</td>
            <td class="bold-cell">${ultimoDia !== f.diaMes ? f.diaMes : ''}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'hora', this.innerText)">${f.hora}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'conductor', this.innerText)">${f.conductor}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'territorio', this.innerText)">${f.territorio}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'lugar', this.innerText)">${f.lugar}</td>
            <td contenteditable="true" onblur="actualizarCelda(${i}, 'grupos', this.innerText)">${f.grupos}</td>
        `
        
        cuerpo.appendChild(tr)
        ultimoDia = f.diaMes
    })
    
    // Al terminar la tabla, refrescamos los botones de contacto
    renderContactos()
}

// --- 8. LISTA DE CONTACTOS (NOTIFICACIONES WHATSAPP) ---

function renderContactos() {
    const cont = document.getElementById('listaContactos')
    if (!cont) return
    
    cont.innerHTML = ''
    const mesActivo = document.getElementById('mesAgenda').value
    const hoy = new Date().getDate()
    
    if (!agendasMaestras[mesActivo]) return

    // Filtramos asignaciones de hoy y mañana para que Jhoan sepa a quién avisar
    const proximos = agendasMaestras[mesActivo].filter(a => a.diaMes === hoy || a.diaMes === hoy + 1)
    
    proximos.forEach((asig) => {
        const idxReal = agendasMaestras[mesActivo].indexOf(asig)
        
        // Buscamos el teléfono del conductor en nuestra base de datos
        const cond = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === asig.conductor.toLowerCase())
        const telf = cond ? cond.telefono.replace(/\s/g, '').replace('+', '') : "58"
        
        // El mensaje personalizado y elegante que verán los hermanos
        const msg = `¡Hola! ¿Cómo estás? Este mensaje es para notificarte que tienes el privilegio de dirigir el grupo del ${asig.diaSemana.toLowerCase()} ${asig.diaMes} a las ${asig.hora}. Estarán abarcando el territorio ${asig.territorio}. El lugar de encuentro será en ${asig.lugar}. ¿Podrías confirmarme si vas a asistir? Estaré atento a tu respuesta. ¡Muchas gracias!`
        
        cont.innerHTML += `
            <div class="contact-item">
                <div>
                    <strong>${asig.conductor}</strong><br>
                    <small>${asig.diaMes} - ${asig.hora}</small>
                </div>
                <div class="contact-actions">
                    <span class="check-icon" style="display: ${asig.avisado ? 'inline' : 'none'}; color: var(--google-green); margin-right: 8px;">✓ Enviado</span>
                    <a href="https://wa.me/${telf}?text=${encodeURIComponent(msg)}" 
                       target="_blank" class="btn-whatsapp" 
                       onclick="marcarComoAvisado(${idxReal})">Enviar WhatsApp</a>
                </div>
            </div>`
    })
}


/* ARCHIVO: js/ui.js - PARTE 4: Exportación de Imagen y Historial Visual */

// --- 9. EXPORTACIÓN A IMAGEN (HTML2CANVAS) ---

async function descargarImagen() {
    const area = document.getElementById('areaExportar'); 
    const rango = document.getElementById('rangoExportar').value;
    const filas = Array.from(document.querySelectorAll('#tablaCuerpoAgenda tr'));

    // 1. Filtrado inteligente por rango (semanas)
    filas.forEach(tr => {
        let diaCelda = tr.cells[1].innerText;
        // Si la celda está vacía (porque es la segunda salida del mismo día), buscamos hacia arriba
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

    // 2. Configuración de renderizado HD
    const opciones = {
        scale: 3, // Calidad Ultra HD
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
            const areaClonada = clonedDoc.getElementById('areaExportar');
            if(areaClonada) {
                areaClonada.style.padding = '40px';
                areaClonada.style.borderRadius = '0px'; // Para que la imagen salga limpia
            }
        }
    };

    try {
        const canvas = await html2canvas(area, opciones);
        const link = document.createElement('a'); 
        link.download = `Agenda_VistaAlMar_${rango}.png`; 
        link.href = canvas.toDataURL("image/png"); 
        link.click();
    } catch (error) {
        console.error("Error al generar imagen:", error);
        alert("Hubo un error al generar la imagen. Inténtalo de nuevo.");
    } finally {
        // Restauramos la vista de todas las filas en la pantalla
        filas.forEach(f => f.style.display = '');
    }
}

// --- 10. GESTIÓN VISUAL DEL HISTORIAL ---

function renderHistorial() {
    const cont = document.getElementById('listaHistorial');
    if (!cont) return;
    
    cont.innerHTML = '';
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    Object.keys(historialAgendas).forEach(m => {
        cont.innerHTML += `
            <div class="group-card">
                <span>Agenda de ${meses[m-1]} 2026</span>
                <div>
                    <button class="btn-edit-outline" onclick="cargarDeHistorial(${m})">Cargar</button>
                    <button class="btn-danger-outline" onclick="borrarDeHistorial(${m})">Borrar</button>
                </div>
            </div>`;
    });
}

function cargarDeHistorial(m) {
    // Clonamos los datos del historial a la agenda maestra activa
    agendasMaestras[m] = JSON.parse(JSON.stringify(historialAgendas[m]));
    document.getElementById('mesAgenda').value = m;
    
    const nombreMes = document.getElementById('mesAgenda').options[m-1].text;
    renderAgenda(agendasMaestras[m], nombreMes);
    
    document.getElementById('resultadoAgenda').classList.remove('hidden');
    closeModal('modalHistorial');
    alert("Agenda recuperada correctamente.");
}

// --- 11. INICIALIZADOR DE EVENTOS (DOM READY) ---

document.addEventListener('DOMContentLoaded', () => {
    // Escuchador para el selector de mes
    const mesAgenda = document.getElementById('mesAgenda');
    if (mesAgenda) {
        mesAgenda.addEventListener('change', cargarAgendaDelMes);
    }
});


/* ÚLTIMO BLOQUE: Control de envíos de formularios */

document.getElementById('formConductor')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = {
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
    if (agregarOEditarConductor(datos)) closeModal('modalConductor');
});

document.getElementById('formTerritorio')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = {
        numero: document.getElementById('tNumero').value,
        nombre: document.getElementById('tNombre').value,
        subNombre: document.getElementById('tSubNombre').value,
        lugar: document.getElementById('tLugar').value,
        disponibilidadDias: Array.from(document.querySelectorAll('#tDias input:checked')).map(cb => cb.value),
        disponibilidadHoras: Array.from(document.querySelectorAll('#tHoras input:checked')).map(cb => cb.value)
    };
    if (agregarOEditarTerritorio(datos)) closeModal('modalTerritorio');
});



















