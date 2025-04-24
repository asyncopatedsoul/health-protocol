from flask import Blueprint, jsonify, request
from ..models import db, Activity, DifficultyLevel, ActivityMedia, ActivityTag, ActivityBodyArea, ActivitySkill

activity_routes = Blueprint('activity_routes', __name__)


@activity_routes.route('/', methods=['GET'])
def get_activities():
    """Get all activities with optional filtering."""
    # Query parameters for filtering
    activity_type = request.args.get('type')
    difficulty_level = request.args.get('difficulty')
    search_query = request.args.get('q')
    
    query = Activity.query
    
    # Apply filters if provided
    if activity_type:
        query = query.filter(Activity.type == activity_type)
    
    if difficulty_level:
        try:
            difficulty = int(difficulty_level)
            query = query.filter(Activity.difficulty_level == difficulty)
        except ValueError:
            pass  # Ignore invalid difficulty
    
    if search_query:
        query = query.filter(Activity.name.ilike(f'%{search_query}%') | 
                            Activity.description.ilike(f'%{search_query}%'))
    
    activities = query.all()
    return jsonify([activity.to_dict() for activity in activities])


@activity_routes.route('/<int:activity_id>', methods=['GET'])
def get_activity(activity_id):
    """Get a specific activity by ID."""
    activity = Activity.query.get_or_404(activity_id)
    return jsonify(activity.to_dict())


@activity_routes.route('/', methods=['POST'])
def create_activity():
    """Create a new activity."""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Activity name is required'}), 400
    
    # Create new activity
    new_activity = Activity(
        name=data['name'],
        description=data.get('description'),
        type=data.get('type'),
        difficulty_level=data.get('difficulty_level'),
        activity_type=data.get('activity_type', 'exercise'),
        complexity_level=data.get('complexity_level', 1)
    )
    
    db.session.add(new_activity)
    db.session.flush()  # Get the ID before committing
    
    # Handle media
    if 'media' in data and isinstance(data['media'], list):
        for media_item in data['media']:
            if 'media_type' in media_item and 'url' in media_item:
                media = ActivityMedia(
                    activity_id=new_activity.id,
                    media_type=media_item['media_type'],
                    url=media_item['url']
                )
                db.session.add(media)
    
    # Handle tags
    if 'tags' in data and isinstance(data['tags'], list):
        from ..models import Tag
        for tag_id in data['tags']:
            tag = Tag.query.get(tag_id)
            if tag:
                activity_tag = ActivityTag(
                    activity_id=new_activity.id,
                    tag_id=tag_id
                )
                db.session.add(activity_tag)
    
    # Handle body areas
    if 'body_areas' in data and isinstance(data['body_areas'], list):
        for body_area_id in data['body_areas']:
            activity_body_area = ActivityBodyArea(
                activity_id=new_activity.id,
                body_area_id=body_area_id
            )
            db.session.add(activity_body_area)
    
    db.session.commit()
    return jsonify(new_activity.to_dict()), 201


@activity_routes.route('/<int:activity_id>', methods=['PUT'])
def update_activity(activity_id):
    """Update an existing activity."""
    activity = Activity.query.get_or_404(activity_id)
    data = request.get_json()
    
    # Update activity fields
    if 'name' in data:
        activity.name = data['name']
    if 'description' in data:
        activity.description = data['description']
    if 'type' in data:
        activity.type = data['type']
    if 'difficulty_level' in data:
        activity.difficulty_level = data['difficulty_level']
    if 'activity_type' in data:
        activity.activity_type = data['activity_type']
    if 'complexity_level' in data:
        activity.complexity_level = data['complexity_level']
    
    # Handle media updates (replace all)
    if 'media' in data and isinstance(data['media'], list):
        # Delete existing media
        ActivityMedia.query.filter_by(activity_id=activity_id).delete()
        
        # Add new media
        for media_item in data['media']:
            if 'media_type' in media_item and 'url' in media_item:
                media = ActivityMedia(
                    activity_id=activity_id,
                    media_type=media_item['media_type'],
                    url=media_item['url']
                )
                db.session.add(media)
    
    # Handle tags updates (replace all)
    if 'tags' in data and isinstance(data['tags'], list):
        # Delete existing tags
        ActivityTag.query.filter_by(activity_id=activity_id).delete()
        
        # Add new tags
        from ..models import Tag
        for tag_id in data['tags']:
            tag = Tag.query.get(tag_id)
            if tag:
                activity_tag = ActivityTag(
                    activity_id=activity_id,
                    tag_id=tag_id
                )
                db.session.add(activity_tag)
    
    # Handle body areas updates (replace all)
    if 'body_areas' in data and isinstance(data['body_areas'], list):
        # Delete existing body areas
        ActivityBodyArea.query.filter_by(activity_id=activity_id).delete()
        
        # Add new body areas
        for body_area_id in data['body_areas']:
            activity_body_area = ActivityBodyArea(
                activity_id=activity_id,
                body_area_id=body_area_id
            )
            db.session.add(activity_body_area)
    
    db.session.commit()
    return jsonify(activity.to_dict())


@activity_routes.route('/<int:activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    """Delete an activity."""
    activity = Activity.query.get_or_404(activity_id)
    
    # Delete associated records first
    ActivityMedia.query.filter_by(activity_id=activity_id).delete()
    ActivityTag.query.filter_by(activity_id=activity_id).delete()
    ActivityBodyArea.query.filter_by(activity_id=activity_id).delete()
    
    # Delete activity
    db.session.delete(activity)
    db.session.commit()
    
    return jsonify({'message': 'Activity deleted successfully'})


@activity_routes.route('/<int:activity_id>/media', methods=['GET'])
def get_activity_media(activity_id):
    """Get all media for an activity."""
    Activity.query.get_or_404(activity_id)  # Verify activity exists
    
    media = ActivityMedia.query.filter_by(activity_id=activity_id).all()
    return jsonify([m.to_dict() for m in media])


@activity_routes.route('/<int:activity_id>/tags', methods=['GET'])
def get_activity_tags(activity_id):
    """Get all tags for an activity."""
    Activity.query.get_or_404(activity_id)  # Verify activity exists
    
    tags = ActivityTag.query.filter_by(activity_id=activity_id).all()
    return jsonify([t.to_dict() for t in tags])


@activity_routes.route('/<int:activity_id>/body-areas', methods=['GET'])
def get_activity_body_areas(activity_id):
    """Get all body areas for an activity."""
    Activity.query.get_or_404(activity_id)  # Verify activity exists
    
    body_areas = ActivityBodyArea.query.filter_by(activity_id=activity_id).all()
    return jsonify([ba.to_dict() for ba in body_areas])


@activity_routes.route('/<int:activity_id>/skills', methods=['GET'])
def get_activity_skills(activity_id):
    """Get all skills for an activity."""
    Activity.query.get_or_404(activity_id)  # Verify activity exists
    
    skills = ActivitySkill.query.filter_by(activity_id=activity_id).all()
    return jsonify([s.to_dict() for s in skills])


@activity_routes.route('/difficulty-levels', methods=['GET'])
def get_difficulty_levels():
    """Get all difficulty levels."""
    levels = DifficultyLevel.query.all()
    return jsonify([level.to_dict() for level in levels])
