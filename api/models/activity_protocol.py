from . import db
import json

class ActivityProtocol(db.Model):
    __tablename__ = 'activity_protocols'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'), nullable=False)
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocols.id'), nullable=False)
    parameters = db.Column(db.Text)
    created_at = db.Column(db.Integer, nullable=False)
    
    # Relationships
    activity = db.relationship('Activity', back_populates='activity_protocols')
    protocol = db.relationship('Protocol', back_populates='activity_protocols')
    history = db.relationship('ActivityHistory', back_populates='activity_protocol')
    
    def get_parameters(self):
        if self.parameters:
            return json.loads(self.parameters)
        return {}
    
    def set_parameters(self, data):
        self.parameters = json.dumps(data)
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'protocol_id': self.protocol_id,
            'parameters': self.get_parameters(),
            'created_at': self.created_at,
            'activity': self.activity.to_dict() if self.activity else None,
            'protocol': self.protocol.to_dict() if self.protocol else None
        }


class ActivityHistory(db.Model):
    __tablename__ = 'activity_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_protocol_id = db.Column(db.Integer, db.ForeignKey('activity_protocols.id'), nullable=False)
    parameters = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    start_time_ms = db.Column(db.Integer, nullable=False)
    end_time_ms = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String, nullable=False)
    notes = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('User', back_populates='activity_history')
    activity_protocol = db.relationship('ActivityProtocol', back_populates='history')
    
    def get_parameters(self):
        if self.parameters:
            return json.loads(self.parameters)
        return {}
    
    def set_parameters(self, data):
        self.parameters = json.dumps(data)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_protocol_id': self.activity_protocol_id,
            'parameters': self.get_parameters(),
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'start_time_ms': self.start_time_ms,
            'end_time_ms': self.end_time_ms,
            'status': self.status,
            'notes': self.notes,
            'duration_ms': self.end_time_ms - self.start_time_ms if self.end_time_ms and self.start_time_ms else None
        }
