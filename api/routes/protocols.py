from flask import Blueprint, jsonify, request
from ..models import db, Protocol, ActivityProtocol

protocol_routes = Blueprint('protocol_routes', __name__)


@protocol_routes.route('/', methods=['GET'])
def get_protocols():
    """Get all protocols."""
    protocols = Protocol.query.all()
    return jsonify([protocol.to_dict() for protocol in protocols])


@protocol_routes.route('/<int:protocol_id>', methods=['GET'])
def get_protocol(protocol_id):
    """Get a specific protocol by ID."""
    protocol = Protocol.query.get_or_404(protocol_id)
    return jsonify(protocol.to_dict())


@protocol_routes.route('/', methods=['POST'])
def create_protocol():
    """Create a new protocol."""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Protocol name is required'}), 400
    
    # Create new protocol
    new_protocol = Protocol(
        name=data['name'],
        source_code=data.get('source_code'),
        description=data.get('description')
    )
    
    db.session.add(new_protocol)
    db.session.commit()
    
    return jsonify(new_protocol.to_dict()), 201


@protocol_routes.route('/<int:protocol_id>', methods=['PUT'])
def update_protocol(protocol_id):
    """Update an existing protocol."""
    protocol = Protocol.query.get_or_404(protocol_id)
    data = request.get_json()
    
    # Update protocol fields
    if 'name' in data:
        protocol.name = data['name']
    if 'source_code' in data:
        protocol.source_code = data['source_code']
    if 'description' in data:
        protocol.description = data['description']
    
    db.session.commit()
    return jsonify(protocol.to_dict())


@protocol_routes.route('/<int:protocol_id>', methods=['DELETE'])
def delete_protocol(protocol_id):
    """Delete a protocol."""
    protocol = Protocol.query.get_or_404(protocol_id)
    
    # Check if protocol is used in activity_protocols
    activity_protocols = ActivityProtocol.query.filter_by(protocol_id=protocol_id).first()
    if activity_protocols:
        return jsonify({'error': 'Cannot delete protocol that is in use'}), 400
    
    # Delete protocol
    db.session.delete(protocol)
    db.session.commit()
    
    return jsonify({'message': 'Protocol deleted successfully'})


@protocol_routes.route('/<int:protocol_id>/activities', methods=['GET'])
def get_protocol_activities(protocol_id):
    """Get all activities using this protocol."""
    Protocol.query.get_or_404(protocol_id)  # Verify protocol exists
    
    activity_protocols = ActivityProtocol.query.filter_by(protocol_id=protocol_id).all()
    
    result = []
    for ap in activity_protocols:
        activity_data = ap.activity.to_dict() if ap.activity else {}
        activity_data['activity_protocol_id'] = ap.id
        activity_data['parameters'] = ap.get_parameters()
        result.append(activity_data)
    
    return jsonify(result)


@protocol_routes.route('/activity-protocols', methods=['POST'])
def create_activity_protocol():
    """Associate an activity with a protocol."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['activity_id', 'protocol_id', 'created_at']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create new activity protocol
    new_ap = ActivityProtocol(
        activity_id=data['activity_id'],
        protocol_id=data['protocol_id'],
        created_at=data['created_at']
    )
    
    # Handle parameters if provided
    if 'parameters' in data:
        new_ap.set_parameters(data['parameters'])
    
    db.session.add(new_ap)
    db.session.commit()
    
    return jsonify(new_ap.to_dict()), 201


@protocol_routes.route('/activity-protocols/<int:ap_id>', methods=['PUT'])
def update_activity_protocol(ap_id):
    """Update an activity protocol association."""
    ap = ActivityProtocol.query.get_or_404(ap_id)
    data = request.get_json()
    
    # Update parameters if provided
    if 'parameters' in data:
        ap.set_parameters(data['parameters'])
    
    db.session.commit()
    return jsonify(ap.to_dict())


@protocol_routes.route('/activity-protocols/<int:ap_id>', methods=['DELETE'])
def delete_activity_protocol(ap_id):
    """Delete an activity protocol association."""
    ap = ActivityProtocol.query.get_or_404(ap_id)
    
    # Check if this activity protocol has history records
    from ..models import ActivityHistory
    history = ActivityHistory.query.filter_by(activity_protocol_id=ap_id).first()
    if history:
        return jsonify({'error': 'Cannot delete activity protocol that has history records'}), 400
    
    # Delete activity protocol
    db.session.delete(ap)
    db.session.commit()
    
    return jsonify({'message': 'Activity protocol deleted successfully'})


@protocol_routes.route('/activity-protocols/<int:ap_id>/history', methods=['GET'])
def get_activity_protocol_history(ap_id):
    """Get history for an activity protocol."""
    ActivityProtocol.query.get_or_404(ap_id)  # Verify activity protocol exists
    
    from ..models import ActivityHistory
    history = ActivityHistory.query.filter_by(activity_protocol_id=ap_id).all()
    return jsonify([h.to_dict() for h in history])


@protocol_routes.route('/activity-history', methods=['POST'])
def create_activity_history():
    """Record activity history."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'activity_protocol_id', 'start_time', 'end_time', 
                      'start_time_ms', 'end_time_ms', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    from ..models import ActivityHistory
    # Create new activity history
    new_history = ActivityHistory(
        user_id=data['user_id'],
        activity_protocol_id=data['activity_protocol_id'],
        start_time=data['start_time'],
        end_time=data['end_time'],
        start_time_ms=data['start_time_ms'],
        end_time_ms=data['end_time_ms'],
        status=data['status'],
        notes=data.get('notes')
    )
    
    # Handle parameters if provided
    if 'parameters' in data:
        new_history.set_parameters(data['parameters'])
    
    db.session.add(new_history)
    db.session.commit()
    
    return jsonify(new_history.to_dict()), 201
