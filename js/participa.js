/* Corrente Participa — formulário + localStorage + votação + filtros
   Arquitetura preparada p/ backend: trocar store.* por chamadas à API. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);

  const KEY = 'cc_participa_v1';
  const VOTES = 'cc_participa_votos_v1';

  const store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } },
    save(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} }
  };
  const votes = {
    load() { try { return JSON.parse(localStorage.getItem(VOTES)) || {}; } catch { return {}; } },
    save(o) { try { localStorage.setItem(VOTES, JSON.stringify(o)); } catch {} }
  };

  const seed = () => ([
    { id: 'seed-1', titulo: 'Falta iluminação nesta rua (Exemplo)', descricao: 'Postes apagados há dias, rua escura à noite. Registro demonstrativo.', categoria: 'Iluminação', local: 'Rua do Comércio — Centro (exemplo)', status: 'Em análise', votos: 238, criadoEm: '2026-08-20T19:00:00-03:00', mine: false },
    { id: 'seed-2', titulo: 'Buraco na via próximo à praça (Exemplo)', descricao: 'Buraco crescendo com as chuvas, risco para motos. Registro demonstrativo.', categoria: 'Vias', local: 'Av. Central (exemplo)', status: 'Recebido', votos: 96, criadoEm: '2026-08-25T10:00:00-03:00', mine: false },
    { id: 'seed-3', titulo: 'Sugestão: mais lixeiras na orla (Exemplo)', descricao: 'Mutirão foi ótimo; lixeiras ajudariam a manter limpo. Registro demonstrativo.', categoria: 'Sugestão', local: 'Orla do Rio (exemplo)', status: 'Resolvido', votos: 154, criadoEm: '2026-08-15T09:00:00-03:00', mine: false }
  ]);

  let items = [];
  const state = { q: '', cat: 'Todas', status: 'Todos', onlyMine: false };
  const STATUS = { 'Recebido': ['🟡', 'b-amber'], 'Em análise': ['🔵', 'b-blue'], 'Resolvido': ['🟢', 'b-green'] };

  function init() {
    if (!document.getElementById('gridPart')) return;
    const saved = store.load();
    items = saved || seed();
    if (!saved) store.save(items);
    bindForm();
    bindFilters();
    render();
  }

  function bindFilters() {
    const cats = ['Todas', ...[...new Set([...items.map(i => i.categoria), 'Iluminação', 'Vias', 'Sugestão', 'Limpeza', 'Água', 'Segurança', 'Elogio', 'Outro'])]];
    document.getElementById('pCatF').innerHTML = cats.map(c => '<option>' + window.CC.esc(c) + '</option>').join('');
    document.getElementById('qPart')?.addEventListener('input', e => { state.q = e.target.value.toLowerCase(); render(); });
    document.getElementById('pCatF')?.addEventListener('change', e => { state.cat = e.target.value; render(); });
    document.getElementById('pStatusF')?.addEventListener('change', e => { state.status = e.target.value; render(); });
    document.getElementById('pMine')?.addEventListener('change', e => { state.onlyMine = e.target.checked; render(); });
  }

  function bindForm() {
    const form = document.getElementById('formPart');
    // ViaCEP autofill p/ bairro/cidade (demo)
    document.getElementById('btnCepP')?.addEventListener('click', async () => {
      const out = document.getElementById('cepPOut');
      out.textContent = 'Consultando…';
      try {
        const j = await window.ccBuscarCEP(document.getElementById('fCep').value);
        document.getElementById('fLocal').value = (j.logradouro ? j.logradouro + ', ' : '') + (j.bairro || '') + ' — ' + j.localidade + '/' + j.uf;
        out.textContent = 'Endereço localizado via ViaCEP ✓';
        out.className = 'form-text text-success';
      } catch (e) { out.textContent = e.message; out.className = 'form-text text-danger'; }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
      const file = document.getElementById('fFoto').files?.[0];
      const readPhoto = file ? new Promise(res => {
        if (file.size > 1500000) return res(''); // limita p/ não estourar localStorage
        const r = new FileReader();
        r.onload = () => res(String(r.result).slice(0, 300000));
        r.onerror = () => res('');
        r.readAsDataURL(file);
      }) : Promise.resolve('');

      readPhoto.then(photo => {
        const novo = {
          id: 'u-' + Date.now(),
          titulo: document.getElementById('fTitulo').value.trim().slice(0, 120),
          descricao: document.getElementById('fDesc').value.trim().slice(0, 1000),
          categoria: document.getElementById('fCat').value,
          local: document.getElementById('fLocal').value.trim().slice(0, 160),
          status: 'Recebido',
          votos: 1,
          criadoEm: new Date().toISOString(),
          mine: true,
          foto: photo || ''
        };
        items.unshift(novo);
        store.save(items);
        const v = votes.load(); v[novo.id] = 1; votes.save(v);
        form.reset(); form.classList.remove('was-validated');
        document.getElementById('cepPOut').textContent = '';
        toast('Registro enviado com sucesso! (demonstração em localStorage)');
        // volta os filtros p/ mostrar o novo
        state.onlyMine = false; document.getElementById('pMine').checked = false;
        render();
        document.getElementById('listaPart').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function filtered() {
    return items
      .filter(i => (state.cat === 'Todas' || i.categoria === state.cat) &&
        (state.status === 'Todos' || i.status === state.status) &&
        (!state.onlyMine || i.mine) &&
        (!state.q || (i.titulo + ' ' + i.descricao + ' ' + i.local).toLowerCase().includes(state.q)))
      .sort((a, b) => (b.votos - a.votos) || (b.criadoEm.localeCompare(a.criadoEm)));
  }

  function render() {
    const grid = document.getElementById('gridPart');
    const arr = filtered();
    const mine = items.filter(i => i.mine).length;
    document.getElementById('countPart').textContent = arr.length + ' registros • ' + mine + ' meus';
    // stats topo
    document.getElementById('stTotal').textContent = items.length;
    document.getElementById('stResolv').textContent = items.filter(i => i.status === 'Resolvido').length;
    document.getElementById('stVotos').textContent = items.reduce((s, i) => s + i.votos, 0).toLocaleString('pt-BR');

    if (!arr.length) { grid.innerHTML = '<div class="col-12"><div class="empty">Nenhum registro com esses filtros. Seja o primeiro a participar! 👆</div></div>'; return; }
    const myVotes = votes.load();
    grid.innerHTML = arr.map(i => {
      const [dot, cls] = STATUS[i.status] || ['⚪', 'b-gray'];
      const voted = !!myVotes[i.id];
      return '<div class="col-md-6"><article class="cc-card"><div class="body">' +
        '<div class="d-flex gap-2 flex-wrap"><span class="cc-badge b-teal">' + window.CC.esc(i.categoria) + '</span>' +
        '<span class="cc-badge ' + cls + '">' + dot + ' ' + window.CC.esc(i.status) + '</span>' +
        (i.mine ? '<span class="cc-badge b-dark">Meu registro</span>' : '<span class="cc-badge b-amber">Exemplo</span>') + '</div>' +
        '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(i.titulo) + '</h3>' +
        '<p class="small text-muted clamp3">' + window.CC.esc(i.descricao) + '</p>' +
        (i.foto ? '<img src="' + i.foto + '" class="img-fluid rounded" alt="Foto anexada ao registro ' + window.CC.esc(i.titulo) + '" loading="lazy">' : '') +
        '<div class="meta"><i class="bi bi-geo-alt"></i>' + window.CC.esc(i.local) + '</div>' +
        '<div class="d-flex align-items-center gap-2 mt-1">' +
        '<button class="vote-btn' + (voted ? ' voted' : '') + '" data-vote="' + window.CC.esc(i.id) + '" aria-pressed="' + voted + '"><i class="bi bi-hand-thumbs-up"></i> <span>' + i.votos + '</span></button>' +
        '<small class="text-muted">' + window.CC.fmtDate(i.criadoEm) + '</small></div>' +
        '</div></article></div>';
    }).join('');
    grid.querySelectorAll('[data-vote]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.vote;
      const it = items.find(x => x.id === id);
      const v = votes.load();
      if (v[id]) { delete v[id]; it.votos = Math.max(0, it.votos - 1); }
      else { v[id] = 1; it.votos += 1; }
      votes.save(v); store.save(items);
      render();
    }));
  }

  function toast(msg) {
    let c = document.getElementById('toastWrap');
    if (!c) { c = document.createElement('div'); c.id = 'toastWrap'; c.className = 'toast-container position-fixed bottom-0 end-0 p-3'; document.body.appendChild(c); }
    const el = document.createElement('div');
    el.className = 'toast show cc-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<div class="toast-body"><i class="bi bi-check-circle-fill text-success me-2"></i>' + window.CC.esc(msg) + '</div>';
    c.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
})();
