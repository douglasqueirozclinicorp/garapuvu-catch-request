# CLAUDE.md — Suporte processo extração dados

## Contexto do projeto
Este workspace reúne um fluxo de captura e análise de dados de navegação para suporte de diagnóstico de problemas em sistemas web.

O objetivo principal é permitir que um time:
- capture requisições de rede, console, cookies, storage e eventos de erro em uma aba do navegador;
- exporte os dados em um arquivo JSON criptografado;
- abra esse arquivo em uma interface HTML para inspeção, análise de segurança e revisão de desempenho.

## Visão geral do projeto
O projeto é composto por:
- uma página de captura (bookmarklet / fluxo interno);
- uma página de análise visual para inspeção dos dados;
- fixtures de exemplo com sessões capturadas;
- um relatório de segurança OWASP ZAP para comparação e contexto.

## Arquivos principais
- [src/garapuvu-processo-captura.html](src/garapuvu-processo-captura.html): interface de apoio ao processo de captura. Explica o fluxo de bookmarklet, o uso do INICIAR/PARAR e o export de dados criptografados.
- [src/garapuvu-analisador-requests.html](src/garapuvu-analisador-requests.html): interface principal para abrir arquivos capturados, descriptografar, visualizar requisições, console, cookies, storage e executar análises de segurança/performance.
- [fixtures/garapuvu-sessao-TESTE-sistema.clinicorp.com.json](fixtures/garapuvu-sessao-TESTE-sistema.clinicorp.com.json): fixture de exemplo com dados de uma sessão capturada.
- [fixtures/garapuvu-sessao-TESTE-seguranca.json](fixtures/garapuvu-sessao-TESTE-seguranca.json): fixture voltada para validar cenários de segurança e exposição de credenciais.
- [fixtures/2026-07-21-ZAP-Report-.html](fixtures/2026-07-21-ZAP-Report-.html): relatório OWASP ZAP de exemplo para integração na análise de segurança.
- [readme.md](readme.md): documentação geral do projeto.

## Regras de trabalho para este projeto
- Trabalhe sempre em português, com linguagem objetiva e técnica.
- Preserve o contexto de diagnóstico e suporte operacional.
- Evite expor dados sensíveis em mensagens, logs ou documentação pública.
- Ao alterar a interface, mantenha o foco em usabilidade, clareza e rastreabilidade.
- Quando possível, use as fixtures como base para validação e testes.
- Priorize melhorias que ajudem na extração, análise e interpretação dos dados capturados.

## Fluxo esperado de uso
1. O usuário captura dados no navegador via a interface de processo de captura.
2. O resultado é exportado como JSON criptografado.
3. O arquivo é aberto na interface de análise.
4. A ferramenta exibe informações organizadas por categoria: requisições, console, cookies, storage, segurança e performance.

## Resumo do trabalho realizado em sequência de prompts
Abaixo está um resumo em formato de sequência de prompts, para registrar o que foi discutido e what foi entregue.

### Prompt 1 — Estruturação inicial
"Analise os arquivos do projeto e descreva a finalidade de cada um, incluindo o fluxo de captura e análise de requests."

### Prompt 2 — Documentação do projeto
"Crie um README completo para o projeto, explicando o objetivo, os arquivos principais, o fluxo de uso e a forma como os dados são capturados e analisados."

### Prompt 3 — Testes de interface e2e
"Adicione testes de interface e2e para validar as principais funcionalidades da interface, como carregamento de fixture, descriptografia, visualização de requisições, console, cookies, storage e importação de relatórios de segurança/performance."

### Prompt 4 — Contexto para assistente Claude
"Crie um arquivo CLAUDE.md com instruções do projeto, descrição dos arquivos, regras de trabalho e um resumo das interações em sequência de prompts para servir como guia para futuras alterações."

## Observações finais
Este arquivo serve como ponto de entrada para futuras alterações no projeto. Ele concentra os requisitos de negócio, os arquivos relevantes e a intenção do fluxo de trabalho, sem perder o foco em suporte e diagnóstico.
