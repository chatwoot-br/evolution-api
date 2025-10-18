# Script de teste dos endpoints de health check
#!/bin/bash

# Configuração
BASE_URL="http://localhost:8080"
ENDPOINTS=("/health" "/health/liveness" "/health/readiness" "/health/startup")

echo "🚀 Testando endpoints de health check da Evolution API"
echo "=================================================="

# Função para testar um endpoint
test_endpoint() {
    local endpoint=$1
    local url="${BASE_URL}${endpoint}"
    
    echo "🔍 Testando: ${endpoint}"
    
    # Faz a requisição e captura o status code
    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n1)
    json_response=$(echo "$response" | head -n -1)
    
    echo "📊 Status Code: $status_code"
    
    # Verifica se é um JSON válido e mostra de forma formatada
    if echo "$json_response" | jq . > /dev/null 2>&1; then
        echo "📋 Response:"
        echo "$json_response" | jq .
    else
        echo "❌ Response não é um JSON válido:"
        echo "$json_response"
    fi
    
    echo "---"
}

# Verifica se o curl está instalado
if ! command -v curl &> /dev/null; then
    echo "❌ curl não está instalado. Por favor, instale o curl para executar este teste."
    exit 1
fi

# Verifica se o jq está instalado para formatação JSON
if ! command -v jq &> /dev/null; then
    echo "⚠️ jq não está instalado. A formatação JSON será limitada."
    echo "💡 Para melhor formatação, instale jq: apt-get install jq"
    echo ""
fi

# Testa cada endpoint
for endpoint in "${ENDPOINTS[@]}"; do
    test_endpoint "$endpoint"
done

echo "✅ Teste concluído!"
echo ""
echo "📋 Verificações realizadas:"
echo "   - /health: Health check geral"
echo "   - /health/liveness: Kubernetes liveness probe"
echo "   - /health/readiness: Kubernetes readiness probe" 
echo "   - /health/startup: Kubernetes startup probe"
echo ""
echo "💡 Para usar em produção, configure os probes no Kubernetes conforme:"
echo "   k8s-health-check-example.yaml"
