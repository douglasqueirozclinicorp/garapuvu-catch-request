import { test, expect } from './coverage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
// A interface e servida pelo webServer (ver playwright.config.js); baseURL = http://localhost:PORT
const ANALYZER_PATH = '/src/garapuvu-analisador-requests.html';
const TEAM_KEY = process.env.TEAM_KEY;

// Fixtures
const SESSION_SEG = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-seguranca.json');
const SESSION_SIS = path.join(FIXTURES_DIR, 'garapuvu-sessao-TESTE-sistema.clinicorp.com.json');
const ZAP_REPORT = path.join(FIXTURES_DIR, '2026-07-21-ZAP-Report-.html');
const PAGESPEED_REPORT = path.join(FIXTURES_DIR, 'pagespeed-report-login.htm');
const LH_JSON = path.join(FIXTURES_DIR, 'lighthouse-devtools-login.json');

test.beforeAll(() => {
  if (!TEAM_KEY) {
    throw new Error(
      'TEAM_KEY nao definida. Copie .env.example para .env e preencha a chave do time (cp .env.example .env).'
    );
  }
});

/** Abre o analisador, carrega a sessao e descriptografa. Prefere data-testid. */
async function abrirEDescriptografar(page, sessionFile = SESSION_SEG) {
  await page.goto(ANALYZER_PATH);
  await page.getByTestId('input-file').setInputFiles(sessionFile);
  await page.getByTestId('input-key').fill(TEAM_KEY);
  await page.getByTestId('btn-analisar').click();
  await expect(page.getByTestId('msg')).toContainText('Descriptografado com sucesso');
  await expect(page.getByTestId('viewer')).toBeVisible();
}

/** Descriptografa e vai direto para a aba Performance com um relatorio Lighthouse JSON importado. */
async function importarLighthouseJson(page) {
  await abrirEDescriptografar(page);
  await page.getByTestId('tab-perf').click();
  await page.getByTestId('input-lh-json').setInputFiles(LH_JSON);
  await expect(page.locator('text=Scores Lighthouse')).toBeVisible({ timeout: 5000 });
}

test.describe('Garapuvu — Onboarding e interface inicial', () => {
  test('deve exibir o guia de 3 passos e a ajuda de importacao', async ({ page }) => {
    await page.goto(ANALYZER_PATH);
    await expect(page.locator('h1')).toContainText('Analisador de requests');

    // Guia de 3 passos visivel logo ao abrir (reduz confusao)
    const steps = page.getByTestId('steps');
    await expect(steps).toBeVisible();
    await expect(steps.locator('.step')).toHaveCount(3);

    // Ajuda de importacao (OWASP/PageSpeed/Lighthouse) disponivel e expansivel
    const help = page.getByTestId('help-imports');
    await expect(help).toBeVisible();
    await expect(help).toContainText('OWASP ZAP');
    await expect(help).toContainText('Lighthouse');
    await expect(help).toContainText('PageSpeed');
    await help.locator('summary').click();
    await expect(help).toContainText('Save as JSON');
  });

  test('deve manter o botao Analisar desabilitado sem arquivo e chave', async ({ page }) => {
    await page.goto(ANALYZER_PATH);
    await expect(page.getByTestId('btn-analisar')).toBeDisabled();
  });

  test('deve ativar o botao Analisar quando arquivo e chave sao preenchidos', async ({ page }) => {
    await page.goto(ANALYZER_PATH);
    const go = page.getByTestId('btn-analisar');
    await page.getByTestId('input-file').setInputFiles(SESSION_SEG);
    await expect(page.getByTestId('msg')).toContainText('Arquivo carregado');
    await expect(go).toBeDisabled();
    await page.getByTestId('input-key').fill(TEAM_KEY);
    await expect(go).toBeEnabled();
  });

  test('deve rejeitar chave incorreta', async ({ page }) => {
    await page.goto(ANALYZER_PATH);
    await page.getByTestId('input-file').setInputFiles(SESSION_SEG);
    await page.getByTestId('input-key').fill('chave-incorreta-12345');
    await page.getByTestId('btn-analisar').click();
    await expect(page.getByTestId('msg')).toContainText('Falha ao descriptografar');
  });
});

test.describe('Garapuvu — Descriptografia e navegacao', () => {
  test('deve descriptografar e exibir os metadados da sessao', async ({ page }) => {
    await abrirEDescriptografar(page);
    await expect(page.locator('#metaCard')).toBeVisible();
    await expect(page.locator('div.metagrid')).toContainText('sistema.clinicorp.com');
  });

  test('deve exibir todas as abas de analise', async ({ page }) => {
    await abrirEDescriptografar(page);
    for (const t of ['tab-sec', 'tab-perf', 'tab-req', 'tab-con', 'tab-cook', 'tab-ls', 'tab-ss']) {
      await expect(page.getByTestId(t)).toBeVisible();
    }
  });

  test('deve navegar entre Requisicoes, Console, Cookies e Storage', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-req').click();
    await expect(page.getByTestId('pane-req')).toBeVisible();
    await page.getByTestId('tab-con').click();
    await expect(page.getByTestId('pane-con')).toBeVisible();
    await page.getByTestId('tab-cook').click();
    await expect(page.getByTestId('pane-cook')).toBeVisible();
    await page.getByTestId('tab-ls').click();
    await expect(page.getByTestId('pane-ls')).toBeVisible();
    await page.getByTestId('tab-ss').click();
    await expect(page.getByTestId('pane-ss')).toBeVisible();
  });

  test('deve filtrar requisicoes por texto', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-req').click();
    const search = page.locator('#reqSearch');
    if (await search.isVisible()) {
      await search.fill('login');
      await expect(search).toHaveValue('login');
      await expect(page.locator('#reqCount')).toBeVisible();
    }
  });

  test('deve permitir baixar o JSON descriptografado', async ({ page }) => {
    await abrirEDescriptografar(page);
    const dl = page.getByTestId('btn-download');
    await expect(dl).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await dl.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('garapuvu-sessao-DECIFRADA');
  });

  test('deve filtrar requisicoes por dominio na sessao de sistema', async ({ page }) => {
    test.skip(!fs.existsSync(SESSION_SIS), 'fixture de sistema ausente');
    await abrirEDescriptografar(page, SESSION_SIS);
    await page.getByTestId('tab-req').click();
    const domain = page.locator('#reqDomain');
    if (await domain.isVisible()) {
      await expect(page.locator('#reqDomain option')).not.toHaveCount(0);
    }
  });
});

test.describe('Garapuvu — Seguranca', () => {
  test('deve exibir o scan consolidado com pills de severidade', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-sec').click();
    await expect(page.locator('#pane-sec .secsummary')).toBeVisible();
    await expect(page.locator('#pane-sec .sevpill').first()).toBeVisible();
  });

  test('deve exibir o caca-credenciais com valores mascarados', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-sec').click();
    await expect(page.locator('.credbox')).toBeVisible();
    const reveal = page.locator('[data-cv]');
    if (await reveal.count()) {
      const masked = await page.locator('#cv-0').first().textContent();
      expect(masked).toMatch(/\*+/);
    }
  });

  test('deve importar um relatorio OWASP ZAP (HTML) e consolidar alertas', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-sec').click();
    const zap = page.getByTestId('input-zap');
    await expect(zap).toBeAttached();
    expect(fs.existsSync(ZAP_REPORT)).toBeTruthy();
    await zap.setInputFiles(ZAP_REPORT);
    await expect(page.getByTestId('pane-sec')).toContainText('OWASP ZAP', { timeout: 5000 });
  });
});

test.describe('Garapuvu — Performance (PageSpeed / Lighthouse)', () => {
  test('deve mostrar os dois botoes de import e o botao online do PageSpeed', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-perf').click();
    await expect(page.getByTestId('btn-import-lh-json')).toBeVisible();
    await expect(page.getByTestId('btn-import-lh-html')).toBeVisible();
    await expect(page.getByTestId('btn-pagespeed')).toBeVisible();
    await expect(page.getByTestId('input-perf-url')).toBeVisible();
  });

  test('deve importar o HTML do PageSpeed', async ({ page }) => {
    await abrirEDescriptografar(page);
    await page.getByTestId('tab-perf').click();
    const lh = page.getByTestId('input-lh-html');
    expect(await lh.getAttribute('accept')).toContain('htm');
    expect(fs.existsSync(PAGESPEED_REPORT)).toBeTruthy();
    await lh.setInputFiles(PAGESPEED_REPORT);
    await expect(page.locator('text=Scores Lighthouse')).toBeVisible({ timeout: 5000 });
  });

  test('deve importar o JSON do Lighthouse (DevTools) com scores reais', async ({ page }) => {
    await importarLighthouseJson(page);
    // A fixture tem Performance=27 (score real)
    await expect(page.locator('#pane-perf .scorecard .ring span').first()).toHaveText('27');
    await expect(page.getByTestId('pane-perf')).toContainText('Core Web Vitals');
  });

  test('deve exibir filmstrip e screenshot final ampliavel', async ({ page }) => {
    await importarLighthouseJson(page);

    const film = page.locator('#pane-perf .lh-film img');
    expect(await film.count()).toBeGreaterThan(0);
    expect(await film.first().getAttribute('src')).toContain('data:image');

    const shot = page.getByTestId('lh-shot');
    await expect(shot).toBeVisible();
    await shot.click();
    await expect(page.locator('.lightbox img')).toBeVisible();
    await page.locator('.lightbox').click();
    await expect(page.locator('.lightbox')).toHaveCount(0);
  });

  test('deve navegar no treemap de JavaScript', async ({ page }) => {
    await importarLighthouseJson(page);
    await page.getByTestId('btn-treemap').click();

    const wrap = page.getByTestId('treemap-wrap');
    const tiles = wrap.locator('.tmtile');
    expect(await tiles.count()).toBeGreaterThan(0);

    // Drill-down: um tile com filhos (▸) troca o conteudo e mostra a trilha "Raiz"
    const drillable = wrap.locator('.tmtile:has-text("▸")').first();
    if (await drillable.count()) {
      await drillable.click();
      await expect(wrap.locator('#tmRoot')).toBeVisible();
    }
  });
});
