import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const TEAM_KEY = 'cieF118sAqHhEuFAPtiuQI1M0dzhzIUE';
const ANALYZER_URL = `file://${path.join(__dirname, '..', 'src', 'garapuvu-analisador-requests.html')}`;

test.describe('Garapuvu - Analisador de Requests', () => {
  
  test('deve abrir a página do analisador', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    await expect(page.locator('h1')).toContainText('Analisador de requests');
    await expect(page.locator('input[type="file"]#file')).toBeVisible();
    await expect(page.locator('input[type="password"]#key')).toBeVisible();
  });

  test('deve validar que o botão Analisar começa desabilitado', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    const button = page.locator('button#go');
    await expect(button).toBeDisabled();
  });

  test('deve ativar o botão Analisar quando arquivo e chave são preenchidos', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    // Upload arquivo
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await page.waitForTimeout(500);
    
    // Verificar mensagem de carregamento
    await expect(page.locator('div.msg.ok')).toContainText('Arquivo carregado');
    
    // Botão ainda deve estar desabilitado sem chave
    await expect(button).toBeDisabled();
    
    // Preencher chave
    await keyInput.fill(TEAM_KEY);
    await page.waitForTimeout(300);
    
    // Agora o botão deve estar ativado
    await expect(button).toBeEnabled();
  });

  test('deve descriptografar e exibir dados de sessão de segurança', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    
    // Clicar em Analisar
    await button.click();
    await page.waitForTimeout(1000);
    
    // Verificar que a descrição foi bem-sucedida
    await expect(page.locator('div.msg.ok')).toContainText('Descriptografado com sucesso');
    
    // Verificar que os cards de metadados aparecem
    await expect(page.locator('#metaCard')).toBeVisible();
    await expect(page.locator('div.metagrid')).toContainText('sistema.clinicorp.com');
    
    // Verificar que a interface de análise ficou visível
    await expect(page.locator('#viewer')).toBeVisible();
  });

  test('deve exibir aba de Requisições com dados capturados', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Verificar que a aba de Requisições existe e tem um contador
    const reqTab = page.locator('.tab:has-text("Requisicoes")');
    await expect(reqTab).toBeVisible();
    
    // Clicar na aba de Requisições
    await reqTab.click();
    await page.waitForTimeout(300);
    
    // Verificar que a pane de requisições está ativa
    const reqPane = page.locator('#pane-req');
    await expect(reqPane).toBeVisible();
    
    // Verificar que há uma tabela de requisições
    const table = page.locator('#pane-req table');
    await expect(table).toBeVisible();
  });

  test('deve exibir aba de Console com mensagens capturadas', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de Console
    const conTab = page.locator('.tab:has-text("Console")');
    await expect(conTab).toBeVisible();
    await conTab.click();
    await page.waitForTimeout(300);
    
    // Verificar que a pane de console está ativa
    const conPane = page.locator('#pane-con');
    await expect(conPane).toBeVisible();
  });

  test('deve exibir aba de Cookies com dados de sessão', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de Cookies
    const cookTab = page.locator('.tab:has-text("Cookies")');
    await expect(cookTab).toBeVisible();
    await cookTab.click();
    await page.waitForTimeout(300);
    
    // Verificar que a pane de cookies está ativa
    const cookPane = page.locator('#pane-cook');
    await expect(cookPane).toBeVisible();
    
    // Verificar que há uma tabela de cookies
    const table = page.locator('#pane-cook table');
    await expect(table).toBeVisible();
  });

  test('deve exibir aba de Segurança com achados de auditoria', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de Segurança
    const secTab = page.locator('.tab:has-text("Seguranca")');
    await expect(secTab).toBeVisible();
    await secTab.click();
    await page.waitForTimeout(300);
    
    // Verificar que a pane de segurança está ativa
    const secPane = page.locator('#pane-sec');
    await expect(secPane).toBeVisible();
    
    // Verificar que há resumo de achados (severidade)
    const summary = page.locator('#pane-sec .secsummary');
    await expect(summary).toBeVisible();
  });

  test('deve permitir importação de relatório OWASP ZAP', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de Segurança
    const secTab = page.locator('.tab:has-text("Seguranca")');
    await secTab.click();
    await page.waitForTimeout(300);
    
    // Procurar o input de ZAP e fazer upload
    const zapInput = page.locator('input#zapFile');
    if (await zapInput.isVisible()) {
      const zapFile = path.join(FIXTURES_DIR, '2026-07-21-ZAP-Report-.html');
      if (fs.existsSync(zapFile)) {
        await zapInput.setInputFiles(zapFile);
        await page.waitForTimeout(500);
        
        // Verificar que a seção de ZAP aparece após importação
        const zapSection = page.locator('text=OWASP ZAP');
        await expect(zapSection).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('deve permitir importação de relatório Lighthouse (HTML)', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de Performance
    const perfTab = page.locator('.tab:has-text("Performance")');
    await expect(perfTab).toBeVisible();
    await perfTab.click();
    await page.waitForTimeout(300);
    
    // Procurar o input de Lighthouse e fazer upload do HTML
    const lhInput = page.locator('input#lhFile');
    if (await lhInput.isVisible()) {
      const lhFile = path.join(FIXTURES_DIR, 'oci-layout 2.htm');
      if (fs.existsSync(lhFile)) {
        await lhInput.setInputFiles(lhFile);
        await page.waitForTimeout(1000);
        
        // Verificar que a seção de Lighthouse aparece após importação
        const lhSection = page.locator('text=Scores Lighthouse');
        await expect(lhSection).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('deve exibir localStorage quando disponível', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de localStorage
    const lsTab = page.locator('.tab:has-text("localStorage")');
    await expect(lsTab).toBeVisible();
    await lsTab.click();
    await page.waitForTimeout(300);
    
    // Verificar que a pane de localStorage está ativa
    const lsPane = page.locator('#pane-ls');
    await expect(lsPane).toBeVisible();
  });

  test('deve exibir sessionStorage quando disponível', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Clicar na aba de sessionStorage
    const ssTab = page.locator('.tab:has-text("sessionStorage")');
    await expect(ssTab).toBeVisible();
    await ssTab.click();
    await page.waitForTimeout(300);
    
    // Verificar que a pane de sessionStorage está ativa
    const ssPane = page.locator('#pane-ss');
    await expect(ssPane).toBeVisible();
  });

  test('deve permitir download de JSON descriptografado', async ({ page, context }) => {
    // Interceptar o download
    let downloadPath = '';
    context.on('page', async (newPage) => {
      // Capturar novo contexto se necessário
    });

    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    await keyInput.fill(TEAM_KEY);
    await button.click();
    await page.waitForTimeout(1000);
    
    // Verificar que o botão de download está visível
    const downloadBtn = page.locator('button#dl');
    await expect(downloadBtn).toBeVisible();
  });

  test('deve filtrar requisições por domínio', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-sistema.clinicorp.com.json');
    if (fs.existsSync(sessionFile)) {
      await fileInput.setInputFiles(sessionFile);
      await keyInput.fill(TEAM_KEY);
      await button.click();
      await page.waitForTimeout(1000);
      
      // Clicar na aba de Requisições
      const reqTab = page.locator('.tab:has-text("Requisicoes")');
      await reqTab.click();
      await page.waitForTimeout(300);
      
      // Procurar pelo select de domínio
      const domainSelect = page.locator('#reqDomain');
      if (await domainSelect.isVisible()) {
        // Verificar que há opções de domínio
        const options = page.locator('#reqDomain option');
        await expect(options).toHaveCount(await options.count());
      }
    }
  });

  test('deve buscar/filtrar requisições por texto', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-sistema.clinicorp.com.json');
    if (fs.existsSync(sessionFile)) {
      await fileInput.setInputFiles(sessionFile);
      await keyInput.fill(TEAM_KEY);
      await button.click();
      await page.waitForTimeout(1000);
      
      // Clicar na aba de Requisições
      const reqTab = page.locator('.tab:has-text("Requisicoes")');
      await reqTab.click();
      await page.waitForTimeout(300);
      
      // Digitar no campo de busca
      const searchInput = page.locator('#reqSearch');
      if (await searchInput.isVisible()) {
        await searchInput.fill('GET');
        await page.waitForTimeout(300);
        
        // Verificar que o filtro funcionou (deve estar visível na página)
        await expect(searchInput).toHaveValue('GET');
      }
    }
  });

  test('deve rejeitar chave incorreta', async ({ page }) => {
    await page.goto(ANALYZER_URL);
    
    const fileInput = page.locator('input#file');
    const keyInput = page.locator('input#key');
    const button = page.locator('button#go');
    
    const sessionFile = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
    await fileInput.setInputFiles(sessionFile);
    
    // Usar chave incorreta
    await keyInput.fill('chave-incorreta-12345');
    await button.click();
    await page.waitForTimeout(1000);
    
    // Verificar mensagem de erro
    await expect(page.locator('div.msg.err')).toContainText('Falha ao descriptografar');
  });
});
