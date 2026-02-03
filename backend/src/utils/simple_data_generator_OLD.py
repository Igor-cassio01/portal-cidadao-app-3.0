#!/usr/bin/env python3
"""
Script simplificado para gerar dados massivos
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.main import app
from src.models.models import db, Occurrence, User, Category, Department, OccurrenceStatus, Priority, UserType, OccurrenceTimeline
from werkzeug.security import generate_password_hash
import random
from datetime import datetime, timedelta

# Dados realistas
NEIGHBORHOODS = [
    'Centro', 'Morada do Sol I', 'Morada do Sol II', 'Morada do Sol III',
    'Jardim Floresta', 'Vila Esperança', 'Bela Vista', 'São Cristóvão',
    'Jardim América', 'Parque das Acácias', 'Vila São Francisco',
    'Residencial Parque das Águas', 'Jardim das Oliveiras', 'Vila Nova',
    'Conjunto Habitacional JK', 'Bairro Industrial', 'Jardim Glória',
    'Vila Santa Terezinha', 'Residencial Ipê', 'Jardim Eldorado'
]

STREETS = [
    'Rua das Flores', 'Avenida Brasil', 'Rua São José', 'Rua da Paz',
    'Avenida Getúlio Vargas', 'Rua 15 de Novembro', 'Rua Tiradentes',
    'Avenida Dr. Sylvio Menicucci', 'Rua Coronel José Bento'
]

TITLES_BY_CATEGORY = {
    'Buraco na Rua': [
        'Buraco grande na pista principal',
        'Cratera na rua prejudica trânsito',
        'Buraco profundo na via',
        'Asfalto danificado com buraco'
    ],
    'Calçada Danificada': [
        'Calçada quebrada em frente ao comércio',
        'Piso da calçada solto e perigoso',
        'Calçada com buracos',
        'Desnível perigoso na calçada'
    ],
    'Lâmpada Queimada': [
        'Poste sem iluminação há dias',
        'Lâmpada queimada na praça',
        'Iluminação pública apagada',
        'Poste de luz não funciona'
    ],
    'Lixo Acumulado': [
        'Lixo acumulado na esquina',
        'Entulho abandonado na rua',
        'Lixo não coletado há dias',
        'Acúmulo de lixo em terreno baldio'
    ]
}

CITIZEN_NAMES = [
    'Ana Silva Santos', 'Carlos Eduardo Lima', 'Maria José Oliveira',
    'João Pedro Costa', 'Fernanda Alves', 'Roberto Ferreira',
    'Juliana Mendes', 'Paulo Ricardo', 'Amanda Rodrigues',
    'Marcos Antônio', 'Luciana Pereira', 'Rafael Santos',
    'Patrícia Lima', 'Diego Almeida', 'Camila Souza',
    'Thiago Barbosa', 'Renata Cardoso', 'Bruno Martins',
    'Gabriela Costa', 'Leonardo Silva', 'Mariana Dias'
]

def create_simple_data():
    """Cria dados simplificados"""
    with app.app_context():
        print("🚀 Criando dados simplificados...")
        
        # Limpar dados existentes (manter admins)
        print("🧹 Limpando dados antigos...")
        db.session.query(OccurrenceTimeline).delete()
        db.session.query(Occurrence).delete()
        db.session.query(User).filter(User.user_type != UserType.ADMIN).delete()
        db.session.commit()
        
        # Criar cidadãos
        print("👥 Criando cidadãos...")
        citizens = []
        for i, name in enumerate(CITIZEN_NAMES):
            citizen = User(
                name=name,
                email=f"cidadao{i+1}@email.com",
                phone=f"(35) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                password_hash=generate_password_hash('123456'),
                user_type=UserType.CITIZEN,
                is_active=True
            )
            db.session.add(citizen)
            citizens.append(citizen)
        
        db.session.commit()
        print(f"✅ {len(citizens)} cidadãos criados!")
        
        # Buscar dados existentes
        categories = Category.query.all()
        admins = User.query.filter_by(user_type=UserType.ADMIN).all()
        
        # Criar ocorrências
        print("📋 Criando 500 ocorrências...")
        occurrences = []
        
        for i in range(500):
            # Data aleatória nos últimos 6 meses
            days_ago = random.randint(0, 180)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            # Dados aleatórios
            category = random.choice(categories)
            citizen = random.choice(citizens)
            neighborhood = random.choice(NEIGHBORHOODS)
            street = random.choice(STREETS)
            
            # Título baseado na categoria
            if category.name in TITLES_BY_CATEGORY:
                title = random.choice(TITLES_BY_CATEGORY[category.name])
            else:
                title = f"Problema de {category.name.lower()}"
            
            # Endereço
            number = random.randint(1, 999)
            address = f"{street}, {number}, {neighborhood}, Lavras-MG"
            
            # Coordenadas de Lavras-MG
            latitude = -21.2450 + random.uniform(-0.05, 0.05)
            longitude = -45.0000 + random.uniform(-0.05, 0.05)
            
            # Status baseado na idade
            if days_ago > 120:  # Muito antiga
                status = random.choice([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
            elif days_ago > 60:  # Antiga
                status = random.choice([OccurrenceStatus.RESOLVED, OccurrenceStatus.IN_PROGRESS])
            elif days_ago > 30:  # Recente
                status = random.choice([OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.OPEN])
            else:  # Nova
                status = random.choice([OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS])
            
            # Prioridade
            priority = random.choice([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])
            
            # Descrição simples
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
            
            # Se não está aberta, atribuir admin
            if status != OccurrenceStatus.OPEN:
                occurrence.assigned_to = random.choice(admins).id
                
                # Se resolvida, adicionar avaliação
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
        
        db.session.commit()
        print(f"✅ {len(occurrences)} ocorrências criadas!")
        
        # Criar timeline básica
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
        
        # Estatísticas finais
        print("\n📊 ESTATÍSTICAS FINAIS:")
        print(f"👥 Cidadãos: {len(citizens)}")
        print(f"📋 Ocorrências: {len(occurrences)}")
        print(f"📅 Timeline: {timeline_count} entradas")
        
        # Por status
        for status in OccurrenceStatus:
            count = len([o for o in occurrences if o.status == status])
            print(f"   {status.value}: {count}")
        
        # Por bairro (top 10)
        neighborhood_stats = {}
        for occurrence in occurrences:
            for neighborhood in NEIGHBORHOODS:
                if neighborhood in occurrence.address:
                    neighborhood_stats[neighborhood] = neighborhood_stats.get(neighborhood, 0) + 1
                    break
        
        print(f"\n🏘️ TOP 10 BAIRROS:")
        for neighborhood, count in sorted(neighborhood_stats.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   {neighborhood}: {count} ocorrências")
        
        print("\n🎉 Dados criados com sucesso!")

if __name__ == '__main__':
    create_simple_data()
