from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User, Group, GroupMembership

groups_bp = Blueprint('groups', __name__)

@groups_bp.route('/', methods=['POST'])
@jwt_required()
def create_group():
    data = request.json
    if not data.get('name'):
        return jsonify({'msg': 'Missing group name'}), 400
    if Group.query.filter_by(name=data['name']).first():
        return jsonify({'msg': 'Group already exists'}), 409
    group = Group(name=data['name'])
    db.session.add(group)
    db.session.commit()
    # Add creator as member
    membership = GroupMembership(user_id=get_jwt_identity(), group_id=group.id)
    db.session.add(membership)
    db.session.commit()
    return jsonify({'msg': 'Group created', 'group_id': group.id}), 201

@groups_bp.route('/my', methods=['GET'])
@jwt_required()
def my_groups():
    user_id = get_jwt_identity()
    memberships = GroupMembership.query.filter_by(user_id=user_id).all()
    groups = [{'id': m.group.id, 'name': m.group.name} for m in memberships]
    return jsonify(groups)

@groups_bp.route('/<int:group_id>/add_user', methods=['POST'])
@jwt_required()
def add_user(group_id):
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    if GroupMembership.query.filter_by(user_id=user.id, group_id=group_id).first():
        return jsonify({'msg': 'User already in group'}), 409
    db.session.add(GroupMembership(user_id=user.id, group_id=group_id))
    db.session.commit()
    return jsonify({'msg': 'User added to group'}), 200

@groups_bp.route('/<int:group_id>/remove_user', methods=['POST'])
@jwt_required()
def remove_user(group_id):
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    membership = GroupMembership.query.filter_by(user_id=user.id, group_id=group_id).first()
    if not membership:
        return jsonify({'msg': 'User not in group'}), 404
    db.session.delete(membership)
    db.session.commit()
    return jsonify({'msg': 'User removed from group'}), 200 