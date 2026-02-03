#!/usr/bin/env python3
"""
Script unificado de inicialização do banco de dados
Resolve problemas de importação circular e ordem de execução
"""

from src.models.models import db, User, Department, Category, Occurrence, OccurrenceTimeline, OccurrenceStatus, Priority, UserType
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random


def create_departments_and_categories():
    """Cria departamentos e categorias base"""
    
    # Verificar se já existem
    if Department.query.first():
        print("✅ Departamentos já existem")
        return
    
    print("🏛️ Criando departamentos...")
    
    # Criar departamentos
    departments_data = [
        {
            'name': 'Obras Públicas',
            'description': 'Responsável por obras públicas, manutenção de ruas e infraestrutura urbana'
        },
        {
            'name': 'Serviços Urbanos',
            'description': 'Limpeza urbana, coleta de lixo e manutenção de praças'
        },
        {
            'name': 'Iluminação Pública',
            'description': 'Manutenção e instalação de iluminação pública'
        },
        {
            'name': 'Meio Ambiente',
            'description': 'Questões ambientais e sustentabilidade'
        },
        {
            'name': 'Trânsito',
            'description': 'Transporte público e trânsito'
        },
        {
            'name': 'Saneamento',
            'description': 'Água, esgoto e drenagem'
        },
        {
            'name': 'Administração',
            'description': 'Administração geral e outros serviços'
        }
    ]
    
    departments = {}
    for dept_data in departments_data:
        dept = Department(**dept_data)
        db.session.add(dept)
        db.session.flush()
        departments[dept_data['name']] = dept
    
    db.session.commit()
    print(f"✅ {len(departments)} departamentos criados!")
    
    # Criar categorias
    print("📁 Criando categorias...")
    
    categories_data = [
        {'name': 'Buraco na Rua', 'description': 'Buracos e problemas no asfalto', 'icon': 'road', 'color': '#EF4444', 'department': 'Obras Públicas'},
        {'name': 'Calçada Danificada', 'description': 'Problemas em calçadas e passeios', 'icon': 'footprints', 'color': '#F97316', 'department': 'Obras Públicas'},
        {'name': 'Lâmpada Queimada', 'description': 'Problemas na iluminação pública', 'icon': 'lightbulb', 'color': '#EAB308', 'department': 'Iluminação Pública'},
        {'name': 'Lixo Acumulado', 'description': 'Acúmulo de lixo em vias públicas', 'icon': 'trash', 'color': '#22C55E', 'department': 'Serviços Urbanos'},
        {'name': 'Poda de Árvore', 'description': 'Árvores que precisam de poda', 'icon': 'tree-pine', 'color': '#10B981', 'department': 'Meio Ambiente'},
        {'name': 'Semáforo Defeituoso', 'description': 'Problemas em semáforos', 'icon': 'traffic-light', 'color': '#3B82F6', 'department': 'Trânsito'},
        {'name': 'Esgoto Entupido', 'description': 'Problemas no sistema de esgoto', 'icon': 'droplets', 'color': '#8B5CF6', 'department': 'Saneamento'},
        {'name': 'Animal Abandonado', 'description': 'Animais abandonados ou em situação de risco', 'icon': 'dog', 'color': '#EC4899', 'department': 'Meio Ambiente'},
        {'name': 'Outros', 'description': 'Outros problemas urbanos', 'icon': 'alert-circle', 'color': '#6B7280', 'department': 'Administração'}
    ]
    
    for cat_data in categories_data:
        dept = departments[cat_data['department']]
        cat = Category(
            name=cat_data['name'],
            description=cat_data['description'],
            icon=cat_data['icon'],
            color=cat_data['color'],
            department_id=dept.id
        )
        db.session.add(cat)
    
    db.session.commit()
    print(f"✅ {len(categories_data)} categorias criadas!")


def create_admin_users():
    """Cria usuários administrativos"""
    
    # Verificar se já existem admins
    if User.query.filter_by(user_type=UserType.ADMIN).first():
        print("✅ Administradores já existem")
        return
    
    print("👤 Criando usuários administrativos...")
    
    departments = Department.query.all()
    
    admin_users_data = [
        {'name': 'João Silva', 'email': 'joao.silva@lavras.mg.gov.br', 'department': 'Obras Públicas', 'phone': '(35) 99999-0001'},
        {'name': 'Maria Santos', 'email': 'maria.santos@lavras.mg.gov.br', 'department': 'Serviços Urbanos', 'phone': '(35) 99999-0002'},
        {'name': 'Carlos Oliveira', 'email': 'carlos.oliveira@lavras.mg.gov.br', 'department': 'Iluminação Pública', 'phone': '(35) 99999-0003'},
        {'name': 'Ana Costa', 'email': 'ana.costa@lavras.mg.gov.br', 'department': 'Meio Ambiente', 'phone': '(35) 99999-0004'},
        {'name': 'Pedro Lima', 'email': 'pedro.lima@lavras.mg.gov.br', 'department': 'Trânsito', 'phone': '(35) 99999-0005'}
    ]
    
    for user_data in admin_users_data:
        dept = Department.query.filter_by(name=user_data['department']).first()
        user = User(
            name=user_data['name'],
            email=user_data['email'],
            phone=user_data['phone'],
            user_type=UserType.ADMIN,
            department_id=dept.id if dept else None,
            password_hash=generate_password_hash('admin123'),
            is_active=True
        )
        db.session.add(user)
    
    db.session.commit()
    print(f"✅ {len(admin_users_data)} administradores criados!")


def create_realistic_citizens_and_occurrences():
    """Cria cidadãos e ocorrências realistas"""
    
    # Verificar se já existem ocorrências
    if Occurrence.query.first():
        print("✅ Ocorrências já existem")
        return
    
    print("👥 Criando cidadãos realistas...")
    
    # Nomes realistas
    citizen_names = [
        'Ana Silva Santos', 'Carlos Eduardo Lima', 'Maria José Oliveira', 'João Pedro Costa',
        'Fernanda Alves Pereira', 'Roberto Ferreira Silva', 'Juliana Mendes Souza', 'Paulo Ricardo Santos',
        'Amanda Rodrigues Lima', 'Marcos Antônio Oliveira', 'Luciana Pereira Costa', 'Rafael Santos Alves',
        'Patrícia Lima Ferreira', 'Diego Almeida Silva', 'Camila Souza Santos', 'Thiago Barbosa Lima',
        'Renata Cardoso Oliveira', 'Bruno Martins Costa', 'Gabriela Costa Alves', 'Leonardo Silva Pereira',
        'Mariana Dias Santos', 'Felipe Rodrigues Lima', 'Larissa Almeida Silva', 'Gustavo Santos Oliveira',
        'Natália Lima Costa', 'Ricardo Pereira Alves', 'Vanessa Silva Santos', 'André Oliveira Lima',
        'Priscila Costa Silva', 'Rodrigo Santos Pereira', 'Tatiane Alves Lima', 'Marcelo Silva Santos',
        'Cristiane Lima Oliveira', 'Fabiano Costa Alves', 'Adriana Santos Lima', 'Leandro Pereira Silva',
        'Simone Oliveira Santos', 'Daniel Lima Costa', 'Roberta Silva Alves', 'Henrique Santos Lima'
    ]
    
    citizens = []
    for i, name in enumerate(citizen_names):
        email = name.lower().replace(' ', '.') + '@email.com'
        citizen = User(
            name=name,
            email=email,
            phone=f'(35) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
            password_hash=generate_password_hash('123456'),
            user_type=UserType.CITIZEN,
            is_active=True
        )
        db.session.add(citizen)
        citizens.append(citizen)
    
    db.session.commit()
    print(f"✅ {len(citizens)} cidadãos criados!")
    
    # Criar ocorrências
    print("📋 Criando 1000 ocorrências realistas...")
    
    categories = Category.query.all()
    admins = User.query.filter_by(user_type=UserType.ADMIN).all()
    
    # Bairros de Lavras-MG
    neighborhoods = [
        'Centro', 'Jardim América', 'Vila Esperança', 'Morada do Sol I', 'Morada do Sol II',
        'Morada do Sol III', 'Jardim Floresta', 'Bela Vista', 'São Cristóvão', 'Vila São Francisco',
        'Parque das Acácias', 'Jardim das Oliveiras', 'Vila Nova', 'Conjunto Habitacional JK',
        'Bairro Industrial', 'Jardim Glória', 'Vila Santa Terezinha', 'Residencial Ipê',
        'Jardim Eldorado', 'Residencial Parque das Águas'
    ]
    
    streets = [
        'Rua Tiradentes', 'Avenida Dr. Sylvio Menicucci', 'Rua Coronel José Bento',
        'Rua das Américas', 'Avenida Brasil', 'Rua São Paulo', 'Rua da Esperança',
        'Rua da Paz', 'Rua São José', 'Rua do Sol', 'Rua da Aurora', 'Rua dos Girassóis',
        'Rua das Margaridas', 'Rua das Acácias', 'Rua dos Ipês'
    ]
    
    # Títulos por categoria
    titles_by_category = {
        'Buraco na Rua': [
            'Buraco grande prejudica trânsito',
            'Cratera perigosa na via principal',
            'Asfalto danificado com buraco profundo',
            'Buraco na pista causa acidentes',
            'Via com buracos precisa de reparo urgente'
        ],
        'Calçada Danificada': [
            'Calçada quebrada dificulta passagem',
            'Piso da calçada solto e perigoso',
            'Desnível perigoso na calçada',
            'Calçada com buracos precisa reparo',
            'Acessibilidade comprometida na calçada'
        ],
        'Lâmpada Queimada': [
            'Poste sem iluminação compromete segurança',
            'Lâmpada queimada na praça',
            'Iluminação pública apagada há dias',
            'Poste de luz não funciona',
            'Falta de iluminação gera insegurança'
        ],
        'Lixo Acumulado': [
            'Lixo acumulado atrai pragas',
            'Entulho abandonado na rua',
            'Coleta não realizada há dias',
            'Acúmulo de lixo em terreno baldio',
            'Lixo na via pública precisa remoção'
        ],
        'Esgoto Entupido': [
            'Esgoto entupido causa mau cheiro',
            'Vazamento de esgoto na rua',
            'Bueiro entupido alaga via',
            'Problema de esgoto urgente',
            'Esgoto a céu aberto'
        ],
        'Poda de Árvore': [
            'Árvore precisa poda urgente',
            'Galhos ameaçam fiação elétrica',
            'Árvore obstrui passagem',
            'Poda necessária por segurança',
            'Galhos caídos bloqueiam via'
        ],
        'Semáforo Defeituoso': [
            'Semáforo não funciona',
            'Sinalização defeituosa no cruzamento',
            'Semáforo piscando incorretamente',
            'Problema no semáforo causa congestionamento',
            'Sinalização precisa reparo urgente'
        ],
        'Animal Abandonado': [
            'Cão abandonado precisa resgate',
            'Animal ferido na via pública',
            'Gato abandonado em situação precária',
            'Animal doméstico perdido',
            'Resgate de animal necessário'
        ],
        'Outros': [
            'Problema diverso na via pública',
            'Situação que requer atenção municipal',
            'Demanda específica do cidadão',
            'Solicitação de melhoria urbana',
            'Questão municipal diversa'
        ]
    }
    
    occurrences = []
    timeline_entries = []
    
    for i in range(1000):
        # Data aleatória nos últimos 12 meses
        days_ago = random.randint(0, 365)
        created_at = datetime.utcnow() - timedelta(days=days_ago)
        
        # Dados aleatórios
        category = random.choice(categories)
        citizen = random.choice(citizens)
        neighborhood = random.choice(neighborhoods)
        street = random.choice(streets)
        number = random.randint(1, 999)
        
        # Endereço
        address = f"{street}, {number}, {neighborhood}, Lavras-MG"
        
        # Coordenadas de Lavras-MG
        latitude = -21.2450 + random.uniform(-0.05, 0.05)
        longitude = -45.0000 + random.uniform(-0.05, 0.05)
        
        # Título baseado na categoria
        if category.name in titles_by_category:
            title = random.choice(titles_by_category[category.name])
        else:
            title = f"Problema de {category.name.lower()}"
        
        # Descrição
        description = f"Problema reportado pelo cidadão na região do {neighborhood}. {title}. Necessita atenção da prefeitura."
        
        # Status baseado na idade
        if days_ago > 180:  # Muito antiga
            status = random.choice([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
            resolved = True
        elif days_ago > 90:  # Antiga
            status = random.choices(
                [OccurrenceStatus.RESOLVED, OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.CLOSED],
                weights=[40, 30, 30]
            )[0]
            resolved = status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]
        elif days_ago > 30:  # Recente
            status = random.choices(
                [OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.OPEN, OccurrenceStatus.RESOLVED],
                weights=[50, 30, 20]
            )[0]
            resolved = status == OccurrenceStatus.RESOLVED
        else:  # Nova
            status = random.choices(
                [OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS],
                weights=[60, 40]
            )[0]
            resolved = False
        
        # Prioridade
        priority = random.choices(
            [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT],
            weights=[30, 40, 20, 10]
        )[0]
        
        # Criar ocorrência
        occurrence = Occurrence(
            title=title,
            description=description,
            category_id=category.id,
            citizen_id=citizen.id,
            latitude=latitude,
            longitude=longitude,
            address=address,
            status=status,
            priority=priority,
            created_at=created_at,
            updated_at=created_at
        )
        
        # Se não está aberta, atribuir admin
        if status != OccurrenceStatus.OPEN:
            occurrence.assigned_to = random.choice(admins).id
            
            # Se resolvida, adicionar dados de resolução
            if resolved:
                resolve_days = random.randint(1, min(days_ago, 30))
                occurrence.resolved_at = created_at + timedelta(days=resolve_days)
                occurrence.updated_at = occurrence.resolved_at
                
                # 75% das resolvidas têm avaliação
                if random.random() < 0.75:
                    occurrence.rating = random.choices(
                        [1, 2, 3, 4, 5],
                        weights=[5, 10, 15, 35, 35]
                    )[0]
                    
                    if occurrence.rating >= 4:
                        occurrence.feedback = random.choice([
                            "Excelente atendimento! Problema resolvido rapidamente.",
                            "Muito satisfeito com a solução apresentada.",
                            "Equipe muito eficiente e atenciosa.",
                            "Problema resolvido com qualidade.",
                            "Parabéns pelo trabalho da prefeitura!"
                        ])
                    elif occurrence.rating == 3:
                        occurrence.feedback = random.choice([
                            "Problema resolvido, mas demorou um pouco.",
                            "Atendimento razoável, poderia ser mais rápido.",
                            "Solução adequada, mas esperava mais agilidade."
                        ])
                    else:
                        occurrence.feedback = random.choice([
                            "Demorou muito para resolver o problema.",
                            "Atendimento demorado e insatisfatório.",
                            "Esperava uma solução mais rápida."
                        ])
        
        db.session.add(occurrence)
        occurrences.append(occurrence)
        
        # Criar timeline de criação
        timeline_entries.append({
            'occurrence': occurrence,
            'user_id': occurrence.citizen_id,
            'action': 'created',
            'description': f"Ocorrência criada: {occurrence.title}",
            'created_at': created_at
        })
        
        # Timeline de atribuição
        if occurrence.assigned_to:
            timeline_entries.append({
                'occurrence': occurrence,
                'user_id': occurrence.assigned_to,
                'action': 'assigned',
                'description': f"Atribuída ao departamento de {category.department.name}",
                'created_at': created_at + timedelta(hours=random.randint(1, 48))
            })
        
        # Timeline de resolução
        if occurrence.resolved_at:
            timeline_entries.append({
                'occurrence': occurrence,
                'user_id': occurrence.assigned_to,
                'action': 'resolved',
                'description': f"Problema resolvido. Status: {status.value}",
                'created_at': occurrence.resolved_at
            })
    
    db.session.commit()
    print(f"✅ {len(occurrences)} ocorrências criadas!")
    
    # Criar timeline
    print("📅 Criando timeline detalhada...")
    for entry in timeline_entries:
        timeline = OccurrenceTimeline(
            occurrence_id=entry['occurrence'].id,
            user_id=entry['user_id'],
            action=entry['action'],
            description=entry['description'],
            created_at=entry['created_at']
        )
        db.session.add(timeline)
    
    db.session.commit()
    print(f"✅ {len(timeline_entries)} entradas de timeline criadas!")
    
    # Estatísticas
    print("\n📊 ESTATÍSTICAS FINAIS:")
    print(f"👥 Cidadãos: {len(citizens)}")
    print(f"📋 Ocorrências: {len(occurrences)}")
    print(f"📅 Timeline: {len(timeline_entries)} entradas")
    
    # Por status
    print(f"\n📈 DISTRIBUIÇÃO POR STATUS:")
    for status in OccurrenceStatus:
        count = len([o for o in occurrences if o.status == status])
        percentage = (count / len(occurrences)) * 100
        print(f"   {status.value}: {count} ({percentage:.1f}%)")
    
    # Por categoria
    print(f"\n📁 DISTRIBUIÇÃO POR CATEGORIA:")
    cat_stats = {}
    for occurrence in occurrences:
        cat_name = occurrence.category.name
        cat_stats[cat_name] = cat_stats.get(cat_name, 0) + 1
    
    for cat_name, count in sorted(cat_stats.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(occurrences)) * 100
        print(f"   {cat_name}: {count} ({percentage:.1f}%)")
    
    # Métricas de satisfação
    rated_occurrences = [o for o in occurrences if o.rating]
    if rated_occurrences:
        avg_rating = sum(o.rating for o in rated_occurrences) / len(rated_occurrences)
        print(f"\n⭐ MÉTRICAS DE SATISFAÇÃO:")
        print(f"   Avaliação média: {avg_rating:.2f}/5.0")
        print(f"   Ocorrências avaliadas: {len(rated_occurrences)} ({(len(rated_occurrences)/len(occurrences)*100):.1f}%)")


def init_database(app):
    """
    Inicializa o banco de dados na ordem correta
    Resolve problemas de importação circular
    """
    with app.app_context():
        print("\n🚀 INICIANDO BANCO DE DADOS DO PORTAL DO CIDADÃO")
        print("=" * 60)
        
        # 1. Criar todas as tabelas
        print("\n📦 Criando estrutura do banco de dados...")
        db.create_all()
        print("✅ Tabelas criadas com sucesso!")
        
        # 2. Criar departamentos e categorias
        create_departments_and_categories()
        
        # 3. Criar usuários administrativos
        create_admin_users()
        
        # 4. Criar cidadãos e ocorrências realistas
        create_realistic_citizens_and_occurrences()
        
        print("\n" + "=" * 60)
        print("🎉 BANCO DE DADOS INICIALIZADO COM SUCESSO!")
        print("💡 O sistema está pronto para apresentação ao investidor!")
        print("=" * 60 + "\n")

