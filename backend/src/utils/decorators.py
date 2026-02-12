from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from src.models.models import User, UserType

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if user and (user.user_type == UserType.ADMIN or user.user_type.value == 'admin'):
            return fn(*args, **kwargs)
        return jsonify({'msg': 'Acesso de Administrador necessário'}), 403
    return wrapper

def department_manager_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        # Assumindo que 'ADMIN' e 'DEPARTMENT_MANAGER' são os tipos válidos para esta função
        if user and (user.user_type in [UserType.ADMIN, UserType.DEPARTMENT_MANAGER] or user.user_type.value in ['admin', 'department_manager']):
            return fn(*args, **kwargs)
        return jsonify({'msg': 'Acesso de Gestor de Departamento necessário'}), 403
    return wrapper

def service_provider_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        # Assumindo que 'ADMIN', 'DEPARTMENT_MANAGER' e 'SERVICE_PROVIDER' são os tipos válidos
        if user and (user.user_type in [UserType.ADMIN, UserType.DEPARTMENT_MANAGER, UserType.SERVICE_PROVIDER] or user.user_type.value in ['admin', 'department_manager', 'service_provider']):
            return fn(*args, **kwargs)
        return jsonify({'msg': 'Acesso de Prestador de Serviço necessário'}), 403
    return wrapper
