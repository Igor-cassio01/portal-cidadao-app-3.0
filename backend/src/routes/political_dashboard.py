from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, Occurrence, User, Category, Department, OccurrenceStatus, Priority
from sqlalchemy import func, extract, desc
from datetime import datetime, timedelta
import re

political_bp = Blueprint("political", __name__)

def extract_neighborhood(address):
    """Extrai o bairro do endereço"""
    if not address:
        return "Não informado"
    
    # Padrão: "endereço, BAIRRO, Lavras-MG"
    parts = address.split(",")
    if len(parts) >= 2:
        neighborhood = parts[-2].strip()
        # Remove "Lavras-MG" se estiver no bairro
        if "Lavras-MG" not in neighborhood:
            return neighborhood
    
    return "Centro"  # Default

@political_bp.route("/dashboard/political-metrics", methods=["GET"])
def get_political_metrics():
    """Métricas estratégicas para popularidade política"""
    try:
        # Métricas gerais
        total_occurrences = Occurrence.query.count()
        resolved_occurrences = Occurrence.query.filter(
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
        ).count()
        
        # Taxa de resolução (KPI principal)
        resolution_rate = (resolved_occurrences / total_occurrences * 100) if total_occurrences > 0 else 0
        
        # Ocorrências dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_occurrences = Occurrence.query.filter(
            Occurrence.created_at >= thirty_days_ago
        ).count()
        
        recent_resolved = Occurrence.query.filter(
            Occurrence.created_at >= thirty_days_ago,
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
        ).count()
        
        # Tempo médio de resolução (em horas)
        resolved_with_time = Occurrence.query.filter(
            Occurrence.resolved_at.isnot(None)
        ).all()
        
        avg_resolution_hours = 0
        if resolved_with_time:
            total_hours = sum([
                (occ.resolved_at - occ.created_at).total_seconds() / 3600
                for occ in resolved_with_time
            ])
            avg_resolution_hours = round(total_hours / len(resolved_with_time), 1)
        
        # Avaliação média
        rated_occurrences = Occurrence.query.filter(
            Occurrence.rating.isnot(None)
        ).all()
        
        avg_rating = 0
        if rated_occurrences:
            avg_rating = round(sum([occ.rating for occ in rated_occurrences]) / len(rated_occurrences), 1)
        
        # Cidadãos ativos (que fizeram pelo menos uma ocorrência)
        active_citizens = db.session.query(Occurrence.citizen_id).distinct().count()
        
        return jsonify({
            "total_occurrences": total_occurrences,
            "resolved_occurrences": resolved_occurrences,
            "resolution_rate": round(resolution_rate, 1),
            "recent_occurrences": recent_occurrences,
            "recent_resolved": recent_resolved,
            "avg_resolution_hours": avg_resolution_hours,
            "avg_rating": avg_rating,
            "active_citizens": active_citizens,
            "satisfaction_index": round((resolution_rate * 0.6) + (avg_rating * 20 * 0.4), 1)  # Índice composto
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@political_bp.route("/dashboard/neighborhood-analysis", methods=["GET"])
def get_neighborhood_analysis():
    """Análise detalhada por bairros para força-tarefa"""
    try:
        occurrences = Occurrence.query.all()
        
        neighborhood_stats = {}
        
        for occ in occurrences:
            neighborhood = extract_neighborhood(occ.address)
            
            if neighborhood not in neighborhood_stats:
                neighborhood_stats[neighborhood] = {
                    "name": neighborhood,
                    "total": 0,
                    "open": 0,
                    "in_progress": 0,
                    "resolved": 0,
                    "closed": 0,
                    "urgent": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "avg_rating": 0,
                    "ratings_count": 0,
                    "resolution_rate": 0
                }
            
            stats = neighborhood_stats[neighborhood]
            stats["total"] += 1
            
            # Contagem por status
            if occ.status == OccurrenceStatus.OPEN:
                stats["open"] += 1
            elif occ.status == OccurrenceStatus.IN_PROGRESS:
                stats["in_progress"] += 1
            elif occ.status == OccurrenceStatus.RESOLVED:
                stats["resolved"] += 1
            elif occ.status == OccurrenceStatus.CLOSED:
                stats["closed"] += 1
            
            # Contagem por prioridade
            priority_map = {
                Priority.URGENT: "urgent",
                Priority.HIGH: "high", 
                Priority.MEDIUM: "medium",
                Priority.LOW: "low"
            }
            if occ.priority in priority_map:
                stats[priority_map[occ.priority]] += 1
            
            # Avaliações
            if occ.rating:
                stats["ratings_count"] += 1
                stats["avg_rating"] = ((stats["avg_rating"] * (stats["ratings_count"] - 1)) + occ.rating) / stats["ratings_count"]
        
        # Calcular taxa de resolução e ordenar
        neighborhood_list = []
        for neighborhood, stats in neighborhood_stats.items():
            resolved_total = stats["resolved"] + stats["closed"]
            stats["resolution_rate"] = round((resolved_total / stats["total"] * 100), 1) if stats["total"] > 0 else 0
            stats["avg_rating"] = round(stats["avg_rating"], 1)
            
            # Calcular índice de prioridade (bairros com mais problemas em aberto)
            open_issues = stats["open"] + stats["in_progress"]
            stats["priority_index"] = open_issues + (stats["urgent"] * 3) + (stats["high"] * 2)
            
            neighborhood_list.append(stats)
        
        # Ordenar por índice de prioridade (descendente)
        neighborhood_list.sort(key=lambda x: x["priority_index"], reverse=True)
        
        return jsonify({
            "neighborhoods": neighborhood_list,
            "total_neighborhoods": len(neighborhood_list)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@political_bp.route("/dashboard/success-stories", methods=["GET"])
def get_success_stories():
    """Histórias de sucesso para material de campanha"""
    try:
        # Ocorrências resolvidas com boa avaliação
        success_stories = Occurrence.query.filter(
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]),
            Occurrence.rating >= 4
        ).order_by(desc(Occurrence.rating), desc(Occurrence.resolved_at)).limit(10).all()
        
        stories = []
        for occ in success_stories:
            neighborhood = extract_neighborhood(occ.address)
            
            # Calcular tempo de resolução
            resolution_time = None
            if occ.resolved_at:
                delta = occ.resolved_at - occ.created_at
                days = delta.days
                hours = delta.seconds // 3600
                
                if days > 0:
                    resolution_time = f"{days} dia(s)"
                else:
                    resolution_time = f"{hours} hora(s)"
            
            stories.append({
                "id": occ.id,
                "title": occ.title,
                "description": occ.description,
                "neighborhood": neighborhood,
                "category": occ.category.name if occ.category else "Outros",
                "citizen_name": occ.citizen.name if occ.citizen else "Cidadão",
                "rating": occ.rating,
                "feedback": occ.feedback,
                "resolution_time": resolution_time,
                "resolved_at": occ.resolved_at.strftime("%d/%m/%Y") if occ.resolved_at else None,
                "photos_count": len(occ.photos)
            })
        
        return jsonify({
            "success_stories": stories,
            "total_stories": len(stories)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@political_bp.route("/dashboard/performance-trends", methods=["GET"])
def get_performance_trends():
    """Tendências de performance para mostrar evolução"""
    try:
        # Dados dos últimos 6 meses
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        
        # Agrupar por mês
        monthly_data = db.session.query(
            extract("year", Occurrence.created_at).label("year"),
            extract("month", Occurrence.created_at).label("month"),
            func.count(Occurrence.id).label("total"),
            func.sum(
                func.case(
                    (Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED]), 1),
                    else_=0
                )
            ).label("resolved")
        ).filter(
            Occurrence.created_at >= six_months_ago
        ).group_by(
            extract("year", Occurrence.created_at),
            extract("month", Occurrence.created_at)
        ).order_by(
            extract("year", Occurrence.created_at),
            extract("month", Occurrence.created_at)
        ).all()
        
        trends = []
        for data in monthly_data:
            month_name = [
                "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                "Jul", "Ago", "Set", "Out", "Nov", "Dez"
            ][int(data.month) - 1]
            
            resolution_rate = (data.resolved / data.total * 100) if data.total > 0 else 0
            
            trends.append({
                "period": f"{month_name}/{int(data.year)}",
                "total": data.total,
                "resolved": data.resolved,
                "resolution_rate": round(resolution_rate, 1)
            })
        
        return jsonify({
            "trends": trends
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@political_bp.route("/dashboard/campaign-material", methods=["GET"])
def get_campaign_material():
    """Material pronto para campanha política"""
    try:
        # Estatísticas impressionantes
        total_resolved = Occurrence.query.filter(
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
        ).count()
        
        total_citizens_helped = db.session.query(Occurrence.citizen_id).filter(
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
        ).distinct().count()
        
        # Categorias mais resolvidas
        category_stats = db.session.query(
            Category.name,
            func.count(Occurrence.id).label("resolved_count")
        ).join(Occurrence).filter(
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
        ).group_by(Category.name).order_by(desc("resolved_count")).limit(5).all()
        
        # Bairros mais atendidos
        occurrences = Occurrence.query.filter(
            Occurrence.status.in_([OccurrenceStatus.RESOLVED, OccurrenceStatus.CLOSED])
        ).all()
        
        neighborhood_resolved = {}
        for occ in occurrences:
            neighborhood = extract_neighborhood(occ.address)
            neighborhood_resolved[neighborhood] = neighborhood_resolved.get(neighborhood, 0) + 1
        
        top_neighborhoods = sorted(neighborhood_resolved.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Frases para campanha
        campaign_phrases = [
            f"✅ {total_resolved} problemas já resolvidos na nossa cidade!",
            f"👥 {total_citizens_helped} cidadãos atendidos através do Portal do Cidadão!",
            f"🏆 {category_stats[0][0] if category_stats else 'Infraestrutura'} é nossa prioridade - {category_stats[0][1] if category_stats else 0} casos resolvidos!",
            f"🏘️ Bairro {top_neighborhoods[0][0] if top_neighborhoods else 'Centro'} recebeu atenção especial - {top_neighborhoods[0][1] if top_neighborhoods else 0} melhorias!",
            "📱 Tecnologia a serviço do cidadão - Portal do Cidadão conecta você à prefeitura!"
        ]
        
        return jsonify({
            "statistics": {
                "total_resolved": total_resolved,
                "citizens_helped": total_citizens_helped,
                "top_categories": [{"name": cat[0], "count": cat[1]} for cat in category_stats],
                "top_neighborhoods": [{"name": neigh[0], "count": neigh[1]} for neigh in top_neighborhoods]
            },
            "campaign_phrases": campaign_phrases,
            "hashtags": [
                "#LavraMelhor", "#PortalDoCidadao", "#PrefeituraDigital",
                "#CidadeInteligente", "#TransparenciaTotal", "#LavraTech"
            ]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

