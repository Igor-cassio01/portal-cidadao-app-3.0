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
    
    if Department.query.first():
        print("✅ Departamentos já existem")
        return
    
    print("🏛️ Criando departamentos...")
    
    departments_data = [
        {'name': 'Obras Públicas', 'description': 'Responsável por obras públicas, manutenção de ruas e infraestrutura urbana'},
        {'name': 'Serviços Urbanos', 'description': 'Limpeza urbana, coleta de lixo e manutenção de praças'},
        {'name': 'Iluminação Pública', 'description': 'Manutenção e instalação de iluminação pública'},
        {'name': 'Meio Ambiente', 'description': 'Questões ambientais e sustentabilidade'},
        {'name': 'Trânsito', 'description': 'Transporte público e trânsito'},
        {'name': 'Saneamento', 'description': 'Água, esgoto e drenagem'},
        {'name': 'Administração', 'description': 'Administração geral e outros serviços'}
    ]
    
    departments = {}
    for dept_data in departments_data:
        dept = Department(**dept_data)
        db.session.add(dept)
        db.session.flush()
        departments[dept_data['name']] = dept
    
    db.session.commit()
    print(f"✅ {len(departments)} departamentos criados!")
    
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
    
    admin_users_to_add = []
    for user_data in admin_users_data:
        if not User.query.filter_by(email=user_data["email"]).first():
            dept = Department.query.filter_by(name=user_data["department"]).first()
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                phone=user_data["phone"],
                user_type=UserType.ADMIN,
                department_id=dept.id if dept else None,
                password_hash=generate_password_hash("admin123"),
                is_active=True
            )
            db.session.add(user)
            admin_users_to_add.append(user)
    
    if admin_users_to_add:
        db.session.commit()
        print(f"✅ {len(admin_users_to_add)} administradores criados!")
    else:
        print("✅ Administradores já existem")


def create_realistic_citizens_and_occurrences():
    """Cria cidadãos e ocorrências realistas"""
    
    if Occurrence.query.first():
        print("✅ Ocorrências já existem")
        return
    
    print("👥 Criando cidadãos realistas...")
    
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
    
    citizens_to_add = []
    for name in citizen_names:
        email = name.lower().replace(' ', '.') + '@email.com'
        if not User.query.filter_by(email=email).first():
            citizen = User(
                name=name,
                email=email,
                phone=f'(35) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
                password_hash=generate_password_hash('123456'),
                user_type=UserType.CITIZEN,
                is_active=True
            )
            db.session.add(citizen)
            citizens_to_add.append(citizen)
    
    if citizens_to_add:
        db.session.commit()
        print(f"✅ {len(citizens_to_add)} cidadãos criados!")
    else:
        print("✅ Cidadãos já existem")

    if Occurrence.query.first():
        print("✅ Ocorrências já existem")
        return

    print("📋 Criando 1000 ocorrências realistas...")

    categories = Category.query.all()
    admins = User.query.filter_by(user_type=UserType.ADMIN).all()
    citizens = User.query.filter_by(user_type=UserType.CITIZEN).all()

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
            'Resgate de animal em perigo',
            'Animal perdido precisa de ajuda'
        ],
        'Outros': [
            'Problema geral na vizinhança',
            'Necessidade de manutenção na área',
            'Solicitação de melhoria urbana',
            'Questão não listada',
            'Outro problema a ser resolvido'
        ]
    }

    for _ in range(1000):
        category = random.choice(categories)
        citizen = random.choice(citizens)
        
        occurrence = Occurrence(
            title=random.choice(titles_by_category.get(category.name, ['Título genérico'])),
            description=f"Descrição detalhada da ocorrência número {_ + 1}. O problema persiste e necessita de atenção imediata.",
            category_id=category.id,
            citizen_id=citizen.id,
            latitude=random.uniform(-21.25, -21.23),
            longitude=random.uniform(-45.0, -44.98),
            address=f"{random.choice(streets)}, {random.randint(100, 2000)}, {random.choice(neighborhoods)}",
            status=random.choice(list(OccurrenceStatus)),
            priority=random.choice(list(Priority)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 365))
        )
        db.session.add(occurrence)

    db.session.commit()
    print("✅ 1000 ocorrências criadas!")


def init_database(app):
    with app.app_context():
        db.create_all()
        create_departments_and_categories()
        create_admin_users()
        create_realistic_citizens_and_occurrences()
