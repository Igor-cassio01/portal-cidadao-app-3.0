#!/usr/bin/env python3
"""
Script para adicionar bairros às ocorrências existentes
"""

from src.main import app
from src.models.models import db, Occurrence
import random

# Bairros de Lavras-MG (reais)
NEIGHBORHOODS = [
    'Centro', 'Morada do Sol I', 'Morada do Sol II', 'Morada do Sol III',
    'Jardim Floresta', 'Vila Esperança', 'Bela Vista', 'São Cristóvão',
    'Jardim América', 'Parque das Acácias', 'Vila São Francisco',
    'Residencial Parque das Águas', 'Jardim das Oliveiras', 'Vila Nova',
    'Conjunto Habitacional JK', 'Bairro Industrial', 'Jardim Glória',
    'Vila Santa Terezinha', 'Residencial Ipê', 'Jardim Eldorado'
]

def add_neighborhoods_to_occurrences():
    """Adiciona bairros aleatórios às ocorrências existentes"""
    with app.app_context():
        occurrences = Occurrence.query.all()
        
        for occurrence in occurrences:
            # Seleciona um bairro aleatório
            neighborhood = random.choice(NEIGHBORHOODS)
            
            # Atualiza o endereço para incluir o bairro
            if occurrence.address and 'Lavras-MG' in occurrence.address:
                # Remove o Lavras-MG antigo e adiciona o bairro
                base_address = occurrence.address.replace(', Lavras-MG', '')
                occurrence.address = f"{base_address}, {neighborhood}, Lavras-MG"
            else:
                occurrence.address = f"{occurrence.address}, {neighborhood}, Lavras-MG"
        
        db.session.commit()
        print(f"Bairros adicionados a {len(occurrences)} ocorrências!")
        
        # Mostra estatísticas por bairro
        print("\nEstatísticas por bairro:")
        for neighborhood in NEIGHBORHOODS:
            count = Occurrence.query.filter(Occurrence.address.contains(neighborhood)).count()
            print(f"{neighborhood}: {count} ocorrências")

if __name__ == '__main__':
    add_neighborhoods_to_occurrences()
