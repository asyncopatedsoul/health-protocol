from flask import Blueprint, jsonify, request
from ..models import db, Guide, GuidePart, GuideVersion, GuidePartVersion
from datetime import datetime

guide_routes = Blueprint('guide_routes', __name__)


@guide_routes.route('/', methods=['GET'])
def get_guides():
    """Get all guides."""
    guides = Guide.query.all()
    return jsonify([guide.to_dict() for guide in guides])


@guide_routes.route('/<int:guide_id>', methods=['GET'])
def get_guide(guide_id):
    """Get a specific guide by ID."""
    guide = Guide.query.get_or_404(guide_id)
    return jsonify(guide.to_dict())


@guide_routes.route('/', methods=['POST'])
def create_guide():
    """Create a new guide."""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Guide name is required'}), 400
    
    # Create new guide
    new_guide = Guide(
        name=data['name'],
        description=data.get('description')
    )
    
    db.session.add(new_guide)
    db.session.flush()  # Get the ID before committing
    
    # Handle guide parts if provided
    if 'parts' in data and isinstance(data['parts'], list):
        for i, part_data in enumerate(data['parts']):
            if 'title' in part_data:
                part = GuidePart(
                    guide_id=new_guide.id,
                    title=part_data['title'],
                    content=part_data.get('content'),
                    order=part_data.get('order', i)  # Use provided order or index as default
                )
                db.session.add(part)
    
    # Create initial version if content is provided
    if data.get('create_version', False):
        version = GuideVersion(
            guide_id=new_guide.id,
            version_number=1,
            release_notes=data.get('release_notes', 'Initial version'),
            created_at=datetime.utcnow()
        )
        db.session.add(version)
        db.session.flush()
        
        # Create part versions for each part
        for part in new_guide.parts:
            part_version = GuidePartVersion(
                guide_version_id=version.id,
                guide_part_id=part.id,
                content=part.content
            )
            db.session.add(part_version)
    
    db.session.commit()
    return jsonify(new_guide.to_dict()), 201


@guide_routes.route('/<int:guide_id>', methods=['PUT'])
def update_guide(guide_id):
    """Update an existing guide."""
    guide = Guide.query.get_or_404(guide_id)
    data = request.get_json()
    
    # Update guide fields
    if 'name' in data:
        guide.name = data['name']
    if 'description' in data:
        guide.description = data['description']
    
    db.session.commit()
    return jsonify(guide.to_dict())


@guide_routes.route('/<int:guide_id>', methods=['DELETE'])
def delete_guide(guide_id):
    """Delete a guide."""
    guide = Guide.query.get_or_404(guide_id)
    
    # Delete all associated parts, versions, and part versions
    for part in guide.parts:
        for version in part.versions:
            db.session.delete(version)
        db.session.delete(part)
    
    for version in guide.versions:
        for part_version in version.part_versions:
            db.session.delete(part_version)
        db.session.delete(version)
    
    # Delete guide
    db.session.delete(guide)
    db.session.commit()
    
    return jsonify({'message': 'Guide deleted successfully'})


@guide_routes.route('/<int:guide_id>/parts', methods=['GET'])
def get_guide_parts(guide_id):
    """Get all parts for a guide."""
    Guide.query.get_or_404(guide_id)  # Verify guide exists
    
    parts = GuidePart.query.filter_by(guide_id=guide_id).order_by(GuidePart.order).all()
    return jsonify([part.to_dict() for part in parts])


@guide_routes.route('/<int:guide_id>/parts', methods=['POST'])
def create_guide_part(guide_id):
    """Add a new part to a guide."""
    guide = Guide.query.get_or_404(guide_id)
    data = request.get_json()
    
    # Validate required fields
    if 'title' not in data:
        return jsonify({'error': 'Part title is required'}), 400
    
    # Get max order value to append at the end by default
    max_order = db.session.query(db.func.max(GuidePart.order)).filter(GuidePart.guide_id == guide_id).scalar() or -1
    
    # Create new part
    new_part = GuidePart(
        guide_id=guide_id,
        title=data['title'],
        content=data.get('content'),
        order=data.get('order', max_order + 1)
    )
    
    db.session.add(new_part)
    db.session.commit()
    
    return jsonify(new_part.to_dict()), 201


@guide_routes.route('/<int:guide_id>/parts/<int:part_id>', methods=['PUT'])
def update_guide_part(guide_id, part_id):
    """Update a guide part."""
    part = GuidePart.query.get_or_404(part_id)
    
    # Ensure part belongs to the specified guide
    if part.guide_id != guide_id:
        return jsonify({'error': 'Part does not belong to the specified guide'}), 400
    
    data = request.get_json()
    
    # Update part fields
    if 'title' in data:
        part.title = data['title']
    if 'content' in data:
        part.content = data['content']
    if 'order' in data:
        part.order = data['order']
    
    db.session.commit()
    return jsonify(part.to_dict())


@guide_routes.route('/<int:guide_id>/parts/<int:part_id>', methods=['DELETE'])
def delete_guide_part(guide_id, part_id):
    """Delete a guide part."""
    part = GuidePart.query.get_or_404(part_id)
    
    # Ensure part belongs to the specified guide
    if part.guide_id != guide_id:
        return jsonify({'error': 'Part does not belong to the specified guide'}), 400
    
    # Delete all associated part versions
    for version in part.versions:
        db.session.delete(version)
    
    # Delete part
    db.session.delete(part)
    db.session.commit()
    
    return jsonify({'message': 'Guide part deleted successfully'})


@guide_routes.route('/<int:guide_id>/versions', methods=['GET'])
def get_guide_versions(guide_id):
    """Get all versions for a guide."""
    Guide.query.get_or_404(guide_id)  # Verify guide exists
    
    versions = GuideVersion.query.filter_by(guide_id=guide_id).order_by(GuideVersion.version_number.desc()).all()
    return jsonify([version.to_dict() for version in versions])


@guide_routes.route('/<int:guide_id>/versions', methods=['POST'])
def create_guide_version(guide_id):
    """Create a new version for a guide."""
    guide = Guide.query.get_or_404(guide_id)
    data = request.get_json()
    
    # Get highest version number
    max_version = db.session.query(db.func.max(GuideVersion.version_number)).filter(GuideVersion.guide_id == guide_id).scalar() or 0
    
    # Create new version
    new_version = GuideVersion(
        guide_id=guide_id,
        version_number=max_version + 1,
        release_notes=data.get('release_notes', ''),
        created_at=datetime.utcnow()
    )
    
    db.session.add(new_version)
    db.session.flush()
    
    # Create part versions for each part
    for part in guide.parts:
        # Use provided content if available, otherwise use current part content
        part_content = None
        if 'parts' in data and isinstance(data['parts'], list):
            for part_data in data['parts']:
                if part_data.get('part_id') == part.id and 'content' in part_data:
                    part_content = part_data['content']
                    break
        
        if part_content is None:
            part_content = part.content
        
        part_version = GuidePartVersion(
            guide_version_id=new_version.id,
            guide_part_id=part.id,
            content=part_content
        )
        db.session.add(part_version)
    
    db.session.commit()
    return jsonify(new_version.to_dict()), 201


@guide_routes.route('/<int:guide_id>/versions/<int:version_id>', methods=['GET'])
def get_guide_version(guide_id, version_id):
    """Get a specific version of a guide."""
    version = GuideVersion.query.get_or_404(version_id)
    
    # Ensure version belongs to the specified guide
    if version.guide_id != guide_id:
        return jsonify({'error': 'Version does not belong to the specified guide'}), 400
    
    return jsonify(version.to_dict())
