from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from .. import db
from ..models import User, Activity
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data.get('username') or not data.get('password'):
        return jsonify({'msg': 'Missing username or password'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'msg': 'Username already exists'}), 409
    
    if data.get('email') and User.query.filter_by(email=data['email']).first():
        return jsonify({'msg': 'Email already exists'}), 409
    
    user = User(
        username=data['username'],
        email=data.get('email'),
        password_hash=generate_password_hash(data['password']),
        created_at=datetime.utcnow()
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'msg': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data.get('username') or not data.get('password'):
        return jsonify({'msg': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'msg': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'msg': 'Account is deactivated'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create access token with longer expiration
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(days=7)
    )
    
    return jsonify({
        'access_token': access_token,
        'user_id': user.id,
        'username': user.username,
        'email': user.email
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    # Convert string user_id to int for database query
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'created_at': user.created_at.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'is_active': user.is_active
    })

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    # Convert string user_id to int for database query
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    
    data = request.json
    
    # Update basic info
    if data.get('username') and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'msg': 'Username already exists'}), 409
        user.username = data['username']
    
    if data.get('email') and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'msg': 'Email already exists'}), 409
        user.email = data['email']
    
    # Update password if provided
    if data.get('new_password'):
        if not data.get('current_password'):
            return jsonify({'msg': 'Current password is required'}), 400
        
        if not check_password_hash(user.password_hash, data['current_password']):
            return jsonify({'msg': 'Current password is incorrect'}), 400
        
        user.password_hash = generate_password_hash(data['new_password'])
    
    try:
        db.session.commit()
        return jsonify({'msg': 'Profile updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to update profile'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    # Convert string user_id to int for database query
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    
    data = request.json
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'msg': 'Current and new password are required'}), 400
    
    if not check_password_hash(user.password_hash, data['current_password']):
        return jsonify({'msg': 'Current password is incorrect'}), 400
    
    user.password_hash = generate_password_hash(data['new_password'])
    
    try:
        db.session.commit()
        return jsonify({'msg': 'Password changed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to change password'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a real application, you might want to blacklist the token
    # For now, we'll just return a success message
    return jsonify({'msg': 'Logged out successfully'}), 200 