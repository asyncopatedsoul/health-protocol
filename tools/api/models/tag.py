from . import db

class Tag(db.Model):
    __tablename__ = 'Tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String)
    
    # Relationships
    activity_tags = db.relationship('ActivityTag', back_populates='tag')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': self.type
        }


class ActivityTag(db.Model):
    __tablename__ = 'ActivityTags'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    tag_id = db.Column(db.Integer, db.ForeignKey('Tags.id'))
    
    # Relationships
    activity = db.relationship('Activity', back_populates='tags')
    tag = db.relationship('Tag', back_populates='activity_tags')
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'tag_id': self.tag_id,
            'tag_name': self.tag.name if self.tag else None
        }
