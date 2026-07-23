// Coleta de cobertura V8 durante o e2e (Playwright) -> LCOV para o SonarQube.
// Só ativa quando COVERAGE=1 e no Chromium (page.coverage é exclusivo do Chromium).
// Uso: `npm run test:coverage`.
import { test as base } from '@playwright/test';
import { CoverageReport } from 'monocart-coverage-reports';

// Opções compartilhadas (mesmo `name` = mesmo cache entre os workers).
export const coverageOptions = {
  name: 'Garapuvu E2E Coverage',
  outputDir: './coverage',
  reports: [['lcovonly', { file: 'lcov.info' }], ['console-summary']],
  // Só o código do app: scripts inline dos HTML em src/.
  entryFilter: (entry) => entry.url.includes('/src/') && entry.url.includes('garapuvu-'),
  sourceFilter: (sourcePath) => sourcePath.includes('src/'),
  // Normaliza a URL servida (http://localhost:8000/src/...) para caminho relativo do repo.
  sourcePath: (filePath) => {
    const i = filePath.indexOf('src/');
    return i >= 0 ? filePath.slice(i) : filePath;
  },
};

const COVERAGE = !!process.env.COVERAGE;

export const test = base.extend({
  // Fixture automática: liga/desliga a coleta por teste.
  autoCoverage: [
    async ({ page, browserName }, use) => {
      const on = COVERAGE && browserName === 'chromium';
      if (on) {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }
      await use();
      if (on) {
        const coverage = await page.coverage.stopJSCoverage();
        const report = new CoverageReport(coverageOptions);
        await report.add(coverage); // persiste no cache; o teardown junta tudo
      }
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
