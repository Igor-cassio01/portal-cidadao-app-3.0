#!/bin/bash
# Script de inicialização do Portal do Cidadão
# Servidor de produção com Gunicorn

echo "🚀 Iniciando Portal do Cidadão - Servidor de Produção"
echo "=================================================="

# Diretório do backend
cd /home/ubuntu/portal-cidadao-app/backend

# Verificar se o banco de dados existe
if [ ! -f "src/database/app.db" ]; then
    echo "⚠️  Banco de dados não encontrado. Criando..."
    python3.11 -c "from src.main import app; from src.utils.init_database import init_database; init_database(app)"
fi

echo "✅ Banco de dados verificado"
echo ""

# Iniciar Gunicorn
echo "🌐 Iniciando servidor Gunicorn..."
echo "📍 Endereço: http://0.0.0.0:5000"
echo "👥 Workers: $(python3.11 -c 'import multiprocessing; print(multiprocessing.cpu_count() * 2 + 1)')"
echo ""
echo "=================================================="
echo ""

# Executar Gunicorn
exec gunicorn \
    --config gunicorn_config.py \
    --chdir /home/ubuntu/portal-cidadao-app/backend \
    src.main:app

