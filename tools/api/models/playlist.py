from . import db
import json
from datetime import datetime

class Playlist(db.Model):
    __tablename__ = 'Playlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('User', back_populates='playlists')
    items = db.relationship('PlaylistItem', back_populates='playlist', order_by='PlaylistItem.order')
    performances = db.relationship('PlaylistPerformance', back_populates='playlist')
    sharings = db.relationship('PlaylistSharing', back_populates='playlist')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'items': [item.to_dict() for item in self.items]
        }


class PlaylistItem(db.Model):
    __tablename__ = 'PlaylistItems'
    
    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('Playlists.id'))
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    order = db.Column(db.Integer)
    
    # Relationships
    playlist = db.relationship('Playlist', back_populates='items')
    activity = db.relationship('Activity', back_populates='playlist_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'playlist_id': self.playlist_id,
            'activity_id': self.activity_id,
            'order': self.order,
            'activity': self.activity.to_dict() if self.activity else None
        }


class PlaylistPerformance(db.Model):
    __tablename__ = 'PlaylistPerformance'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    playlist_id = db.Column(db.Integer, db.ForeignKey('Playlists.id'))
    performed_at = db.Column(db.DateTime, default=datetime.utcnow)
    performance_data = db.Column(db.Text)  # JSON data
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    playlist = db.relationship('Playlist', back_populates='performances')
    
    def get_performance_data(self):
        if self.performance_data:
            return json.loads(self.performance_data)
        return {}
    
    def set_performance_data(self, data):
        self.performance_data = json.dumps(data)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'playlist_id': self.playlist_id,
            'performed_at': self.performed_at.isoformat() if self.performed_at else None,
            'performance_data': self.get_performance_data()
        }
