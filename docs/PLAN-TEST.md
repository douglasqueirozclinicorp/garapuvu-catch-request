# PLAN-TEST.md — Plano de Testes (BDD)

Plano de testes do **Garapuvu — Analisador de Requests** descrito em **BDD** (Behavior-Driven
Development), no formato Gherkin (Dado / Quando / Então). Cada cenário corresponde a um teste
automatizado em [tests/garapuvu.e2e.spec.js](../tests/garapuvu.e2e.spec.js), executado com Playwright.

- **Ator:** analista de suporte/QA que recebe uma sessão capturada e precisa diagnosticá-la.
- **Pré-condição global:** a `TEAM_KEY` está configurada no `.env` e o servidor local está no ar
  (o Playwright sobe `python3 -m http.server` automaticamente).
- **Seletores:** os testes usam `data-testid` para estabilidade.

---

## Funcionalidade: Onboarding e interface inicial
> Para não me perder ao abrir a ferramenta, quero um guia claro do que fazer e de como importar relatórios.

```gherkin
Cenário: Ver o guia de 3 passos e a ajuda de importação
  Dado que eu abro o analisador
  Então vejo o título "Analisador de requests"
  E vejo um guia com exatamente 3 passos
  E vejo uma ajuda "Como importar relatórios" citando OWASP ZAP, Lighthouse e PageSpeed
  Quando eu expando essa ajuda
  Então vejo a instrução "Export → Save as JSON" do Lighthouse

Cenário: Botão Analisar começa desabilitado
  Dado que eu abro o analisador
  Então o botão "Analisar" está desabilitado

Cenário: Botão Analisar habilita com arquivo + chave
  Dado que eu abro o analisador
  Quando eu seleciono um arquivo de sessão
  Então vejo a mensagem "Arquivo carregado"
  E o botão "Analisar" continua desabilitado
  Quando eu informo a chave do time
  Então o botão "Analisar" fica habilitado

Cenário: Rejeitar chave incorreta
  Dado que eu carreguei um arquivo de sessão
  Quando eu informo uma chave incorreta e clico em "Analisar"
  Então vejo a mensagem "Falha ao descriptografar"
```

## Funcionalidade: Descriptografia e navegação
> Como analista, quero abrir a sessão cifrada e navegar pelos dados capturados.

```gherkin
Cenário: Descriptografar e exibir metadados
  Dado que carreguei a sessão e informei a chave correta
  Quando clico em "Analisar"
  Então vejo "Descriptografado com sucesso"
  E o cartão de metadados mostra o host "sistema.clinicorp.com"

Cenário: Exibir todas as abas de análise
  Dado que descriptografei a sessão
  Então vejo as abas Segurança, Performance, Requisições, Console, Cookies, localStorage e sessionStorage

Cenário: Navegar entre as abas
  Dado que descriptografei a sessão
  Quando clico em cada aba (Requisições, Console, Cookies, localStorage, sessionStorage)
  Então o painel correspondente fica visível

Cenário: Filtrar requisições por texto
  Dado que estou na aba Requisições
  Quando digito "login" no campo de busca
  Então a lista é filtrada e o contador de requisições aparece

Cenário: Baixar o JSON descriptografado
  Dado que descriptografei a sessão
  Quando clico em "Baixar JSON decifrado"
  Então o download tem nome contendo "garapuvu-sessao-DECIFRADA"

Cenário: Filtrar requisições por domínio (sessão de sistema)
  Dado que descriptografei a sessão de sistema
  Quando abro a aba Requisições
  Então o seletor de domínio oferece opções
```

## Funcionalidade: Análise de Segurança
> Como analista de segurança, quero ver os riscos da sessão e cruzar com um relatório do OWASP ZAP.

```gherkin
Cenário: Exibir o scan consolidado
  Dado que estou na aba Segurança
  Então vejo o resumo com pills de severidade (Crítico/Alto/Médio/Baixo/Info)

Cenário: Caça-credenciais com valores mascarados
  Dado que estou na aba Segurança
  Então vejo o bloco "Caça-credenciais"
  E os valores sensíveis aparecem mascarados (com asteriscos)

Cenário: Importar relatório OWASP ZAP (HTML)
  Dado que estou na aba Segurança
  Quando importo um relatório OWASP ZAP em HTML
  Então os alertas do ZAP aparecem consolidados no painel
```

## Funcionalidade: Análise de Performance (PageSpeed / Lighthouse)
> Como analista, quero importar um relatório Lighthouse e explorá-lo como no DevTools.

```gherkin
Cenário: Mostrar as opções de import de performance
  Dado que estou na aba Performance
  Então vejo o botão "Importar JSON do Lighthouse (DevTools)"
  E vejo o botão "Importar HTML do PageSpeed"
  E vejo o botão "Rodar no Lighthouse (PageSpeed)" e o campo de URL

Cenário: Importar HTML do PageSpeed
  Dado que estou na aba Performance
  Quando importo um relatório do PageSpeed em HTML
  Então vejo a seção "Scores Lighthouse"

Cenário: Importar JSON do Lighthouse (DevTools) com scores reais
  Dado que estou na aba Performance
  Quando importo o JSON do Lighthouse do DevTools
  Então vejo "Scores Lighthouse" com o score de Performance = 27
  E vejo a seção "Core Web Vitals"

Cenário: Exibir filmstrip e screenshot final ampliável
  Dado que importei o JSON do Lighthouse
  Então vejo miniaturas do filmstrip (imagens em data URI)
  Quando clico no screenshot final
  Então ele abre ampliado num lightbox
  Quando clico no lightbox
  Então o lightbox fecha

Cenário: Navegar no treemap de JavaScript
  Dado que importei o JSON do Lighthouse
  Quando clico em "Ver Treemap"
  Então vejo os blocos (tiles) de scripts dimensionados por tamanho
  Quando clico num bloco com filhos (▸)
  Então navego para os módulos e vejo a trilha "Raiz"
```

---

## Como rodar
```bash
npm install && npm run install:browsers
cp .env.example .env   # configure a TEAM_KEY
npm test               # headless, todos os navegadores
npm run test:headed    # Chromium visível, câmera lenta (para acompanhar)
```
Cobertura atual: **18 cenários**. Detalhes de scripts e CI em [TESTES.md](TESTES.md).
