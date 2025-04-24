from . import db
from datetime import datetime

class Guide(db.Model):
    __tablename__ = 'Guides'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    parts = db.relationship('GuidePart', back_populates='guide')
    versions = db.relationship('GuideVersion', back_populates='guide')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parts': [part.to_dict() for part in self.parts],
            'versions': [version.to_dict() for version in self.versions]
        }


class GuidePart(db.Model):
    __tablename__ = 'GuideParts'
    
    id = db.Column(db.Integer, primary_key=True)
    guide_id = db.Column(db.Integer, db.ForeignKey('Guides.id'))
    title = db.Column(db.String, nullable=False)
    content = db.Column(db.Text)
    order = db.Column(db.Integer)
    
    # Relationships
    guide = db.relationship('Guide', back_populates='parts')
    versions = db.relationship('GuidePartVersion', back_populates='guide_part')
    
    def to_dict(self):
        return {
            'id': self.id,
            'guide_id': self.guide_id,
            'title': self.title,
            'content': self.content,
            'order': self.order
        }


class GuideVersion(db.Model):
    __tablename__ = 'GuideVersions'
    
    id = db.Column(db.Integer, primary_key=True)
    guide_id = db.Column(db.Integer, db.ForeignKey('Guides.id'))
    version_number = db.Column(db.Integer)
    release_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    guide = db.relationship('Guide', back_populates='versions')
    part_versions = db.relationship('GuidePartVersion', back_populates='guide_version')
    
    def to_dict(self):
        return {
            'id': self.id,
            'guide_id': self.guide_id,
            'version_number': self.version_number,
            'release_notes': self.release_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'part_versions': [pv.to_dict() for pv in self.part_versions]
        }


class GuidePartVersion(db.Model):
    __tablename__ = 'GuidePartVersions'
    
    id = db.Column(db.Integer, primary_key=True)
    guide_version_id = db.Column(db.Integer, db.ForeignKey('GuideVersions.id'))
    guide_part_id = db.Column(db.Integer, db.ForeignKey('GuideParts.id'))
    content = db.Column(db.Text)
    
    # Relationships
    guide_version = db.relationship('GuideVersion', back_populates='part_versions')
    guide_part = db.relationship('GuidePart', back_populates='versions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'guide_version_id': self.guide_version_id,
            'guide_part_id': self.guide_part_id,
            'content': self.content
        }
