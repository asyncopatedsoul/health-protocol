from . import db
import json
from datetime import datetime

class Activity(db.Model):
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String)
    difficulty_level = db.Column(db.Integer, db.ForeignKey('DifficultyLevels.id'))
    activity_type = db.Column(db.String, default='exercise')
    complexity_level = db.Column(db.Integer, default=1)
    
    # Relationships
    difficulty = db.relationship('DifficultyLevel', back_populates='activities')
    relationships = db.relationship('ActivityRelationship', 
                                  primaryjoin="or_(Activity.id==ActivityRelationship.activity1_id, "
                                           "Activity.id==ActivityRelationship.activity2_id)")
    body_areas = db.relationship('ActivityBodyArea', back_populates='activity')
    media = db.relationship('ActivityMedia', back_populates='activity')
    user_activities = db.relationship('UserActivity', back_populates='activity')
    tags = db.relationship('ActivityTag', back_populates='activity')
    skills = db.relationship('ActivitySkill', back_populates='activity')
    activity_protocols = db.relationship('ActivityProtocol', back_populates='activity')
    playlist_items = db.relationship('PlaylistItem', back_populates='activity')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': self.type,
            'difficulty_level': self.difficulty_level,
            'activity_type': self.activity_type,
            'complexity_level': self.complexity_level,
            'media': [m.to_dict() for m in self.media],
            'body_areas': [ba.body_area.name for ba in self.body_areas],
            'tags': [t.tag.name for t in self.tags]
        }


class DifficultyLevel(db.Model):
    __tablename__ = 'DifficultyLevels'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    activities = db.relationship('Activity', back_populates='difficulty')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }


class ActivityRelationship(db.Model):
    __tablename__ = 'ActivityRelationships'
    
    id = db.Column(db.Integer, primary_key=True)
    activity1_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    activity2_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    relationship_type = db.Column(db.String)
    
    # Relationships
    activity1 = db.relationship('Activity', foreign_keys=[activity1_id])
    activity2 = db.relationship('Activity', foreign_keys=[activity2_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity1_id': self.activity1_id,
            'activity2_id': self.activity2_id,
            'relationship_type': self.relationship_type
        }


class ActivityMedia(db.Model):
    __tablename__ = 'ActivityMedia'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    media_type = db.Column(db.String)
    url = db.Column(db.String)
    
    # Relationships
    activity = db.relationship('Activity', back_populates='media')
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'media_type': self.media_type,
            'url': self.url
        }


class UserActivity(db.Model):
    __tablename__ = 'Useractivities'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    performed_at = db.Column(db.DateTime, default=datetime.utcnow)
    performance_data = db.Column(db.Text)  # JSON data
    
    # Relationships
    user = db.relationship('User', back_populates='activities')
    activity = db.relationship('Activity', back_populates='user_activities')
    sharings = db.relationship('ActivitySharing', back_populates='user_activity')
    
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
            'activity_id': self.activity_id,
            'performed_at': self.performed_at.isoformat() if self.performed_at else None,
            'performance_data': self.get_performance_data()
        }
