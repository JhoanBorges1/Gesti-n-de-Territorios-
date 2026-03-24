/* ARCHIVO: js/ui_loader.js */

// Esta función rellena los contenedores vacíos del index.html
function inyectarEstructuraTab(tabId) {
    const tab = document.getElementById(tabId)
    if (!tab) return

    switch (tabId) {
        case 'tab-agenda':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Generación de Territorios</div>
                    <div class="input-group">
                        <label>Mes de Trabajo (2026)</label>
                        <select id="mesAgenda" onchange="cargarAgendaDelMes()">
                            <option value="1">Enero</option><option value="2">Febrero</option>
                            <option value="3">Marzo</option><option value="4">Abril</option>
                            <option value="5">Mayo</option><option value="6">Junio</option>
                            <option value="7">Julio</option><option value="8">Agosto</option>
                            <option value="9">Septiembre</option><option value="10">Octubre</option>
                            <option value="11">Noviembre</option><option value="12">Diciembre</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top:15px;">
                        <button class="btn-primary" onclick="generarNuevaAgenda()">Generar Mes</button>
                        <button class="btn-outline" onclick="openModal('modalHistorial')">Historial</button>
                        <button id="btn-sync-save" class="btn-primary" onclick="guardarSincronizar()" style="background: var(--google-green);">Sincronizar Nube</button>
                    </div>

                    <div id="resultadoAgenda" class="hidden" style="margin-top: 24px;">
                        <div class="table-responsive">
                            <div id="areaExportar">
                                <div class="export-header" style="text-align:center; border-bottom: 2px solid var(--google-blue); margin-bottom:15px;">
                                    <h2 id="tituloExportar" style="color:var(--google-blue);">Agenda de Predicación</h2>
                                    <p id="fechaActualDisplay"></p>
                                </div>
                                <table class="agenda-table">
                                    <thead>
                                        <tr><th>Día</th><th>Fecha</th><th>Hora</th><th>Conductor</th><th>Territorio</th><th>Lugar</th><th>Grupos</th></tr>
                                    </thead>
                                    <tbody id="tablaCuerpoAgenda"></tbody>
                                </table>
                            </div>
                        </div>
                        <div style="margin-top: 20px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <select id="rangoExportar" style="width:auto;">
                                <option value="mes">Mes Completo</option>
                                <option value="sem1">Semana 1</option><option value="sem2">Semana 2</option>
                                <option value="sem3">Semana 3</option><option value="sem4">Semana 4</option>
                            </select>
                            <button class="btn-primary" onclick="guardarEnHistorial()">Guardar Historial</button>
                            <button class="btn-outline" onclick="descargarImagen()">Descargar Imagen</button>
                        </div>
                    </div>
                </section>
                <section class="module-section">
                    <div class="module-title">Notificaciones Pendientes</div>
                    <div id="listaContactos"></div>
                </section>`
            break

        case 'tab-personal':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Conductores</div>
                    <button class="btn-primary" onclick="openModalConductor()">+ Agregar Conductor</button>
                    <div id="listaConductores" style="margin-top:20px;"></div>
                </section>`
            break

        case 'tab-territorios':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Territorios</div>
                    <button class="btn-primary" onclick="openModalTerritorio()">+ Nuevo Territorio</button>
                    <div id="listaTerritorios" style="margin-top:20px;"></div>
                </section>`
            break
            
        case 'tab-config':
            tab.innerHTML = `
                <section class="module-section">
                    <div class="module-title">Grupos de Predicación</div>
                    <button class="btn-primary" onclick="openModalGrupo()">+ Registrar Grupo</button>
                    <div id="listaGrupos" style="margin-top:20px;"></div>
                </section>`
            break
    }
}
