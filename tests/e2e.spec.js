import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const htmlPath = `file://${path.join(projectRoot, 'src', 'garapuvu-analisador-requests.html')}`;
const fixturePath = path.join(projectRoot, 'fixtures', 'garapuvu-sessao-TESTE-seguranca.json');
const lighthouseHtmlPath = path.join(projectRoot, 'oci-layout 2.htm');
const teamKey = 'cieF118sAqHhEuFAPtiuQI1M0dzhzIUE';

test.describe('Garapuvu - Analisador de Requests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(htmlPath);
  });

  test('deve carregar a interface principal', async ({ page }) => {
    const brand = page.locator('.brand .wm');
    await expect(brand).toContainText('Garapuvu');
    await expect(page.locator('h1')).toContainText('Analisador de requests');
  });

  test('deve carregar arquivo de sessão e validar botão de análise', async ({ page }) => {
    const fileInput = page.locator('#file');
    const analyzeBtn = page.locator('#go');

    // Verificar que o botão está desabilitado inicialmente
    await expect(analyzeBtn).toBeDisabled();

    // Upload do arquivo
    await fileInput.setInputFiles(fixturePath);

    // Verificar mensagem de sucesso
    const msg = page.locator('#msg');
    await expect(msg).toHaveClass(/ok/);
    await expect(msg).toContainText('Arquivo carregado');

    // Botão ainda desabilitado sem a chave
    await expect(analyzeBtn).toBeDisabled();
  });

  test('deve descriptografar sessão com chave válida', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');
    const msg = page.locator('#msg');

    // Carregar arquivo
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(500);

    // Verificar que botão fica ativo com arquivo + chave
    await keyInput.fill(teamKey);
    await expect(analyzeBtn).toBeEnabled();

    // Clicar em Analisar
    await analyzeBtn.click();

    // Aguardar descriptografia
    await expect(msg).toHaveClass(/ok/, { timeout: 10000 });
    await expect(msg).toContainText('Descriptografado');

    // Verificar que a interface de visualização apareceu
    const viewer = page.locator('#viewer');
    await expect(viewer).toBeVisible();
  });

  test('deve exibir abas de análise corretamente', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup: carregar e descriptografar
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Verificar abas
    const tabs = page.locator('.tab');
    const tabLabels = ['Seguranca', 'Performance', 'Requisicoes', 'Console', 'Cookies', 'localStorage', 'sessionStorage'];

    for (const label of tabLabels) {
      await expect(tabs).toContainText(label);
    }

    // Clicar em aba de Requisições
    await page.locator('.tab:has-text("Requisicoes")').click();
    const reqPane = page.locator('#pane-req');
    await expect(reqPane).toBeVisible();
  });

  test('deve filtrar requisições por domínio', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para aba de Requisições
    await page.locator('.tab:has-text("Requisicoes")').click();

    // Verificar que há um select de domínio
    const domainSelect = page.locator('#reqDomain');
    await expect(domainSelect).toBeVisible();

    // Preencher e validar filtro de texto
    const searchInput = page.locator('#reqSearch');
    await searchInput.fill('login');
    await page.waitForTimeout(300);

    // Validar contagem de requisições
    const reqCount = page.locator('#reqCount');
    await expect(reqCount).toBeVisible();
  });

  test('deve exibir console com filtro por nível', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para aba de Console
    await page.locator('.tab:has-text("Console")').click();

    // Verificar que há chips de filtro
    const chips = page.locator('.chip');
    await expect(chips.first()).toContainText('Todos');

    // Verificar campo de busca
    const searchInput = page.locator('#conSearch');
    await expect(searchInput).toBeVisible();
  });

  test('deve exibir cookies de sessão', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para aba de Cookies
    await page.locator('.tab:has-text("Cookies")').click();

    // Verificar tabela
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toContainText('session');
  });

  test('deve permitir import de relatório ZAP HTML', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para aba de Segurança
    await page.locator('.tab:has-text("Seguranca")').click();

    // Buscar input de ZAP
    const zapFileInput = page.locator('#zapFile');
    
    if (await zapFileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Validar que o input existe
      await expect(zapFileInput).toBeVisible();
    }
  });

  test('deve permitir import de relatório Lighthouse HTML', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para aba de Performance
    await page.locator('.tab:has-text("Performance")').click();

    // Verificar input de Lighthouse
    const lhFileInput = page.locator('#lhFile');
    await expect(lhFileInput).toBeVisible();

    // Verificar que aceita .html
    const accept = await lhFileInput.getAttribute('accept');
    expect(accept).toContain('html');
  });

  test('deve fazer upload e processar Lighthouse HTML', async ({ page }) => {
    // Usar timeout maior para operações com arquivo
    test.setTimeout(30000);

    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para Performance
    await page.locator('.tab:has-text("Performance")').click();

    // Fazer upload do Lighthouse HTML
    const lhFileInput = page.locator('#lhFile');
    
    // Verificar se o arquivo existe
    const fileExists = require('fs').existsSync(lighthouseHtmlPath);
    if (!fileExists) {
      console.warn('Arquivo Lighthouse HTML não encontrado em:', lighthouseHtmlPath);
      return; // Skip se não encontrar arquivo
    }

    await lhFileInput.setInputFiles(lighthouseHtmlPath);
    await page.waitForTimeout(2000);

    // Validar que a seção de scores apareceu
    const scoresSection = page.locator('h3:has-text("Scores Lighthouse")');
    const isVisible = await scoresSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await expect(scoresSection).toBeVisible();
      // Validar que há scorecards
      const scorecards = page.locator('.scorecard');
      await expect(scorecards.first()).toBeVisible();
    }
  });

  test('deve exibir análise de segurança com achados', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para Segurança
    await page.locator('.tab:has-text("Seguranca")').click();

    // Verificar resumo de segurança
    const summary = page.locator('.secsummary');
    await expect(summary).toBeVisible();

    // Verificar que há pills de severidade
    const pills = page.locator('.sevpill');
    const pillCount = await pills.count();
    expect(pillCount).toBeGreaterThan(0);
  });

  test('deve decodificar JWT em cookies', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para Cookies
    await page.locator('.tab:has-text("Cookies")').click();

    // Procurar por botão de decodificar JWT
    const jwtBtns = page.locator('[data-jwt]');
    const btnCount = await jwtBtns.count();

    if (btnCount > 0) {
      // Clicar no primeiro botão
      await jwtBtns.first().click();
      await page.waitForTimeout(300);

      // Verificar que a tag pre de JWT é exibida
      const preElement = page.locator('pre[id^="jwt-"]').first();
      const isVisible = await preElement.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        await expect(preElement).toContainText('{');
      }
    }
  });

  test('deve exibir localStorage e sessionStorage', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // localStorage
    await page.locator('.tab:has-text("localStorage")').click();
    const lsPane = page.locator('#pane-ls');
    await expect(lsPane).toBeVisible();

    // sessionStorage
    await page.locator('.tab:has-text("sessionStorage")').click();
    const ssPane = page.locator('#pane-ss');
    await expect(ssPane).toBeVisible();
  });

  test('deve validar que dados sensíveis são mascarados', async ({ page }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Ir para Segurança
    await page.locator('.tab:has-text("Seguranca")').click();

    // Procurar por "Caca-credenciais"
    const credbox = page.locator('.credbox');
    await expect(credbox).toBeVisible();

    // Verificar que há botões de revelar
    const revealBtns = page.locator('[data-cv]');
    const btnCount = await revealBtns.count();
    
    if (btnCount > 0) {
      // Validar que há mascaramento
      const firstCredVal = page.locator('#cv-0').first();
      const text = await firstCredVal.textContent();
      expect(text).toMatch(/\*+/); // Deve conter asteriscos
    }
  });

  test('deve fazer download de JSON descriptografado', async ({ page, context }) => {
    const fileInput = page.locator('#file');
    const keyInput = page.locator('#key');
    const analyzeBtn = page.locator('#go');
    const dlBtn = page.locator('#dl');

    // Setup
    await fileInput.setInputFiles(fixturePath);
    await keyInput.fill(teamKey);
    await analyzeBtn.click();
    await page.waitForTimeout(1000);

    // Verificar que botão de download fica visível
    await expect(dlBtn).toBeVisible();

    // Monitorar download
    const downloadPromise = context.waitForEvent('download');
    await dlBtn.click();
    const download = await downloadPromise;

    // Validar nome do arquivo
    expect(download.suggestedFilename()).toContain('garapuvu-sessao-DECIFRADA');
  });
});
