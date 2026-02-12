from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, Occurrence, OccurrenceStatus, Priority, User, Department, OccurrenceTimeline
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.utils.decorators import admin_required, department_manager_required
from datetime import datetime

triage_bp = Blueprint('triage', __name__)

@triage_bp.route('/occurrences/pending-triage', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_triage():
    """
    Retorna todas as ocorrências com status 'OPEN' que ainda não foram atribuídas a um departamento.
    Isso define a fila de triagem.
    """
    try:
        pending_occurrences = Occurrence.query.filter(
            Occurrence.status == OccurrenceStatus.OPEN,
            Occurrence.department_id.is_(None)
        ).order_by(Occurrence.created_at.asc()).all()

        return jsonify([occ.to_dict() for occ in pending_occurrences]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@triage_bp.route('/occurrences/<int:occurrence_id>/assign', methods=['POST'])
@jwt_required()
@admin_required
def assign_occurrence(occurrence_id):
    """
    Atribui uma ocorrência a um departamento, define a prioridade e, opcionalmente, atribui a um usuário.
    """
    try:
        data = request.get_json()
        department_id = data.get('department_id')
        priority = data.get('priority')
        assigned_to_id = data.get('assigned_to_id')
        
        if not department_id or not priority:
            return jsonify({'error': 'department_id e priority são obrigatórios'}), 400

        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404

        department = Department.query.get(department_id)
        if not department:
            return jsonify({'error': 'Departamento não encontrado'}), 404

        # 1. Atualizar a Ocorrência
        occurrence.department_id = department_id
        occurrence.priority = Priority(priority.upper())
        
        # Opcional: Atribuir a um usuário específico (prestador de serviço ou gestor)
        if assigned_to_id:
            assigned_to_user = User.query.get(assigned_to_id)
            if not assigned_to_user:
                return jsonify({'error': 'Usuário de atribuição não encontrado'}), 404
            occurrence.assigned_to = assigned_to_id
        else:
            occurrence.assigned_to = None

        # 2. Atualizar o Status para 'IN_PROGRESS' (Triagem Completa)
        occurrence.status = OccurrenceStatus.IN_PROGRESS
        occurrence.updated_at = datetime.utcnow()
        
        # 3. Registrar na Timeline
        current_user_id = get_jwt_identity()
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=current_user_id,
            action="Triagem e Atribuição Concluída",
            description=f"Atribuída ao departamento: {department.name}. Prioridade: {priority.upper()}. Atribuída a: {assigned_to_user.name if assigned_to_id else 'Nenhum usuário específico'}."
        )
        db.session.add(timeline_entry)
        db.session.commit()

        # TODO: Implementar Notificação para o Gestor do Departamento/Usuário Atribuído

        return jsonify(occurrence.to_dict()), 200

    except ValueError:
        return jsonify({'error': 'Prioridade inválida. Use LOW, MEDIUM, HIGH ou URGENT.'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@triage_bp.route('/departments/<int:department_id>/users', methods=['GET'])
@jwt_required()
@admin_required
def get_department_users(department_id):
    """
    Retorna a lista de usuários (gestores e prestadores de serviço) de um departamento.
    Usado para o modal de atribuição.
    """
    try:
        users = User.query.filter(
            User.department_id == department_id,
            User.user_type.in_(['admin', 'department_manager']) # Assumindo que 'admin' e 'department_manager' podem ser atribuídos
        ).all()
        
        return jsonify([{'id': user.id, 'name': user.name, 'user_type': user.user_type.value} for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rotas de Gestão de Departamento (para gestores de departamento)
@triage_bp.route('/department/my-occurrences', methods=['GET'])
@jwt_required()
@department_manager_required
def get_department_occurrences():
    """
    Retorna as ocorrências atribuídas ao departamento do usuário logado.
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.department_id:
            return jsonify({'error': 'Usuário não está associado a um departamento'}), 403

        department_occurrences = Occurrence.query.filter(
            Occurrence.department_id == user.department_id
        ).order_by(Occurrence.priority.desc(), Occurrence.created_at.asc()).all()

        return jsonify([occ.to_dict() for occ in department_occurrences]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

