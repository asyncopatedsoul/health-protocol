from . import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    username = db.Column(db.String, nullable=False, unique=True)
    email = db.Column(db.String)
    
    # Relationships
    activities = db.relationship('UserActivity', back_populates='user')
    skill_progress = db.relationship('UserSkillProgress', back_populates='user')
    playlists = db.relationship('Playlist', back_populates='user')
    activity_history = db.relationship('ActivityHistory', back_populates='user')
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'username': self.username,
            'email': self.email
        }
