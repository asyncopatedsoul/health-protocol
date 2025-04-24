from flask import Blueprint, jsonify, request
from ..models import db, Playlist, PlaylistItem, PlaylistPerformance, User, Activity, PlaylistSharing
from datetime import datetime

playlist_routes = Blueprint('playlist_routes', __name__)


@playlist_routes.route('/', methods=['GET'])
def get_playlists():
    """Get all playlists with optional filtering by user."""
    user_id = request.args.get('user_id')
    
    query = Playlist.query
    
    # Filter by user if provided
    if user_id:
        try:
            user_id = int(user_id)
            query = query.filter(Playlist.user_id == user_id)
        except ValueError:
            pass  # Ignore invalid user_id
    
    playlists = query.all()
    return jsonify([playlist.to_dict() for playlist in playlists])


@playlist_routes.route('/<int:playlist_id>', methods=['GET'])
def get_playlist(playlist_id):
    """Get a specific playlist by ID."""
    playlist = Playlist.query.get_or_404(playlist_id)
    return jsonify(playlist.to_dict())


@playlist_routes.route('/', methods=['POST'])
def create_playlist():
    """Create a new playlist."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Verify user exists
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Create new playlist
    new_playlist = Playlist(
        user_id=data['user_id'],
        name=data['name'],
        description=data.get('description')
    )
    
    db.session.add(new_playlist)
    db.session.flush()  # Get the ID before committing
    
    # Handle playlist items if provided
    if 'items' in data and isinstance(data['items'], list):
        for i, item_data in enumerate(data['items']):
            if 'activity_id' in item_data:
                # Verify activity exists
                activity = Activity.query.get(item_data['activity_id'])
                if not activity:
                    continue  # Skip invalid activity
                
                item = PlaylistItem(
                    playlist_id=new_playlist.id,
                    activity_id=item_data['activity_id'],
                    order=item_data.get('order', i)  # Use provided order or index as default
                )
                db.session.add(item)
    
    db.session.commit()
    return jsonify(new_playlist.to_dict()), 201


@playlist_routes.route('/<int:playlist_id>', methods=['PUT'])
def update_playlist(playlist_id):
    """Update an existing playlist."""
    playlist = Playlist.query.get_or_404(playlist_id)
    data = request.get_json()
    
    # Update playlist fields
    if 'name' in data:
        playlist.name = data['name']
    if 'description' in data:
        playlist.description = data['description']
    
    db.session.commit()
    return jsonify(playlist.to_dict())


@playlist_routes.route('/<int:playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    """Delete a playlist."""
    playlist = Playlist.query.get_or_404(playlist_id)
    
    # Delete all associated items, performances, and sharings
    PlaylistItem.query.filter_by(playlist_id=playlist_id).delete()
    PlaylistPerformance.query.filter_by(playlist_id=playlist_id).delete()
    PlaylistSharing.query.filter_by(playlist_id=playlist_id).delete()
    
    # Delete playlist
    db.session.delete(playlist)
    db.session.commit()
    
    return jsonify({'message': 'Playlist deleted successfully'})


@playlist_routes.route('/<int:playlist_id>/items', methods=['GET'])
def get_playlist_items(playlist_id):
    """Get all items for a playlist."""
    Playlist.query.get_or_404(playlist_id)  # Verify playlist exists
    
    items = PlaylistItem.query.filter_by(playlist_id=playlist_id).order_by(PlaylistItem.order).all()
    return jsonify([item.to_dict() for item in items])


@playlist_routes.route('/<int:playlist_id>/items', methods=['POST'])
def add_playlist_item(playlist_id):
    """Add a new item to a playlist."""
    playlist = Playlist.query.get_or_404(playlist_id)
    data = request.get_json()
    
    # Validate required fields
    if 'activity_id' not in data:
        return jsonify({'error': 'Activity ID is required'}), 400
    
    # Verify activity exists
    activity = Activity.query.get(data['activity_id'])
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404
    
    # Get max order value to append at the end by default
    max_order = db.session.query(db.func.max(PlaylistItem.order)).filter(PlaylistItem.playlist_id == playlist_id).scalar() or -1
    
    # Create new item
    new_item = PlaylistItem(
        playlist_id=playlist_id,
        activity_id=data['activity_id'],
        order=data.get('order', max_order + 1)
    )
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify(new_item.to_dict()), 201


@playlist_routes.route('/<int:playlist_id>/items/<int:item_id>', methods=['PUT'])
def update_playlist_item(playlist_id, item_id):
    """Update a playlist item."""
    item = PlaylistItem.query.get_or_404(item_id)
    
    # Ensure item belongs to the specified playlist
    if item.playlist_id != playlist_id:
        return jsonify({'error': 'Item does not belong to the specified playlist'}), 400
    
    data = request.get_json()
    
    # Update order if provided
    if 'order' in data:
        item.order = data['order']
    
    # Update activity if provided
    if 'activity_id' in data:
        # Verify activity exists
        activity = Activity.query.get(data['activity_id'])
        if not activity:
            return jsonify({'error': 'Activity not found'}), 404
        
        item.activity_id = data['activity_id']
    
    db.session.commit()
    return jsonify(item.to_dict())


@playlist_routes.route('/<int:playlist_id>/items/<int:item_id>', methods=['DELETE'])
def delete_playlist_item(playlist_id, item_id):
    """Delete a playlist item."""
    item = PlaylistItem.query.get_or_404(item_id)
    
    # Ensure item belongs to the specified playlist
    if item.playlist_id != playlist_id:
        return jsonify({'error': 'Item does not belong to the specified playlist'}), 400
    
    # Delete item
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': 'Playlist item deleted successfully'})


@playlist_routes.route('/<int:playlist_id>/performances', methods=['GET'])
def get_playlist_performances(playlist_id):
    """Get all performances for a playlist."""
    Playlist.query.get_or_404(playlist_id)  # Verify playlist exists
    
    performances = PlaylistPerformance.query.filter_by(playlist_id=playlist_id).order_by(PlaylistPerformance.performed_at.desc()).all()
    return jsonify([performance.to_dict() for performance in performances])


@playlist_routes.route('/<int:playlist_id>/performances', methods=['POST'])
def record_playlist_performance(playlist_id):
    """Record a playlist performance."""
    playlist = Playlist.query.get_or_404(playlist_id)
    data = request.get_json()
    
    # Validate required fields
    if 'user_id' not in data:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Verify user exists
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Create new performance
    new_performance = PlaylistPerformance(
        user_id=data['user_id'],
        playlist_id=playlist_id,
        performed_at=datetime.utcnow()
    )
    
    # Handle performance data if provided
    if 'performance_data' in data:
        new_performance.set_performance_data(data['performance_data'])
    
    db.session.add(new_performance)
    db.session.commit()
    
    return jsonify(new_performance.to_dict()), 201


@playlist_routes.route('/<int:playlist_id>/share', methods=['POST'])
def share_playlist(playlist_id):
    """Share a playlist with another user."""
    playlist = Playlist.query.get_or_404(playlist_id)
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['shared_by_id', 'shared_with_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Verify users exist
    shared_by = User.query.get(data['shared_by_id'])
    if not shared_by:
        return jsonify({'error': 'Sharing user not found'}), 404
    
    shared_with = User.query.get(data['shared_with_id'])
    if not shared_with:
        return jsonify({'error': 'Recipient user not found'}), 404
    
    # Create new sharing
    new_sharing = PlaylistSharing(
        playlist_id=playlist_id,
        shared_by_id=data['shared_by_id'],
        shared_with_id=data['shared_with_id'],
        feedback=data.get('feedback')
    )
    
    db.session.add(new_sharing)
    db.session.commit()
    
    return jsonify(new_sharing.to_dict()), 201
