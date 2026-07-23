// Arquivo de EXEMPLO (demo) para o SonarQube: DUPLICACAO de codigo.
// Contem dois blocos IDENTICOS e grandes -> sobe duplicated_lines_density
// e dispara S4144 (funcoes com implementacao identica).
// SEM secrets e SEM bugs de proposito, para NAO afetar Security/Reliability.
// Fica fora da cobertura (ver sonar.coverage.exclusions), entao nao derruba
// o coverage. Nao e usado pela aplicacao.

export function resumirRespostasA(items) {
  let total = 0;
  let ok = 0;
  let falha = 0;
  let redirecionamentos = 0;
  for (const item of items) {
    total = total + 1;
    if (item.status >= 500) {
      falha = falha + 1;
    } else if (item.status >= 300 && item.status < 400) {
      redirecionamentos = redirecionamentos + 1;
    } else {
      ok = ok + 1;
    }
  }
  const taxaOk = total === 0 ? 0 : (ok / total) * 100;
  const taxaFalha = total === 0 ? 0 : (falha / total) * 100;
  const taxaRedir = total === 0 ? 0 : (redirecionamentos / total) * 100;
  return { total, ok, falha, redirecionamentos, taxaOk, taxaFalha, taxaRedir };
}

export function resumirRespostasB(items) {
  let total = 0;
  let ok = 0;
  let falha = 0;
  let redirecionamentos = 0;
  for (const item of items) {
    total = total + 1;
    if (item.status >= 500) {
      falha = falha + 1;
    } else if (item.status >= 300 && item.status < 400) {
      redirecionamentos = redirecionamentos + 1;
    } else {
      ok = ok + 1;
    }
  }
  const taxaOk = total === 0 ? 0 : (ok / total) * 100;
  const taxaFalha = total === 0 ? 0 : (falha / total) * 100;
  const taxaRedir = total === 0 ? 0 : (redirecionamentos / total) * 100;
  return { total, ok, falha, redirecionamentos, taxaOk, taxaFalha, taxaRedir };
}
