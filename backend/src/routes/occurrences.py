from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, Occurrence, OccurrencePhoto, OccurrenceTimeline, OccurrenceSupport, User, Category, OccurrenceStatus, Priority
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

occurrences_bp = Blueprint('occurrences', __name__)

# Caminho relativo ao diretório backend/src
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@occurrences_bp.route('', methods=['GET'])
def get_occurrences():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        category_id = request.args.get('category_id', type=int)
        priority = request.args.get('priority')
        citizen_id = request.args.get('citizen_id', type=int)
        
        query = Occurrence.query
        
        # Filtros
        if status:
            query = query.filter(Occurrence.status == OccurrenceStatus(status))
        if category_id:
            query = query.filter(Occurrence.category_id == category_id)
        if priority:
            query = query.filter(Occurrence.priority == Priority(priority))
        if citizen_id:
            query = query.filter(Occurrence.citizen_id == citizen_id)
        
        # Ordenação
        query = query.order_by(Occurrence.created_at.desc())
        
        # Paginação
        occurrences = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'occurrences': [occ.to_dict() for occ in occurrences.items],
            'total': occurrences.total,
            'pages': occurrences.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('/<int:occurrence_id>', methods=['GET'])
def get_occurrence(occurrence_id):
    try:
        occurrence = Occurrence.query.get(occurrence_id)
        
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        return jsonify({'occurrence': occurrence.to_dict(include_timeline=True)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('', methods=['POST'])
@jwt_required()
def create_occurrence():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação básica
        required_fields = ['title', 'description', 'category_id', 'latitude', 'longitude', 'address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se categoria existe
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Categoria não encontrada'}), 404
        
        # Criar ocorrência
        occurrence = Occurrence(
            title=data['title'],
            description=data['description'],
            category_id=data['category_id'],
            citizen_id=user_id,
            latitude=float(data['latitude']),
            longitude=float(data['longitude']),
            address=data['address'],
            priority=Priority(data.get('priority', 'medium'))
        )
        
        db.session.add(occurrence)
        db.session.flush()  # Para obter o ID
        
        # Adicionar entrada na timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence.id,
            user_id=user_id,
            action='created',
            description='Ocorrência criada pelo cidadão',
            new_status=OccurrenceStatus.OPEN
        )
        db.session.add(timeline_entry)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ocorrência criada com sucesso',
            'occurrence': occurrence.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('/<int:occurrence_id>/photos', methods=['POST'])
@jwt_required()
def upload_photos(occurrence_id):
    try:
        user_id = get_jwt_identity()
        occurrence = Occurrence.query.get(occurrence_id)
        
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        # Verificar se o usuário pode adicionar fotos (criador ou admin)
        user = User.query.get(user_id)
        if occurrence.citizen_id != user_id and user.user_type.value != 'admin':
            return jsonify({'error': 'Sem permissão para adicionar fotos'}), 403
        
        if 'photos' not in request.files:
            return jsonify({'error': 'Nenhuma foto enviada'}), 400
        
        files = request.files.getlist('photos')
        uploaded_photos = []
        
        # Criar diretório de upload se não existir
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                # Gerar nome único para o arquivo
                file_extension = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4()}.{file_extension}"
                
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
                uploaded_photos.append(photo)
        
        if uploaded_photos:
            # Adicionar entrada na timeline
            timeline_entry = OccurrenceTimeline(
                occurrence_id=occurrence_id,
                user_id=user_id,
                action='photos_added',
                description=f'{len(uploaded_photos)} foto(s) adicionada(s)'
            )
            db.session.add(timeline_entry)
            
            db.session.commit()
            
            return jsonify({
                'message': f'{len(uploaded_photos)} foto(s) enviada(s) com sucesso',
                'photos': [photo.to_dict() for photo in uploaded_photos]
            }), 201
        else:
            return jsonify({'error': 'Nenhuma foto válida foi enviada'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('/<int:occurrence_id>/status', methods=['PUT'])
@jwt_required()
def update_status(occurrence_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'admin':
            return jsonify({'error': 'Apenas administradores podem alterar status'}), 403
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        comment = data.get('comment', '')
        
        if not new_status:
            return jsonify({'error': 'Status é obrigatório'}), 400
        
        try:
            new_status_enum = OccurrenceStatus(new_status)
        except ValueError:
            return jsonify({'error': 'Status inválido'}), 400
        
        old_status = occurrence.status
        occurrence.status = new_status_enum
        occurrence.updated_at = datetime.utcnow()
        
        # Se foi resolvida, marcar data de resolução
        if new_status_enum == OccurrenceStatus.RESOLVED:
            occurrence.resolved_at = datetime.utcnow()
        
        # Atribuir ao usuário se não estiver atribuída
        if not occurrence.assigned_to:
            occurrence.assigned_to = user_id
        
        # Adicionar entrada na timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence_id,
            user_id=user_id,
            action='status_changed',
            description=comment or f'Status alterado para {new_status_enum.value}',
            old_status=old_status,
            new_status=new_status_enum
        )
        db.session.add(timeline_entry)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Status atualizado com sucesso',
            'occurrence': occurrence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('/<int:occurrence_id>/assign', methods=['PUT'])
@jwt_required()
def assign_occurrence(occurrence_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'admin':
            return jsonify({'error': 'Apenas administradores podem atribuir ocorrências'}), 403
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        data = request.get_json()
        assigned_to = data.get('assigned_to')
        
        if assigned_to:
            assigned_user = User.query.get(assigned_to)
            if not assigned_user or assigned_user.user_type.value != 'admin':
                return jsonify({'error': 'Usuário inválido para atribuição'}), 400
        
        old_assigned = occurrence.assigned_to
        occurrence.assigned_to = assigned_to
        occurrence.updated_at = datetime.utcnow()
        
        # Adicionar entrada na timeline
        if assigned_to:
            assigned_user = User.query.get(assigned_to)
            description = f'Atribuída para {assigned_user.name}'
        else:
            description = 'Atribuição removida'
            
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence_id,
            user_id=user_id,
            action='assigned',
            description=description
        )
        db.session.add(timeline_entry)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Atribuição atualizada com sucesso',
            'occurrence': occurrence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('/<int:occurrence_id>/support', methods=['POST'])
@jwt_required()
def support_occurrence(occurrence_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'citizen':
            return jsonify({'error': 'Apenas cidadãos podem apoiar ocorrências'}), 403
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        # Verificar se já apoiou
        existing_support = OccurrenceSupport.query.filter_by(
            occurrence_id=occurrence_id,
            citizen_id=user_id
        ).first()
        
        if existing_support:
            return jsonify({'error': 'Você já apoiou esta ocorrência'}), 400
        
        # Criar apoio
        support = OccurrenceSupport(
            occurrence_id=occurrence_id,
            citizen_id=user_id
        )
        db.session.add(support)
        
        # Adicionar entrada na timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence_id,
            user_id=user_id,
            action='supported',
            description=f'{user.name} apoiou esta ocorrência'
        )
        db.session.add(timeline_entry)
        
        db.session.commit()
        
        return jsonify({'message': 'Apoio registrado com sucesso'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@occurrences_bp.route('/<int:occurrence_id>/rating', methods=['POST'])
@jwt_required()
def rate_occurrence(occurrence_id):
    try:
        user_id = get_jwt_identity()
        occurrence = Occurrence.query.get(occurrence_id)
        
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        # Verificar se é o criador da ocorrência
        if occurrence.citizen_id != user_id:
            return jsonify({'error': 'Apenas o criador pode avaliar a ocorrência'}), 403
        
        # Verificar se está resolvida
        if occurrence.status != OccurrenceStatus.RESOLVED:
            return jsonify({'error': 'Apenas ocorrências resolvidas podem ser avaliadas'}), 400
        
        data = request.get_json()
        rating = data.get('rating')
        feedback = data.get('feedback', '')
        
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Avaliação deve ser entre 1 e 5'}), 400
        
        occurrence.rating = rating
        occurrence.feedback = feedback
        occurrence.status = OccurrenceStatus.CLOSED
        occurrence.updated_at = datetime.utcnow()
        
        # Adicionar entrada na timeline
        timeline_entry = OccurrenceTimeline(
            occurrence_id=occurrence_id,
            user_id=user_id,
            action='rated',
            description=f'Avaliação: {rating} estrelas',
            old_status=OccurrenceStatus.RESOLVED,
            new_status=OccurrenceStatus.CLOSED
        )
        db.session.add(timeline_entry)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Avaliação registrada com sucesso',
            'occurrence': occurrence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
