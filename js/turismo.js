/* Corrente Turismo — cards + mapa Leaflet/OSM */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init);
  let locais = [], map = null, markers = [];
  let cat = 'Todas';

  async function init() {
    const grid = document.getElementById('gridTurismo');
    if (!grid) return;
    const d = await window.CC.getJSON('turismo.json', { locais: [], centro_mapa: { latitude: -10.4438, longitude: -45.165, zoom: 14 } });
    locais = d.locais || [];
    buildCats();
    document.getElementById('qTur')?.addEventListener('input', e => render(e.target.value.toLowerCase()));
    initMap(d.centro_mapa);
    render('');
  }

  function buildCats() {
    const w = document.getElementById('catsTur');
    const cats = ['Todas', ...[...new Set(locais.map(l => l.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
    w.innerHTML = cats.map(c => '<button class="pill' + (c === 'Todas' ? ' active' : '') + '" data-c="' + window.CC.esc(c) + '">' + window.CC.esc(c) + '</button>').join('');
    w.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => {
      cat = b.dataset.c;
      w.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === b));
      render(document.getElementById('qTur')?.value.toLowerCase() || '');
    }));
  }

  function list(q) {
    return locais.filter(l =>
      (cat === 'Todas' || l.categoria === cat) &&
      (!q || (l.nome + ' ' + l.descricao + ' ' + l.categoria).toLowerCase().includes(q))
    );
  }

  function render(q) {
    const grid = document.getElementById('gridTurismo');
    const arr = list(q || '');
    document.getElementById('countTur').textContent = arr.length + ' locais';
    grid.innerHTML = arr.length ? arr.map(card).join('') : '<div class="col-12"><div class="empty">Nenhum local encontrado.</div></div>';
    grid.querySelectorAll('[data-focus]').forEach(b => b.addEventListener('click', () => focusMarker(b.dataset.focus)));
    drawMarkers(arr);
  }

  function card(l) {
    return '<div class="col-md-6 col-lg-4"><article class="cc-card">' +
      '<img class="cover" loading="lazy" src="' + window.CC.esc(l.imagem) + '" alt="Foto ilustrativa de ' + window.CC.esc(l.nome) + '" onerror="this.src=\'https://picsum.photos/seed/' + window.CC.esc(l.id) + '/800/500\'">' +
      '<div class="body"><div class="d-flex gap-2 flex-wrap"><span class="cc-badge b-green">' + window.CC.esc(l.categoria) + '</span><span class="cc-badge b-amber">Exemplo</span></div>' +
      '<h3 class="h6 fw-bold mb-0">' + window.CC.esc(l.nome) + '</h3>' +
      '<p class="small text-muted clamp3">' + window.CC.esc(l.descricao) + '</p>' +
      '<div class="meta"><i class="bi bi-geo-alt"></i><span class="clamp2">' + window.CC.esc(l.endereco) + '</span></div>' +
      '<div class="d-flex gap-2 mt-auto pt-1"><button class="btn btn-dark-cc btn-sm flex-fill" data-focus="' + window.CC.esc(l.id) + '"><i class="bi bi-map"></i> Ver no mapa</button>' +
      '<a class="btn btn-outline-cc btn-sm" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=' + l.latitude + '&mlon=' + l.longitude + '#map=16/' + l.latitude + '/' + l.longitude + '"><i class="bi bi-box-arrow-up-right"></i></a></div>' +
      '</div></article></div>';
  }

  function initMap(c) {
    const el = document.getElementById('mapTurismo');
    if (!el || typeof L === 'undefined') {
      if (el) el.innerHTML = '<div class="p-4 small text-muted">Mapa indisponível (Leaflet não carregou). Verifique a conexão.</div>';
      return;
    }
    map = L.map('mapTurismo').setView([c.latitude, c.longitude], c.zoom || 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  }

  function drawMarkers(arr) {
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    arr.forEach(l => {
      if (l.latitude == null) return;
      const m = L.marker([l.latitude, l.longitude]).addTo(map)
        .bindPopup('<b>' + window.CC.esc(l.nome) + '</b><br><small>' + window.CC.esc(l.categoria) + ' • Exemplo</small>');
      m._turId = l.id;
      markers.push(m);
    });
    if (markers.length) {
      const g = L.featureGroup(markers);
      map.fitBounds(g.getBounds().pad(0.25));
    }
  }

  function focusMarker(id) {
    const l = locais.find(x => x.id === id);
    if (!l || !map) return;
    map.setView([l.latitude, l.longitude], 16, { animate: true });
    const m = markers.find(x => x._turId === id);
    if (m) setTimeout(() => m.openPopup(), 350);
    document.getElementById('mapTurismo').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
