from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, Occurrence, OccurrenceEvaluation, OccurrencePhoto, User, OccurrenceStatus
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

evaluation_bp = Blueprint('evaluation', __name__)

UPLOAD_FOLDER = 'uploads/evaluations'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@evaluation_bp.route('/occurrences/<int:occurrence_id>/evaluate', methods=['POST'])
@jwt_required()
def evaluate_occurrence():
    """Cidadão avalia uma ocorrência resolvida"""
    try:
        user_id = get_jwt_identity()
        occurrence_id = request.view_args['occurrence_id']
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        # Verificar se o usuário é o dono da ocorrência
        if occurrence.citizen_id != user_id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Verificar se a ocorrência foi resolvida
        if occurrence.status not in [OccurrenceStatus.resolved, OccurrenceStatus.closed]:
            return jsonify({'error': 'Ocorrência ainda não foi resolvida'}), 400
        
        data = request.get_json()
        
        # Validar dados
        if not data.get('rating') or data['rating'] < 1 or data['rating'] > 5:
            return jsonify({'error': 'Avaliação deve ser entre 1 e 5'}), 400
        
        # Verificar se já foi avaliada
        existing_evaluation = OccurrenceEvaluation.query.filter_by(
            occurrence_id=occurrence_id
        ).first()
        
        if existing_evaluation:
            return jsonify({'error': 'Ocorrência já foi avaliada'}), 400
        
        # Criar avaliação
        evaluation = OccurrenceEvaluation(
            occurrence_id=occurrence_id,
            citizen_id=user_id,
            rating=data['rating'],
            feedback=data.get('feedback', ''),
            quality_rating=data.get('quality_rating', data['rating']),
            speed_rating=data.get('speed_rating', data['rating']),
            communication_rating=data.get('communication_rating', data['rating']),
            would_recommend=data.get('would_recommend', True),
            is_satisfied=data['rating'] >= 4,
            needs_rework=data.get('needs_rework', False)
        )
        
        db.session.add(evaluation)
        
        # Atualizar a ocorrência com a avaliação
        occurrence.rating = data['rating']
        occurrence.feedback = data.get('feedback', '')
        occurrence.evaluated_at = datetime.utcnow()
        
        # Se a avaliação for muito baixa, marcar para revisão
        if data['rating'] <= 2 or data.get('needs_rework', False):
            occurrence.needs_review = True
            occurrence.review_reason = 'Avaliação baixa do cidadão'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Avaliação registrada com sucesso',
            'evaluation': evaluation.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/occurrences/<int:occurrence_id>/evaluation-photos', methods=['POST'])
@jwt_required()
def upload_evaluation_photos():
    """Upload de fotos da avaliação (depois da resolução)"""
    try:
        user_id = get_jwt_identity()
        occurrence_id = request.view_args['occurrence_id']
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        if occurrence.citizen_id != user_id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        if 'photos' not in request.files:
            return jsonify({'error': 'Nenhuma foto enviada'}), 400
        
        files = request.files.getlist('photos')
        uploaded_photos = []
        
        # Criar diretório se não existir
        upload_path = os.path.join('src', 'static', UPLOAD_FOLDER)
        os.makedirs(upload_path, exist_ok=True)
        
        for file in files:
            if file and allowed_file(file.filename):
                # Gerar nome único
                file_extension = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # Salvar arquivo
                file_path = os.path.join(upload_path, unique_filename)
                file.save(file_path)
                
                # Criar registro no banco
                photo = OccurrencePhoto(
                    occurrence_id=occurrence_id,
                    filename=unique_filename,
                    original_filename=file.filename,
                    file_size=os.path.getsize(file_path),
                    photo_type='evaluation'  # Novo campo para distinguir tipos
                )
                
                db.session.add(photo)
                uploaded_photos.append(photo)
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(uploaded_photos)} fotos enviadas com sucesso',
            'photos': [photo.to_dict() for photo in uploaded_photos]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/occurrences/<int:occurrence_id>/contest', methods=['POST'])
@jwt_required()
def contest_resolution():
    """Cidadão contesta uma resolução"""
    try:
        user_id = get_jwt_identity()
        occurrence_id = request.view_args['occurrence_id']
        
        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({'error': 'Ocorrência não encontrada'}), 404
        
        if occurrence.citizen_id != user_id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        # Reabrir a ocorrência
        occurrence.status = OccurrenceStatus.open
        occurrence.needs_review = True
        occurrence.review_reason = data.get('reason', 'Contestação do cidadão')
        occurrence.contested_at = datetime.utcnow()
        occurrence.contest_reason = data.get('reason', '')
        
        # Criar timeline
        from src.models.models import OccurrenceTimeline
        timeline = OccurrenceTimeline(
            occurrence_id=occurrence_id,
            user_id=user_id,
            action='contested',
            description=f"Cidadão contestou a resolução: {data.get('reason', 'Sem motivo especificado')}"
        )
        
        db.session.add(timeline)
        db.session.commit()
        
        return jsonify({
            'message': 'Contestação registrada. A ocorrência foi reaberta para revisão.',
            'occurrence': occurrence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/admin/evaluations/pending', methods=['GET'])
@jwt_required()
def get_pending_evaluations():
    """Admin: Ocorrências resolvidas aguardando avaliação"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'admin':
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Ocorrências resolvidas sem avaliação
        pending = db.session.query(Occurrence).filter(
            Occurrence.status.in_([OccurrenceStatus.resolved, OccurrenceStatus.closed]),
            Occurrence.rating.is_(None)
        ).order_by(Occurrence.resolved_at.desc()).all()
        
        return jsonify({
            'pending_evaluations': [occ.to_dict() for occ in pending],
            'total': len(pending)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/admin/evaluations/low-rated', methods=['GET'])
@jwt_required()
def get_low_rated_occurrences():
    """Admin: Ocorrências com avaliação baixa"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'admin':
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Ocorrências com avaliação <= 2
        low_rated = Occurrence.query.filter(
            Occurrence.rating <= 2
        ).order_by(Occurrence.evaluated_at.desc()).all()
        
        return jsonify({
            'low_rated_occurrences': [occ.to_dict() for occ in low_rated],
            'total': len(low_rated)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/admin/evaluations/contested', methods=['GET'])
@jwt_required()
def get_contested_occurrences():
    """Admin: Ocorrências contestadas"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'admin':
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Ocorrências contestadas
        contested = Occurrence.query.filter(
            Occurrence.contested_at.isnot(None)
        ).order_by(Occurrence.contested_at.desc()).all()
        
        return jsonify({
            'contested_occurrences': [occ.to_dict() for occ in contested],
            'total': len(contested)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/admin/evaluations/stats', methods=['GET'])
@jwt_required()
def get_evaluation_stats():
    """Admin: Estatísticas de avaliação"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.user_type.value != 'admin':
            return jsonify({'error': 'Acesso negado'}), 403
        
        # Estatísticas gerais
        total_resolved = Occurrence.query.filter(
            Occurrence.status.in_([OccurrenceStatus.resolved, OccurrenceStatus.closed])
        ).count()
        
        total_evaluated = Occurrence.query.filter(
            Occurrence.rating.isnot(None)
        ).count()
        
        evaluation_rate = (total_evaluated / total_resolved * 100) if total_resolved > 0 else 0
        
        # Distribuição de notas
        rating_distribution = {}
        for i in range(1, 6):
            count = Occurrence.query.filter(Occurrence.rating == i).count()
            rating_distribution[str(i)] = count
        
        # Avaliação média
        avg_rating = db.session.query(db.func.avg(Occurrence.rating)).scalar() or 0
        
        # Ocorrências contestadas
        contested_count = Occurrence.query.filter(
            Occurrence.contested_at.isnot(None)
        ).count()
        
        return jsonify({
            'total_resolved': total_resolved,
            'total_evaluated': total_evaluated,
            'evaluation_rate': round(evaluation_rate, 1),
            'avg_rating': round(float(avg_rating), 1),
            'rating_distribution': rating_distribution,
            'contested_count': contested_count,
            'satisfaction_rate': round((rating_distribution.get('4', 0) + rating_distribution.get('5', 0)) / total_evaluated * 100, 1) if total_evaluated > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
