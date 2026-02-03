from src.models.models import db
from datetime import datetime
from enum import Enum

class OccurrenceEvaluation(db.Model):
    __tablename__ = 'occurrence_evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    occurrence_id = db.Column(db.Integer, db.ForeignKey('occurrences.id'), nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Avaliações específicas
    rating = db.Column(db.Integer, nullable=False)  # 1-5 geral
    quality_rating = db.Column(db.Integer)  # 1-5 qualidade do serviço
    speed_rating = db.Column(db.Integer)  # 1-5 velocidade de resolução
    communication_rating = db.Column(db.Integer)  # 1-5 comunicação da equipe
    
    # Feedback textual
    feedback = db.Column(db.Text)
    
    # Flags de satisfação
    is_satisfied = db.Column(db.Boolean, default=True)
    would_recommend = db.Column(db.Boolean, default=True)
    needs_rework = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    occurrence = db.relationship('Occurrence', backref='evaluation')
    citizen = db.relationship('User', backref='evaluations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'occurrence_id': self.occurrence_id,
            'citizen_id': self.citizen_id,
            'rating': self.rating,
            'quality_rating': self.quality_rating,
            'speed_rating': self.speed_rating,
            'communication_rating': self.communication_rating,
            'feedback': self.feedback,
            'is_satisfied': self.is_satisfied,
            'would_recommend': self.would_recommend,
            'needs_rework': self.needs_rework,
            'created_at': self.created_at.isoformat(),
            'citizen': {
                'id': self.citizen.id,
                'name': self.citizen.name,
                'email': self.citizen.email
            } if self.citizen else None
        }

# Adicionar campos ao modelo Occurrence existente
def add_evaluation_fields_to_occurrence():
    """
    Adiciona campos de avaliação ao modelo Occurrence existente
    Estes campos devem ser adicionados via migration
    """
    fields_to_add = [
        'evaluated_at',  # DateTime - quando foi avaliado
        'needs_review',  # Boolean - precisa de revisão
        'review_reason',  # String - motivo da revisão
        'contested_at',  # DateTime - quando foi contestado
        'contest_reason',  # Text - motivo da contestação
        'review_status',  # String - status da revisão
        'reviewed_by',  # Integer - ID do admin que revisou
        'reviewed_at'  # DateTime - quando foi revisado
    ]
    return fields_to_add
