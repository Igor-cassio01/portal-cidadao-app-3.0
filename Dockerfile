# Usar imagem Python oficial
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências do backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copiar código do backend
COPY backend/src ./backend/src

# Copiar arquivos estáticos do frontend (já compilados no ZIP)
# No ZIP, eles estão em backend/src/static
# O comando COPY preserva a estrutura se os arquivos existirem localmente
COPY backend/src/static ./backend/src/static

# Criar diretórios necessários e garantir permissões
RUN mkdir -p backend/src/database backend/src/static/uploads && \
    chmod -R 777 backend/src/static/uploads

# Variáveis de ambiente
ENV FLASK_APP=backend/src/main.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expor porta
EXPOSE 10000

# Comando para iniciar usando o módulo correto
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:10000", "backend.src.main:app"]
