# Portal do Cidadão - Sistema Estratégico Municipal

Sistema completo de gestão de ocorrências urbanas com foco em popularidade política e eficiência municipal.

## 📋 Descrição

O Portal do Cidadão é uma plataforma SaaS desenvolvida para prefeituras municipais que transforma a gestão de problemas urbanos em uma ferramenta estratégica de popularidade política. O sistema permite que cidadãos relatem problemas, acompanhem soluções e avaliem serviços, enquanto gestores públicos monitoram métricas de satisfação, planejam força-tarefa por bairro e geram material automático para redes sociais.

## 🎯 Funcionalidades Principais

### Para Cidadãos:
- ✅ Relato de problemas com fotos e geolocalização
- ✅ Acompanhamento de ocorrências em tempo real
- ✅ Avaliação de serviços resolvidos
- ✅ Mapa público de problemas da cidade
- ✅ Sistema de apoio a outras ocorrências

### Para Gestores Públicos:
- 📊 **Dashboard Estratégico** com métricas políticas
- 🏘️ **Análise por Bairros** para força-tarefa
- 📈 **Relatórios Gerenciais** avançados
- 🎯 **KPIs de Popularidade** (Satisfação, Resolução, Engajamento)
- 📱 **Material de Campanha** automático para redes sociais
- ⭐ **Histórias de Sucesso** prontas para divulgação
- 🗺️ **Mapas de Calor** por região
- 📊 **Performance por Secretaria**

## 🛠️ Tecnologias Utilizadas

### Backend:
- **Python 3.11+**
- **Flask** - Framework web
- **SQLAlchemy** - ORM
- **Flask-JWT-Extended** - Autenticação
- **SQLite** - Banco de dados (desenvolvimento)
- **Flask-CORS** - CORS

### Frontend:
- **React 18** - Framework UI
- **Vite** - Build tool
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones
- **Axios** - Cliente HTTP

## 📦 Estrutura do Projeto

```
portal-cidadao-app/
├── backend/
│   ├── src/
│   │   ├── models/          # Modelos de dados (SQLAlchemy)
│   │   ├── routes/          # Rotas da API (Blueprints)
│   │   ├── utils/           # Utilitários e geradores de dados
│   │   ├── database/        # Banco de dados SQLite
│   │   ├── static/          # Frontend buildado
│   │   └── main.py          # Aplicação principal Flask
│   ├── requirements.txt     # Dependências Python
│   └── venv/                # Ambiente virtual Python
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── contexts/        # Contextos React (Auth, etc)
│   │   ├── App.jsx          # Componente principal
│   │   └── main.jsx         # Entry point
│   ├── package.json         # Dependências Node.js
│   └── dist/                # Build de produção
└── README.md                # Este arquivo
```

## 🚀 Instalação e Configuração

### Pré-requisitos:
- Python 3.11 ou superior
- Node.js 18 ou superior
- npm ou pnpm
- Git

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd portal-cidadao-app
```

### 2. Configuração do Backend

```bash
# Navegar para o diretório do backend
cd backend

# Criar ambiente virtual Python
python3 -m venv venv

# Ativar ambiente virtual
# No Linux/Mac:
source venv/bin/activate
# No Windows:
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Criar diretórios necessários
mkdir -p src/database
mkdir -p src/static/uploads
```

### 3. Configuração do Frontend

```bash
# Navegar para o diretório do frontend
cd ../frontend

# Instalar dependências
npm install
# ou
pnpm install

# Build de produção
npm run build
# ou
pnpm build
```

### 4. Copiar Frontend para Backend

```bash
# Voltar para o diretório raiz
cd ..

# Copiar build do frontend para o backend
rm -rf backend/src/static
cp -r frontend/dist backend/src/static
```

## ▶️ Executando o Projeto

### Modo Desenvolvimento

#### Backend (Terminal 1):
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
python src/main.py
```

O backend estará disponível em: `http://localhost:5000`

#### Frontend (Terminal 2):
```bash
cd frontend
npm run dev
# ou
pnpm dev
```

O frontend estará disponível em: `http://localhost:5173`

### Modo Produção

```bash
cd backend
source venv/bin/activate
python src/main.py
```

O sistema completo estará disponível em: `http://localhost:5000`

## 🗄️ Banco de Dados

O sistema utiliza SQLite para desenvolvimento. O banco de dados é criado automaticamente na primeira execução em:
```
backend/src/database/app.db
```

### Estrutura das Tabelas:

#### Users (Usuários)
- id, name, email, password, user_type, phone, cpf, department_id, created_at

#### Departments (Departamentos/Secretarias)
- id, name, description, created_at

#### Categories (Categorias de Problemas)
- id, name, description, department_id, created_at

#### Occurrences (Ocorrências)
- id, title, description, status, priority, category_id, citizen_id, assigned_to, address, latitude, longitude, photo_url, created_at, updated_at, resolved_at

#### OccurrenceTimeline (Histórico de Ações)
- id, occurrence_id, user_id, action, description, created_at

### Dados de Demonstração:

O sistema gera automaticamente **1000 ocorrências realistas** na primeira execução, incluindo:
- 20 bairros de Lavras-MG
- 21 cidadãos com perfis variados
- 5 departamentos municipais
- 8 categorias de problemas
- Timeline completa de ações
- Avaliações e feedback

## 👥 Usuários de Teste

### Administradores:
- **Email:** joao.silva@lavras.mg.gov.br | **Senha:** admin123
- **Email:** maria.santos@lavras.mg.gov.br | **Senha:** admin123

### Cidadãos:
- **Email:** cidadao1@email.com | **Senha:** 123456
- **Email:** roberto.ferreira@email.com | **Senha:** 123456

## 🔐 Segurança

- Autenticação JWT com tokens seguros
- Senhas criptografadas com hash
- CORS configurado para produção
- Validação de dados em todas as rotas
- Proteção contra SQL injection via ORM

## 📊 APIs Disponíveis

### Autenticação:
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil do usuário

### Ocorrências:
- `GET /api/occurrences` - Listar ocorrências
- `POST /api/occurrences` - Criar ocorrência
- `GET /api/occurrences/:id` - Detalhes da ocorrência
- `PUT /api/occurrences/:id` - Atualizar ocorrência
- `POST /api/occurrences/:id/timeline` - Adicionar ação

### Dashboard Estratégico:
- `GET /api/strategic/political-kpis` - KPIs políticos
- `GET /api/strategic/neighborhood-priority` - Priorização por bairro
- `GET /api/strategic/performance-by-department` - Performance departamental
- `GET /api/strategic/success-stories` - Histórias de sucesso
- `GET /api/strategic/management-evolution` - Evolução temporal
- `GET /api/strategic/campaign-material` - Material de campanha

### Administrativo:
- `GET /api/admin/dashboard/stats` - Estatísticas gerais
- `GET /api/admin/categories` - Categorias
- `GET /api/admin/departments` - Departamentos

## 🎨 Customização

### Cores e Branding:
Edite o arquivo `frontend/src/App.css` para personalizar as cores:
```css
:root {
  --primary: #3b82f6;    /* Azul principal */
  --secondary: #10b981;  /* Verde sucesso */
  --danger: #ef4444;     /* Vermelho alerta */
}
```

### Dados de Bairros:
Edite `backend/src/utils/realistic_data_generator.py` para adicionar bairros da sua cidade.

### Categorias e Departamentos:
Edite `backend/src/utils/seed_data.py` para customizar categorias e departamentos.

## 🚢 Deploy em Produção

### Recomendações:
1. **Banco de Dados:** Migrar de SQLite para PostgreSQL
2. **Servidor:** Usar Gunicorn + Nginx
3. **HTTPS:** Configurar certificado SSL
4. **Variáveis de Ambiente:** Usar .env para secrets
5. **Backup:** Implementar backup automático do banco

### Exemplo de Deploy com Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

## 📝 Licença

Este projeto foi desenvolvido para demonstração e uso comercial pela equipe do Portal do Cidadão.

## 🤝 Suporte

Para suporte técnico ou dúvidas sobre implementação, entre em contato com a equipe de desenvolvimento.

## 📈 Roadmap

### Próximas Funcionalidades:
- [ ] Módulo "Antes e Depois" com exportação automática
- [ ] Chatbot para atendimento
- [ ] Integração com WhatsApp
- [ ] App mobile (React Native)
- [ ] IA para classificação automática
- [ ] Integração com ERP municipal
- [ ] Sistema de notificações push
- [ ] Base de conhecimento cidadã (FAQ)

## 🎯 Métricas de Sucesso

O sistema monitora automaticamente:
- **Índice de Satisfação Popular (IS):** Média das avaliações
- **Taxa de Resolução:** Percentual de problemas resolvidos
- **Tempo Médio de Resolução (TMR):** Agilidade municipal
- **Net Promoter Score (NPS) Cívico:** Recomendação do serviço
- **Taxa de Reincidência:** Problemas recorrentes
- **Engajamento Cívico:** Apoios e participação

---

**Desenvolvido com ❤️ para transformar gestão municipal em popularidade política**

