from . import db

class SkillCategory(db.Model):
    __tablename__ = 'skill_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String)
    
    # Relationships
    skills = db.relationship('ActivitySkill', back_populates='category')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color
        }


class ActivitySkill(db.Model):
    __tablename__ = 'activity_skills'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.Integer, default=1)
    category_id = db.Column(db.Integer, db.ForeignKey('skill_categories.id'))
    
    # Relationships
    activity = db.relationship('Activity', back_populates='skills')
    category = db.relationship('SkillCategory', back_populates='skills')
    prerequisites = db.relationship('SkillPrerequisite', 
                                  foreign_keys='SkillPrerequisite.skill_id', 
                                  back_populates='skill')
    prerequisite_of = db.relationship('SkillPrerequisite', 
                                     foreign_keys='SkillPrerequisite.prerequisite_skill_id', 
                                     back_populates='prerequisite_skill')
    user_progress = db.relationship('UserSkillProgress', back_populates='skill')
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_id': self.activity_id,
            'name': self.name,
            'description': self.description,
            'difficulty': self.difficulty,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'prerequisites': [p.to_dict() for p in self.prerequisites]
        }


class SkillPrerequisite(db.Model):
    __tablename__ = 'skill_prerequisites'
    
    id = db.Column(db.Integer, primary_key=True)
    skill_id = db.Column(db.Integer, db.ForeignKey('activity_skills.id'), nullable=False)
    prerequisite_skill_id = db.Column(db.Integer, db.ForeignKey('activity_skills.id'), nullable=False)
    required_mastery_level = db.Column(db.Float, default=0.6)
    
    # Relationships
    skill = db.relationship('ActivitySkill', foreign_keys=[skill_id], back_populates='prerequisites')
    prerequisite_skill = db.relationship('ActivitySkill', foreign_keys=[prerequisite_skill_id], back_populates='prerequisite_of')
    
    def to_dict(self):
        return {
            'id': self.id,
            'skill_id': self.skill_id,
            'prerequisite_skill_id': self.prerequisite_skill_id,
            'prerequisite_skill_name': self.prerequisite_skill.name if self.prerequisite_skill else None,
            'required_mastery_level': self.required_mastery_level
        }


class UserSkillProgress(db.Model):
    __tablename__ = 'user_skill_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('activity_skills.id'), nullable=False)
    mastery_level = db.Column(db.Float, default=0)
    last_practiced_at = db.Column(db.Integer)
    total_practice_time_ms = db.Column(db.Integer, default=0)
    practice_count = db.Column(db.Integer, default=0)
    
    # Relationships
    user = db.relationship('User', back_populates='skill_progress')
    skill = db.relationship('ActivitySkill', back_populates='user_progress')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'mastery_level': self.mastery_level,
            'last_practiced_at': self.last_practiced_at,
            'total_practice_time_ms': self.total_practice_time_ms,
            'practice_count': self.practice_count
        }
