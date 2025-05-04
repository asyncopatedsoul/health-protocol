from . import db

class BodyArea(db.Model):
    __tablename__ = 'BodyAreas'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    
    # Relationships
    activity_areas = db.relationship('ActivityBodyArea', back_populates='body_area')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }


class ActivityBodyArea(db.Model):
    __tablename__ = 'ActivityBodyAreas'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'))
    body_area_id = db.Column(db.Integer, db.ForeignKey('BodyAreas.id'))
    
    # Relationships
    activity = db.relationship('Activity', back_populates='body_areas')
    body_area = db.relationship('BodyArea', back_populates='activity_areas')
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'body_area_id': self.body_area_id,
            'body_area_name': self.body_area.name if self.body_area else None
        }
