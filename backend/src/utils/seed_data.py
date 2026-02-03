from src.models.models import db, User, Department, Category, Occurrence, OccurrenceTimeline, OccurrenceSupport, UserType, OccurrenceStatus, Priority
from datetime import datetime, timedelta
import random

def create_initial_data():
    """Cria dados iniciais para demonstração se não existirem"""
    
    # Verificar se já existem dados
    if User.query.first():
        return
    
    print("Criando dados iniciais...")
    
    # 1. Criar departamentos
    departments_data = [
        {
            'name': 'Secretaria de Obras e Infraestrutura',
            'description': 'Responsável por obras públicas, manutenção de ruas e infraestrutura urbana',
            'email': 'obras@lavras.mg.gov.br',
            'phone': '(35) 3829-1400'
        },
        {
            'name': 'Secretaria de Serviços Urbanos',
            'description': 'Limpeza urbana, coleta de lixo e manutenção de praças',
            'email': 'servicos@lavras.mg.gov.br',
            'phone': '(35) 3829-1500'
        },
        {
            'name': 'Secretaria de Iluminação Pública',
            'description': 'Manutenção e instalação de iluminação pública',
            'email': 'iluminacao@lavras.mg.gov.br',
            'phone': '(35) 3829-1600'
        },
        {
            'name': 'Secretaria de Meio Ambiente',
            'description': 'Questões ambientais e sustentabilidade',
            'email': 'meioambiente@lavras.mg.gov.br',
            'phone': '(35) 3829-1700'
        },
        {
            'name': 'Secretaria de Transporte',
            'description': 'Transporte público e trânsito',
            'email': 'transporte@lavras.mg.gov.br',
            'phone': '(35) 3829-1800'
        }
    ]
    
    departments = []
    for dept_data in departments_data:
        dept = Department(**dept_data)
        db.session.add(dept)
        departments.append(dept)
    
    db.session.flush()  # Para obter os IDs
    
    # 2. Criar categorias
    categories_data = [
        {'name': 'Buraco na Rua', 'description': 'Buracos e problemas no asfalto', 'icon': 'road', 'color': '#EF4444', 'department_id': departments[0].id},
        {'name': 'Calçada Danificada', 'description': 'Problemas em calçadas e passeios', 'icon': 'footprints', 'color': '#F97316', 'department_id': departments[0].id},
        {'name': 'Lâmpada Queimada', 'description': 'Problemas na iluminação pública', 'icon': 'lightbulb', 'color': '#EAB308', 'department_id': departments[2].id},
        {'name': 'Lixo Acumulado', 'description': 'Acúmulo de lixo em vias públicas', 'icon': 'trash', 'color': '#22C55E', 'department_id': departments[1].id},
        {'name': 'Árvore Caída', 'description': 'Árvores caídas ou com risco de queda', 'icon': 'tree-pine', 'color': '#10B981', 'department_id': departments[3].id},
        {'name': 'Semáforo Defeituoso', 'description': 'Problemas em semáforos', 'icon': 'traffic-light', 'color': '#3B82F6', 'department_id': departments[4].id},
        {'name': 'Esgoto Entupido', 'description': 'Problemas no sistema de esgoto', 'icon': 'droplets', 'color': '#8B5CF6', 'department_id': departments[0].id},
        {'name': 'Praça Abandonada', 'description': 'Manutenção de praças e espaços públicos', 'icon': 'trees', 'color': '#06B6D4', 'department_id': departments[1].id}
    ]
    
    categories = []
    for cat_data in categories_data:
        cat = Category(**cat_data)
        db.session.add(cat)
        categories.append(cat)
    
    db.session.flush()
    
    # 3. Criar usuários administrativos
    admin_users_data = [
        {'name': 'João Silva', 'email': 'joao.silva@lavras.mg.gov.br', 'department_id': departments[0].id, 'phone': '(35) 99999-0001'},
        {'name': 'Maria Santos', 'email': 'maria.santos@lavras.mg.gov.br', 'department_id': departments[1].id, 'phone': '(35) 99999-0002'},
        {'name': 'Carlos Oliveira', 'email': 'carlos.oliveira@lavras.mg.gov.br', 'department_id': departments[2].id, 'phone': '(35) 99999-0003'},
        {'name': 'Ana Costa', 'email': 'ana.costa@lavras.mg.gov.br', 'department_id': departments[3].id, 'phone': '(35) 99999-0004'},
        {'name': 'Pedro Lima', 'email': 'pedro.lima@lavras.mg.gov.br', 'department_id': departments[4].id, 'phone': '(35) 99999-0005'}
    ]
    
    admin_users = []
    for user_data in admin_users_data:
        user = User(
            name=user_data['name'],
            email=user_data['email'],
            phone=user_data['phone'],
            user_type=UserType.ADMIN,
            department_id=user_data['department_id']
        )
        user.set_password('admin123')
        db.session.add(user)
        admin_users.append(user)
    
    # 4. Criar cidadãos
    citizen_names = [
        'Roberto Ferreira', 'Lucia Mendes', 'Fernando Rocha', 'Carla Alves', 'Marcos Pereira',
        'Sandra Gomes', 'Ricardo Barbosa', 'Patrícia Dias', 'André Martins', 'Juliana Campos',
        'Gustavo Souza', 'Renata Cardoso', 'Thiago Nascimento', 'Fernanda Ribeiro', 'Diego Moura',
        'Camila Freitas', 'Bruno Teixeira', 'Vanessa Correia', 'Rafael Monteiro', 'Priscila Araújo'
    ]
    
    citizens = []
    for i, name in enumerate(citizen_names):
        email = name.lower().replace(' ', '.') + '@email.com'
        user = User(
            name=name,
            email=email,
            phone=f'(35) 99999-{1000+i:04d}',
            user_type=UserType.CITIZEN,
            address=f'Rua das Flores, {100+i*10}, Centro, Lavras-MG'
        )
        user.set_password('123456')
        db.session.add(user)
        citizens.append(user)
    
    db.session.flush()
    
    # 5. Criar ocorrências
    addresses = [
        'Rua Comandante José Braz, 123, Centro',
        'Av. Dr. Sylvio Menicucci, 456, Kennedy',
        'Rua Coronel José Bento, 789, Centro',
        'Av. Presidente Vargas, 321, Jardim Glória',
        'Rua Tiradentes, 654, Centro',
        'Av. Doutor Augusto Silva, 987, Aquenta Sol',
        'Rua Bias Fortes, 147, Centro',
        'Av. Prefeito Tuany Toledo, 258, Vila Esperança',
        'Rua Padre José Poggel, 369, Jardim Floresta',
        'Av. Governador Benedito Valadares, 741, São Judas'
    ]
    
    # Coordenadas aproximadas de Lavras-MG
    base_lat = -21.2454
    base_lng = -45.0009
    
    occurrences = []
    for i in range(60):  # Criar 60 ocorrências
        # Datas aleatórias nos últimos 6 meses
        days_ago = random.randint(1, 180)
        created_date = datetime.utcnow() - timedelta(days=days_ago)
        
        # Coordenadas aleatórias próximas a Lavras
        lat = base_lat + random.uniform(-0.05, 0.05)
        lng = base_lng + random.uniform(-0.05, 0.05)
        
        # Status baseado na data (mais antigas têm maior chance de estar resolvidas)
        if days_ago > 30:
            status_choices = [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]
            status = random.choice(status_choices)
        elif days_ago > 7:
            status_choices = [OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.RESOLVED]
            status = random.choice(status_choices)
        else:
            status_choices = [OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS]
            status = random.choice(status_choices)
        
        category = random.choice(categories)
        citizen = random.choice(citizens)
        
        titles = {
            'Buraco na Rua': ['Buraco grande na pista', 'Asfalto danificado', 'Cratera na via'],
            'Calçada Danificada': ['Calçada quebrada', 'Piso solto na calçada', 'Buraco na calçada'],
            'Lâmpada Queimada': ['Poste sem luz', 'Lâmpada apagada', 'Iluminação defeituosa'],
            'Lixo Acumulado': ['Lixo na rua', 'Entulho abandonado', 'Acúmulo de resíduos'],
            'Árvore Caída': ['Árvore bloqueando via', 'Galho caído', 'Árvore com risco de queda'],
            'Semáforo Defeituoso': ['Semáforo piscando', 'Sinal não funciona', 'Semáforo apagado'],
            'Esgoto Entupido': ['Bueiro entupido', 'Esgoto transbordando', 'Mau cheiro de esgoto'],
            'Praça Abandonada': ['Praça suja', 'Equipamentos quebrados', 'Mato alto na praça']
        }
        
        descriptions = {
            'Buraco na Rua': ['Há um buraco grande que está causando problemas para os veículos', 'O asfalto está muito danificado e perigoso'],
            'Calçada Danificada': ['A calçada está quebrada e oferece risco aos pedestres', 'Várias pedras soltas na calçada'],
            'Lâmpada Queimada': ['O poste está sem iluminação há vários dias', 'A rua está muito escura à noite'],
            'Lixo Acumulado': ['Muito lixo acumulado na via pública', 'Entulho abandonado há semanas'],
            'Árvore Caída': ['Árvore caiu e está bloqueando a passagem', 'Galhos grandes caídos na rua'],
            'Semáforo Defeituoso': ['O semáforo não está funcionando corretamente', 'Sinal está sempre piscando'],
            'Esgoto Entupido': ['Bueiro entupido causando alagamento', 'Forte mau cheiro de esgoto'],
            'Praça Abandonada': ['A praça está abandonada e suja', 'Equipamentos quebrados e perigosos']
        }
        
        title = random.choice(titles.get(category.name, ['Problema reportado']))
        description = random.choice(descriptions.get(category.name, ['Descrição do problema']))
        
        occurrence = Occurrence(
            title=title,
            description=description,
            category_id=category.id,
            citizen_id=citizen.id,
            latitude=lat,
            longitude=lng,
            address=random.choice(addresses),
            status=status,
            priority=random.choice(list(Priority)),
            created_at=created_date,
            updated_at=created_date
        )
        
        # Se está resolvida, definir data de resolução
        if status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]:
            resolve_days = random.randint(1, min(days_ago, 30))
            occurrence.resolved_at = created_date + timedelta(days=resolve_days)
            occurrence.assigned_to = random.choice(admin_users).id
            
            # Se está fechada, adicionar avaliação
            if status == OccurrenceStatus.CLOSED:
                occurrence.rating = random.randint(3, 5)
                occurrence.feedback = random.choice([
                    'Problema resolvido rapidamente, obrigado!',
                    'Excelente atendimento da equipe.',
                    'Demorou um pouco mas foi resolvido.',
                    'Muito satisfeito com a solução.',
                    'Equipe muito eficiente!'
                ])
        
        db.session.add(occurrence)
        occurrences.append(occurrence)
    
    db.session.flush()
    
    # 6. Criar timeline para as ocorrências
    for occurrence in occurrences:
        # Timeline de criação
        timeline_created = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=occurrence.citizen_id,
            action='created',
            description='Ocorrência criada pelo cidadão',
            new_status=OccurrenceStatus.OPEN,
            created_at=occurrence.created_at
        )
        db.session.add(timeline_created)
        
        # Se tem admin atribuído, adicionar timeline de atribuição
        if occurrence.assigned_to:
            timeline_assigned = OccurrenceTimeline(
                occurrence_id=occurrence.id,
                user_id=occurrence.assigned_to,
                action='assigned',
                description='Ocorrência atribuída para análise',
                created_at=occurrence.created_at + timedelta(hours=random.randint(1, 24))
            )
            db.session.add(timeline_assigned)
            
            # Timeline de mudança para em progresso
            if occurrence.status != OccurrenceStatus.OPEN:
                timeline_progress = OccurrenceTimeline(
                    occurrence_id=occurrence.id,
                    user_id=occurrence.assigned_to,
                    action='status_changed',
                    description='Equipe foi enviada ao local',
                    old_status=OccurrenceStatus.OPEN,
                    new_status=OccurrenceStatus.IN_PROGRESS,
                    created_at=occurrence.created_at + timedelta(hours=random.randint(24, 72))
                )
                db.session.add(timeline_progress)
            
            # Timeline de resolução
            if occurrence.resolved_at:
                timeline_resolved = OccurrenceTimeline(
                    occurrence_id=occurrence.id,
                    user_id=occurrence.assigned_to,
                    action='status_changed',
                    description='Problema foi resolvido pela equipe',
                    old_status=OccurrenceStatus.IN_PROGRESS,
                    new_status=OccurrenceStatus.RESOLVED,
                    created_at=occurrence.resolved_at
                )
                db.session.add(timeline_resolved)
                
                # Timeline de avaliação (se fechada)
                if occurrence.status == OccurrenceStatus.CLOSED:
                    timeline_rated = OccurrenceTimeline(
                        occurrence_id=occurrence.id,
                        user_id=occurrence.citizen_id,
                        action='rated',
                        description=f'Cidadão avaliou com {occurrence.rating} estrelas',
                        old_status=OccurrenceStatus.RESOLVED,
                        new_status=OccurrenceStatus.CLOSED,
                        created_at=occurrence.resolved_at + timedelta(hours=random.randint(1, 48))
                    )
                    db.session.add(timeline_rated)
    
    # 7. Criar alguns apoios às ocorrências
    for _ in range(100):  # 100 apoios aleatórios
        occurrence = random.choice(occurrences)
        citizen = random.choice(citizens)
        
        # Verificar se já apoiou
        existing = OccurrenceSupport.query.filter_by(
            occurrence_id=occurrence.id,
            citizen_id=citizen.id
        ).first()
        
        if not existing:
            support = OccurrenceSupport(
                occurrence_id=occurrence.id,
                citizen_id=citizen.id,
                created_at=occurrence.created_at + timedelta(days=random.randint(0, 30))
            )
            db.session.add(support)
    
    # Commit todas as mudanças
    db.session.commit()
    print("Dados iniciais criados com sucesso!")
    print(f"- {len(departments)} departamentos")
    print(f"- {len(categories)} categorias")
    print(f"- {len(admin_users)} usuários administrativos")
    print(f"- {len(citizens)} cidadãos")
    print(f"- {len(occurrences)} ocorrências")
    print("\nCredenciais de teste:")
    print("Admin: joao.silva@lavras.mg.gov.br / admin123")
    print("Cidadão: roberto.ferreira@email.com / 123456")
