from flask import Blueprint, jsonify, request
from ..models import db, User

user_routes = Blueprint('user_routes', __name__)


@user_routes.route('/', methods=['GET'])
def get_users():
    """Get all users."""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])


@user_routes.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user by ID."""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@user_routes.route('/', methods=['POST'])
def create_user():
    """Create a new user."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['first_name', 'last_name', 'username']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if username is already taken
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    # Create new user
    new_user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        username=data['username'],
        email=data.get('email')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify(new_user.to_dict()), 201


@user_routes.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update an existing user."""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    # Update user fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'email' in data:
        user.email = data['email']
    
    # Handle username change (ensure uniqueness)
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        user.username = data['username']
    
    db.session.commit()
    return jsonify(user.to_dict())


@user_routes.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user."""
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})


@user_routes.route('/<int:user_id>/activities', methods=['GET'])
def get_user_activities(user_id):
    """Get all activities performed by a user."""
    User.query.get_or_404(user_id)  # Verify user exists
    
    from ..models import UserActivity
    activities = UserActivity.query.filter_by(user_id=user_id).all()
    return jsonify([activity.to_dict() for activity in activities])


@user_routes.route('/<int:user_id>/playlists', methods=['GET'])
def get_user_playlists(user_id):
    """Get all playlists created by a user."""
    User.query.get_or_404(user_id)  # Verify user exists
    
    from ..models import Playlist
    playlists = Playlist.query.filter_by(user_id=user_id).all()
    return jsonify([playlist.to_dict() for playlist in playlists])


@user_routes.route('/<int:user_id>/skills', methods=['GET'])
def get_user_skills(user_id):
    """Get all skills and their progress for a user."""
    User.query.get_or_404(user_id)  # Verify user exists
    
    from ..models import UserSkillProgress
    skills = UserSkillProgress.query.filter_by(user_id=user_id).all()
    return jsonify([skill.to_dict() for skill in skills])
