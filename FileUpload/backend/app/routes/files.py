import os
import mimetypes
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from sqlalchemy.orm import joinedload
from .. import db, minio_client
from ..models import File, Group, GroupMembership, User, Activity
from io import BytesIO
from datetime import datetime

files_bp = Blueprint('files', __name__)

@files_bp.route('/<int:group_id>/upload', methods=['POST'])
@jwt_required()
def upload_file(group_id):
    user_id = get_jwt_identity()
    
    # Check if user is a group member
    if not GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'msg': 'Not a group member'}), 403
    
    if 'file' not in request.files:
        return jsonify({'msg': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'No file selected'}), 400
    
    # Secure the filename and create unique name
    original_filename = secure_filename(file.filename)
    file_extension = os.path.splitext(original_filename)[1]
    unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id}_{original_filename}"
    
    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(original_filename)
    
    # Upload to MinIO
    minio_key = f"group_{group_id}/{unique_filename}"
    
    try:
        # Get file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        minio_client.put_object(
            os.getenv('MINIO_BUCKET'),
            minio_key,
            file,
            length=file_size,
            part_size=10*1024*1024
        )
        
        # Save to database
        db_file = File(
            filename=unique_filename,
            original_filename=original_filename,
            minio_key=minio_key,
            file_size=file_size,
            mime_type=mime_type,
            group_id=group_id,
            uploader_id=user_id
        )
        db.session.add(db_file)
        
        # Log activity
        activity = Activity(
            user_id=user_id,
            group_id=group_id,
            file_id=db_file.id,
            activity_type='upload',
            description=f'Uploaded "{original_filename}"',
            activity_data={'file_size': file_size, 'mime_type': mime_type}
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({
            'msg': 'File uploaded successfully',
            'file_id': db_file.id,
            'filename': original_filename,
            'file_size': file_size
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Upload failed: {str(e)}'}), 500

@files_bp.route('/<int:group_id>/list', methods=['GET'])
@jwt_required()
def list_files(group_id):
    user_id = get_jwt_identity()
    
    # Check if user is a group member
    if not GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'msg': 'Not a group member'}), 403
    
    files = File.query.filter_by(group_id=group_id, is_deleted=False).options(
        joinedload(File.uploader)
    ).order_by(File.uploaded_at.desc()).all()
    
    file_list = []
    for file in files:
        file_list.append({
            'id': file.id,
            'filename': file.original_filename,
            'file_size': file.file_size,
            'mime_type': file.mime_type,
            'uploaded_at': file.uploaded_at.isoformat(),
            'uploader': {
                'id': file.uploader.id,
                'username': file.uploader.username
            } if file.uploader else None
        })
    
    return jsonify(file_list)

@files_bp.route('/<int:group_id>/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(group_id, file_id):
    user_id = get_jwt_identity()
    
    # Check if user is a group member
    if not GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'msg': 'Not a group member'}), 403
    
    db_file = File.query.get(file_id)
    if not db_file or db_file.group_id != group_id or db_file.is_deleted:
        return jsonify({'msg': 'File not found'}), 404
    
    try:
        # Get file from MinIO
        response = minio_client.get_object(os.getenv('MINIO_BUCKET'), db_file.minio_key)
        
        # Log download activity
        activity = Activity(
            user_id=user_id,
            group_id=group_id,
            file_id=file_id,
            activity_type='download',
            description=f'Downloaded "{db_file.original_filename}"'
        )
        db.session.add(activity)
        db.session.commit()
        
        return send_file(
            BytesIO(response.read()),
            download_name=db_file.original_filename,
            as_attachment=True,
            mimetype=db_file.mime_type
        )
        
    except Exception as e:
        return jsonify({'msg': f'Download failed: {str(e)}'}), 500

@files_bp.route('/<int:group_id>/delete/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(group_id, file_id):
    user_id = get_jwt_identity()
    
    # Check if user is a group member
    membership = GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not membership:
        return jsonify({'msg': 'Not a group member'}), 403
    
    db_file = File.query.get(file_id)
    if not db_file or db_file.group_id != group_id or db_file.is_deleted:
        return jsonify({'msg': 'File not found'}), 404
    
    # Check if user can delete (uploader, admin, or owner)
    can_delete = (db_file.uploader_id == user_id or 
                  membership.role in ['admin', 'owner'])
    
    if not can_delete:
        return jsonify({'msg': 'Insufficient permissions to delete this file'}), 403
    
    try:
        # Mark as deleted (soft delete)
        db_file.is_deleted = True
        db_file.deleted_at = datetime.utcnow()
        
        # Log activity
        activity = Activity(
            user_id=user_id,
            group_id=group_id,
            file_id=file_id,
            activity_type='delete',
            description=f'Deleted "{db_file.original_filename}"'
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({'msg': 'File deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Delete failed: {str(e)}'}), 500

@files_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_file_stats():
    user_id = get_jwt_identity()
    
    # Get user's groups
    memberships = GroupMembership.query.filter_by(user_id=user_id).all()
    group_ids = [m.group_id for m in memberships]
    
    if not group_ids:
        return jsonify({
            'total_files': 0,
            'total_size': 0,
            'files_by_group': {}
        })
    
    # Get file statistics
    files = File.query.filter(
        File.group_id.in_(group_ids),
        File.is_deleted == False
    ).all()
    
    total_files = len(files)
    total_size = sum(f.file_size for f in files)
    
    # Group files by group
    files_by_group = {}
    for file in files:
        if file.group_id not in files_by_group:
            files_by_group[file.group_id] = {
                'count': 0,
                'size': 0
            }
        files_by_group[file.group_id]['count'] += 1
        files_by_group[file.group_id]['size'] += file.file_size
    
    return jsonify({
        'total_files': total_files,
        'total_size': total_size,
        'files_by_group': files_by_group
    })

@files_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    user_id = get_jwt_identity()
    
    # Get user's groups
    memberships = GroupMembership.query.filter_by(user_id=user_id).all()
    group_ids = [m.group_id for m in memberships]
    
    if not group_ids:
        return jsonify([])
    
    # Get recent activities
    activities = Activity.query.filter(
        Activity.group_id.in_(group_ids)
    ).options(
        joinedload(Activity.user)
    ).order_by(Activity.timestamp.desc()).limit(20).all()
    
    activity_list = []
    for activity in activities:
        activity_list.append({
            'id': activity.id,
            'type': activity.activity_type,
            'description': activity.description,
            'timestamp': activity.timestamp.isoformat(),
            'user': {
                'id': activity.user.id,
                'username': activity.user.username
            } if activity.user else None,
            'metadata': activity.activity_data
        })
    
    return jsonify(activity_list) 