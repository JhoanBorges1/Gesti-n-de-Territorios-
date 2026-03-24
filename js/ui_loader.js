/* ARCHIVO: js/ui_loader.js - GESTIÓN DINÁMICA DE INTERFAZ VISTA AL MAR */

function inyectarEstructuraTab(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    // Limpieza previa para evitar duplicidad de elementos
    tab.innerHTML = '';

    switch (tabId) {
        case 'tab-agenda':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Generación de Agenda Mensual</div>
                    <div class="input-group">
                        <label style="font-weight:700;">Seleccionar mes de servicio (2026)</label>
                        <select id="mesAgenda" onchange="cargarAgendaDelMes()">
                            <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
                            <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
                            <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
                            <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px;">
                        <button class="btn-primary" onclick="generarNuevaAgenda()">Generar Todo el Mes</button>
                        <button class="btn-outline" onclick="openModal('modalHistorial')">Historial Guardado</button>
                        <button id="btn-sync-save" class="btn-primary" onclick="guardarSincronizar()" style="background: var(--google-green);">Sincronizar Nube</button>
                    </div>
                    
                    <div id="resultadoAgenda" class="hidden" style="margin-top: 32px;">
                        <div class="table-responsive">
                            <div id="areaExportar">
                                <div class="export-header">
                                    <h2 id="tituloExportar">Agenda de Predicación</h2>
                                    <p id="fechaActualDisplay" style="font-weight:500;"></p>
                                </div>
                                <table class="agenda-table">
                                    <thead>
                                        <tr>
                                            <th>Día</th><th>Fecha</th><th>Hora</th>
                                            <th>Conductor</th><th>Territorio</th><th>Lugar</th><th>Grupos</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tablaCuerpoAgenda"></tbody>
                                </table>
                            </div>
                        </div>
                        <div style="margin-top: 24px; display: flex; gap: 15px; align-items: center; border-top: 1px solid #eee; padding-top: 24px; flex-wrap: wrap;">
                            <div class="input-group" style="margin-bottom:0; width: 190px;">
                                <label style="font-weight:700;">Rango de Imagen</label>
                                <select id="rangoExportar">
                                    <option value="mes">Mes Completo</option>
                                    <option value="sem1">Semana 1 (1-7)</option>
                                    <option value="sem2">Semana 2 (8-14)</option>
                                    <option value="sem3">Semana 3 (15-21)</option>
                                    <option value="sem4">Semana 4 (22-Fin)</option>
                                </select>
                            </div>
                            <button class="btn-primary" onclick="guardarEnHistorial()">Oficializar Agenda</button>
                            <button class="btn-outline" onclick="descargarImagen()">Descargar PNG</button>
                        </div>
                    </div>
                </section>

                <section class="module-section">
                    <div class="module-title">Contactar por WhatsApp</div>
                    <p style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 16px;">Próximas asignaciones para hoy y mañana:</p>
                    <div id="listaContactos">
                        <!-- Aquí se inyectan las tarjetas contact-item -->
                    </div>
                </section>`;
            break;

        case 'tab-personal':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Gestión de Personal</div>
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <button class="btn-primary" onclick="openModalConductor()">Agregar Conductor</button>
                        <button class="btn-outline" onclick="toggleVisibility('listaConductores')">Ver Lista y Editar</button>
                    </div>
                    <div id="listaConductores" class="hidden"></div>
                </section>`;
            break;

        case 'tab-territorios':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Gestión de Territorios</div>
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <button class="btn-primary" onclick="openModalTerritorio()">Agregar Territorio</button>
                        <button class="btn-outline" onclick="toggleVisibility('listaTerritorios')">Ver Lista y Editar</button>
                    </div>
                    <div id="listaTerritorios" class="hidden"></div>
                </section>`;
            break;

        case 'tab-config':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Supervisión de Grupos</div>
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <button class="btn-primary" onclick="openModalGrupo()">Asignar Anciano</button>
                        <button class="btn-outline" onclick="toggleVisibility('listaGrupos')">Ver Grupos (1-8)</button>
                    </div>
                    <div id="listaGrupos" class="hidden"></div>
                </section>`;
            break;
    }
}

function toggleVisibility(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden');
}

