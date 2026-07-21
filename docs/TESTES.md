# Testes e2e — Garapuvu

Suíte de testes de interface end-to-end (Playwright) que valida as funcionalidades do analisador Garapuvu.

Arquivo único: [tests/garapuvu.e2e.spec.js](../tests/garapuvu.e2e.spec.js) (ESM, JavaScript).

## Pré-requisitos

```bash
npm install                # dependências (inclui @playwright/test, dotenv, cross-env)
npm run install:browsers   # baixa os navegadores do Playwright (só na 1ª vez)
cp .env.example .env        # configure a TEAM_KEY (chave do time)
```

> Os testes leem a chave de `process.env.TEAM_KEY` (arquivo `.env`). Sem ela, a suíte falha
> logo no início com uma mensagem explicando como configurar.

## Como os testes rodam
- O `playwright.config.js` sobe automaticamente um **servidor HTTP local** (`python3 -m http.server 8000`)
  e serve os arquivos estáticos do projeto.
- Os testes acessam a interface via `http://localhost:8000/src/garapuvu-analisador-requests.html`.
- As fixtures (`.json`, `.html`, `.htm`) são enviadas via `setInputFiles`, direto do disco.

## Scripts disponíveis

| Script | O que faz |
| --- | --- |
| `npm test` | Roda toda a suíte, headless, em todos os navegadores configurados |
| `npm run test:chromium` | Só Chromium |
| `npm run test:firefox` | Só Firefox |
| `npm run test:webkit` | Só WebKit (Safari) |
| `npm run test:mobile` | Viewports mobile (Pixel 5 + iPhone 12) |
| `npm run test:headed` | Chromium **visível**, 1 worker, em câmera lenta (`SLOWMO=1500ms`) — ideal para acompanhar |
| `npm run test:ui` | Modo UI interativo do Playwright |
| `npm run test:debug` | Modo debug (inspector) |
| `npm run test:report` | Abre o último relatório HTML |

### Rodar um teste específico
```bash
npx playwright test -g "importar relatorio OWASP ZAP"
```

## Seletores: data-testid
Os componentes da interface expõem atributos `data-testid` (ex.: `input-file`, `input-key`,
`btn-analisar`, `tab-perf`, `pane-sec`, `input-lh-json`, `btn-treemap`, `lh-shot`).
Os testes usam `page.getByTestId(...)`, o que deixa a suíte resistente a mudanças de layout/CSS.

## Cenários cobertos (18 testes)
**Onboarding e interface inicial**
1. Guia de 3 passos + ajuda de importação (OWASP/PageSpeed/Lighthouse) visíveis e expansíveis.
2. Botão **Analisar** desabilitado sem arquivo + chave; habilitado quando ambos preenchidos.
3. Rejeição de chave incorreta (mensagem de erro).

**Descriptografia e navegação**
4. Descriptografia com chave válida + metadados.
5. Presença de todas as abas.
6. Navegação entre Requisições, Console, Cookies, localStorage e sessionStorage.
7. Filtro de requisições por texto e por domínio.
8. Download do JSON descriptografado.

**Segurança**
9. Scan consolidado (pills de severidade) e caça-credenciais com valores mascarados.
10. Import de relatório **OWASP ZAP (HTML)** consolidando alertas.

**Performance (PageSpeed / Lighthouse)**
11. Dois botões de import + botão online do PageSpeed visíveis.
12. Import do **HTML do PageSpeed**.
13. Import do **JSON do Lighthouse (DevTools)** com scores reais (Performance=27).
14. **Filmstrip** e **screenshot final** ampliável (lightbox).
15. Navegação no **treemap de JavaScript** (drill-down nos módulos).

## Fixtures utilizadas
- `fixtures/garapuvu-sessao-TESTE-seguranca.json` — sessão com dados sensíveis.
- `fixtures/garapuvu-sessao-TESTE-sistema.clinicorp.com.json` — sessão de sistema real.
- `fixtures/2026-07-21-ZAP-Report-.html` — relatório OWASP ZAP.
- `fixtures/pagespeed-report-login.htm` — relatório PageSpeed/Lighthouse HTML (exemplo com erro de captura).
- `fixtures/lighthouse-devtools-login.json` — relatório Lighthouse JSON do DevTools (scores reais, filmstrip, screenshot e treemap).

## Integração contínua
O workflow `.github/workflows/e2e.yml` roda a suíte a cada push/PR na `main`.
Requer o secret **`TEAM_KEY`** no repositório (Settings → Secrets and variables → Actions).

### Relatório como artefato
Toda execução publica o **relatório HTML do Playwright** como artefato:
- **Actions** → execução → **Summary** → **Artifacts** → baixe **`playwright-report`**.
- Em falhas, também sai **`test-results`** (traces e screenshots).
- Para abrir localmente: descompacte e `npx playwright show-report <pasta>` (ou abra o `index.html`).

## Artefatos gerados
- `playwright-report/` — relatório HTML (gitignored).
- `test-results/` — screenshots/traces de falhas (gitignored).

## Dicas de debugging
```bash
npm test -- --debug          # inspector
npx playwright test --ui     # modo UI
# no teste: await page.pause();
```
