from . import db

class ActivitySharing(db.Model):
    __tablename__ = 'ActivitySharing'
    
    id = db.Column(db.Integer, primary_key=True)
    user_activity_id = db.Column(db.Integer, db.ForeignKey('Useractivities.id'))
    shared_with_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    feedback = db.Column(db.Text)
    
    # Relationships
    user_activity = db.relationship('UserActivity', back_populates='sharings')
    shared_with = db.relationship('User', foreign_keys=[shared_with_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_activity_id': self.user_activity_id,
            'shared_with_id': self.shared_with_id,
            'feedback': self.feedback
        }


class PlaylistSharing(db.Model):
    __tablename__ = 'PlaylistSharing'
    
    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('Playlists.id'))
    shared_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    shared_with_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    feedback = db.Column(db.Text)
    
    # Relationships
    playlist = db.relationship('Playlist', back_populates='sharings')
    shared_by = db.relationship('User', foreign_keys=[shared_by_id])
    shared_with = db.relationship('User', foreign_keys=[shared_with_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'playlist_id': self.playlist_id,
            'shared_by_id': self.shared_by_id,
            'shared_with_id': self.shared_with_id,
            'feedback': self.feedback
        }
