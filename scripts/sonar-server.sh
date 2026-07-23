#!/usr/bin/env bash
# Gerencia o servidor SonarQube local via Docker.
# Uso: bash scripts/sonar-server.sh [up|down|status]
set -euo pipefail

NAME=sonarqube
IMAGE=sonarqube:community
PORT=9000
CMD="${1:-status}"

case "$CMD" in
  up|start)
    if ! docker info >/dev/null 2>&1; then
      echo "✗ Docker nao esta rodando. Abra o Docker Desktop e tente de novo."
      exit 1
    fi
    if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
      docker start "$NAME" >/dev/null && echo "→ Container '$NAME' iniciado."
    else
      echo "→ Container nao existe; criando (baixa a imagem na 1a vez)..."
      docker run -d --name "$NAME" -p "${PORT}:9000" \
        -v sonarqube_data:/opt/sonarqube/data \
        -v sonarqube_logs:/opt/sonarqube/logs \
        -v sonarqube_extensions:/opt/sonarqube/extensions \
        "$IMAGE" >/dev/null
      echo "→ Container '$NAME' criado."
    fi
    printf "→ Aguardando o SonarQube ficar UP"
    for _ in $(seq 1 48); do
      S=$(curl -s "http://localhost:${PORT}/api/system/status" 2>/dev/null | grep -o '"status":"[A-Z]*"' | cut -d'"' -f4 || true)
      if [ "$S" = "UP" ]; then echo " ✓  -> http://localhost:${PORT}"; exit 0; fi
      printf "."; sleep 5
    done
    echo " (ainda inicializando; acompanhe em http://localhost:${PORT})"
    ;;
  down|stop)
    docker stop "$NAME" >/dev/null && echo "→ Container '$NAME' parado (dados preservados nos volumes)."
    ;;
  status)
    docker ps -a --filter "name=$NAME" --format "{{.Names}} | {{.Status}} | {{.Ports}}" || true
    ;;
  *)
    echo "uso: bash scripts/sonar-server.sh [up|down|status]"
    exit 1
    ;;
esac
