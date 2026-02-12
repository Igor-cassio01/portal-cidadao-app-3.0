from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, Occurrence, OccurrencePhoto, OccurrenceStatus, OccurrenceTimeline, User
from src.utils.decorators import service_provider_required
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

# Caminho relativo ao diretório backend/src
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

execution_bp = Blueprint('execution', __name__)

@execution_bp.route('/my-assignments', methods=['GET'])
@jwt_required()
@service_provider_required
def get_my_assignments():
    """
    Retorna as ocorrências atribuídas ao usuário logado ou ao seu departamento.
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Ocorrências atribuídas diretamente ao usuário
        assigned_to_me = Occurrence.query.filter(
            Occurrence.assigned_to == current_user_id,
            Occurrence.status.in_([OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.RESOLVED])
        )
        
        # Ocorrências atribuídas ao departamento do usuário (se não estiverem atribuídas a outro)
        assigned_to_department = []
        if user.department_id:
            assigned_to_department = Occurrence.query.filter(
                Occurrence.department_id == user.department_id,
                Occurrence.assigned_to.is_(None),
                Occurrence.status.in_([OccurrenceStatus.IN_PROGRESS, OccurrenceStatus.RESOLVED])
            )
        
        # Combina e remove duplicatas (embora a lógica acima deva evitar)
        occurrences = list(set(list(assigned_to_me) + list(assigned_to_department)))
        
        # Ordena por prioridade e data de criação
        occurrences.sort(key=lambda x: (x.priority.value, x.created_at), reverse=True)

        return jsonify([occ.to_dict() for occ in occurrences]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@execution_bp.route('/occurrence/<int:occurrence_id>/start', methods=['POST'])
@jwt_required()
@service_provider_required
def start_execution(occurrence_id):
    """
    Registra o início da execução de uma ocorrência.
    """
    try:
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404

        if occurrence.status != OccurrenceStatus.IN_PROGRESS:
            return jsonify({'error': 'A ocorrência não está em progresso para ser iniciada.'}), 400

        if occurrence.started_at:
            return jsonify({'error': 'A execução desta ocorrência já foi iniciada.'}), 400

        current_user_id = get_jwt_identity()
        
        # Atualizar a Ocorrência
        occurrence.started_at = datetime.utcnow()
        occurrence.updated_at = datetime.utcnow()
        
        # Registrar na Timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=current_user_id,
            action="Execução Iniciada",
            description=f"O Prestador de Serviço {User.query.get(current_user_id).name} iniciou a execução."
        )
        db.session.add(timeline_entry)
        db.session.commit()

        return jsonify(occurrence.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@execution_bp.route('/occurrence/<int:occurrence_id>/complete', methods=['POST'])
@jwt_required()
@service_provider_required
def complete_execution(occurrence_id):
    """
    Registra a conclusão da execução de uma ocorrência.
    """
    try:
        data = request.get_json()
        execution_notes = data.get('execution_notes')
        materials_used = data.get('materials_used')
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404

        if occurrence.status != OccurrenceStatus.IN_PROGRESS:
            return jsonify({'error': 'A ocorrência não está em progresso para ser concluída.'}), 400

        current_user_id = get_jwt_identity()
        
        # Atualizar a Ocorrência
        occurrence.completed_at = datetime.utcnow()
        occurrence.updated_at = datetime.utcnow()
        occurrence.execution_notes = execution_notes
        occurrence.materials_used = materials_used
        occurrence.status = OccurrenceStatus.RESOLVED # Muda para RESOLVED, aguardando validação
        
        # Registrar na Timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=current_user_id,
            action="Execução Concluída",
            description=f"O Prestador de Serviço {User.query.get(current_user_id).name} concluiu a execução. Aguardando validação."
        )
        db.session.add(timeline_entry)
        db.session.commit()

        # TODO: Implementar Notificação para o Gestor do Departamento para validação

        return jsonify(occurrence.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@execution_bp.route('/occurrence/<int:occurrence_id>/upload_after_photo', methods=['POST'])
@jwt_required()
@service_provider_required
def upload_after_photo(occurrence_id):
    """
    Faz o upload da foto "Depois" da execução.
    """
    try:
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400

        if file and allowed_file(file.filename):
            # Criar diretório de upload se não existir
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            # Gerar nome único
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"after_{occurrence_id}_{uuid.uuid4().hex}.{file_extension}"
            
            # Salvar arquivo
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # Criar registro no banco
            photo = OccurrencePhoto(
                occurrence_id=occurrence_id,
                filename=unique_filename,
                original_filename=secure_filename(file.filename),
                file_size=os.path.getsize(file_path)
            )
            db.session.add(photo)
            
            # Registrar na Timeline
            current_user_id = get_jwt_identity()
            timeline_entry = OccurrenceTimeline(
                occurrence_id=occurrence_id,
                user_id=current_user_id,
                action='after_photo_added',
                description='Foto de conclusão (Depois) adicionada.'
            )
            db.session.add(timeline_entry)
            db.session.commit()
            
            return jsonify({
                'message': 'Foto enviada com sucesso',
                'photo': photo.to_dict()
            }), 201
        else:
            return jsonify({'error': 'Tipo de arquivo não permitido'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

