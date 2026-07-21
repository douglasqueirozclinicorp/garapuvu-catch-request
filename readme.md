# Garapuvu

Projeto interno para captura e análise de requisições de navegação, console, cookies, storage e eventos de erro em páginas web.

## Objetivo
Este fluxo permite que um time:
- capture dados diretamente em uma aba do navegador;
- exporte os dados em um arquivo JSON criptografado;
- abra esse arquivo em uma interface HTML para inspeção, análise de segurança e revisão de desempenho.

## Estrutura do projeto
- src/garapuvu-processo-captura.html: página de apoio com o fluxo de bookmarklet, instruções para INICIAR/PARAR e exportação dos dados.
- src/garapuvu-analisador-requests.html: interface principal para descriptografar sessões, visualizar requisições, console, cookies, storage e executar análises de segurança/performance.
- fixtures/garapuvu-sessao-TESTE-sistema.clinicorp.com.json: fixture de exemplo com uma sessão capturada.
- fixtures/garapuvu-sessao-TESTE-seguranca.json: fixture voltada para validar cenários de segurança e exposição de credenciais.
- fixtures/2026-07-21-ZAP-Report-.html: relatório de exemplo importado para a análise de segurança.

## Fluxo de uso
1. O usuário inicia a captura via a interface de processo.
2. Reproduz o problema em uma página web.
3. Para a captura e exporta o arquivo criptografado.
4. Abre o arquivo na interface de análise para revisar o contexto completo.

## Considerações de segurança
- Os dados são exportados em formato criptografado.
- A chave do time é necessária para abrir a sessão.
- Arquivos e chaves devem ser tratados como confidenciais.

## Observação
Este projeto foi pensado para suporte operacional e diagnóstico de problemas em ambientes web.
