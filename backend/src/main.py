import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.models import db
from src.routes.auth import auth_bp
from src.routes.occurrences import occurrences_bp
from src.routes.admin import admin_bp
from src.routes.user import user_bp
from src.routes.political_dashboard import political_bp
from src.routes.strategic_dashboard import strategic_bp
from src.routes.triage import triage_bp
from src.routes.execution import execution_bp
from src.routes.validation import validation_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configurações
app.config['SECRET_KEY'] = 'portal-cidadao-secret-key-2024'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-portal-cidadao'
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Inicializar extensões
CORS(app, origins="*") # CORREÇÃO: Permitindo todas as origens para CORS
jwt = JWTManager(app)
db.init_app(app)

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(occurrences_bp, url_prefix='/api/occurrences')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(political_bp, url_prefix='/api/political')
app.register_blueprint(strategic_bp, url_prefix='/api/strategic')
app.register_blueprint(triage_bp, url_prefix='/api/triage')
app.register_blueprint(execution_bp, url_prefix='/api/execution')
app.register_blueprint(validation_bp, url_prefix='/api/validation')

# Criar tabelas e dados iniciais
with app.app_context():
    try:
        from src.utils.init_database import init_database
        init_database(app)
    except Exception as e:
        print(f'❌ Erro ao inicializar banco de dados: {e}')
        import traceback
        traceback.print_exc()

# Rota para servir uploads
@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    upload_folder = os.path.join(app.root_path, 'static', 'uploads')
    return send_from_directory(upload_folder, filename)

# Tratamento de erros JWT
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token expirado'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Token inválido'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Token de acesso necessário'}), 401

# Rota para servir o frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# Rota de health check
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Portal do Cidadão API está funcionando'
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
