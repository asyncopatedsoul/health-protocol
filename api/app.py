import os
from flask import Flask, jsonify
from flask_cors import CORS
from .models import db
from .routes import register_routes

def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    
    # Configure the app
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tools', 'health_protocol.db'),
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tools', 'health_protocol.db')}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    
    # Enable CORS
    CORS(app)
    
    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize database
    db.init_app(app)
    
    # Register all API routes
    register_routes(app)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"})
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)