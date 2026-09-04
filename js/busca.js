/* Busca global — página de resultados */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const w = document.getElementById('buscaResults');
    if (!w) return;
    const q = new URLSearchParams(location.search).get('q') || '';
    document.getElementById('buscaTitle').textContent = q ? 'Resultados para “' + q + '”' : 'Pesquisar';
    const inp = document.getElementById('qBusca');
    if (inp && q) inp.value = q;
    if (!q.trim()) { w.innerHTML = '<div class="empty">Digite um termo acima — ex.: hospital, emprego, praça, feira…</div>'; return; }
    inp?.addEventListener('input', () => {
      const url = new URL(location.href);
      url.searchParams.set('q', inp.value);
      history.replaceState(null, '', url);
      run(inp.value);
    });
    run(q);
  }

  async function run(qRaw) {
    const w = document.getElementById('buscaResults');
    const q = qRaw.trim().toLowerCase();
    if (q.length < 2) { w.innerHTML = '<div class="empty">Digite ao menos 2 letras.</div>'; return; }
    const [s, e, t, ev, a] = await Promise.all([
      window.CC.getJSON('servicos.json', { servicos: [] }),
      window.CC.getJSON('empregos.json', { vagas: [] }),
      window.CC.getJSON('turismo.json', { locais: [] }),
      window.CC.getJSON('eventos.json', { eventos: [] }),
      window.CC.getJSON('alertas.json', { alertas: [] })
    ]);
    const groups = [
      { mod: 'Serviços', cls: 'b-teal', href: 'servicos.html', arr: (s.servicos || []).filter(x => (x.nome + ' ' + x.descricao + ' ' + x.categoria).toLowerCase().includes(q)).map(x => ({ t: x.nome, d: x.categoria + ' • ' + x.endereco })) },
      { mod: 'Empregos', cls: 'b-blue', href: 'empregos.html', arr: (e.vagas || []).filter(x => (x.titulo + ' ' + x.empresa + ' ' + x.descricao).toLowerCase().includes(q)).map(x => ({ t: x.titulo, d: x.empresa + ' • ' + x.localizacao })) },
      { mod: 'Turismo', cls: 'b-green', href: 'turismo.html', arr: (t.locais || []).filter(x => (x.nome + ' ' + x.descricao + ' ' + x.categoria).toLowerCase().includes(q)).map(x => ({ t: x.nome, d: x.categoria + ' • ' + x.endereco })) },
      { mod: 'Eventos', cls: 'b-purple', href: 'eventos.html', arr: (ev.eventos || []).filter(x => (x.nome + ' ' + x.descricao + ' ' + x.local).toLowerCase().includes(q)).map(x => ({ t: x.nome, d: window.CC.fmtDate(x.data) + ' • ' + x.local })) },
      { mod: 'Alertas', cls: 'b-red', href: 'alertas.html', arr: (a.alertas || []).filter(x => (x.titulo + ' ' + x.descricao + ' ' + x.tipo).toLowerCase().includes(q)).map(x => ({ t: x.titulo, d: x.tipo + ' • ' + x.local })) }
    ];
    const total = groups.reduce((n, g) => n + g.arr.length, 0);
    document.getElementById('buscaCount').textContent = total + (total === 1 ? ' resultado' : ' resultados');
    if (!total) { w.innerHTML = '<div class="empty"><i class="bi bi-search fs-3 d-block mb-2"></i>Nada encontrado para <b>' + window.CC.esc(qRaw) + '</b>.<br><span class="small">Tente “saúde”, “emprego”, “praça”, “água”…</span></div>'; return; }
    w.innerHTML = groups.filter(g => g.arr.length).map(g =>
      '<div class="col-12"><h2 class="h6 fw-bold mt-2"><span class="cc-badge ' + g.cls + '">' + g.mod + '</span> <span class="text-muted fw-normal">' + g.arr.length + ' encontrado(s)</span></h2>' +
      '<div class="list-group shadow-sm">' + g.arr.slice(0, 6).map(r =>
        '<a class="list-group-item list-group-item-action" href="' + g.href + '"><b>' + window.CC.esc(r.t) + '</b><br><small class="text-muted">' + window.CC.esc(r.d) + '</small></a>'
      ).join('') + '</div></div>'
    ).join('');
  }
})();
