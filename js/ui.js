/* ARCHIVO: js/ui.js - RESTAURACIÓN DE LÓGICA VISUAL COMPLETA */

// --- 1. NAVEGACIÓN Y VISIBILIDAD ---

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const selectedBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.getAttribute('onclick').includes(tabId));
    
    if (selectedBtn) selectedBtn.classList.add('active');

    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.add('active');
        if (targetContent.innerHTML.trim() === "") {
            inyectarEstructuraTab(tabId);
        }
    }
    localStorage.setItem('vdm_active_tab', tabId);
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- 2. RENDERIZADO DE COMPONENTES (ESTILO ORIGINAL) ---

function renderAll() {
    renderListaConductores();
    renderListaTerritorios();
    renderListaGrupos();
    renderHistorial();
    cargarAgendaDelMes();
    
    const lastTab = localStorage.getItem('vdm_active_tab') || 'tab-agenda';
    switchTab(lastTab);
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

function renderListaGrupos() {
    const cont = document.getElementById('listaGrupos');
    if (!cont) return;
    cont.innerHTML = '';
    grupos.sort((a,b) => (parseInt(a.numero)||99) - (parseInt(b.numero)||99));

    grupos.forEach((g, i) => {
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

// --- 3. EDICIÓN ---

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

// --- 4. FORMULARIOS (SUBMITS) ---

document.getElementById('formConductor')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = document.getElementById('editIndexConductor').value;
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
    if (idx === "") conductores.push(datos); else conductores[idx] = datos;
    guardarLocal(); renderListaConductores(); closeModal('modalConductor');
});

document.getElementById('formTerritorio')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = document.getElementById('editIndexTerritorio').value;
    const datos = {
        numero: document.getElementById('tNumero').value,
        nombre: document.getElementById('tNombre').value,
        lugar: document.getElementById('tLugar').value,
        subNombre: document.getElementById('tsNombre').value,
        disponibilidadDias: Array.from(document.querySelectorAll('#tDias input:checked')).map(cb => cb.value),
        disponibilidadHoras: Array.from(document.querySelectorAll('#tHoras input:checked')).map(cb => cb.value),
        subDias: Array.from(document.querySelectorAll('#tsDias input:checked')).map(cb => cb.value),
        subHoras: Array.from(document.querySelectorAll('#tsHoras input:checked')).map(cb => cb.value)
    };
    if (idx === "") territorios.push(datos); else territorios[idx] = datos;
    guardarLocal(); renderListaTerritorios(); closeModal('modalTerritorio');
});

document.getElementById('formGrupo')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = document.getElementById('editIndexGrupo').value;
    const g = { numero: document.getElementById('gNumero').value, anciano: document.getElementById('gAnciano').value };
    if(idx === "") grupos.push(g); else grupos[idx] = g;
    guardarLocal(); renderListaGrupos(); closeModal('modalGrupo');
});
 
