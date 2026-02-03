#!/usr/bin/env python3
"""
Gerador de Dados Realistas para Portal do Cidadão
Baseado no Plano Detalhado de Implementação
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.main import app
from src.models.models import db, Occurrence, User, Category, Department, OccurrenceStatus, Priority, UserType, OccurrenceTimeline
from werkzeug.security import generate_password_hash
import random
from datetime import datetime, timedelta
import json

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
        'weight': 0.25,  # 25% das ocorrências
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

# PERFIS DE CIDADÃOS
CITIZEN_PROFILES = {
    'super_user': {
        'percentage': 0.05,
        'min_occurrences': 8,
        'max_occurrences': 20,
        'evaluation_rate': 0.95,
        'support_rate': 0.8,
        'avg_rating': 4.2
    },
    'active_user': {
        'percentage': 0.20,
        'min_occurrences': 3,
        'max_occurrences': 7,
        'evaluation_rate': 0.75,
        'support_rate': 0.4,
        'avg_rating': 4.0
    },
    'occasional_user': {
        'percentage': 0.75,
        'min_occurrences': 1,
        'max_occurrences': 3,
        'evaluation_rate': 0.45,
        'support_rate': 0.1,
        'avg_rating': 3.8
    }
}

# NOMES REALISTAS
CITIZEN_NAMES = [
    'Ana Silva Santos', 'Carlos Eduardo Lima', 'Maria José Oliveira', 'João Pedro Costa',
    'Fernanda Alves Pereira', 'Roberto Ferreira Silva', 'Juliana Mendes Souza', 'Paulo Ricardo Santos',
    'Amanda Rodrigues Lima', 'Marcos Antônio Oliveira', 'Luciana Pereira Costa', 'Rafael Santos Alves',
    'Patrícia Lima Ferreira', 'Diego Almeida Silva', 'Camila Souza Santos', 'Thiago Barbosa Lima',
    'Renata Cardoso Oliveira', 'Bruno Martins Costa', 'Gabriela Costa Alves', 'Leonardo Silva Pereira',
    'Mariana Dias Santos', 'Felipe Rodrigues Lima', 'Larissa Almeida Silva', 'Gustavo Santos Oliveira',
    'Natália Lima Costa', 'Ricardo Pereira Alves', 'Vanessa Silva Santos', 'André Oliveira Lima',
    'Priscila Costa Silva', 'Rodrigo Santos Pereira', 'Tatiane Alves Lima', 'Marcelo Silva Santos',
    'Cristiane Lima Oliveira', 'Fabiano Costa Alves', 'Adriana Santos Lima', 'Leandro Pereira Silva',
    'Simone Oliveira Santos', 'Daniel Lima Costa', 'Roberta Silva Alves', 'Henrique Santos Lima',
    'Carla Pereira Oliveira', 'Juliano Costa Silva', 'Mônica Lima Santos', 'Alexandre Alves Pereira',
    'Eliane Silva Lima', 'Márcio Santos Oliveira', 'Débora Costa Alves', 'Fábio Lima Silva',
    'Silvia Santos Pereira', 'Eduardo Oliveira Lima', 'Kátia Silva Costa'
]

def get_season(date):
    """Determina a estação do ano baseada na data"""
    month = date.month
    if month in [12, 1, 2]:
        return 'summer'  # Verão no hemisfério sul
    elif month in [3, 4, 5]:
        return 'autumn'
    elif month in [6, 7, 8]:
        return 'winter'
    else:
        return 'spring'

def calculate_priority_score(occurrence_data, supports=0, reincidence_rate=0):
    """Calcula score de prioridade baseado em múltiplos fatores"""
    base_priority = {
        Priority.LOW: 1,
        Priority.MEDIUM: 2,
        Priority.HIGH: 3,
        Priority.URGENT: 4
    }[occurrence_data['priority']]
    
    # Fatores de peso
    priority_weight = base_priority * 0.3
    support_weight = min(supports * 0.1, 1.0) * 0.2  # Máximo 1.0
    reincidence_weight = reincidence_rate * 0.3
    impact_weight = occurrence_data.get('public_impact', 0.5) * 0.2
    
    return priority_weight + support_weight + reincidence_weight + impact_weight

def generate_realistic_occurrences():
    """Gera ocorrências com padrões realistas"""
    with app.app_context():
        print("🚀 Gerando dados realistas do Portal do Cidadão...")
        
        # Limpar dados existentes (manter admins)
        print("🧹 Limpando dados antigos...")
        db.session.query(OccurrenceTimeline).delete()
        db.session.query(Occurrence).delete()
        db.session.query(User).filter(User.user_type != UserType.ADMIN).delete()
        db.session.commit()
        
        # Buscar dados existentes
        categories = {cat.name: cat for cat in Category.query.all()}
        departments = {dept.name: dept for dept in Department.query.all()}
        admins = User.query.filter_by(user_type=UserType.ADMIN).all()
        
        # Criar cidadãos com perfis realistas
        print("👥 Criando cidadãos com perfis realistas...")
        citizens = []
        
        for i, name in enumerate(CITIZEN_NAMES):
            # Determinar perfil do cidadão
            rand = random.random()
            if rand < CITIZEN_PROFILES['super_user']['percentage']:
                profile = 'super_user'
            elif rand < CITIZEN_PROFILES['super_user']['percentage'] + CITIZEN_PROFILES['active_user']['percentage']:
                profile = 'active_user'
            else:
                profile = 'occasional_user'
            
            # Escolher bairro baseado na população
            neighborhood_weights = [data['population'] for data in NEIGHBORHOODS_LAVRAS.values()]
            neighborhood = random.choices(list(NEIGHBORHOODS_LAVRAS.keys()), weights=neighborhood_weights)[0]
            
            citizen = User(
                name=name,
                email=f"cidadao{i+1}@email.com",
                phone=f"(35) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                password_hash=generate_password_hash('123456'),
                user_type=UserType.CITIZEN,
                is_active=True
            )
            citizen.profile_type = profile
            citizen.neighborhood = neighborhood
            
            db.session.add(citizen)
            citizens.append(citizen)
        
        db.session.commit()
        print(f"✅ {len(citizens)} cidadãos criados com perfis realistas!")
        
        # Gerar ocorrências baseadas em padrões realistas
        print("📋 Gerando 1000 ocorrências com padrões sazonais...")
        occurrences = []
        timeline_entries = []
        
        # Distribuir ocorrências ao longo de 12 meses
        start_date = datetime.utcnow() - timedelta(days=365)
        
        for i in range(1000):
            # Data aleatória nos últimos 12 meses
            days_offset = random.randint(0, 365)
            created_at = start_date + timedelta(days=days_offset)
            season = get_season(created_at)
            
            # Escolher categoria baseada em pesos e sazonalidade
            category_weights = []
            category_names = []
            
            for cat_name, cat_data in PROBLEMS_BY_CATEGORY.items():
                if cat_name in categories:
                    weight = cat_data['weight'] * cat_data['seasonal_multiplier'][season]
                    category_weights.append(weight)
                    category_names.append(cat_name)
            
            category_name = random.choices(category_names, weights=category_weights)[0]
            category = categories[category_name]
            cat_data = PROBLEMS_BY_CATEGORY[category_name]
            
            # Escolher cidadão baseado no perfil
            citizen = random.choice(citizens)
            
            # Escolher bairro (75% do bairro do cidadão, 25% outros)
            if random.random() < 0.75:
                neighborhood = citizen.neighborhood
            else:
                neighborhood_weights = [data['population'] for data in NEIGHBORHOODS_LAVRAS.values()]
                neighborhood = random.choices(list(NEIGHBORHOODS_LAVRAS.keys()), weights=neighborhood_weights)[0]
            
            # Gerar endereço
            street = random.choice(STREETS_BY_NEIGHBORHOOD[neighborhood])
            number = random.randint(1, 999)
            address = f"{street}, {number}, {neighborhood}, Lavras-MG"
            
            # Coordenadas de Lavras-MG com variação por bairro
            base_lat = -21.2450
            base_lng = -45.0000
            
            # Variação baseada no bairro (simulando posições reais)
            neighborhood_offset = hash(neighborhood) % 100
            latitude = base_lat + (neighborhood_offset - 50) * 0.001 + random.uniform(-0.01, 0.01)
            longitude = base_lng + (neighborhood_offset - 50) * 0.001 + random.uniform(-0.01, 0.01)
            
            # Determinar prioridade baseada no bairro e tipo de problema
            neighborhood_priority = NEIGHBORHOODS_LAVRAS[neighborhood]['priority_weight']
            
            if neighborhood_priority >= 1.3:  # Bairros carentes
                priority_weights = [0.1, 0.3, 0.4, 0.2]  # Mais urgentes
            elif neighborhood_priority <= 0.8:  # Bairros nobres
                priority_weights = [0.4, 0.4, 0.15, 0.05]  # Menos urgentes
            else:  # Bairros médios
                priority_weights = [0.25, 0.35, 0.25, 0.15]
            
            priority = random.choices([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT], 
                                    weights=priority_weights)[0]
            
            # Título e descrição
            title = random.choice(cat_data['titles'])
            description = f"Problema reportado no {neighborhood}. {title.lower()}. Necessita atenção da {cat_data['department']}."
            
            # Status baseado na idade e SLA
            days_old = (datetime.utcnow() - created_at).days
            sla_days = cat_data['sla_days']
            
            if days_old > sla_days * 3:  # Muito antiga
                status_weights = [0.05, 0.1, 0.15, 0.7]  # Maioria resolvida
            elif days_old > sla_days:  # Passou do SLA
                status_weights = [0.1, 0.2, 0.4, 0.3]
            elif days_old > sla_days * 0.5:  # Dentro do prazo
                status_weights = [0.2, 0.3, 0.4, 0.1]
            else:  # Recente
                status_weights = [0.6, 0.3, 0.1, 0.0]
            
            status = random.choices([OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS, 
                                   OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED], 
                                  weights=status_weights)[0]
            
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
            
            # Atribuição e resolução
            if status != OccurrenceStatus.OPEN:
                # Atribuir a admin do departamento correto
                dept_admins = [admin for admin in admins if cat_data['department'] in admin.name]
                if not dept_admins:
                    dept_admins = admins
                occurrence.assigned_to = random.choice(dept_admins).id
                
                if status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]:
                    # Tempo de resolução baseado no SLA e eficiência do departamento
                    if cat_data['department'] == 'Serviços Urbanos':  # Mais eficiente
                        resolution_days = random.uniform(0.5, sla_days * 0.8)
                    elif cat_data['department'] == 'Iluminação Pública':
                        resolution_days = random.uniform(0.2, sla_days * 0.6)
                    else:
                        resolution_days = random.uniform(1, sla_days * 1.2)
                    
                    occurrence.resolved_at = created_at + timedelta(days=resolution_days)
                    
                    # Avaliação baseada no perfil do cidadão e performance
                    profile_data = CITIZEN_PROFILES[citizen.profile_type]
                    if random.random() < profile_data['evaluation_rate']:
                        # Rating baseado na performance (dentro do SLA = melhor nota)
                        if resolution_days <= sla_days:
                            rating_weights = [0.02, 0.05, 0.15, 0.35, 0.43]  # Maioria 4-5
                        elif resolution_days <= sla_days * 1.5:
                            rating_weights = [0.05, 0.15, 0.35, 0.35, 0.10]  # Maioria 3-4
                        else:
                            rating_weights = [0.25, 0.35, 0.25, 0.10, 0.05]  # Maioria 2-3
                        
                        occurrence.rating = random.choices([1, 2, 3, 4, 5], weights=rating_weights)[0]
                        
                        # Feedback baseado na nota
                        if occurrence.rating >= 4:
                            feedbacks = [
                                "Excelente atendimento! Problema resolvido rapidamente.",
                                "Muito satisfeito com a agilidade da prefeitura.",
                                "Parabéns pela eficiência! Continuem assim.",
                                "Resolveram rápido e com qualidade. Obrigado!"
                            ]
                        elif occurrence.rating == 3:
                            feedbacks = [
                                "Problema resolvido, mas demorou um pouco.",
                                "Atendimento ok, mas poderia ser mais rápido.",
                                "Resolveram, mas dentro do prazo esperado apenas."
                            ]
                        else:
                            feedbacks = [
                                "Demorou muito para resolver o problema.",
                                "Atendimento demorado, precisa melhorar.",
                                "Esperava mais agilidade da prefeitura.",
                                "Problema resolvido, mas com muito atraso."
                            ]
                        
                        occurrence.feedback = random.choice(feedbacks)
            
            # Calcular score de prioridade
            supports = random.randint(0, 15) if citizen.profile_type == 'super_user' else random.randint(0, 5)
            occurrence.support_count = supports
            occurrence.priority_score = calculate_priority_score({
                'priority': priority,
                'public_impact': random.uniform(0.3, 0.9)
            }, supports)
            
            db.session.add(occurrence)
            occurrences.append(occurrence)
            
            # Criar timeline básica
            timeline_entries.append(OccurrenceTimeline(
                occurrence_id=len(occurrences),  # Será ajustado após commit
                user_id=citizen.id,
                action='created',
                description=f"Ocorrência criada: {title}",
                created_at=created_at
            ))
            
            if occurrence.assigned_to:
                timeline_entries.append(OccurrenceTimeline(
                    occurrence_id=len(occurrences),
                    user_id=occurrence.assigned_to,
                    action='assigned',
                    description=f"Atribuída ao departamento de {cat_data['department']}",
                    created_at=created_at + timedelta(hours=random.randint(1, 24))
                ))
            
            if occurrence.resolved_at:
                timeline_entries.append(OccurrenceTimeline(
                    occurrence_id=len(occurrences),
                    user_id=occurrence.assigned_to,
                    action='resolved',
                    description=f"Problema resolvido. Status: {status.value}",
                    created_at=occurrence.resolved_at
                ))
        
        db.session.commit()
        print(f"✅ {len(occurrences)} ocorrências criadas com padrões realistas!")
        
        # Ajustar IDs da timeline e criar
        print("📅 Criando timeline detalhada...")
        for i, timeline in enumerate(timeline_entries):
            occurrence_id = (i // 3) + 1  # Aproximadamente 3 entradas por ocorrência
            if occurrence_id <= len(occurrences):
                timeline.occurrence_id = occurrences[occurrence_id - 1].id
                db.session.add(timeline)
        
        db.session.commit()
        print(f"✅ {len(timeline_entries)} entradas de timeline criadas!")
        
        # Estatísticas finais
        print("\n📊 ESTATÍSTICAS REALISTAS GERADAS:")
        print(f"👥 Cidadãos: {len(citizens)}")
        print(f"📋 Ocorrências: {len(occurrences)}")
        print(f"📅 Timeline: {len(timeline_entries)} entradas")
        
        # Por status
        print(f"\n📈 DISTRIBUIÇÃO POR STATUS:")
        for status in OccurrenceStatus:
            count = len([o for o in occurrences if o.status == status])
            percentage = (count / len(occurrences)) * 100
            print(f"   {status.value}: {count} ({percentage:.1f}%)")
        
        # Por departamento
        print(f"\n🏛️ DISTRIBUIÇÃO POR DEPARTAMENTO:")
        dept_stats = {}
        for occurrence in occurrences:
            cat_name = next(name for name, cat in categories.items() if cat.id == occurrence.category_id)
            dept = PROBLEMS_BY_CATEGORY[cat_name]['department']
            dept_stats[dept] = dept_stats.get(dept, 0) + 1
        
        for dept, count in sorted(dept_stats.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(occurrences)) * 100
            print(f"   {dept}: {count} ({percentage:.1f}%)")
        
        # Top bairros
        print(f"\n🏘️ TOP 10 BAIRROS COM MAIS OCORRÊNCIAS:")
        neighborhood_stats = {}
        for occurrence in occurrences:
            for neighborhood in NEIGHBORHOODS_LAVRAS:
                if neighborhood in occurrence.address:
                    neighborhood_stats[neighborhood] = neighborhood_stats.get(neighborhood, 0) + 1
                    break
        
        for neighborhood, count in sorted(neighborhood_stats.items(), key=lambda x: x[1], reverse=True)[:10]:
            percentage = (count / len(occurrences)) * 100
            print(f"   {neighborhood}: {count} ({percentage:.1f}%)")
        
        # Métricas de satisfação
        rated_occurrences = [o for o in occurrences if o.rating]
        if rated_occurrences:
            avg_rating = sum(o.rating for o in rated_occurrences) / len(rated_occurrences)
            print(f"\n⭐ MÉTRICAS DE SATISFAÇÃO:")
            print(f"   Avaliação média: {avg_rating:.2f}/5.0")
            print(f"   Ocorrências avaliadas: {len(rated_occurrences)} ({(len(rated_occurrences)/len(occurrences)*100):.1f}%)")
        
        print("\n🎉 Dados realistas gerados com sucesso!")
        print("💡 O sistema agora simula uma operação municipal real!")

if __name__ == '__main__':
    generate_realistic_occurrences()
