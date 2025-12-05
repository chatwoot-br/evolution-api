#!/bin/bash

# Evolution API - Health Check Test Runner
# Este script facilita a execução de testes dos health checks

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para print colorido
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar dependências
check_dependencies() {
    print_status "Verificando dependências..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq não encontrado. Saída JSON não será formatada."
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Dependências faltando: ${missing_deps[*]}"
        print_error "Por favor, instale as dependências antes de continuar."
        exit 1
    fi
    
    print_success "Todas as dependências encontradas!"
}

# Função para build da aplicação
build_app() {
    print_status "Compilando aplicação..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado. Execute este script na raiz do projeto."
        exit 1
    fi
    
    npm run build
    print_success "Aplicação compilada com sucesso!"
}

# Função para rodar com Docker Compose
run_with_docker() {
    print_status "Iniciando ambiente com Docker Compose..."
    
    # Para containers existentes
    docker-compose -f docker-compose.health-test.yml down --remove-orphans
    
    # Inicia os serviços
    docker-compose -f docker-compose.health-test.yml up -d postgres redis
    
    print_status "Aguardando dependências ficarem saudáveis..."
    docker-compose -f docker-compose.health-test.yml up --wait postgres redis
    
    print_status "Iniciando Evolution API..."
    docker-compose -f docker-compose.health-test.yml up -d evolution-api
    
    print_status "Aguardando API ficar saudável..."
    
    # Aguarda API ficar disponível
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:8080/health/liveness > /dev/null 2>&1; then
            print_success "API está respondendo!"
            break
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Timeout aguardando API ficar disponível"
        print_error "Logs da API:"
        docker-compose -f docker-compose.health-test.yml logs evolution-api
        exit 1
    fi
    
    echo ""
    print_success "Ambiente Docker iniciado com sucesso!"
}

# Função para testar endpoints
test_endpoints() {
    print_status "Testando endpoints de health check..."
    
    local base_url="http://localhost:8080"
    local endpoints=("/health" "/health/liveness" "/health/readiness" "/health/startup")
    local failed_tests=()
    
    for endpoint in "${endpoints[@]}"; do
        print_status "Testando: ${endpoint}"
        
        local response
        local status_code
        
        response=$(curl -s -w "\n%{http_code}" "${base_url}${endpoint}")
        status_code=$(echo "$response" | tail -n1)
        local json_response=$(echo "$response" | head -n -1)
        
        echo "   Status Code: $status_code"
        
        if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 503 ]; then
            if command -v jq &> /dev/null; then
                echo "   Response:"
                echo "$json_response" | jq . | sed 's/^/     /'
            else
                echo "   Response: $json_response"
            fi
            print_success "✅ ${endpoint} OK"
        else
            print_error "❌ ${endpoint} FAILED (Status: $status_code)"
            failed_tests+=("$endpoint")
        fi
        
        echo ""
    done
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_success "🎉 Todos os testes passaram!"
    else
        print_error "❌ Testes falharam: ${failed_tests[*]}"
        return 1
    fi
}

# Função para executar health check test no Docker
run_health_checker() {
    print_status "Executando teste automatizado via Docker..."
    
    docker-compose -f docker-compose.health-test.yml run --rm health-checker
    
    print_success "Teste automatizado concluído!"
}

# Função para mostrar logs
show_logs() {
    print_status "Mostrando logs da Evolution API..."
    docker-compose -f docker-compose.health-test.yml logs -f evolution-api
}

# Função para limpar ambiente
cleanup() {
    print_status "Limpando ambiente Docker..."
    docker-compose -f docker-compose.health-test.yml down --remove-orphans --volumes
    print_success "Ambiente limpo!"
}

# Função para mostrar status do ambiente
show_status() {
    print_status "Status do ambiente:"
    docker-compose -f docker-compose.health-test.yml ps
    
    print_status "Testando conectividade básica..."
    if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
        print_success "✅ API está respondendo"
    else
        print_warning "⚠️ API não está respondendo"
    fi
}

# Função para mostrar ajuda
show_help() {
    echo "Evolution API - Health Check Test Runner"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos:"
    echo "  build       Compila a aplicação"
    echo "  start       Inicia ambiente Docker com dependências"
    echo "  test        Testa endpoints de health check"
    echo "  auto-test   Executa teste automatizado via Docker"
    echo "  full        Executa build + start + test (padrão)"
    echo "  logs        Mostra logs da API"
    echo "  status      Mostra status do ambiente"
    echo "  cleanup     Para e remove containers"
    echo "  help        Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 full      # Execução completa (recomendado)"
    echo "  $0 test      # Apenas testa endpoints (API deve estar rodando)"
    echo "  $0 cleanup   # Limpa ambiente Docker"
}

# Função principal
main() {
    local command=${1:-full}
    
    case $command in
        "build")
            check_dependencies
            build_app
            ;;
        "start")
            check_dependencies
            run_with_docker
            ;;
        "test")
            check_dependencies
            test_endpoints
            ;;
        "auto-test")
            check_dependencies
            run_health_checker
            ;;
        "full")
            check_dependencies
            build_app
            run_with_docker
            test_endpoints
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Comando desconhecido: $command"
            show_help
            exit 1
            ;;
    esac
}

# Trap para cleanup em caso de interrupção
trap 'print_warning "Interrompido pelo usuário"; exit 130' INT

# Executa função principal
main "$@"
