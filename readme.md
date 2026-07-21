# Garapuvu — Captura e Análise de Requests

Ferramenta interna para **capturar** requisições de rede, console, cookies, storage e eventos de erro de qualquer página web e **analisar** esses dados depois, com foco em diagnóstico, segurança e performance.

## Objetivo
Permitir que o time:
- capture dados diretamente em uma aba do navegador (via bookmarklet);
- exporte tudo num arquivo JSON **criptografado (AES‑256‑GCM)**;
- abra esse arquivo numa interface HTML para inspeção, auditoria de segurança e revisão de desempenho.

## Estrutura do projeto
```
catch-request-garapuvu/
├── src/
│   ├── garapuvu-processo-captura.html      # Página de apoio: bookmarklets INICIAR/PARAR e instruções
│   └── garapuvu-analisador-requests.html   # Interface principal: descriptografa e analisa a sessão
├── fixtures/
│   ├── garapuvu-sessao-TESTE-seguranca.json          # Sessão de exemplo (cenários de segurança)
│   ├── garapuvu-sessao-TESTE-sistema.clinicorp.com.json  # Sessão de exemplo (sistema real)
│   ├── 2026-07-21-ZAP-Report-.html                   # Relatório OWASP ZAP de exemplo
│   └── pagespeed-report-login.htm                    # Relatório PageSpeed/Lighthouse de exemplo (com erro de captura)
├── tests/
│   └── garapuvu.e2e.spec.js                # Suíte e2e (Playwright)
├── docs/                                    # Documentação (CLAUDE.md, TESTES.md)
├── playwright.config.js                     # Config única do Playwright
├── package.json
├── .env.example                             # Modelo do arquivo de ambiente (copie para .env)
└── .env                                     # Chave do time (NÃO versionado)
```

## Fluxo de uso
1. Abra `src/garapuvu-processo-captura.html` e arraste os favoritos **INICIAR** e **PARAR** para a barra de favoritos.
2. Na página com o problema, clique em **INICIAR Captura** e reproduza o problema.
3. Clique em **PARAR e Exportar** → baixa um `garapuvu-sessao-<host>-....json` criptografado.
4. Abra o arquivo em `src/garapuvu-analisador-requests.html`, informe a **chave do time** e clique em **Analisar**.

## Guia de uso completo (passo a passo)
Fluxo ponta a ponta, do problema ao diagnóstico:

1. **Preparar (uma vez):** abra `src/garapuvu-processo-captura.html` e arraste os favoritos **▶ INICIAR** e **■ PARAR** para a barra de favoritos do navegador.
2. **Capturar:** na aba onde o problema acontece, clique em **INICIAR** → reproduza o problema (se o erro é no carregamento, recarregue a página) → clique em **PARAR**. Um `garapuvu-sessao-<host>-....json` **criptografado** é baixado.
3. **Abrir:** em `src/garapuvu-analisador-requests.html`, faça upload do `.json`, informe a **TEAM_KEY** e clique em **Analisar**.
4. **Diagnosticar:** navegue pelas abas (veja a tabela abaixo). Comece por **Segurança** e **Requisições**.
5. **(Opcional) Enriquecer com relatórios externos:**
   - Aba **Segurança** → **Importar relatório OWASP ZAP** (arquivo `.html`/`.json` gerado no ZAP).
   - Aba **Performance** → **Importar JSON do Lighthouse (DevTools)** (`.json` do F12) ou **Importar HTML do PageSpeed** (`.htm`).
6. **(Opcional) Exportar:** clique em **Baixar JSON decifrado** para guardar/compartilhar a sessão já legível.

### Quais arquivos importar em cada aba
| Aba | Botão | Arquivo | Onde gerar |
| --- | --- | --- | --- |
| Segurança | Importar relatório OWASP ZAP | `.html` ou `.json` | OWASP ZAP → *Report → Generate Report* |
| Performance | Importar JSON do Lighthouse (DevTools) | `.json` | Chrome F12 → aba Lighthouse → *Export → Save as JSON* |
| Performance | Importar HTML do PageSpeed | `.htm` / `.html` | pagespeed.web.dev → *Ctrl/Cmd+S* (página completa) |

### O que cada aba mostra
| Aba | Conteúdo |
| --- | --- |
| **Segurança** | Scan consolidado (sessão + ZAP) com pills de severidade; **caça-credenciais** (senhas/tokens sob chaves sensíveis, mascarados); achados (HTTP sem TLS, dados sensíveis na URL, cookies sem flags, CORS `*`, JWT com `alg=none`/PII, headers de segurança ausentes…). |
| **Performance** | Scores Lighthouse (Performance, Acessibilidade, Boas práticas, SEO, PWA), **Core Web Vitals**, **filmstrip**, **screenshot final** (ampliável) e **treemap** de JavaScript navegável, além das principais oportunidades. |
| **Requisições** | Tabela de fetch/XHR (método, status, domínio, endpoint, duração), com filtro por domínio e por texto; clique numa linha para ver headers e body de request/response. |
| **Console** | Mensagens de `log`/`info`/`warn`/`error`, erros de recurso (4xx/5xx) e *unhandled rejections*, com filtro por nível e busca. |
| **Cookies** | Cookies acessíveis por script (não `HttpOnly`); botão para **decodificar JWT** quando aplicável. |
| **localStorage / sessionStorage** | Pares chave/valor armazenados na origem, com JSON formatado. |
| **Cache** | URLs guardadas no Cache Storage (service worker), por cache. |

## Chave do time (TEAM_KEY)
A sessão é cifrada com a chave do time. Por segurança, a chave **não fica no código versionado**:

1. Copie o modelo e preencha a chave:
   ```bash
   cp .env.example .env
   # edite .env e coloque a chave real em TEAM_KEY=...
   ```
2. A mesma chave precisa estar embutida no **bookmarklet PARAR** (campo `TEAM_KEY` dentro do código do favorito). Para trocar a chave do time, altere nos dois lugares.
3. No analisador, a chave é digitada no campo **"Chave do time"** na hora de abrir o arquivo — ela nunca é salva.

> ⚠️ O arquivo `.env` está no `.gitignore`. Nunca faça commit dele. Guarde a chave no cofre de senhas do time.

## Como importar um relatório OWASP ZAP
O analisador consolida a auditoria da própria sessão com um relatório externo do **OWASP ZAP**.

1. No ZAP, gere o relatório: menu **Report → Generate Report**.
   - Formato recomendado: **HTML** (`Traditional HTML Report`). O parser também aceita o **JSON** do ZAP.
2. Abra a sessão no analisador e vá até a aba **Segurança**.
3. Clique em **"Importar relatório OWASP ZAP"** e selecione o arquivo `.html` (ou `.json`).
4. Os alertas do ZAP aparecem numa tabela (Alerta / Risco / Quantidade) e entram no resumo consolidado de severidades, junto com os achados da sessão.

Exemplo pronto para testar: `fixtures/2026-07-21-ZAP-Report-.html`.

## Como importar um relatório PageSpeed / Lighthouse
A aba **Performance** mostra scores (Performance, Acessibilidade, Boas práticas, SEO, PWA) e os **Core Web Vitals**.

Há três formas de obter o relatório:

**Opção A — PageSpeed Insights (online, mais simples)**
1. Na aba Performance, ajuste a URL e clique em **"Rodar no Lighthouse (PageSpeed)"** — abre o [pagespeed.web.dev](https://pagespeed.web.dev) já com a URL.
2. Depois de rodar, salve a página do resultado: **Ctrl/Cmd + S → "Página da Web, completa"**. Isso gera um `.htm`.
3. Volte ao analisador e clique em **"Importar relatório Lighthouse/PageSpeed"**, selecionando o `.htm` salvo.

**Opção B — Chrome DevTools (JSON, experiência mais rica)** ⭐
Aba **Lighthouse** no DevTools → **Analyze** → menu **Export → Save as JSON**. Importe no botão **"Importar JSON do Lighthouse (DevTools)"**. Além dos scores e Core Web Vitals, o JSON traz dados extras que a interface renderiza igual ao DevTools:
- **Filmstrip** — as miniaturas do carregamento (clique para ampliar);
- **Screenshot final** — imagem da página ao fim da análise (clique para ampliar);
- **Treemap de JavaScript** — botão **"Ver Treemap"** para navegar os bundles por tamanho, com a faixa vermelha indicando bytes não utilizados; clique num item com ▸ para abrir os módulos.

**Opção C — Lighthouse CLI (para automação)**
```bash
npx lighthouse "https://sua-url" --output=json --output=html --output-path=./relatorio
```
Gera `relatorio.report.html` e `relatorio.report.json`. Importe qualquer um dos dois.

> Há **dois botões** de import na aba Performance: um para o **JSON do Lighthouse** (com filmstrip/screenshot/treemap) e outro para o **HTML do PageSpeed**. O parser HTML lê o markup padrão do Lighthouse (`.lh-gauge__wrapper`, `.lh-metric`).
> As fixtures de exemplo: `fixtures/lighthouse-devtools-login.json` (JSON com scores reais) e `fixtures/pagespeed-report-login.htm` (HTML **com erro de captura** — `NO_FCP` — então os scores aparecem como "Erro!"/"-").

### Lighthouse (DevTools F12) × PageSpeed Insights — qual usar?
As duas ferramentas usam **o mesmo motor Lighthouse** (do Google), mas rodam em lugares diferentes:

| | **Lighthouse no DevTools (F12)** | **PageSpeed Insights** |
| --- | --- | --- |
| Onde roda | Local, no **seu** Chrome/máquina | Na **nuvem** do Google |
| URL | Qualquer página, **inclusive logada** (atrás de autenticação) | Apenas **URLs públicas** |
| Dados de campo (CrUX) | Não | **Sim** — dados reais de usuários (Chrome UX Report) |
| Ambiente | Depende da sua rede/máquina (varia) | Padronizado (mobile/desktop) |
| Exportar | **Export → Save as JSON/HTML** | Salvar a página (`Ctrl/Cmd+S`) |
| Melhor para | Debug local, páginas internas/logadas | Baseline comparável, compartilhar, medir mobile |

**Resumo:** use o **DevTools (F12)** para diagnosticar uma página logada do sistema (é o caso do Garapuvu) e o **PageSpeed** quando quiser um número comparável/oficial de uma URL pública. Para a experiência mais rica no analisador (filmstrip, screenshot e treemap), prefira **importar o JSON do DevTools**.

## Testes (Playwright)
Guia completo em [docs/TESTES.md](docs/TESTES.md) e o plano em BDD (Gherkin) em [docs/PLAN-TEST.md](docs/PLAN-TEST.md). Resumo:

```bash
npm install                # instala dependências
npm run install:browsers   # baixa os navegadores do Playwright (1ª vez)
cp .env.example .env        # configure a TEAM_KEY

npm test                   # roda toda a suíte (headless, todos os navegadores)
npm run test:headed        # roda no Chromium, visível e em câmera lenta (SLOWMO=1500ms)
npm run test:report        # abre o último relatório HTML
```
Os testes sobem sozinhos um servidor HTTP local (`python3 -m http.server 8000`) e acessam a interface via `http://localhost:8000`. Os elementos da interface têm atributos `data-testid` para deixar os seletores estáveis.

## Integração contínua (GitHub Actions)
O workflow [.github/workflows/e2e.yml](.github/workflows/e2e.yml) roda a suíte e2e automaticamente:
- a cada **push na `main`** (inclui merges de PR aprovados);
- em **PRs abertos contra a `main`** (pega problemas antes do merge).

> ⚠️ **Fez um fork? Você precisa configurar o secret no seu repositório** — secrets **não** são copiados junto com o fork. Sem isso, o workflow falha de propósito com a mensagem `Secret TEAM_KEY nao configurado`.

Como as fixtures são cifradas com a chave do time e o `.env` não é versionado, cadastre a chave como **Repository secret**:

1. No seu repositório: **Settings → Secrets and variables → Actions**.
2. Aba **Secrets** → seção **Repository secrets** → botão **New repository secret**.
3. **Name:** `TEAM_KEY` (exatamente assim) · **Secret:** a chave do time.
4. Se o workflow já falhou antes, abra a execução em **Actions** e use **Re-run jobs**.

> ❗ Cadastre em **Repository secrets**, **não** em *Environment secrets*. Um secret criado dentro de um *Environment* só é visível para jobs que declaram `environment:` — este workflow lê `${{ secrets.TEAM_KEY }}` no nível do job, então precisa ser um **repository secret**.

### Relatório do Playwright no CI
Cada execução do workflow gera o **relatório HTML** e o publica como artefato:

1. Abra a execução em **Actions** → job **Testes e2e**.
2. Na aba **Summary**, seção **Artifacts**, baixe **`playwright-report`** (e, em caso de falha, **`test-results`** com traces/screenshots).
3. Descompacte e abra o `index.html`, ou rode:
   ```bash
   npx playwright show-report caminho/da/pasta-extraida
   ```

O artefato fica retido por 14 dias.

## Considerações de segurança
- Dados sensíveis são cifrados com **AES‑256‑GCM** (chave via PBKDF2‑SHA256, 150k iterações).
- O arquivo só abre com a chave do time, no visualizador.
- Cookies `HttpOnly` não são visíveis por script (não são capturados) — isso é esperado.
- Trate arquivos de sessão e a chave do time como **confidenciais**.
