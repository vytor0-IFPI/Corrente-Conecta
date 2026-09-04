/* Corrente Alertas — filtros por tipo/status/prioridade */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);
  let items = [];
  const state = { q: '', tipo: 'Todos', status: 'Todos' };

  const ico = { 'Trânsito': 'bi-cone-striped', 'Água': 'bi-droplet', 'Energia': 'bi-lightning-charge', 'Clima': 'bi-cloud-rain', 'Serviços públicos': 'bi-bank', 'Geral': 'bi-megaphone' };
  const prioBadge = { 'Alta': 'b-red', 'Média': 'b-amber', 'Baixa': 'b-green' };

  async function init() {
    const grid = document.getElementById('gridAlertas');
    if (!grid) return;
    const d = await window.CC.getJSON('alertas.json', { alertas: [] });
    items = (d.alertas || []).slice().sort((a, b) => b.data.localeCompare(a.data));
    const tipos = ['Todos', ...[...new Set(items.map(i => i.tipo))]];
    document.getElementById('fTipo').innerHTML = tipos.map(t => '<option>' + window.CC.esc(t) + '</option>').join('');
    document.getElementById('fTipo').addEventListener('change', e => { state.tipo = e.target.value; render(); });
    document.getElementById('fStatus').addEventListener('change', e => { state.status = e.target.value; render(); });
    document.getElementById('qAl').addEventListener('input', e => { state.q = e.target.value.toLowerCase(); render(); });
    renderBanner();
    render();
  }

  function renderBanner() {
    const b = document.getElementById('alertaBanner');
    if (!b) return;
    const crit = items.filter(i => i.prioridade === 'Alta' && i.status === 'Ativo');
    if (!crit.length) { b.classList.add('d-none'); return; }
    b.classList.remove('d-none');
    b.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i><b>' + crit.length + ' alerta(s) de prioridade alta ativos</b> (demonstração) — ' + window.CC.esc(crit[0].titulo);
  }

  function render() {
    const grid = document.getElementById('gridAlertas');
    const arr = items.filter(i =>
      (state.tipo === 'Todos' || i.tipo === state.tipo) &&
      (state.status === 'Todos' || i.status === state.status) &&
      (!state.q || (i.titulo + ' ' + i.descricao + ' ' + i.local).toLowerCase().includes(state.q))
    );
    document.getElementById('countAl').textContent = arr.length + ' alertas';
    if (!arr.length) { grid.innerHTML = '<div class="col-12"><div class="empty">Nenhum alerta com esses filtros.</div></div>'; return; }
    grid.innerHTML = arr.map(a =>
      '<div class="col-md-6"><article class="cc-card prio-' + window.CC.esc(a.prioridade) + '"><div class="body">' +
      '<div class="d-flex gap-2 flex-wrap align-items-center">' +
      '<span class="cc-badge b-dark"><i class="bi ' + (ico[a.tipo] || 'bi-megaphone') + '"></i> ' + window.CC.esc(a.tipo) + '</span>' +
      '<span class="cc-badge ' + (prioBadge[a.prioridade] || 'b-gray') + '">' + window.CC.esc(a.prioridade) + '</span>' +
      '<span class="cc-badge ' + (a.status === 'Ativo' ? 'b-red' : 'b-green') + '">' + window.CC.esc(a.status) + '</span>' +
      '<span class="cc-badge b-amber">Exemplo</span></div>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(a.titulo) + '</h3>' +
      '<p class="small text-muted">' + window.CC.esc(a.descricao) + '</p>' +
      '<div class="meta"><i class="bi bi-geo-alt"></i>' + window.CC.esc(a.local) + '</div>' +
      '<div class="meta"><i class="bi bi-clock"></i>' + window.CC.fmtDateTime(a.data) + '</div>' +
      '</div></article></div>'
    ).join('');
  }
})();
