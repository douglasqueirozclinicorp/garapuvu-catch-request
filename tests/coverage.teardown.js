// Global teardown: junta o cache dos workers e gera o coverage/lcov.info (só com COVERAGE=1).
import { CoverageReport } from 'monocart-coverage-reports';
import { coverageOptions } from './coverage.js';

export default async () => {
  if (process.env.COVERAGE) {
    const report = new CoverageReport(coverageOptions);
    await report.generate();
  }
};
