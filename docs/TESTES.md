# Testes e2e - Garapuvu

Suite completa de testes de interface end-to-end (e2e) para validar todas as funcionalidades do Garapuvu de captura e análise de requisições.

## Objetivo dos testes

Os testes cobrem os seguintes cenários:

### 1. **Interface Inicial**
- Abertura da página do analisador
- Validação de botões e inputs desabilitados até preenchimento

### 2. **Descriptografia de Sessões**
- Upload de arquivo JSON de sessão capturada
- Preenchimento de chave de descriptografia
- Descriptografia com sucesso usando chave correta
- Rejeição de chave incorreta com mensagem de erro

### 3. **Visualização de Dados**
- **Requisições**: exibição de tabela com métodos, status, hosts, endpoints e duração
- **Console**: exibição de mensagens de log, warning, error, etc.
- **Cookies**: exibição de cookies acessíveis (não HttpOnly)
- **localStorage**: exibição de dados armazenados no localStorage
- **sessionStorage**: exibição de dados armazenados no sessionStorage

### 4. **Análise de Segurança**
- Auditoria automática de vulnerabilidades (OWASP Top 10)
- Detecção de credenciais expostas (passwords, tokens, JWT)
- Análise de headers de segurança
- Importação de relatórios OWASP ZAP (HTML)

### 5. **Análise de Performance**
- Importação de relatórios Lighthouse (JSON e HTML)
- Exibição de Core Web Vitals
- Exibição de scores de performance, acessibilidade, SEO, etc.

### 6. **Filtros e Buscas**
- Filtro de requisições por domínio
- Busca por texto em requisições

### 7. **Export de Dados**
- Download de JSON descriptografado

## Arquivos de Teste

- [tests/garapuvu.e2e.spec.ts](tests/garapuvu.e2e.spec.ts): Suite completa com 17 testes

## Fixtures Utilizadas

- `fixtures/garapuvu-sessao-TESTE-seguranca.json`: Sessão com dados de segurança sensíveis
- `fixtures/garapuvu-sessao-TESTE-sistema.clinicorp.com.json`: Sessão de sistema real
- `fixtures/2026-07-21-ZAP-Report-.html`: Relatório de segurança OWASP ZAP
- `fixtures/oci-layout 2.htm`: Relatório de performance Lighthouse (HTML)

## Configuração

### Instalação de dependências

```bash
npm install
```

### Executar todos os testes

```bash
npm test
```

### Executar com modo UI (interativo)

```bash
npm run test:ui
```

### Executar com modo debug

```bash
npm run test:debug
```

### Executar no modo headed (com navegador visível)

```bash
npm run test:headed
```

### Executar teste específico

```bash
npx playwright test tests/garapuvu.e2e.spec.ts -g "deve exibir aba de Requisições"
```

## O que cada teste valida

1. **deve abrir a página do analisador**
   - Verifica título e componentes principais

2. **deve validar que o botão Analisar começa desabilitado**
   - Garante que não há análise sem arquivo e chave

3. **deve ativar o botão Analisar quando arquivo e chave são preenchidos**
   - Valida lógica de ativação do botão

4. **deve descriptografar e exibir dados de sessão de segurança**
   - Teste principal: valida fluxo completo de descriptografia

5. **deve exibir aba de Requisições com dados capturados**
   - Valida tabela de requisições com colunas corretas

6. **deve exibir aba de Console com mensagens capturadas**
   - Verifica que mensagens de log aparecem

7. **deve exibir aba de Cookies com dados de sessão**
   - Valida exibição de cookies em tabela

8. **deve exibir aba de Segurança com achados de auditoria**
   - Verifica que análise de segurança é realizada

9. **deve permitir importação de relatório OWASP ZAP**
   - Testa import de arquivo HTML de segurança

10. **deve permitir importação de relatório Lighthouse (HTML)**
    - Testa novo suporte para HTML do PageSpeed

11. **deve exibir localStorage quando disponível**
    - Valida dados de localStorage

12. **deve exibir sessionStorage quando disponível**
    - Valida dados de sessionStorage

13. **deve permitir download de JSON descriptografado**
    - Verifica disponibilidade do botão de download

14. **deve filtrar requisições por domínio**
    - Testa select de filtragem por host

15. **deve buscar/filtrar requisições por texto**
    - Testa input de busca

16. **deve rejeitar chave incorreta**
    - Valida mensagem de erro com chave errada

## Comportamento esperado

- Todos os testes devem passar com as fixtures fornecidas
- Tempo total: aproximadamente 30-40 segundos (testes sequenciais)
- Os testes criamscreenshots automaticamente em caso de falha
- Relatório HTML é gerado em `playwright-report/`

## Estrutura do teste

Cada teste segue o padrão:
1. Acessa a página do analisador
2. Faz upload de arquivo(s)
3. Preenche chave de descriptografia
4. Clica no botão de análise
5. Valida resultado esperado com `expect()`

## Arquivos gerados após execução

- `playwright-report/`: Relatório HTML com detalhes dos testes
- `test-results/`: Screenshots de falhas
- `.auth/`: Cache de autenticação (se necessário)

## Dicas para debugging

### Ver saída detalhada:
```bash
npm test -- --verbose
```

### Pausar em um ponto específico:
```bash
// Adicionar no teste:
await page.pause();
```

### Executar apenas um bloco de testes:
```bash
npx playwright test -g "Segurança"
```

### Gerar relatório após execução:
```bash
npx playwright show-report
```
