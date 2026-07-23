// Global setup: limpa o cache de cobertura antes da suite (só com COVERAGE=1).
import { CoverageReport } from 'monocart-coverage-reports';
import { coverageOptions } from './coverage.js';

export default async () => {
  if (process.env.COVERAGE) {
    const report = new CoverageReport(coverageOptions);
    report.cleanCache();
  }
};
