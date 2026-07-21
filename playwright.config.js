import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * Config unica do Garapuvu (ESM, pois o package.json usa "type": "module").
 *
 * - Sobe um servidor HTTP local (python3) e serve os arquivos estaticos do projeto;
 *   os testes acessam a interface via http://localhost:PORT (mais fiel que file://).
 * - A chave do time vem de process.env.TEAM_KEY (arquivo .env, nao versionado).
 * - SLOWMO=<ms> desacelera as acoes do navegador (usado no script test:headed).
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const PORT = Number(process.env.PORT) || 8000;
const SLOWMO = Number(process.env.SLOWMO) || 0;

export default defineConfig({
  testDir: './tests',
  /* Roda os arquivos de teste em paralelo. */
  fullyParallel: true,
  /* Falha o build no CI se sobrar um test.only no codigo. */
  forbidOnly: !!process.env.CI,
  /* Retenta apenas no CI. */
  retries: process.env.CI ? 2 : 0,
  /* 1 worker no CI para estabilidade. */
  workers: process.env.CI ? 1 : undefined,
  /* Relatorio HTML (abra com: npm run test:report). */
  reporter: 'html',

  /* Configuracoes compartilhadas por todos os projetos. */
  use: {
    /* Base para page.goto('/...'). Servida pelo webServer abaixo. */
    baseURL: `http://localhost:${PORT}`,
    /* Coleta trace ao reexecutar um teste que falhou. */
    trace: 'on-first-retry',
    /* Screenshot apenas quando o teste falha. */
    screenshot: 'only-on-failure',
    /* Desacelera as acoes quando SLOWMO estiver definido (ver test:headed). */
    launchOptions: { slowMo: SLOWMO },
  },

  /* Navegadores testados. */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  /* Sobe um servidor estatico local antes dos testes e reaproveita se ja estiver no ar. */
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
