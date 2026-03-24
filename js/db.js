// Variables Globales de Datos
let conductores = [], territorios = [], grupos = [], agendasMaestras = {}, historialAgendas = {};

function guardarLocal() { 
    const payload = { conductores, territorios, grupos, registros: agendasMaestras, historial: historialAgendas };
    localStorage.setItem('vdm_data', JSON.stringify(payload)); 
}

function cargarLocal() {
    const local = JSON.parse(localStorage.getItem('vdm_data') || '{}');
    conductores = local.conductores || [];
    territorios = local.territorios || [];
    grupos = local.grupos || [];
    agendasMaestras = local.registros || {};
    historialAgendas = local.historial || {};
}
