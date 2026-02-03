from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, User, Department, Category, Occurrence, OccurrenceStatus, Priority, UserType
from sqlalchemy import func, extract
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

def admin_required():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.user_type == UserType.ADMIN

# Departamentos
@admin_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        departments = Department.query.filter_by(is_active=True).all()
        return jsonify({
            'departments': [dept.to_dict() for dept in departments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/departments', methods=['POST'])
@jwt_required()
def create_department():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        department = Department(
            name=data['name'],
            description=data.get('description'),
            email=data.get('email'),
            phone=data.get('phone')
        )
        
        db.session.add(department)
        db.session.commit()
        
        return jsonify({
            'message': 'Departamento criado com sucesso',
            'department': department.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Categorias
@admin_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.filter_by(is_active=True).all()
        return jsonify({
            'categories': [cat.to_dict() for cat in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        required_fields = ['name', 'department_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se departamento existe
        department = Department.query.get(data['department_id'])
        if not department:
            return jsonify({'error': 'Departamento não encontrado'}), 404
        
        category = Category(
            name=data['name'],
            description=data.get('description'),
            icon=data.get('icon'),
            color=data.get('color', '#3B82F6'),
            department_id=data['department_id']
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Categoria criada com sucesso',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Dashboard e Estatísticas
@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Estatísticas gerais
        total_occurrences = Occurrence.query.count()
        open_occurrences = Occurrence.query.filter_by(status=OccurrenceStatus.OPEN).count()
        in_progress_occurrences = Occurrence.query.filter_by(status=OccurrenceStatus.IN_PROGRESS).count()
        resolved_occurrences = Occurrence.query.filter_by(status=OccurrenceStatus.RESOLVED).count()
        closed_occurrences = Occurrence.query.filter_by(status=OccurrenceStatus.CLOSED).count()
        
        # Estatísticas por prioridade
        urgent_occurrences = Occurrence.query.filter_by(priority=Priority.URGENT).count()
        high_occurrences = Occurrence.query.filter_by(priority=Priority.HIGH).count()
        
        # Ocorrências dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_occurrences = Occurrence.query.filter(
            Occurrence.created_at >= thirty_days_ago
        ).count()
        
        # Tempo médio de resolução (em horas)
        resolved_with_time = Occurrence.query.filter(
            Occurrence.resolved_at.isnot(None)
        ).all()
        
        avg_resolution_time = 0
        if resolved_with_time:
            total_time = sum([
                (occ.resolved_at - occ.created_at).total_seconds() / 3600
                for occ in resolved_with_time
            ])
            avg_resolution_time = round(total_time / len(resolved_with_time), 1)
        
        # Avaliação média
        rated_occurrences = Occurrence.query.filter(
            Occurrence.rating.isnot(None)
        ).all()
        
        avg_rating = 0
        if rated_occurrences:
            avg_rating = round(
                sum([occ.rating for occ in rated_occurrences]) / len(rated_occurrences), 1
            )
        
        return jsonify({
            'total_occurrences': total_occurrences,
            'status_breakdown': {
                'open': open_occurrences,
                'in_progress': in_progress_occurrences,
                'resolved': resolved_occurrences,
                'closed': closed_occurrences
            },
            'priority_breakdown': {
                'urgent': urgent_occurrences,
                'high': high_occurrences
            },
            'recent_occurrences': recent_occurrences,
            'avg_resolution_time_hours': avg_resolution_time,
            'avg_rating': avg_rating,
            'total_citizens': User.query.filter_by(user_type=UserType.CITIZEN).count()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dashboard/occurrences-by-category', methods=['GET'])
@jwt_required()
def get_occurrences_by_category():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Ocorrências por categoria
        category_stats = db.session.query(
            Category.name,
            Category.color,
            func.count(Occurrence.id).label('count')
        ).join(
            Occurrence, Category.id == Occurrence.category_id
        ).group_by(
            Category.id, Category.name, Category.color
        ).all()
        
        return jsonify({
            'categories': [
                {
                    'name': stat.name,
                    'color': stat.color,
                    'count': stat.count
                }
                for stat in category_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dashboard/occurrences-timeline', methods=['GET'])
@jwt_required()
def get_occurrences_timeline():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Últimos 30 dias
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Ocorrências por dia
        daily_stats = db.session.query(
            func.date(Occurrence.created_at).label('date'),
            func.count(Occurrence.id).label('count')
        ).filter(
            Occurrence.created_at >= start_date
        ).group_by(
            func.date(Occurrence.created_at)
        ).order_by(
            func.date(Occurrence.created_at)
        ).all()
        
        return jsonify({
            'timeline': [
                {
                    'date': stat.date.isoformat(),
                    'count': stat.count
                }
                for stat in daily_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dashboard/performance-by-department', methods=['GET'])
@jwt_required()
def get_performance_by_department():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Performance por departamento
        dept_stats = db.session.query(
            Department.name,
            func.count(Occurrence.id).label('total'),
            func.sum(
                func.case(
                    (Occurrence.status == OccurrenceStatus.RESOLVED, 1),
                    (Occurrence.status == OccurrenceStatus.CLOSED, 1),
                    else_=0
                )
            ).label('resolved')
        ).join(
            Category, Department.id == Category.department_id
        ).join(
            Occurrence, Category.id == Occurrence.category_id
        ).group_by(
            Department.id, Department.name
        ).all()
        
        return jsonify({
            'departments': [
                {
                    'name': stat.name,
                    'total': stat.total,
                    'resolved': stat.resolved or 0,
                    'resolution_rate': round((stat.resolved or 0) / stat.total * 100, 1) if stat.total > 0 else 0
                }
                for stat in dept_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Usuários administrativos
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_admin_users():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        users = User.query.filter_by(user_type=UserType.ADMIN, is_active=True).all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_admin_user():
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        required_fields = ['name', 'email', 'password', 'department_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Verificar se departamento existe
        department = Department.query.get(data['department_id'])
        if not department:
            return jsonify({'error': 'Departamento não encontrado'}), 404
        
        user = User(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            user_type=UserType.ADMIN,
            department_id=data['department_id']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário administrativo criado com sucesso',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
