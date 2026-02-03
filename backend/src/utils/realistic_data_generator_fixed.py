#!/usr/bin/env python3
"""
Gerador de Dados Realistas para Portal do Cidadão - VERSÃO CORRIGIDA
Remove importação circular e usa app_context diretamente
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# NÃO importar app diretamente - isso causa importação circular
# from src.main import app  # ❌ REMOVIDO

from flask import Flask
from src.models.models import db, Occurrence, User, Category, Department, OccurrenceStatus, Priority, UserType, OccurrenceTimeline
from werkzeug.security import generate_password_hash
import random
from datetime import datetime, timedelta
import json


def create_app():
    """Cria uma instância da aplicação Flask sem importação circular"""
    app = Flask(__name__)
    
    # Configurações
    app.config['SECRET_KEY'] = 'portal-cidadao-secret-key-2024'
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar banco de dados
    db.init_app(app)
    
    return app


# DADOS REALISTAS DE LAVRAS-MG
NEIGHBORHOODS_LAVRAS = {
    # Bairros centrais (maior densidade populacional)
    'Centro': {'population': 8500, 'priority_weight': 1.2},
    'Jardim América': {'population': 6200, 'priority_weight': 1.0},
    'Vila Esperança': {'population': 5800, 'priority_weight': 0.9},
    
    # Bairros residenciais (classe média)
    'Morada do Sol I': {'population': 4500, 'priority_weight': 0.8},
    'Morada do Sol II': {'population': 4200, 'priority_weight': 0.8},
    'Morada do Sol III': {'population': 3800, 'priority_weight': 0.8},
    'Jardim Floresta': {'population': 3500, 'priority_weight': 0.7},
    'Bela Vista': {'population': 3200, 'priority_weight': 0.7},
    
    # Bairros periféricos (maior necessidade de atenção)
    'São Cristóvão': {'population': 2800, 'priority_weight': 1.3},
    'Vila São Francisco': {'population': 2500, 'priority_weight': 1.2},
    'Parque das Acácias': {'population': 2200, 'priority_weight': 1.1},
    'Jardim das Oliveiras': {'population': 2000, 'priority_weight': 1.1},
    'Vila Nova': {'population': 1800, 'priority_weight': 1.4},
    'Conjunto Habitacional JK': {'population': 1600, 'priority_weight': 1.5},
    'Bairro Industrial': {'population': 1400, 'priority_weight': 1.0},
    'Jardim Glória': {'population': 1200, 'priority_weight': 1.3},
    'Vila Santa Terezinha': {'population': 1000, 'priority_weight': 1.4},
    'Residencial Ipê': {'population': 900, 'priority_weight': 0.9},
    'Jardim Eldorado': {'population': 800, 'priority_weight': 1.2},
    'Residencial Parque das Águas': {'population': 700, 'priority_weight': 0.8}
}

STREETS_BY_NEIGHBORHOOD = {
    'Centro': ['Rua Tiradentes', 'Avenida Dr. Sylvio Menicucci', 'Rua Coronel José Bento', 'Praça Dr. Augusto Silva'],
    'Jardim América': ['Rua das Américas', 'Avenida Brasil', 'Rua São Paulo', 'Rua Rio de Janeiro'],
    'Vila Esperança': ['Rua da Esperança', 'Rua da Paz', 'Rua São José', 'Rua Santa Rita'],
    'Morada do Sol I': ['Rua do Sol', 'Rua da Aurora', 'Rua do Amanhecer', 'Rua da Alvorada'],
    'Morada do Sol II': ['Rua dos Girassóis', 'Rua das Margaridas', 'Rua das Rosas', 'Rua dos Lírios'],
    'Morada do Sol III': ['Rua das Acácias', 'Rua dos Ipês', 'Rua das Palmeiras', 'Rua dos Eucaliptos']
}

# Completar ruas para outros bairros
for neighborhood in NEIGHBORHOODS_LAVRAS:
    if neighborhood not in STREETS_BY_NEIGHBORHOOD:
        STREETS_BY_NEIGHBORHOOD[neighborhood] = [
            f'Rua Principal do {neighborhood}',
            f'Avenida Central do {neighborhood}',
            f'Rua {neighborhood} I',
            f'Rua {neighborhood} II'
        ]

# PROBLEMAS POR CATEGORIA COM SAZONALIDADE
PROBLEMS_BY_CATEGORY = {
    'Buraco na Rua': {
        'weight': 0.25,
        'seasonal_multiplier': {'winter': 1.5, 'spring': 1.2, 'summer': 0.8, 'autumn': 1.0},
        'titles': [
            'Buraco grande prejudica trânsito',
            'Cratera perigosa na via principal',
            'Asfalto danificado com buraco profundo',
            'Buraco na pista causa acidentes',
            'Via com buracos precisa de reparo urgente'
        ],
        'sla_days': 7,
        'department': 'Obras Públicas',
        'avg_cost': 1247
    },
    'Calçada Danificada': {
        'weight': 0.10,
        'seasonal_multiplier': {'winter': 1.3, 'spring': 1.1, 'summer': 0.9, 'autumn': 1.0},
        'titles': [
            'Calçada quebrada dificulta passagem',
            'Piso da calçada solto e perigoso',
            'Desnível perigoso na calçada',
            'Calçada com buracos precisa reparo',
            'Acessibilidade comprometida na calçada'
        ],
        'sla_days': 10,
        'department': 'Obras Públicas',
        'avg_cost': 890
    },
    'Lâmpada Queimada': {
        'weight': 0.15,
        'seasonal_multiplier': {'winter': 1.4, 'spring': 1.0, 'summer': 0.8, 'autumn': 1.2},
        'titles': [
            'Poste sem iluminação compromete segurança',
            'Lâmpada queimada na praça',
            'Iluminação pública apagada há dias',
            'Poste de luz não funciona',
            'Falta de iluminação gera insegurança'
        ],
        'sla_days': 2,
        'department': 'Iluminação Pública',
        'avg_cost': 156
    },
    'Lixo Acumulado': {
        'weight': 0.15,
        'seasonal_multiplier': {'winter': 0.8, 'spring': 1.0, 'summer': 1.6, 'autumn': 1.1},
        'titles': [
            'Lixo acumulado atrai pragas',
            'Entulho abandonado na rua',
            'Coleta não realizada há dias',
            'Acúmulo de lixo em terreno baldio',
            'Lixo na via pública precisa remoção'
        ],
        'sla_days': 1,
        'department': 'Serviços Urbanos',
        'avg_cost': 234
    },
    'Esgoto Entupido': {
        'weight': 0.08,
        'seasonal_multiplier': {'winter': 0.7, 'spring': 1.2, 'summer': 1.8, 'autumn': 1.0},
        'titles': [
            'Esgoto entupido causa mau cheiro',
            'Vazamento de esgoto na rua',
            'Bueiro entupido alaga via',
            'Problema de esgoto urgente',
            'Esgoto a céu aberto'
        ],
        'sla_days': 1,
        'department': 'Saneamento',
        'avg_cost': 567
    },
    'Poda de Árvore': {
        'weight': 0.10,
        'seasonal_multiplier': {'winter': 0.6, 'spring': 1.8, 'summer': 1.2, 'autumn': 1.4},
        'titles': [
            'Árvore precisa poda urgente',
            'Galhos ameaçam fiação elétrica',
            'Árvore obstrui passagem',
            'Poda necessária por segurança',
            'Galhos caídos bloqueiam via'
        ],
        'sla_days': 5,
        'department': 'Meio Ambiente',
        'avg_cost': 345
    },
    'Semáforo Defeituoso': {
        'weight': 0.05,
        'seasonal_multiplier': {'winter': 1.1, 'spring': 1.0, 'summer': 1.2, 'autumn': 1.0},
        'titles': [
            'Semáforo não funciona',
            'Sinalização defeituosa no cruzamento',
            'Semáforo piscando incorretamente',
            'Problema no semáforo causa congestionamento',
            'Sinalização precisa reparo urgente'
        ],
        'sla_days': 1,
        'department': 'Trânsito',
        'avg_cost': 890
    },
    'Animal Abandonado': {
        'weight': 0.07,
        'seasonal_multiplier': {'winter': 0.8, 'spring': 1.3, 'summer': 1.4, 'autumn': 1.0},
        'titles': [
            'Cão abandonado precisa resgate',
            'Animal ferido na via pública',
            'Gato abandonado em situação precária',
            'Animal doméstico perdido',
            'Resgate de animal necessário'
        ],
        'sla_days': 2,
        'department': 'Meio Ambiente',
        'avg_cost': 123
    },
    'Outros': {
        'weight': 0.05,
        'seasonal_multiplier': {'winter': 1.0, 'spring': 1.0, 'summer': 1.0, 'autumn': 1.0},
        'titles': [
            'Problema diverso na via pública',
            'Situação que requer atenção municipal',
            'Demanda específica do cidadão',
            'Solicitação de melhoria urbana',
            'Questão municipal diversa'
        ],
        'sla_days': 7,
        'department': 'Administração',
        'avg_cost': 450
    }
}

CITIZEN_NAMES = [
    'Ana Silva Santos', 'Carlos Eduardo Lima', 'Maria José Oliveira', 'João Pedro Costa',
    'Fernanda Alves Pereira', 'Roberto Ferreira Silva', 'Juliana Mendes Souza', 'Paulo Ricardo Santos',
    'Amanda Rodrigues Lima', 'Marcos Antônio Oliveira', 'Luciana Pereira Costa', 'Rafael Santos Alves',
    'Patrícia Lima Ferreira', 'Diego Almeida Silva', 'Camila Souza Santos', 'Thiago Barbosa Lima',
    'Renata Cardoso Oliveira', 'Bruno Martins Costa', 'Gabriela Costa Alves', 'Leonardo Silva Pereira'
]


def generate_realistic_data(num_occurrences=1000):
    """Gera dados realistas sem importação circular"""
    app = create_app()
    
    with app.app_context():
        print("🚀 Gerando dados realistas...")
        print(f"📋 Total de ocorrências a criar: {num_occurrences}")
        
        # Verificar se já existem dados
        existing_count = Occurrence.query.count()
        if existing_count > 0:
            print(f"⚠️  Já existem {existing_count} ocorrências no banco")
            response = input("Deseja limpar e recriar? (s/n): ")
            if response.lower() != 's':
                print("❌ Operação cancelada")
                return
            
            # Limpar dados
            print("🧹 Limpando dados antigos...")
            db.session.query(OccurrenceTimeline).delete()
            db.session.query(Occurrence).delete()
            db.session.query(User).filter(User.user_type != UserType.ADMIN).delete()
            db.session.commit()
        
        # Buscar dados base
        categories = Category.query.all()
        admins = User.query.filter_by(user_type=UserType.ADMIN).all()
        
        if not categories or not admins:
            print("❌ Erro: Categorias ou administradores não encontrados")
            print("Execute primeiro: python src/utils/init_database.py")
            return
        
        # Criar cidadãos
        print("👥 Criando cidadãos...")
        citizens = []
        for i, name in enumerate(CITIZEN_NAMES):
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
        print(f"📋 Criando {num_occurrences} ocorrências...")
        occurrences = []
        
        for i in range(num_occurrences):
            if (i + 1) % 100 == 0:
                print(f"   Progresso: {i + 1}/{num_occurrences}")
            
            # Data aleatória nos últimos 6 meses
            days_ago = random.randint(0, 180)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            # Selecionar categoria e bairro
            category = random.choice(categories)
            neighborhood = random.choice(list(NEIGHBORHOODS_LAVRAS.keys()))
            street = random.choice(STREETS_BY_NEIGHBORHOOD[neighborhood])
            citizen = random.choice(citizens)
            
            # Título baseado na categoria
            if category.name in PROBLEMS_BY_CATEGORY:
                title = random.choice(PROBLEMS_BY_CATEGORY[category.name]['titles'])
            else:
                title = f"Problema de {category.name.lower()}"
            
            # Endereço completo
            number = random.randint(1, 999)
            address = f"{street}, {number}, {neighborhood}, Lavras-MG"
            
            # Coordenadas de Lavras-MG com variação
            latitude = -21.2450 + random.uniform(-0.05, 0.05)
            longitude = -45.0000 + random.uniform(-0.05, 0.05)
            
            # Status baseado na idade
            if days_ago > 120:
                status = random.choice([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
            elif days_ago > 60:
                status = random.choice([OccurrenceStatus.RESOLVED, OccurrenceStatus.IN_PROGRESS])
            elif days_ago > 30:
                status = random.choice([OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.OPEN])
            else:
                status = random.choice([OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS])
            
            # Prioridade
            priority = random.choice([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])
            
            # Descrição
            description = f"Problema reportado pelo cidadão na região do {neighborhood}. Necessita atenção da prefeitura."
            
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
            
            # Atribuir e resolver se necessário
            if status != OccurrenceStatus.OPEN:
                occurrence.assigned_to = random.choice(admins).id
                
                if status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]:
                    occurrence.resolved_at = created_at + timedelta(days=random.randint(1, 30))
                    
                    # 70% das resolvidas têm avaliação
                    if random.random() < 0.7:
                        occurrence.rating = random.choices([1, 2, 3, 4, 5], weights=[5, 10, 15, 35, 35])[0]
                        
                        if occurrence.rating >= 4:
                            occurrence.feedback = "Excelente atendimento! Problema resolvido rapidamente."
                        elif occurrence.rating == 3:
                            occurrence.feedback = "Problema resolvido, mas demorou um pouco."
                        else:
                            occurrence.feedback = "Demorou muito para resolver."
            
            db.session.add(occurrence)
            occurrences.append(occurrence)
            
            # Commit em lotes de 100
            if (i + 1) % 100 == 0:
                db.session.commit()
        
        db.session.commit()
        print(f"✅ {len(occurrences)} ocorrências criadas!")
        
        # Criar timeline
        print("📅 Criando timeline...")
        timeline_count = 0
        
        for occurrence in occurrences:
            # Timeline de criação
            timeline = OccurrenceTimeline(
                occurrence_id=occurrence.id,
                user_id=occurrence.citizen_id,
                action='created',
                description=f"Ocorrência criada: {occurrence.title}",
                created_at=occurrence.created_at
            )
            db.session.add(timeline)
            timeline_count += 1
            
            # Timeline de atribuição
            if occurrence.assigned_to:
                timeline = OccurrenceTimeline(
                    occurrence_id=occurrence.id,
                    user_id=occurrence.assigned_to,
                    action='assigned',
                    description="Ocorrência atribuída para análise",
                    created_at=occurrence.created_at + timedelta(days=1)
                )
                db.session.add(timeline)
                timeline_count += 1
            
            # Timeline de resolução
            if occurrence.resolved_at:
                timeline = OccurrenceTimeline(
                    occurrence_id=occurrence.id,
                    user_id=occurrence.assigned_to,
                    action='resolved',
                    description=f"Ocorrência resolvida. Status: {occurrence.status.value}",
                    created_at=occurrence.resolved_at
                )
                db.session.add(timeline)
                timeline_count += 1
        
        db.session.commit()
        print(f"✅ {timeline_count} entradas de timeline criadas!")
        
        print("\n🎉 Dados criados com sucesso!")
        print(f"📊 Resumo:")
        print(f"   👥 Cidadãos: {len(citizens)}")
        print(f"   📋 Ocorrências: {len(occurrences)}")
        print(f"   📅 Timeline: {timeline_count} entradas")


if __name__ == '__main__':
    generate_realistic_data(1000)

