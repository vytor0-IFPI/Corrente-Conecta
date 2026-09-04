/* Corrente Eventos — agenda, busca, filtros, modal */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);
  let evs = [];
  const state = { q: '', cat: 'Todas' };

  async function init() {
    const grid = document.getElementById('gridEventos');
    if (!grid) return;
    const d = await window.CC.getJSON('eventos.json', { eventos: [] });
    evs = (d.eventos || []).slice().sort((a, b) => a.data.localeCompare(b.data));
    buildCats();
    document.getElementById('qEv')?.addEventListener('input', e => { state.q = e.target.value.toLowerCase(); render(); });
    render();
  }

  function buildCats() {
    const w = document.getElementById('catsEv');
    const cats = ['Todas', ...[...new Set(evs.map(e => e.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
    w.innerHTML = cats.map(c => '<button class="pill' + (c === 'Todas' ? ' active' : '') + '" data-c="' + window.CC.esc(c) + '">' + window.CC.esc(c) + '</button>').join('');
    w.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => {
      state.cat = b.dataset.c;
      w.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === b));
      render();
    }));
  }

  function monthShort(iso) {
    try { return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''); }
    catch { return ''; }
  }
  function dayNum(iso) { try { return new Date(iso + 'T12:00:00').getDate(); } catch { return '—'; } }

  function render() {
    const grid = document.getElementById('gridEventos');
    const arr = evs.filter(e =>
      (state.cat === 'Todas' || e.categoria === state.cat) &&
      (!state.q || (e.nome + ' ' + e.local + ' ' + e.descricao).toLowerCase().includes(state.q))
    );
    document.getElementById('countEv').textContent = arr.length + ' eventos';
    if (!arr.length) { grid.innerHTML = '<div class="col-12"><div class="empty">Nenhum evento encontrado.</div></div>'; return; }
    grid.innerHTML = arr.map(e =>
      '<div class="col-md-6 col-lg-4"><article class="cc-card">' +
      (e.imagem ? '<img class="cover" loading="lazy" src="' + window.CC.esc(e.imagem) + '" alt="Imagem ilustrativa de ' + window.CC.esc(e.nome) + '" onerror="this.src=\'https://picsum.photos/seed/' + window.CC.esc(e.id) + '/800/500\'">' : '') +
      '<div class="body"><div class="d-flex gap-2 align-items-start">' +
      '<div class="date-chip"><b>' + dayNum(e.data) + '</b><span>' + window.CC.esc(monthShort(e.data)) + '</span></div>' +
      '<div><div class="d-flex gap-1 flex-wrap mb-1"><span class="cc-badge b-purple">' + window.CC.esc(e.categoria) + '</span>' + (e.gratuito ? '<span class="cc-badge b-green">Gratuito</span>' : '') + '</div>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(e.nome) + '</h3></div></div>' +
      '<div class="meta"><i class="bi bi-clock"></i>' + window.CC.esc(e.horario) + ' • ' + window.CC.fmtDate(e.data) + '</div>' +
      '<div class="meta"><i class="bi bi-geo-alt"></i>' + window.CC.esc(e.local) + '</div>' +
      '<p class="small text-muted clamp2">' + window.CC.esc(e.descricao) + '</p>' +
      '<button class="btn btn-dark-cc btn-sm mt-auto" data-ev="' + window.CC.esc(e.id) + '">Detalhes</button>' +
      '</div></article></div>'
    ).join('');
    grid.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => {
      const e = evs.find(x => x.id === b.dataset.ev);
      document.getElementById('evTitle').textContent = e.nome;
      document.getElementById('evBody').innerHTML =
        (e.imagem ? '<img src="' + window.CC.esc(e.imagem) + '" class="img-fluid rounded mb-3" alt="Imagem de ' + window.CC.esc(e.nome) + '">' : '') +
        '<div class="d-flex gap-2 flex-wrap mb-2"><span class="cc-badge b-purple">' + window.CC.esc(e.categoria) + '</span><span class="cc-badge b-amber">Evento de exemplo</span></div>' +
        '<ul class="list-unstyled small d-grid gap-2"><li><i class="bi bi-calendar-event text-success"></i> <b>' + window.CC.fmtDate(e.data) + '</b> • ' + window.CC.esc(e.horario) + '</li>' +
        '<li><i class="bi bi-geo-alt text-success"></i> ' + window.CC.esc(e.local) + '</li></ul>' +
        '<p>' + window.CC.esc(e.descricao) + '</p>' +
        '<div class="d-flex gap-2"><button class="btn btn-cc btn-sm" id="btnLembrete"><i class="bi bi-bell"></i> Lembrete (demo)</button>' +
        '<button class="btn btn-outline-cc btn-sm" id="btnShare"><i class="bi bi-share"></i> Compartilhar</button></div>' +
        '<div class="alert alert-warning small mt-3 mb-0">Evento fictício do MVP. Confirme data e local nos canais oficiais.</div>';
      new bootstrap.Modal(document.getElementById('evModal')).show();
      document.getElementById('btnLembrete')?.addEventListener('click', () => {
        try { localStorage.setItem('cc_lembrete_' + e.id, JSON.stringify({ id: e.id, em: new Date().toISOString() })); } catch {}
        document.getElementById('btnLembrete').innerHTML = '<i class="bi bi-check-circle"></i> Lembrete salvo!';
      });
      document.getElementById('btnShare')?.addEventListener('click', async () => {
        const url = location.href;
        try {
          if (navigator.share) await navigator.share({ title: e.nome, text: e.descricao, url });
          else { await navigator.clipboard.writeText(url); document.getElementById('btnShare').textContent = 'Link copiado!'; }
        } catch {}
      });
    }));
  }
})();
