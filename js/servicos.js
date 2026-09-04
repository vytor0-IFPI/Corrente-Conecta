/* Serviços — busca, filtros, cards, modal de detalhes + consulta ViaCEP */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);

  let items = [];
  const state = { q: '', cat: 'Todas' };

  async function init() {
    const grid = document.getElementById('gridServicos');
    if (!grid) return;
    grid.innerHTML = skeleton();
    const data = await window.CC.getJSON('servicos.json', { servicos: [] });
    items = data.servicos || [];
    buildCats();
    bind();
    render();
    initCep();
  }

  function skeleton() {
    return Array.from({ length: 6 }).map(() => '<div class="col-md-6 col-lg-4"><div class="cc-card p-3"><div class="skel mb-2" style="height:22px"></div><div class="skel mb-2"></div><div class="skel" style="width:60%"></div></div></div>').join('');
  }

  function cats() {
    const s = new Set(items.map(i => i.categoria).filter(Boolean));
    return ['Todas', ...[...s].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }

  function buildCats() {
    const wrap = document.getElementById('catsServicos');
    if (!wrap) return;
    wrap.innerHTML = cats().map(c =>
      '<button type="button" class="pill' + (c === 'Todas' ? ' active' : '') + '" data-cat="' + window.CC.esc(c) + '">' + window.CC.esc(c) + '</button>'
    ).join('');
    wrap.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
      state.cat = b.dataset.cat;
      wrap.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === b));
      render();
    }));
  }

  function bind() {
    document.getElementById('qServicos')?.addEventListener('input', e => { state.q = e.target.value.toLowerCase(); render(); });
    document.getElementById('selCat')?.addEventListener('change', e => { state.cat = e.target.value; render(); });
  }

  function filtered() {
    return items.filter(i => {
      const okCat = state.cat === 'Todas' || i.categoria === state.cat;
      const hay = (i.nome + ' ' + i.descricao + ' ' + i.endereco + ' ' + i.categoria).toLowerCase();
      return okCat && (!state.q || hay.includes(state.q));
    });
  }

  const badge = c => {
    const m = { 'Saúde': 'b-green', 'Educação': 'b-blue', 'Transporte': 'b-purple', 'Documentação': 'b-amber', 'Assistência social': 'b-teal', 'Serviços municipais': 'b-dark', 'Segurança': 'b-red', 'Telefones úteis': 'b-gray' };
    return m[c] || 'b-teal';
  };

  function render() {
    const grid = document.getElementById('gridServicos');
    const count = document.getElementById('countServicos');
    const list = filtered();
    if (count) count.textContent = list.length + (list.length === 1 ? ' serviço' : ' serviços');
    if (!list.length) {
      grid.innerHTML = '<div class="col-12"><div class="empty"><i class="bi bi-search fs-3 d-block mb-2"></i>Nenhum serviço encontrado. Tente outro termo ou categoria.</div></div>';
      return;
    }
    grid.innerHTML = list.map(card).join('');
    grid.querySelectorAll('[data-det]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.det)));
  }

  function card(s) {
    return '<div class="col-md-6 col-lg-4">' +
      '<article class="cc-card">' +
      '<div class="body">' +
      '<div class="d-flex gap-2 flex-wrap"><span class="cc-badge ' + badge(s.categoria) + '">' + window.CC.esc(s.categoria) + '</span><span class="cc-badge b-amber">Exemplo</span></div>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(s.nome) + '</h3>' +
      '<p class="small text-muted clamp2 mb-1">' + window.CC.esc(s.descricao) + '</p>' +
      '<div class="meta"><i class="bi bi-geo-alt"></i><span class="clamp2">' + window.CC.esc(s.endereco) + '</span></div>' +
      '<div class="meta"><i class="bi bi-clock"></i>' + window.CC.esc(s.horario) + '</div>' +
      '<div class="meta"><i class="bi bi-telephone"></i>' + window.CC.esc(s.telefone) + '</div>' +
      '<div class="d-flex gap-2 mt-2">' +
      '<button class="btn btn-dark-cc btn-sm flex-fill" data-det="' + window.CC.esc(s.id) + '"><i class="bi bi-eye"></i> Detalhes</button>' +
      '<a class="btn btn-outline-cc btn-sm" href="tel:' + window.CC.esc(String(s.telefone).replace(/\D/g, '')) + '"><i class="bi bi-telephone-outbound"></i></a>' +
      '</div></div></article></div>';
  }

  function openModal(id) {
    const s = items.find(x => x.id === id);
    if (!s) return;
    document.getElementById('svcTitle').textContent = s.nome;
    document.getElementById('svcBody').innerHTML =
      '<div class="d-flex gap-2 flex-wrap mb-2"><span class="cc-badge ' + badge(s.categoria) + '">' + window.CC.esc(s.categoria) + '</span><span class="cc-badge b-amber">Dados demonstrativos</span></div>' +
      '<p>' + window.CC.esc(s.descricao) + '</p>' +
      '<ul class="list-unstyled small d-grid gap-2">' +
      '<li><i class="bi bi-geo-alt text-success"></i> <b>Endereço:</b> ' + window.CC.esc(s.endereco) + '</li>' +
      '<li><i class="bi bi-telephone text-success"></i> <b>Telefone:</b> ' + window.CC.esc(s.telefone) + '</li>' +
      '<li><i class="bi bi-clock text-success"></i> <b>Horário:</b> ' + window.CC.esc(s.horario) + '</li>' +
      (s.link_oficial ? '<li><i class="bi bi-link-45deg text-success"></i> <a href="' + window.CC.esc(s.link_oficial) + '" target="_blank" rel="noopener">Site oficial</a></li>' : '<li class="text-muted"><i class="bi bi-link-45deg"></i> Link oficial: a cadastrar (estrutura pronta)</li>') +
      '</ul>' +
      '<div class="alert alert-warning small mb-0"><i class="bi bi-exclamation-triangle"></i> Informação de exemplo para o MVP. Confirme nos canais oficiais antes de ir ao local.</div>';
    const m = new bootstrap.Modal(document.getElementById('svcModal'));
    m.show();
  }

  /* ViaCEP demo */
  function initCep() {
    const btn = document.getElementById('btnCep');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const inp = document.getElementById('inpCep');
      const out = document.getElementById('cepOut');
      out.innerHTML = '<div class="small text-muted"><span class="spinner-border spinner-border-sm"></span> Consultando ViaCEP…</div>';
      try {
        const j = await window.ccBuscarCEP(inp.value);
        out.innerHTML = '<div class="alert alert-success small mb-0"><b>' + window.CC.esc(j.logradouro || 'Logradouro não informado') + '</b><br>' +
          window.CC.esc(j.bairro || '') + ' — ' + window.CC.esc(j.localidade) + '/' + window.CC.esc(j.uf) + '<br><span class="text-muted">CEP ' + window.CC.esc(j.cep) + ' • Fonte: ViaCEP</span></div>';
      } catch (e) {
        out.innerHTML = '<div class="alert alert-danger small mb-0">' + window.CC.esc(e.message) + '</div>';
      }
    });
  }
})();
