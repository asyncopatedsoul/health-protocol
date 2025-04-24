from . import db

class Protocol(db.Model):
    __tablename__ = 'protocols'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    source_code = db.Column(db.Text)
    description = db.Column(db.Text)
    
    # Relationships
    activity_protocols = db.relationship('ActivityProtocol', back_populates='protocol')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'source_code': self.source_code,
            'description': self.description
        }
