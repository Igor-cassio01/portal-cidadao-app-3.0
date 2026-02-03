"""
Endpoints Estratégicos para Dashboard Político
Métricas de Popularidade e Relatórios Gerenciais
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timedelta
from src.models.models import db, Occurrence, User, Category, Department, OccurrenceStatus, Priority, UserType, OccurrenceTimeline
import json

strategic_bp = Blueprint('strategic', __name__)

@strategic_bp.route('/political-kpis', methods=['GET'])
def get_political_kpis():
    """KPIs principais para o dashboard político"""
    try:
        # Período de análise (últimos 30 dias por padrão)
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total de ocorrências
        total_occurrences = Occurrence.query.filter(
            Occurrence.created_at >= start_date
        ).count()
        
        # Ocorrências resolvidas
        resolved_occurrences = Occurrence.query.filter(
            and_(
                Occurrence.created_at >= start_date,
                Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
            )
        ).count()
        
        # Taxa de resolução
        resolution_rate = (resolved_occurrences / total_occurrences * 100) if total_occurrences > 0 else 0
        
        # Cidadãos únicos atendidos
        unique_citizens = db.session.query(func.count(func.distinct(Occurrence.citizen_id))).filter(
            Occurrence.created_at >= start_date
        ).scalar()
        
        # Tempo médio de resolução (em horas)
        resolved_with_time = Occurrence.query.filter(
            and_(
                Occurrence.created_at >= start_date,
                Occurrence.resolved_at.isnot(None)
            )
        ).all()
        
        if resolved_with_time:
            total_hours = sum([
                (occ.resolved_at - occ.created_at).total_seconds() / 3600 
                for occ in resolved_with_time
            ])
            avg_resolution_time = total_hours / len(resolved_with_time)
        else:
            avg_resolution_time = 0
        
        # Índice de satisfação (média das avaliações)
        rated_occurrences = Occurrence.query.filter(
            and_(
                Occurrence.created_at >= start_date,
                Occurrence.rating.isnot(None)
            )
        ).all()
        
        if rated_occurrences:
            satisfaction_index = sum([occ.rating for occ in rated_occurrences]) / len(rated_occurrences)
            satisfaction_percentage = (satisfaction_index / 5.0) * 100
        else:
            satisfaction_index = 0
            satisfaction_percentage = 0
        
        # Avaliação média
        avg_rating = satisfaction_index
        
        # Ocorrências nos últimos 30 dias (para comparação)
        last_30_days = Occurrence.query.filter(
            Occurrence.created_at >= start_date
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'satisfaction_index': round(satisfaction_percentage, 1),
                'resolution_rate': round(resolution_rate, 1),
                'citizens_served': unique_citizens,
                'avg_resolution_time': round(avg_resolution_time, 1),
                'avg_rating': round(avg_rating, 2),
                'last_30_days': last_30_days,
                'total_occurrences': total_occurrences,
                'resolved_occurrences': resolved_occurrences,
                'period_days': days
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@strategic_bp.route('/neighborhood-priority', methods=['GET'])
def get_neighborhood_priority():
    """Análise de bairros prioritários para força-tarefa"""
    try:
        # Últimos 90 dias
        start_date = datetime.utcnow() - timedelta(days=90)
        
        # Buscar ocorrências por bairro
        occurrences = Occurrence.query.filter(
            Occurrence.created_at >= start_date
        ).all()
        
        neighborhood_stats = {}
        
        for occ in occurrences:
            # Extrair bairro do endereço
            address_parts = occ.address.split(',')
            if len(address_parts) >= 3:
                neighborhood = address_parts[2].strip()
            else:
                neighborhood = 'Não identificado'
            
            if neighborhood not in neighborhood_stats:
                neighborhood_stats[neighborhood] = {
                    'name': neighborhood,
                    'total_occurrences': 0,
                    'open_occurrences': 0,
                    'resolved_occurrences': 0,
                    'avg_priority': 0,
                    'avg_rating': 0,
                    'total_ratings': 0,
                    'priority_sum': 0
                }
            
            stats = neighborhood_stats[neighborhood]
            stats['total_occurrences'] += 1
            
            if occ.status == OccurrenceStatus.OPEN:
                stats['open_occurrences'] += 1
            elif occ.status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]:
                stats['resolved_occurrences'] += 1
            
            # Somar prioridade (LOW=1, MEDIUM=2, HIGH=3, URGENT=4)
            priority_values = {
                Priority.LOW: 1,
                Priority.MEDIUM: 2,
                Priority.HIGH: 3,
                Priority.URGENT: 4
            }
            stats['priority_sum'] += priority_values.get(occ.priority, 2)
            
            if occ.rating:
                stats['avg_rating'] = ((stats['avg_rating'] * stats['total_ratings']) + occ.rating) / (stats['total_ratings'] + 1)
                stats['total_ratings'] += 1
        
        # Calcular médias e score de prioridade
        for neighborhood, stats in neighborhood_stats.items():
            if stats['total_occurrences'] > 0:
                stats['avg_priority'] = stats['priority_sum'] / stats['total_occurrences']
                stats['resolution_rate'] = (stats['resolved_occurrences'] / stats['total_occurrences']) * 100
                
                # Score de prioridade para força-tarefa
                # Mais ocorrências + maior prioridade média + menor taxa de resolução = maior score
                urgency_score = stats['avg_priority'] * 25  # 0-100
                volume_score = min(stats['total_occurrences'] * 2, 100)  # 0-100
                efficiency_score = 100 - stats['resolution_rate']  # Inverso da eficiência
                
                stats['priority_score'] = (urgency_score + volume_score + efficiency_score) / 3
        
        # Ordenar por score de prioridade
        sorted_neighborhoods = sorted(
            neighborhood_stats.values(),
            key=lambda x: x['priority_score'],
            reverse=True
        )[:10]  # Top 10
        
        return jsonify({
            'success': True,
            'data': sorted_neighborhoods
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@strategic_bp.route('/performance-by-department', methods=['GET'])
def get_performance_by_department():
    """Performance por departamento/secretaria"""
    try:
        # Últimos 60 dias
        start_date = datetime.utcnow() - timedelta(days=60)
        
        # Mapeamento categoria -> departamento
        category_dept_map = {
            'Buraco na Rua': 'Obras Públicas',
            'Calçada Danificada': 'Obras Públicas',
            'Lâmpada Queimada': 'Iluminação Pública',
            'Lixo Acumulado': 'Serviços Urbanos',
            'Esgoto Entupido': 'Saneamento',
            'Poda de Árvore': 'Meio Ambiente',
            'Semáforo Defeituoso': 'Trânsito',
            'Animal Abandonado': 'Meio Ambiente'
        }
        
        # Buscar categorias
        categories = {cat.id: cat.name for cat in Category.query.all()}
        
        # Buscar ocorrências
        occurrences = Occurrence.query.filter(
            Occurrence.created_at >= start_date
        ).all()
        
        dept_stats = {}
        
        for occ in occurrences:
            cat_name = categories.get(occ.category_id, 'Outros')
            dept_name = category_dept_map.get(cat_name, 'Administração')
            
            if dept_name not in dept_stats:
                dept_stats[dept_name] = {
                    'name': dept_name,
                    'total_occurrences': 0,
                    'resolved_occurrences': 0,
                    'avg_resolution_time': 0,
                    'avg_rating': 0,
                    'total_ratings': 0,
                    'resolution_times': [],
                    'within_sla': 0,
                    'sla_days': 7  # Padrão
                }
            
            stats = dept_stats[dept_name]
            stats['total_occurrences'] += 1
            
            # SLA específico por departamento
            sla_map = {
                'Iluminação Pública': 2,
                'Serviços Urbanos': 1,
                'Saneamento': 1,
                'Obras Públicas': 10,
                'Meio Ambiente': 5,
                'Trânsito': 1
            }
            stats['sla_days'] = sla_map.get(dept_name, 7)
            
            if occ.status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]:
                stats['resolved_occurrences'] += 1
                
                if occ.resolved_at:
                    resolution_time = (occ.resolved_at - occ.created_at).total_seconds() / 3600  # horas
                    stats['resolution_times'].append(resolution_time)
                    
                    # Verificar se está dentro do SLA
                    if resolution_time <= (stats['sla_days'] * 24):
                        stats['within_sla'] += 1
            
            if occ.rating:
                stats['avg_rating'] = ((stats['avg_rating'] * stats['total_ratings']) + occ.rating) / (stats['total_ratings'] + 1)
                stats['total_ratings'] += 1
        
        # Calcular métricas finais
        for dept_name, stats in dept_stats.items():
            if stats['total_occurrences'] > 0:
                stats['resolution_rate'] = (stats['resolved_occurrences'] / stats['total_occurrences']) * 100
                
                if stats['resolution_times']:
                    stats['avg_resolution_time'] = sum(stats['resolution_times']) / len(stats['resolution_times'])
                
                if stats['resolved_occurrences'] > 0:
                    stats['sla_compliance'] = (stats['within_sla'] / stats['resolved_occurrences']) * 100
                else:
                    stats['sla_compliance'] = 0
                
                # Score de performance (0-100)
                resolution_score = stats['resolution_rate']
                rating_score = (stats['avg_rating'] / 5.0) * 100 if stats['avg_rating'] > 0 else 0
                sla_score = stats['sla_compliance']
                
                stats['performance_score'] = (resolution_score + rating_score + sla_score) / 3
        
        # Ordenar por performance
        sorted_departments = sorted(
            dept_stats.values(),
            key=lambda x: x['performance_score'],
            reverse=True
        )
        
        return jsonify({
            'success': True,
            'data': sorted_departments
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@strategic_bp.route('/success-stories', methods=['GET'])
def get_success_stories():
    """Histórias de sucesso para material de divulgação"""
    try:
        # Últimos 30 dias
        start_date = datetime.utcnow() - timedelta(days=30)
        
        # Buscar ocorrências resolvidas com boa avaliação
        success_stories = Occurrence.query.filter(
            and_(
                Occurrence.created_at >= start_date,
                Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]),
                Occurrence.rating >= 4,
                Occurrence.resolved_at.isnot(None)
            )
        ).order_by(desc(Occurrence.rating), Occurrence.resolved_at.desc()).limit(10).all()
        
        stories = []
        
        for occ in success_stories:
            # Calcular tempo de resolução
            resolution_time = (occ.resolved_at - occ.created_at).total_seconds() / 3600  # horas
            
            # Extrair bairro
            address_parts = occ.address.split(',')
            neighborhood = address_parts[2].strip() if len(address_parts) >= 3 else 'Lavras'
            
            # Buscar categoria
            category = Category.query.get(occ.category_id)
            
            # Gerar texto para redes sociais
            if resolution_time < 24:
                time_text = f"{resolution_time:.0f} horas"
            else:
                time_text = f"{resolution_time/24:.1f} dias"
            
            social_text = f"✅ Problema resolvido em {time_text}! {occ.title} no {neighborhood}. Avaliação: {occ.rating}⭐ #LavasEficiente #PrefeituraQueResolve"
            
            stories.append({
                'id': occ.id,
                'title': occ.title,
                'neighborhood': neighborhood,
                'category': category.name if category else 'N/A',
                'rating': occ.rating,
                'feedback': occ.feedback,
                'resolution_time_hours': round(resolution_time, 1),
                'resolution_time_text': time_text,
                'created_at': occ.created_at.isoformat(),
                'resolved_at': occ.resolved_at.isoformat(),
                'social_media_text': social_text,
                'hashtags': ['#LavasEficiente', '#PrefeituraQueResolve', f'#{neighborhood.replace(" ", "")}']
            })
        
        return jsonify({
            'success': True,
            'data': stories,
            'summary': {
                'total_stories': len(stories),
                'avg_rating': sum([s['rating'] for s in stories]) / len(stories) if stories else 0,
                'avg_resolution_time': sum([s['resolution_time_hours'] for s in stories]) / len(stories) if stories else 0
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@strategic_bp.route('/management-evolution', methods=['GET'])
def get_management_evolution():
    """Evolução da gestão ao longo do tempo"""
    try:
        # Últimos 12 meses
        months_data = []
        
        for i in range(12):
            month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            # Ocorrências do mês
            month_occurrences = Occurrence.query.filter(
                and_(
                    Occurrence.created_at >= month_start,
                    Occurrence.created_at < month_end
                )
            ).all()
            
            if month_occurrences:
                # Métricas do mês
                total = len(month_occurrences)
                resolved = len([o for o in month_occurrences if o.status in [OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]])
                rated = [o for o in month_occurrences if o.rating]
                
                resolution_rate = (resolved / total) * 100 if total > 0 else 0
                avg_rating = sum([o.rating for o in rated]) / len(rated) if rated else 0
                
                # Tempo médio de resolução
                resolved_with_time = [o for o in month_occurrences if o.resolved_at]
                if resolved_with_time:
                    avg_time = sum([
                        (o.resolved_at - o.created_at).total_seconds() / 3600 
                        for o in resolved_with_time
                    ]) / len(resolved_with_time)
                else:
                    avg_time = 0
                
                months_data.append({
                    'month': month_start.strftime('%Y-%m'),
                    'month_name': month_start.strftime('%b/%Y'),
                    'total_occurrences': total,
                    'resolved_occurrences': resolved,
                    'resolution_rate': round(resolution_rate, 1),
                    'avg_rating': round(avg_rating, 2),
                    'avg_resolution_time': round(avg_time, 1),
                    'satisfaction_index': round((avg_rating / 5.0) * 100, 1) if avg_rating > 0 else 0
                })
        
        # Reverter para ordem cronológica
        months_data.reverse()
        
        # Calcular tendências
        if len(months_data) >= 2:
            current_month = months_data[-1]
            previous_month = months_data[-2]
            
            trends = {
                'resolution_rate_trend': current_month['resolution_rate'] - previous_month['resolution_rate'],
                'satisfaction_trend': current_month['satisfaction_index'] - previous_month['satisfaction_index'],
                'volume_trend': current_month['total_occurrences'] - previous_month['total_occurrences'],
                'efficiency_trend': previous_month['avg_resolution_time'] - current_month['avg_resolution_time']  # Menor tempo = melhor
            }
        else:
            trends = {
                'resolution_rate_trend': 0,
                'satisfaction_trend': 0,
                'volume_trend': 0,
                'efficiency_trend': 0
            }
        
        return jsonify({
            'success': True,
            'data': months_data,
            'trends': trends
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@strategic_bp.route('/campaign-material', methods=['GET'])
def get_campaign_material():
    """Material pronto para campanha política"""
    try:
        # Últimos 90 dias para material robusto
        start_date = datetime.utcnow() - timedelta(days=90)
        
        # Estatísticas gerais
        total_occurrences = Occurrence.query.filter(Occurrence.created_at >= start_date).count()
        resolved_occurrences = Occurrence.query.filter(
            and_(
                Occurrence.created_at >= start_date,
                Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
            )
        ).count()
        
        # Cidadãos únicos atendidos
        unique_citizens = db.session.query(func.count(func.distinct(Occurrence.citizen_id))).filter(
            Occurrence.created_at >= start_date
        ).scalar()
        
        # Avaliação média
        rated_occurrences = Occurrence.query.filter(
            and_(
                Occurrence.created_at >= start_date,
                Occurrence.rating.isnot(None)
            )
        ).all()
        
        avg_rating = sum([o.rating for o in rated_occurrences]) / len(rated_occurrences) if rated_occurrences else 0
        satisfaction_percentage = (avg_rating / 5.0) * 100
        
        # Bairros atendidos
        neighborhoods_served = set()
        for occ in Occurrence.query.filter(Occurrence.created_at >= start_date).all():
            address_parts = occ.address.split(',')
            if len(address_parts) >= 3:
                neighborhoods_served.add(address_parts[2].strip())
        
        # Frases para campanha
        campaign_phrases = [
            f"✅ {resolved_occurrences} problemas resolvidos em 90 dias!",
            f"👥 {unique_citizens} cidadãos atendidos diretamente",
            f"⭐ {satisfaction_percentage:.0f}% de satisfação dos munícipes",
            f"🏘️ {len(neighborhoods_served)} bairros beneficiados",
            f"📱 Tecnologia a serviço de Lavras",
            "🚀 Gestão moderna e transparente",
            "💪 Prefeitura que resolve e comprova!"
        ]
        
        # Hashtags sugeridas
        hashtags = [
            "#LavasEficiente",
            "#PrefeituraQueResolve", 
            "#GestaoTransparente",
            "#LavasModerna",
            "#TecnologiaPublica",
            "#MunicipioDeFuturo",
            "#LavasDigital"
        ]
        
        # Posts prontos para redes sociais
        social_posts = [
            {
                'platform': 'Instagram',
                'text': f"🏆 RESULTADOS QUE FALAM POR SI!\n\n✅ {resolved_occurrences} problemas resolvidos\n👥 {unique_citizens} cidadãos atendidos\n⭐ {satisfaction_percentage:.0f}% de satisfação\n\n#LavasEficiente #PrefeituraQueResolve",
                'type': 'achievement'
            },
            {
                'platform': 'Facebook',
                'text': f"Lavras está mais moderna! Em 90 dias, nossa gestão resolveu {resolved_occurrences} problemas reportados pelos cidadãos através do Portal do Cidadão. Com {satisfaction_percentage:.0f}% de satisfação, provamos que tecnologia e dedicação transformam nossa cidade! 🚀 #LavasModerna",
                'type': 'progress_report'
            },
            {
                'platform': 'Twitter',
                'text': f"📊 Transparência total: {resolved_occurrences} problemas resolvidos, {satisfaction_percentage:.0f}% de satisfação cidadã. Lavras avança! #LavasEficiente #GestaoTransparente",
                'type': 'metrics'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'statistics': {
                    'total_occurrences': total_occurrences,
                    'resolved_occurrences': resolved_occurrences,
                    'resolution_rate': round((resolved_occurrences / total_occurrences) * 100, 1) if total_occurrences > 0 else 0,
                    'unique_citizens': unique_citizens,
                    'avg_rating': round(avg_rating, 2),
                    'satisfaction_percentage': round(satisfaction_percentage, 1),
                    'neighborhoods_served': len(neighborhoods_served)
                },
                'campaign_phrases': campaign_phrases,
                'hashtags': hashtags,
                'social_posts': social_posts,
                'period': '90 dias'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@strategic_bp.route('/workflow-metrics', methods=['GET'])
def get_workflow_metrics():
    """Métricas de eficiência do workflow (Triagem, Execução, Validação)"""
    try:
        # Período de análise (últimos 30 dias por padrão)
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Ocorrências criadas no período
        occurrences_in_period = Occurrence.query.filter(
            Occurrence.created_at >= start_date
        ).all()
        
        # 1. Funil de Ocorrências (Status atual de todas as ocorrências)
        funnel = {
            'open': Occurrence.query.filter(Occurrence.status == OccurrenceStatus.OPEN).count(),
            'in_progress': Occurrence.query.filter(Occurrence.status == OccurrenceStatus.IN_PROGRESS).count(),
            'resolved': Occurrence.query.filter(Occurrence.status == OccurrenceStatus.RESOLVED).count(),
            'closed': Occurrence.query.filter(Occurrence.status == OccurrenceStatus.CLOSED).count(),
        }

        # 2. Tempo Médio de Triagem (Criação -> Atribuição)
        triage_times = []
        for occ in occurrences_in_period:
            if occ.department_id and occ.created_at:
                # Ocorrência foi triada se tem department_id
                # O tempo de triagem é o tempo entre a criação e a primeira alteração de status para IN_PROGRESS
                triage_timeline = OccurrenceTimeline.query.filter(
                    OccurrenceTimeline.occurrence_id == occ.id,
                    OccurrenceTimeline.status_change.like('%Triagem e Atribuição Concluída%')
                ).order_by(OccurrenceTimeline.created_at.asc()).first()
                
                if triage_timeline:
                    time_diff = (triage_timeline.created_at - occ.created_at).total_seconds() / 3600 # em horas
                    triage_times.append(time_diff)
        
        avg_triage_time = sum(triage_times) / len(triage_times) if triage_times else 0

        # 3. Tempo Médio de Execução (Início -> Conclusão)
        execution_times = []
        for occ in occurrences_in_period:
            if occ.started_at and occ.completed_at:
                time_diff = (occ.completed_at - occ.started_at).total_seconds() / 3600 # em horas
                execution_times.append(time_diff)
        
        avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0

        # 4. Taxa de Rejeição de Validação
        total_validations = OccurrenceTimeline.query.filter(
            OccurrenceTimeline.created_at >= start_date,
            or_(
                OccurrenceTimeline.status_change.like('%Validação Concluída%'),
                OccurrenceTimeline.status_change.like('%Validação Rejeitada%')
            )
        ).count()
        
        rejected_validations = OccurrenceTimeline.query.filter(
            OccurrenceTimeline.created_at >= start_date,
            OccurrenceTimeline.status_change.like('%Validação Rejeitada%')
        ).count()
        
        rejection_rate = (rejected_validations / total_validations * 100) if total_validations > 0 else 0

        return jsonify({
            'success': True,
            'data': {
                'funnel': funnel,
                'avg_triage_time': round(avg_triage_time, 1), # em horas
                'avg_execution_time': round(avg_execution_time, 1), # em horas
                'rejection_rate': round(rejection_rate, 1), # em porcentagem
                'period_days': days
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
