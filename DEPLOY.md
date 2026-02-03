# Guia de Deploy - Portal Cidadão 3.0

## Opção 1: Deploy Local (Desenvolvimento)

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- pnpm ou npm

### Passos

1. **Instalar dependências do frontend:**
```bash
cd frontend
pnpm install
pnpm build
cd ..
```

2. **Copiar build para backend:**
```bash
rm -rf backend/src/static
cp -r frontend/dist backend/src/static
```

3. **Instalar dependências do backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt
mkdir -p src/database src/static/uploads
```

4. **Executar o servidor:**
```bash
python src/main.py
```

O sistema estará disponível em: http://localhost:5000

## Opção 2: Deploy com Docker

### Pré-requisitos
- Docker
- Docker Compose

### Passos

1. **Build da imagem:**
```bash
docker build -t portal-cidadao:latest .
```

2. **Executar com Docker Compose:**
```bash
docker-compose up -d
```

O sistema estará disponível em: http://localhost:5000

## Opção 3: Deploy em Produção (Heroku)

### Pré-requisitos
- Conta Heroku
- Heroku CLI instalado

### Passos

1. **Login no Heroku:**
```bash
heroku login
```

2. **Criar aplicação:**
```bash
heroku create seu-app-name
```

3. **Deploy:**
```bash
git push heroku main
```

4. **Verificar logs:**
```bash
heroku logs --tail
```

## Credenciais de Teste

### Administrador
- Email: joao.silva@lavras.mg.gov.br
- Senha: admin123

### Cidadão
- Email: cidadao1@email.com
- Senha: 123456

### Prestador de Serviço
- Email: prestador@email.com
- Senha: 123456

## Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=sua-chave-secreta-aqui
JWT_SECRET_KEY=sua-jwt-secret-aqui
DATABASE_URL=postgresql://user:password@localhost/portal_cidadao
```

## Troubleshooting

### Erro: "Port 5000 already in use"
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Erro: "Database locked"
Remova o arquivo `backend/src/database/app.db` e reinicie.

### Erro: "Static files not found"
Certifique-se de que o build do frontend foi copiado para `backend/src/static`.

## Monitoramento

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Logs
```bash
# Local
tail -f backend/src/logs/app.log

# Docker
docker logs -f <container-id>

# Heroku
heroku logs --tail
```

## Performance

### Recomendações
- Use CDN para servir arquivos estáticos
- Implemente caching com Redis
- Use load balancer (Nginx)
- Configure backups automáticos do banco de dados

### Monitoramento
- Implemente APM (New Relic, DataDog)
- Configure alertas
- Monitore uso de CPU/Memória
