# Testes de Interface E2E - Garapuvu

Testes de interface end-to-end para validar todas as funcionalidades principais da ferramenta Garapuvu de captura e análise de requisições.

## Pré-requisitos

- Node.js 16+
- npm ou yarn

## Instalação

```bash
npm install
```

## Executar testes

### Modo padrão (headless)
```bash
npm test
```

### Modo visual (UI)
```bash
npm run test:ui
```

### Modo debug
```bash
npm run test:debug
```

### Específico por navegador
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Testes em móvel
```bash
npm run test:mobile
```

### Modo headed (visualizar testes executando)
```bash
npm run test:headed
```

### Ver relatório HTML
```bash
npm run test:report
```

## Testes incluídos

### 1. Carregar interface
- Validar que a interface principal carrega com branding Garapuvu
- Verificar elementos visuais corretos

### 2. Carregamento de arquivo
- Upload de fixture JSON criptografada
- Validação de mensagens de sucesso/erro
- Estado do botão de análise

### 3. Descriptografia de sessão
- Preenchimento de chave de time
- Descriptografia AES-256-GCM com sucesso
- Exibição da interface de análise

### 4. Abas de análise
- Verificação de todas as abas (Segurança, Performance, Requisições, etc)
- Navegação entre abas
- Visibilidade de painéis

### 5. Filtros de requisições
- Filtro por domínio
- Busca de texto
- Contagem dinâmica

### 6. Console com filtros
- Chips de filtro por nível (log, error, warn, etc)
- Busca em mensagens
- Exibição correta

### 7. Cookies
- Exibição de cookies da sessão
- Detecção e decodificação de JWT
- Mascaramento de dados sensíveis

### 8. Storage
- localStorage
- sessionStorage

### 9. Segurança
- Achados de segurança (findings)
- Caca-credenciais (credential hunting)
- Mascaramento de valores sensíveis
- Botões de revelar/ocultar

### 10. Import ZAP
- Verificação de compatibilidade com relatórios OWASP ZAP em HTML

### 11. Import Lighthouse
- **NOVO**: Suporte para importar relatórios Lighthouse em formato HTML
- Parsing de scores (Performance, Acessibilidade, Boas práticas, SEO, PWA)
- Extração de Core Web Vitals
- Exibição de oportunidades

### 12. Download
- Download de JSON descriptografado
- Validação de nome de arquivo

## Estrutura das fixtures

- `fixtures/garapuvu-sessao-TESTE-seguranca.json` - Sessão com dados de segurança para validar achados
- `fixtures/garapuvu-sessao-TESTE-sistema.clinicorp.com.json` - Sessão típica de um sistema
- `oci-layout 2.htm` - Relatório Lighthouse do PageSpeed Insights (exemplo para import)

## Chave de time

A chave padrão para descriptografar as fixtures é:
```
cieF118sAqHhEuFAPtiuQI1M0dzhzIUE
```

## Arquivos importantes

- `playwright.config.js` - Configuração do Playwright
- `tests/e2e.spec.js` - Suite de testes
- `package.json` - Dependências e scripts

## Extensões futuras

- [ ] Testes de performance (screenshot comparison)
- [ ] Testes com diferentes formatos de entrada
- [ ] Validação de mascaramento de PII
- [ ] Teste de integração com servidor real
- [ ] Snapshot testing para relatórios de segurança
