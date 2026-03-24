/* ARCHIVO: js/ui_loader.js - ESTRUCTURA DINÁMICA DETALLADA VISTA AL MAR */

function inyectarEstructuraTab(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    // Limpiamos siempre antes de inyectar para evitar duplicados
    tab.innerHTML = '';

    switch (tabId) {
        case 'tab-agenda':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Generación de Territorios</div>
                    <div class="btn-vertical-group" style="display: flex; flex-direction: column; gap: 16px;">
                        <div class="input-group" style="margin-bottom: 0;">
                            <label style="font-weight:700;">Seleccionar mes (2026)</label>
                            <select id="mesAgenda" onchange="cargarAgendaDelMes()">
                                <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
                                <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
                                <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
                                <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn-primary" onclick="generarNuevaAgenda()">Generar Todo el Mes</button>
                            <button class="btn-outline" onclick="openModal('modalHistorial')">Historial Guardado</button>
                            <button id="btn-sync-save" class="btn-primary" onclick="guardarSincronizar()" style="background: var(--google-green);">Sincronizar Nube</button>
                        </div>
                    </div>
                    
                    <div id="resultadoAgenda" class="hidden" style="margin-top: 24px;">
                        <div class="table-responsive">
                            <div id="areaExportar">
                                <div class="export-header">
                                    <h2 id="tituloExportar">Agenda de Predicación</h2>
                                    <p id="fechaActualDisplay" style="font-weight:700;"></p>
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
                        <div style="margin-top: 20px; display: flex; gap: 12px; align-items: center; border-top: 1px solid #eee; padding-top: 20px; flex-wrap: wrap;">
                            <div class="input-group" style="margin-bottom:0; width: 180px;">
                                <label style="font-weight:700;">Rango Exportación</label>
                                <select id="rangoExportar">
                                    <option value="mes">Mes Completo</option>
                                    <option value="sem1">Semana 1 (1-7)</option>
                                    <option value="sem2">Semana 2 (8-14)</option>
                                    <option value="sem3">Semana 3 (15-21)</option>
                                    <option value="sem4">Semana 4 (22-Fin)</option>
                                </select>
                            </div>
                            <button class="btn-primary" onclick="guardarEnHistorial()">Guardar Historial</button>
                            <button class="btn-outline" onclick="descargarImagen()">Descargar Imagen</button>
                        </div>
                    </div>
                </section>

                <section class="module-section">
                    <div class="module-title">Contactar</div>
                    <p style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 16px;">Próximas asignaciones (2 días):</p>
                    <div id="listaContactos"></div>
                </section>`;
            break;

        case 'tab-personal':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Conductores</div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="openModalConductor()">Agregar Conductor</button>
                        <button class="btn-outline" onclick="toggleVisibility('listaConductores')">Ver Lista y Editar</button>
                    </div>
                    <div id="listaConductores" class="hidden" style="margin-top:16px;"></div>
                </section>`;
            break;

        case 'tab-territorios':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Territorios y Subterritorios</div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="openModalTerritorio()">Agregar Territorio</button>
                        <button class="btn-outline" onclick="toggleVisibility('listaTerritorios')">Ver Lista y Editar</button>
                    </div>
                    <div id="listaTerritorios" class="hidden" style="margin-top:16px;"></div>
                </section>`;
            break;

        case 'tab-config':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Grupos de Predicación</div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="openModalGrupo()">Agregar Grupo</button>
                        <button class="btn-outline" onclick="toggleVisibility('listaGrupos')">Ver Grupos Registrados</button>
                    </div>
                    <div id="listaGrupos" class="hidden" style="margin-top:16px;"></div>
                </section>`;
            break;
    }
}

function toggleVisibility(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden');
}
