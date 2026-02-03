from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, Occurrence, OccurrenceStatus, OccurrenceTimeline, User
from src.utils.decorators import department_manager_required
from datetime import datetime

validation_bp = Blueprint('validation', __name__)

@validation_bp.route('/pending-validation', methods=['GET'])
@jwt_required()
@department_manager_required
def get_pending_validation():
    """
    Retorna as ocorrências com status 'RESOLVED' que pertencem ao departamento do usuário logado.
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.department_id:
            return jsonify({'error': 'Usuário não está associado a um departamento'}), 403

        pending_occurrences = Occurrence.query.filter(
            Occurrence.department_id == user.department_id,
            Occurrence.status == OccurrenceStatus.RESOLVED
        ).order_by(Occurrence.completed_at.asc()).all()

        return jsonify([occ.to_dict() for occ in pending_occurrences]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@validation_bp.route('/occurrence/<int:occurrence_id>/approve', methods=['POST'])
@jwt_required()
@department_manager_required
def approve_occurrence(occurrence_id):
    """
    Aprova a conclusão da ocorrência, mudando o status para 'CLOSED'.
    """
    try:
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404

        if occurrence.status != OccurrenceStatus.RESOLVED:
            return jsonify({'error': 'A ocorrência não está no status de RESOLVIDA para ser aprovada.'}), 400

        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if occurrence.department_id != user.department_id:
            return jsonify({'error': 'Você não tem permissão para validar ocorrências de outro departamento.'}), 403

        # Atualizar a Ocorrência
        occurrence.status = OccurrenceStatus.CLOSED
        occurrence.validated_at = datetime.utcnow()
        occurrence.validated_by_id = current_user_id
        occurrence.updated_at = datetime.utcnow()
        
        # Registrar na Timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=current_user_id,
            status_change="Validação Concluída",
            details=f"O Gestor de Departamento {user.name} aprovou a conclusão. Status final: FECHADA."
        )
        db.session.add(timeline_entry)
        db.session.commit()

        # TODO: Implementar Notificação para o Cidadão (Ocorrência Fechada)

        return jsonify(occurrence.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@validation_bp.route('/occurrence/<int:occurrence_id>/reject', methods=['POST'])
@jwt_required()
@department_manager_required
def reject_occurrence(occurrence_id):
    """
    Rejeita a conclusão da ocorrência, mudando o status de volta para 'IN_PROGRESS'.
    """
    try:
        data = request.get_json()
        rejection_reason = data.get('rejection_reason')
        
        if not rejection_reason:
            return jsonify({'error': 'O motivo da rejeição é obrigatório.'}), 400

        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404

        if occurrence.status != OccurrenceStatus.RESOLVED:
            return jsonify({'error': 'A ocorrência não está no status de RESOLVIDA para ser rejeitada.'}), 400

        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if occurrence.department_id != user.department_id:
            return jsonify({'error': 'Você não tem permissão para validar ocorrências de outro departamento.'}), 403

        # Atualizar a Ocorrência
        occurrence.status = OccurrenceStatus.IN_PROGRESS
        occurrence.rejection_reason = rejection_reason
        occurrence.updated_at = datetime.utcnow()
        
        # Registrar na Timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=current_user_id,
            status_change="Validação Rejeitada",
            details=f"O Gestor de Departamento {user.name} rejeitou a conclusão. Motivo: {rejection_reason}. Status: EM PROGRESSO."
        )
        db.session.add(timeline_entry)
        db.session.commit()

        # TODO: Implementar Notificação para o Prestador de Serviço (Rejeição)

        return jsonify(occurrence.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

