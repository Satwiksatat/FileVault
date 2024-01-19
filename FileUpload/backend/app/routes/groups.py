from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from .. import db
from ..models import User, Group, GroupMembership, Activity
from datetime import datetime

groups_bp = Blueprint('groups', __name__)

@groups_bp.route('/', methods=['POST'])
@jwt_required()
def create_group():
    data = request.json
    if not data.get('name'):
        return jsonify({'msg': 'Missing group name'}), 400
    
    if Group.query.filter_by(name=data['name']).first():
        return jsonify({'msg': 'Group already exists'}), 409
    
    user_id = get_jwt_identity()
    
    group = Group(
        name=data['name'],
        description=data.get('description', ''),
        created_by=user_id
    )
    db.session.add(group)
    db.session.commit()
    
    # Add creator as owner
    membership = GroupMembership(
        user_id=user_id, 
        group_id=group.id,
        role='owner'
    )
    db.session.add(membership)
    
    # Log activity
    activity = Activity(
        user_id=user_id,
        group_id=group.id,
        activity_type='group_created',
        description=f'Created group "{group.name}"'
    )
    db.session.add(activity)
    
    db.session.commit()
    
    return jsonify({
        'msg': 'Group created', 
        'group_id': group.id,
        'group': {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'created_at': group.created_at.isoformat()
        }
    }), 201

@groups_bp.route('/my', methods=['GET'])
@jwt_required()
def my_groups():
    user_id = get_jwt_identity()
    memberships = GroupMembership.query.filter_by(user_id=user_id).options(
        joinedload(GroupMembership.group).joinedload(Group.memberships).joinedload(GroupMembership.user),
        joinedload(GroupMembership.group).joinedload(Group.files)
    ).all()
    
    groups = []
    for membership in memberships:
        group = membership.group
        member_count = len(group.memberships)
        file_count = len([f for f in group.files if not f.is_deleted])
        
        # Get member details for display
        members = []
        for member_membership in group.memberships[:5]:  # Limit to 5 members for display
            members.append({
                'id': member_membership.user.id,
                'username': member_membership.user.username,
                'role': member_membership.role
            })
        
        groups.append({
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'created_at': group.created_at.isoformat(),
            'member_count': member_count,
            'file_count': file_count,
            'role': membership.role,
            'members': members
        })
    
    return jsonify(groups)

@groups_bp.route('/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group(group_id):
    user_id = get_jwt_identity()
    membership = GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first()
    
    if not membership:
        return jsonify({'msg': 'Not a group member'}), 403
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'msg': 'Group not found'}), 404
    
    # Get all members with details
    members = []
    for member_membership in group.memberships:
        members.append({
            'id': member_membership.user.id,
            'username': member_membership.user.username,
            'role': member_membership.role,
            'joined_at': member_membership.joined_at.isoformat()
        })
    
    return jsonify({
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'created_at': group.created_at.isoformat(),
        'members': members,
        'your_role': membership.role
    })

@groups_bp.route('/<int:group_id>/add_user', methods=['POST'])
@jwt_required()
def add_user(group_id):
    user_id = get_jwt_identity()
    data = request.json
    
    # Check if user is admin or owner
    membership = GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not membership or membership.role not in ['admin', 'owner']:
        return jsonify({'msg': 'Insufficient permissions'}), 403
    
    if not data.get('username'):
        return jsonify({'msg': 'Username is required'}), 400
    
    user_to_add = User.query.filter_by(username=data['username']).first()
    if not user_to_add:
        return jsonify({'msg': 'User not found'}), 404
    
    if GroupMembership.query.filter_by(user_id=user_to_add.id, group_id=group_id).first():
        return jsonify({'msg': 'User already in group'}), 409
    
    new_membership = GroupMembership(
        user_id=user_to_add.id, 
        group_id=group_id,
        role=data.get('role', 'member')
    )
    db.session.add(new_membership)
    
    # Log activity
    activity = Activity(
        user_id=user_id,
        group_id=group_id,
        activity_type='user_joined',
        description=f'Added {user_to_add.username} to group'
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify({'msg': 'User added to group'}), 200

@groups_bp.route('/<int:group_id>/remove_user', methods=['POST'])
@jwt_required()
def remove_user(group_id):
    user_id = get_jwt_identity()
    data = request.json
    
    # Check if user is admin or owner
    membership = GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not membership or membership.role not in ['admin', 'owner']:
        return jsonify({'msg': 'Insufficient permissions'}), 403
    
    if not data.get('username'):
        return jsonify({'msg': 'Username is required'}), 400
    
    user_to_remove = User.query.filter_by(username=data['username']).first()
    if not user_to_remove:
        return jsonify({'msg': 'User not found'}), 404
    
    member_membership = GroupMembership.query.filter_by(user_id=user_to_remove.id, group_id=group_id).first()
    if not member_membership:
        return jsonify({'msg': 'User not in group'}), 404
    
    # Prevent removing the last owner
    if member_membership.role == 'owner':
        owner_count = GroupMembership.query.filter_by(group_id=group_id, role='owner').count()
        if owner_count <= 1:
            return jsonify({'msg': 'Cannot remove the last owner'}), 400
    
    db.session.delete(member_membership)
    
    # Log activity
    activity = Activity(
        user_id=user_id,
        group_id=group_id,
        activity_type='user_removed',
        description=f'Removed {user_to_remove.username} from group'
    )
    db.session.add(activity)
    
    db.session.commit()
    return jsonify({'msg': 'User removed from group'}), 200

@groups_bp.route('/<int:group_id>', methods=['DELETE'])
@jwt_required()
def delete_group(group_id):
    user_id = get_jwt_identity()
    
    # Check if user is owner
    membership = GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not membership or membership.role != 'owner':
        return jsonify({'msg': 'Only group owners can delete groups'}), 403
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'msg': 'Group not found'}), 404
    
    # Delete all memberships
    GroupMembership.query.filter_by(group_id=group_id).delete()
    
    # Mark all files as deleted
    from ..models import File
    files = File.query.filter_by(group_id=group_id).all()
    for file in files:
        file.is_deleted = True
        file.deleted_at = datetime.utcnow()
    
    # Delete the group
    db.session.delete(group)
    db.session.commit()
    
    return jsonify({'msg': 'Group deleted'}), 200 