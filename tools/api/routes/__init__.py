from flask import Blueprint

def register_routes(app):
    """Register all API routes with the Flask app."""
    from .users import user_routes
    from .activities import activity_routes
    from .protocols import protocol_routes
    from .body_areas import body_area_routes
    from .tags import tag_routes
    from .guides import guide_routes
    from .playlists import playlist_routes
    from .skills import skill_routes
    
    # Register all route blueprints
    app.register_blueprint(user_routes, url_prefix='/api/users')
    app.register_blueprint(activity_routes, url_prefix='/api/activities')
    app.register_blueprint(protocol_routes, url_prefix='/api/protocols')
    app.register_blueprint(body_area_routes, url_prefix='/api/body-areas')
    app.register_blueprint(tag_routes, url_prefix='/api/tags')
    app.register_blueprint(guide_routes, url_prefix='/api/guides')
    app.register_blueprint(playlist_routes, url_prefix='/api/playlists')
    app.register_blueprint(skill_routes, url_prefix='/api/skills')
