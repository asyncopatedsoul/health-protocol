from flask import Blueprint, jsonify, request
from ..models import db, SkillCategory, ActivitySkill, SkillPrerequisite, UserSkillProgress, User, Activity

skill_routes = Blueprint('skill_routes', __name__)


@skill_routes.route('/categories', methods=['GET'])
def get_skill_categories():
    """Get all skill categories."""
    categories = SkillCategory.query.all()
    return jsonify([category.to_dict() for category in categories])


@skill_routes.route('/categories/<int:category_id>', methods=['GET'])
def get_skill_category(category_id):
    """Get a specific skill category by ID."""
    category = SkillCategory.query.get_or_404(category_id)
    return jsonify(category.to_dict())


@skill_routes.route('/categories', methods=['POST'])
def create_skill_category():
    """Create a new skill category."""
    data = request.get_json()
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    # Create new category
    new_category = SkillCategory(
        name=data['name'],
        description=data.get('description'),
        color=data.get('color')
    )
    
    db.session.add(new_category)
    db.session.commit()
    
    return jsonify(new_category.to_dict()), 201


@skill_routes.route('/categories/<int:category_id>', methods=['PUT'])
def update_skill_category(category_id):
    """Update an existing skill category."""
    category = SkillCategory.query.get_or_404(category_id)
    data = request.get_json()
    
    # Update category fields
    if 'name' in data:
        category.name = data['name']
    if 'description' in data:
        category.description = data['description']
    if 'color' in data:
        category.color = data['color']
    
    db.session.commit()
    return jsonify(category.to_dict())


@skill_routes.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_skill_category(category_id):
    """Delete a skill category."""
    category = SkillCategory.query.get_or_404(category_id)
    
    # Check if category is used in skills
    skills = ActivitySkill.query.filter_by(category_id=category_id).first()
    if skills:
        return jsonify({'error': 'Cannot delete category that is in use'}), 400
    
    # Delete category
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Skill category deleted successfully'})


@skill_routes.route('/', methods=['GET'])
def get_skills():
    """Get all skills with optional filtering."""
    activity_id = request.args.get('activity_id')
    category_id = request.args.get('category_id')
    
    query = ActivitySkill.query
    
    # Apply filters if provided
    if activity_id:
        try:
            activity_id = int(activity_id)
            query = query.filter(ActivitySkill.activity_id == activity_id)
        except ValueError:
            pass  # Ignore invalid activity_id
    
    if category_id:
        try:
            category_id = int(category_id)
            query = query.filter(ActivitySkill.category_id == category_id)
        except ValueError:
            pass  # Ignore invalid category_id
    
    skills = query.all()
    return jsonify([skill.to_dict() for skill in skills])


@skill_routes.route('/<int:skill_id>', methods=['GET'])
def get_skill(skill_id):
    """Get a specific skill by ID."""
    skill = ActivitySkill.query.get_or_404(skill_id)
    return jsonify(skill.to_dict())


@skill_routes.route('/', methods=['POST'])
def create_skill():
    """Create a new skill."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['activity_id', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Verify activity exists
    activity = Activity.query.get(data['activity_id'])
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404
    
    # Create new skill
    new_skill = ActivitySkill(
        activity_id=data['activity_id'],
        name=data['name'],
        description=data.get('description'),
        difficulty=data.get('difficulty', 1),
        category_id=data.get('category_id')
    )
    
    db.session.add(new_skill)
    db.session.flush()  # Get the ID before committing
    
    # Handle prerequisites if provided
    if 'prerequisites' in data and isinstance(data['prerequisites'], list):
        for prereq_data in data['prerequisites']:
            if 'prerequisite_skill_id' in prereq_data:
                prereq = SkillPrerequisite(
                    skill_id=new_skill.id,
                    prerequisite_skill_id=prereq_data['prerequisite_skill_id'],
                    required_mastery_level=prereq_data.get('required_mastery_level', 0.6)
                )
                db.session.add(prereq)
    
    db.session.commit()
    return jsonify(new_skill.to_dict()), 201


@skill_routes.route('/<int:skill_id>', methods=['PUT'])
def update_skill(skill_id):
    """Update an existing skill."""
    skill = ActivitySkill.query.get_or_404(skill_id)
    data = request.get_json()
    
    # Update skill fields
    if 'name' in data:
        skill.name = data['name']
    if 'description' in data:
        skill.description = data['description']
    if 'difficulty' in data:
        skill.difficulty = data['difficulty']
    if 'category_id' in data:
        skill.category_id = data['category_id']
    
    db.session.commit()
    return jsonify(skill.to_dict())


@skill_routes.route('/<int:skill_id>', methods=['DELETE'])
def delete_skill(skill_id):
    """Delete a skill."""
    skill = ActivitySkill.query.get_or_404(skill_id)
    
    # Delete prerequisites
    SkillPrerequisite.query.filter_by(skill_id=skill_id).delete()
    SkillPrerequisite.query.filter_by(prerequisite_skill_id=skill_id).delete()
    
    # Delete user progress
    UserSkillProgress.query.filter_by(skill_id=skill_id).delete()
    
    # Delete skill
    db.session.delete(skill)
    db.session.commit()
    
    return jsonify({'message': 'Skill deleted successfully'})


@skill_routes.route('/<int:skill_id>/prerequisites', methods=['GET'])
def get_skill_prerequisites(skill_id):
    """Get all prerequisites for a skill."""
    ActivitySkill.query.get_or_404(skill_id)  # Verify skill exists
    
    prerequisites = SkillPrerequisite.query.filter_by(skill_id=skill_id).all()
    return jsonify([prereq.to_dict() for prereq in prerequisites])


@skill_routes.route('/<int:skill_id>/prerequisites', methods=['POST'])
def add_skill_prerequisite(skill_id):
    """Add a prerequisite to a skill."""
    skill = ActivitySkill.query.get_or_404(skill_id)
    data = request.get_json()
    
    # Validate required fields
    if 'prerequisite_skill_id' not in data:
        return jsonify({'error': 'Prerequisite skill ID is required'}), 400
    
    # Verify prerequisite skill exists
    prereq_skill = ActivitySkill.query.get(data['prerequisite_skill_id'])
    if not prereq_skill:
        return jsonify({'error': 'Prerequisite skill not found'}), 404
    
    # Verify not adding skill as its own prerequisite
    if skill_id == data['prerequisite_skill_id']:
        return jsonify({'error': 'A skill cannot be a prerequisite of itself'}), 400
    
    # Check if prerequisite already exists
    existing_prereq = SkillPrerequisite.query.filter_by(
        skill_id=skill_id,
        prerequisite_skill_id=data['prerequisite_skill_id']
    ).first()
    
    if existing_prereq:
        return jsonify({'error': 'This prerequisite already exists'}), 409
    
    # Create new prerequisite
    new_prereq = SkillPrerequisite(
        skill_id=skill_id,
        prerequisite_skill_id=data['prerequisite_skill_id'],
        required_mastery_level=data.get('required_mastery_level', 0.6)
    )
    
    db.session.add(new_prereq)
    db.session.commit()
    
    return jsonify(new_prereq.to_dict()), 201


@skill_routes.route('/<int:skill_id>/prerequisites/<int:prereq_id>', methods=['PUT'])
def update_skill_prerequisite(skill_id, prereq_id):
    """Update a skill prerequisite."""
    prereq = SkillPrerequisite.query.get_or_404(prereq_id)
    
    # Ensure prerequisite belongs to the specified skill
    if prereq.skill_id != skill_id:
        return jsonify({'error': 'Prerequisite does not belong to the specified skill'}), 400
    
    data = request.get_json()
    
    # Update required mastery level if provided
    if 'required_mastery_level' in data:
        prereq.required_mastery_level = data['required_mastery_level']
    
    db.session.commit()
    return jsonify(prereq.to_dict())


@skill_routes.route('/<int:skill_id>/prerequisites/<int:prereq_id>', methods=['DELETE'])
def delete_skill_prerequisite(skill_id, prereq_id):
    """Delete a skill prerequisite."""
    prereq = SkillPrerequisite.query.get_or_404(prereq_id)
    
    # Ensure prerequisite belongs to the specified skill
    if prereq.skill_id != skill_id:
        return jsonify({'error': 'Prerequisite does not belong to the specified skill'}), 400
    
    # Delete prerequisite
    db.session.delete(prereq)
    db.session.commit()
    
    return jsonify({'message': 'Skill prerequisite deleted successfully'})


@skill_routes.route('/user/<int:user_id>/progress', methods=['GET'])
def get_user_skill_progress(user_id):
    """Get skill progress for a user."""
    User.query.get_or_404(user_id)  # Verify user exists
    
    progress = UserSkillProgress.query.filter_by(user_id=user_id).all()
    return jsonify([p.to_dict() for p in progress])


@skill_routes.route('/user/<int:user_id>/progress/<int:skill_id>', methods=['POST', 'PUT'])
def update_user_skill_progress(user_id, skill_id):
    """Update skill progress for a user."""
    # Verify user and skill exist
    User.query.get_or_404(user_id)
    ActivitySkill.query.get_or_404(skill_id)
    
    data = request.get_json()
    
    # Get existing progress or create new
    progress = UserSkillProgress.query.filter_by(user_id=user_id, skill_id=skill_id).first()
    
    if not progress:
        progress = UserSkillProgress(
            user_id=user_id,
            skill_id=skill_id,
            mastery_level=0,
            total_practice_time_ms=0,
            practice_count=0
        )
        db.session.add(progress)
    
    # Update progress fields
    if 'mastery_level' in data:
        progress.mastery_level = data['mastery_level']
    if 'last_practiced_at' in data:
        progress.last_practiced_at = data['last_practiced_at']
    if 'practice_time_ms' in data:
        # Add to total time
        progress.total_practice_time_ms += data['practice_time_ms']
        progress.practice_count += 1
    
    db.session.commit()
    return jsonify(progress.to_dict())


@skill_routes.route('/user/<int:user_id>/available', methods=['GET'])
def get_user_available_skills(user_id):
    """Get available skills for a user based on prerequisites."""
    User.query.get_or_404(user_id)  # Verify user exists
    
    # Execute raw SQL to use the available_user_skills view
    available_skills = db.session.execute(
        "SELECT * FROM available_user_skills WHERE user_id = :user_id",
        {"user_id": user_id}
    ).fetchall()
    
    result = []
    for skill in available_skills:
        skill_dict = {
            'skill_id': skill.skill_id,
            'skill_name': skill.skill_name,
            'difficulty': skill.difficulty,
            'mastery_level': skill.mastery_level,
            'is_available': skill.is_available == 1
        }
        result.append(skill_dict)
    
    return jsonify(result)
