"""
Configuração do Gunicorn para Portal do Cidadão
Servidor de produção otimizado
"""

import multiprocessing

# Endereço e porta
bind = "0.0.0.0:5000"

# Workers (processos)
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000

# Timeout
timeout = 120
keepalive = 5

# Logs
accesslog = "/tmp/gunicorn_access.log"
errorlog = "/tmp/gunicorn_error.log"
loglevel = "info"

# Daemon
daemon = False

# Reload automático (desabilitar em produção real)
reload = False

# Preload da aplicação
preload_app = True

# Configurações de segurança
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

