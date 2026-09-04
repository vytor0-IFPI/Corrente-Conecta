/* Corrente Emprega — lista, busca, filtros, detalhes */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);
  let vagas = [];
  const state = { q: '', cat: 'Todas', tipo: 'Todos' };

  async function init() {
    const grid = document.getElementById('gridVagas');
    if (!grid) return;
    grid.innerHTML = '<div class="col-12"><div class="skel p-4">Carregando…</div></div>';
    const d = await window.CC.getJSON('empregos.json', { vagas: [] });
    vagas = d.vagas || [];
    buildFilters();
    document.getElementById('qVagas')?.addEventListener('input', e => { state.q = e.target.value.toLowerCase(); render(); });
    render();
  }

  function uniq(k) {
    return [...new Set(vagas.map(v => v[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function buildFilters() {
    const c = document.getElementById('fCat'), t = document.getElementById('fTipo');
    if (c) c.innerHTML = '<option>Todas</option>' + uniq('categoria').map(x => '<option>' + window.CC.esc(x) + '</option>').join('');
    if (t) t.innerHTML = '<option>Todos</option>' + uniq('tipo').map(x => '<option>' + window.CC.esc(x) + '</option>').join('');
    c?.addEventListener('change', e => { state.cat = e.target.value; render(); });
    t?.addEventListener('change', e => { state.tipo = e.target.value; render(); });
  }

  function filtered() {
    return vagas.filter(v => {
      const okC = state.cat === 'Todas' || v.categoria === state.cat;
      const okT = state.tipo === 'Todos' || v.tipo === state.tipo;
      const hay = (v.titulo + ' ' + v.empresa + ' ' + v.localizacao + ' ' + v.descricao).toLowerCase();
      return okC && okT && (!state.q || hay.includes(state.q));
    });
  }

  function render() {
    const grid = document.getElementById('gridVagas');
    const list = filtered();
    document.getElementById('countVagas').textContent = list.length + (list.length === 1 ? ' vaga' : ' vagas');
    if (!list.length) {
      grid.innerHTML = '<div class="col-12"><div class="empty"><i class="bi bi-briefcase fs-3 d-block mb-2"></i>Nenhuma vaga encontrada. <button class="btn btn-outline-cc btn-sm mt-2" id="limpaF">Limpar filtros</button></div></div>';
      document.getElementById('limpaF')?.addEventListener('click', () => location.reload());
      return;
    }
    grid.innerHTML = list.map(card).join('');
    grid.querySelectorAll('[data-vaga]').forEach(b => b.addEventListener('click', () => modal(b.dataset.vaga)));
  }

  function card(v) {
    return '<div class="col-md-6 col-lg-4"><article class="cc-card"><div class="body">' +
      '<div class="d-flex gap-2 flex-wrap align-items-center"><span class="cc-badge b-blue">' + window.CC.esc(v.categoria) + '</span>' +
      '<span class="cc-badge b-gray">' + window.CC.esc(v.tipo) + '</span>' +
      (v.destaque ? '<span class="cc-badge b-amber"><i class="bi bi-star-fill"></i> Destaque</span>' : '') + '</div>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(v.titulo) + '</h3>' +
      '<div class="meta"><i class="bi bi-building"></i>' + window.CC.esc(v.empresa) + '</div>' +
      '<div class="meta"><i class="bi bi-geo-alt"></i>' + window.CC.esc(v.localizacao) + '</div>' +
      '<div class="meta"><i class="bi bi-cash-coin"></i><b>' + window.CC.esc(v.salario || 'A combinar') + '</b></div>' +
      '<p class="small text-muted clamp2">' + window.CC.esc(v.descricao) + '</p>' +
      '<div class="d-flex gap-2 mt-auto"><button class="btn btn-dark-cc btn-sm flex-fill" data-vaga="' + window.CC.esc(v.id) + '">Ver detalhes</button>' +
      '<span class="small text-muted align-self-center">Exemplo</span></div>' +
      '</div></article></div>';
  }

  function modal(id) {
    const v = vagas.find(x => x.id === id);
    if (!v) return;
    document.getElementById('vagaTitle').textContent = v.titulo;
    document.getElementById('vagaBody').innerHTML =
      '<div class="d-flex gap-2 flex-wrap mb-2"><span class="cc-badge b-blue">' + window.CC.esc(v.categoria) + '</span><span class="cc-badge b-gray">' + window.CC.esc(v.tipo) + '</span><span class="cc-badge b-amber">Vaga de exemplo</span></div>' +
      '<p class="mb-1"><b>' + window.CC.esc(v.empresa) + '</b> • ' + window.CC.esc(v.localizacao) + '</p>' +
      '<p><i class="bi bi-cash-coin text-success"></i> <b>' + window.CC.esc(v.salario || 'A combinar') + '</b> <span class="text-muted">• publicada em ' + window.CC.fmtDate(v.publicada_em) + '</span></p>' +
      '<p>' + window.CC.esc(v.descricao) + '</p>' +
      '<h6 class="fw-bold">Requisitos</h6><ul class="small">' + (v.requisitos || []).map(r => '<li>' + window.CC.esc(r) + '</li>').join('') + '</ul>' +
      '<div class="alert alert-info small"><i class="bi bi-send"></i> <b>Como se candidatar (demonstração):</b> ' + window.CC.esc(v.contato) + '</div>' +
      '<div class="alert alert-warning small mb-0">Vaga fictícia para o MVP. Nenhum dado é enviado — estrutura pronta para API de candidaturas.</div>';
    new bootstrap.Modal(document.getElementById('vagaModal')).show();
  }
})();
