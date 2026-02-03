# 🚀 Instalação Rápida - Portal do Cidadão

## ⚡ Guia de 5 Minutos

### 1️⃣ Extrair o Projeto
```bash
unzip portal-cidadao-completo.zip
cd portal-cidadao-app
```

### 2️⃣ Configurar Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt
mkdir -p src/database src/static/uploads
```

### 3️⃣ Configurar Frontend
```bash
cd ../frontend
npm install
npm run build
```

### 4️⃣ Copiar Frontend para Backend
```bash
cd ..
rm -rf backend/src/static
cp -r frontend/dist backend/src/static
```

### 5️⃣ Executar o Sistema
```bash
cd backend
source venv/bin/activate
python src/main.py
```

**Pronto!** Acesse: `http://localhost:5000`

---

## 👤 Login de Teste

### Administrador:
- **Email:** joao.silva@lavras.mg.gov.br
- **Senha:** admin123

### Cidadão:
- **Email:** cidadao1@email.com
- **Senha:** 123456

---

## 📊 Recursos Principais

### Para Gestores:
1. **Dashboard Estratégico** - Clique no menu "Dashboard Estratégico" (badge NOVO)
2. **Métricas Políticas** - Índice de Satisfação, Taxa de Resolução
3. **Análise por Bairros** - Top 5 bairros prioritários
4. **Material de Campanha** - Posts e frases prontos para redes sociais

### Para Cidadãos:
1. **Relatar Problema** - Clique em "Nova Ocorrência"
2. **Acompanhar** - Veja o status em "Minhas Ocorrências"
3. **Avaliar** - Avalie serviços resolvidos

---

## 🔧 Troubleshooting

### Erro: "Module not found"
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Erro: "Port 5000 already in use"
```bash
# Matar processo na porta 5000
sudo lsof -ti:5000 | xargs kill -9
```

### Banco de dados vazio
```bash
# Deletar banco e recriar
cd backend
rm -f src/database/app.db
python src/main.py
# O sistema criará automaticamente 1000 ocorrências de demonstração
```

---

## 📝 Estrutura de Arquivos

```
portal-cidadao-app/
├── README.md                    # Documentação completa
├── INSTALACAO_RAPIDA.md         # Este arquivo
├── database_schema.sql          # Schema SQL
├── backend/
│   ├── requirements.txt         # Dependências Python
│   └── src/
│       ├── main.py              # Aplicação Flask
│       ├── models/              # Modelos de dados
│       ├── routes/              # APIs
│       └── utils/               # Geradores de dados
└── frontend/
    ├── package.json             # Dependências Node.js
    └── src/
        ├── pages/               # Páginas React
        ├── components/          # Componentes
        └── contexts/            # Contextos (Auth)
```

---

## 🎯 Próximos Passos

1. ✅ **Explorar o Dashboard Estratégico** - Veja as métricas políticas
2. ✅ **Testar Criação de Ocorrências** - Como cidadão
3. ✅ **Gerenciar Ocorrências** - Como administrador
4. ✅ **Exportar Material de Campanha** - Para redes sociais
5. ✅ **Customizar para sua cidade** - Editar bairros e categorias

---

## 💡 Dicas

- **Dados de Demonstração:** O sistema gera automaticamente 1000 ocorrências realistas
- **Bairros:** Configurados para Lavras-MG, edite em `backend/src/utils/realistic_data_generator.py`
- **Cores:** Personalize em `frontend/src/App.css`
- **Logo:** Substitua em `frontend/public/`

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte o `README.md` completo
2. Verifique os logs no terminal
3. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido para transformar gestão municipal em popularidade política** 🏆

