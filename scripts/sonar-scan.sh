#!/usr/bin/env bash
# Roda o sonar-scanner contra o SonarQube local (Connected Mode).
# Resolve o Java 21 (o scanner quebra em JDK novos) e le o token do .env.
set -euo pipefail

# 1) sonar-scanner instalado?
if ! command -v sonar-scanner >/dev/null 2>&1; then
  echo "✗ sonar-scanner nao instalado. Rode: brew install sonar-scanner"
  exit 1
fi

# 2) Java 21 (o scanner quebra em JDK 26 E em JDK 11 -> 'NoClassDefFoundError: bouncycastle').
#    Prioriza o caminho direto do brew; /usr/libexec/java_home -v 21 nao e' confiavel
#    (pode devolver outra versao se a 21 nao estiver registrada no sistema).
JH="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
if [ ! -d "$JH" ]; then
  JH="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
fi
if [ -z "$JH" ] || [ ! -d "$JH" ]; then
  echo "✗ Java 21 nao encontrado. Rode: brew install openjdk@21"
  exit 1
fi
export JAVA_HOME="$JH"

# 3) Carrega SONAR_HOST_URL / SONAR_TOKEN do .env (nao versionado)
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi
: "${SONAR_HOST_URL:=http://localhost:9000}"

if [ -z "${SONAR_TOKEN:-}" ]; then
  echo "✗ SONAR_TOKEN nao definido. Adicione no .env: SONAR_TOKEN=squ_..."
  exit 1
fi

# 4) Servidor no ar?
if ! curl -sf "${SONAR_HOST_URL}/api/system/status" >/dev/null 2>&1; then
  echo "✗ SonarQube nao responde em ${SONAR_HOST_URL}."
  echo "  Suba com: docker start sonarqube   (ou veja o README)"
  exit 1
fi

# 5) Regenera os relatorios das ferramentas estaticas para o Sonar importar
#    (ESLint -> sonar.eslint.reportPaths ; gitleaks SARIF -> sonar.sarifReportPaths).
mkdir -p .security
echo "→ Gerando relatorio do ESLint..."
npx --no-install eslint . -f json -o .security/eslint-report.json || true
echo "→ Gerando relatorio do gitleaks (SARIF)..."
gitleaks detect --no-git --source . --report-format sarif --report-path .security/gitleaks.sarif >/dev/null 2>&1 || true

echo "→ Analisando (Java 21, servidor ${SONAR_HOST_URL})..."
exec sonar-scanner -Dsonar.host.url="${SONAR_HOST_URL}" -Dsonar.token="${SONAR_TOKEN}"
