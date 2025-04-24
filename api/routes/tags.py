from flask import Blueprint, jsonify, request
from ..models import db, Tag, ActivityTag

tag_routes = Blueprint('tag_routes', __name__)


@tag_routes.route('/', methods=['GET'])
def get_tags():
    """Get all tags."""
    tag_type = request.args.get('type')
    
    query = Tag.query
    
    # Filter by type if provided
    if tag_type:
        query = query.filter(Tag.type == tag_type)
    
    tags = query.all()
    return jsonify([tag.to_dict() for tag in tags])


@tag_routes.route('/<int:tag_id>', methods=['GET'])
def get_tag(tag_id):
    """Get a specific tag by ID."""
    tag = Tag.query.get_or_404(tag_id)
    return jsonify(tag.to_dict())


@tag_routes.route('/', methods=['POST'])
def create_tag():
    """Create a new tag."""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Tag name is required'}), 400
    
    # Create new tag
    new_tag = Tag(
        name=data['name'],
        description=data.get('description'),
        type=data.get('type', 'universal')
    )
    
    db.session.add(new_tag)
    db.session.commit()
    
    return jsonify(new_tag.to_dict()), 201


@tag_routes.route('/<int:tag_id>', methods=['PUT'])
def update_tag(tag_id):
    """Update an existing tag."""
    tag = Tag.query.get_or_404(tag_id)
    data = request.get_json()
    
    # Update tag fields
    if 'name' in data:
        tag.name = data['name']
    if 'description' in data:
        tag.description = data['description']
    if 'type' in data:
        tag.type = data['type']
    
    db.session.commit()
    return jsonify(tag.to_dict())


@tag_routes.route('/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    """Delete a tag."""
    tag = Tag.query.get_or_404(tag_id)
    
    # Check if tag is used in activity_tags
    activity_tags = ActivityTag.query.filter_by(tag_id=tag_id).first()
    if activity_tags:
        return jsonify({'error': 'Cannot delete tag that is in use'}), 400
    
    # Delete tag
    db.session.delete(tag)
    db.session.commit()
    
    return jsonify({'message': 'Tag deleted successfully'})


@tag_routes.route('/<int:tag_id>/activities', methods=['GET'])
def get_tag_activities(tag_id):
    """Get all activities for a tag."""
    Tag.query.get_or_404(tag_id)  # Verify tag exists
    
    activity_tags = ActivityTag.query.filter_by(tag_id=tag_id).all()
    
    result = []
    for at in activity_tags:
        if at.activity:
            result.append(at.activity.to_dict())
    
    return jsonify(result)
