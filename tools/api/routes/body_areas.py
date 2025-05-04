from flask import Blueprint, jsonify, request
from ..models import db, BodyArea, ActivityBodyArea

body_area_routes = Blueprint('body_area_routes', __name__)


@body_area_routes.route('/', methods=['GET'])
def get_body_areas():
    """Get all body areas."""
    body_areas = BodyArea.query.all()
    return jsonify([area.to_dict() for area in body_areas])


@body_area_routes.route('/<int:body_area_id>', methods=['GET'])
def get_body_area(body_area_id):
    """Get a specific body area by ID."""
    body_area = BodyArea.query.get_or_404(body_area_id)
    return jsonify(body_area.to_dict())


@body_area_routes.route('/', methods=['POST'])
def create_body_area():
    """Create a new body area."""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Body area name is required'}), 400
    
    # Create new body area
    new_body_area = BodyArea(
        name=data['name']
    )
    
    db.session.add(new_body_area)
    db.session.commit()
    
    return jsonify(new_body_area.to_dict()), 201


@body_area_routes.route('/<int:body_area_id>', methods=['PUT'])
def update_body_area(body_area_id):
    """Update an existing body area."""
    body_area = BodyArea.query.get_or_404(body_area_id)
    data = request.get_json()
    
    # Update body area fields
    if 'name' in data:
        body_area.name = data['name']
    
    db.session.commit()
    return jsonify(body_area.to_dict())


@body_area_routes.route('/<int:body_area_id>', methods=['DELETE'])
def delete_body_area(body_area_id):
    """Delete a body area."""
    body_area = BodyArea.query.get_or_404(body_area_id)
    
    # Check if body area is used in activity_body_areas
    activity_body_areas = ActivityBodyArea.query.filter_by(body_area_id=body_area_id).first()
    if activity_body_areas:
        return jsonify({'error': 'Cannot delete body area that is in use'}), 400
    
    # Delete body area
    db.session.delete(body_area)
    db.session.commit()
    
    return jsonify({'message': 'Body area deleted successfully'})


@body_area_routes.route('/<int:body_area_id>/activities', methods=['GET'])
def get_body_area_activities(body_area_id):
    """Get all activities for a body area."""
    BodyArea.query.get_or_404(body_area_id)  # Verify body area exists
    
    activity_body_areas = ActivityBodyArea.query.filter_by(body_area_id=body_area_id).all()
    
    result = []
    for aba in activity_body_areas:
        if aba.activity:
            result.append(aba.activity.to_dict())
    
    return jsonify(result)
