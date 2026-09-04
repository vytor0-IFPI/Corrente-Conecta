# Corrente Conecta — Conectando você à nossa cidade

Plataforma web informativa para **Corrente-PI**: serviços, empregos, turismo, eventos, alertas e participação popular em um só lugar.

> **MVP frontend estático** — HTML5 + CSS3 + JavaScript vanilla + Bootstrap 5 + Bootstrap Icons + APIs públicas (OpenStreetMap/Leaflet, Open-Meteo, ViaCEP). Sem login, sem backend. Todos os conteúdos são **dados demonstrativos marcados como “Exemplo”**.

## Estrutura

```
corrente-conecta/
├── index.html            # homepage
├── pages/                # servicos, empregos, turismo, eventos, alertas, participa, busca
├── css/                  # style.css (identidade) + responsive.css (mobile-first)
├── js/                   # main.js (busca global, clima, CEP, contadores) + 1 JS por módulo
├── data/                 # JSONs demonstrativos (trocar por API/banco no futuro)
└── assets/logo/          # logo.svg
```

## Como rodar (Etapa 16 — Deploy/MVP local)

Frontend estático: basta servir a pasta. Ex.:

```bash
cd corrente-conecta
python3 -m http.server 8000
# abrir http://localhost:8000
```

> Abrir `index.html` direto via `file://` funciona parcialmente, mas o `fetch()` dos JSONs exige `http://` (use o servidor acima ou qualquer hospedagem estática: GitHub Pages, Netlify, Vercel…).

## Módulos

| Módulo | Página | Fonte de dados (MVP) |
|---|---|---|
| Serviços | `pages/servicos.html` | `data/servicos.json` + modal + ViaCEP |
| Empregos | `pages/empregos.html` | `data/empregos.json` |
| Turismo | `pages/turismo.html` | `data/turismo.json` + mapa Leaflet/OSM |
| Eventos | `pages/eventos.html` | `data/eventos.json` |
| Alertas | `pages/alertas.html` | `data/alertas.json` + clima Open-Meteo |
| Participa | `pages/participa.html` | `localStorage` + votação |
| Pesquisa | header + `pages/busca.html` | busca JS nos 5 JSONs |

## APIs públicas (sem chave)

- **Clima:** Open-Meteo `api.open-meteo.com` (lat/lon de Corrente-PI, cmp. `js/main.js`) com fallback amigável.
- **Mapas:** OpenStreetMap tiles + Leaflet CDN (+ iframe embed de reserva na home).
- **CEP:** ViaCEP `viacep.com.br` (`ccBuscarCEP()` em `main.js`, demo em Serviços e Participa).

## Preparação p/ o futuro (backend)

- `window.CC.getJSON()` centraliza a leitura — trocar por `fetch('/api/...')` quando houver API própria.
- `js/participa.js` usa `store`/`votes` isolados — trocar por `POST /api/participa` e `POST /api/votos`.
- Comentários `TODO(API)` não foram necessários: cada JSON tem `nota` + `atualizado_em` indicando a troca.

## Qualidade

- Mobile-first, testado em 360/390/414/768/1024/1440px (Bootstrap grid + `responsive.css`).
- Sem erros no console (fetches com `try/catch` + fallbacks), HTML semântico, `alt` em imagens, `label` em inputs, `button` p/ ações e `a` p/ navegação, `esc()` anti-XSS em toda renderização.
- SEO: title/description por página, headings hierárquicos, `lang="pt-BR"`.

## Segurança (frontend)

Sem chaves secretas, sem senhas em `localStorage`, validação de formulários + limite de upload de foto (~1,5 MB) no Participa.
