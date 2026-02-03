from datetime import datetime
import enum
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class UserType(enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"
    DEPARTMENT_MANAGER = "department_manager"
    SERVICE_PROVIDER = "service_provider"

class OccurrenceStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class Priority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.Enum(UserType), nullable=False, default=UserType.CITIZEN)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    address = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    department = db.relationship('Department', backref='users')
    occurrences = db.relationship('Occurrence', backref='citizen', lazy=True, foreign_keys='Occurrence.citizen_id')
    assigned_occurrences = db.relationship('Occurrence', backref='assigned_to_user', lazy=True, foreign_keys='Occurrence.assigned_to')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'user_type': self.user_type.value,
            'department': self.department.to_dict() if self.department else None,
            'address': self.address,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    color = db.Column(db.String(7))  # Hex color
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    department = db.relationship('Department', backref='categories')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'department': self.department.to_dict() if self.department else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Occurrence(db.Model):
    __tablename__ = 'occurrences'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    validated_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Localização
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(500), nullable=False)
    
    # Status e prioridade
    status = db.Column(db.Enum(OccurrenceStatus), nullable=False, default=OccurrenceStatus.OPEN)
    priority = db.Column(db.Enum(Priority), nullable=False, default=Priority.MEDIUM)
    
    # Datas
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    validated_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    blocking_reason = db.Column(db.Text, nullable=True)
    materials_used = db.Column(db.Text, nullable=True)
    execution_notes = db.Column(db.Text, nullable=True)
    
    # Avaliação
    rating = db.Column(db.Integer, nullable=True) # 1 a 5 estrelas
    feedback = db.Column(db.Text, nullable=True)
    
    # Relacionamentos
    category = db.relationship('Category', backref='occurrences')
    department = db.relationship('Department', backref='occurrences')
    approved_by = db.relationship('User', foreign_keys=[approved_by_id])
    validated_by = db.relationship('User', foreign_keys=[validated_by_id])
    photos = db.relationship('OccurrencePhoto', backref='occurrence', lazy=True, cascade='all, delete-orphan')
    timeline = db.relationship('OccurrenceTimeline', backref='occurrence', lazy=True, cascade='all, delete-orphan')
    supports = db.relationship('OccurrenceSupport', backref='occurrence', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_timeline=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category.to_dict() if self.category else None,
            'category_name': self.category.name if self.category else None,
            'citizen': {
                'id': self.citizen.id,
                'name': self.citizen.name,
                'email': self.citizen.email,
                'phone': self.citizen.phone
            } if self.citizen else None,
            'assigned_to_user': {
                'id': self.assigned_to_user.id,
                'name': self.assigned_to_user.name,
                'department': self.assigned_to_user.department.name if self.assigned_to_user.department else None
            } if self.assigned_to_user else None,
            'assigned_to_name': self.assigned_to_user.name if self.assigned_to_user else None,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'status': self.status.value,
            'priority': self.priority.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'rejection_reason': self.rejection_reason,
            'blocking_reason': self.blocking_reason,
            'materials_used': self.materials_used,
            'execution_notes': self.execution_notes,
            'rating': self.rating,
            'feedback': self.feedback,
            'photos': [photo.to_dict() for photo in self.photos],
            'support_count': len(self.supports)
        }
        
        if include_timeline:
            data['timeline'] = [item.to_dict() for item in self.timeline]
            
        return data

class OccurrencePhoto(db.Model):
    __tablename__ = 'occurrence_photos'
    
    id = db.Column(db.Integer, primary_key=True)
    occurrence_id = db.Column(db.Integer, db.ForeignKey('occurrences.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat(),
            'url': f'/api/uploads/{self.filename}'
        }

class OccurrenceTimeline(db.Model):
    __tablename__ = 'occurrence_timeline'
    
    id = db.Column(db.Integer, primary_key=True)
    occurrence_id = db.Column(db.Integer, db.ForeignKey('occurrences.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Pode ser nulo se for ação do sistema
    action = db.Column(db.String(100), nullable=False) # Ex: created, assigned, status_changed, resolved, commented
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='timeline_events')
    
    def to_dict(self):
        return {
            'id': self.id,
            'occurrence_id': self.occurrence_id,
            'user': self.user.to_dict() if self.user else None,
            'action': self.action,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }

class OccurrenceSupport(db.Model):
    __tablename__ = 'occurrence_supports'
    
    id = db.Column(db.Integer, primary_key=True)
    occurrence_id = db.Column(db.Integer, db.ForeignKey('occurrences.id'), nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    citizen = db.relationship('User', backref='supported_occurrences')
    
    def to_dict(self):
        return {
            'id': self.id,
            'occurrence_id': self.occurrence_id,
            'citizen': self.citizen.to_dict() if self.citizen else None,
            'created_at': self.created_at.isoformat()
        }

