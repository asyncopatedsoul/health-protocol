from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .protocol import Protocol
from .activity import Activity, DifficultyLevel, ActivityRelationship, ActivityBodyArea, ActivityMedia, UserActivity
from .body_area import BodyArea
from .tag import Tag, ActivityTag
from .guide import Guide, GuidePart, GuideVersion, GuidePartVersion
from .playlist import Playlist, PlaylistItem, PlaylistPerformance
from .sharing import ActivitySharing, PlaylistSharing
from .skill import SkillCategory, ActivitySkill, SkillPrerequisite, UserSkillProgress
from .activity_protocol import ActivityProtocol, ActivityHistory
