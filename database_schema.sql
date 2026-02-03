-- Portal do Cidadão - Schema do Banco de Dados
-- SQLite / PostgreSQL Compatible

-- =====================================================
-- TABELA: Departments (Departamentos/Secretarias)
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: Users (Usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'citizen', -- 'admin' ou 'citizen'
    phone VARCHAR(20),
    cpf VARCHAR(14),
    department_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- =====================================================
-- TABELA: Categories (Categorias de Problemas)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- =====================================================
-- TABELA: Occurrences (Ocorrências)
-- =====================================================
CREATE TABLE IF NOT EXISTS occurrences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    category_id INTEGER NOT NULL,
    citizen_id INTEGER NOT NULL,
    assigned_to INTEGER,
    address VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(100),
    latitude REAL,
    longitude REAL,
    photo_url VARCHAR(255),
    photo_after_url VARCHAR(255), -- Foto "depois" da resolução
    rating INTEGER, -- Avaliação do cidadão (1-5)
    feedback TEXT, -- Feedback do cidadão
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (citizen_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- =====================================================
-- TABELA: Occurrence Timeline (Histórico de Ações)
-- =====================================================
CREATE TABLE IF NOT EXISTS occurrence_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occurrence_id INTEGER NOT NULL,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL, -- 'created', 'assigned', 'status_changed', 'commented', 'resolved'
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occurrence_id) REFERENCES occurrences(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- TABELA: Occurrence Supports (Apoios a Ocorrências)
-- =====================================================
CREATE TABLE IF NOT EXISTS occurrence_supports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occurrence_id INTEGER NOT NULL,
    citizen_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occurrence_id) REFERENCES occurrences(id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id) REFERENCES users(id),
    UNIQUE(occurrence_id, citizen_id) -- Um cidadão só pode apoiar uma vez
);

-- =====================================================
-- ÍNDICES para Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON occurrences(status);
CREATE INDEX IF NOT EXISTS idx_occurrences_priority ON occurrences(priority);
CREATE INDEX IF NOT EXISTS idx_occurrences_category ON occurrences(category_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_citizen ON occurrences(citizen_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_assigned ON occurrences(assigned_to);
CREATE INDEX IF NOT EXISTS idx_occurrences_neighborhood ON occurrences(neighborhood);
CREATE INDEX IF NOT EXISTS idx_occurrences_created_at ON occurrences(created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_occurrence ON occurrence_timeline(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);

-- =====================================================
-- DADOS INICIAIS: Departamentos
-- =====================================================
INSERT OR IGNORE INTO departments (id, name, description) VALUES
(1, 'Secretaria de Obras', 'Responsável por infraestrutura urbana, pavimentação e construções'),
(2, 'Secretaria de Serviços Urbanos', 'Responsável por limpeza urbana, coleta de lixo e manutenção'),
(3, 'Secretaria de Iluminação Pública', 'Responsável pela manutenção e expansão da iluminação pública'),
(4, 'Secretaria de Meio Ambiente', 'Responsável por áreas verdes, arborização e meio ambiente'),
(5, 'Secretaria de Transporte', 'Responsável por sinalização, trânsito e transporte público');

-- =====================================================
-- DADOS INICIAIS: Categorias
-- =====================================================
INSERT OR IGNORE INTO categories (id, name, description, department_id) VALUES
(1, 'Buraco na Rua', 'Buracos e crateras na via pública', 1),
(2, 'Calçada Danificada', 'Calçadas quebradas ou irregulares', 1),
(3, 'Lâmpada Queimada', 'Iluminação pública não funcionando', 3),
(4, 'Lixo Acumulado', 'Acúmulo de lixo em via pública', 2),
(5, 'Entulho', 'Entulho ou resíduos de construção abandonados', 2),
(6, 'Poda de Árvore', 'Árvores necessitando poda ou remoção', 4),
(7, 'Sinalização Danificada', 'Placas de trânsito danificadas ou ausentes', 5),
(8, 'Problema de Drenagem', 'Bueiros entupidos ou problemas de escoamento', 1);

-- =====================================================
-- DADOS INICIAIS: Usuários Administrativos
-- =====================================================
-- Senha padrão: admin123 (hash bcrypt)
INSERT OR IGNORE INTO users (id, name, email, password, user_type, phone, department_id) VALUES
(1, 'João Silva', 'joao.silva@lavras.mg.gov.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'admin', '(35) 98765-4321', 1),
(2, 'Maria Santos', 'maria.santos@lavras.mg.gov.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'admin', '(35) 98765-4322', 2),
(3, 'Pedro Oliveira', 'pedro.oliveira@lavras.mg.gov.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'admin', '(35) 98765-4323', 3),
(4, 'Ana Costa', 'ana.costa@lavras.mg.gov.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'admin', '(35) 98765-4324', 4),
(5, 'Carlos Mendes', 'carlos.mendes@lavras.mg.gov.br', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'admin', '(35) 98765-4325', 5);

-- =====================================================
-- DADOS INICIAIS: Cidadãos de Teste
-- =====================================================
-- Senha padrão: 123456 (hash bcrypt)
INSERT OR IGNORE INTO users (id, name, email, password, user_type, phone, cpf) VALUES
(6, 'Roberto Ferreira', 'roberto.ferreira@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'citizen', '(35) 99876-5432', '123.456.789-00'),
(7, 'Juliana Alves', 'juliana.alves@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'citizen', '(35) 99876-5433', '234.567.890-11'),
(8, 'Marcos Lima', 'marcos.lima@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'citizen', '(35) 99876-5434', '345.678.901-22'),
(9, 'Fernanda Souza', 'fernanda.souza@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'citizen', '(35) 99876-5435', '456.789.012-33'),
(10, 'Ricardo Pereira', 'ricardo.pereira@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIl.HL2Iq6', 'citizen', '(35) 99876-5436', '567.890.123-44');

-- =====================================================
-- VIEWS para Relatórios
-- =====================================================

-- View: Ocorrências com informações completas
CREATE VIEW IF NOT EXISTS v_occurrences_full AS
SELECT 
    o.id,
    o.title,
    o.description,
    o.status,
    o.priority,
    o.address,
    o.neighborhood,
    o.latitude,
    o.longitude,
    o.rating,
    o.feedback,
    o.created_at,
    o.updated_at,
    o.resolved_at,
    c.name as category_name,
    d.name as department_name,
    u_citizen.name as citizen_name,
    u_citizen.email as citizen_email,
    u_assigned.name as assigned_to_name,
    u_assigned.email as assigned_to_email,
    CASE 
        WHEN o.resolved_at IS NOT NULL 
        THEN ROUND((JULIANDAY(o.resolved_at) - JULIANDAY(o.created_at)) * 24, 1)
        ELSE NULL 
    END as resolution_time_hours
FROM occurrences o
LEFT JOIN categories c ON o.category_id = c.id
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN users u_citizen ON o.citizen_id = u_citizen.id
LEFT JOIN users u_assigned ON o.assigned_to = u_assigned.id;

-- View: Estatísticas por Bairro
CREATE VIEW IF NOT EXISTS v_neighborhood_stats AS
SELECT 
    neighborhood,
    COUNT(*) as total_occurrences,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
    ROUND(AVG(CASE WHEN status = 'resolved' THEN 1.0 ELSE 0.0 END) * 100, 1) as resolution_rate,
    AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as avg_rating,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
    COUNT(CASE WHEN priority = 'urgent' OR priority = 'high' THEN 1 END) as high_priority_count
FROM occurrences
WHERE neighborhood IS NOT NULL
GROUP BY neighborhood
ORDER BY total_occurrences DESC;

-- View: Performance por Departamento
CREATE VIEW IF NOT EXISTS v_department_performance AS
SELECT 
    d.id,
    d.name,
    COUNT(o.id) as total_occurrences,
    SUM(CASE WHEN o.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
    ROUND(AVG(CASE WHEN o.status = 'resolved' THEN 1.0 ELSE 0.0 END) * 100, 1) as resolution_rate,
    AVG(CASE WHEN o.rating IS NOT NULL THEN o.rating ELSE NULL END) as avg_rating,
    AVG(CASE 
        WHEN o.resolved_at IS NOT NULL 
        THEN (JULIANDAY(o.resolved_at) - JULIANDAY(o.created_at)) * 24
        ELSE NULL 
    END) as avg_resolution_time_hours
FROM departments d
LEFT JOIN categories c ON d.id = c.department_id
LEFT JOIN occurrences o ON c.id = o.category_id
GROUP BY d.id, d.name
ORDER BY total_occurrences DESC;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

-- Este schema foi projetado para:
-- 1. Suportar gestão completa de ocorrências urbanas
-- 2. Permitir análise estratégica por bairro e departamento
-- 3. Facilitar geração de relatórios gerenciais
-- 4. Monitorar métricas de satisfação e performance
-- 5. Escalar para PostgreSQL em produção

-- Para migrar para PostgreSQL:
-- 1. Substituir AUTOINCREMENT por SERIAL
-- 2. Ajustar tipos de dados conforme necessário
-- 3. Implementar particionamento para grandes volumes
-- 4. Adicionar índices GiST para geolocalização

-- Backup recomendado:
-- sqlite3 app.db .dump > backup.sql

-- Restore:
-- sqlite3 app.db < backup.sql

