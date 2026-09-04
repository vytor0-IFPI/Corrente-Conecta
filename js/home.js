/* Homepage — alertas recentes, eventos, vagas, mapa, stats */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    if (!document.getElementById('mapHome')) return;
    const [al, ev, va, tur] = await Promise.all([
      window.CC.getJSON('alertas.json', { alertas: [] }),
      window.CC.getJSON('eventos.json', { eventos: [] }),
      window.CC.getJSON('empregos.json', { vagas: [] }),
      window.CC.getJSON('turismo.json', { locais: [], centro_mapa: { latitude: -10.4438, longitude: -45.165, zoom: 13 } })
    ]);
    renderAlertas((al.alertas || []).filter(a => a.status === 'Ativo').slice(0, 3));
    renderEventos((ev.eventos || []).slice().sort((a, b) => a.data.localeCompare(b.data)).slice(0, 3));
    renderVagas((va.vagas || []).slice(0, 3));
    initMap(tur);
  }

  function renderAlertas(arr) {
    const w = document.getElementById('homeAlertas');
    if (!w) return;
    const badge = { 'Alta': 'b-red', 'Média': 'b-amber', 'Baixa': 'b-green' };
    w.innerHTML = arr.length ? arr.map(a =>
      '<div class="col-md-4"><article class="cc-card prio-' + window.CC.esc(a.prioridade) + '"><div class="body">' +
      '<div class="d-flex gap-2 flex-wrap"><span class="cc-badge b-dark">' + window.CC.esc(a.tipo) + '</span>' +
      '<span class="cc-badge ' + (badge[a.prioridade] || 'b-gray') + '">' + window.CC.esc(a.prioridade) + '</span></div>' +
      '<h3 class="h6 fw-bold mb-0 clamp2">' + window.CC.esc(a.titulo) + '</h3>' +
      '<p class="small text-muted clamp2">' + window.CC.esc(a.descricao) + '</p>' +
      '<small class="text-muted"><i class="bi bi-clock"></i> ' + window.CC.fmtDateTime(a.data) + ' • Exemplo</small>' +
      '</div></article></div>'
    ).join('') : '<div class="col-12"><div class="empty">Nenhum alerta ativo.</div></div>';
  }

  function renderEventos(arr) {
    const w = document.getElementById('homeEventos');
    if (!w) return;
    w.innerHTML = arr.map(e =>
      '<div class="col-md-4"><article class="cc-card">' +
      (e.imagem ? '<img class="cover" loading="lazy" src="' + window.CC.esc(e.imagem) + '" alt="Imagem de ' + window.CC.esc(e.nome) + '" onerror="this.style.display=\'none\'">' : '') +
      '<div class="body"><span class="cc-badge b-purple align-self-start">' + window.CC.esc(e.categoria) + '</span>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(e.nome) + '</h3>' +
      '<div class="meta"><i class="bi bi-calendar-event"></i>' + window.CC.fmtDate(e.data) + ' • ' + window.CC.esc(e.horario) + '</div>' +
      '<div class="meta"><i class="bi bi-geo-alt"></i>' + window.CC.esc(e.local) + '</div>' +
      '</div></article></div>'
    ).join('');
  }

  function renderVagas(arr) {
    const w = document.getElementById('homeVagas');
    if (!w) return;
    w.innerHTML = arr.map(v =>
      '<div class="col-md-4"><article class="cc-card"><div class="body">' +
      '<div class="d-flex gap-2"><span class="cc-badge b-blue">' + window.CC.esc(v.categoria) + '</span><span class="cc-badge b-gray">' + window.CC.esc(v.tipo) + '</span></div>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(v.titulo) + '</h3>' +
      '<div class="meta"><i class="bi bi-building"></i>' + window.CC.esc(v.empresa) + '</div>' +
      '<div class="meta"><i class="bi bi-cash-coin"></i>' + window.CC.esc(v.salario || 'A combinar') + '</div>' +
      '<a class="btn btn-outline-cc btn-sm mt-1 align-self-start" href="pages/empregos.html">Ver vaga <i class="bi bi-arrow-right"></i></a>' +
      '</div></article></div>'
    ).join('');
  }

  function initMap(tur) {
    const el = document.getElementById('mapHome');
    if (!el || typeof L === 'undefined') {
      if (el) el.innerHTML = '<div class="p-4 small text-muted">Mapa indisponível (Leaflet não carregou).</div>';
      return;
    }
    const c = tur.centro_mapa || { latitude: -10.4438, longitude: -45.165, zoom: 13 };
    const map = L.map('mapHome').setView([c.latitude, c.longitude], c.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    (tur.locais || []).slice(0, 8).forEach(l => {
      if (l.latitude == null) return;
      L.marker([l.latitude, l.longitude]).addTo(map).bindPopup('<b>' + window.CC.esc(l.nome) + '</b><br><small>' + window.CC.esc(l.categoria) + '</small>');
    });
  }
})();
