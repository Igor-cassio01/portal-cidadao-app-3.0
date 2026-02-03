#!/usr/bin/env python3
"""
Script para gerar dados massivos e realistas para demonstração
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.main import app
from src.models.models import db, Occurrence, User, Category, Department, OccurrenceStatus, Priority, UserType, OccurrenceTimeline, OccurrencePhoto
from werkzeug.security import generate_password_hash
import random
from datetime import datetime, timedelta
import uuid

# Dados realistas de Lavras-MG
NEIGHBORHOODS = [
    'Centro', 'Morada do Sol I', 'Morada do Sol II', 'Morada do Sol III',
    'Jardim Floresta', 'Vila Esperança', 'Bela Vista', 'São Cristóvão',
    'Jardim América', 'Parque das Acácias', 'Vila São Francisco',
    'Residencial Parque das Águas', 'Jardim das Oliveiras', 'Vila Nova',
    'Conjunto Habitacional JK', 'Bairro Industrial', 'Jardim Glória',
    'Vila Santa Terezinha', 'Residencial Ipê', 'Jardim Eldorado',
    'Parque Residencial Lavras', 'Vila Fátima', 'Jardim Campestre',
    'Residencial Morada do Vale', 'Vila Santa Cruz'
]

STREETS = [
    'Rua das Flores', 'Avenida Brasil', 'Rua São José', 'Rua da Paz',
    'Avenida Getúlio Vargas', 'Rua 15 de Novembro', 'Rua Tiradentes',
    'Avenida Dr. Sylvio Menicucci', 'Rua Coronel José Bento',
    'Rua Bias Fortes', 'Rua Padre José Poggetti', 'Rua Ribeiro Junqueira',
    'Avenida Prefeito Tuany Toledo', 'Rua Comandante Pantaleão',
    'Rua Dr. Washington Luiz', 'Rua Conselheiro Lafaiete'
]

OCCURRENCE_TITLES = {
    'Buraco na Rua': [
        'Buraco grande na pista principal',
        'Cratera na rua prejudica trânsito',
        'Buraco profundo na via',
        'Asfalto danificado com buraco',
        'Buraco perigoso para veículos'
    ],
    'Calçada Danificada': [
        'Calçada quebrada em frente ao comércio',
        'Piso da calçada solto e perigoso',
        'Calçada com buracos',
        'Desnível perigoso na calçada',
        'Calçada rachada e irregular'
    ],
    'Lâmpada Queimada': [
        'Poste sem iluminação há dias',
        'Lâmpada queimada na praça',
        'Iluminação pública apagada',
        'Poste de luz não funciona',
        'Rua escura por falta de iluminação'
    ],
    'Lixo Acumulado': [
        'Lixo acumulado na esquina',
        'Entulho abandonado na rua',
        'Lixo não coletado há dias',
        'Acúmulo de lixo em terreno baldio',
        'Restos de construção na via'
    ],
    'Esgoto Entupido': [
        'Bueiro entupido causando alagamento',
        'Esgoto transbordando na rua',
        'Problema no sistema de drenagem',
        'Água parada por entupimento',
        'Esgoto a céu aberto'
    ],
    'Semáforo com Defeito': [
        'Semáforo piscando amarelo',
        'Sinal de trânsito não funciona',
        'Semáforo apagado no cruzamento',
        'Problema no semáforo da avenida',
        'Sinalização de trânsito defeituosa'
    ],
    'Árvore Caída': [
        'Árvore caída bloqueando a rua',
        'Galho grande caído na via',
        'Árvore derrubada pela chuva',
        'Tronco caído obstruindo passagem',
        'Árvore perigosa prestes a cair'
    ],
    'Poluição Sonora': [
        'Música alta perturbando vizinhança',
        'Ruído excessivo de obra',
        'Som alto em estabelecimento',
        'Barulho de maquinário à noite',
        'Perturbação sonora constante'
    ]
}

DESCRIPTIONS = {
    'Buraco na Rua': [
        'Há um buraco de aproximadamente 1 metro de diâmetro na pista, causando risco para veículos e motocicletas.',
        'Cratera profunda se formou após as chuvas, prejudicando o trânsito local.',
        'Asfalto cedeu formando um buraco perigoso que já causou danos a pneus de carros.',
        'Buraco grande na via principal está causando engarrafamentos e riscos de acidentes.'
    ],
    'Calçada Danificada': [
        'A calçada está com várias pedras soltas, oferecendo risco de queda para pedestres.',
        'Piso irregular da calçada dificulta a passagem de pessoas com mobilidade reduzida.',
        'Calçada quebrada em frente ao estabelecimento comercial precisa de reparo urgente.',
        'Desnível perigoso na calçada já causou algumas quedas de pedestres.'
    ],
    'Lâmpada Queimada': [
        'O poste de iluminação está apagado há mais de uma semana, deixando a rua muito escura.',
        'Falta de iluminação está prejudicando a segurança dos moradores à noite.',
        'Lâmpada queimada na praça deixa o local perigoso para crianças brincarem.',
        'Iluminação pública defeituosa compromete a segurança da região.'
    ]
}

CITIZEN_NAMES = [
    'Ana Silva Santos', 'Carlos Eduardo Lima', 'Maria José Oliveira',
    'João Pedro Costa', 'Fernanda Alves', 'Roberto Ferreira',
    'Juliana Mendes', 'Paulo Ricardo', 'Amanda Rodrigues',
    'Marcos Antônio', 'Luciana Pereira', 'Rafael Santos',
    'Patrícia Lima', 'Diego Almeida', 'Camila Souza',
    'Thiago Barbosa', 'Renata Cardoso', 'Bruno Martins',
    'Gabriela Costa', 'Leonardo Silva', 'Mariana Dias',
    'Rodrigo Nascimento', 'Vanessa Moreira', 'Felipe Torres',
    'Larissa Cunha', 'Gustavo Ramos', 'Priscila Freitas',
    'Daniel Carvalho', 'Tatiana Gomes', 'André Vieira'
]

def create_massive_data():
    """Cria dados massivos para demonstração"""
    with app.app_context():
        print("🚀 Iniciando geração de dados massivos...")
        
        # Limpar dados existentes (exceto admins)
        print("🧹 Limpando dados antigos...")
        db.session.query(OccurrenceTimeline).delete()
        db.session.query(OccurrencePhoto).delete()
        db.session.query(Occurrence).delete()
        
        # Manter apenas admins
        db.session.query(User).filter(User.user_type != UserType.ADMIN).delete()
        
        db.session.commit()
        
        # Criar cidadãos
        print("👥 Criando cidadãos...")
        citizens = []
        for i, name in enumerate(CITIZEN_NAMES):
            email = f"cidadao{i+1}@email.com"
            phone = f"(35) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
            
            citizen = User(
                name=name,
                email=email,
                phone=phone,
                password_hash=generate_password_hash('123456'),
                user_type=UserType.CITIZEN,
                is_active=True
            )
            
            db.session.add(citizen)
            citizens.append(citizen)
        
        db.session.commit()
        print(f"✅ {len(citizens)} cidadãos criados!")
        
        # Buscar categorias e departamentos
        categories = Category.query.all()
        departments = Department.query.all()
        admins = User.query.filter_by(user_type=UserType.ADMIN).all()
        
        # Criar ocorrências dos últimos 6 meses
        print("📋 Criando ocorrências...")
        occurrences = []
        
        start_date = datetime.utcnow() - timedelta(days=180)  # 6 meses atrás
        
        for i in range(500):  # 500 ocorrências
            # Data aleatória nos últimos 6 meses
            random_days = random.randint(0, 180)
            created_at = start_date + timedelta(days=random_days)
            
            # Selecionar dados aleatórios
            category = random.choice(categories)
            citizen = random.choice(citizens)
            neighborhood = random.choice(NEIGHBORHOODS)
            street = random.choice(STREETS)
            
            # Título e descrição baseados na categoria
            category_name = category.name
            if category_name in OCCURRENCE_TITLES:
                title = random.choice(OCCURRENCE_TITLES[category_name])
                description = random.choice(DESCRIPTIONS.get(category_name, ['Problema reportado pelo cidadão.']))
            else:
                title = f"Problema de {category_name.lower()}"
                description = f"Cidadão reportou problema relacionado a {category_name.lower()}."
            
            # Endereço completo
            number = random.randint(1, 999)
            address = f"{street}, {number}, {neighborhood}, Lavras-MG"
            
            # Coordenadas aproximadas de Lavras-MG
            latitude = -21.2450 + random.uniform(-0.05, 0.05)
            longitude = -45.0000 + random.uniform(-0.05, 0.05)
            
            # Status baseado na idade da ocorrência
            age_days = (datetime.utcnow() - created_at).days
            
            if age_days > 150:  # Muito antiga - provavelmente resolvida
                status = random.choices(
                    [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED, OccurrenceStatus.IN_PROGRESS],
                    weights=[60, 30, 10]
                )[0]
            elif age_days > 90:  # Antiga - mix de status
                status = random.choices(
                    [OccurrenceStatus.RESOLVED, OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.OPEN],
                    weights=[50, 30, 20]
                )[0]
            elif age_days > 30:  # Recente - mais em andamento
                status = random.choices(
                    [OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.RESOLVED, OccurrenceStatus.OPEN],
                    weights=[40, 35, 25]
                )[0]
            else:  # Muito recente - mais abertas
                status = random.choices(
                    [OccurrenceStatus.OPEN, OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.RESOLVED],
                    weights=[50, 35, 15]
                )[0]
            
            # Prioridade baseada na categoria
            if 'Semáforo' in category_name or 'Esgoto' in category_name:
                priority = random.choices([Priority.URGENT, Priority.HIGH], weights=[30, 70])[0]
            elif 'Buraco' in category_name or 'Árvore' in category_name:
                priority = random.choices([Priority.HIGH, Priority.MEDIUM], weights=[60, 40])[0]
            else:
                priority = random.choices([Priority.MEDIUM, Priority.LOW], weights=[70, 30])[0]
            
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
            
            # Se não está aberta, atribuir admin e definir datas
            if status != OccurrenceStatus.OPEN:
                occurrence.assigned_admin_id = random.choice(admins).id
                
                # Data de atribuição
                assigned_days = random.randint(1, max(2, min(7, age_days)))
                occurrence.assigned_at = created_at + timedelta(days=assigned_days)
                
                # Se resolvida, definir data de resolução
                if status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]:
                    remaining_days = max(1, age_days - assigned_days)
                    resolved_days = assigned_days + random.randint(1, max(2, min(30, remaining_days)))
                    occurrence.resolved_at = created_at + timedelta(days=resolved_days)
                    
                    # Adicionar avaliação (80% das resolvidas são avaliadas)
                    if random.random() < 0.8:
                        # Avaliações tendem a ser boas (distribuição realista)
                        rating = random.choices([1, 2, 3, 4, 5], weights=[5, 10, 15, 35, 35])[0]
                        occurrence.rating = rating
                        occurrence.evaluated_at = occurrence.resolved_at + timedelta(days=random.randint(1, 7))
                        
                        # Feedback baseado na nota
                        if rating >= 4:
                            feedbacks = [
                                "Excelente atendimento! Problema resolvido rapidamente.",
                                "Muito satisfeito com a resolução. Parabéns à equipe!",
                                "Serviço de qualidade. Recomendo!",
                                "Problema solucionado com eficiência.",
                                "Atendimento rápido e eficaz."
                            ]
                        elif rating == 3:
                            feedbacks = [
                                "Problema resolvido, mas demorou um pouco.",
                                "Atendimento ok, mas pode melhorar.",
                                "Resolvido, mas esperava mais agilidade.",
                                "Satisfatório, sem mais."
                            ]
                        else:
                            feedbacks = [
                                "Demorou muito para resolver.",
                                "Qualidade do serviço deixou a desejar.",
                                "Problema mal resolvido.",
                                "Não fiquei satisfeito com o atendimento.",
                                "Precisa melhorar muito."
                            ]
                        
                        occurrence.feedback = random.choice(feedbacks)
            
            db.session.add(occurrence)
            occurrences.append(occurrence)
        
        db.session.commit()
        print(f"✅ {len(occurrences)} ocorrências criadas!")
        
        # Criar timeline para ocorrências
        print("📅 Criando timeline...")
        timeline_count = 0
        
        for occurrence in occurrences:
            # Timeline de criação
            timeline = OccurrenceTimeline(
                occurrence_id=occurrence.id,
                user_id=occurrence.citizen_id,
                action='created',
                description=f"Ocorrência criada: {occurrence.title}"
            )
            timeline.created_at = occurrence.created_at
            db.session.add(timeline)
            timeline_count += 1
            
            # Timeline de atribuição
            if occurrence.assigned_admin_id:
                admin = User.query.get(occurrence.assigned_admin_id)
                dept_name = admin.department.name if admin and admin.department else 'departamento'
                timeline = OccurrenceTimeline(
                    occurrence_id=occurrence.id,
                    user_id=occurrence.assigned_admin_id,
                    action='assigned',
                    description=f"Ocorrência atribuída para {dept_name}"
                )
                timeline.created_at = occurrence.assigned_at or occurrence.created_at + timedelta(days=1)
                db.session.add(timeline)
                timeline_count += 1
                
                # Timeline de progresso (para algumas)
                if random.random() < 0.6:  # 60% têm update de progresso
                    progress_date = timeline.created_at + timedelta(days=random.randint(1, 10))
                    timeline = OccurrenceTimeline(
                        occurrence_id=occurrence.id,
                        user_id=occurrence.assigned_admin_id,
                        action='updated',
                        description=random.choice([
                            "Equipe técnica enviada ao local",
                            "Materiais solicitados para reparo",
                            "Análise técnica realizada",
                            "Aguardando aprovação orçamentária",
                            "Serviço em andamento"
                        ])
                    )
                    timeline.created_at = progress_date
                    db.session.add(timeline)
                    timeline_count += 1
            
            # Timeline de resolução
            if occurrence.resolved_at:
                timeline = OccurrenceTimeline(
                    occurrence_id=occurrence.id,
                    user_id=occurrence.assigned_admin_id,
                    action='resolved',
                    description=f"Ocorrência resolvida. Status: {occurrence.status.value}"
                )
                timeline.created_at = occurrence.resolved_at
                db.session.add(timeline)
                timeline_count += 1
                
                # Timeline de avaliação
                if occurrence.evaluated_at:
                    timeline = OccurrenceTimeline(
                        occurrence_id=occurrence.id,
                        user_id=occurrence.citizen_id,
                        action='evaluated',
                        description=f"Cidadão avaliou o serviço com {occurrence.rating} estrelas"
                    )
                    timeline.created_at = occurrence.evaluated_at
                    db.session.add(timeline)
                    timeline_count += 1
        
        db.session.commit()
        print(f"✅ {timeline_count} entradas de timeline criadas!")
        
        # Criar algumas fotos (simuladas)
        print("📸 Criando registros de fotos...")
        photo_count = 0
        
        for occurrence in random.sample(occurrences, min(200, len(occurrences))):  # 200 ocorrências com fotos
            # 1-3 fotos por ocorrência
            num_photos = random.randint(1, 3)
            
            for i in range(num_photos):
                photo = OccurrencePhoto(
                    occurrence_id=occurrence.id,
                    filename=f"demo_photo_{uuid.uuid4().hex[:8]}.jpg",
                    original_filename=f"foto_problema_{i+1}.jpg",
                    file_size=random.randint(50000, 500000),  # 50KB - 500KB
                    photo_type='initial'
                )
                photo.uploaded_at = occurrence.created_at + timedelta(minutes=random.randint(1, 30))
                
                db.session.add(photo)
                photo_count += 1
        
        db.session.commit()
        print(f"✅ {photo_count} fotos registradas!")
        
        # Estatísticas finais
        print("\n📊 ESTATÍSTICAS FINAIS:")
        print(f"👥 Cidadãos: {len(citizens)}")
        print(f"📋 Ocorrências: {len(occurrences)}")
        print(f"📅 Timeline: {timeline_count} entradas")
        print(f"📸 Fotos: {photo_count} registros")
        
        # Estatísticas por status
        for status in OccurrenceStatus:
            count = len([o for o in occurrences if o.status == status])
            print(f"   {status.value}: {count}")
        
        # Estatísticas por bairro
        print(f"\n🏘️ DISTRIBUIÇÃO POR BAIRROS:")
        neighborhood_stats = {}
        for occurrence in occurrences:
            for neighborhood in NEIGHBORHOODS:
                if neighborhood in occurrence.address:
                    neighborhood_stats[neighborhood] = neighborhood_stats.get(neighborhood, 0) + 1
                    break
        
        for neighborhood, count in sorted(neighborhood_stats.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   {neighborhood}: {count} ocorrências")
        
        print("\n🎉 Dados massivos gerados com sucesso!")
        print("💡 Use as credenciais existentes para testar o sistema.")

if __name__ == '__main__':
    create_massive_data()
