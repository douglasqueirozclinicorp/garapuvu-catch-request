#!/usr/bin/env node
// Roda as auditorias de seguranca, consolida num HTML e abre no navegador.
// Uso: node scripts/security-report.mjs   (ou: npm run audit:report)
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { platform } from 'node:os';

const OUT_DIR = '.security';
const OUT_HTML = `${OUT_DIR}/report.html`;
mkdirSync(OUT_DIR, { recursive: true });

// gitleaks NAO e um pacote npm — e um binario de sistema (Go).
// Instale com: brew install gitleaks  (ou veja github.com/gitleaks/gitleaks)
try {
  execSync('gitleaks version', { stdio: 'ignore' });
} catch {
  console.error('\n✗ gitleaks nao encontrado. Ele nao vem do npm — instale o binario:');
  console.error('    brew install gitleaks\n');
  process.exit(1);
}

// Executa um comando e devolve stdout; nao aborta se o exit code for != 0
// (gitleaks/eslint saem com codigo de erro quando ACHAM problemas).
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    return e.stdout || '';
  }
}

function readJson(path) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
  } catch {
    return [];
  }
}

console.log('→ gitleaks (working tree)...');
run(`gitleaks detect --no-git --source . --report-format json --report-path ${OUT_DIR}/gl-worktree.json`);
console.log('→ gitleaks (historico git)...');
run(`gitleaks detect --source . --report-format json --report-path ${OUT_DIR}/gl-history.json`);
console.log('→ npm audit...');
const auditRaw = run('npm audit --json');

const worktree = readJson(`${OUT_DIR}/gl-worktree.json`);
const history = readJson(`${OUT_DIR}/gl-history.json`);
let audit = { vulnerabilities: {}, metadata: { vulnerabilities: {} } };
try { audit = JSON.parse(auditRaw); } catch { /* sem saida valida */ }

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const sev = (rule) =>
  ['generic-api-key', 'senha-hardcoded', 'credencial-usuario'].includes(rule) ? 'crit'
  : rule.includes('gcp') ? 'warn' : 'info';

const rows = (data, withCommit = false) =>
  data.map((x) => {
    const commit = withCommit ? `<td class="mono">${esc((x.Commit || '').slice(0, 8))}</td>` : '';
    return `<tr class="${sev(x.RuleID)}"><td class="rule">${esc(x.RuleID)}</td>` +
      `<td class="mono">${esc(x.File)}:${x.StartLine}</td>${commit}` +
      `<td class="mono secret">${esc(x.Secret)}</td></tr>`;
  }).join('') || '<tr><td colspan="4" class="ok">Nenhum achado ✓</td></tr>';

const vulns = audit.metadata?.vulnerabilities || {};
const totalVulns = Object.entries(vulns).filter(([k]) => k !== 'total').reduce((a, [, v]) => a + v, 0);

const html = `<!doctype html><html lang=pt-br><head><meta charset=utf-8>
<title>Relatorio de seguranca — garapuvu-catch-request</title>
<style>
body{font-family:-apple-system,Segoe UI,sans-serif;margin:0;background:#0f1117;color:#e6e6e6;padding:32px}
h1{font-size:22px} h2{margin-top:36px;border-bottom:1px solid #333;padding-bottom:8px}
.sub{color:#9aa0aa;font-size:13px;margin-top:-8px}
table{border-collapse:collapse;width:100%;margin-top:12px;font-size:13px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #22252e;vertical-align:top}
th{color:#9aa0aa;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
.mono{font-family:ui-monospace,Menlo,monospace} .secret{color:#ff8a8a} .rule{font-weight:600}
.ok{color:#7ee787;text-align:center;padding:16px}
tr.crit td.rule{color:#ff5c5c} tr.warn td.rule{color:#ffb454} tr.info td.rule{color:#7aa2f7}
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:12px;margin-right:6px}
.b-crit{background:#3a1414;color:#ff8a8a} .b-warn{background:#3a2f14;color:#ffcf7a} .b-ok{background:#14321a;color:#7ee787}
.note{background:#141821;border-left:3px solid #7aa2f7;padding:12px 16px;margin-top:16px;font-size:13px;border-radius:4px}
</style></head><body>
<h1>🔒 Relatorio de seguranca</h1>
<p class=sub>garapuvu-catch-request · gerado localmente (contem segredos — nao versionado)</p>
<p>
<span class="badge b-crit">${worktree.length} secrets (working tree)</span>
<span class="badge b-crit">${history.length} secrets (historico)</span>
<span class="badge ${totalVulns ? 'b-warn' : 'b-ok'}">${totalVulns} vulnerabilidades de deps</span>
</p>

<h2>1 · Secrets — working tree (${worktree.length})</h2>
<table><tr><th>Regra</th><th>Local</th><th>Valor exposto</th></tr>${rows(worktree)}</table>

<h2>2 · Secrets — historico do git (${history.length})</h2>
<p class=sub>Apagar dos arquivos atuais NAO remove daqui.</p>
<table><tr><th>Regra</th><th>Local</th><th>Commit</th><th>Valor exposto</th></tr>${rows(history, true)}</table>

<h2>3 · Dependencias — npm audit</h2>
<p class=sub>${totalVulns
    ? `${totalVulns} vulnerabilidades: ` + Object.entries(vulns).filter(([k]) => k !== 'total').map(([k, v]) => `${v} ${k}`).join(', ')
    : 'Nenhuma vulnerabilidade conhecida ✓'}</p>

<div class=note><b>Rode com:</b> <code>npm run audit:report</code>. Lembre: TEAM_KEY e senha expostas em texto claro devem ser tratadas como comprometidas — rotacione.</div>
</body></html>`;

writeFileSync(OUT_HTML, html);
console.log(`\n✓ Relatorio gerado: ${OUT_HTML}`);

const opener = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open';
run(`${opener} ${OUT_HTML}`);
console.log('✓ Aberto no navegador.');
