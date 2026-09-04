/* Corrente Conecta — main.js
   Utilidades compartilhadas: caminhos, fetch seguro, XSS-safe, navbar,
   pesquisa global, clima (Open-Meteo), ViaCEP, contadores, voltar ao topo.
*/
(function () {
  'use strict';

  const isInPages = window.location.pathname.includes('/pages/');
  const BASE = isInPages ? '../' : '';
  const DATA = BASE + 'data/';
  const PAGES = isInPages ? './' : 'pages/';

  /** Escapa HTML para evitar XSS ao renderizar dados. */
  function esc(v) {
    return String(v ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function fetchJSON(path, fallback) {
    try {
      const r = await fetch(path, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      return fallback;
    }
  }
  const getJSON = (name, fallback) => fetchJSON(DATA + name, fallback);

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  // Expõe API global reutilizável (preparada p/ futuro backend).
  window.CC = { BASE, DATA, PAGES, esc, fetchJSON, getJSON, fmtDate, fmtDateTime, isInPages };

  /* ---------- Navbar / ano / topo ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('mainNav');
    const toTop = document.getElementById('toTop');
    const onScroll = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
      if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.querySelectorAll('[data-cc-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

    initGlobalSearch();
    initWeather();
    initCounters();
  });

  /* ---------- Pesquisa global (header) ---------- */
  let searchCache = null;
  async function loadSearchIndex() {
    if (searchCache) return searchCache;
    const [s, e, t, ev, a] = await Promise.all([
      getJSON('servicos.json', { servicos: [] }),
      getJSON('empregos.json', { vagas: [] }),
      getJSON('turismo.json', { locais: [] }),
      getJSON('eventos.json', { eventos: [] }),
      getJSON('alertas.json', { alertas: [] })
    ]);
    const idx = [];
    (s.servicos || []).forEach(x => idx.push({ mod: 'Serviços', titulo: x.nome, desc: x.descricao, extra: x.categoria, href: PAGES + 'servicos.html' }));
    (e.vagas || []).forEach(x => idx.push({ mod: 'Empregos', titulo: x.titulo, desc: x.empresa + ' • ' + x.localizacao, extra: x.categoria, href: PAGES + 'empregos.html' }));
    (t.locais || []).forEach(x => idx.push({ mod: 'Turismo', titulo: x.nome, desc: x.descricao, extra: x.categoria, href: PAGES + 'turismo.html' }));
    (ev.eventos || []).forEach(x => idx.push({ mod: 'Eventos', titulo: x.nome, desc: x.local + ' • ' + fmtDate(x.data), extra: x.categoria, href: PAGES + 'eventos.html' }));
    (a.alertas || []).forEach(x => idx.push({ mod: 'Alertas', titulo: x.titulo, desc: x.descricao, extra: x.tipo, href: PAGES + 'alertas.html' }));
    searchCache = idx;
    return idx;
  }

  function initGlobalSearch() {
    const input = document.getElementById('globalSearch');
    const box = document.getElementById('searchResults');
    if (!input || !box) return;
    let t = null;

    const close = () => { box.classList.add('d-none'); box.innerHTML = ''; };
    document.addEventListener('click', (ev) => {
      if (!box.contains(ev.target) && ev.target !== input) close();
    });

    input.addEventListener('input', () => {
      clearTimeout(t);
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { close(); return; }
      t = setTimeout(async () => {
        const idx = await loadSearchIndex();
        const res = idx.filter(r =>
          (r.titulo + ' ' + r.desc + ' ' + r.extra + ' ' + r.mod).toLowerCase().includes(q)
        ).slice(0, 7);
        if (!res.length) {
          box.innerHTML = '<div class="p-3 small text-muted">Nenhum resultado para <b>' + esc(input.value.trim()) + '</b>. Tente “saúde”, “emprego”, “praça”…</div>';
        } else {
          box.innerHTML = res.map(r =>
            '<a href="' + esc(r.href) + '">' +
            '<span class="tag">' + esc(r.mod) + '</span>' +
            '<span><b>' + esc(r.titulo) + '</b><br><small class="text-muted">' + esc((r.desc || '').slice(0, 90)) + '</small></span>' +
            '</a>'
          ).join('') +
          '<a href="' + PAGES + 'busca.html?q=' + encodeURIComponent(input.value.trim()) + '" class="fw-bold justify-content-center">Ver todos os resultados <i class="bi bi-arrow-right"></i></a>';
        }
        box.classList.remove('d-none');
      }, 220);
    });

    input.closest('form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const q = input.value.trim();
      if (q) window.location.href = PAGES + 'busca.html?q=' + encodeURIComponent(q);
    });
  }

  /* ---------- Clima (Open-Meteo, sem chave) ---------- */
  const WMOCODES = {
    0: ['Céu limpo', 'bi-sun'], 1: ['Quase limpo', 'bi-cloud-sun'], 2: ['Parcialmente nublado', 'bi-cloud-sun'],
    3: ['Nublado', 'bi-clouds'], 45: ['Nevoeiro', 'bi-cloud-fog'], 48: ['Nevoeiro', 'bi-cloud-fog'],
    51: ['Garoa', 'bi-cloud-drizzle'], 53: ['Garoa', 'bi-cloud-drizzle'], 55: ['Garoa forte', 'bi-cloud-drizzle'],
    61: ['Chuva fraca', 'bi-cloud-rain'], 63: ['Chuva', 'bi-cloud-rain'], 65: ['Chuva forte', 'bi-cloud-rain-heavy'],
    71: ['Granizo fino', 'bi-cloud-snow'], 80: ['Pancadas', 'bi-cloud-rain'], 81: ['Pancadas', 'bi-cloud-rain'],
    82: ['Pancadas fortes', 'bi-cloud-rain-heavy'], 95: ['Tempestade', 'bi-cloud-lightning-rain'], 96: ['Tempestade', 'bi-cloud-lightning-rain']
  };
  async function initWeather() {
    const els = document.querySelectorAll('[data-cc-weather]');
    if (!els.length) return;
    // Corrente-PI (aprox.)
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-10.4438&longitude=-45.165&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=America%2FSao_Paulo&forecast_days=3';
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('clima indisponível');
      const j = await r.json();
      const cur = j.current || {};
      const [txt, icon] = WMOCODES[cur.weather_code] || ['—', 'bi-cloud'];
      els.forEach(el => {
        el.innerHTML =
          '<div class="d-flex align-items-center gap-3">' +
          '<div class="display-6 mb-0"><i class="bi ' + icon + '"></i></div>' +
          '<div><div class="fs-3 fw-bold mb-0">' + Math.round(cur.temperature_2m ?? 0) + '°C</div>' +
          '<div class="small text-muted">' + esc(txt) + ' em Corrente-PI • <span class="text-capitalize">agora</span></div></div>' +
          '<div class="ms-auto text-end small text-muted">Máx ' + Math.round(j.daily?.temperature_2m_max?.[0] ?? 0) + '° • Mín ' + Math.round(j.daily?.temperature_2m_min?.[0] ?? 0) + '°<br>Umidade ' + (cur.relative_humidity_2m ?? '—') + '% • Vento ' + Math.round(cur.wind_speed_10m ?? 0) + ' km/h</div>' +
          '</div>' +
          '<div class="small text-muted mt-2"><i class="bi bi-info-circle"></i> Fonte: Open-Meteo (dados abertos). <span class="badge b-amber cc-badge">Demonstração</span></div>';
      });
    } catch {
      els.forEach(el => {
        el.innerHTML = '<div class="small text-muted"><i class="bi bi-cloud-slash"></i> Clima indisponível no momento (API Open-Meteo). Verifique sua conexão.</div>';
      });
    }
  }

  /* ---------- Consulta CEP (ViaCEP, sem chave) ---------- */
  window.ccBuscarCEP = async function (cep, outEls) {
    const clean = String(cep || '').replace(/\D/g, '').slice(0, 8);
    if (clean.length !== 8) throw new Error('CEP inválido. Digite 8 números.');
    const r = await fetch('https://viacep.com.br/ws/' + clean + '/json/');
    if (!r.ok) throw new Error('Falha ao consultar ViaCEP.');
    const j = await r.json();
    if (j.erro) throw new Error('CEP não encontrado.');
    return j; // {logradouro, bairro, localidade, uf, ...}
  };

  /* ---------- Contadores animados ---------- */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) {
      nums.forEach(n => { n.textContent = n.dataset.count; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        const target = parseInt(el.dataset.count, 10) || 0;
        const dur = 1200, t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }
})();
