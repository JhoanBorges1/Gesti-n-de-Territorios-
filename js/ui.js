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

