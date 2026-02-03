# 🚀 Guia de Deploy no Render

## Pré-requisitos

- Conta no [Render.com](https://render.com)
- Repositório Git (GitHub, GitLab, Bitbucket)
- Código do projeto versionado

## Passo 1: Criar Repositório Git

```bash
cd /home/ubuntu/portal-cidadao-app
git remote add origin https://github.com/seu-usuario/portal-cidadao.git
git branch -M main
git push -u origin main
```

## Passo 2: Conectar ao Render

1. Acesse [https://dashboard.render.com](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Selecione seu repositório GitHub
4. Configure:
   - **Name:** portal-cidadao-app
   - **Environment:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt && cd frontend && pnpm install && pnpm build`
   - **Start Command:** `cd backend && gunicorn -w 4 -b 0.0.0.0:10000 src.main:app`
   - **Plan:** Free (ou pago conforme necessário)

## Passo 3: Configurar Variáveis de Ambiente

No Render Dashboard, adicione:

```
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=gere-uma-chave-segura-aqui
JWT_SECRET_KEY=gere-outra-chave-segura-aqui
DATABASE_URL=postgresql://user:pass@host:5432/portal_cidadao
CORS_ORIGINS=https://seu-dominio.com
```

## Passo 4: Criar Banco de Dados PostgreSQL

1. No Render Dashboard, clique em "New +" → "PostgreSQL"
2. Configure:
   - **Name:** portal-cidadao-db
   - **Database:** portal_cidadao
   - **User:** postgres
   - **Plan:** Free

3. Copie a **Internal Database URL** e adicione como `DATABASE_URL`

## Passo 5: Deploy

1. Clique em "Create Web Service"
2. Render fará o build e deploy automaticamente
3. Acesse a URL fornecida (ex: https://portal-cidadao-app.onrender.com)

## Passo 6: Configurar Domínio Personalizado

1. Compre um domínio em (GoDaddy, Namecheap, etc.)
2. No Render, vá para "Settings" → "Custom Domain"
3. Adicione seu domínio
4. Configure os DNS records conforme instruções do Render

## Monitoramento

- **Logs:** Dashboard → Logs
- **Métricas:** Dashboard → Metrics
- **Alertas:** Settings → Notifications

## Troubleshooting

### Erro de Build
```
Verifique requirements.txt e package.json
```

### Erro de Conexão com BD
```
Verifique DATABASE_URL e credenciais PostgreSQL
```

### Erro 502 Bad Gateway
```
Verifique logs e restart do serviço
```

## Backup do Banco de Dados

```bash
pg_dump postgresql://user:pass@host:5432/portal_cidadao > backup.sql
```

## Suporte

Para mais informações: [Render Docs](https://render.com/docs)
