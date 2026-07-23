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
├── scripts/
│   ├── security-report.mjs                 # Gera/abre o relatório HTML de segurança
│   └── sonar-scan.sh                       # Roda o SonarScanner (resolve Java 21 + token do .env)
├── docs/                                    # Documentação (CLAUDE.md, TESTES.md)
├── playwright.config.js                     # Config única do Playwright
├── eslint.config.js                         # ESLint + plugin de segurança
├── .gitleaks.toml                           # Regras do gitleaks (detecção de secrets)
├── sonar-project.properties                 # Config do SonarScanner
├── package.json
├── .env.example                             # Modelo do arquivo de ambiente (copie para .env)
└── .env                                     # Chave do time + token do Sonar (NÃO versionado)
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

### Análise SonarCloud no CI
O workflow [.github/workflows/sonarcloud.yml](.github/workflows/sonarcloud.yml) roda a análise no [sonarcloud.io](https://sonarcloud.io) a cada push na `main` e em PRs. Ele gera a cobertura (`npm run test:coverage` → `coverage/lcov.info`), o relatório do ESLint e o SARIF do gitleaks, e envia tudo para o SonarCloud, que decora o PR com o **Quality Gate**.

**Configuração (uma vez) — Settings → Secrets and variables → Actions:**

| Tipo | Nome | Valor | Onde obter |
|---|---|---|---|
| **Secret** | `SONAR_TOKEN` | token do **sonarcloud.io** (não do servidor local!) | My Account → Security → Generate Tokens |
| **Secret** | `TEAM_KEY` | chave do time (o CI precisa dela p/ gerar coverage) | cofre do time |
| **Variable** | `SONAR_ORGANIZATION` | ex.: `douglasqueirozclinicorp` | Organization Key no SonarCloud |
| **Variable** | `SONAR_PROJECT_KEY` | ex.: `douglasqueirozclinicorp_garapuvu-catch-request` | Project Key no SonarCloud |

> ⚠️ **Desligue a "Automatic Analysis"** no SonarCloud (projeto → **Administration → Analysis Method**). Se ela ficar ligada, o scan do CI é rejeitado com *"You are running CI analysis while Automatic Analysis is enabled"* — e a análise automática **não importa a cobertura** (não roda seus testes), deixando o painel de Coverage vazio.

> 📊 **New Code × Overall Code:** no PR o SonarCloud mostra só o *new code* (o delta). As métricas cheias (coverage total, duplicação, total de issues) aparecem na aba **Overall Code**, que só popula quando a análise roda na branch **`main`** — ou seja, **depois de mergear o PR**.

Achados que não são vazamento real (secrets fictícios das `fixtures/`, o arquivo-demo `src/testes-sonar.js`) ficam no allowlist do [.gitleaks.toml](.gitleaks.toml) e o demo é excluído em [sonar-project.properties](sonar-project.properties), para não derrubar o Quality Gate.

## Auditoria de segurança e qualidade de código

O projeto tem uma esteira de ferramentas para achar **vulnerabilidades, secrets vazados e problemas de qualidade**. Cada uma cobre um ponto cego diferente — nenhuma sozinha pega tudo.

### Comandos disponíveis

| Comando | O que faz | Requisito externo |
| --- | --- | --- |
| `npm run lint` | **ESLint** + `eslint-plugin-security` → padrões perigosos no código (eval, regex insegura, object injection) | — (npm) |
| `npm run audit:deps` | `npm audit` → vulnerabilidades conhecidas nas dependências | — (npm) |
| `npm run scan:secrets` | **gitleaks** nos arquivos atuais (working tree) | `brew install gitleaks` |
| `npm run scan:secrets:history` | **gitleaks** em todo o histórico do git | `brew install gitleaks` |
| `npm run audit:security` | roda lint + audit:deps + secrets (working tree + histórico) em sequência | gitleaks |
| `npm run audit:report` | gera e **abre** um relatório HTML consolidado em `.security/report.html` | gitleaks |
| `npm run test:coverage` | roda o e2e (Chromium) coletando cobertura → `coverage/lcov.info` | — (npm) |
| `npm run sonar:up` | sobe o servidor SonarQube local (Docker) e espera ficar UP | Docker |
| `npm run sonar:down` | para o servidor SonarQube local | Docker |
| `npm run sonar:status` | mostra o estado do container do SonarQube | Docker |
| `npm run sonar` | **SonarScanner** contra o SonarQube local (ver abaixo) | SonarQube + sonar-scanner + Java 21 |


> A pasta `.security/` (relatórios) está no `.gitignore` — contém secrets em texto claro, nunca versione.

### Detecção de secrets (gitleaks)

A config fica em [.gitleaks.toml](.gitleaks.toml) (lida automaticamente). Além das regras padrão, adiciona **detecção por palavra-chave** (`PASSWORD=`, `USER=`, `SENHA=`) que pega credenciais de **baixa entropia** — que a detecção por entropia ignora. A regra também ignora **referências seguras** (`process.env.X`, `config.X`, `${VAR}`, `import`/`require`) e placeholders, evitando falso positivo.

```bash
npm run scan:secrets          # arquivos atuais
npm run scan:secrets:history  # histórico completo do git
npm run audit:report          # relatório HTML consolidado
```

### SonarQube / SonarLint

Duas formas de uso, complementares:

**1. SonarLint no VSCode (ao vivo, sem servidor)** — extensão `SonarSource.sonarlint-vscode`. Analisa o arquivo aberto e mostra achados no painel **Problems** (`Cmd+Shift+M`). Requer, no `settings.json`:
```jsonc
"sonarlint.automaticAnalysis": true,
"sonarlint.focusOnNewCode": false   // mostra achados em todo o código, não só o novo
```

**2. SonarQube local (análise completa do projeto, via Docker)** — servidor + Connected Mode.

**Pré-requisitos (uma vez):**
```bash
# Docker Desktop instalado e rodando + o scanner e o Java 21
brew install --cask docker      # se ainda não tiver o Docker
brew install sonar-scanner openjdk@21
```
> O scanner quebra em JDK novos (`NoClassDefFoundError: bouncycastle`); por isso o Java **21**. O [scripts/sonar-scan.sh](scripts/sonar-scan.sh) já resolve o JAVA_HOME automaticamente.

**Gerenciar o servidor (scripts do package.json):**
```bash
npm run sonar:up        # cria (1ª vez, baixa ~700MB) ou inicia o container e espera ficar UP
npm run sonar:status    # mostra o estado do container
npm run sonar:down      # para o servidor (os dados ficam preservados nos volumes Docker)
```
O [scripts/sonar-server.sh](scripts/sonar-server.sh) usa um container `sonarqube` na porta **9000** com volumes persistentes.

**Configurar (uma vez, após o primeiro `sonar:up`):**
- Acesse `http://localhost:9000` (login inicial `admin`/`admin`, troque a senha).
- Gere um token em **My Account → Security** e coloque no `.env` (não versionado):
  ```bash
  SONAR_HOST_URL=http://localhost:9000
  SONAR_TOKEN=squ_xxxxxxxx
  ```


- No VSCode, conecte o **Connected Mode** → *Connect to SonarQube Server* → URL `http://localhost:9000` + token, e vincule ao projeto `garapuvu-catch-request`.

**Rodar a análise:**
```bash
npm run sonar           # gera relatórios (ESLint/gitleaks), resolve o Java 21 e escaneia
```

**3. SonarCloud no CI (GitHub Actions)** — o servidor local não é acessível pelo runner, então o CI usa o **SonarCloud** (nuvem). Workflow: [.github/workflows/sonarcloud.yml](.github/workflows/sonarcloud.yml). Ele instala o Chromium, roda o e2e com cobertura, gera os relatórios do ESLint/gitleaks e envia tudo pro SonarCloud.

Configuração (uma vez):
1. Em [sonarcloud.io](https://sonarcloud.io), entre com o GitHub e **importe o repositório** (cria a *organization* e o projeto). **Anote** o **Organization Key** e o **Project Key** que o SonarCloud atribuiu (o Project Key costuma ser `<org>_<repo>`, ex.: `douglasqueirozclinicorp_garapuvu-catch-request`).
2. ⚠️ **Desligue a "Automatic Analysis"** em **Administration → Analysis Method** do projeto. Se ficar ligada, ela **conflita** com este CI (roda em paralelo, varre o repo todo e **nunca tem coverage**) — foi o que fez o dashboard mostrar 25k linhas e coverage vazio.
3. Gere um token em **My Account → Security**.
4. No GitHub do repo: **Settings → Secrets and variables → Actions**:
   - **Secret** `SONAR_TOKEN` = o token do SonarCloud.
   - **Secret** `TEAM_KEY` = a chave do time (o e2e precisa dela pra gerar coverage).
   - **Variable** `SONAR_ORGANIZATION` = o Organization Key.
   - **Variable** `SONAR_PROJECT_KEY` = o Project Key (o `<org>_<repo>` do passo 1).

> Sintomas de config faltando: `organizationKey=` vazio ou `Not authorized or project not found` = as **variables/secret** não estão setadas. Dashboard com muitas linhas e sem coverage = **Automatic Analysis ainda ligada**.

> No SonarQube, **credencial hardcoded é um _Security Hotspot_** (regra S2068), **não** uma _vulnerability_ — aparece na aba **Security Hotspots**, não no indicador **Security**.

#### SonarQube como painel único (importa ESLint + gitleaks)

O `npm run sonar` (script [scripts/sonar-scan.sh](scripts/sonar-scan.sh)) gera e importa os achados das outras ferramentas estáticas, agregando tudo no dashboard do Sonar:
- **ESLint** → `.security/eslint-report.json` → `sonar.eslint.reportPaths` (aparecem como regras `external_eslint_repo:*`).
- **gitleaks** → `.security/gitleaks.sarif` → `sonar.sarifReportPaths` (aparecem como `external_gitleaks:*`).

Assim, no SonarQube você vê num lugar só: análise nativa (JS/CSS) + lint + secrets.

**Regra S2068 customizada:** o Quality Profile **"Garapuvu way"** amplia as palavras vigiadas (`passwordWords`) com `senha, pass, secret, token, segredo, credential, apikey`. Ainda assim, o S2068 tem um **filtro de entropia no valor não configurável** — senha fraca (`123321123`) só é pega pelo gitleaks.

#### Cobertura de testes (coverage)

O coverage vem do **e2e do Playwright** (não há teste unitário):
```bash
npm run test:coverage    # roda o e2e no Chromium coletando cobertura V8 -> coverage/lcov.info
```
Usa [monocart-coverage-reports](https://github.com/cenfun/monocart-coverage-reports) (fixture em [tests/coverage.js](tests/coverage.js)).

> ⚠️ **Limitação conhecida:** o código do app vive em `<script>` **inline** dentro dos HTML. O SonarQube **não importa cobertura de JS para arquivos `.html`** (`sonar.javascript.lcov.reportPaths` só casa com `.js`/`.ts`). Então o LCOV é gerado com cobertura real (~60%), mas o **dashboard do Sonar mostra 0%**. Para o coverage aparecer no Sonar, seria preciso **extrair os scripts inline para arquivos `.js` externos**.

### Qual ferramenta pega o quê (matriz de cobertura)

| Vazamento / problema | ESLint | SonarLint/Qube | gitleaks (config do projeto) |
| --- | :---: | :---: | :---: |
| Chave/token de **alta entropia** hardcoded | ❌ | ✅ (hotspot S2068) | ✅ |
| Senha **fraca/óbvia** (`123321123`) | ❌ | ❌ (heurística de entropia ignora) | ✅ (regra por palavra-chave) |
| `USER`/`PASSWORD` literais em `.md`/config | ❌ | ❌ | ✅ (regra por palavra-chave) |
| Secrets no **histórico do git** | ❌ | ❌ | ✅ |
| Padrões perigosos no código (eval, regex) | ✅ | ✅ | ❌ |
| Code smells, bugs, manutenibilidade | parcial | ✅ | ❌ |
| Vulnerabilidades em dependências | ❌ (`npm audit`) | ❌ | ❌ |

**Resumo:** use **gitleaks** como linha de frente para secrets (inclusive histórico), **ESLint + SonarLint** para qualidade/bugs de código, e **`npm audit`** para dependências.

## Considerações de segurança
- Dados sensíveis são cifrados com **AES‑256‑GCM** (chave via PBKDF2‑SHA256, 150k iterações).
- O arquivo só abre com a chave do time, no visualizador.
- Cookies `HttpOnly` não são visíveis por script (não são capturados) — isso é esperado.
- Trate arquivos de sessão e a chave do time como **confidenciais**.
